/**
 * Check If Active — mirrors Navattic's check-if-active.js
 * On page load, checks with background if capture session is active for this tab.
 * If active, restores capture state in sessionStorage and notifies content scripts.
 */

import { session } from './lib/storage';
import {
  CAPTURE_OPEN_KEY, CAPTURE_MODE_KEY, CAPTURING_ENABLED_KEY,
  CLICK_TO_CAPTURE_PAUSED_KEY, GENERATE_SANDBOX_KEY,
  DOWNLOAD_RESTRICTIONS_KEY, SERVICE_WORKER_DOWNLOADS_KEY,
  SANDBOX_HIGHLIGHTS_DISABLED_KEY, ACTIVE_TAB_KEY,
  FeatureFlags,
} from './lib/constants';
import { createPrefixedLogger, red } from './lib/logger';

const logger = createPrefixedLogger({ pre: red('check-if-active:') });

const activeTabs = new Map<number, any>();

interface CaptureData {
  tabId?: number;
  settings: CaptureSettings;
  cxtFeatureFlags?: string[];
  [key: string]: any;
}

interface CaptureSettings {
  clickToCapture?: boolean;
  clickToCapturePaused?: boolean;
  generateSandbox?: boolean;
  allowSw?: boolean;
  disableHTMLPatch?: boolean;
  enableDownloadRestrictions?: boolean;
}

function isAlreadyActive(data: CaptureData): boolean {
  return data.tabId != null && activeTabs.has(data.tabId);
}

function storeCapture(data: CaptureData): void {
  if (data.tabId !== undefined) {
    activeTabs.set(data.tabId, data);
  }

  // Post to content scripts with delay (mirrors Navattic's 200ms + 2500ms pattern)
  setTimeout(() => {
    window.postMessage({ ...data, kind: 'navtour:capture' }, '*');
  }, 200);
  setTimeout(() => {
    window.postMessage({ ...data, kind: 'navtour:capture' }, '*');
  }, 2500);

  session.setItem(CAPTURE_OPEN_KEY, JSON.stringify(data));
}

function applySettings(settings: CaptureSettings): void {
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

  session.setItem(
    GENERATE_SANDBOX_KEY,
    settings.generateSandbox ? 'true' : 'false'
  );

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

function activateCapture(data: CaptureData): void {
  if (isAlreadyActive(data)) return;
  session.setItem(ACTIVE_TAB_KEY, 'true');
  storeCapture(data);
  applySettings(data.settings);
}

function handleActiveResponse(data: CaptureData): void {
  session.setItem(CAPTURING_ENABLED_KEY, 'true');

  if (data.cxtFeatureFlags) {
    if (data.cxtFeatureFlags.includes(FeatureFlags.ServiceWorkerDownloads)) {
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
}

function checkIfActive(): void {
  chrome.runtime.sendMessage({ kind: 'navtour:checkIfActive' }, (response) => {
    if (response?.active) {
      const data: CaptureData = { tabId: response.tabId, ...response.data };
      activateCapture(data);
      handleActiveResponse(data);
    }
  });
}

function init(): void {
  try {
    if (!session.getItem(ACTIVE_TAB_KEY)) {
      checkIfActive();
    }
  } catch (e) {
    logger.error('Error checking if active:', e);
  }
}

init();
