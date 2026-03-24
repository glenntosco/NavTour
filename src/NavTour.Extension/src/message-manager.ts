/**
 * Message Manager — mirrors Navattic's message-manager.js
 * Relays messages between window.postMessage (content scripts) and
 * chrome.runtime.sendMessage (background worker). Runs in ISOLATED world.
 */

import { session, clearCaptureState } from './lib/storage';
import {
  CAPTURE_OPEN_KEY, CAPTURE_MODE_KEY, CAPTURING_ENABLED_KEY,
  CLICK_TO_CAPTURE_PAUSED_KEY, GENERATE_SANDBOX_KEY,
  DOWNLOAD_RESTRICTIONS_KEY, SERVICE_WORKER_DOWNLOADS_KEY,
  SANDBOX_HIGHLIGHTS_DISABLED_KEY, ACTIVE_TAB_KEY,
  ADD_WINDOW_LISTENERS, ALLOWED_ORIGINS,
  FeatureFlags,
} from './lib/constants';
import {
  isNavTourMessage, stampMessage, NavTourMessage, hasMessageId,
} from './lib/messages';
import { createPrefixedLogger, red } from './lib/logger';

const logger = createPrefixedLogger({ pre: red('message-manager:') });

const activeTabs = new Map<number, any>();

// ── Window → Worker relay ───────────────────────────────────────────

function handleWindowMessage(event: MessageEvent): void {
  const { data, source, origin } = event;

  // Only trusted messages from same window or allowed origins
  if (!event.isTrusted || !source) return;
  if (source !== window && !ALLOWED_ORIGINS.includes(origin)) return;
  if (!isNavTourMessage(data)) return;

  try {
    routeToWorker(data, source as Window, origin);
  } catch (e: any) {
    if (e?.message === 'Extension context invalidated.') {
      window.removeEventListener('message', handleWindowMessage);
    }
  }
}

function routeToWorker(
  msg: NavTourMessage,
  source: Window,
  origin: string
): void {
  switch (msg.kind) {
    case 'navtour:requestTabUrls': {
      chrome.runtime.sendMessage(msg, (response) => {
        if (response?.requestedUrls || response?.redirectedUrls) {
          source.postMessage(
            { ...msg, ...response, kind: 'navtourjs:requestTabUrls' },
            { targetOrigin: '*' }
          );
        }
      });
      break;
    }

    // All these message types relay directly to the worker
    case 'navtour:auth-request':
    case 'navtour:auth-status-request':
    case 'navtour:auth-state':
    case 'navtour:get-version':
    case 'navtour:capture-start':
    case 'navtour:screenshot':
    case 'navtour:screenshot-capture':
    case 'navtour:upload-static-resource':
    case 'navtour:process-and-upload-web-capture':
    case 'navtour:fetch-url':
    case 'navtour:resource-manager:add-url':
    case 'navtour:resource-manager:add-resource':
    case 'navtour:save-web-capture':
    case 'navtour:set-click-to-capture-mode':
    case 'navtour:set-capture-type':
    case 'navtour:logtail-sync':
    case 'navtour:telemetry':
    case 'navtour:workspaceSlug-request':
    case 'navtour:workspaceSlug-response':
    case 'navtour:screenshot-selector':
    case 'navtour:capture-session-init':
    case 'navtour:capture-details-request':
    case 'navtour:capture-details':
    case 'navtour:update-capture':
    case 'navtour:capture-session-finish': {
      chrome.runtime.sendMessage(msg, handleWorkerResponse);
      break;
    }
  }
}

// ── Worker → Window relay ───────────────────────────────────────────

function handleWorkerResponse(response: any): void {
  if (!response) return;

  switch (response.kind) {
    case 'navtour:capture-session-finish': {
      finishCapture();
      break;
    }

    case 'navtour:log': {
      console.log(red('worker:'), response.message);
      break;
    }

    case 'navtour:capture': {
      activateCapture(response);
      session.setItem(CAPTURING_ENABLED_KEY, 'true');

      if (response.cxtFeatureFlags) {
        if (response.cxtFeatureFlags.includes(FeatureFlags.ServiceWorkerDownloads)) {
          session.setItem(SERVICE_WORKER_DOWNLOADS_KEY, 'true');
        } else {
          session.removeItem(SERVICE_WORKER_DOWNLOADS_KEY);
        }
      }

      const hideHighlights = session.getItem(SANDBOX_HIGHLIGHTS_DISABLED_KEY) === 'true';
      window.postMessage({
        kind: 'navtour:update-sandbox-highlights',
        hideHighlights,
      }, '*');
      break;
    }

    case 'navtour:apply-settings': {
      applySettings(response.settings);
      break;
    }

    default: {
      if (isNavTourMessage(response)) {
        window.postMessage(stampMessage(response));
      }
      break;
    }
  }
}

// Also listen for worker-initiated messages
chrome.runtime.onMessage.addListener(handleWorkerResponse);

// ── Capture state management ────────────────────────────────────────

function isAlreadyActive(data: any): boolean {
  return data.tabId != null && activeTabs.has(data.tabId);
}

function storeCapture(data: any): void {
  if (data.tabId !== undefined) {
    activeTabs.set(data.tabId, data);
  }

  setTimeout(() => {
    window.postMessage({ ...data, kind: 'navtour:capture' }, '*');
  }, 2500);
  setTimeout(() => {
    window.postMessage({ ...data, kind: 'navtour:capture' }, '*');
  }, 200);

  session.setItem(CAPTURE_OPEN_KEY, JSON.stringify(data));
}

function activateCapture(data: any): void {
  if (isAlreadyActive(data)) return;
  session.setItem(ACTIVE_TAB_KEY, 'true');
  storeCapture(data);
  applySettings(data.settings);
}

function applySettings(settings: any): void {
  session.setItem(
    CAPTURE_MODE_KEY,
    settings.clickToCapture ? 'onClick' : 'modifier'
  );

  if (settings.clickToCapture) {
    session.setItem(CLICK_TO_CAPTURE_PAUSED_KEY, `${settings.clickToCapturePaused}`);
  }

  window.postMessage({
    kind: 'navtour:sync-click-to-capture-mode',
    clickToCapture: settings.clickToCapture,
  }, '*');

  session.setItem(GENERATE_SANDBOX_KEY, settings.generateSandbox ? 'true' : 'false');

  if (settings.allowSw) {
    session.setItem('debug:navtour:allow-sw', `${settings.allowSw}`);
  } else {
    session.removeItem('debug:navtour:allow-sw');
  }

  if (settings.disableHTMLPatch) {
    session.setItem('debug:navtour:disable-patch:html', `${settings.disableHTMLPatch}`);
  } else {
    session.removeItem('debug:navtour:disable-patch:html');
  }

  if (settings.enableDownloadRestrictions) {
    session.setItem(DOWNLOAD_RESTRICTIONS_KEY, `${settings.enableDownloadRestrictions}`);
  } else {
    session.removeItem(DOWNLOAD_RESTRICTIONS_KEY);
  }
}

function finishCapture(): void {
  const captureData = session.getItem(CAPTURE_OPEN_KEY);
  session.removeItem(CAPTURING_ENABLED_KEY);
  session.removeItem(ACTIVE_TAB_KEY);
  session.removeItem(CAPTURE_OPEN_KEY);
  session.removeItem(CAPTURE_MODE_KEY);
  session.removeItem(CLICK_TO_CAPTURE_PAUSED_KEY);
  session.removeItem('navtour:video-capture');
  session.removeItem(GENERATE_SANDBOX_KEY);
  session.removeItem('debug:navtour:allow-sw');
  session.removeItem('debug:navtour:disable-patch:html');

  if (captureData) {
    try {
      const { tabId } = JSON.parse(captureData);
      activeTabs.delete(tabId);
    } catch {}
  }
}

// ── Initialize ──────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollAddListener(): Promise<void> {
  let count = 5;
  while (count > 0) {
    window.addEventListener('message', handleWindowMessage);
    count--;
    await sleep(1000);
  }
}

function init(): void {
  pollAddListener();
}

// Register as persistent listener (survives document.open)
(window as any)[ADD_WINDOW_LISTENERS] ??= [];
(window as any)[ADD_WINDOW_LISTENERS]?.push(pollAddListener);

init();
