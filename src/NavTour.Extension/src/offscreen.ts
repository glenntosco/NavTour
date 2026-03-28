/**
 * Offscreen Document — mirrors Navattic's offscreen.js
 * Runs in an offscreen document for background processing tasks
 * (screenshot processing, resource downloads, etc.)
 * that require DOM access but not a visible tab.
 */

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.kind) return;

  switch (message.kind) {
    case 'navtour:offscreen:process-html': {
      processHtml(message.html, message.baseUrl)
        .then((result) => sendResponse({ success: true, html: result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // async response
    }

    case 'navtour:offscreen:fetch-resource': {
      fetchResource(message.url, message.options)
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    case 'navtour:offscreen:process-screenshot': {
      processScreenshot(message.dataUrl, message.options)
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    case 'navtour:offscreen:start-recording': {
      startRecording(message.streamId)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    case 'navtour:offscreen:stop-recording': {
      stopRecording()
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
  }
});

/**
 * Process HTML in offscreen DOM — sanitize, absolutize URLs, etc.
 */
async function processHtml(html: string, baseUrl: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const base = doc.createElement('base');
  base.href = baseUrl;
  doc.head.prepend(base);

  // Absolutize all relative URLs
  absolutizeUrls(doc, 'a', 'href');
  absolutizeUrls(doc, 'img', 'src');
  absolutizeUrls(doc, 'link', 'href');
  absolutizeUrls(doc, 'script', 'src');
  absolutizeUrls(doc, 'source', 'src');
  absolutizeUrls(doc, 'video', 'src');
  absolutizeUrls(doc, 'video', 'poster');
  absolutizeUrls(doc, 'audio', 'src');

  // Remove base tag after absolutization
  base.remove();

  // Remove CSP meta tags
  doc.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach((el) => el.remove());

  // Fix iframe sandboxes
  doc.querySelectorAll('iframe[sandbox]').forEach((iframe) => {
    const sandbox = iframe.getAttribute('sandbox')!;
    if (!sandbox.includes('allow-scripts')) {
      iframe.setAttribute(
        'sandbox',
        [...new Set([...sandbox.split(' '), 'allow-scripts'])].join(' ').trim()
      );
    }
  });

  const doctype = doc.doctype
    ? new XMLSerializer().serializeToString(doc.doctype)
    : '<!DOCTYPE html>';
  return `${doctype}\n${doc.documentElement.outerHTML}`;
}

function absolutizeUrls(doc: Document, selector: string, attr: string): void {
  doc.querySelectorAll(selector).forEach((el) => {
    const value = el.getAttribute(attr);
    if (value && !value.startsWith('data:') && !value.startsWith('blob:') && !value.startsWith('#')) {
      try {
        const absolute = new URL(value, doc.baseURI).href;
        el.setAttribute(attr, absolute);
      } catch {}
    }
  });
}

/**
 * Fetch a resource from the offscreen context (avoids CSP issues)
 */
async function fetchResource(
  url: string,
  options?: RequestInit
): Promise<{ data: string; contentType: string }> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || blob.type;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      data: reader.result as string,
      contentType,
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Process screenshot image (resize, crop, compress)
 */
async function processScreenshot(
  dataUrl: string,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<{ dataUrl: string; width: number; height: number }> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = options;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => resolve({
      dataUrl: reader.result as string,
      width,
      height,
    });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Video recording ──────────────────────────────────────────────────

let activeRecorder: MediaRecorder | null = null;
let activeStream: MediaStream | null = null;
let recordingChunks: Blob[] = [];

async function startRecording(streamId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Stop any existing recording first
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      activeRecorder.stop();
    }

    // Get the media stream from the stream ID
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      } as any,
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      } as any,
    });

    activeStream = stream;
    recordingChunks = [];

    // Pick a supported mime type
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        recordingChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordingChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Notify the worker that the recording is ready for download
      chrome.runtime.sendMessage({
        kind: 'navtour:offscreen:recording-ready',
        url,
        size: blob.size,
      });

      // Clean up stream tracks
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
        activeStream = null;
      }
      activeRecorder = null;
      recordingChunks = [];
    };

    recorder.start(1000); // Collect data every second
    activeRecorder = recorder;

    console.log('[NavTour Offscreen] Recording started');
    return { success: true };
  } catch (err) {
    console.error('[NavTour Offscreen] Failed to start recording:', err);
    return { success: false, error: String(err) };
  }
}

async function stopRecording(): Promise<{ success: boolean }> {
  if (activeRecorder && activeRecorder.state !== 'inactive') {
    activeRecorder.stop();
    console.log('[NavTour Offscreen] Recording stopped');
  }
  return { success: true };
}

console.log('[NavTour] Offscreen document ready');
