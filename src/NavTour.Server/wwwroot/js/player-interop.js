// Spotlight overlay — premium box-shadow cutout effect
// Appended inside player-scale-wrapper so it scales with annotations
window.playerSpotlight = {
    _el: null,
    _wrapper: null,

    _getWrapper: function () {
        if (!this._wrapper) this._wrapper = document.getElementById('player-scale-wrapper');
        return this._wrapper;
    },

    show: function (xPct, yPct, wPct, hPct, opacity) {
        var wrapper = this._getWrapper();
        if (!wrapper) return;

        if (!this._el) {
            this._el = document.createElement('div');
            this._el.className = 'player-spotlight';
            this._el.style.cssText = 'position:absolute;border-radius:8px;pointer-events:none;transition:all 0.35s ease;z-index:100;';
            wrapper.appendChild(this._el);
        }

        var op = opacity != null ? opacity : 0.5;
        this._el.style.left = xPct + '%';
        this._el.style.top = yPct + '%';
        this._el.style.width = wPct + '%';
        this._el.style.height = hPct + '%';
        this._el.style.boxShadow = '0 0 0 9999px rgba(0,0,0,' + op + ')';
        this._el.style.display = '';
    },

    morphTo: function (xPct, yPct, wPct, hPct) {
        if (!this._el) return;
        this._el.style.left = xPct + '%';
        this._el.style.top = yPct + '%';
        this._el.style.width = wPct + '%';
        this._el.style.height = hPct + '%';
    },

    showFlat: function (opacity) {
        var wrapper = this._getWrapper();
        if (!wrapper) return;

        if (!this._el) {
            this._el = document.createElement('div');
            this._el.className = 'player-spotlight';
            wrapper.appendChild(this._el);
        }

        var op = opacity != null ? opacity : 0.35;
        // Use box-shadow to dim beyond wrapper bounds (covers margins around scaled content)
        this._el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:100;box-shadow:0 0 0 9999px rgba(0,0,0,' + op + ');transition:all 0.35s ease;';
    },

    hide: function () {
        if (this._el) {
            this._el.remove();
            this._el = null;
        }
        this._wrapper = null;
    }
};

// Player JS interop — handles iframe trigger detection
window.playerInterop = {
    _cleanup: null,

    // Wait for iframe to finish loading its srcdoc content
    waitForIframeLoad: function (iframeSelector) {
        return new Promise(function (resolve) {
            var iframe = document.querySelector(iframeSelector);
            if (!iframe) { resolve(false); return; }
            // Check if content is already loaded
            if (iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.children.length > 0) {
                resolve(true); return;
            }
            // Wait for the load event
            var timeout = setTimeout(function () { resolve(false); }, 5000);
            iframe.addEventListener('load', function () {
                clearTimeout(timeout);
                resolve(true);
            }, { once: true });
        });
    },

    // Set up trigger detection inside the iframe
    setupTrigger: function (dotnetRef, iframeSelector, triggerType, selector, durationMs) {
        this.clearTrigger();

        var iframe = document.querySelector(iframeSelector);
        if (!iframe || !iframe.contentDocument) return false;

        var doc = iframe.contentDocument;
        var cleanupFns = [];

        if (triggerType === "ElementClick" && selector) {
            var targets = doc.querySelectorAll(selector);
            if (targets.length === 0) return false;

            var handler = function (e) {
                e.preventDefault();
                e.stopPropagation();
                dotnetRef.invokeMethodAsync("OnTriggerFired");
            };

            targets.forEach(function (el) {
                el.style.cursor = "pointer";
                el.style.outline = "2px dashed #4361ee";
                el.style.outlineOffset = "2px";
                el.addEventListener("click", handler, { once: true });
                cleanupFns.push(function () {
                    el.style.cursor = "";
                    el.style.outline = "";
                    el.style.outlineOffset = "";
                    el.removeEventListener("click", handler);
                });
            });
        } else if (triggerType === "TextInput" && selector) {
            var input = doc.querySelector(selector);
            if (!input) return false;

            input.style.outline = "2px dashed #4361ee";
            input.style.outlineOffset = "2px";
            input.focus();

            var inputHandler = function () {
                if (input.value && input.value.length > 0) {
                    dotnetRef.invokeMethodAsync("OnTriggerFired");
                }
            };

            input.addEventListener("input", inputHandler);
            cleanupFns.push(function () {
                input.style.outline = "";
                input.style.outlineOffset = "";
                input.removeEventListener("input", inputHandler);
            });
        } else if (triggerType === "Timer" && durationMs > 0) {
            var timerId = setTimeout(function () {
                dotnetRef.invokeMethodAsync("OnTriggerFired");
            }, durationMs);

            cleanupFns.push(function () {
                clearTimeout(timerId);
            });
        }

        this._cleanup = function () {
            cleanupFns.forEach(function (fn) { fn(); });
        };

        return true;
    },

    clearTrigger: function () {
        if (this._cleanup) {
            this._cleanup();
            this._cleanup = null;
        }
    },

    // Focus the player container for keyboard events
    focusElement: function (element) {
        if (element) element.focus();
    },

    // Scale the player wrapper to fit its container while preserving aspect ratio
    _resizeObserver: null,
    initScaling: function (containerEl) {
        var DESIGN_W = 1440, DESIGN_H = 900;
        var wrapper = document.getElementById('player-scale-wrapper');
        if (!wrapper || !containerEl) return;

        function applyScale() {
            var cw = containerEl.clientWidth;
            var ch = containerEl.clientHeight;
            if (cw === 0 || ch === 0) return;
            var scale = Math.min(cw / DESIGN_W, ch / DESIGN_H);
            wrapper.style.transform = 'scale(' + scale + ')';
            var scaledW = DESIGN_W * scale;
            var scaledH = DESIGN_H * scale;
            wrapper.style.left = Math.max(0, (cw - scaledW) / 2) + 'px';
            wrapper.style.top = Math.max(0, (ch - scaledH) / 2) + 'px';
        }

        applyScale();

        this.disposeScaling();
        // ResizeObserver reliably detects container size changes (window resize, layout shifts)
        this._resizeObserver = new ResizeObserver(applyScale);
        this._resizeObserver.observe(containerEl);
    },

    disposeScaling: function () {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }
};
