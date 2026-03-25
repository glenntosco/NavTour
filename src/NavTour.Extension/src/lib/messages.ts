/**
 * Message System — mirrors Navattic's message relay architecture
 * Typed message kinds, unique IDs, ACK pattern, window.postMessage relay.
 */

import { MESSAGE_ID_KEY, ADD_WINDOW_LISTENERS, ALLOWED_ORIGINS } from './constants';

// ── Message kind constants ──────────────────────────────────────────
export type MessageKind =
  // Auth
  | 'navtour:auth-request'
  | 'navtour:auth-status-request'
  | 'navtour:auth-state'
  // Capture lifecycle
  | 'navtour:capture'
  | 'navtour:capture-start'
  | 'navtour:capture-session-init'
  | 'navtour:capture-session-finish'
  | 'navtour:capture-details-request'
  | 'navtour:capture-details'
  | 'navtour:update-capture'
  // Screenshots & resources
  | 'navtour:screenshot'
  | 'navtour:screenshot-capture'
  | 'navtour:screenshot-selector'
  | 'navtour:upload-static-resource'
  | 'navtour:process-and-upload-web-capture'
  | 'navtour:fetch-url'
  | 'navtour:resource-manager:add-url'
  | 'navtour:resource-manager:add-resource'
  | 'navtour:save-web-capture'
  // Settings
  | 'navtour:set-click-to-capture-mode'
  | 'navtour:set-capture-type'
  | 'navtour:apply-settings'
  | 'navtour:sync-click-to-capture-mode'
  | 'navtour:update-sandbox-highlights'
  // Misc
  | 'navtour:get-version'
  | 'navtour:checkIfActive'
  | 'navtour:requestTabUrls'
  | 'navtourjs:requestTabUrls'
  | 'navtour:logtail-sync'
  | 'navtour:telemetry'
  | 'navtour:workspaceSlug-request'
  | 'navtour:workspaceSlug-response'
  | 'navtour:log'
  | 'navtour:ack'
  // Panel
  | 'navtour:panel-request-frames'
  | 'navtour:panel-delete-frame'
  | 'navtour:panel-save-step'
  // Content script → main world
  | 'navtour:snapshot:get-globals'
  | 'navtour:snapshot:event';

export interface NavTourMessage {
  kind: MessageKind;
  [MESSAGE_ID_KEY]?: string;
  [key: string]: any;
}

// ── Message utilities ───────────────────────────────────────────────

function generateId(): string {
  return (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, '');
}

export function isNavTourMessage(data: any): data is NavTourMessage {
  return (
    !!data &&
    typeof data === 'object' &&
    'kind' in data &&
    typeof data.kind === 'string' &&
    (data.kind.startsWith('navtourjs:') || data.kind.startsWith('navtour:'))
  );
}

export function hasMessageId(msg: NavTourMessage): boolean {
  return !!msg[MESSAGE_ID_KEY];
}

export function stampMessage(msg: NavTourMessage): NavTourMessage {
  if (hasMessageId(msg)) return msg;
  return { [MESSAGE_ID_KEY]: generateId(), ...msg };
}

/**
 * Send ACK back to source window (mirrors Navattic's ACK pattern)
 */
export function sendAck(
  msg: NavTourMessage,
  source: Window | MessageEventSource | null,
  origin: string
): void {
  if (msg.kind === 'navtour:ack') return;
  if (!hasMessageId(msg) || !source || source === window) return;
  if (origin === 'null') origin = '*';
  (source as Window).postMessage(
    { [MESSAGE_ID_KEY]: msg[MESSAGE_ID_KEY], kind: 'navtour:ack' },
    { targetOrigin: '*' }
  );
}

/**
 * Listen for NavTour messages on window (mirrors Navattic's message listener pattern)
 */
export function onWindowMessage(
  handler: (msg: NavTourMessage, source: MessageEventSource | null, origin: string) => void | boolean,
  options?: AddEventListenerOptions
): () => void {
  const listener = (event: MessageEvent) => {
    if (!event.isTrusted) return;
    const { data, source, origin } = event;
    if (!isNavTourMessage(data)) return;
    if (handler(data, source, origin) === true) {
      cleanup();
    }
  };

  window.addEventListener('message', listener, options);

  const cleanup = () => {
    window.removeEventListener('message', listener);
  };

  return cleanup;
}

/**
 * Relay messages from window.postMessage to chrome.runtime.sendMessage
 * and back (mirrors Navattic's message-manager.js)
 */
export function isAllowedOrigin(origin: string): boolean {
  return origin === window.location.origin || ALLOWED_ORIGINS.includes(origin);
}

// ── Send with retry + ACK (mirrors Navattic's sendMessage pattern) ──

interface SendOptions {
  toOrigin?: string;
  pollInterval?: number;
  retryCount?: number;
  timeoutAfter?: number;
  signal?: AbortSignal;
}

export function sendToWindow(
  target: Window,
  message: NavTourMessage,
  options: SendOptions = {}
): Promise<NavTourMessage | undefined> {
  const stamped = stampMessage(message);
  const { pollInterval = 1000, retryCount, timeoutAfter, signal } = options;
  const msgId = stamped[MESSAGE_ID_KEY];
  const defaultTimeout = retryCount ? undefined : 5000;

  return new Promise((resolve) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let intervalHandle: ReturnType<typeof setInterval>;
    let attempts = 0;

    const teardown = (response?: NavTourMessage) => {
      signal?.removeEventListener('abort', onAbort);
      removeAckListener();
      if (timeoutHandle) clearTimeout(timeoutHandle);
      clearInterval(intervalHandle);
      resolve(response);
    };

    const onAbort = () => teardown(undefined);
    signal?.addEventListener('abort', onAbort);

    const removeAckListener = onWindowMessage((msg) => {
      if (msg[MESSAGE_ID_KEY] === msgId && msg.kind === 'navtour:ack') {
        teardown(msg);
      }
    });

    const send = () => {
      if (retryCount !== undefined && ++attempts > retryCount) {
        teardown(undefined);
        return;
      }
      target.postMessage(stamped, { targetOrigin: options.toOrigin || '*' });
    };

    send();
    intervalHandle = setInterval(send, pollInterval);

    const effectiveTimeout = timeoutAfter ?? defaultTimeout;
    if (effectiveTimeout) {
      timeoutHandle = setTimeout(() => teardown(undefined), effectiveTimeout);
    }
  });
}

/**
 * Register window listeners that re-attach after document.open()
 * (mirrors Navattic's __nv_add_window_listeners pattern)
 */
export function registerPersistentListener(setup: () => void): void {
  (globalThis as any)[ADD_WINDOW_LISTENERS] ??= [];
  (globalThis as any)[ADD_WINDOW_LISTENERS].push(setup);
}
