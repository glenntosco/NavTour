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
        const serverUrl = state.serverUrl || "http://localhost:5017";
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
    getState().then((state) => {
      if (!state.active) return;

      // Inject toolbar (always, regardless of mode)
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: injectToolbarUI,
          args: [state.demoName, state.frameCount, "Capturing...", state.captureMode],
        })
        .catch(() => {});

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
  getState().then((state) => {
    if (state.active) {
      chrome.scripting
        .executeScript({
          target: { tabId: activeInfo.tabId },
          func: injectToolbarUI,
          args: [state.demoName, state.frameCount, "", state.captureMode],
        })
        .catch(() => {});
    }
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

async function captureTab(tabId: number, state: CaptureState) {
  try {
    // Show "capturing" status on toolbar
    chrome.scripting
      .executeScript({
        target: { tabId },
        func: updateToolbarStatus,
        args: [state.frameCount, "Capturing..."],
      })
      .catch(() => {});

    // Execute DOM capture
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: capturePageDOM,
    });

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

async function injectToolbar(state: CaptureState) {
  try {
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

function capturePageDOM(): { html: string; title: string; url: string } {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const bar = clone.querySelector("#navtour-capture-bar");
  if (bar) bar.remove();

  clone.querySelectorAll("script").forEach((el) => el.remove());

  const eventAttrs = ["onclick","onload","onerror","onsubmit","onchange","onmouseover","onmouseout","onkeydown","onkeyup","onfocus","onblur","oninput"];
  clone.querySelectorAll("*").forEach((el) => {
    eventAttrs.forEach((attr) => el.removeAttribute(attr));
  });

  clone.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && !src.startsWith("data:")) {
      try { img.setAttribute("src", new URL(src, document.baseURI).href); } catch {}
    }
  });

  clone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      try { link.setAttribute("href", new URL(href, document.baseURI).href); } catch {}
    }
  });

  return {
    html: "<!DOCTYPE html>" + clone.outerHTML,
    title: document.title,
    url: document.location.href,
  };
}
