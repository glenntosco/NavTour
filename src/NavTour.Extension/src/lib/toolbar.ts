/**
 * Capture Toolbar — the floating pill at the bottom of the page
 * Mirrors Navattic's capture toolbar that appears during active capture sessions.
 * Shows capture status, frame count, and action buttons.
 */

const TOOLBAR_ID = '__navtour_capture_toolbar__';

const TOOLBAR_CSS = `
#${TOOLBAR_ID} {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1a1d26;
  color: #ffffff;
  border-radius: 100px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24), 0 2px 8px rgba(0, 0, 0, 0.12);
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
  animation: __navtour_slide_up 0.3s ease-out;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@keyframes __navtour_slide_up {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

#${TOOLBAR_ID} .nt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: __navtour_pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes __navtour_pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
}

#${TOOLBAR_ID} .nt-label {
  font-weight: 500;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.9);
}

#${TOOLBAR_ID} .nt-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #4361ee;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

#${TOOLBAR_ID} .nt-sep {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

#${TOOLBAR_ID} .nt-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: none;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

#${TOOLBAR_ID} .nt-btn-capture {
  background: #4361ee;
  color: #ffffff;
}

#${TOOLBAR_ID} .nt-btn-capture:hover {
  background: #3651d4;
}

#${TOOLBAR_ID} .nt-btn-finish {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

#${TOOLBAR_ID} .nt-btn-finish:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

#${TOOLBAR_ID} .nt-btn:active {
  transform: scale(0.96);
}

#${TOOLBAR_ID}.nt-capturing .nt-btn-capture {
  opacity: 0.6;
  pointer-events: none;
}
`;

export interface ToolbarCallbacks {
  onCapture: () => void;
  onFinish: () => void;
}

function createSvgIcon(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');

  const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  outerCircle.setAttribute('cx', '12');
  outerCircle.setAttribute('cy', '12');
  outerCircle.setAttribute('r', '10');
  svg.appendChild(outerCircle);

  const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  innerCircle.setAttribute('cx', '12');
  innerCircle.setAttribute('cy', '12');
  innerCircle.setAttribute('r', '3');
  innerCircle.setAttribute('fill', 'currentColor');
  svg.appendChild(innerCircle);

  return svg;
}

export function injectToolbar(demoName: string, frameCount: number, callbacks: ToolbarCallbacks): void {
  // Remove existing toolbar if present
  removeToolbar();

  // Inject CSS
  const style = document.createElement('style');
  style.id = `${TOOLBAR_ID}_style`;
  style.textContent = TOOLBAR_CSS;
  document.head.appendChild(style);

  // Build toolbar using DOM APIs (no innerHTML)
  const toolbar = document.createElement('div');
  toolbar.id = TOOLBAR_ID;
  toolbar.setAttribute('data-navtour-toolbar', 'true');

  // Green dot
  const dot = document.createElement('span');
  dot.className = 'nt-dot';
  toolbar.appendChild(dot);

  // "NavTour" label
  const brandLabel = document.createElement('span');
  brandLabel.className = 'nt-label';
  brandLabel.textContent = 'NavTour';
  toolbar.appendChild(brandLabel);

  // Separator
  const sep1 = document.createElement('span');
  sep1.className = 'nt-sep';
  toolbar.appendChild(sep1);

  // Demo name label
  const demoLabel = document.createElement('span');
  demoLabel.className = 'nt-label';
  demoLabel.setAttribute('data-nt-demo', '');
  demoLabel.textContent = demoName;
  toolbar.appendChild(demoLabel);

  // Frame count badge
  const countBadge = document.createElement('span');
  countBadge.className = 'nt-count';
  countBadge.setAttribute('data-nt-count', '');
  countBadge.textContent = String(frameCount);
  toolbar.appendChild(countBadge);

  // Separator
  const sep2 = document.createElement('span');
  sep2.className = 'nt-sep';
  toolbar.appendChild(sep2);

  // Capture button
  const captureBtn = document.createElement('button');
  captureBtn.className = 'nt-btn nt-btn-capture';
  captureBtn.setAttribute('data-nt-capture', '');
  captureBtn.appendChild(createSvgIcon());
  const captureText = document.createTextNode(' Capture');
  captureBtn.appendChild(captureText);
  toolbar.appendChild(captureBtn);

  // Finish button
  const finishBtn = document.createElement('button');
  finishBtn.className = 'nt-btn nt-btn-finish';
  finishBtn.setAttribute('data-nt-finish', '');
  finishBtn.textContent = 'Finish';
  toolbar.appendChild(finishBtn);

  document.body.appendChild(toolbar);

  // Bind events
  captureBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toolbar.classList.add('nt-capturing');
    captureBtn.textContent = 'Capturing...';
    callbacks.onCapture();
    // Reset after delay
    setTimeout(() => {
      toolbar.classList.remove('nt-capturing');
      // Rebuild capture button content
      while (captureBtn.firstChild) captureBtn.removeChild(captureBtn.firstChild);
      captureBtn.appendChild(createSvgIcon());
      captureBtn.appendChild(document.createTextNode(' Capture'));
    }, 2000);
  });

  finishBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    callbacks.onFinish();
  });
}

export function updateToolbarCount(count: number): void {
  const el = document.querySelector(`#${TOOLBAR_ID} [data-nt-count]`);
  if (el) el.textContent = String(count);
}

export function removeToolbar(): void {
  document.getElementById(TOOLBAR_ID)?.remove();
  document.getElementById(`${TOOLBAR_ID}_style`)?.remove();
}
