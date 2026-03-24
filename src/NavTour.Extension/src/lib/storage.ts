/**
 * Storage Proxy — mirrors Navattic's storage abstraction
 * Provides safe localStorage/sessionStorage access with prefix isolation
 * and fallback to in-memory storage when browser storage is unavailable.
 */

import { STORAGE_PREFIX, CAPTURE_OPEN_KEY, CAPTURE_MODE_KEY, CAPTURING_ENABLED_KEY,
  CLICK_TO_CAPTURE_PAUSED_KEY, VIDEO_CAPTURE_KEY, GENERATE_SANDBOX_KEY,
  ACTIVE_TAB_KEY } from './constants';

// In-memory Storage fallback (mirrors Navattic's custom Storage class)
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  private _keys: string[] = [];
  private defaultView: Window | undefined;

  [Symbol.species] = MemoryStorage;

  constructor(win?: Window) {
    this.defaultView = win;
  }

  private dispatchStorageEvent(opts: {
    key?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
  } = {}) {
    if (!this.defaultView) return;
    const { key = null, oldValue = null, newValue = null } = opts;
    this.defaultView.dispatchEvent(
      new StorageEvent('storage', {
        key,
        oldValue,
        newValue,
        url: this.defaultView.location?.href ?? null,
      })
    );
  }

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
    this._keys.splice(0, this._keys.length);
    this.dispatchStorageEvent();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return index >= this._keys.length ? null : this._keys[index];
  }

  removeItem(key: string): void {
    if (!this.store.has(key)) return;
    const oldValue = this.store.get(key)!;
    this.store.delete(key);
    const idx = this._keys.indexOf(key);
    if (idx > -1) this._keys.splice(idx, 1);
    this.dispatchStorageEvent({ key, oldValue });
  }

  setItem(key: string, value: string): void {
    const isNew = !this.store.has(key);
    const oldValue = this.getItem(key);
    this.store.set(key, value);
    if (isNew) this._keys.push(key);
    this.dispatchStorageEvent({ key, oldValue, newValue: value });
  }
}

enum StorageType {
  LOCAL = 0,
  SESSION = 1,
}

/**
 * Get a storage instance with Proxy fallback (mirrors Navattic pattern)
 */
function getStorage(type: StorageType, win: Window = globalThis.window): Storage | undefined {
  if (!win) {
    if (typeof globalThis.window === 'undefined') return undefined;
    win = globalThis.window;
  }

  const cacheKey = `__nv_proxy_storage_${StorageType[type]}`;
  const cached = (win as any)[cacheKey];
  if (cached) return cached;

  try {
    const native = type === StorageType.SESSION ? win.sessionStorage : win.localStorage;
    if (!native?.getItem) throw new Error();
    (win as any)[cacheKey] = native;
    return native;
  } catch {
    const mem = new MemoryStorage(win);
    const proxy = new Proxy(mem, {
      get: (target, prop) =>
        prop in target ? (target as any)[prop] : target.getItem(String(prop)),
      has: (target, prop) =>
        prop in target || target.getItem(String(prop)) !== null,
      set: (target, prop, value) => {
        if (prop in target || typeof value === 'object' || typeof value === 'function')
          return false;
        target.setItem(String(prop), String(value));
        return true;
      },
    });
    (win as any)[cacheKey] = proxy;
    return proxy;
  }
}

function createStorageContext(win?: Window) {
  return {
    PREFIX: STORAGE_PREFIX,
    localStorage: getStorage(StorageType.LOCAL, win),
    sessionStorage: getStorage(StorageType.SESSION, win),
  };
}

function createStorageAccessor(win?: Window) {
  const ctx = createStorageContext(win);
  const getStore = (type: 'SESSION' | 'LOCAL') =>
    type === 'SESSION' ? ctx.sessionStorage : ctx.localStorage;

  const getPrefixed = (key: string, type: 'SESSION' | 'LOCAL' = 'LOCAL') => {
    const raw = getStore(type)?.getItem(`${ctx.PREFIX}${key}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  };

  const setPrefixed = (key: string, value: any, type: 'SESSION' | 'LOCAL' = 'LOCAL') => {
    getStore(type)?.setItem(`${ctx.PREFIX}${key}`, JSON.stringify(value));
  };

  return {
    localStorage: ctx.localStorage,
    sessionStorage: ctx.sessionStorage,
    getCompletions: () => getPrefixed('__COMPLETIONS__'),
    setCompletions: (v: any) => setPrefixed('__COMPLETIONS__', v),
  };
}

const accessor = createStorageAccessor(
  typeof globalThis.window !== 'undefined' ? globalThis.window : undefined
);

/** Local storage instance */
export const local: Storage = accessor.localStorage ?? createStorageContext().localStorage!;

/** Session storage instance */
export const session: Storage = accessor.sessionStorage ?? createStorageContext().sessionStorage!;

/** Combined storage (session takes priority, mirrors Navattic) */
export const combined = {
  get length() { return session.length + local.length; },
  clear() { session.clear(); local.clear(); },
  getItem(key: string) { return session.getItem(key) ?? local.getItem(key); },
  key(index: number) { return session.key(index) ?? local.key(index); },
  removeItem(key: string) { session.removeItem(key); local.removeItem(key); },
  setItem(key: string, value: string) { session.setItem(key, value); local.setItem(key, value); },
};

/** Clean up all capture-related session storage keys */
export function clearCaptureState(): void {
  const captureData = session.getItem(CAPTURE_OPEN_KEY);
  session.removeItem(CAPTURING_ENABLED_KEY);
  session.removeItem(ACTIVE_TAB_KEY);
  session.removeItem(CAPTURE_OPEN_KEY);
  session.removeItem(CAPTURE_MODE_KEY);
  session.removeItem(CLICK_TO_CAPTURE_PAUSED_KEY);
  session.removeItem(VIDEO_CAPTURE_KEY);
  session.removeItem(GENERATE_SANDBOX_KEY);
  session.removeItem('debug:navtour:allow-sw');
  session.removeItem('debug:navtour:disable-patch:html');
  if (captureData) {
    try {
      const { tabId } = JSON.parse(captureData);
      // Allow cleanup of tab-specific state
      return tabId;
    } catch {}
  }
}

/** CSP tab helpers */
export function getCspTabKey(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${STORAGE_PREFIX}__CSP_TAB_${origin}`;
}

export function setCspViolation(value: boolean): void {
  session.setItem(getCspTabKey(), JSON.stringify(value));
}

export function getCspViolation(): boolean | null {
  try {
    const raw = session.getItem(getCspTabKey());
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
