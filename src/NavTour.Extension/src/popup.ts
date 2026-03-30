/**
 * Popup Controller — manages the multi-screen popup UI
 * Flow: mode select → login → demo select → capture active
 */

// ── Elements ────────────────────────────────────────────────────────

const $ = (id: string) => document.getElementById(id)!;

const screenModeSelect = $('screen-mode-select');
const screenLogin = $('screen-login');
const screenDemos = $('screen-demos');
const screenScreenshots = $('screen-screenshots');
const screenCapture = $('screen-capture');
const screenCaptureScreenshot = $('screen-capture-screenshot');
const screenCaptureVideo = $('screen-capture-video');

const allScreens = [
  screenModeSelect, screenLogin, screenDemos, screenScreenshots,
  screenCapture, screenCaptureScreenshot, screenCaptureVideo,
];

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
const smartBlurToggle = $('smart-blur-toggle') as HTMLInputElement;
const smartBlurHint = $('smart-blur-hint');
const logoutBtn = $('logout-btn');

const captureDemoName = $('capture-demo-name');
const frameCount = $('frame-count');
const manualCaptureBtn = $('manual-capture-btn') as HTMLButtonElement;
const finishBtn = $('finish-btn') as HTMLButtonElement;

// Screenshot mode elements
const captureScreenshotDemoName = $('capture-screenshot-demo-name');
const screenshotCount = $('screenshot-count');
const takeScreenshotBtn = $('take-screenshot-btn') as HTMLButtonElement;
const screenshotFinishBtn = $('screenshot-finish-btn') as HTMLButtonElement;

// Screenshot entity select screen elements
const screenshotEntitySelect = $('screenshot-entity-select') as HTMLSelectElement;
const newScreenshotName = $('new-screenshot-name') as HTMLInputElement;
const screenshotEntityError = $('screenshot-entity-error');
const startScreenshotCaptureBtn = $('start-screenshot-capture-btn') as HTMLButtonElement;
const logoutScreenshotsBtn = $('logout-screenshots-btn');

// Video mode elements
const captureVideoDemoName = $('capture-video-demo-name');
const videoDuration = $('video-duration');
const videoToggleBtn = $('video-toggle-btn') as HTMLButtonElement;
const videoFinishBtn = $('video-finish-btn') as HTMLButtonElement;
const videoStatusText = $('video-status-text');
const videoIndicator = $('video-indicator');

// ── Types ───────────────────────────────────────────────────────────

type CaptureType = 'html' | 'screenshot' | 'video';

// ── State ───────────────────────────────────────────────────────────

interface StoredSession {
  serverUrl: string;
  accessToken: string;
  demoId?: string;
  demoName?: string;
  screenshotId?: string;
  screenshotName?: string;
  frameCount?: number;
  tabId?: number;
}

let currentSession: StoredSession | null = null;
let activeMode: CaptureType = 'html';
let videoRecording = false;

// ── Screen navigation ───────────────────────────────────────────────

function showScreen(screen: HTMLElement): void {
  for (const s of allScreens) {
    s.hidden = true;
  }
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

// ── Mode storage ────────────────────────────────────────────────────

const MODE_STORAGE_KEY = 'navtour_capture_mode';

async function saveMode(mode: CaptureType): Promise<void> {
  activeMode = mode;
  await chrome.storage.local.set({ [MODE_STORAGE_KEY]: mode });
}

async function getActiveMode(): Promise<CaptureType> {
  const data = await chrome.storage.local.get(MODE_STORAGE_KEY);
  return (data[MODE_STORAGE_KEY] as CaptureType) || 'html';
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

// ── Mode Select ─────────────────────────────────────────────────────

function showModeSelect(): void {
  showScreen(screenModeSelect);
}

// Attach click handlers to mode cards
document.querySelectorAll('.mode-card').forEach((card) => {
  card.addEventListener('click', async () => {
    const mode = (card as HTMLElement).dataset.mode as CaptureType;
    if (!mode) return;

    await saveMode(mode);

    // Proceed to login or appropriate select screen depending on auth state
    currentSession = await loadSession();
    if (currentSession?.accessToken) {
      if (mode === 'screenshot') {
        await loadScreenshots();
        showScreen(screenScreenshots);
      } else {
        await loadDemos();
        showScreen(screenDemos);
      }
    } else {
      showScreen(screenLogin);
    }
  });
});

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
    const mode = await getActiveMode();
    if (mode === 'screenshot') {
      await loadScreenshots();
      showScreen(screenScreenshots);
    } else {
      await loadDemos();
      showScreen(screenDemos);
    }
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

// ── Screenshot entity list ───────────────────────────────────────────

async function loadScreenshots(): Promise<void> {
  if (!currentSession) return;

  clearSelectOptions(screenshotEntitySelect);
  addSelectOption(screenshotEntitySelect, '', 'Loading...');

  try {
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:get-screenshots',
      token: currentSession.accessToken,
    });

    const screenshots = response?.screenshots || [];
    clearSelectOptions(screenshotEntitySelect);
    addSelectOption(screenshotEntitySelect, '', '-- Select a screenshot --');
    for (const ss of screenshots) {
      addSelectOption(
        screenshotEntitySelect,
        ss.id,
        `${ss.name} (${ss.slideCount || 0} slides)`,
        { name: ss.name, slideCount: String(ss.slideCount || 0) }
      );
    }
  } catch (err: any) {
    showError(screenshotEntityError, err.message || 'Failed to load screenshots');
  }
}

startScreenshotCaptureBtn.addEventListener('click', async () => {
  clearError(screenshotEntityError);

  const selectedSs = screenshotEntitySelect.selectedOptions[0];
  const newName = newScreenshotName.value.trim();

  if (!selectedSs?.value && !newName) {
    showError(screenshotEntityError, 'Select a screenshot or enter a name for a new one');
    return;
  }

  startScreenshotCaptureBtn.disabled = true;
  startScreenshotCaptureBtn.textContent = 'Starting...';

  try {
    let screenshotId = selectedSs?.value;
    let screenshotName = selectedSs?.dataset?.name || newName;

    // Create new screenshot entity if needed
    if (!screenshotId && newName) {
      const createResponse = await fetch(
        `${currentSession!.serverUrl}/api/v1/screenshots`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession!.accessToken}`,
          },
          body: JSON.stringify({ name: newName }),
        }
      );
      if (!createResponse.ok) throw new Error('Failed to create screenshot');
      const created = await createResponse.json();
      screenshotId = created.id;
      screenshotName = newName;
    }

    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:start-screenshot',
      token: currentSession!.accessToken,
      screenshotId,
      screenshotName,
      frameCount: 0,
    });

    currentSession!.screenshotId = screenshotId;
    currentSession!.screenshotName = screenshotName;
    currentSession!.frameCount = 0;
    currentSession!.tabId = response?.tabId;
    await saveSession(currentSession!);

    captureScreenshotDemoName.textContent = screenshotName!;
    screenshotCount.textContent = '0';
    showScreen(screenCaptureScreenshot);
  } catch (err: any) {
    showError(screenshotEntityError, err.message);
  } finally {
    startScreenshotCaptureBtn.disabled = false;
    startScreenshotCaptureBtn.textContent = 'Start Capturing';
  }
});

logoutScreenshotsBtn.addEventListener('click', async () => {
  await clearSessionStorage();
  currentSession = null;
  showModeSelect();
});

// ── Smart Blur toggle ───────────────────────────────────────────────
if (smartBlurToggle) {
  smartBlurToggle.addEventListener('change', () => {
    if (smartBlurHint) {
      smartBlurHint.style.display = smartBlurToggle.checked ? 'block' : 'none';
    }
    // Update the toggle slider visual
    const slider = smartBlurToggle.nextElementSibling as HTMLElement;
    const dot = slider?.nextElementSibling as HTMLElement;
    if (slider && dot) {
      slider.style.background = smartBlurToggle.checked ? 'var(--nt-accent)' : 'var(--nt-border)';
      dot.style.transform = smartBlurToggle.checked ? 'translateX(16px)' : 'translateX(0)';
    }
  });
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

    const mode = await getActiveMode();

    if (mode === 'html') {
      // Existing HTML capture flow
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

      // Enable smart blur if toggled on
      if (smartBlurToggle?.checked && response.tabId) {
        await chrome.tabs.sendMessage(response.tabId, { kind: 'navtour:smart-blur-enable' });
      }

      captureDemoName.textContent = demoName!;
      frameCount.textContent = String(existingFrameCount);
      showScreen(screenCapture);

      // Close popup
      window.close();
    } else if (mode === 'screenshot') {
      // Screenshot mode — dispatch to worker
      const response = await chrome.runtime.sendMessage({
        kind: 'navtour:popup:start-screenshot',
        token: currentSession!.accessToken,
        demoId,
        demoName,
        frameCount: existingFrameCount,
      });

      currentSession!.demoId = demoId;
      currentSession!.demoName = demoName;
      currentSession!.frameCount = existingFrameCount;
      currentSession!.tabId = response?.tabId;
      await saveSession(currentSession!);

      captureScreenshotDemoName.textContent = demoName!;
      screenshotCount.textContent = String(existingFrameCount);
      showScreen(screenCaptureScreenshot);
    } else if (mode === 'video') {
      // Video mode — dispatch to worker
      const response = await chrome.runtime.sendMessage({
        kind: 'navtour:popup:start-video',
        token: currentSession!.accessToken,
        demoId,
        demoName,
      });

      currentSession!.demoId = demoId;
      currentSession!.demoName = demoName;
      currentSession!.tabId = response?.tabId;
      await saveSession(currentSession!);

      captureVideoDemoName.textContent = demoName!;
      videoDuration.textContent = '0:00';
      showScreen(screenCaptureVideo);
    }
  } catch (err: any) {
    showError(demoError, err.message);
  } finally {
    startCaptureBtn.disabled = false;
    startCaptureBtn.textContent = 'Start Capturing';
  }
});

// ── Manual capture (HTML mode) ──────────────────────────────────────

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

// ── Take Screenshot (Screenshot mode) ───────────────────────────────

takeScreenshotBtn.addEventListener('click', async () => {
  if (!currentSession?.tabId) return;

  takeScreenshotBtn.disabled = true;
  takeScreenshotBtn.textContent = 'Capturing...';

  try {
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:take-screenshot',
      tabId: currentSession.tabId,
      demoId: currentSession.demoId,
      token: currentSession.accessToken,
    });

    if (response?.success) {
      currentSession.frameCount = (currentSession.frameCount || 0) + 1;
      screenshotCount.textContent = String(currentSession.frameCount);
      await saveSession(currentSession);
    }
  } finally {
    takeScreenshotBtn.disabled = false;
    takeScreenshotBtn.textContent = 'Take Screenshot';
  }
});

// ── Video toggle (Video mode) ───────────────────────────────────────

videoToggleBtn.addEventListener('click', async () => {
  if (!currentSession?.tabId) return;

  if (!videoRecording) {
    // Start recording
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:start-video-recording',
      tabId: currentSession.tabId,
      demoId: currentSession.demoId,
      token: currentSession.accessToken,
    });

    if (response?.success) {
      videoRecording = true;
      videoToggleBtn.textContent = 'Stop Recording';
      videoToggleBtn.classList.add('btn-recording');
      videoStatusText.textContent = 'Recording';
      const dot = videoIndicator.querySelector('.dot');
      if (dot) {
        dot.classList.remove('dot-idle');
      }
    }
  } else {
    // Stop recording
    const response = await chrome.runtime.sendMessage({
      kind: 'navtour:popup:stop-video-recording',
      tabId: currentSession.tabId,
    });

    videoRecording = false;
    videoToggleBtn.textContent = 'Start Recording';
    videoToggleBtn.classList.remove('btn-recording');
    videoStatusText.textContent = 'Stopped';
    const dot = videoIndicator.querySelector('.dot');
    if (dot) {
      dot.classList.add('dot-idle');
    }
  }
});

// ── Finish capture (HTML mode) ──────────────────────────────────────

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

// ── Finish capture (Screenshot mode) ────────────────────────────────

screenshotFinishBtn.addEventListener('click', async () => {
  const screenshotId = currentSession?.screenshotId;

  if (currentSession?.tabId) {
    await chrome.runtime.sendMessage({
      kind: 'navtour:popup:stop-capture',
      tabId: currentSession.tabId,
    });
  }

  if (currentSession) {
    currentSession.screenshotId = undefined;
    currentSession.screenshotName = undefined;
    currentSession.frameCount = undefined;
    currentSession.tabId = undefined;
    await saveSession(currentSession);
  }

  // Open the screenshot editor in a new tab
  if (screenshotId) {
    const appUrl = currentSession?.serverUrl || 'https://navtour.cloud';
    await chrome.tabs.create({ url: `${appUrl}/screenshots/${screenshotId}/edit` });
  }

  await loadScreenshots();
  showScreen(screenScreenshots);
});

// ── Finish capture (Video mode) ─────────────────────────────────────

videoFinishBtn.addEventListener('click', async () => {
  if (!currentSession?.tabId) return;

  // Stop recording if still active
  if (videoRecording) {
    await chrome.runtime.sendMessage({
      kind: 'navtour:popup:stop-video-recording',
      tabId: currentSession.tabId,
    });
    videoRecording = false;
  }

  await chrome.runtime.sendMessage({
    kind: 'navtour:popup:download-video',
    tabId: currentSession.tabId,
    demoId: currentSession.demoId,
  });

  currentSession.demoId = undefined;
  currentSession.demoName = undefined;
  currentSession.tabId = undefined;
  await saveSession(currentSession);

  await loadDemos();
  showScreen(screenDemos);
});

// ── Logout ──────────────────────────────────────────────────────────

logoutBtn.addEventListener('click', async () => {
  await clearSessionStorage();
  currentSession = null;
  showModeSelect();
});

// ── Initialize ──────────────────────────────────────────────────────

async function init(): Promise<void> {
  activeMode = await getActiveMode();
  currentSession = await loadSession();

  if (!currentSession?.accessToken) {
    // No session — always show mode select first
    showModeSelect();
    return;
  }

  // Check if there's an active capture session
  const state = await chrome.runtime.sendMessage({
    kind: 'navtour:popup:get-state',
  });

  if (state?.sessions?.length > 0 && currentSession.tabId) {
    const active = state.sessions.find((s: any) => s.tabId === currentSession!.tabId);
    if (active) {
      // Show the appropriate capture screen based on active mode
      if (activeMode === 'screenshot') {
        captureScreenshotDemoName.textContent =
          currentSession.screenshotName || active.demoName || '';
        screenshotCount.textContent = String(active.frameCount);
        showScreen(screenCaptureScreenshot);
      } else if (activeMode === 'video') {
        captureVideoDemoName.textContent = active.demoName;
        showScreen(screenCaptureVideo);
      } else {
        captureDemoName.textContent = active.demoName;
        frameCount.textContent = String(active.frameCount);
        showScreen(screenCapture);
      }
      return;
    }
  }

  // No active capture — show mode select (user picks mode each time)
  showModeSelect();
}

// Listen for capture updates from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.kind === 'navtour:capture-complete' && currentSession) {
    currentSession.frameCount = msg.frameCount;
    if (activeMode === 'screenshot') {
      screenshotCount.textContent = String(msg.frameCount);
    } else {
      frameCount.textContent = String(msg.frameCount);
    }
    saveSession(currentSession);
  }
});

init();
