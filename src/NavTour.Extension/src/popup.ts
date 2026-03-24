/**
 * Popup Controller — manages the three-screen popup UI
 * Mirrors Navattic's popup architecture (login → demo select → capture active)
 */

// ── Elements ────────────────────────────────────────────────────────

const $ = (id: string) => document.getElementById(id)!;

const screenLogin = $('screen-login');
const screenDemos = $('screen-demos');
const screenCapture = $('screen-capture');

const loginForm = $('login-form') as HTMLFormElement;
const emailInput = $('email') as HTMLInputElement;
const passwordInput = $('password') as HTMLInputElement;
const serverUrlInput = $('server-url') as HTMLInputElement;
const loginError = $('login-error');
const loginBtn = $('login-btn') as HTMLButtonElement;

const demoSelect = $('demo-select') as HTMLSelectElement;
const newDemoName = $('new-demo-name') as HTMLInputElement;
const demoError = $('demo-error');
const startCaptureBtn = $('start-capture-btn') as HTMLButtonElement;
const logoutBtn = $('logout-btn');

const captureDemoName = $('capture-demo-name');
const frameCount = $('frame-count');
const manualCaptureBtn = $('manual-capture-btn') as HTMLButtonElement;
const finishBtn = $('finish-btn') as HTMLButtonElement;

// ── State ───────────────────────────────────────────────────────────

interface StoredSession {
  serverUrl: string;
  accessToken: string;
  demoId?: string;
  demoName?: string;
  frameCount?: number;
  tabId?: number;
}

let currentSession: StoredSession | null = null;

// ── Screen navigation ───────────────────────────────────────────────

function showScreen(screen: HTMLElement): void {
  screenLogin.hidden = true;
  screenDemos.hidden = true;
  screenCapture.hidden = true;
  screen.hidden = false;
}

function showError(el: HTMLElement, msg: string): void {
  el.textContent = msg;
  el.hidden = false;
}

function clearError(el: HTMLElement): void {
  el.hidden = true;
}

// ── Helpers ─────────────────────────────────────────────────────────

function clearSelectOptions(select: HTMLSelectElement): void {
  while (select.options.length > 0) {
    select.remove(0);
  }
}

function addSelectOption(select: HTMLSelectElement, value: string, text: string, data?: Record<string, string>): void {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = text;
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      opt.dataset[k] = v;
    }
  }
  select.appendChild(opt);
}

// ── Chrome storage ──────────────────────────────────────────────────

async function loadSession(): Promise<StoredSession | null> {
  const data = await chrome.storage.local.get('navtour_session');
  return data.navtour_session || null;
}

async function saveSession(session: StoredSession): Promise<void> {
  await chrome.storage.local.set({ navtour_session: session });
}

async function clearSessionStorage(): Promise<void> {
  await chrome.storage.local.remove('navtour_session');
}

// ── Login ───────────────────────────────────────────────────────────

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(loginError);
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:login',
      email: emailInput.value,
      password: passwordInput.value,
      serverUrl: serverUrlInput.value,
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Login failed');
    }

    currentSession = {
      serverUrl: serverUrlInput.value,
      accessToken: response.accessToken,
    };
    await saveSession(currentSession);
    await loadDemos();
    showScreen(screenDemos);
  } catch (err: any) {
    showError(loginError, err.message || 'Login failed');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// ── Demo list ───────────────────────────────────────────────────────

async function loadDemos(): Promise<void> {
  if (!currentSession) return;

  clearSelectOptions(demoSelect);
  addSelectOption(demoSelect, '', 'Loading...');

  try {
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:get-demos',
      token: currentSession.accessToken,
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to load demos');
    }

    const demos = response.demos || [];
    clearSelectOptions(demoSelect);
    addSelectOption(demoSelect, '', '-- Select a demo --');
    for (const demo of demos) {
      addSelectOption(
        demoSelect,
        demo.id,
        `${demo.name} (${demo.frameCount || 0} frames)`,
        { name: demo.name, frameCount: String(demo.frameCount || 0) }
      );
    }
  } catch (err: any) {
    showError(demoError, err.message);
  }
}

// ── Start capture ───────────────────────────────────────────────────

startCaptureBtn.addEventListener('click', async () => {
  clearError(demoError);

  const selectedDemo = demoSelect.selectedOptions[0];
  const newName = newDemoName.value.trim();

  if (!selectedDemo?.value && !newName) {
    showError(demoError, 'Select a demo or enter a name for a new one');
    return;
  }

  startCaptureBtn.disabled = true;
  startCaptureBtn.textContent = 'Starting...';

  try {
    let demoId = selectedDemo?.value;
    let demoName = selectedDemo?.dataset?.name || newName;
    let existingFrameCount = parseInt(selectedDemo?.dataset?.frameCount || '0', 10);

    // Create new demo if needed
    if (!demoId && newName) {
      const createResponse = await fetch(
        `${currentSession!.serverUrl}/api/v1/demos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession!.accessToken}`,
          },
          body: JSON.stringify({ name: newName }),
        }
      );
      if (!createResponse.ok) throw new Error('Failed to create demo');
      const created = await createResponse.json();
      demoId = created.id;
      demoName = newName;
      existingFrameCount = 0;
    }

    const captureMode = (
      document.querySelector('input[name="capture-mode"]:checked') as HTMLInputElement
    )?.value || 'auto';

    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:start-capture',
      token: currentSession!.accessToken,
      demoId,
      demoName,
      frameCount: existingFrameCount,
      settings: {
        clickToCapture: captureMode === 'click',
        generateSandbox: false,
      },
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to start capture');
    }

    currentSession!.demoId = demoId;
    currentSession!.demoName = demoName;
    currentSession!.frameCount = existingFrameCount;
    currentSession!.tabId = response.tabId;
    await saveSession(currentSession!);

    captureDemoName.textContent = demoName!;
    frameCount.textContent = String(existingFrameCount);
    showScreen(screenCapture);

    // Close popup
    window.close();
  } catch (err: any) {
    showError(demoError, err.message);
  } finally {
    startCaptureBtn.disabled = false;
    startCaptureBtn.textContent = 'Start Capturing';
  }
});

// ── Manual capture ──────────────────────────────────────────────────

manualCaptureBtn.addEventListener('click', async () => {
  if (!currentSession?.tabId) return;

  manualCaptureBtn.disabled = true;
  manualCaptureBtn.textContent = 'Capturing...';

  try {
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:manual-capture',
      tabId: currentSession.tabId,
    });

    if (response?.success) {
      currentSession.frameCount = (currentSession.frameCount || 0) + 1;
      frameCount.textContent = String(currentSession.frameCount);
      await saveSession(currentSession);
    }
  } finally {
    manualCaptureBtn.disabled = false;
    manualCaptureBtn.textContent = 'Capture Now';
  }
});

// ── Finish capture ──────────────────────────────────────────────────

finishBtn.addEventListener('click', async () => {
  if (!currentSession?.tabId) return;

  await chrome.runtime.sendMessage({
    kind: 'navtour:popup:stop-capture',
    tabId: currentSession.tabId,
  });

  currentSession.demoId = undefined;
  currentSession.demoName = undefined;
  currentSession.frameCount = undefined;
  currentSession.tabId = undefined;
  await saveSession(currentSession);

  await loadDemos();
  showScreen(screenDemos);
});

// ── Logout ──────────────────────────────────────────────────────────

logoutBtn.addEventListener('click', async () => {
  await clearSessionStorage();
  currentSession = null;
  showScreen(screenLogin);
});

// ── Initialize ──────────────────────────────────────────────────────

async function init(): Promise<void> {
  currentSession = await loadSession();

  if (!currentSession?.accessToken) {
    showScreen(screenLogin);
    return;
  }

  // Check if there's an active capture session
  const state = await chrome.runtime.sendMessage({
    kind: 'navtour:popup:get-state',
  });

  if (state?.sessions?.length > 0 && currentSession.tabId) {
    const active = state.sessions.find((s: any) => s.tabId === currentSession!.tabId);
    if (active) {
      captureDemoName.textContent = active.demoName;
      frameCount.textContent = String(active.frameCount);
      showScreen(screenCapture);
      return;
    }
  }

  // Show demo selection
  await loadDemos();
  showScreen(screenDemos);
}

// Listen for capture updates from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.kind === 'navtour:capture-complete' && currentSession) {
    currentSession.frameCount = msg.frameCount;
    frameCount.textContent = String(msg.frameCount);
    saveSession(currentSession);
  }
});

init();
