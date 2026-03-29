/**
 * Capture Toolbar — floating bottom-center pill matching Navattic's design.
 * - Helper text bubble above: "Click through your app to record"
 * - Main bar: logo+badge, separator, icon buttons (pause, stop, settings, no-click, undo, expand), Finish
 * - 3-2-1 countdown overlay before capture starts
 * - Right-side captures panel with list/edit views
 */

const TOOLBAR_ID = '__navtour_capture_toolbar__';
const PANEL_ID = '__navtour_captures_panel__';

// ── Module-level panel state ────────────────────────
let panelEl: HTMLElement | null = null;
let panelVisible = false;
let panelFrames: FrameCapture[] = [];

const TOOLBAR_CSS = `
#${TOOLBAR_ID} {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: __nt_su 0.3s ease-out;
}

@keyframes __nt_su {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

#${TOOLBAR_ID} * { box-sizing: border-box; margin: 0; padding: 0; }

/* Helper text bubble */
#${TOOLBAR_ID} .nt-helper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}
#${TOOLBAR_ID} .nt-helper-icon { color: #9ca3af; display: flex; }
#${TOOLBAR_ID} .nt-helper-close {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; border-radius: 50%;
  background: transparent; color: #9ca3af; cursor: pointer; padding: 0; margin-left: 4px;
}
#${TOOLBAR_ID} .nt-helper-close:hover { background: #f3f4f6; color: #374151; }

/* Main bar */
#${TOOLBAR_ID} .nt-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
}

/* Logo + badge */
#${TOOLBAR_ID} .nt-brand { position: relative; display: flex; align-items: center; margin-right: 4px; }
#${TOOLBAR_ID} .nt-logo { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #1e3a5f; }
#${TOOLBAR_ID} .nt-count {
  position: absolute; bottom: -3px; right: -7px;
  min-width: 18px; height: 18px; padding: 0 4px;
  background: #4361ee; color: #fff; border-radius: 100px;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}

/* Separator */
#${TOOLBAR_ID} .nt-sep { width: 1px; height: 22px; background: #e5e7eb; margin: 0 6px; }

/* Icon buttons */
#${TOOLBAR_ID} .nt-icons { display: flex; align-items: center; gap: 2px; }
#${TOOLBAR_ID} .nt-ib {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border: none; border-radius: 8px;
  background: transparent; color: #4b5563; cursor: pointer;
  transition: all .12s; padding: 0;
}
#${TOOLBAR_ID} .nt-ib:hover { background: #f3f4f6; color: #111827; }
#${TOOLBAR_ID} .nt-ib.nt-active { background: #eff6ff; color: #4361ee; }
#${TOOLBAR_ID} .nt-ib svg { width: 18px; height: 18px; }

/* Finish button */
#${TOOLBAR_ID} .nt-finish {
  display: inline-flex; align-items: center;
  padding: 6px 16px; border: 1px solid #d1d5db; border-radius: 8px;
  background: #fff; color: #374151; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s; margin-left: 4px;
}
#${TOOLBAR_ID} .nt-finish:hover { background: #f9fafb; border-color: #9ca3af; }

/* Screen size warning */
#${TOOLBAR_ID} .nt-size-warn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; margin-bottom: 8px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
  font-size: 12px; color: #92400e; white-space: nowrap;
}
#${TOOLBAR_ID} .nt-size-warn-icon { color: #f59e0b; display: flex; flex-shrink: 0; }
#${TOOLBAR_ID} .nt-size-warn strong { color: #78350f; }
#${TOOLBAR_ID} .nt-size-warn .nt-size-current { color: #b45309; font-weight: 600; }
#${TOOLBAR_ID} .nt-size-warn .nt-size-rec { color: #065f46; font-weight: 600; }
#${TOOLBAR_ID} .nt-resize-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border: 1px solid #fde68a; border-radius: 6px;
  background: #fff; color: #92400e; font-size: 11px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s; margin-left: 4px;
}
#${TOOLBAR_ID} .nt-resize-btn:hover { background: #fef3c7; border-color: #f59e0b; }
#${TOOLBAR_ID} .nt-size-close {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border: none; border-radius: 50%;
  background: transparent; color: #b45309; cursor: pointer; padding: 0; margin-left: 2px;
}
#${TOOLBAR_ID} .nt-size-close:hover { background: #fde68a; }

/* Countdown overlay */
#__navtour_countdown__ {
  position: fixed; inset: 0; z-index: 2147483646;
  background: rgba(0,0,0,.35);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer; animation: __nt_fi .2s ease-out;
}
@keyframes __nt_fi { from { opacity: 0; } to { opacity: 1; } }
#__navtour_countdown__ .nt-cd-number {
  font-size: 160px; font-weight: 300; color: #fff; line-height: 1;
  text-shadow: 0 4px 24px rgba(0,0,0,.3); animation: __nt_pop 1s ease-out;
}
@keyframes __nt_pop { 0% { transform: scale(1.3); opacity: 0; } 30% { transform: scale(1); opacity: 1; } 100% { opacity: 1; } }
#__navtour_countdown__ .nt-cd-pill {
  display: flex; align-items: center; gap: 8px; padding: 10px 20px;
  background: #fff; border-radius: 100px; box-shadow: 0 4px 16px rgba(0,0,0,.12);
  font-size: 14px; font-weight: 500; color: #374151;
}
#__navtour_countdown__ .nt-cd-pill svg { color: #4361ee; }
#__navtour_countdown__ .nt-cd-skip { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 4px; }

/* ── Captures Panel ─────────────────────────────────── */
#${PANEL_ID} {
  position: fixed;
  top: 0;
  right: -290px;
  width: 290px;
  height: 100vh;
  background: #fff;
  z-index: 2147483646;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,.1);
  border-left: 1px solid #e5e7eb;
  transition: right 0.25s ease;
}
#${PANEL_ID} * { box-sizing: border-box; margin: 0; padding: 0; }
#${PANEL_ID}.nt-panel-open { right: 0; }

/* Panel header */
#${PANEL_ID} .nt-panel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px; border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
#${PANEL_ID} .nt-panel-title {
  font-size: 14px; font-weight: 600; color: #111827;
}
#${PANEL_ID} .nt-panel-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px;
  background: #4361ee; color: #fff; border-radius: 100px;
  font-size: 11px; font-weight: 700;
}
#${PANEL_ID} .nt-panel-close {
  margin-left: auto;
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; border-radius: 6px;
  background: transparent; color: #6b7280; cursor: pointer; padding: 0;
}
#${PANEL_ID} .nt-panel-close:hover { background: #f3f4f6; color: #111827; }

/* Panel list (scrollable) */
#${PANEL_ID} .nt-panel-list {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}

/* Thumbnail card */
#${PANEL_ID} .nt-panel-card {
  position: relative;
  border: 1px solid #e5e7eb; border-radius: 8px;
  overflow: hidden; cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}
#${PANEL_ID} .nt-panel-card:hover {
  border-color: #4361ee; box-shadow: 0 0 0 1px #4361ee;
}
#${PANEL_ID} .nt-panel-card-img {
  width: 100%; height: 140px; object-fit: cover; display: block;
  background: #f9fafb;
}
#${PANEL_ID} .nt-panel-card-info {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
}
#${PANEL_ID} .nt-panel-card-number {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 6px;
  background: #f3f4f6; color: #374151; border-radius: 100px;
  font-size: 11px; font-weight: 600;
}
#${PANEL_ID} .nt-panel-card-title {
  font-size: 12px; color: #374151; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  flex: 1;
}

/* Panel footer */
#${PANEL_ID} .nt-panel-footer {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 16px; border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}
#${PANEL_ID} .nt-panel-btn-continue {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
  background: #f9fafb; color: #374151; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s;
}
#${PANEL_ID} .nt-panel-btn-continue:hover { background: #f3f4f6; border-color: #9ca3af; }
#${PANEL_ID} .nt-panel-btn-complete {
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 8px 12px; border: none; border-radius: 8px;
  background: #16a34a; color: #fff; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s;
}
#${PANEL_ID} .nt-panel-btn-complete:hover { background: #15803d; }

/* ── Panel Edit View ──────────────────────────────── */
#${PANEL_ID} .nt-panel-edit {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 16px;
}
#${PANEL_ID} .nt-panel-breadcrumb {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #6b7280; cursor: pointer;
}
#${PANEL_ID} .nt-panel-breadcrumb:hover { color: #4361ee; }
#${PANEL_ID} .nt-panel-breadcrumb svg { flex-shrink: 0; }

#${PANEL_ID} .nt-panel-edit-title-input {
  width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 13px; font-family: inherit; color: #111827;
  outline: none; transition: border-color 0.12s;
}
#${PANEL_ID} .nt-panel-edit-title-input:focus { border-color: #4361ee; box-shadow: 0 0 0 2px rgba(67,97,238,.15); }

#${PANEL_ID} .nt-panel-edit-thumb {
  width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;
  object-fit: cover; display: block; background: #f9fafb;
}

#${PANEL_ID} .nt-panel-edit-label {
  font-size: 12px; font-weight: 600; color: #374151;
  margin-bottom: 6px;
}

/* Step type radio group */
#${PANEL_ID} .nt-panel-radio-group {
  display: flex; gap: 6px;
}
#${PANEL_ID} .nt-panel-radio {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px;
  background: #fff; color: #374151; font-size: 12px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s;
}
#${PANEL_ID} .nt-panel-radio:hover { border-color: #9ca3af; }
#${PANEL_ID} .nt-panel-radio.nt-radio-active {
  border-color: #4361ee; background: #eff6ff; color: #4361ee;
}

#${PANEL_ID} .nt-panel-edit-textarea {
  width: 100%; min-height: 80px; padding: 8px 10px;
  border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 13px; font-family: inherit; color: #111827;
  resize: vertical; outline: none; transition: border-color 0.12s;
}
#${PANEL_ID} .nt-panel-edit-textarea:focus { border-color: #4361ee; box-shadow: 0 0 0 2px rgba(67,97,238,.15); }

/* Edit view footer buttons */
#${PANEL_ID} .nt-panel-edit-footer {
  display: flex; gap: 8px; margin-top: auto;
}
#${PANEL_ID} .nt-panel-btn-delete {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 8px 12px; border: 1px solid #fca5a5; border-radius: 8px;
  background: #fff; color: #dc2626; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s;
}
#${PANEL_ID} .nt-panel-btn-delete:hover { background: #fef2f2; border-color: #f87171; }
#${PANEL_ID} .nt-panel-btn-save {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 8px 12px; border: none; border-radius: 8px;
  background: #4361ee; color: #fff; font-size: 13px; font-weight: 500;
  font-family: inherit; cursor: pointer; transition: all .12s;
}
#${PANEL_ID} .nt-panel-btn-save:hover { background: #3b55d4; }
`;

// ── SVG helpers ─────────────────────────────────────

function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function createSvg(children: SVGElement[], size = 18): SVGElement {
  const svg = svgEl('svg', {
    width: String(size), height: String(size), viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  children.forEach(c => svg.appendChild(c));
  return svg;
}

// Icons matching Navattic's bar
function iconCamera(): SVGElement {
  return createSvg([
    svgEl('path', { d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' }),
    svgEl('circle', { cx: '12', cy: '13', r: '4' }),
  ], 22);
}
function iconPause(): SVGElement {
  return createSvg([
    svgEl('rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }),
    svgEl('rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }),
  ]);
}
function iconStop(): SVGElement {
  return createSvg([svgEl('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' })]);
}
function iconSettings(): SVGElement {
  return createSvg([
    svgEl('circle', { cx: '12', cy: '12', r: '3' }),
    svgEl('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }),
  ]);
}
function iconNoClick(): SVGElement {
  return createSvg([
    svgEl('circle', { cx: '12', cy: '12', r: '10' }),
    svgEl('line', { x1: '4.93', y1: '4.93', x2: '19.07', y2: '19.07' }),
  ]);
}
function iconUndo(): SVGElement {
  return createSvg([
    svgEl('polyline', { points: '1 4 1 10 7 10' }),
    svgEl('path', { d: 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10' }),
  ]);
}
function iconExpand(): SVGElement {
  return createSvg([
    svgEl('polyline', { points: '15 3 21 3 21 9' }),
    svgEl('polyline', { points: '9 21 3 21 3 15' }),
    svgEl('line', { x1: '21', y1: '3', x2: '14', y2: '10' }),
    svgEl('line', { x1: '3', y1: '21', x2: '10', y2: '14' }),
  ]);
}
function iconInfo(size = 14): SVGElement {
  return createSvg([
    svgEl('circle', { cx: '12', cy: '12', r: '10' }),
    svgEl('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
    svgEl('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' }),
  ], size);
}
function iconX(size = 14): SVGElement {
  return createSvg([
    svgEl('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    svgEl('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
  ], size);
}

function iconWarning(size = 14): SVGElement {
  return createSvg([
    svgEl('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
    svgEl('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
    svgEl('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }),
  ], size);
}

function iconResize(): SVGElement {
  return createSvg([
    svgEl('polyline', { points: '15 3 21 3 21 9' }),
    svgEl('polyline', { points: '9 21 3 21 3 15' }),
    svgEl('line', { x1: '21', y1: '3', x2: '14', y2: '10' }),
    svgEl('line', { x1: '3', y1: '21', x2: '10', y2: '14' }),
  ], 12);
}

function iconChevronLeft(size = 14): SVGElement {
  return createSvg([
    svgEl('polyline', { points: '15 18 9 12 15 6' }),
  ], size);
}

function createBlurIcon(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '1'); line.setAttribute('y1', '1');
  line.setAttribute('x2', '23'); line.setAttribute('y2', '23');
  svg.appendChild(path1);
  svg.appendChild(line);
  return svg;
}

const RECOMMENDED_WIDTH = 1440;
const RECOMMENDED_HEIGHT = 900;

function checkScreenSize(): { tooLarge: boolean; tooSmall: boolean; current: string; recommended: string } | null {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const recommended = `${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}`;
  const current = `${w}x${h}`;

  if (w > RECOMMENDED_WIDTH + 100 || h > RECOMMENDED_HEIGHT + 100) {
    return { tooLarge: true, tooSmall: false, current, recommended };
  }
  if (w < RECOMMENDED_WIDTH - 200 || h < RECOMMENDED_HEIGHT - 200) {
    return { tooLarge: false, tooSmall: true, current, recommended };
  }
  return null;
}

function createSizeWarning(container: HTMLElement): void {
  const info = checkScreenSize();
  if (!info) return;

  const warn = document.createElement('div');
  warn.className = 'nt-size-warn';

  const warnIcon = document.createElement('span');
  warnIcon.className = 'nt-size-warn-icon';
  warnIcon.appendChild(iconWarning());
  warn.appendChild(warnIcon);

  const text = document.createElement('span');
  const label = info.tooLarge ? 'Screen size larger than recommended' : 'Screen size smaller than recommended';
  text.appendChild(document.createTextNode(label + '  '));

  const currentSpan = document.createElement('span');
  currentSpan.className = 'nt-size-current';
  currentSpan.textContent = `Current: ${info.current}`;
  text.appendChild(currentSpan);

  text.appendChild(document.createTextNode('  '));

  const recSpan = document.createElement('span');
  recSpan.className = 'nt-size-rec';
  recSpan.textContent = `Recommended: ${info.recommended}`;
  text.appendChild(recSpan);

  warn.appendChild(text);

  // Resize button
  const resizeBtn = document.createElement('button');
  resizeBtn.className = 'nt-resize-btn';
  resizeBtn.appendChild(iconResize());
  resizeBtn.appendChild(document.createTextNode('Resize'));
  warn.appendChild(resizeBtn);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'nt-size-close';
  closeBtn.appendChild(iconX(12));
  warn.appendChild(closeBtn);

  // Insert before bar (first child)
  container.insertBefore(warn, container.firstChild);

  resizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Request window resize via chrome extension API
    chrome.runtime?.sendMessage?.({
      kind: 'navtour:resize-window',
      width: RECOMMENDED_WIDTH,
      height: RECOMMENDED_HEIGHT,
    });
    warn.remove();
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    warn.remove();
  });
}

// ── Countdown ───────────────────────────────────────

export function showCountdown(onComplete: () => void): void {
  const ID = '__navtour_countdown__';
  document.getElementById(ID)?.remove();

  const overlay = document.createElement('div');
  overlay.id = ID;

  const numberEl = document.createElement('div');
  numberEl.className = 'nt-cd-number';
  numberEl.textContent = '3';
  overlay.appendChild(numberEl);

  const pill = document.createElement('div');
  pill.className = 'nt-cd-pill';
  const pi = document.createElement('span');
  pi.appendChild(iconCamera());
  pill.appendChild(pi);
  const pt = document.createElement('span');
  pt.textContent = 'Click through your app to record';
  pill.appendChild(pt);
  overlay.appendChild(pill);

  const skip = document.createElement('div');
  skip.className = 'nt-cd-skip';
  skip.textContent = 'Click anywhere to skip countdown';
  overlay.appendChild(skip);

  document.body.appendChild(overlay);

  let count = 3;
  let cancelled = false;
  const cleanup = () => { cancelled = true; overlay.remove(); };

  overlay.addEventListener('click', () => { cleanup(); onComplete(); });

  const tick = () => {
    if (cancelled) return;
    count--;
    if (count <= 0) { cleanup(); onComplete(); return; }
    numberEl.textContent = String(count);
    numberEl.style.animation = 'none';
    void numberEl.offsetHeight;
    numberEl.style.animation = '__nt_pop 1s ease-out';
    setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
}

// ── Toolbar ─────────────────────────────────────────

export interface ToolbarCallbacks {
  onCapture: () => void;
  onFinish: () => void;
  onExpandToggle: () => void;
}

function createIconBtn(icon: SVGElement, title: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'nt-ib';
  btn.title = title;
  btn.appendChild(icon);
  return btn;
}

export function injectToolbar(demoName: string, frameCount: number, callbacks: ToolbarCallbacks): void {
  removeToolbar();

  const style = document.createElement('style');
  style.id = `${TOOLBAR_ID}_style`;
  style.textContent = TOOLBAR_CSS;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = TOOLBAR_ID;
  container.setAttribute('data-navtour-toolbar', 'true');

  // Helper text
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
  helperClose.addEventListener('click', (e) => { e.stopPropagation(); helper.remove(); });

  // Main bar
  const bar = document.createElement('div');
  bar.className = 'nt-bar';

  // Brand logo + count badge
  const brand = document.createElement('div');
  brand.className = 'nt-brand';
  const logo = document.createElement('div');
  logo.className = 'nt-logo';
  logo.appendChild(iconCamera());
  brand.appendChild(logo);
  const countBadge = document.createElement('span');
  countBadge.className = 'nt-count';
  countBadge.setAttribute('data-nt-count', '');
  countBadge.textContent = String(frameCount);
  brand.appendChild(countBadge);
  bar.appendChild(brand);

  // Separator
  const sep = document.createElement('span');
  sep.className = 'nt-sep';
  bar.appendChild(sep);

  // Icon buttons
  const icons = document.createElement('div');
  icons.className = 'nt-icons';

  const pauseBtn = createIconBtn(iconPause(), 'Pause capture');
  const stopBtn = createIconBtn(iconStop(), 'Stop capture');
  const settingsBtn = createIconBtn(iconSettings(), 'Settings');
  const noClickBtn = createIconBtn(iconNoClick(), 'Disable clicks');
  const undoBtn = createIconBtn(iconUndo(), 'Undo last capture');
  const expandBtn = createIconBtn(iconExpand(), 'Toggle captures panel');

  icons.appendChild(pauseBtn);
  icons.appendChild(stopBtn);
  icons.appendChild(settingsBtn);
  icons.appendChild(noClickBtn);
  icons.appendChild(undoBtn);
  icons.appendChild(expandBtn);
  bar.appendChild(icons);

  // Blur toggle button
  const blurBtn = createIconBtn(createBlurIcon(), 'Toggle Smart Blur');
  blurBtn.style.cssText = 'background:none;border:1px solid rgba(75,85,99,0.3);border-radius:6px;padding:6px 10px;cursor:pointer;display:flex;align-items:center;gap:6px;color:#4b5563;font-size:12px;font-weight:500;transition:all 150ms;width:auto;height:auto;';
  let blurActive = false;

  blurBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    blurActive = !blurActive;
    blurBtn.style.borderColor = blurActive ? '#4361ee' : 'rgba(75,85,99,0.3)';
    blurBtn.style.background = blurActive ? 'rgba(67,97,238,0.1)' : 'none';
    blurBtn.style.color = blurActive ? '#4361ee' : '#4b5563';

    if (blurActive) {
      chrome.runtime.sendMessage({ kind: 'navtour:smart-blur-manual-start' });
    } else {
      chrome.runtime.sendMessage({ kind: 'navtour:smart-blur-manual-stop' });
    }
  });

  icons.appendChild(blurBtn);

  // Finish button
  const finishBtn = document.createElement('button');
  finishBtn.className = 'nt-finish';
  finishBtn.textContent = 'Finish';
  bar.appendChild(finishBtn);

  container.appendChild(bar);
  document.body.appendChild(container);

  // Screen size warning (shows above helper if screen is wrong size)
  createSizeWarning(container);

  // Events
  pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); pauseBtn.classList.toggle('nt-active'); });
  noClickBtn.addEventListener('click', (e) => { e.stopPropagation(); noClickBtn.classList.toggle('nt-active'); });
  undoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cur = parseInt(countBadge.textContent || '0', 10);
    if (cur > 0) countBadge.textContent = String(cur - 1);
  });

  expandBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onExpandToggle(); });

  finishBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); callbacks.onFinish(); });

  // Capture button (stop icon triggers manual capture)
  stopBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onCapture(); });
}

export function updateToolbarCount(count: number): void {
  const el = document.querySelector(`#${TOOLBAR_ID} [data-nt-count]`);
  if (el) el.textContent = String(count);
}

export function removeToolbar(): void {
  document.getElementById(TOOLBAR_ID)?.remove();
  document.getElementById(`${TOOLBAR_ID}_style`)?.remove();
}

// ── Captures Panel ──────────────────────────────────

export interface FrameCapture {
  index: number;
  title: string;
  url: string;
  thumbnailDataUrl: string;
  status: string;
  timestamp: number;
  frameId?: string;
  stepType?: string;
  stepText?: string;
}

export interface PanelCallbacks {
  onContinue: () => void;
  onComplete: () => void;
  onDeleteFrame: (index: number) => void;
  onSaveStep: (index: number, stepType: string, stepText: string, title: string) => void;
}

export function createCapturesPanel(callbacks: PanelCallbacks): void {
  removeCapturesPanel();
  panelFrames = [];

  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  // Header
  const header = document.createElement('div');
  header.className = 'nt-panel-header';

  const title = document.createElement('span');
  title.className = 'nt-panel-title';
  title.textContent = 'Captures';
  header.appendChild(title);

  const countBadge = document.createElement('span');
  countBadge.className = 'nt-panel-count';
  countBadge.setAttribute('data-nt-panel-count', '');
  countBadge.textContent = '0';
  header.appendChild(countBadge);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'nt-panel-close';
  closeBtn.appendChild(iconX(16));
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel(false);
  });
  header.appendChild(closeBtn);

  panel.appendChild(header);

  // Scrollable list
  const list = document.createElement('div');
  list.className = 'nt-panel-list';
  list.setAttribute('data-nt-panel-list', '');
  panel.appendChild(list);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'nt-panel-footer';

  const continueBtn = document.createElement('button');
  continueBtn.className = 'nt-panel-btn-continue';
  continueBtn.textContent = 'Continue capturing';
  continueBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onContinue();
  });
  footer.appendChild(continueBtn);

  const completeBtn = document.createElement('button');
  completeBtn.className = 'nt-panel-btn-complete';
  completeBtn.textContent = 'Complete session';
  completeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onComplete();
  });
  footer.appendChild(completeBtn);

  panel.appendChild(footer);

  document.body.appendChild(panel);
  panelEl = panel;
}

export function addFrameToPanel(frame: FrameCapture): void {
  panelFrames.push(frame);

  const list = panelEl?.querySelector('[data-nt-panel-list]');
  if (!list) return;

  const card = document.createElement('div');
  card.className = 'nt-panel-card';
  card.setAttribute('data-nt-panel-frame-index', String(frame.index));

  const img = document.createElement('img');
  img.className = 'nt-panel-card-img';
  img.src = frame.thumbnailDataUrl;
  img.alt = frame.title;
  card.appendChild(img);

  const info = document.createElement('div');
  info.className = 'nt-panel-card-info';

  const numberBadge = document.createElement('span');
  numberBadge.className = 'nt-panel-card-number';
  numberBadge.textContent = String(frame.index + 1);
  info.appendChild(numberBadge);

  const titleSpan = document.createElement('span');
  titleSpan.className = 'nt-panel-card-title';
  titleSpan.textContent = frame.title;
  info.appendChild(titleSpan);

  card.appendChild(info);
  list.appendChild(card);

  // Update count badge
  const countEl = panelEl?.querySelector('[data-nt-panel-count]');
  if (countEl) countEl.textContent = String(panelFrames.length);
}

export function showPanelEditView(frame: FrameCapture, callbacks: PanelCallbacks): void {
  if (!panelEl) return;

  // Hide list and footer
  const list = panelEl.querySelector('[data-nt-panel-list]') as HTMLElement | null;
  const footer = panelEl.querySelector('.nt-panel-footer') as HTMLElement | null;
  if (list) list.style.display = 'none';
  if (footer) footer.style.display = 'none';

  // Remove any existing edit view
  panelEl.querySelector('.nt-panel-edit')?.remove();

  const edit = document.createElement('div');
  edit.className = 'nt-panel-edit';

  // Breadcrumb: back to list
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'nt-panel-breadcrumb';
  breadcrumb.appendChild(iconChevronLeft(12));
  const breadcrumbText = document.createElement('span');
  breadcrumbText.textContent = 'All captures';
  breadcrumb.appendChild(breadcrumbText);
  breadcrumb.addEventListener('click', (e) => {
    e.stopPropagation();
    showPanelListView();
  });
  edit.appendChild(breadcrumb);

  // Editable title input
  const titleLabel = document.createElement('div');
  titleLabel.className = 'nt-panel-edit-label';
  titleLabel.textContent = 'Title';
  edit.appendChild(titleLabel);

  const titleInput = document.createElement('input');
  titleInput.className = 'nt-panel-edit-title-input';
  titleInput.type = 'text';
  titleInput.value = frame.title;
  titleInput.placeholder = 'Frame title';
  edit.appendChild(titleInput);

  // Large thumbnail
  const thumb = document.createElement('img');
  thumb.className = 'nt-panel-edit-thumb';
  thumb.src = frame.thumbnailDataUrl;
  thumb.alt = frame.title;
  edit.appendChild(thumb);

  // Step type picker
  const typeLabel = document.createElement('div');
  typeLabel.className = 'nt-panel-edit-label';
  typeLabel.textContent = 'Step type';
  edit.appendChild(typeLabel);

  const radioGroup = document.createElement('div');
  radioGroup.className = 'nt-panel-radio-group';

  let selectedType = frame.stepType || 'Modal';
  const types = ['Modal', 'Tooltip', 'Invisible'];

  const radioButtons: HTMLButtonElement[] = [];
  types.forEach((t) => {
    const radio = document.createElement('button');
    radio.className = 'nt-panel-radio';
    if (t === selectedType) radio.classList.add('nt-radio-active');
    radio.textContent = t;
    radio.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedType = t;
      radioButtons.forEach(rb => rb.classList.remove('nt-radio-active'));
      radio.classList.add('nt-radio-active');
    });
    radioButtons.push(radio);
    radioGroup.appendChild(radio);
  });
  edit.appendChild(radioGroup);

  // Step text textarea
  const textLabel = document.createElement('div');
  textLabel.className = 'nt-panel-edit-label';
  textLabel.textContent = 'Step text';
  edit.appendChild(textLabel);

  const textarea = document.createElement('textarea');
  textarea.className = 'nt-panel-edit-textarea';
  textarea.value = frame.stepText || '';
  textarea.placeholder = 'Describe this step...';
  edit.appendChild(textarea);

  // Footer buttons
  const editFooter = document.createElement('div');
  editFooter.className = 'nt-panel-edit-footer';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'nt-panel-btn-delete';
  deleteBtn.textContent = 'Delete capture';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onDeleteFrame(frame.index);
  });
  editFooter.appendChild(deleteBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'nt-panel-btn-save';
  saveBtn.textContent = 'Save and review';
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    callbacks.onSaveStep(frame.index, selectedType, textarea.value, titleInput.value);
  });
  editFooter.appendChild(saveBtn);

  edit.appendChild(editFooter);
  panelEl.appendChild(edit);
}

export function showPanelListView(): void {
  if (!panelEl) return;

  // Remove edit view
  panelEl.querySelector('.nt-panel-edit')?.remove();

  // Show list and footer
  const list = panelEl.querySelector('[data-nt-panel-list]') as HTMLElement | null;
  const footer = panelEl.querySelector('.nt-panel-footer') as HTMLElement | null;
  if (list) list.style.display = '';
  if (footer) footer.style.display = '';
}

export function togglePanel(show?: boolean): void {
  if (!panelEl) return;
  const shouldShow = show !== undefined ? show : !panelVisible;
  panelVisible = shouldShow;
  if (shouldShow) {
    panelEl.classList.add('nt-panel-open');
  } else {
    panelEl.classList.remove('nt-panel-open');
  }
}

export function removeCapturesPanel(): void {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
  panelVisible = false;
  panelFrames = [];
}
