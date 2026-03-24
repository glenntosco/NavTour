/**
 * Service Workers — mirrors Navattic's service-workers.js
 * Unregisters page service workers during capture to prevent interference.
 */

import { combined } from './lib/storage';
import { SERVICE_WORKER_DOWNLOADS_KEY } from './lib/constants';
import { createPrefixedLogger, red } from './lib/logger';

const logger = createPrefixedLogger({ pre: red('service-workers:') });

async function safeCall<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const result = fn();
    return result instanceof Promise ? await result.catch(() => undefined) : result;
  } catch {
    return undefined;
  }
}

async function unregisterServiceWorkers(): Promise<void> {
  // Respect feature flag
  if (
    combined.getItem('debug:navtour:allow-sw') ||
    combined.getItem(SERVICE_WORKER_DOWNLOADS_KEY)
  ) {
    logger.warn(
      'Service Worker Downloads feature flag is enabled, not unregistering service workers'
    );
    return;
  }

  await safeCall(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (!registrations.length) return;

    const results = await Promise.all(
      registrations.map((reg) => reg.unregister())
    );

    if (!results.every(Boolean)) {
      logger.error('Failed to unregister service workers');
      return;
    }

    window.location.reload();
  });
}

unregisterServiceWorkers();
