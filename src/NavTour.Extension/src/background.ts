// Background service worker — auto-captures pages on navigation
// All state persisted to chrome.storage.local (MV3 workers can sleep)

type CaptureMode = "auto" | "click" | "manual";

interface CaptureState {
  active: boolean;
  demoId: string;
  demoName: string;
  serverUrl: string;
  frameCount: number;
  capturedUrls: string[]; // Track URLs to avoid duplicates
  captureMode: CaptureMode;
}

const DEFAULT_STATE: CaptureState = {
  active: false,
  demoId: "",
  demoName: "",
  serverUrl: "",
  frameCount: 0,
  capturedUrls: [],
  captureMode: "auto",
};

async function getState(): Promise<CaptureState> {
  const stored = await chrome.storage.local.get(["captureState"]);
  return stored.captureState ?? { ...DEFAULT_STATE };
}

async function setState(state: CaptureState): Promise<void> {
  await chrome.storage.local.set({ captureState: state });
}

chrome.runtime.onInstalled.addListener(() => {
  setState(DEFAULT_STATE);
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_CAPTURE") {
    // State already written by popup — read it and inject toolbar
    getState().then((state) => {
      injectToolbar(state);
      if (state.captureMode === "auto") {
        autoCaptureActiveTab(state);
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "STOP_CAPTURE") {
    getState().then(async (state) => {
      const demoId = state.demoId;
      await setState(DEFAULT_STATE);
      removeToolbarFromAll();

      if (message.openBuilder && demoId) {
        const serverUrl = state.serverUrl || "https://navtour.cloud";
        // Cookie auth — just open the builder, browser sends cookie automatically
        chrome.tabs.create({ url: `${serverUrl}/demos/${demoId}/edit` });
      }

      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "GET_STATE") {
    getState().then((state) => {
      sendResponse({
        type: "STATE",
        capturing: state.active,
        demoName: state.demoName,
        frameCount: state.frameCount,
        captureMode: state.captureMode,
      });
    });
    return true;
  }

  // Manual capture from toolbar button or click-to-capture (kept as fallback)
  if (message.type === "CAPTURE_RESULT") {
    handleUpload(message.html, message.title, message.url, message.clickTargetSelector).then(
      (result) => sendResponse(result)
    );
    return true;
  }

  return false;
});

// AUTO-CAPTURE: When page finishes loading during capture mode
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("chrome-extension://") &&
    !tab.url.startsWith("about:")
  ) {
    getState().then(async (state) => {
      if (!state.active) return;

      const allowed = await hasHostPermission();
      if (!allowed) return;

      // Inject toolbar (always, regardless of mode)
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: injectToolbarUI,
          args: [state.demoName, state.frameCount, "Capturing...", state.captureMode],
        })
        .catch((e) => console.error("[NavTour] Toolbar inject failed:", e));

      // Only auto-capture in "auto" mode
      if (state.captureMode !== "auto") {
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: updateToolbarStatus,
            args: [state.frameCount, state.captureMode === "click" ? "Click elements to capture" : "Press Capture or Ctrl+Shift+C"],
          })
          .catch(() => {});
        return;
      }

      // Skip if already captured this exact URL
      if (state.capturedUrls.includes(tab.url!)) {
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: updateToolbarStatus,
            args: [state.frameCount, "Already captured"],
          })
          .catch(() => {});
        return;
      }

      // Auto-capture this page
      captureTab(tabId, state);
    });
  }
});

// Inject toolbar when switching tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  getState().then(async (state) => {
    if (!state.active) return;
    const allowed = await hasHostPermission();
    if (!allowed) return;
    chrome.scripting
      .executeScript({
        target: { tabId: activeInfo.tabId },
        func: injectToolbarUI,
        args: [state.demoName, state.frameCount, "", state.captureMode],
      })
      .catch(() => {});
  });
});

async function autoCaptureActiveTab(state: CaptureState) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (
      tab?.id &&
      tab.url &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://")
    ) {
      captureTab(tab.id, state);
    }
  } catch {}
}

// --- CORS bypass for cross-origin stylesheet/font/image fetching ---

async function enableCorsForTab(tabId: number) {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: [{
        id: tabId,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            { header: "Access-Control-Allow-Origin", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: "*" },
            { header: "Access-Control-Allow-Methods", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: "GET, OPTIONS" },
            { header: "Access-Control-Allow-Headers", operation: chrome.declarativeNetRequest.HeaderOperation.SET, value: "*" },
          ]
        },
        condition: { tabIds: [tabId], resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.STYLESHEET,
          chrome.declarativeNetRequest.ResourceType.FONT,
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        ]}
      }]
    });
  } catch (e) { console.warn("CORS bypass setup failed:", e); }
}

async function disableCorsForTab(tabId: number) {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] });
  } catch {}
}

// --- Main capture orchestration ---

async function captureTab(tabId: number, state: CaptureState) {
  try {
    // Show "capturing" status on toolbar
    chrome.scripting.executeScript({
      target: { tabId },
      func: updateToolbarStatus,
      args: [state.frameCount, "Capturing..."],
    }).catch(() => {});

    // Enable CORS bypass for this tab
    await enableCorsForTab(tabId);

    // Phase 1: Run async capture (stores result on window.__navtour_capture_result)
    await chrome.scripting.executeScript({
      target: { tabId },
      func: capturePageDOMAsync,
    });

    // Phase 2: Read the result
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => (window as any).__navtour_capture_result,
    });

    // Disable CORS bypass
    await disableCorsForTab(tabId);

    const result = results[0]?.result;
    if (!result?.html) {
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: updateToolbarStatus,
          args: [state.frameCount, "Capture failed"],
        })
        .catch(() => {});
      return;
    }

    // Upload
    const uploadResult = await handleUpload(result.html, result.title, result.url);

    if (uploadResult.ok) {
      // Re-read state (handleUpload updates it)
      const newState = await getState();
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: updateToolbarStatus,
          args: [newState.frameCount, "Captured!"],
        })
        .catch(() => {});
    } else {
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: updateToolbarStatus,
          args: [state.frameCount, uploadResult.error || "Upload failed"],
        })
        .catch(() => {});
    }
  } catch (e: any) {
    console.error("[NavTour] Auto-capture error:", e);
  }
}

async function hasHostPermission(): Promise<boolean> {
  return chrome.permissions.contains({ origins: ["<all_urls>"] });
}

async function injectToolbar(state: CaptureState) {
  try {
    const allowed = await hasHostPermission();
    if (!allowed) {
      console.warn("[NavTour] No host permission — toolbar cannot be injected. Grant permission via the popup.");
      return;
    }
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (tab?.id && tab.url && !tab.url.startsWith("chrome://")) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectToolbarUI,
        args: [state.demoName, state.frameCount, "", state.captureMode],
      });
    }
  } catch (e) {
    console.error("[NavTour] Failed to inject toolbar:", e);
  }
}

async function removeToolbarFromAll() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url && !tab.url.startsWith("chrome://")) {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: () => {
            const bar = document.getElementById("navtour-capture-bar");
            if (bar) bar.remove();
            // Remove click-to-capture listeners
            const handler = (window as any).__navtour_click_handler;
            if (handler) {
              document.removeEventListener("click", handler, true);
              delete (window as any).__navtour_click_handler;
            }
            // Remove keyboard shortcut listener
            const kbHandler = (window as any).__navtour_kb_handler;
            if (kbHandler) {
              document.removeEventListener("keydown", kbHandler, true);
              delete (window as any).__navtour_kb_handler;
            }
          },
        })
        .catch(() => {});
    }
  }
}

async function handleUpload(
  html: string,
  title: string,
  url: string,
  clickTargetSelector?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const stored = await chrome.storage.local.get(["session", "captureState"]);
    const session = stored.session;
    const state: CaptureState = stored.captureState ?? DEFAULT_STATE;

    if (!session?.accessToken || !state.demoId) {
      return { ok: false, error: "Not authenticated" };
    }

    // Skip duplicates (but allow click-to-capture to re-capture same URL with different selectors)
    if (state.captureMode === "auto" && state.capturedUrls.includes(url)) {
      return { ok: false, error: "Already captured" };
    }

    const safeName = (title || "page")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .substring(0, 50);
    const fileName = `${safeName}.html`;

    const blob = new Blob([html], { type: "text/html" });
    const form = new FormData();
    form.append("file", blob, fileName);
    if (clickTargetSelector) {
      form.append("clickTargetSelector", clickTargetSelector);
    }

    const res = await fetch(
      `${session.serverUrl}/api/v1/demos/${state.demoId}/frames`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: form,
      }
    );

    if (!res.ok) {
      return { ok: false, error: `Upload failed (${res.status})` };
    }

    // Update state
    state.frameCount++;
    if (!state.capturedUrls.includes(url)) {
      state.capturedUrls.push(url);
    }
    await setState(state);

    return { ok: true };
  } catch (e: any) {
    console.error("[NavTour] Upload error:", e);
    return { ok: false, error: e?.message || "Upload failed" };
  }
}

// --- Injected functions (fully self-contained) ---

function injectToolbarUI(demoName: string, frameCount: number, status: string, captureMode: string) {
  if (document.getElementById("navtour-capture-bar")) {
    // Update existing toolbar
    const countEl = document.getElementById("navtour-frame-count");
    if (countEl) countEl.textContent = `${frameCount}`;
    const statusEl = document.getElementById("navtour-status");
    if (statusEl && status) {
      statusEl.textContent = status;
      statusEl.style.color = status === "Captured!" ? "#4ade80" : status.includes("fail") || status.includes("Error") ? "#f87171" : "#fbbf24";
    }
    return;
  }

  // --- Helper: generate unique CSS selector for an element ---
  function getCssSelector(el: Element): string {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts: string[] = [];
    let current: Element | null = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      if (current.classList.length > 0) {
        const classes = Array.from(current.classList)
          .filter(c => !c.startsWith("navtour"))
          .slice(0, 3)
          .map(c => `.${CSS.escape(c)}`)
          .join("");
        if (classes) selector += classes;
      }
      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (s) => s.tagName === current!.tagName
        );
        if (siblings.length > 1) {
          const idx = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${idx})`;
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  // --- Helper: clone and clean DOM for capture ---
  function cloneAndClean(): HTMLElement {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    const barClone = clone.querySelector("#navtour-capture-bar");
    if (barClone) barClone.remove();
    clone.querySelectorAll("script").forEach((el) => el.remove());
    const evts = ["onclick","onload","onerror","onsubmit","onchange","onmouseover","onmouseout","onkeydown","onkeyup","onfocus","onblur","oninput"];
    clone.querySelectorAll("*").forEach((el) => { evts.forEach((a) => el.removeAttribute(a)); });
    clone.querySelectorAll("img[src]").forEach((img) => {
      const s = img.getAttribute("src");
      if (s && !s.startsWith("data:")) { try { img.setAttribute("src", new URL(s, document.baseURI).href); } catch {} }
    });
    clone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const h = link.getAttribute("href");
      if (h) { try { link.setAttribute("href", new URL(h, document.baseURI).href); } catch {} }
    });
    return clone;
  }

  // --- Helper: send capture result to background ---
  function sendCapture(clone: HTMLElement, tag: string, clickSelector?: string) {
    const st = document.getElementById("navtour-status");
    if (st) { st.textContent = "Capturing..."; st.style.color = "#fbbf24"; }

    const captureUrl = tag ? `${location.href}#${tag}` : location.href;

    chrome.runtime.sendMessage(
      {
        type: "CAPTURE_RESULT",
        html: "<!DOCTYPE html>" + clone.outerHTML,
        title: document.title + (tag ? ` (${tag})` : ""),
        url: captureUrl,
        clickTargetSelector: clickSelector || undefined,
      },
      (resp) => {
        const stEl = document.getElementById("navtour-status");
        const ctEl = document.getElementById("navtour-frame-count");
        if (resp?.ok) {
          if (stEl) { stEl.textContent = "Captured!"; stEl.style.color = "#4ade80"; }
          if (ctEl) { ctEl.textContent = `${parseInt(ctEl.textContent || "0") + 1}`; }
        } else if (resp?.error?.includes("Already")) {
          if (stEl) { stEl.textContent = "Already captured"; stEl.style.color = "#94a3b8"; }
        } else {
          if (stEl) { stEl.textContent = resp?.error || "Failed"; stEl.style.color = "#f87171"; }
        }
      }
    );
  }

  // --- Build floating toolbar UI (pill bar) ---
  const bar = document.createElement("div");
  bar.id = "navtour-capture-bar";
  bar.style.cssText = `
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    z-index: 2147483647;
    height: 40px; background: #1a1a2e; color: #fff;
    display: inline-flex; align-items: center; gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px; border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
    padding: 0 6px 0 14px;
    white-space: nowrap;
    backdrop-filter: blur(8px);
  `;

  // Recording dot indicator
  const dot = document.createElement("span");
  dot.id = "navtour-rec-dot";
  dot.style.cssText = `
    width: 8px; height: 8px; border-radius: 50%;
    background: #ef4444; flex-shrink: 0;
    animation: navtour-pulse 1.5s ease-in-out infinite;
  `;
  bar.appendChild(dot);

  // Inject keyframes for pulse animation
  if (!document.getElementById("navtour-keyframes")) {
    const style = document.createElement("style");
    style.id = "navtour-keyframes";
    style.textContent = `@keyframes navtour-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`;
    document.head.appendChild(style);
  }

  const name = document.createElement("span");
  name.textContent = demoName;
  name.style.cssText = "color: rgba(255,255,255,0.8); font-weight: 500; max-width: 120px; overflow: hidden; text-overflow: ellipsis;";
  bar.appendChild(name);

  // Thin separator
  const sep = document.createElement("span");
  sep.style.cssText = "width: 1px; height: 18px; background: rgba(255,255,255,0.15); flex-shrink: 0;";
  bar.appendChild(sep);

  const count = document.createElement("span");
  count.id = "navtour-frame-count";
  count.textContent = `${frameCount}`;
  count.style.cssText = "color: #fff; font-weight: 700; font-size: 13px; min-width: 12px; text-align: center;";
  bar.appendChild(count);

  const countLabel = document.createElement("span");
  countLabel.textContent = "frames";
  countLabel.style.cssText = "color: rgba(255,255,255,0.5); font-size: 11px; margin-left: -4px;";
  bar.appendChild(countLabel);

  // Status text (compact)
  const statusEl = document.createElement("span");
  statusEl.id = "navtour-status";
  const defaultStatus = captureMode === "click" ? "Click to capture" : captureMode === "manual" ? "Ctrl+Shift+C" : (status || "");
  statusEl.textContent = defaultStatus;
  statusEl.style.cssText = `color: ${captureMode !== "auto" ? "rgba(255,255,255,0.5)" : "#fbbf24"}; font-size: 11px; font-weight: 500;`;
  bar.appendChild(statusEl);

  // Separator before buttons
  const sep2 = document.createElement("span");
  sep2.style.cssText = "width: 1px; height: 18px; background: rgba(255,255,255,0.15); flex-shrink: 0;";
  bar.appendChild(sep2);

  // Capture button (pill style)
  const captureBtn = document.createElement("button");
  captureBtn.textContent = "Capture";
  captureBtn.title = "Capture this screen (Ctrl+Shift+C)";
  captureBtn.style.cssText = `
    background: rgba(255,255,255,0.12); color: #fff; border: none; border-radius: 14px;
    padding: 5px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center;
    transition: background 0.15s;
    font-family: inherit;
  `;
  captureBtn.addEventListener("mouseenter", () => { captureBtn.style.background = "rgba(255,255,255,0.2)"; });
  captureBtn.addEventListener("mouseleave", () => { captureBtn.style.background = "rgba(255,255,255,0.12)"; });
  captureBtn.addEventListener("click", () => {
    captureBtn.disabled = true;
    captureBtn.style.opacity = "0.5";
    const clone = cloneAndClean();
    sendCapture(clone, "");
    setTimeout(() => { captureBtn.disabled = false; captureBtn.style.opacity = "1"; }, 1000);
  });
  bar.appendChild(captureBtn);

  // Done button (primary accent pill)
  const finishBtn = document.createElement("button");
  finishBtn.textContent = "Done";
  finishBtn.style.cssText = `
    background: #4361ee; color: #fff; border: none; border-radius: 14px;
    padding: 5px 14px; font-size: 11px; font-weight: 600; cursor: pointer;
    transition: background 0.15s;
    font-family: inherit;
  `;
  finishBtn.addEventListener("mouseenter", () => { finishBtn.style.background = "#3a56d4"; });
  finishBtn.addEventListener("mouseleave", () => { finishBtn.style.background = "#4361ee"; });
  finishBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "STOP_CAPTURE", openBuilder: true });
    bar.remove();
  });
  bar.appendChild(finishBtn);

  document.body.appendChild(bar);

  // --- Click-to-Capture Mode ---
  if (captureMode === "click") {
    // Remove any existing handler
    const existingHandler = (window as any).__navtour_click_handler;
    if (existingHandler) {
      document.removeEventListener("click", existingHandler, true);
    }

    let lastCaptureTime = 0;
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target || target.closest("#navtour-capture-bar")) return;

      // Debounce — prevent rapid double-captures
      const now = Date.now();
      if (now - lastCaptureTime < 800) return;
      lastCaptureTime = now;

      // Record the CSS selector for the clicked element
      const selector = getCssSelector(target);

      // Brief highlight effect on clicked element
      const prevOutline = (target as HTMLElement).style.outline;
      (target as HTMLElement).style.outline = "3px solid #4361ee";
      setTimeout(() => { (target as HTMLElement).style.outline = prevOutline; }, 400);

      // Capture after a short delay (allow hover/active states to render)
      setTimeout(() => {
        const clone = cloneAndClean();
        const tag = `click-${selector.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}`;
        sendCapture(clone, tag, selector);
      }, 150);
    };

    document.addEventListener("click", clickHandler, true);
    (window as any).__navtour_click_handler = clickHandler;
  }

  // --- Keyboard Shortcut: Ctrl+Shift+C for manual capture ---
  if (!(window as any).__navtour_kb_handler) {
    const kbHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        e.stopPropagation();
        const clone = cloneAndClean();
        sendCapture(clone, "");
      }
    };
    document.addEventListener("keydown", kbHandler, true);
    (window as any).__navtour_kb_handler = kbHandler;
  }

  // --- SPA Navigation Detection (for auto mode) ---
  const navtourKey = "__navtour_watcher";
  if (!(window as any)[navtourKey]) {
    (window as any)[navtourKey] = true;
    let lastUrl = location.href;

    function captureAndSend(tag: string) {
      const clone = cloneAndClean();
      sendCapture(clone, tag);
    }

    function onUrlChange() {
      const currentUrl = location.href;
      if (currentUrl === lastUrl) return;
      lastUrl = currentUrl;
      // Only auto-capture URL changes in auto mode
      chrome.storage.local.get(["captureState"], (stored) => {
        const st = stored.captureState;
        if (st?.active && st.captureMode === "auto") {
          setTimeout(() => captureAndSend(""), 500);
        }
      });
    }

    window.addEventListener("popstate", onUrlChange);
    setInterval(onUrlChange, 800);

    // --- Popup / Modal / Dialog Detection (auto mode only) ---
    let captureTimeout: ReturnType<typeof setTimeout> | null = null;

    const popupSelectors = [
      '[role="dialog"]',
      '[role="alertdialog"]',
      '.rz-dialog',
      '.rz-dialog-content',
      '.modal',
      '.modal-dialog',
      '.popup',
      '.overlay',
      '.dropdown-menu[style*="display: block"]',
      '.rz-popup',
      '[class*="dialog"]',
      '[class*="modal"]',
    ];

    function isPopupElement(el: Element): boolean {
      if (el.id === "navtour-capture-bar") return false;
      for (const sel of popupSelectors) {
        if (el.matches(sel)) return true;
      }
      // Check for large fixed/absolute overlays
      const style = window.getComputedStyle(el);
      if (
        (style.position === "fixed" || style.position === "absolute") &&
        el.getBoundingClientRect().width > 100 &&
        el.getBoundingClientRect().height > 100 &&
        parseFloat(style.zIndex) > 100
      ) {
        return true;
      }
      return false;
    }

    const observer = new MutationObserver((mutations) => {
      // Only auto-capture popups in auto mode
      chrome.storage.local.get(["captureState"], (stored) => {
        const st = stored.captureState;
        if (!st?.active || st.captureMode !== "auto") return;

        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (!(node instanceof HTMLElement)) continue;
            if (isPopupElement(node) || node.querySelector(popupSelectors.join(","))) {
              if (captureTimeout) clearTimeout(captureTimeout);
              captureTimeout = setTimeout(() => {
                const popupText = (node.textContent || "").trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_");
                const tag = `popup-${popupText || "dialog"}`;
                captureAndSend(tag);
              }, 600);
              return;
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

function updateToolbarStatus(frameCount: number, status: string) {
  const countEl = document.getElementById("navtour-frame-count");
  if (countEl) countEl.textContent = `${frameCount}`;
  const statusEl = document.getElementById("navtour-status");
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.style.color = status === "Captured!" ? "#4ade80" :
      status === "Already captured" ? "#94a3b8" :
      status.includes("fail") || status.includes("Error") ? "#f87171" : "#fbbf24";
  }
}

// --- Async DOM capture function (injected into page context) ---
// Self-contained, no imports/closures. Runs via chrome.scripting.executeScript.
// Stores result on window.__navtour_capture_result for a second script to read.

function capturePageDOMAsync() {
  (async () => {
    try {
      const baseUri = document.baseURI;

      // --- Helper: absolutize a URL ---
      function absUrl(url: string, base: string): string {
        if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("javascript:")) return url;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) return url;
        try { return new URL(url, base).href; } catch { return url; }
      }

      // --- Helper: absolutize all url() references in a CSS string ---
      function absUrlsInCss(css: string, base: string): string {
        return css.replace(/url\(\s*["']?(?!data:|blob:|https?:|\/\/)(.*?)["']?\s*\)/g, (_m, u) => {
          try { return `url("${new URL(u.trim(), base).href}")`; } catch { return _m; }
        });
      }

      // ====================================================================
      // PHASE A: Convert <canvas> elements to <img> BEFORE cloning
      // ====================================================================
      const canvasMap = new Map<HTMLCanvasElement, HTMLImageElement>();
      document.querySelectorAll("canvas").forEach((canvas) => {
        try {
          const c = canvas as HTMLCanvasElement;
          const dataUrl = c.toDataURL("image/png");
          const img = document.createElement("img");
          img.src = dataUrl;
          img.width = c.width;
          img.height = c.height;
          img.style.cssText = window.getComputedStyle(c).cssText;
          canvasMap.set(c, img);
        } catch { /* tainted canvas — skip */ }
      });

      // ====================================================================
      // PHASE B: Collect CSS from all stylesheets
      // ====================================================================
      const collectedCss: string[] = [];

      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = sheet.cssRules;
          if (!rules) continue;

          const sheetBase = sheet.href || baseUri;
          const kept: string[] = [];

          for (const rule of Array.from(rules)) {
            const text = rule.cssText;

            // Always keep @-rules (font-face, keyframes, media, import, supports, layer)
            if (text.startsWith("@")) {
              kept.push(absUrlsInCss(text, sheetBase));
              continue;
            }

            // For style rules, only keep if the selector matches something on the page
            if (rule instanceof CSSStyleRule) {
              try {
                if (document.querySelector(rule.selectorText)) {
                  kept.push(absUrlsInCss(text, sheetBase));
                }
              } catch {
                // Invalid selector — keep to be safe
                kept.push(absUrlsInCss(text, sheetBase));
              }
            } else {
              kept.push(absUrlsInCss(text, sheetBase));
            }
          }

          if (kept.length > 0) {
            collectedCss.push(kept.join("\n"));
          }
        } catch {
          // Cross-origin stylesheet — try to fetch it via the CORS-bypassed network
          if (sheet.href) {
            try {
              const resp = await fetch(sheet.href, { mode: "cors", credentials: "omit" });
              if (resp.ok) {
                let css = await resp.text();
                css = absUrlsInCss(css, sheet.href);
                collectedCss.push(css);
              }
            } catch {
              // Truly unreachable — will rely on <base> tag for remaining refs
            }
          }
        }
      }

      // ====================================================================
      // PHASE C: Clone the DOM
      // ====================================================================
      const clone = document.documentElement.cloneNode(true) as HTMLElement;

      // Remove NavTour toolbar from clone
      const barClone = clone.querySelector("#navtour-capture-bar");
      if (barClone) barClone.remove();

      // Remove all scripts
      clone.querySelectorAll("script").forEach((el) => el.remove());

      // Remove event handler attributes
      const eventAttrs = [
        "onclick","onload","onerror","onsubmit","onchange","onmouseover",
        "onmouseout","onkeydown","onkeyup","onfocus","onblur","oninput",
        "ondblclick","oncontextmenu","onresize","onscroll","ontouchstart",
        "ontouchmove","ontouchend","onwheel","ondrag","ondrop",
      ];
      clone.querySelectorAll("*").forEach((el) => {
        eventAttrs.forEach((attr) => el.removeAttribute(attr));
      });

      // Replace <canvas> elements in clone with their <img> equivalents
      const origCanvases = document.querySelectorAll("canvas");
      const cloneCanvases = clone.querySelectorAll("canvas");
      origCanvases.forEach((origCanvas, i) => {
        if (i >= cloneCanvases.length) return;
        const replacement = canvasMap.get(origCanvas as HTMLCanvasElement);
        if (replacement) {
          cloneCanvases[i].replaceWith(replacement.cloneNode(true));
        }
      });

      // ====================================================================
      // PHASE D: Serialize Shadow DOM
      // ====================================================================
      const origAll = document.querySelectorAll("*");
      const cloneAll = clone.querySelectorAll("*");

      origAll.forEach((origEl, i) => {
        if (i >= cloneAll.length) return;
        const shadow = origEl.shadowRoot;
        if (!shadow) return;

        const cloneEl = cloneAll[i];
        const shadowDiv = document.createElement("div");
        shadowDiv.setAttribute("data-navtour-shadow", "true");

        // Copy the shadow DOM content using DOM methods
        const shadowContent = shadow.cloneNode(true) as DocumentFragment;
        while (shadowContent.firstChild) {
          shadowDiv.appendChild(shadowContent.firstChild);
        }

        // Collect adopted stylesheets from the shadow root
        if (shadow.adoptedStyleSheets && shadow.adoptedStyleSheets.length > 0) {
          let shadowCss = "";
          for (const sheet of shadow.adoptedStyleSheets) {
            try {
              for (const rule of Array.from(sheet.cssRules)) {
                shadowCss += rule.cssText + "\n";
              }
            } catch {}
          }
          if (shadowCss) {
            const styleTag = document.createElement("style");
            styleTag.textContent = shadowCss;
            shadowDiv.insertBefore(styleTag, shadowDiv.firstChild);
          }
        }

        // Also collect <style> tags from within the shadow DOM
        shadow.querySelectorAll("style").forEach((s) => {
          const styleTag = document.createElement("style");
          styleTag.textContent = s.textContent || "";
          shadowDiv.insertBefore(styleTag, shadowDiv.firstChild);
        });

        cloneEl.appendChild(shadowDiv);
      });

      // ====================================================================
      // PHASE E: Capture form values
      // ====================================================================
      const origInputs = document.querySelectorAll("input, select, textarea");
      const cloneInputs = clone.querySelectorAll("input, select, textarea");
      origInputs.forEach((origEl, i) => {
        if (i >= cloneInputs.length) return;
        const orig = origEl as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const cl = cloneInputs[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

        if (orig instanceof HTMLSelectElement) {
          const clSelect = cl as HTMLSelectElement;
          clSelect.querySelectorAll("option").forEach((opt, oi) => {
            if (oi === orig.selectedIndex) {
              opt.setAttribute("selected", "selected");
            } else {
              opt.removeAttribute("selected");
            }
          });
        } else if (orig instanceof HTMLInputElement) {
          if (orig.type === "checkbox" || orig.type === "radio") {
            if (orig.checked) {
              cl.setAttribute("checked", "checked");
            } else {
              cl.removeAttribute("checked");
            }
          } else {
            cl.setAttribute("value", orig.value);
          }
        } else if (orig instanceof HTMLTextAreaElement) {
          (cl as HTMLTextAreaElement).textContent = orig.value;
        }
      });

      // ====================================================================
      // PHASE F: Capture scroll positions
      // ====================================================================
      const origScrollables = document.querySelectorAll("*");
      const cloneScrollables = clone.querySelectorAll("*");
      origScrollables.forEach((origEl, i) => {
        if (i >= cloneScrollables.length) return;
        const el = origEl as HTMLElement;
        if (el.scrollTop > 0) {
          (cloneScrollables[i] as HTMLElement).setAttribute("data-navtour-scroll-top", String(el.scrollTop));
        }
        if (el.scrollLeft > 0) {
          (cloneScrollables[i] as HTMLElement).setAttribute("data-navtour-scroll-left", String(el.scrollLeft));
        }
      });

      // ====================================================================
      // PHASE G: Inline computed styles (smart — skip trivial/default values)
      // ====================================================================
      const CRITICAL_PROPS = [
        "display","position","float","clear","box-sizing",
        "width","height","min-width","min-height","max-width","max-height",
        "margin","margin-top","margin-right","margin-bottom","margin-left",
        "padding","padding-top","padding-right","padding-bottom","padding-left",
        "border","border-top","border-right","border-bottom","border-left",
        "border-radius","border-collapse","border-spacing",
        "background","background-color","background-image","background-size","background-position","background-repeat",
        "color","font-family","font-size","font-weight","font-style","line-height","letter-spacing",
        "text-align","text-decoration","text-transform","text-overflow","white-space","word-break","overflow","overflow-x","overflow-y",
        "vertical-align","list-style","list-style-type",
        "flex","flex-direction","flex-wrap","flex-grow","flex-shrink","flex-basis",
        "align-items","align-self","align-content","justify-content","gap","row-gap","column-gap",
        "grid-template-columns","grid-template-rows","grid-column","grid-row","grid-gap",
        "opacity","visibility","z-index","cursor","pointer-events",
        "transform","box-shadow","text-shadow","outline","table-layout",
        "top","right","bottom","left",
        "content","order","clip-path","filter","backdrop-filter",
        "transition","animation",
        "object-fit","object-position","aspect-ratio",
      ];

      const origElements = document.querySelectorAll("body *");
      const cloneElements = clone.querySelectorAll("body *");
      const totalElements = origElements.length;

      // For very large DOMs (>5000 elements), only inline critical layout props
      // to avoid multi-MB HTML output. For smaller DOMs, inline everything.
      const FAST_PROPS = totalElements > 5000 ? [
        "display","position","float","width","height","min-width","min-height","max-width","max-height",
        "margin","margin-top","margin-right","margin-bottom","margin-left",
        "padding","padding-top","padding-right","padding-bottom","padding-left",
        "background-color","background-image","color","font-family","font-size","font-weight",
        "line-height","text-align","flex","flex-direction","flex-wrap","align-items","justify-content","gap",
        "grid-template-columns","grid-template-rows","grid-column","grid-row",
        "opacity","visibility","z-index","transform","border","border-radius",
        "overflow","overflow-x","overflow-y","top","right","bottom","left",
        "box-sizing","order",
      ] : CRITICAL_PROPS;

      // Skip trivial/default values that don't need inlining
      const SKIP_VALUES = new Set([
        "", "none", "normal", "auto", "0px", "0px 0px", "start", "stretch",
        "visible", "static", "baseline", "inline", "currentcolor",
        "rgba(0, 0, 0, 0)", "transparent", "0", "0s", "ease",
        "100%", "medium none", "0px none",
      ]);

      origElements.forEach((origEl, i) => {
        if (i >= cloneElements.length) return;
        const cloneEl = cloneElements[i] as HTMLElement;

        // Skip invisible elements (saves lots of space)
        if (origEl instanceof HTMLElement) {
          const rect = origEl.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;
        }

        const computed = window.getComputedStyle(origEl);
        const styles: string[] = [];

        for (const prop of FAST_PROPS) {
          const val = computed.getPropertyValue(prop);
          if (SKIP_VALUES.has(val)) continue;
          styles.push(`${prop}:${val}`);
        }

        if (styles.length > 0) {
          const existing = cloneEl.getAttribute("style") || "";
          cloneEl.setAttribute("style", existing + (existing ? ";" : "") + styles.join(";"));
        }
      });

      // ====================================================================
      // PHASE H: Absolutize all URLs in the clone
      // ====================================================================

      // Images: src and srcset
      clone.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src) {
          img.setAttribute("src", absUrl(src, baseUri));
        }
        const srcset = img.getAttribute("srcset");
        if (srcset) {
          img.setAttribute("srcset", srcset.replace(/(\S+)(\s+[\d.]+[wx])/g, (_, url, desc) => {
            return absUrl(url.trim(), baseUri) + desc;
          }));
        }
      });

      // Source elements (picture/video/audio)
      clone.querySelectorAll("source").forEach((source) => {
        const src = source.getAttribute("src");
        if (src) source.setAttribute("src", absUrl(src, baseUri));
        const srcset = source.getAttribute("srcset");
        if (srcset) {
          source.setAttribute("srcset", srcset.replace(/(\S+)(\s+[\d.]+[wx])/g, (_, url, desc) => {
            return absUrl(url.trim(), baseUri) + desc;
          }));
        }
      });

      // Video/audio poster and src
      clone.querySelectorAll("video, audio").forEach((media) => {
        const poster = media.getAttribute("poster");
        if (poster) media.setAttribute("poster", absUrl(poster, baseUri));
        const src = media.getAttribute("src");
        if (src) media.setAttribute("src", absUrl(src, baseUri));
      });

      // Links (href on <a> — for display purposes in the snapshot)
      clone.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
          a.setAttribute("href", absUrl(href, baseUri));
        }
      });

      // Background images in inline styles
      clone.querySelectorAll("[style]").forEach((el) => {
        const style = el.getAttribute("style");
        if (style && style.includes("url(")) {
          el.setAttribute("style", style.replace(/url\(\s*["']?(?!data:|blob:|https?:|\/\/)(.*?)["']?\s*\)/g, (_m, u) => {
            try { return `url("${new URL(u.trim(), baseUri).href}")`; } catch { return _m; }
          }));
        }
      });

      // ====================================================================
      // PHASE I: Build final HTML document
      // ====================================================================

      // Remove existing <link rel="stylesheet"> tags (replaced by collected CSS)
      clone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        link.remove();
      });

      // Remove inline <style> tags from the original page
      // (their rules are already in collectedCss from document.styleSheets)
      clone.querySelectorAll("style").forEach((s) => {
        // Keep our NavTour keyframes style? No — remove it, not needed in capture
        if (s.id === "navtour-keyframes") {
          s.remove();
          return;
        }
        // Remove data-navtour-shadow styles are already appended via shadow serialization
        // but regular page styles were collected in Phase B
        if (!s.closest("[data-navtour-shadow]")) {
          s.remove();
        }
      });

      // Add collected CSS as a single style block in <head>
      const head = clone.querySelector("head");
      if (collectedCss.length > 0) {
        const styleEl = document.createElement("style");
        styleEl.setAttribute("data-navtour-collected", "true");
        styleEl.textContent = collectedCss.join("\n\n");
        if (head) {
          head.appendChild(styleEl);
        } else {
          clone.insertBefore(styleEl, clone.firstChild);
        }
      }

      // Add a meta charset if not present
      if (head && !head.querySelector('meta[charset]')) {
        const meta = document.createElement("meta");
        meta.setAttribute("charset", "utf-8");
        head.insertBefore(meta, head.firstChild);
      }

      // Add base tag for any remaining relative URLs
      if (head) {
        const existingBase = head.querySelector("base");
        if (!existingBase) {
          const baseTag = document.createElement("base");
          baseTag.setAttribute("href", baseUri);
          head.insertBefore(baseTag, head.firstChild);
        } else {
          existingBase.setAttribute("href", absUrl(existingBase.getAttribute("href") || "", baseUri));
        }
      }

      // Build the final HTML string
      const html = "<!DOCTYPE html>" + clone.outerHTML;

      (window as any).__navtour_capture_result = {
        html,
        title: document.title,
        url: document.location.href,
      };

    } catch (e) {
      console.error("[NavTour] Capture error:", e);
      (window as any).__navtour_capture_result = {
        html: "",
        title: document.title,
        url: document.location.href,
      };
    }
  })();
}
