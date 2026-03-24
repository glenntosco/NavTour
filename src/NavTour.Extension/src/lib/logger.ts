/**
 * Logger — mirrors Navattic's console proxy pattern
 * Provides prefixed, conditional logging with debug flag support.
 */

import { combined } from './storage';

const isChrome = () => globalThis.navigator?.userAgent?.includes('Chrome') ?? false;

let _isChrome = true;
try { _isChrome = isChrome(); } catch {}

const colorize = (color: string) =>
  _isChrome ? (text: string) => `${color}${text}\x1b[0m` : (text: string) => text;

export const red = colorize('\x1b[31m');
export const green = colorize('\x1b[32m');
export const yellow = colorize('\x1b[33m');
export const blue = colorize('\x1b[34m');

/**
 * Create a prefixed logger (mirrors Navattic's console proxy with pre/post)
 */
export function createPrefixedLogger(
  opts: { pre?: string | string[]; post?: string | string[] },
  base: Console = globalThis.console
): Console {
  const { pre, post } = opts;
  return new Proxy(base, {
    get: (_target, prop) => {
      const desc = Object.getOwnPropertyDescriptor(_target, prop);
      if (desc && !desc.configurable) {
        if ('value' in desc && !desc.writable) return desc.value;
        if (desc === undefined) return undefined;
      }
      const fn = (_target as any)[prop];
      if (typeof fn !== 'function') return fn;
      if (prop === 'time' || prop === 'timeEnd' || prop === 'timeLog' || prop === 'timeStamp') {
        return (label: string, ...args: any[]) => {
          fn.apply(_target, [
            [pre || [], label || []].flat().join(' '),
            ...args,
            ...(post ? [post].flat() : []),
          ]);
        };
      }
      return (...args: any[]) => {
        fn.apply(_target, [
          ...(pre ? [pre].flat() : []),
          ...args,
          ...(post ? [post].flat() : []),
        ]);
      };
    },
  });
}

/**
 * Create a debug logger that only outputs when debug flag is set in storage
 */
const SILENT_METHODS: Record<string, boolean> = {
  assert: true, clear: true, count: true, countReset: true,
  debug: true, dir: true, dirxml: true, error: true,
  group: true, groupCollapsed: true, groupEnd: true,
  info: true, log: true, table: true, time: true,
  timeEnd: true, timeLog: true, timeStamp: true, trace: true, warn: true,
};

export function createDebugLogger(
  keys: string | string[] = ['debug:navtour'],
  base: Console = globalThis.console
): Console {
  const enabled = {
    enabled: (typeof keys === 'string' ? [keys] : keys).some(
      (k) => combined.getItem(k)
    ),
  };

  return new Proxy(base, {
    get: (_target, prop) => {
      const desc = Object.getOwnPropertyDescriptor(_target, prop);
      if (desc && !desc.configurable) {
        if ('value' in desc && !desc.writable) return desc.value;
        if (desc === undefined) return undefined;
      }
      const fn = (_target as any)[prop];
      if (typeof fn === 'function') {
        return enabled.enabled ? fn.bind(_target) : () => {};
      }
      return prop in SILENT_METHODS ? () => {} : fn;
    },
  });
}
