// Player JS interop — handles iframe trigger detection
window.playerInterop = {
    _cleanup: null,

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
    }
};
