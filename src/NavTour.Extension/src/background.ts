// Background service worker — auto-captures pages on navigation
// All state persisted to chrome.storage.local (MV3 workers can sleep)

interface CaptureState {
  active: boolean;
  demoId: string;
  demoName: string;
  serverUrl: string;
  frameCount: number;
  capturedUrls: string[]; // Track URLs to avoid duplicates
}

const DEFAULT_STATE: CaptureState = {
  active: false,
  demoId: "",
  demoName: "",
  serverUrl: "",
  frameCount: 0,
  capturedUrls: [],
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
      autoCaptureActiveTab(state);
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
      });
    });
    return true;
  }

  // Manual capture from toolbar button (kept as fallback)
  if (message.type === "CAPTURE_RESULT") {
    handleUpload(message.html, message.title, message.url).then((result) =>
      sendResponse(result)
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

      // Inject toolbar first
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: injectToolbarUI,
          args: [state.demoName, state.frameCount, "Capturing..."],
        })
        .catch(() => {});

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
          args: [state.demoName, state.frameCount, ""],
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
        args: [state.demoName, state.frameCount, ""],
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
          },
        })
        .catch(() => {});
    }
  }
}

async function handleUpload(
  html: string,
  title: string,
  url: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const stored = await chrome.storage.local.get(["session", "captureState"]);
    const session = stored.session;
    const state: CaptureState = stored.captureState ?? DEFAULT_STATE;

    if (!session?.accessToken || !state.demoId) {
      return { ok: false, error: "Not authenticated" };
    }

    // Skip duplicates
    if (state.capturedUrls.includes(url)) {
      return { ok: false, error: "Already captured" };
    }

    const safeName = (title || "page")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .substring(0, 50);
    const fileName = `${safeName}.html`;

    const blob = new Blob([html], { type: "text/html" });
    const form = new FormData();
    form.append("file", blob, fileName);

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
    state.capturedUrls.push(url);
    await setState(state);

    return { ok: true };
  } catch (e: any) {
    console.error("[NavTour] Upload error:", e);
    return { ok: false, error: e?.message || "Upload failed" };
  }
}

// --- Injected functions (fully self-contained) ---

function injectToolbarUI(demoName: string, frameCount: number, status: string) {
  if (document.getElementById("navtour-capture-bar")) {
    // Update existing toolbar
    const countEl = document.getElementById("navtour-frame-count");
    if (countEl) countEl.textContent = `${frameCount} frames`;
    const statusEl = document.getElementById("navtour-status");
    if (statusEl && status) {
      statusEl.textContent = status;
      statusEl.style.color = status === "Captured!" ? "#4ade80" : status.includes("fail") || status.includes("Error") ? "#f87171" : "#fbbf24";
    }
    return;
  }

  const bar = document.createElement("div");
  bar.id = "navtour-capture-bar";
  bar.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 2147483647;
    height: 44px; background: #1a1a2e; color: #fff;
    display: flex; align-items: center; gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px; box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
    padding: 0 16px;
  `;

  const logo = document.createElement("span");
  logo.textContent = "NavTour";
  logo.style.cssText = "font-weight: 700; color: #4361ee;";
  bar.appendChild(logo);

  const sep = document.createElement("span");
  sep.textContent = "|";
  sep.style.cssText = "color: #555;";
  bar.appendChild(sep);

  const name = document.createElement("span");
  name.textContent = demoName;
  name.style.cssText = "color: #ccc;";
  bar.appendChild(name);

  const spacer = document.createElement("span");
  spacer.style.cssText = "flex: 1;";
  bar.appendChild(spacer);

  const statusEl = document.createElement("span");
  statusEl.id = "navtour-status";
  statusEl.textContent = status || "Recording...";
  statusEl.style.cssText = "color: #fbbf24; font-weight: 500;";
  bar.appendChild(statusEl);

  const count = document.createElement("span");
  count.id = "navtour-frame-count";
  count.textContent = `${frameCount} frames`;
  count.style.cssText = "color: #aaa; margin-left: 8px;";
  bar.appendChild(count);

  // Manual capture button (for SPA pages that don't trigger navigation)
  const captureBtn = document.createElement("button");
  captureBtn.textContent = "Capture";
  captureBtn.style.cssText = `
    background: #334155; color: #fff; border: 1px solid #555; border-radius: 6px;
    padding: 6px 14px; font-size: 12px; cursor: pointer; margin-left: 8px;
  `;
  captureBtn.addEventListener("click", () => {
    captureBtn.disabled = true;
    captureBtn.textContent = "...";

    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    const barClone = clone.querySelector("#navtour-capture-bar");
    if (barClone) barClone.remove();
    clone.querySelectorAll("script").forEach((el) => el.remove());
    const evtAttrs = ["onclick","onload","onerror","onsubmit","onchange","onmouseover","onmouseout","onkeydown","onkeyup","onfocus","onblur","oninput"];
    clone.querySelectorAll("*").forEach((el) => { evtAttrs.forEach((a) => el.removeAttribute(a)); });
    clone.querySelectorAll("img[src]").forEach((img) => {
      const s = img.getAttribute("src");
      if (s && !s.startsWith("data:")) { try { img.setAttribute("src", new URL(s, document.baseURI).href); } catch {} }
    });
    clone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const h = link.getAttribute("href");
      if (h) { try { link.setAttribute("href", new URL(h, document.baseURI).href); } catch {} }
    });

    chrome.runtime.sendMessage(
      { type: "CAPTURE_RESULT", html: "<!DOCTYPE html>" + clone.outerHTML, title: document.title, url: location.href },
      (resp) => {
        captureBtn.disabled = false;
        captureBtn.textContent = "Capture";
        const st = document.getElementById("navtour-status");
        const ct = document.getElementById("navtour-frame-count");
        if (resp?.ok) {
          if (st) { st.textContent = "Captured!"; st.style.color = "#4ade80"; }
          if (ct) { ct.textContent = `${parseInt(ct.textContent || "0") + 1} frames`; }
        } else {
          if (st) { st.textContent = resp?.error || "Failed"; st.style.color = "#f87171"; }
        }
      }
    );
  });
  bar.appendChild(captureBtn);

  const finishBtn = document.createElement("button");
  finishBtn.textContent = "Finish";
  finishBtn.style.cssText = `
    background: #4361ee; color: #fff; border: none; border-radius: 6px;
    padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 4px;
  `;
  finishBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "STOP_CAPTURE", openBuilder: true });
    bar.remove();
  });
  bar.appendChild(finishBtn);

  document.body.appendChild(bar);

  // --- Shared capture helper (used by URL watcher and popup detector) ---
  function captureAndSend(tag: string) {
    const st = document.getElementById("navtour-status");
    if (st) { st.textContent = "Capturing..."; st.style.color = "#fbbf24"; }

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

    // Use URL + tag as unique key so popups on the same page get captured separately
    const captureUrl = tag ? `${location.href}#${tag}` : location.href;

    chrome.runtime.sendMessage(
      { type: "CAPTURE_RESULT", html: "<!DOCTYPE html>" + clone.outerHTML, title: document.title + (tag ? ` (${tag})` : ""), url: captureUrl },
      (resp) => {
        const stEl = document.getElementById("navtour-status");
        const ctEl = document.getElementById("navtour-frame-count");
        if (resp?.ok) {
          if (stEl) { stEl.textContent = "Captured!"; stEl.style.color = "#4ade80"; }
          if (ctEl) { ctEl.textContent = `${parseInt(ctEl.textContent || "0") + 1} frames`; }
        } else if (resp?.error?.includes("Already")) {
          if (stEl) { stEl.textContent = "Already captured"; stEl.style.color = "#94a3b8"; }
        } else {
          if (stEl) { stEl.textContent = resp?.error || "Failed"; stEl.style.color = "#f87171"; }
        }
      }
    );
  }

  // --- SPA Navigation Detection ---
  const navtourKey = "__navtour_watcher";
  if (!(window as any)[navtourKey]) {
    (window as any)[navtourKey] = true;
    let lastUrl = location.href;

    function onUrlChange() {
      const currentUrl = location.href;
      if (currentUrl === lastUrl) return;
      lastUrl = currentUrl;
      setTimeout(() => captureAndSend(""), 500);
    }

    window.addEventListener("popstate", onUrlChange);
    setInterval(onUrlChange, 800);

    // --- Popup / Modal / Dialog Detection ---
    // Watches for new dialogs, modals, dropdowns, and overlays added to the DOM
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
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          // Check the node itself and its children
          if (isPopupElement(node) || node.querySelector(popupSelectors.join(","))) {
            // Debounce — multiple nodes may be added for one popup
            if (captureTimeout) clearTimeout(captureTimeout);
            captureTimeout = setTimeout(() => {
              // Generate a tag from the popup's text content for uniqueness
              const popupText = (node.textContent || "").trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_");
              const tag = `popup-${popupText || "dialog"}`;
              captureAndSend(tag);
            }, 600); // Wait for popup animation/content to render
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

function updateToolbarStatus(frameCount: number, status: string) {
  const countEl = document.getElementById("navtour-frame-count");
  if (countEl) countEl.textContent = `${frameCount} frames`;
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
