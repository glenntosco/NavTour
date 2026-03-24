/**
 * Content Script — MAIN World
 * Mirrors Navattic's content-script-main.js architecture.
 *
 * Responsibilities:
 * - Monkey-patch browser APIs for capture fidelity
 * - Force Shadow DOM to open mode (for serialization)
 * - Track dynamically created/modified CSS
 * - Track dynamically loaded fonts
 * - Preserve WebGL canvas drawing buffers
 * - Prevent blob URL revocation during capture
 * - Block service worker registration during capture
 * - Set crossOrigin on dynamic images
 *
 * This runs in the page's MAIN world, sharing JS context with the page.
 */

import {
  DYNAMIC_STYLE_TEXT, DYNAMIC_STYLE_UPDATES, ADD_WINDOW_LISTENERS,
  INJECTED_FONTS, NATIVE_FUNCTIONS,
} from './lib/constants';
import { session } from './lib/storage';
import { ACTIVE_TAB_KEY, SERVICE_WORKER_DOWNLOADS_KEY } from './lib/constants';
import { createDebugLogger, createPrefixedLogger, red } from './lib/logger';

const logger = createPrefixedLogger({ pre: red('main-world:') });
const debugLogger = createDebugLogger('debug:navtour:patches');

// Store native function references before patching
const nativeFunctions: Record<string, Function> = {};

function storeNative(name: string, fn: Function): void {
  nativeFunctions[name] = fn;
  (window as any)[NATIVE_FUNCTIONS] ??= {};
  (window as any)[NATIVE_FUNCTIONS][name] = fn;
}

// ── Shadow DOM — force open mode ────────────────────────────────────

function patchShadowDom(): void {
  const originalAttachShadow = Element.prototype.attachShadow;
  storeNative('attachShadow', originalAttachShadow);

  Element.prototype.attachShadow = function (init: ShadowRootInit): ShadowRoot {
    // Force open mode so content script can traverse shadow trees
    return originalAttachShadow.call(this, { ...init, mode: 'open' });
  };

  debugLogger.debug('Patched: Element.attachShadow (force open mode)');
}

// ── WebGL — preserve drawing buffer ─────────────────────────────────

function patchWebGL(): void {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  storeNative('getContext', originalGetContext);

  (HTMLCanvasElement.prototype as any).getContext = function (
    type: string,
    attrs?: any
  ): RenderingContext | null {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      attrs = { ...attrs, preserveDrawingBuffer: true };
    }
    return originalGetContext.call(this, type, attrs);
  };

  debugLogger.debug('Patched: HTMLCanvasElement.getContext (preserve drawing buffer)');
}

// ── Blob URLs — prevent revocation during capture ───────────────────

function patchBlobUrls(): void {
  const originalRevokeObjectURL = URL.revokeObjectURL;
  storeNative('revokeObjectURL', originalRevokeObjectURL);

  URL.revokeObjectURL = function (url: string): void {
    // During capture, don't revoke blob URLs — we may need them for resources
    if (session.getItem(ACTIVE_TAB_KEY)) {
      debugLogger.debug('Blocked blob URL revocation during capture:', url);
      return;
    }
    return originalRevokeObjectURL.call(this, url);
  };

  debugLogger.debug('Patched: URL.revokeObjectURL (block during capture)');
}

// ── Dynamic font tracking ───────────────────────────────────────────

function patchFontFace(): void {
  const originalAdd = FontFaceSet.prototype.add;
  storeNative('fontFaceSetAdd', originalAdd);

  (window as any)[INJECTED_FONTS] = [];

  FontFaceSet.prototype.add = function (fontFace: FontFace): FontFaceSet {
    const result = originalAdd.call(this, fontFace);

    try {
      // Track the font for serialization
      const source = (fontFace as any).$$source || '';
      (window as any)[INJECTED_FONTS].push({
        nativeFontFace: fontFace,
        family: fontFace.family,
        source,
        descriptors: {
          style: fontFace.style,
          weight: fontFace.weight,
          stretch: fontFace.stretch,
          unicodeRange: fontFace.unicodeRange,
          display: fontFace.display,
        },
      });
    } catch (e) {
      debugLogger.warn('Error tracking font face:', e);
    }

    return result;
  };

  // Also patch FontFace constructor to capture source
  const OriginalFontFace = window.FontFace;
  storeNative('FontFace', OriginalFontFace);

  (window as any).FontFace = function (
    family: string,
    source: string | BinaryData,
    descriptors?: FontFaceDescriptors
  ): FontFace {
    const face = new OriginalFontFace(family, source, descriptors);
    (face as any).$$source = typeof source === 'string' ? source : '[binary]';
    return face;
  };
  (window as any).FontFace.prototype = OriginalFontFace.prototype;

  debugLogger.debug('Patched: FontFace + FontFaceSet.add (track dynamic fonts)');
}

// ── Dynamic CSS tracking ────────────────────────────────────────────

function patchCssRules(): void {
  // Track insertRule
  const originalInsertRule = CSSStyleSheet.prototype.insertRule;
  storeNative('insertRule', originalInsertRule);

  CSSStyleSheet.prototype.insertRule = function (rule: string, index?: number): number {
    const result = originalInsertRule.call(this, rule, index);
    try {
      const insertedRule = this.cssRules[result];
      if (insertedRule) {
        (insertedRule as any)[DYNAMIC_STYLE_TEXT] = rule;
      }
    } catch {}
    return result;
  };

  // Track replaceSync (for constructed stylesheets)
  if (CSSStyleSheet.prototype.replaceSync) {
    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
    storeNative('replaceSync', originalReplaceSync);

    CSSStyleSheet.prototype.replaceSync = function (text: string): void {
      (this as any)[DYNAMIC_STYLE_TEXT] = text;
      return originalReplaceSync.call(this, text);
    };
  }

  // Track replace (async)
  if (CSSStyleSheet.prototype.replace) {
    const originalReplace = CSSStyleSheet.prototype.replace;
    storeNative('replace', originalReplace);

    CSSStyleSheet.prototype.replace = function (text: string): Promise<CSSStyleSheet> {
      (this as any)[DYNAMIC_STYLE_TEXT] = text;
      return originalReplace.call(this, text);
    };
  }

  // Track style property mutations
  const styleSetProperty = CSSStyleDeclaration.prototype.setProperty;
  storeNative('setProperty', styleSetProperty);

  CSSStyleDeclaration.prototype.setProperty = function (
    prop: string,
    value: string | null,
    priority?: string
  ): void {
    (this as any)[DYNAMIC_STYLE_UPDATES] ??= {};
    (this as any)[DYNAMIC_STYLE_UPDATES][prop] = { value, priority };
    return styleSetProperty.call(this, prop, value, priority || '');
  };

  debugLogger.debug('Patched: CSSStyleSheet/CSSStyleDeclaration (track dynamic CSS)');
}

// ── Dynamic image crossOrigin ───────────────────────────────────────

function patchImageConstructor(): void {
  const OriginalImage = window.Image;
  storeNative('Image', OriginalImage);

  (window as any).Image = function (width?: number, height?: number): HTMLImageElement {
    const img = new OriginalImage(width, height);
    // Set crossOrigin for CORS access during capture
    img.crossOrigin = 'anonymous';
    return img;
  };
  (window as any).Image.prototype = OriginalImage.prototype;

  debugLogger.debug('Patched: Image constructor (set crossOrigin)');
}

// ── Service worker registration blocking ────────────────────────────

function patchServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const originalRegister = navigator.serviceWorker.register;
  storeNative('swRegister', originalRegister);

  (navigator.serviceWorker as any).register = function (
    scriptURL: string | URL,
    options?: RegistrationOptions
  ): Promise<ServiceWorkerRegistration> {
    // Block registration during capture if SW downloads not explicitly enabled
    if (
      session.getItem(ACTIVE_TAB_KEY) &&
      !session.getItem(SERVICE_WORKER_DOWNLOADS_KEY)
    ) {
      debugLogger.debug('Blocked service worker registration during capture:', scriptURL);
      return Promise.reject(new Error('Service worker registration blocked during capture'));
    }
    return originalRegister.call(this, scriptURL, options);
  };

  debugLogger.debug('Patched: navigator.serviceWorker.register (block during capture)');
}

// ── document.open patch tracking ────────────────────────────────────

function patchDocumentOpen(): void {
  const originalOpen = document.open;
  storeNative('documentOpen', originalOpen);

  (document as any).open = function (...args: any[]): Document {
    const result = originalOpen.apply(this, args);
    // Re-register window listeners after document.open()
    (globalThis as any)[ADD_WINDOW_LISTENERS]?.forEach((fn: () => void) => fn());
    return result;
  };

  debugLogger.debug('Patched: document.open (re-register listeners)');
}

// ── Initialize all patches ──────────────────────────────────────────

function init(): void {
  try {
    patchShadowDom();
    patchWebGL();
    patchBlobUrls();
    patchFontFace();
    patchCssRules();
    patchImageConstructor();
    patchServiceWorker();
    patchDocumentOpen();
    logger.debug('All MAIN world patches applied');
  } catch (e) {
    logger.error('Error applying MAIN world patches:', e);
  }
}

init();
