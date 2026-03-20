import { NavTourApi } from "./api";
import type { StoredSession, DemoListItem, CaptureMode } from "./types";

const SERVER_URL = "https://navtour.cloud";

// DOM elements
const screenLogin = document.getElementById("screen-login")!;
const screenSelect = document.getElementById("screen-select")!;
const screenCapture = document.getElementById("screen-capture")!;

const loginEmail = document.getElementById("login-email") as HTMLInputElement;
const loginPassword = document.getElementById("login-password") as HTMLInputElement;
const btnLogin = document.getElementById("btn-login") as HTMLButtonElement;
const loginError = document.getElementById("login-error")!;
const btnRetry = document.getElementById("btn-retry") as HTMLButtonElement;

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

let api = new NavTourApi(SERVER_URL);
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

function clearSelectOptions(select: HTMLSelectElement) {
  while (select.options.length > 0) {
    select.remove(0);
  }
}

// Silent cookie auto-login — bonus path, not primary
async function tryAutoLogin(): Promise<boolean> {
  try {
    const candidateUrls = [SERVER_URL, "http://localhost:5017"];

    // Add active tab origin
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const origin = new URL(tab.url).origin;
        if (!candidateUrls.includes(origin)) candidateUrls.push(origin);
      }
    } catch { /* ignore */ }

    for (const url of candidateUrls) {
      try {
        const cookie = await chrome.cookies.get({ url, name: "navtour_auth" });
        if (!cookie?.value) continue;

        const testApi = new NavTourApi(url);
        testApi.setToken(cookie.value);
        await testApi.getDemos(); // verify token works

        api = testApi;
        session = {
          serverUrl: url,
          accessToken: cookie.value,
          demoId: "",
          demoName: "",
          frameCount: 0,
        };
        await chrome.storage.local.set({ session });
        return true;
      } catch { /* try next */ }
    }
  } catch { /* silent */ }
  return false;
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

async function init() {
  // 1. Check stored session
  const stored = await chrome.storage.local.get(["session"]);

  if (stored.session) {
    session = stored.session as StoredSession;
    api = new NavTourApi(session.serverUrl);
    api.setToken(session.accessToken);

    // Check if background is actively capturing
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
      if (state?.capturing) {
        captureDemoName.textContent = state.demoName;
        captureFrameCount.textContent = String(state.frameCount);
        showStatus(captureStatus, "Toolbar is active on page — capture from there", "success");
        showScreen(screenCapture);
      } else {
        loadDemos()
          .then(() => showScreen(screenSelect))
          .catch(async () => {
            // Token expired — clear stored session and try fresh cookie
            chrome.storage.local.remove(["session"]);
            session = null;
            const autoOk = await tryAutoLogin();
            if (autoOk) {
              await loadDemos();
              showScreen(screenSelect);
            } else {
              showScreen(screenLogin);
            }
          });
      }
    });
    return;
  }

  // 2. Silently try cookie auto-login
  const autoOk = await tryAutoLogin();
  if (autoOk) {
    await loadDemos();
    showScreen(screenSelect);
    return;
  }

  // 3. Show login form
  showScreen(screenLogin);
}

// Login form submit
btnLogin.addEventListener("click", async () => {
  loginError.hidden = true;
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    loginError.textContent = "Enter your email and password";
    loginError.hidden = false;
    return;
  }

  btnLogin.disabled = true;
  btnLogin.textContent = "Signing in...";

  try {
    api = new NavTourApi(SERVER_URL);
    const result = await api.login(email, password);

    api.setToken(result.accessToken);
    session = {
      serverUrl: SERVER_URL,
      accessToken: result.accessToken,
      demoId: "",
      demoName: "",
      frameCount: 0,
    };
    await chrome.storage.local.set({ session });

    await loadDemos();
    showScreen(screenSelect);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed";
    loginError.textContent = msg;
    loginError.hidden = false;
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Sign In";
  }
});

// Allow Enter key to submit login
loginPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click();
});
loginEmail.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginPassword.focus();
});

// Retry auto-login (secondary link)
btnRetry.addEventListener("click", async () => {
  btnRetry.disabled = true;
  btnRetry.textContent = "Checking...";

  try {
    const ok = await tryAutoLogin();
    if (ok) {
      await loadDemos();
      showScreen(screenSelect);
    } else {
      loginError.textContent = "No active browser session found. Sign in with your credentials.";
      loginError.hidden = false;
    }
  } catch {
    loginError.textContent = "Auto-login failed. Sign in with your credentials.";
    loginError.hidden = false;
  } finally {
    btnRetry.disabled = false;
    btnRetry.textContent = "Try auto-login from browser session";
  }
});

// Logout
btnLogout.addEventListener("click", async () => {
  chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
  await chrome.storage.local.remove(["session"]);
  session = null;
  showScreen(screenLogin);
});

// Start capturing
btnStart.addEventListener("click", async () => {
  selectError.hidden = true;

  let demoId = demoSelect.value;
  let demoName = "";

  if (!demoId && newDemoNameInput.value.trim()) {
    try {
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

  session = { ...session!, demoId, demoName, frameCount: 0 };
  await chrome.storage.local.set({ session });

  const modeRadio = document.querySelector('input[name="capture-mode"]:checked') as HTMLInputElement;
  const captureMode = (modeRadio?.value || "auto") as CaptureMode;

  await chrome.storage.local.set({
    captureState: { active: true, demoId, demoName, serverUrl: session!.serverUrl, frameCount: 0, capturedUrls: [], captureMode },
  });

  chrome.runtime.sendMessage({ type: "START_CAPTURE", demoId, demoName, captureMode });

  captureDemoName.textContent = demoName;
  captureFrameCount.textContent = "0";
  showStatus(captureStatus, "Recording — navigate your app, pages are captured automatically", "success");
  showScreen(screenCapture);

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
