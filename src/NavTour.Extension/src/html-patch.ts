/**
 * HTML Patch — mirrors Navattic's html-patch.js
 * Handles CSP bypass by re-fetching and rewriting the page HTML,
 * removing inline CSP meta tags, fixing iframe sandboxes, and
 * setting crossOrigin on media elements.
 * Runs in MAIN world.
 *
 * NOTE: Uses document.open/write/close intentionally — this is the same
 * pattern Navattic uses to bypass Content-Security-Policy meta tags that
 * block extension resource loading. This is NOT user-supplied content;
 * it's the page's own HTML re-fetched via synchronous XHR and sanitized.
 */

import { session, combined, getCspViolation, setCspViolation } from './lib/storage';
import {
  SERVICE_WORKER_DOWNLOADS_KEY, ACTIVE_TAB_KEY, ADD_WINDOW_LISTENERS,
} from './lib/constants';
import { createPrefixedLogger, red } from './lib/logger';
import { getApiUrl } from './lib/constants';

const NATIVE_FN_RE = /\(\s*\)\s+\{\s+\[native code\]\s+\}\s*$/;

const logger = createPrefixedLogger({ pre: red('html-patch:') });

// ── HTML sanitization helpers ───────────────────────────────────────

function isSameOrigin(src: string, doc: Document | Element): boolean {
  try {
    const docLike = 'location' in doc ? doc : (doc as any).ownerDocument;
    return new URL(src).origin === docLike.location.origin;
  } catch {
    return false;
  }
}

function allMediaCrossOriginSafe(el: Element): boolean {
  const media = el.querySelectorAll('video, img, audio');
  for (const m of media) {
    const co = m.getAttribute('crossorigin');
    if (!isSameOrigin((m as HTMLMediaElement).src, el) && co !== 'use-credentials') {
      return false;
    }
  }
  return true;
}

function setCrossOriginOnMedia(el: Element): void {
  for (const tag of ['video', 'img', 'audio'] as const) {
    const elements = el.querySelectorAll(tag);
    for (const m of elements) {
      if (m.getAttribute('crossorigin') !== 'use-credentials') {
        const clone = m.cloneNode(true) as Element;
        clone.setAttribute('crossorigin', 'use-credentials');
        m.replaceWith(clone);
      }
    }
  }
}

function fixIframeSandboxes(doc: Document): void {
  const iframes = doc.querySelectorAll('iframe[sandbox]');
  for (const iframe of iframes) {
    const sandbox = iframe.getAttribute('sandbox')!;
    if (!sandbox.includes('allow-scripts')) {
      iframe.setAttribute(
        'sandbox',
        [...new Set([...sandbox.split(' '), 'allow-scripts'])].join(' ').trim()
      );
    }
  }
}

function removeCspMetaTags(doc: Document): void {
  if (session.getItem(SERVICE_WORKER_DOWNLOADS_KEY)) {
    logger.debug('Service Worker Downloads flag enabled, not removing meta tags');
    return;
  }
  const tags = doc.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]');
  for (const tag of tags) tag.remove();
}

function sanitizeHtml(doc: Document): void {
  removeCspMetaTags(doc);
  fixIframeSandboxes(doc);
  setCrossOriginOnMedia(doc);
}

/**
 * Parse and sanitize raw HTML string, returns clean HTML.
 */
export function patchHtmlString(rawHtml: string): string {
  let html = rawHtml;
  if (window.location.hostname === 'outlook.live.com') {
    html = html.replace('<noscript>JavaScript must be enabled.</noscript>', '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  sanitizeHtml(doc);
  const doctype = doc.doctype
    ? new XMLSerializer().serializeToString(doc.doctype)
    : '';
  return `${doctype}${doc.documentElement.outerHTML}`;
}

// ── Page HTML rewrite (CSP bypass) ──────────────────────────────────
// This uses document.open/write/close intentionally — exact same technique
// as Navattic's extension. The HTML is the page's own response, re-fetched
// via XHR and sanitized to remove CSP meta tags that block extension features.

function rewritePageHtml(): void {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', window.location.href, false); // sync XHR
  xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
  xhr.send();
  if (xhr.readyState !== XMLHttpRequest.DONE) return;

  const patched = patchHtmlString(xhr.responseText);
  const isNativeOpen = NATIVE_FN_RE.test(document.open.toString());

  // Intentional document.open/write/close for full-page CSP bypass
  // (same pattern as Navattic's production extension)
  const openFn = document.open.bind(document);
  const writeFn = (document as any).write.bind(document);
  const closeFn = document.close.bind(document);
  openFn();
  writeFn(patched);
  closeFn();

  if (isNativeOpen) {
    const listeners = (window as any)[ADD_WINDOW_LISTENERS];
    logger.debug("document.open hasn't been patched", listeners);
    listeners?.forEach((fn: () => void) => fn());
  } else {
    logger.debug('document.open has been patched');
  }
}

// ── CSP violation detection ─────────────────────────────────────────

function triggerCspProbe(): void {
  setTimeout(() => {
    fetch(`${getApiUrl()}/resources/hashcheck/test`, {
      method: 'POST',
      headers: [['content-type', 'text/plain']] as any,
    }).catch(() => {});
    fetch(`${getApiUrl()}/demos/create`, { method: 'OPTIONS' }).catch(() => {});
  }, 50);
}

function setupCspDetection(): void {
  if (session.getItem(SERVICE_WORKER_DOWNLOADS_KEY)) {
    logger.debug('Service Worker Downloads flag enabled, skipping CSP check');
    return;
  }
  if (!getCspViolation()) {
    document.addEventListener(
      'securitypolicyviolation',
      () => {
        setCspViolation(true);
        document.location.reload();
      },
      { once: true }
    );
    triggerCspProbe();
  }
}

function hasSandboxedIframesWithoutScripts(): boolean {
  const iframes = document.querySelectorAll('iframe[sandbox]');
  for (const iframe of iframes) {
    if (!iframe.getAttribute('sandbox')!.includes('allow-scripts')) return true;
  }
  return false;
}

function checkSandboxedIframes(): void {
  if (hasSandboxedIframesWithoutScripts()) {
    setCspViolation(true);
    document.location.reload();
  }
}

function checkCrossOriginMedia(): void {
  if (!allMediaCrossOriginSafe(document as any)) {
    setCspViolation(true);
    document.location.reload();
  }
}

// ── On-load queue ───────────────────────────────────────────────────

const onLoadQueue: (() => void)[] = [];
function onLoad(fn: () => void): void {
  if (document.readyState === 'complete') fn();
  else onLoadQueue.push(fn);
}
function onReadyStateChange(): void {
  if (document.readyState === 'complete') {
    document.removeEventListener('readystatechange', onReadyStateChange);
    onLoadQueue.forEach((fn) => fn());
    onLoadQueue.splice(0);
  }
}
document.addEventListener('readystatechange', onReadyStateChange);

// ── Initialize ──────────────────────────────────────────────────────

function init(): void {
  try {
    if (combined.getItem('debug:navtour:disable-patch:html')) return;
    if (session.getItem(ACTIVE_TAB_KEY) && getCspViolation()) {
      rewritePageHtml();
    }
    onLoad(() => {
      if (window.location.href === 'about:blank' || window.location.href === 'about:srcdoc') {
        logger.debug('Skipping HTML patch for about:blank or about:srcdoc');
        return;
      }
      if (session.getItem(ACTIVE_TAB_KEY)) {
        checkCrossOriginMedia();
        setupCspDetection();
        checkSandboxedIframes();
      }
    });
  } catch (e) {
    logger.error('Error setting up inline CSP check:', e);
  }
}

init();
