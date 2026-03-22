window.clickElement = function (id) {
    var el = document.getElementById(id);
    if (el) el.click();
};

window.annotationDrag = {
    getParentSize: function (el) {
        var parent = el ? el.parentElement : null;
        if (parent) return [parent.offsetWidth, parent.offsetHeight];
        return [1200, 700];
    }
};

window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text);
};

window.tourInterop = {
    _overlay: null,
    _dotNet: null,
    _busy: false,
    _registerDotNet: function (ref) {
        this._dotNet = ref;
    },
    isCompleted: function () {
        return localStorage.getItem("navtour_tour_completed") === "true";
    },
    markCompleted: function () {
        localStorage.setItem("navtour_tour_completed", "true");
    },
    reset: function () {
        localStorage.removeItem("navtour_tour_completed");
    },
    getElementRect: function (selector) {
        var el = document.querySelector(selector);
        if (!el) return null;
        var rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    },
    _makeEl: function (tag, styles, text) {
        var e = document.createElement(tag);
        if (styles) e.style.cssText = styles;
        if (text) e.textContent = text;
        return e;
    },
    show: function (selector, title, desc, dotCount, activeIndex, showBack) {
        this.hide();
        var mk = this._makeEl;
        var el = selector ? document.querySelector(selector) : null;
        var rect = el ? el.getBoundingClientRect() : null;

        var overlay = mk('div', 'position:fixed;inset:0;z-index:99999;pointer-events:all;');
        overlay.className = 'tour-overlay-js';

        if (rect) {
            overlay.appendChild(mk('div',
                'position:fixed;z-index:99999;border-radius:8px;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);pointer-events:none;transition:all 0.35s ease;' +
                'left:' + (rect.left - 4) + 'px;top:' + (rect.top - 4) + 'px;width:' + (rect.width + 8) + 'px;height:' + (rect.height + 8) + 'px;'));
        } else {
            overlay.appendChild(mk('div', 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;'));
        }

        var card = mk('div', 'position:fixed;z-index:100000;background:#fff;border-radius:12px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);max-width:320px;');

        if (rect) {
            var vw = window.innerWidth;
            if (rect.left + rect.width / 2 < vw / 2) {
                card.style.left = (rect.right + 16) + 'px';
                card.style.top = Math.max(8, rect.top) + 'px';
            } else {
                card.style.right = (vw - rect.left + 16) + 'px';
                card.style.top = Math.max(8, rect.top) + 'px';
            }
            if (rect.top < 80) {
                card.style.top = (rect.bottom + 12) + 'px';
                card.style.left = rect.left + 'px';
                card.style.right = '';
            }
        } else {
            card.style.top = '50%'; card.style.left = '50%'; card.style.transform = 'translate(-50%,-50%)';
        }

        card.appendChild(mk('h3', 'margin:0 0 8px;font-size:16px;font-weight:600;color:#1a1a2e;', title));
        card.appendChild(mk('p', 'margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.5;', desc));

        var dots = mk('div', 'display:flex;gap:6px;margin-bottom:16px;');
        for (var i = 0; i < dotCount; i++) {
            dots.appendChild(mk('div', 'width:6px;height:6px;border-radius:50%;background:' + (i === activeIndex ? '#4361ee' : '#d1d5db') + ';'));
        }
        card.appendChild(dots);

        var actions = mk('div', 'display:flex;justify-content:space-between;align-items:center;');
        var skipBtn = mk('button', 'background:none;border:none;color:#64748b;cursor:pointer;font-size:13px;', 'Skip tour');
        skipBtn.className = 'tour-skip-btn';
        actions.appendChild(skipBtn);

        var btnGroup = mk('div', 'display:flex;gap:8px;');
        if (showBack) {
            var backBtn = mk('button', 'padding:6px 16px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:13px;font-weight:500;', 'Back');
            backBtn.className = 'tour-back-btn';
            btnGroup.appendChild(backBtn);
        }
        var nextBtn = mk('button', 'padding:6px 16px;border-radius:6px;border:none;background:#4361ee;color:#fff;cursor:pointer;font-size:13px;font-weight:500;', activeIndex === dotCount - 1 ? 'Finish' : 'Next');
        nextBtn.className = 'tour-next-btn';
        btnGroup.appendChild(nextBtn);
        actions.appendChild(btnGroup);
        card.appendChild(actions);

        var self = this;
        function guardedCall(method) {
            if (self._busy || !self._dotNet) return;
            self._busy = true;
            self._dotNet.invokeMethodAsync(method).finally(function () { self._busy = false; });
        }
        skipBtn.addEventListener('click', function () { guardedCall('OnTourSkip'); });
        nextBtn.addEventListener('click', function () { guardedCall('OnTourNext'); });
        if (showBack) {
            backBtn.addEventListener('click', function () { guardedCall('OnTourBack'); });
        }

        overlay.appendChild(card);
        document.body.appendChild(overlay);
        this._overlay = overlay;
    },
    hide: function () {
        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }
    }
};

window.sidebarToggle = {
    _open: false,
    toggle: function() {
        this._open = !this._open;
        var sidebar = document.querySelector('.e-sidebar');
        if (!sidebar) return;
        if (this._open) {
            sidebar.classList.remove('e-close');
            sidebar.classList.add('e-open');
            sidebar.style.width = '250px';
        } else {
            sidebar.classList.remove('e-open');
            sidebar.classList.add('e-close');
            sidebar.style.width = '';
        }
    }
};

window.voiceover = {
    _muted: false,
    _utterance: null,
    speak: function(text, lang) {
        if (this._muted || !text) return;
        window.speechSynthesis.cancel();
        this._utterance = new SpeechSynthesisUtterance(text);
        this._utterance.lang = lang || 'en-US';
        this._utterance.rate = 0.95;
        this._utterance.pitch = 1;
        window.speechSynthesis.speak(this._utterance);
    },
    stop: function() {
        window.speechSynthesis.cancel();
    },
    toggleMute: function() {
        this._muted = !this._muted;
        if (this._muted) window.speechSynthesis.cancel();
        return this._muted;
    },
    isMuted: function() {
        return this._muted;
    }
};

window.authStorage = {
    save: function (token, tenantId) {
        localStorage.setItem("navtour_token", token);
        localStorage.setItem("navtour_tenant", tenantId);
    },
    load: function () {
        var token = localStorage.getItem("navtour_token");
        var tenantId = localStorage.getItem("navtour_tenant");
        if (token && tenantId) return { token: token, tenantId: tenantId };
        return null;
    },
    clear: function () {
        localStorage.removeItem("navtour_token");
        localStorage.removeItem("navtour_tenant");
    }
};
