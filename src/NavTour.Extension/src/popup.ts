import { NavTourApi } from "./api";
import type { StoredSession, DemoListItem } from "./types";

// DOM elements
const screenLogin = document.getElementById("screen-login")!;
const screenSelect = document.getElementById("screen-select")!;
const screenCapture = document.getElementById("screen-capture")!;

const serverUrlInput = document.getElementById("server-url") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const btnLogin = document.getElementById("btn-login") as HTMLButtonElement;
const loginError = document.getElementById("login-error")!;

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
  screenLogin.hidden = true;
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

async function tryAutoLogin(): Promise<boolean> {
  const knownUrls = ["https://navtour.cloud"];

  // Also try the active tab's origin (covers localhost or other deployments)
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const origin = new URL(tab.url).origin;
      if (!knownUrls.includes(origin)) knownUrls.push(origin);
    }
  } catch {
    // tabs query can fail in some contexts, ignore
  }

  for (const url of knownUrls) {
    try {
      const cookie = await chrome.cookies.get({ url, name: "navtour_auth" });
      if (cookie?.value) {
        const serverUrl = url;
        const accessToken = cookie.value;

        api = new NavTourApi(serverUrl);
        api.setToken(accessToken);

        // Verify the token works by loading demos
        await api.getDemos();

        session = {
          serverUrl,
          accessToken,
          demoId: "",
          demoName: "",
          frameCount: 0,
        };
        await chrome.storage.local.set({ session });
        return true;
      }
    } catch {
      // Cookie invalid or token expired, try next URL
    }
  }

  return false;
}

async function init() {
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
            showScreen(screenLogin);
          });
      }
    });
  } else {
    // Try auto-login from navtour_auth cookie before showing login form
    if (await tryAutoLogin()) {
      await loadDemos();
      showScreen(screenSelect);
    } else {
      showScreen(screenLogin);
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

// Login
btnLogin.addEventListener("click", async () => {
  hideStatus(loginError);
  btnLogin.disabled = true;
  btnLogin.textContent = "Logging in...";

  try {
    const serverUrl = serverUrlInput.value.trim();
    api = new NavTourApi(serverUrl);
    const result = await api.login({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });

    session = {
      serverUrl,
      accessToken: result.accessToken,
      demoId: "",
      demoName: "",
      frameCount: 0,
    };
    await chrome.storage.local.set({ session });

    await loadDemos();
    showScreen(screenSelect);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[NavTour] Login failed:", err);
    loginError.textContent = msg.includes("Login failed")
      ? "Invalid email or password"
      : `Connection error: ${msg}`;
    loginError.hidden = false;
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Log In";
  }
});

// Logout
btnLogout.addEventListener("click", async () => {
  chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
  await chrome.storage.local.remove(["session"]);
  session = null;
  showScreen(screenLogin);
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

  // Set capture state directly from popup (more reliable than relying on background)
  await chrome.storage.local.set({
    captureState: { active: true, demoId, demoName, serverUrl: session!.serverUrl, frameCount: 0, capturedUrls: [] },
  });

  // Tell background to inject toolbar into the current page
  chrome.runtime.sendMessage({ type: "START_CAPTURE", demoId, demoName });

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
  showScreen(screenLogin);
});
