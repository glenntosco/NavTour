/**
 * Worker — Main Background Service Worker
 * Mirrors Navattic's worker.js architecture.
 *
 * Responsibilities:
 * - Handle external connections from NavTour web app
 * - Manage capture sessions (start, stop, tab tracking)
 * - Orchestrate page capture (DOM snapshot + resource pipeline)
 * - Upload captured frames to NavTour API
 * - Tab management and navigation tracking
 * - Offscreen document management
 * - Declarative net request rules for CORS bypass
 * - Toolbar/badge state management
 */

import { getApiUrl, getAppUrl, FeatureFlags } from './lib/constants';

// ── Types ───────────────────────────────────────────────────────────

interface FrameCapture {
  index: number;
  title: string;
  url: string;
  thumbnailDataUrl: string;
  status: 'complete' | 'error';
  timestamp: number;
  frameId?: string;
  stepType?: 'modal' | 'tooltip' | 'invisible';
  stepText?: string;
}

interface CaptureSession {
  tabId: number;
  token: string;
  demoId: string;
  demoName: string;
  frameCount: number;
  frames: FrameCapture[];
  settings: CaptureSettings;
  mode?: 'html' | 'screenshot' | 'video';
  cxtFeatureFlags?: string[];
  workspaceSlug?: string;
}

interface CaptureSettings {
  clickToCapture?: boolean;
  clickToCapturePaused?: boolean;
  generateSandbox?: boolean;
  allowSw?: boolean;
  disableHTMLPatch?: boolean;
  enableDownloadRestrictions?: boolean;
}

interface ResourceUploadResult {
  url: string;
  hash: string;
}

// ── State ───────────────────────────────────────────────────────────

const activeSessions = new Map<number, CaptureSession>();
let offscreenDocumentCreated = false;

// ── Offscreen document management ───────────────────────────────────

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenDocumentCreated) return;

  try {
    // Check if already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });

    if (existingContexts.length > 0) {
      offscreenDocumentCreated = true;
      return;
    }

    await chrome.offscreen.createDocument({
      url: 'static/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Parse and process captured HTML content',
    });
    offscreenDocumentCreated = true;
  } catch (e) {
    console.warn('[NavTour Worker] Failed to create offscreen document:', e);
  }
}

// ── CORS bypass via declarativeNetRequest ───────────────────────────

const CORS_RULE_ID_BASE = 1000;

async function addCorsRule(tabId: number): Promise<void> {
  const ruleId = CORS_RULE_ID_BASE + tabId;

  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleId],
      addRules: [
        {
          id: ruleId,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            responseHeaders: [
              {
                header: 'Access-Control-Allow-Origin',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: '*',
              },
              {
                header: 'Access-Control-Allow-Methods',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: 'GET, POST, PUT, DELETE, OPTIONS',
              },
              {
                header: 'Access-Control-Allow-Headers',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: '*',
              },
            ],
          },
          condition: {
            tabIds: [tabId],
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.STYLESHEET,
              chrome.declarativeNetRequest.ResourceType.IMAGE,
              chrome.declarativeNetRequest.ResourceType.FONT,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.OTHER,
            ],
          },
        },
      ],
    });
  } catch (e) {
    console.warn('[NavTour Worker] Failed to add CORS rule:', e);
  }
}

async function removeCorsRule(tabId: number): Promise<void> {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [CORS_RULE_ID_BASE + tabId],
    });
  } catch {}
}

// ── API helpers ─────────────────────────────────────────────────────

async function apiCall(
  path: string,
  options: {
    method?: string;
    body?: any;
    token: string;
    contentType?: string;
  }
): Promise<any> {
  const { method = 'GET', body, token, contentType = 'application/json' } = options;
  const url = `${getApiUrl()}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function uploadFrame(
  token: string,
  demoId: string,
  html: string,
  title: string,
  sourceUrl: string
): Promise<any> {
  // Server expects IFormFile — send as multipart/form-data
  const fileName = `${title || 'frame'}-${Date.now()}.html`;
  const blob = new Blob([html], { type: 'text/html' });
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('name', title || fileName);

  const response = await fetch(`${getApiUrl()}/demos/${demoId}/frames`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — browser sets it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function uploadScreenshot(
  token: string,
  demoId: string,
  dataUrl: string,
  name: string
): Promise<any> {
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append('file', blob, `${name}.png`);
  formData.append('name', name);

  const res = await fetch(`${getApiUrl()}/demos/${demoId}/frames`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Screenshot upload failed ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function uploadResource(
  token: string,
  url: string,
  data: string,
  contentType: string
): Promise<ResourceUploadResult> {
  return apiCall('/resources', {
    method: 'POST',
    token,
    body: { url, data, contentType },
  });
}

// ── Screenshot capture ──────────────────────────────────────────────

async function captureScreenshot(tabId: number): Promise<void> {
  const session = activeSessions.get(tabId);
  if (!session) {
    console.warn('[NavTour Worker] No active session for tab:', tabId);
    return;
  }

  console.log(`[NavTour Worker] Taking screenshot for tab ${tabId}, demo ${session.demoName}`);

  try {
    const tab = await chrome.tabs.get(tabId);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: 'png', quality: 100 },
        (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result || '');
          }
        }
      );
    });

    if (!dataUrl) {
      throw new Error('Failed to capture visible tab');
    }

    const name = `Screenshot ${session.frameCount + 1}`;
    const frameResult = await uploadScreenshot(session.token, session.demoId, dataUrl, name);

    session.frameCount++;

    const frameThumbnail: FrameCapture = {
      index: session.frameCount,
      title: name,
      url: tab.url || '',
      thumbnailDataUrl: dataUrl,
      status: 'complete',
      timestamp: Date.now(),
      frameId: frameResult.id,
    };
    session.frames.push(frameThumbnail);

    // Notify the tab about successful capture
    notifyTab(tabId, {
      kind: 'navtour:capture-complete',
      frameCount: session.frameCount,
      frameId: frameResult.id,
      frameThumbnail,
    });

    updateBadge(tabId, session.frameCount);

    console.log(
      `[NavTour Worker] Screenshot ${session.frameCount} captured for demo ${session.demoName}`
    );
  } catch (e) {
    console.error('[NavTour Worker] Screenshot capture error:', e);
    notifyTab(tabId, {
      kind: 'navtour:capture-error',
      error: (e as Error).message,
    });
    throw e;
  }
}

// ── Capture orchestration ───────────────────────────────────────────

async function captureTab(tabId: number): Promise<void> {
  const session = activeSessions.get(tabId);
  if (!session) {
    console.warn('[NavTour Worker] No active session for tab:', tabId);
    return;
  }

  console.log(`[NavTour Worker] Capturing tab ${tabId} for demo ${session.demoName}`);

  try {
    // Ensure content scripts and offscreen document are ready
    await ensureContentScripts(tabId);
    await ensureOffscreenDocument();

    // Request DOM capture from content script
    const captureResult = await chrome.tabs.sendMessage(tabId, {
      kind: 'navtour:capture-page',
    });

    if (!captureResult?.success) {
      console.error('[NavTour Worker] Capture failed:', captureResult?.error);
      notifyTab(tabId, {
        kind: 'navtour:capture-error',
        error: captureResult?.error || 'Unknown capture error',
      });
      return;
    }

    // Process stylesheets — rebuild as inline styles in the HTML
    let html = captureResult.html;
    const stylesheets = captureResult.stylesheets || [];
    let styleBlock = '';

    for (const sheet of stylesheets) {
      if (sheet.cssText) {
        styleBlock += `<style>${sheet.cssText}</style>\n`;
      }
    }

    // Inject collected stylesheets into head
    if (styleBlock) {
      html = html.replace('</head>', `${styleBlock}</head>`);
    }

    // Upload frame to API
    const frameResult = await uploadFrame(
      session.token,
      session.demoId,
      html,
      captureResult.title,
      captureResult.url
    );

    session.frameCount++;

    // Take screenshot thumbnail for panel
    let thumbnailDataUrl = '';
    try {
      const tab = await chrome.tabs.get(tabId);
      thumbnailDataUrl = await new Promise<string>((resolve) => {
        chrome.tabs.captureVisibleTab(
          tab.windowId,
          { format: 'png' },
          (dataUrl) => resolve(dataUrl || '')
        );
      });
    } catch (e) {
      console.warn('[NavTour Worker] Thumbnail capture failed:', e);
    }

    // Store frame metadata
    const frameThumbnail: FrameCapture = {
      index: session.frameCount,
      title: captureResult.title,
      url: captureResult.url,
      thumbnailDataUrl,
      status: 'complete',
      timestamp: Date.now(),
      frameId: frameResult.id,
    };
    session.frames.push(frameThumbnail);

    // Notify the tab about successful capture (include thumbnail for panel)
    notifyTab(tabId, {
      kind: 'navtour:capture-complete',
      frameCount: session.frameCount,
      frameId: frameResult.id,
      frameThumbnail,
    });

    // Update badge
    updateBadge(tabId, session.frameCount);

    console.log(
      `[NavTour Worker] Frame ${session.frameCount} captured for demo ${session.demoName}`
    );
  } catch (e) {
    console.error('[NavTour Worker] Capture error:', e);
    notifyTab(tabId, {
      kind: 'navtour:capture-error',
      error: (e as Error).message,
    });
  }
}

// ── Tab notification ────────────────────────────────────────────────

function notifyTab(tabId: number, message: any): void {
  try {
    chrome.tabs.sendMessage(tabId, message).catch(() => {});
  } catch {}
}

/** Inject the floating capture pill toolbar into the tab */
function injectToolbarInTab(tabId: number, session: CaptureSession): void {
  notifyTab(tabId, {
    kind: 'navtour:inject-toolbar',
    demoName: session.demoName,
    demoId: session.demoId,
    frameCount: session.frameCount,
    tabId,
  });
}

// ── Badge management ────────────────────────────────────────────────

function updateBadge(tabId: number, frameCount: number): void {
  chrome.action.setBadgeText({ text: String(frameCount), tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#4361ee', tabId });
}

function clearBadge(tabId: number): void {
  chrome.action.setBadgeText({ text: '', tabId });
}

// ── Session management ──────────────────────────────────────────────

async function startSession(tabId: number, data: any): Promise<CaptureSession> {
  const session: CaptureSession = {
    tabId,
    token: data.token,
    demoId: data.demoId,
    demoName: data.demoName || 'Untitled',
    frameCount: data.frameCount || 0,
    frames: [],
    settings: data.settings || {},
    cxtFeatureFlags: data.cxtFeatureFlags,
    workspaceSlug: data.workspaceSlug,
  };

  activeSessions.set(tabId, session);
  await addCorsRule(tabId);
  updateBadge(tabId, session.frameCount);

  console.log(`[NavTour Worker] Session started: tab=${tabId}, demo=${session.demoName}`);
  return session;
}

async function stopSession(tabId: number): Promise<void> {
  const session = activeSessions.get(tabId);
  if (!session) return;

  activeSessions.delete(tabId);
  await removeCorsRule(tabId);
  clearBadge(tabId);

  notifyTab(tabId, { kind: 'navtour:capture-session-finish' });

  console.log(`[NavTour Worker] Session stopped: tab=${tabId}`);
}

// ── External connection handler (from NavTour web app) ──────────────

chrome.runtime.onConnectExternal.addListener((port) => {
  console.log('[NavTour Worker] External connection from:', port.sender?.origin);

  port.onMessage.addListener(async (msg) => {
    if (!msg?.kind) return;

    switch (msg.kind) {
      case 'navtour:auth-state': {
        // Web app authenticating with extension
        port.postMessage({ kind: 'navtour:auth-state', status: 'ok' });
        break;
      }

      case 'navtour:capture-session-init': {
        const tab = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = tab[0]?.id;
        if (!tabId) {
          port.postMessage({ kind: 'navtour:error', error: 'No active tab' });
          return;
        }

        const session = await startSession(tabId, msg);
        port.postMessage({
          kind: 'navtour:capture',
          tabId,
          ...session,
        });
        break;
      }

      case 'navtour:capture-start': {
        const tabId = msg.tabId;
        if (tabId && activeSessions.has(tabId)) {
          await captureTab(tabId);
        }
        break;
      }

      case 'navtour:capture-session-finish': {
        const tabId = msg.tabId;
        if (tabId) {
          await stopSession(tabId);
        }
        port.postMessage({ kind: 'navtour:capture-session-finish' });
        break;
      }

      case 'navtour:get-version': {
        const manifest = chrome.runtime.getManifest();
        port.postMessage({
          kind: 'navtour:version',
          version: manifest.version,
          name: manifest.name,
        });
        break;
      }
    }
  });
});

// ── Internal message handler (from content scripts & popup) ─────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.kind) return;

  switch (message.kind) {
    case 'navtour:checkIfActive': {
      const tabId = sender.tab?.id;
      if (tabId && activeSessions.has(tabId)) {
        const session = activeSessions.get(tabId)!;
        sendResponse({
          active: true,
          tabId,
          data: {
            token: session.token,
            demoId: session.demoId,
            demoName: session.demoName,
            frameCount: session.frameCount,
            settings: session.settings,
            cxtFeatureFlags: session.cxtFeatureFlags,
          },
        });
      } else {
        sendResponse({ active: false });
      }
      break;
    }

    case 'navtour:get-version': {
      const manifest = chrome.runtime.getManifest();
      sendResponse({
        kind: 'navtour:version',
        version: manifest.version,
        name: manifest.name,
      });
      break;
    }

    case 'navtour:resize-window': {
      const windowId = sender.tab?.windowId;
      if (windowId) {
        chrome.windows.update(windowId, {
          width: message.width,
          height: message.height,
        });
      }
      sendResponse({ success: true });
      break;
    }

    case 'navtour:screenshot': {
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.tabs.captureVisibleTab(
          sender.tab!.windowId!,
          { format: 'png' },
          (dataUrl) => {
            sendResponse({ success: !!dataUrl, dataUrl });
          }
        );
        return true; // async
      }
      sendResponse({ success: false });
      break;
    }

    case 'navtour:fetch-url': {
      fetchExternalResource(message.url)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true; // async
    }

    case 'navtour:resource-manager:add-url': {
      const session = findSessionByTabId(sender.tab?.id);
      if (session) {
        fetchAndUploadResource(session.token, message.url)
          .then((result) => sendResponse(result))
          .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
        return true;
      }
      sendResponse({ success: false, error: 'No active session' });
      break;
    }

    case 'navtour:save-web-capture': {
      const tabId = sender.tab?.id;
      if (tabId && activeSessions.has(tabId)) {
        captureTab(tabId)
          .then(() => sendResponse({ success: true }))
          .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
        return true;
      }
      sendResponse({ success: false, error: 'No active session' });
      break;
    }

    // Popup messages
    case 'navtour:popup:get-state': {
      const states: any[] = [];
      activeSessions.forEach((s) => states.push({ ...s }));
      sendResponse({ sessions: states });
      break;
    }

    case 'navtour:popup:start-capture': {
      handlePopupStartCapture(message)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    case 'navtour:popup:stop-capture': {
      const tabId = message.tabId;
      const demoId = message.demoId;
      if (tabId) {
        stopSession(tabId)
          .then(() => {
            const editorUrl = demoId
              ? `${getAppUrl()}/demos/${demoId}/edit`
              : undefined;
            sendResponse({ success: true, editorUrl });
          })
          .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
        return true;
      }
      sendResponse({ success: false });
      break;
    }

    case 'navtour:popup:manual-capture': {
      const tabId = message.tabId;
      if (tabId && activeSessions.has(tabId)) {
        const session = activeSessions.get(tabId)!;
        if (session.mode === 'screenshot') {
          captureScreenshot(tabId)
            .then(() => sendResponse({ success: true, frameCount: session.frameCount }))
            .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
        } else {
          captureTab(tabId)
            .then(() => sendResponse({ success: true }))
            .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
        }
        return true;
      }
      sendResponse({ success: false, error: 'No active session' });
      break;
    }

    // ── Screenshot mode handlers ─────────────────────────────

    case 'navtour:popup:start-screenshot': {
      handlePopupStartScreenshot(message)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    case 'navtour:popup:take-screenshot': {
      const tabId = message.tabId;
      if (tabId && activeSessions.has(tabId)) {
        captureScreenshot(tabId)
          .then(() => {
            const session = activeSessions.get(tabId);
            sendResponse({ success: true, frameCount: session?.frameCount });
          })
          .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
        return true;
      }
      sendResponse({ success: false, error: 'No active session' });
      break;
    }

    // ── Video mode handlers ──────────────────────────────────

    case 'navtour:popup:start-video': {
      handlePopupStartVideo(message)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    case 'navtour:popup:start-video-recording': {
      const tabId = message.tabId;
      handleStartVideoRecording(tabId)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    case 'navtour:popup:stop-video-recording': {
      const tabId = message.tabId;
      handleStopVideoRecording(tabId)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    case 'navtour:popup:download-video': {
      // Video download is triggered automatically when recording stops
      sendResponse({ success: true });
      break;
    }

    case 'navtour:offscreen:recording-ready': {
      // Offscreen doc finished assembling the recording — trigger download
      const { url, size } = message;
      const session = [...activeSessions.values()].find((s) => s.mode === 'video');
      const filename = session
        ? `${session.demoName}-${Date.now()}.webm`
        : `navtour-recording-${Date.now()}.webm`;
      chrome.downloads.download({
        url,
        filename,
        saveAs: true,
      });
      sendResponse({ success: true });
      break;
    }

    case 'navtour:popup:login': {
      handlePopupLogin(message)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    case 'navtour:popup:get-demos': {
      handlePopupGetDemos(message.token)
        .then((result) => sendResponse(result))
        .catch((e) => sendResponse({ success: false, error: (e as Error).message }));
      return true;
    }

    // ── Panel message handlers ──────────────────────────────

    case 'navtour:panel-request-frames': {
      const sess = findSessionByTabId(sender.tab?.id);
      sendResponse({ success: true, frames: sess?.frames || [] });
      break;
    }

    case 'navtour:panel-delete-frame': {
      const sess = findSessionByTabId(sender.tab?.id);
      if (sess && message.frameIndex !== undefined) {
        const idx = sess.frames.findIndex((f) => f.index === message.frameIndex);
        if (idx >= 0) {
          const removed = sess.frames.splice(idx, 1)[0];
          sess.frameCount = Math.max(0, sess.frameCount - 1);
          // Delete from API if we have a frameId
          if (removed.frameId) {
            fetch(`${getApiUrl()}/frames/${removed.frameId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${sess.token}` },
            }).catch(() => {});
          }
          sendResponse({ success: true, frameCount: sess.frameCount });
          updateBadge(sess.tabId, sess.frameCount);
          return;
        }
      }
      sendResponse({ success: false });
      break;
    }

    case 'navtour:panel-save-step': {
      const sess = findSessionByTabId(sender.tab?.id);
      if (sess && message.frameIndex !== undefined) {
        const frame = sess.frames.find((f) => f.index === message.frameIndex);
        if (frame) {
          frame.stepType = message.stepType;
          frame.stepText = message.stepText;
          frame.title = message.title || frame.title;
          sendResponse({ success: true });
          return;
        }
      }
      sendResponse({ success: false });
      break;
    }
  }
});

// ── Popup-specific handlers ─────────────────────────────────────────

async function handlePopupLogin(msg: any): Promise<any> {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    token: '', // No auth needed for login
    body: { email: msg.email, password: msg.password },
  }).catch(async (e) => {
    // Try without auth header
    const res = await fetch(`${getApiUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: msg.email, password: msg.password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    return res.json();
  });

  return { success: true, ...response };
}

async function handlePopupGetDemos(token: string): Promise<any> {
  const demos = await apiCall('/demos', { token });
  return { success: true, demos };
}

async function handlePopupStartCapture(msg: any): Promise<any> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { success: false, error: 'No active tab' };

  // Inject content scripts FIRST, before starting session
  await ensureContentScripts(tab.id);

  const session = await startSession(tab.id, {
    token: msg.token,
    demoId: msg.demoId,
    demoName: msg.demoName,
    frameCount: msg.frameCount || 0,
    settings: msg.settings || {},
  });

  // Small delay to let content scripts initialize, then inject toolbar
  setTimeout(() => injectToolbarInTab(tab.id!, session), 300);

  return { success: true, tabId: tab.id, ...session };
}

async function handlePopupStartScreenshot(msg: any): Promise<any> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { success: false, error: 'No active tab' };

  // Screenshot mode: no content scripts or toolbar needed
  const session = await startSession(tab.id, {
    token: msg.token,
    demoId: msg.demoId,
    demoName: msg.demoName,
    frameCount: msg.frameCount || 0,
    settings: {},
  });
  session.mode = 'screenshot';

  return { success: true, tabId: tab.id, ...session };
}

async function handlePopupStartVideo(msg: any): Promise<any> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { success: false, error: 'No active tab' };

  // Video mode: create session, recording starts when user clicks record
  const session = await startSession(tab.id, {
    token: msg.token,
    demoId: msg.demoId,
    demoName: msg.demoName,
    frameCount: 0,
    settings: {},
  });
  session.mode = 'video';

  return { success: true, tabId: tab.id, ...session };
}

async function handleStartVideoRecording(tabId: number): Promise<any> {
  const session = activeSessions.get(tabId);
  if (!session || session.mode !== 'video') {
    return { success: false, error: 'No active video session' };
  }

  try {
    // Get a media stream ID for the tab
    const streamId = await (chrome.tabCapture as any).getMediaStreamId({
      targetTabId: tabId,
    });

    // Ensure offscreen document exists (with updated reasons for media)
    await ensureOffscreenDocument();

    // Tell the offscreen document to start recording
    const result = await chrome.runtime.sendMessage({
      kind: 'navtour:offscreen:start-recording',
      streamId,
    });

    return { success: result?.success ?? false, error: result?.error };
  } catch (e) {
    console.error('[NavTour Worker] Failed to start video recording:', e);
    return { success: false, error: (e as Error).message };
  }
}

async function handleStopVideoRecording(tabId: number): Promise<any> {
  try {
    const result = await chrome.runtime.sendMessage({
      kind: 'navtour:offscreen:stop-recording',
    });
    return { success: result?.success ?? true };
  } catch (e) {
    console.error('[NavTour Worker] Failed to stop video recording:', e);
    return { success: false, error: (e as Error).message };
  }
}

/** Ensure content scripts are ready, inject once if not present */
async function ensureContentScripts(tabId: number): Promise<void> {
  // First check if manifest-injected scripts are already responding
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { kind: 'navtour:get-page-info' });
      if (response?.title) return; // Already ready
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Scripts not responding after 900ms — inject once as fallback
  console.log('[NavTour Worker] Injecting content scripts for tab:', tabId);
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['content-script-main.js'],
      world: 'MAIN' as any,
    });
  } catch {}
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['content-script-isolated.js'],
    });
  } catch {}

  // Wait for injected scripts to initialize
  await new Promise(resolve => setTimeout(resolve, 500));
}

// ── Resource fetching ───────────────────────────────────────────────

async function fetchExternalResource(
  url: string
): Promise<{ success: boolean; data?: string; contentType?: string; error?: string }> {
  try {
    const response = await fetch(url, { credentials: 'include' });
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || blob.type;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ success: true, data: reader.result as string, contentType });
      reader.onerror = () => resolve({ success: false, error: 'Failed to read blob' });
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function fetchAndUploadResource(
  token: string,
  url: string
): Promise<{ success: boolean; uploadedUrl?: string; error?: string }> {
  const fetched = await fetchExternalResource(url);
  if (!fetched.success || !fetched.data) {
    return { success: false, error: fetched.error || 'Failed to fetch' };
  }

  const result = await uploadResource(token, url, fetched.data, fetched.contentType || '');
  return { success: true, uploadedUrl: result.url };
}

function findSessionByTabId(tabId?: number): CaptureSession | undefined {
  if (tabId === undefined) return undefined;
  return activeSessions.get(tabId);
}

// ── Tab lifecycle tracking ──────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeSessions.has(tabId)) {
    activeSessions.delete(tabId);
    removeCorsRule(tabId);
    console.log(`[NavTour Worker] Tab closed, session cleaned up: ${tabId}`);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!activeSessions.has(tabId)) return;

  const session = activeSessions.get(tabId)!;

  // On page load complete, wait for manifest-injected scripts then inject toolbar
  // Skip toolbar/auto-capture for screenshot and video modes
  if (changeInfo.status === 'complete' && session.mode !== 'screenshot' && session.mode !== 'video') {
    setTimeout(async () => {
      if (!activeSessions.has(tabId)) return;

      // Wait for manifest-injected content scripts (don't re-inject)
      for (let i = 0; i < 5; i++) {
        try {
          const r = await chrome.tabs.sendMessage(tabId, { kind: 'navtour:get-page-info' });
          if (r?.title) break;
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Inject toolbar (content script removes old one first)
      if (activeSessions.has(tabId)) {
        injectToolbarInTab(tabId, session);
      }

      // Auto-capture if not in click-to-capture mode
      if (session.settings.clickToCapture === false) {
        setTimeout(() => {
          if (activeSessions.has(tabId)) captureTab(tabId);
        }, 1000);
      }
    }, 500);
  }
});

// Note: SPA navigation is handled by onUpdated above — no separate
// onHistoryStateUpdated listener needed (it would cause duplicate captures).

// ── Startup ─────────────────────────────────────────────────────────

console.log('[NavTour Worker] Service worker started, version:', chrome.runtime.getManifest().version);
