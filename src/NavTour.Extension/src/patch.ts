/**
 * Patch — mirrors Navattic's patch.js
 * Property/attribute trapping system for monkey-patching DOM APIs.
 * Intercepts gets/sets on DOM prototypes to track dynamic changes during capture.
 * Runs in MAIN world.
 */

import {
  DYNAMIC_STYLE_TEXT, DYNAMIC_STYLE_UPDATES, ADD_WINDOW_LISTENERS,
  SHADOW_ID_ATTR, SHADOW_COUNTER, NATIVE_FUNCTIONS, INJECTED_FONTS,
  SERIALIZED_INJECTED_FONTS, IS_SALESFORCE, DYNAMIC_STYLE_MAP,
} from './lib/constants';
import { MESSAGE_ID_KEY } from './lib/constants';
import { session, combined } from './lib/storage';
import { SimpleCache } from './lib/cache';
import { createDebugLogger } from './lib/logger';
import {
  isNavTourMessage, stampMessage, onWindowMessage,
  registerPersistentListener, sendToWindow, NavTourMessage,
} from './lib/messages';

const propLogger = createDebugLogger([
  'debug:navtour:property-traps',
  'debug:navtour:attribute-traps',
]);

// ── Frozen native Object/Reflect references ─────────────────────────
// Prevents page code from interfering with our patching

const NativeObject = globalThis.Object.defineProperties(
  {},
  globalThis.Object.fromEntries(
    globalThis.Object.entries(
      globalThis.Object.getOwnPropertyDescriptors(globalThis.Object)
    ).map(([key, desc]) =>
      key === 'prototype'
        ? [
            key,
            {
              ...desc,
              value: globalThis.Object.defineProperties(
                {},
                {
                  ...globalThis.Object.getOwnPropertyDescriptors(
                    globalThis.Object.prototype
                  ),
                  constructor: {
                    value: globalThis.Object,
                    writable: true,
                    enumerable: false,
                    configurable: true,
                  },
                }
              ),
            },
          ]
        : [key, desc]
    )
  )
) as typeof Object;
(NativeObject.prototype as any).constructor = NativeObject;

const NativeReflect = (NativeObject as any).defineProperties(
  {},
  (NativeObject as any).getOwnPropertyDescriptors(globalThis.Reflect)
) as typeof Reflect;

// ── Message deduplication cache (15s TTL) ───────────────────────────

const messageCache = new SimpleCache<string, boolean>({ maxAge: 15 });
const messageListeners = new Map<string, Map<Function, any>>();

function addMessageListener(
  kind: string,
  handler: Function,
  options?: { once?: boolean; signal?: AbortSignal }
): void {
  if (!messageListeners.has(kind)) {
    messageListeners.set(kind, new Map());
  }
  messageListeners.get(kind)!.set(handler, { kind, options });

  if (options?.signal) {
    options.signal.addEventListener('abort', () => removeMessageListener(kind, handler));
  }
}

function removeMessageListener(kind: string, handler: Function): void {
  const listeners = messageListeners.get(kind);
  if (!listeners) return;
  listeners.delete(handler);
  if (listeners.size === 0) messageListeners.delete(kind);
}

function dispatchMessage(
  msg: NavTourMessage,
  source: MessageEventSource | null,
  origin: string
): void {
  // Dedup by message ID + kind
  if (hasMessageId(msg)) {
    const key = `${msg.kind} ${msg[MESSAGE_ID_KEY]}`;
    if (messageCache.has(key)) return;
    messageCache.set(key, true);
  }

  const kindListeners = messageListeners.get(msg.kind);
  if (!kindListeners || kindListeners.size === 0) return;

  for (const [handler, { options }] of kindListeners) {
    try {
      handler(msg, source, origin);
    } catch (e) {
      console.error(e);
    }
    if (options?.once) {
      removeMessageListener(msg.kind, handler);
    }
  }
}

function hasMessageId(msg: any): boolean {
  return !!msg[MESSAGE_ID_KEY];
}

// ── Window message listener setup ───────────────────────────────────

let initialized = false;

function setupWindowListener(): void {
  onWindowMessage(
    (msg, source, origin) => {
      dispatchMessage(msg, source, origin);
    },
    { passive: true }
  );
  initialized = true;
}

// ── Dynamic style tracking ──────────────────────────────────────────

function traverseRules(
  rules: CSSRuleList,
  addedRules: Map<string, string>,
  mutatedDecls: Map<string, any>,
  path: number[] = []
): void {
  try {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules.item(i);
      if (!rule) continue;

      if ((rule as any)[DYNAMIC_STYLE_TEXT]) {
        addedRules.set([...path, i].toString(), (rule as any)[DYNAMIC_STYLE_TEXT]);
      }

      if ('style' in rule && (rule as any).style instanceof CSSStyleDeclaration) {
        const updates = (rule as any).style[DYNAMIC_STYLE_UPDATES];
        if (updates) {
          mutatedDecls.set([...path, i].toString(), updates);
        }
      }

      if ('cssRules' in rule && (rule as any).cssRules instanceof CSSRuleList) {
        traverseRules((rule as any).cssRules, addedRules, mutatedDecls, [...path, i]);
      }
    }
  } catch (e) {
    console.warn(e, location.href);
  }
}

function getStyleSheetInfo(doc: Document | ShadowRoot, adopted = false): Map<number, any> {
  const result = new Map<number, any>();
  try {
    const sheets = adopted
      ? (doc as any).adoptedStyleSheets
      : (doc as Document).styleSheets;
    if (!sheets) return result;

    for (let i = 0; i < sheets.length; i++) {
      const sheet = adopted ? sheets[i] : sheets.item(i);
      if (!sheet) continue;

      const addedRules = new Map<string, string>();
      const mutatedDecls = new Map<string, any>();
      const replacedSheet = (sheet as any)[DYNAMIC_STYLE_TEXT] || null;

      try {
        traverseRules(sheet.cssRules, addedRules, mutatedDecls);
      } catch (e) {
        console.warn('Error traversing style sheet:', e, location.href);
      }

      result.set(i, { addedRules, mutatedDecls, replacedSheet });
    }
  } catch (e) {
    console.warn('Error constructing dynamic style map:', e, location.href);
  }
  return result;
}

function getShadowRootHosts(root: Document | ShadowRoot = document, hosts: Element[] = []): Element[] {
  if ('querySelectorAll' in root) {
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) {
        hosts.push(el);
        getShadowRootHosts(el.shadowRoot, hosts);
      }
    });
  }
  return hosts;
}

function collectDynamicStyles(): Map<string, any> {
  const hosts = getShadowRootHosts();
  const roots: (Document | ShadowRoot)[] = [document, ...hosts.map((h) => h.shadowRoot!)];

  if (typeof (window as any)[SHADOW_COUNTER] !== 'number') {
    (window as any)[SHADOW_COUNTER] = 0;
  }

  const result = new Map<string, any>();

  hosts.forEach((host) => {
    if (!host.hasAttribute(SHADOW_ID_ATTR)) {
      host.setAttribute(SHADOW_ID_ATTR, String((window as any)[SHADOW_COUNTER]++));
    }
  });

  roots.forEach((root) => {
    const adopted = getStyleSheetInfo(root, true);
    const regular = getStyleSheetInfo(root, false);
    const id = root === document ? 'document' : (root as ShadowRoot).host.getAttribute(SHADOW_ID_ATTR);
    result.set(id!, { adoptedStyleSheets: adopted, styleSheets: regular });
  });

  return result;
}

function getInjectedFonts(): Array<{ family: string; source: string; descriptors: any }> {
  const allFonts = [...document.fonts];
  return ((window as any)[INJECTED_FONTS] || [])
    .filter(({ nativeFontFace }: any) => document.fonts.has(nativeFontFace))
    .sort(
      (a: any, b: any) =>
        allFonts.indexOf(a.nativeFontFace) - allFonts.indexOf(b.nativeFontFace)
    )
    .map((f: any) => ({
      family: f.family,
      source: f.source,
      descriptors: f.descriptors,
    }));
}

// ── Salesforce detection ────────────────────────────────────────────

function isSalesforce(shadowProto: any): boolean {
  const lwcCheck = 'lwcRuntimeFlags' in window;
  const nativeCheck = /\(\s*\)\s+\{\s+\[native code\]\s+\}\s*$/.test(
    shadowProto.constructor.toString() || ''
  );
  return (lwcCheck && !nativeCheck) || combined.getItem('navtour:salesforce') === 'true';
}

// ── Handle snapshot requests from isolated world ────────────────────

function getGlobals(keys: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of keys) {
    switch (key) {
      case INJECTED_FONTS:
        result[SERIALIZED_INJECTED_FONTS] = getInjectedFonts();
        break;
      case DYNAMIC_STYLE_MAP:
        result[key] = collectDynamicStyles();
        break;
      case IS_SALESFORCE:
        result[key] = isSalesforce(ShadowRoot.prototype);
        break;
      default:
        result[key] = key in window ? (window as any)[key] : null;
    }
  }
  return result;
}

function handleSnapshotMessage(msg: NavTourMessage): void {
  switch (msg.kind) {
    case 'navtour:snapshot:get-globals': {
      const data = getGlobals(msg.keys);
      sendToWindow(window, {
        kind: 'navtour:ack',
        [MESSAGE_ID_KEY]: msg[MESSAGE_ID_KEY],
        data,
      } as any);
      break;
    }
    case 'navtour:snapshot:event': {
      (window as any).__nv_snapshot_events?.dispatch(msg.event, ...msg.args);
      break;
    }
  }
}

// ── Initialize ──────────────────────────────────────────────────────

function setup(): void {
  onWindowMessage(handleSnapshotMessage);
}

registerPersistentListener(setup);
setup();
