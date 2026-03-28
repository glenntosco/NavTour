/**
 * Smart Blur — Auto-detect and blur PII in the DOM before capture.
 *
 * Detects: emails, phone numbers, prices/currency, SSN-like numbers,
 * credit card-like numbers, IP addresses, and dates with numbers.
 *
 * Two modes:
 * 1. Auto-detect: scans all text nodes and applies blur CSS
 * 2. Manual: user clicks elements to mark for blur
 */

// PII detection patterns
const PII_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { name: 'phone', regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g },
  { name: 'ssn', regex: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g },
  { name: 'credit-card', regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
  { name: 'price', regex: /[$€£¥₹]\s?\d{1,3}(?:[,.]?\d{3})*(?:\.\d{2})?/g },
  { name: 'ip', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

// CSS for blurred elements
const BLUR_CSS = `
  .navtour-smart-blur {
    filter: blur(6px) !important;
    -webkit-filter: blur(6px) !important;
    user-select: none !important;
    pointer-events: none !important;
    transition: filter 0.2s ease !important;
  }
  .navtour-manual-blur {
    filter: blur(8px) !important;
    -webkit-filter: blur(8px) !important;
    user-select: none !important;
    pointer-events: none !important;
    outline: 2px dashed rgba(239, 68, 68, 0.5) !important;
    outline-offset: 2px !important;
  }
  .navtour-blur-hover {
    outline: 2px dashed rgba(67, 97, 238, 0.6) !important;
    outline-offset: 2px !important;
    cursor: crosshair !important;
  }
`;

let blurStyleEl: HTMLStyleElement | null = null;
let manualBlurMode = false;
let manualBlurHandler: ((e: MouseEvent) => void) | null = null;
const manuallyBlurred = new Set<Element>();

/**
 * Inject blur CSS into the page
 */
function ensureBlurStyles(): void {
  if (blurStyleEl) return;
  blurStyleEl = document.createElement('style');
  blurStyleEl.id = '__navtour_smart_blur_css__';
  blurStyleEl.textContent = BLUR_CSS;
  document.head.appendChild(blurStyleEl);
}

/**
 * Auto-detect PII in text nodes and blur containing elements
 */
export function autoBlurPII(root: Element = document.body): number {
  ensureBlurStyles();
  let blurCount = 0;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip script, style, and already-blurred elements
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName?.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'noscript') return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains('navtour-smart-blur')) return NodeFilter.FILTER_REJECT;
      if (parent.closest('#__navtour_capture_toolbar__')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const elementsToBlur = new Set<Element>();

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const text = textNode.textContent || '';
    if (text.trim().length < 3) continue;

    for (const pattern of PII_PATTERNS) {
      if (pattern.regex.test(text)) {
        // Reset regex lastIndex
        pattern.regex.lastIndex = 0;
        const el = textNode.parentElement;
        if (el) elementsToBlur.add(el);
        break;
      }
    }
  }

  elementsToBlur.forEach(el => {
    el.classList.add('navtour-smart-blur');
    blurCount++;
  });

  return blurCount;
}

/**
 * Apply blur to a cloned DOM (for capture serialization)
 * This doesn't modify the live page — only the clone.
 */
export function applyBlurToClone(clone: HTMLElement): number {
  let count = 0;

  // Apply auto-detect blur
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName?.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'noscript') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const elementsToBlur = new Set<Element>();

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const text = textNode.textContent || '';
    if (text.trim().length < 3) continue;

    for (const pattern of PII_PATTERNS) {
      if (pattern.regex.test(text)) {
        pattern.regex.lastIndex = 0;
        const el = textNode.parentElement;
        if (el) elementsToBlur.add(el);
        break;
      }
    }
  }

  elementsToBlur.forEach(el => {
    el.style.filter = 'blur(6px)';
    el.style.userSelect = 'none';
    count++;
  });

  // Also apply manual blur selections
  // Transfer manually blurred elements by matching data attributes
  clone.querySelectorAll('[data-navtour-manual-blur]').forEach(el => {
    el.setAttribute('style', (el.getAttribute('style') || '') + ';filter:blur(8px);user-select:none');
    count++;
  });

  return count;
}

/**
 * Start manual blur mode — user clicks elements to blur them
 */
export function startManualBlur(): void {
  ensureBlurStyles();
  manualBlurMode = true;

  let hoveredEl: Element | null = null;

  manualBlurHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as Element;
    if (!target || target.closest('#__navtour_capture_toolbar__')) return;

    if (e.type === 'mouseover') {
      if (hoveredEl) hoveredEl.classList.remove('navtour-blur-hover');
      hoveredEl = target;
      if (!target.classList.contains('navtour-manual-blur')) {
        target.classList.add('navtour-blur-hover');
      }
    } else if (e.type === 'mouseout') {
      target.classList.remove('navtour-blur-hover');
      hoveredEl = null;
    } else if (e.type === 'click') {
      target.classList.remove('navtour-blur-hover');

      if (target.classList.contains('navtour-manual-blur')) {
        // Unblur
        target.classList.remove('navtour-manual-blur');
        target.removeAttribute('data-navtour-manual-blur');
        manuallyBlurred.delete(target);
      } else {
        // Blur
        target.classList.add('navtour-manual-blur');
        target.setAttribute('data-navtour-manual-blur', 'true');
        manuallyBlurred.add(target);
      }
    }
  };

  document.addEventListener('click', manualBlurHandler, true);
  document.addEventListener('mouseover', manualBlurHandler, true);
  document.addEventListener('mouseout', manualBlurHandler, true);
}

/**
 * Stop manual blur mode
 */
export function stopManualBlur(): void {
  manualBlurMode = false;

  if (manualBlurHandler) {
    document.removeEventListener('click', manualBlurHandler, true);
    document.removeEventListener('mouseover', manualBlurHandler, true);
    document.removeEventListener('mouseout', manualBlurHandler, true);
    manualBlurHandler = null;
  }

  // Remove hover indicators
  document.querySelectorAll('.navtour-blur-hover').forEach(el => {
    el.classList.remove('navtour-blur-hover');
  });
}

/**
 * Clear all blur (both auto and manual)
 */
export function clearAllBlur(): void {
  stopManualBlur();

  document.querySelectorAll('.navtour-smart-blur').forEach(el => {
    el.classList.remove('navtour-smart-blur');
  });

  document.querySelectorAll('.navtour-manual-blur').forEach(el => {
    el.classList.remove('navtour-manual-blur');
    el.removeAttribute('data-navtour-manual-blur');
  });

  manuallyBlurred.clear();

  if (blurStyleEl) {
    blurStyleEl.remove();
    blurStyleEl = null;
  }
}

/**
 * Get count of blurred elements
 */
export function getBlurCount(): { auto: number; manual: number } {
  return {
    auto: document.querySelectorAll('.navtour-smart-blur').length,
    manual: manuallyBlurred.size,
  };
}

export { manualBlurMode };
