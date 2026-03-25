/**
 * Content Script — ISOLATED World
 * Mirrors Navattic's content-script-isolated.js architecture.
 *
 * Responsibilities:
 * - DOM serialization (full page capture)
 * - Resource collection (stylesheets, images, fonts)
 * - Shadow DOM traversal and serialization
 * - Cross-origin resource fetching
 * - Communication bridge between MAIN world and service worker
 *
 * This runs in Chrome's isolated world, so it has access to chrome.* APIs
 * but NOT to page JavaScript globals.
 */

import {
  DYNAMIC_STYLE_MAP, INJECTED_FONTS, SERIALIZED_INJECTED_FONTS,
  IS_SALESFORCE, SHADOW_ID_ATTR, MESSAGE_ID_KEY,
} from './lib/constants';
import { session } from './lib/storage';
import { createPrefixedLogger, red } from './lib/logger';
import {
  injectToolbar, updateToolbarCount, removeToolbar,
  createCapturesPanel, addFrameToPanel, togglePanel, removeCapturesPanel,
} from './lib/toolbar';
import type { PanelCallbacks } from './lib/toolbar';

const logger = createPrefixedLogger({ pre: red('capture:') });

// ── Resource collection ─────────────────────────────────────────────

interface CollectedResource {
  url: string;
  type: 'stylesheet' | 'image' | 'font' | 'script' | 'other';
  content?: string;
  dataUrl?: string;
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
    });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function fetchStylesheetText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
    });
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Collect all stylesheets from the document (inline + linked)
 */
function collectStylesheets(doc: Document): Array<{ href: string | null; cssText: string | null }> {
  const sheets: Array<{ href: string | null; cssText: string | null }> = [];

  for (let i = 0; i < doc.styleSheets.length; i++) {
    const sheet = doc.styleSheets.item(i);
    if (!sheet) continue;

    const href = sheet.href;
    let cssText: string | null = null;

    try {
      // Try to read CSS rules directly (same-origin sheets)
      const rules = sheet.cssRules;
      cssText = '';
      for (let j = 0; j < rules.length; j++) {
        cssText += rules[j].cssText + '\n';
      }
    } catch {
      // Cross-origin sheet — will need to fetch separately
      cssText = null;
    }

    sheets.push({ href, cssText });
  }

  return sheets;
}

/**
 * Absolutize a URL relative to the page
 */
function absolutize(url: string, baseUrl?: string): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#')) {
    return url;
  }
  try {
    return new URL(url, baseUrl || document.baseURI).href;
  } catch {
    return url;
  }
}

/**
 * Absolutize all URLs in CSS text
 */
function absolutizeCssUrls(cssText: string, baseUrl: string): string {
  return cssText.replace(
    /url\(\s*(['"]?)(.+?)\1\s*\)/g,
    (match, quote, url) => {
      const abs = absolutize(url.trim(), baseUrl);
      return `url(${quote}${abs}${quote})`;
    }
  );
}

// ── DOM serialization ───────────────────────────────────────────────

interface SerializeOptions {
  includeStyles?: boolean;
  includeShadowDom?: boolean;
}

/**
 * Get computed styles as inline CSS text
 */
function getComputedStyleText(el: Element): string {
  const styles = window.getComputedStyle(el);
  let text = '';
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i];
    const value = styles.getPropertyValue(prop);
    if (value) {
      text += `${prop}:${value};`;
    }
  }
  return text;
}

/**
 * Serialize a shadow root to HTML string
 */
function serializeShadowRoot(shadowRoot: ShadowRoot): string {
  let html = '<template shadowrootmode="open">';

  // Serialize adopted stylesheets
  for (const sheet of shadowRoot.adoptedStyleSheets) {
    let cssText = '';
    try {
      for (let i = 0; i < sheet.cssRules.length; i++) {
        cssText += sheet.cssRules[i].cssText + '\n';
      }
    } catch {}
    if (cssText) {
      html += `<style>${cssText}</style>`;
    }
  }

  // Serialize child nodes
  html += shadowRoot.innerHTML;
  html += '</template>';
  return html;
}

/**
 * Clone and serialize the full document
 */
function serializeDocument(): string {
  const doctype = document.doctype
    ? new XMLSerializer().serializeToString(document.doctype)
    : '<!DOCTYPE html>';

  // Clone the document
  const clone = document.documentElement.cloneNode(true) as HTMLElement;

  // Remove NavTour toolbar from the capture (don't serialize our own UI)
  const toolbar = clone.querySelector('#__navtour_capture_toolbar__');
  toolbar?.remove();
  const toolbarStyle = clone.querySelector('#__navtour_capture_toolbar___style');
  toolbarStyle?.remove();

  // Process shadow roots in the clone
  const shadowHosts = clone.querySelectorAll(`[${SHADOW_ID_ATTR}]`);
  // Note: Shadow roots on clones are lost, handled by dynamic style map

  return `${doctype}\n${clone.outerHTML}`;
}

// ── Canvas capture ──────────────────────────────────────────────────

function captureCanvases(doc: Document): Map<number, string> {
  const canvases = doc.querySelectorAll('canvas');
  const result = new Map<number, string>();
  canvases.forEach((canvas, index) => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl !== 'data:,') {
        result.set(index, dataUrl);
      }
    } catch {
      // Canvas tainted — skip
    }
  });
  return result;
}

// ── Full page capture (main entry point) ────────────────────────────

export interface CaptureResult {
  html: string;
  title: string;
  url: string;
  stylesheets: Array<{ href: string | null; cssText: string | null }>;
  canvases: Map<number, string>;
  timestamp: number;
}

async function captureFullPage(): Promise<CaptureResult> {
  const stylesheets = collectStylesheets(document);

  // Fetch cross-origin stylesheets
  for (const sheet of stylesheets) {
    if (sheet.href && sheet.cssText === null) {
      const text = await fetchStylesheetText(sheet.href);
      if (text) {
        sheet.cssText = absolutizeCssUrls(text, sheet.href);
      }
    }
  }

  const html = serializeDocument();
  const canvases = captureCanvases(document);

  return {
    html,
    title: document.title,
    url: window.location.href,
    stylesheets,
    canvases,
    timestamp: Date.now(),
  };
}

// ── Message handling ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.kind) return;

  switch (message.kind) {
    case 'navtour:capture-page': {
      captureFullPage()
        .then((result) => {
          // Convert Map to serializable object
          const canvasObj: Record<number, string> = {};
          result.canvases.forEach((v, k) => { canvasObj[k] = v; });

          sendResponse({
            success: true,
            ...result,
            canvases: canvasObj,
          });
        })
        .catch((err) => {
          logger.error('Capture failed:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // async response
    }

    case 'navtour:get-page-info': {
      sendResponse({
        title: document.title,
        url: window.location.href,
        readyState: document.readyState,
      });
      break;
    }

    case 'navtour:inject-script': {
      // Inject a script into the MAIN world via the page
      const script = document.createElement('script');
      script.textContent = message.code;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
      sendResponse({ success: true });
      break;
    }

    case 'navtour:fetch-resource': {
      fetchAsDataUrl(message.url)
        .then((dataUrl) => sendResponse({ success: !!dataUrl, dataUrl }))
        .catch(() => sendResponse({ success: false }));
      return true;
    }

    case 'navtour:inject-toolbar': {
      // Panel callbacks
      const panelCbs: PanelCallbacks = {
        onContinue: () => togglePanel(false),
        onComplete: () => {
          chrome.runtime.sendMessage({
            kind: 'navtour:popup:stop-capture',
            tabId: message.tabId,
            demoId: message.demoId,
          }, (response) => {
            removeToolbar();
            removeCapturesPanel();
            if (response?.editorUrl) window.open(response.editorUrl, '_blank');
          });
        },
        onDeleteFrame: (index: number) => {
          chrome.runtime.sendMessage({
            kind: 'navtour:panel-delete-frame',
            frameIndex: index,
          });
        },
        onSaveStep: (index: number, stepType: string, stepText: string, title: string) => {
          chrome.runtime.sendMessage({
            kind: 'navtour:panel-save-step',
            frameIndex: index,
            stepType,
            stepText,
            title,
          });
        },
      };

      // Create panel first
      createCapturesPanel(panelCbs);

      // Inject toolbar with expand toggle
      injectToolbar(message.demoName, message.frameCount, {
        onCapture: () => {
          chrome.runtime.sendMessage({ kind: 'navtour:save-web-capture' });
        },
        onFinish: () => {
          chrome.runtime.sendMessage({
            kind: 'navtour:popup:stop-capture',
            tabId: message.tabId,
            demoId: message.demoId,
          }, (response) => {
            removeToolbar();
            removeCapturesPanel();
            if (response?.editorUrl) window.open(response.editorUrl, '_blank');
          });
        },
        onExpandToggle: () => {
          // Request frames from worker on first open
          chrome.runtime.sendMessage(
            { kind: 'navtour:panel-request-frames' },
            (response) => {
              if (response?.frames) {
                for (const frame of response.frames) {
                  addFrameToPanel(frame);
                }
              }
              togglePanel();
            }
          );
        },
      });
      sendResponse({ success: true });
      break;
    }

    case 'navtour:update-toolbar-count': {
      updateToolbarCount(message.frameCount);
      sendResponse({ success: true });
      break;
    }

    case 'navtour:remove-toolbar': {
      removeToolbar();
      sendResponse({ success: true });
      break;
    }

    case 'navtour:capture-complete': {
      if (message.frameCount !== undefined) {
        updateToolbarCount(message.frameCount);
      }
      // Add thumbnail to panel if available
      if (message.frameThumbnail) {
        addFrameToPanel(message.frameThumbnail);
      }
      break;
    }

    case 'navtour:capture-session-finish': {
      removeToolbar();
      removeCapturesPanel();
      break;
    }
  }
});

// ── Request globals from MAIN world via postMessage ─────────────────

function requestGlobals(keys: string[]): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    const msgId = (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, '');

    const handler = (event: MessageEvent) => {
      if (
        event.data?.[MESSAGE_ID_KEY] === msgId &&
        event.data?.kind === 'navtour:ack'
      ) {
        window.removeEventListener('message', handler);
        resolve(event.data.data || {});
      }
    };

    window.addEventListener('message', handler);

    window.postMessage({
      kind: 'navtour:snapshot:get-globals',
      [MESSAGE_ID_KEY]: msgId,
      keys,
    }, '*');

    // Timeout after 3s
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve({});
    }, 3000);
  });
}

logger.debug('Content script (isolated) loaded:', window.location.href);
