import { NavTourApi } from "./api";
import type { StoredSession, DemoListItem, CaptureMode } from "./types";

// DOM elements
const screenNotLoggedIn = document.getElementById("screen-not-logged-in")!;
const screenSelect = document.getElementById("screen-select")!;
const screenCapture = document.getElementById("screen-capture")!;

const btnOpenApp = document.getElementById("btn-open-app") as HTMLAnchorElement;
const btnRetry = document.getElementById("btn-retry") as HTMLButtonElement;
const retryStatus = document.getElementById("retry-status")!;

const demoSelect = document.getElementById("demo-select") as HTMLSelectElement;
const newDemoNameInput = document.getElementById("new-demo-name") as HTMLInputElement;
const btnStart = document.getElementById("btn-start") as HTMLButtonElement;
const btnLogout = document.getElementById("btn-logout") as HTMLButtonElement;
const selectError = document.getElementById("select-error")!;

const captureDemoName = document.getElementById("capture-demo-name")!;
const captureFrameCount = document.getElementById("capture-frame-count")!;
const btnFinish = document.getElementById("btn-finish") as HTMLButtonElement;
const btnBack = document.getElementById("btn-back") as HTMLButtonElement;
const captureStatus = document.getElementById("capture-status")!;

let api: NavTourApi;
let session: StoredSession | null = null;
let demos: DemoListItem[] = [];

function showScreen(screen: HTMLElement) {
  screenNotLoggedIn.hidden = true;
  screenSelect.hidden = true;
  screenCapture.hidden = true;
  screen.hidden = false;
}

function showStatus(el: HTMLElement, message: string, type: "success" | "error" | "loading") {
  el.textContent = message;
  el.className = `status ${type}`;
  el.hidden = false;
}

function hideStatus(el: HTMLElement) {
  el.hidden = true;
}

function clearSelectOptions(select: HTMLSelectElement) {
  while (select.options.length > 0) {
    select.remove(0);
  }
}

// Diagnostic result from tryAutoLogin — tells the caller WHY login failed
type AutoLoginResult =
  | { ok: true; serverUrl: string }
  | { ok: false; reason: "no-cookie" }
  | { ok: false; reason: "expired"; serverUrl: string }
  | { ok: false; reason: "network-error"; serverUrl: string; detail: string };

async function tryAutoLogin(): Promise<AutoLoginResult> {
  console.log("[NavTour] tryAutoLogin: starting cookie discovery");

  // 1. Use chrome.cookies.getAll to find the cookie on ANY domain
  let cookies: chrome.cookies.Cookie[] = [];
  try {
    cookies = await chrome.cookies.getAll({ name: "navtour_auth" });
    console.log(`[NavTour] getAll found ${cookies.length} navtour_auth cookie(s):`, cookies.map(c => c.domain));
  } catch (err) {
    console.warn("[NavTour] chrome.cookies.getAll failed:", err);
  }

  // Build candidate URLs from discovered cookies
  const candidateUrls: string[] = [];
  for (const c of cookies) {
    const proto = c.secure ? "https" : "http";
    const domain = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
    const url = `${proto}://${domain}`;
    if (!candidateUrls.includes(url)) candidateUrls.push(url);
  }

  // 2. Fall back to known URLs if getAll returned nothing
  if (candidateUrls.length === 0) {
    candidateUrls.push("https://navtour.cloud", "http://localhost:5017");
    console.log("[NavTour] No cookies from getAll, falling back to known URLs");
  }

  // Also add the active tab's origin
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const origin = new URL(tab.url).origin;
      if (!candidateUrls.includes(origin)) candidateUrls.push(origin);
    }
  } catch {
    // tabs query can fail in some contexts, ignore
  }

  console.log("[NavTour] Candidate URLs to try:", candidateUrls);

  let lastFailure: AutoLoginResult = { ok: false, reason: "no-cookie" };

  for (const url of candidateUrls) {
    try {
      const cookie = await chrome.cookies.get({ url, name: "navtour_auth" });
      if (!cookie?.value) {
        console.log(`[NavTour] No cookie at ${url}`);
        continue;
      }

      console.log(`[NavTour] Cookie found at ${url}, verifying token with API...`);
      api = new NavTourApi(url);
      api.setToken(cookie.value);

      try {
        await api.getDemos();
      } catch (apiErr) {
        const status = apiErr instanceof Error ? apiErr.message : String(apiErr);
        console.warn(`[NavTour] API rejected token from ${url}:`, status);

        // Distinguish 401 (expired) from network errors
        if (status.includes("401") || status.includes("Unauthorized")) {
          lastFailure = { ok: false, reason: "expired", serverUrl: url };
        } else {
          lastFailure = { ok: false, reason: "network-error", serverUrl: url, detail: status };
        }
        continue;
      }

      console.log(`[NavTour] Token valid at ${url} — auto-login success`);
      session = {
        serverUrl: url,
        accessToken: cookie.value,
        demoId: "",
        demoName: "",
        frameCount: 0,
      };
      await chrome.storage.local.set({ session });
      return { ok: true, serverUrl: url };
    } catch (err) {
      console.warn(`[NavTour] Error checking ${url}:`, err);
    }
  }

  console.log("[NavTour] tryAutoLogin: all candidates exhausted, reason:", lastFailure.reason);
  return lastFailure;
}

function updateOpenAppLink(serverUrl?: string) {
  const base = serverUrl || "https://navtour.cloud";
  btnOpenApp.href = `${base}/login`;
  btnOpenApp.textContent = `Log in at ${new URL(base).hostname}`;
}

async function init() {
  updateOpenAppLink();

  const stored = await chrome.storage.local.get(["session"]);

  if (stored.session) {
    session = stored.session as StoredSession;
    api = new NavTourApi(session.serverUrl);
    api.setToken(session.accessToken);

    // Check if background is actively capturing
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
      if (state?.capturing) {
        // Show capture status in popup
        captureDemoName.textContent = state.demoName;
        captureFrameCount.textContent = String(state.frameCount);
        showStatus(captureStatus, "Toolbar is active on page — capture from there", "success");
        showScreen(screenCapture);
      } else {
        // Show demo select — user is logged in, go straight to it
        loadDemos()
          .then(() => showScreen(screenSelect))
          .catch(() => {
            // Token expired
            chrome.storage.local.remove(["session"]);
            session = null;
            showScreen(screenNotLoggedIn);
          });
      }
    });
  } else {
    // Try auto-login from navtour_auth cookie
    const result = await tryAutoLogin();
    if (result.ok) {
      updateOpenAppLink(result.serverUrl);
      await loadDemos();
      showScreen(screenSelect);
    } else {
      if ("serverUrl" in result) updateOpenAppLink(result.serverUrl);
      showScreen(screenNotLoggedIn);
    }
  }
}

async function loadDemos() {
  demos = await api.getDemos();
  clearSelectOptions(demoSelect);

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "— Choose a demo —";
  demoSelect.appendChild(defaultOpt);

  for (const demo of demos) {
    const opt = document.createElement("option");
    opt.value = demo.id;
    opt.textContent = `${demo.name} (${demo.frameCount} frames)`;
    demoSelect.appendChild(opt);
  }
}

// Retry auto-login
btnRetry.addEventListener("click", async () => {
  hideStatus(retryStatus);
  btnRetry.disabled = true;
  btnRetry.textContent = "Checking...";

  try {
    const result = await tryAutoLogin();
    if (result.ok) {
      updateOpenAppLink(result.serverUrl);
      await loadDemos();
      showScreen(screenSelect);
    } else {
      if ("serverUrl" in result) updateOpenAppLink(result.serverUrl);

      switch (result.reason) {
        case "no-cookie":
          showStatus(retryStatus, "No navtour_auth cookie found. Log in at the web app first.", "error");
          break;
        case "expired":
          showStatus(retryStatus, "Cookie found but session expired. Please log in again.", "error");
          break;
        case "network-error":
          showStatus(retryStatus, `Cookie found but server unreachable: ${result.detail}`, "error");
          break;
      }
    }
  } catch (err) {
    console.error("[NavTour] Retry failed:", err);
    showStatus(retryStatus, "Could not connect. Try again.", "error");
  } finally {
    btnRetry.disabled = false;
    btnRetry.textContent = "Retry";
  }
});

// Open app link
btnOpenApp.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: btnOpenApp.href });
});

// Logout
btnLogout.addEventListener("click", async () => {
  chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
  await chrome.storage.local.remove(["session"]);
  session = null;
  showScreen(screenNotLoggedIn);
});

// Start capturing — tells background to inject toolbar
btnStart.addEventListener("click", async () => {
  hideStatus(selectError);

  let demoId = demoSelect.value;
  let demoName = "";

  if (!demoId && newDemoNameInput.value.trim()) {
    try {
      // Re-ensure api has the token (safety net)
      if (session?.accessToken) api.setToken(session.accessToken);
      const created = await api.createDemo({ name: newDemoNameInput.value.trim() });
      demoId = created.id;
      demoName = created.name;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create demo";
      showStatus(selectError, msg, "error");
      return;
    }
  } else if (demoId) {
    const selected = demos.find((d) => d.id === demoId);
    demoName = selected?.name ?? "Demo";
  } else {
    showStatus(selectError, "Select a demo or enter a name for a new one", "error");
    return;
  }

  // Update session
  session = { ...session!, demoId, demoName, frameCount: 0 };
  await chrome.storage.local.set({ session });

  // Read selected capture mode
  const modeRadio = document.querySelector('input[name="capture-mode"]:checked') as HTMLInputElement;
  const captureMode = (modeRadio?.value || "auto") as CaptureMode;

  // Set capture state directly from popup (more reliable than relying on background)
  await chrome.storage.local.set({
    captureState: { active: true, demoId, demoName, serverUrl: session!.serverUrl, frameCount: 0, capturedUrls: [], captureMode },
  });

  // Tell background to inject toolbar into the current page
  chrome.runtime.sendMessage({ type: "START_CAPTURE", demoId, demoName, captureMode });

  captureDemoName.textContent = demoName;
  captureFrameCount.textContent = "0";
  showStatus(captureStatus, "Recording — navigate your app, pages are captured automatically", "success");
  showScreen(screenCapture);

  // Close popup so user can interact with their app
  setTimeout(() => window.close(), 1000);
});

// Finish — stop capture, open builder
btnFinish.addEventListener("click", async () => {
  if (session?.demoId) {
    chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
    const builderUrl = `${session.serverUrl}/demos/${session.demoId}/edit`;
    await chrome.tabs.create({ url: builderUrl });

    session = { ...session, demoId: "", demoName: "", frameCount: 0 };
    await chrome.storage.local.set({ session });
    window.close();
  }
});

// Back to demo list
btnBack.addEventListener("click", async () => {
  chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
  session = { ...session!, demoId: "", demoName: "", frameCount: 0 };
  await chrome.storage.local.set({ session });
  await loadDemos();
  showScreen(screenSelect);
});

// Initialize
init().catch((err) => {
  console.error("[NavTour] Popup init failed:", err);
  showScreen(screenNotLoggedIn);
});
