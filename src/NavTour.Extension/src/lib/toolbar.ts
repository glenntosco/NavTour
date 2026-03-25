/**
 * Capture Toolbar — matches Navattic's exact capture bar design.
 * TOP-positioned white bar with:
 * - NavTour logo + frame count badge (left)
 * - Icon buttons: pause, settings, disable-clicks, undo (center)
 * - "Finish" button (right)
 * - Helper text banner: "Click through your app to record"
 */

const TOOLBAR_ID = '__navtour_capture_toolbar__';

const TOOLBAR_CSS = `
/* ── Main bar container — floating bottom center ── */
#${TOOLBAR_ID} {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: __nt_slide_up 0.3s ease-out;
}

@keyframes __nt_slide_up {
  from { transform: translateX(-50%) translateY(30px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

#${TOOLBAR_ID} * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Floating pill bar ───────────────────────────── */
#${TOOLBAR_ID} .nt-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 100px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 40px;
}

/* Logo + count */
#${TOOLBAR_ID} .nt-brand {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: 4px;
  position: relative;
}

#${TOOLBAR_ID} .nt-logo {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#${TOOLBAR_ID} .nt-logo svg {
  width: 20px;
  height: 20px;
}

#${TOOLBAR_ID} .nt-count {
  position: absolute;
  bottom: -2px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #4361ee;
  color: #ffffff;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid #ffffff;
}

/* ── Icon buttons ────────────────────────────────── */
#${TOOLBAR_ID} .nt-icons {
  display: flex;
  align-items: center;
  gap: 2px;
}

#${TOOLBAR_ID} .nt-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.12s;
  padding: 0;
}

#${TOOLBAR_ID} .nt-icon-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

#${TOOLBAR_ID} .nt-icon-btn.nt-active {
  background: #eff6ff;
  color: #4361ee;
}

#${TOOLBAR_ID} .nt-icon-btn svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.75;
}

/* ── Separator ───────────────────────────────────── */
#${TOOLBAR_ID} .nt-sep {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
  flex-shrink: 0;
}

/* ── Finish button ───────────────────────────────── */
#${TOOLBAR_ID} .nt-finish-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 14px;
  border: 1px solid #d1d5db;
  border-radius: 100px;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}

#${TOOLBAR_ID} .nt-finish-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

#${TOOLBAR_ID} .nt-finish-btn:active {
  background: #f3f4f6;
}

/* ── Helper text (above pill) ────────────────────── */
#${TOOLBAR_ID} .nt-helper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 100px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

#${TOOLBAR_ID} .nt-helper-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

#${TOOLBAR_ID} .nt-helper-icon svg {
  width: 14px;
  height: 14px;
}

#${TOOLBAR_ID} .nt-helper-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s;
  margin-left: 4px;
}

#${TOOLBAR_ID} .nt-helper-close:hover {
  background: #f3f4f6;
  color: #374151;
}

#${TOOLBAR_ID} .nt-helper-close svg {
  width: 12px;
  height: 12px;
}

/* ── Capturing flash ─────────────────────────────── */
#${TOOLBAR_ID} .nt-bar.nt-flash {
  background: #f0f5ff;
  transition: background 0.3s;
}

/* ── Countdown overlay ───────────────────────────── */
#__navtour_countdown__ {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  animation: __nt_fade_in 0.2s ease-out;
}

@keyframes __nt_fade_in {
  from { opacity: 0; }
  to { opacity: 1; }
}

#__navtour_countdown__ .nt-cd-number {
  font-size: 160px;
  font-weight: 300;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  animation: __nt_cd_pop 1s ease-out;
}

@keyframes __nt_cd_pop {
  0% { transform: scale(1.3); opacity: 0; }
  30% { transform: scale(1); opacity: 1; }
  100% { opacity: 1; }
}

#__navtour_countdown__ .nt-cd-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #ffffff;
  border-radius: 100px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

#__navtour_countdown__ .nt-cd-pill svg {
  color: #4361ee;
}

#__navtour_countdown__ .nt-cd-skip {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}
`;

// ── SVG icon helpers ────────────────────────────────

function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function createSvg(children: SVGElement[], size = 18): SVGElement {
  const svg = svgEl('svg', {
    width: String(size), height: String(size), viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  children.forEach(c => svg.appendChild(c));
  return svg;
}

function iconLogo(): SVGElement {
  // NavTour camera/capture icon
  return createSvg([
    svgEl('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }),
    svgEl('circle', { cx: '12', cy: '10', r: '3' }),
    svgEl('line', { x1: '2', y1: '20', x2: '22', y2: '20' }),
  ], 20);
}

function iconPause(): SVGElement {
  return createSvg([
    svgEl('rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }),
    svgEl('rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }),
  ]);
}

function iconSettings(): SVGElement {
  return createSvg([
    svgEl('circle', { cx: '12', cy: '12', r: '3' }),
    svgEl('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }),
  ]);
}

function iconCursorOff(): SVGElement {
  return createSvg([
    svgEl('path', { d: 'M2 2l20 20' }),
    svgEl('path', { d: 'M9 4l-5 16 5.3-5.3' }),
    svgEl('path', { d: 'M14.8 14.8L20 20' }),
  ]);
}

function iconUndo(): SVGElement {
  return createSvg([
    svgEl('polyline', { points: '1 4 1 10 7 10' }),
    svgEl('path', { d: 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10' }),
  ]);
}

function iconInfo(): SVGElement {
  return createSvg([
    svgEl('circle', { cx: '12', cy: '12', r: '10' }),
    svgEl('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
    svgEl('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' }),
  ], 14);
}

function iconX(): SVGElement {
  return createSvg([
    svgEl('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    svgEl('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
  ], 14);
}

// ── Countdown overlay ───────────────────────────────

function iconNavTourSmall(): SVGElement {
  return createSvg([
    svgEl('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }),
    svgEl('circle', { cx: '12', cy: '10', r: '3' }),
    svgEl('line', { x1: '2', y1: '20', x2: '22', y2: '20' }),
  ], 18);
}

export function showCountdown(onComplete: () => void): void {
  const COUNTDOWN_ID = '__navtour_countdown__';
  // Remove existing
  document.getElementById(COUNTDOWN_ID)?.remove();

  const overlay = document.createElement('div');
  overlay.id = COUNTDOWN_ID;

  const numberEl = document.createElement('div');
  numberEl.className = 'nt-cd-number';
  numberEl.textContent = '3';
  overlay.appendChild(numberEl);

  // "Click through your app to record" pill
  const pill = document.createElement('div');
  pill.className = 'nt-cd-pill';
  const pillIcon = document.createElement('span');
  pillIcon.appendChild(iconNavTourSmall());
  pill.appendChild(pillIcon);
  const pillText = document.createElement('span');
  pillText.textContent = 'Click through your app to record';
  pill.appendChild(pillText);
  overlay.appendChild(pill);

  // "Click anywhere to skip countdown"
  const skipText = document.createElement('div');
  skipText.className = 'nt-cd-skip';
  skipText.textContent = 'Click anywhere to skip countdown';
  overlay.appendChild(skipText);

  document.body.appendChild(overlay);

  let count = 3;
  let cancelled = false;

  const cleanup = () => {
    cancelled = true;
    overlay.remove();
  };

  // Skip on click
  overlay.addEventListener('click', () => {
    cleanup();
    onComplete();
  });

  const tick = () => {
    if (cancelled) return;
    count--;
    if (count <= 0) {
      cleanup();
      onComplete();
      return;
    }
    numberEl.textContent = String(count);
    // Re-trigger animation
    numberEl.style.animation = 'none';
    // Force reflow
    void numberEl.offsetHeight;
    numberEl.style.animation = '__nt_cd_pop 1s ease-out';
    setTimeout(tick, 1000);
  };

  setTimeout(tick, 1000);
}

// ── Public API ──────────────────────────────────────

export interface ToolbarCallbacks {
  onCapture: () => void;
  onFinish: () => void;
}

export function injectToolbar(demoName: string, frameCount: number, callbacks: ToolbarCallbacks): void {
  removeToolbar();

  // Inject CSS
  const style = document.createElement('style');
  style.id = `${TOOLBAR_ID}_style`;
  style.textContent = TOOLBAR_CSS;
  document.head.appendChild(style);

  // Container
  const container = document.createElement('div');
  container.id = TOOLBAR_ID;
  container.setAttribute('data-navtour-toolbar', 'true');

  // ── Main bar row ──
  const bar = document.createElement('div');
  bar.className = 'nt-bar';

  // Brand logo + count badge
  const brand = document.createElement('div');
  brand.className = 'nt-brand';

  const logo = document.createElement('div');
  logo.className = 'nt-logo';
  logo.style.color = '#4361ee';
  logo.appendChild(iconLogo());
  brand.appendChild(logo);

  const countBadge = document.createElement('span');
  countBadge.className = 'nt-count';
  countBadge.setAttribute('data-nt-count', '');
  countBadge.textContent = String(frameCount);
  brand.appendChild(countBadge);

  bar.appendChild(brand);

  // Separator
  bar.appendChild(createSep());

  // Icon buttons
  const icons = document.createElement('div');
  icons.className = 'nt-icons';

  const pauseBtn = createIconBtn(iconPause(), 'Pause capture');
  icons.appendChild(pauseBtn);

  const settingsBtn = createIconBtn(iconSettings(), 'Settings');
  icons.appendChild(settingsBtn);

  const cursorBtn = createIconBtn(iconCursorOff(), 'Disable click-through');
  icons.appendChild(cursorBtn);

  const undoBtn = createIconBtn(iconUndo(), 'Undo last capture');
  icons.appendChild(undoBtn);

  bar.appendChild(icons);

  // Finish button (right-aligned)
  const finishBtn = document.createElement('button');
  finishBtn.className = 'nt-finish-btn';
  finishBtn.textContent = 'Finish';
  bar.appendChild(finishBtn);

  container.appendChild(bar);

  // ── Helper text banner ──
  const helper = document.createElement('div');
  helper.className = 'nt-helper';

  const helperIcon = document.createElement('span');
  helperIcon.className = 'nt-helper-icon';
  helperIcon.appendChild(iconInfo());
  helper.appendChild(helperIcon);

  const helperText = document.createElement('span');
  helperText.textContent = 'Click through your app to record';
  helper.appendChild(helperText);

  const helperClose = document.createElement('button');
  helperClose.className = 'nt-helper-close';
  helperClose.appendChild(iconX());
  helper.appendChild(helperClose);

  container.appendChild(helper);

  document.body.appendChild(container);

  // ── Event bindings ──
  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pauseBtn.classList.toggle('nt-active');
  });

  cursorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cursorBtn.classList.toggle('nt-active');
  });

  // Capture on click-through (simulated via icon for now)
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Flash the bar to indicate capture
    bar.classList.add('nt-flash');
    callbacks.onCapture();
    setTimeout(() => bar.classList.remove('nt-flash'), 400);
  });

  undoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Undo last capture (decrement count)
    const current = parseInt(countBadge.textContent || '0', 10);
    if (current > 0) countBadge.textContent = String(current - 1);
  });

  finishBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    callbacks.onFinish();
  });

  helperClose.addEventListener('click', (e) => {
    e.stopPropagation();
    helper.remove();
  });
}

function createSep(): HTMLSpanElement {
  const sep = document.createElement('span');
  sep.className = 'nt-sep';
  return sep;
}

function createIconBtn(icon: SVGElement, title: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'nt-icon-btn';
  btn.title = title;
  btn.appendChild(icon);
  return btn;
}

export function updateToolbarCount(count: number): void {
  const el = document.querySelector(`#${TOOLBAR_ID} [data-nt-count]`);
  if (el) el.textContent = String(count);
}

export function removeToolbar(): void {
  document.getElementById(TOOLBAR_ID)?.remove();
  document.getElementById(`${TOOLBAR_ID}_style`)?.remove();
}
