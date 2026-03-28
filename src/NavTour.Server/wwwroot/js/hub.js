(function() {
    'use strict';

    var API_BASE = ''; // Will be set from script src origin
    var hubData = null;
    var isOpen = false;
    var launcher = null;
    var drawer = null;
    var activeCategory = null;
    var searchText = '';

    // Detect API base from script src
    var scripts = document.querySelectorAll('script[src*="hub.js"]');
    if (scripts.length > 0) {
        var src = scripts[scripts.length - 1].src;
        API_BASE = src.substring(0, src.indexOf('/js/hub.js'));
    }

    var NavTourHub = {
        init: function(slug, options) {
            options = options || {};
            this._slug = slug;
            this._options = options;

            // Fetch hub data
            fetch(API_BASE + '/api/v1/hubs/public/' + slug)
                .then(function(r) { return r.ok ? r.json() : null; })
                .then(function(data) {
                    if (!data) { console.warn('NavTour Hub: Hub not found or not published'); return; }
                    hubData = data;
                    createLauncher(data);
                })
                .catch(function(err) { console.warn('NavTour Hub: Failed to load', err); });
        },

        open: function(opts) {
            if (!hubData) return;
            opts = opts || {};
            if (opts.category) {
                activeCategory = opts.category;
            }
            showDrawer();
        },

        close: function() {
            hideDrawer();
        },

        toggle: function() {
            isOpen ? this.close() : this.open();
        },

        setBadge: function(value) {
            if (!launcher) return;
            var badge = launcher.querySelector('.nt-hub-badge');
            if (value === 'dot') {
                badge.textContent = '';
                badge.className = 'nt-hub-badge nt-hub-badge-dot';
                badge.style.display = '';
            } else if (typeof value === 'number' && value > 0) {
                badge.textContent = value;
                badge.className = 'nt-hub-badge';
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        },

        clearBadge: function() {
            if (!launcher) return;
            var badge = launcher.querySelector('.nt-hub-badge');
            if (badge) badge.style.display = 'none';
        },

        on: function(event, callback) {
            this._listeners = this._listeners || {};
            this._listeners[event] = this._listeners[event] || [];
            this._listeners[event].push(callback);
        },

        _emit: function(event, data) {
            var listeners = (this._listeners || {})[event] || [];
            listeners.forEach(function(cb) { try { cb(data); } catch(e) {} });
        },

        destroy: function() {
            if (launcher) launcher.remove();
            if (drawer) drawer.remove();
            launcher = null;
            drawer = null;
            hubData = null;
            isOpen = false;
        }
    };

    function createLauncher(data) {
        var install = data.install || {};
        var pos = install.position || 'bottomRight';
        var color = install.launcherColor || '#4361ee';
        var text = install.launcherText || 'Help';
        var style = install.launcherStyle || 'icon';
        var offsetX = install.offsetX || 20;
        var offsetY = install.offsetY || 20;
        var zIndex = install.zIndex || 9999;

        launcher = document.createElement('div');
        launcher.className = 'nt-hub-launcher';

        var posStyles = '';
        if (pos === 'bottomRight') posStyles = 'bottom:' + offsetY + 'px;right:' + offsetX + 'px';
        else if (pos === 'bottomLeft') posStyles = 'bottom:' + offsetY + 'px;left:' + offsetX + 'px';
        else if (pos === 'topRight') posStyles = 'top:' + offsetY + 'px;right:' + offsetX + 'px';
        else if (pos === 'topLeft') posStyles = 'top:' + offsetY + 'px;left:' + offsetX + 'px';

        launcher.style.cssText = 'position:fixed;' + posStyles + ';z-index:' + zIndex + ';cursor:pointer;';

        var btn = document.createElement('button');
        btn.style.cssText = 'display:flex;align-items:center;gap:8px;padding:' +
            (style === 'icon' ? '14px' : '12px 20px') +
            ';background:' + color +
            ';color:#fff;border:none;border-radius:' + (style === 'icon' ? '50%' : '28px') +
            ';font-size:14px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;cursor:pointer;' +
            'box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 200ms,box-shadow 200ms;';

        btn.onmouseenter = function() { btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; };
        btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; };

        // Icon — build SVG via DOM to avoid innerHTML
        if (style !== 'text') {
            var icon = document.createElement('span');
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', '20');
            svg.setAttribute('height', '20');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            var circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            svg.appendChild(circle);
            var path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3');
            svg.appendChild(path);
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', '12');
            line.setAttribute('y1', '17');
            line.setAttribute('x2', '12.01');
            line.setAttribute('y2', '17');
            svg.appendChild(line);
            icon.appendChild(svg);
            btn.appendChild(icon);
        }

        // Text
        if (style !== 'icon') {
            var txt = document.createElement('span');
            txt.textContent = text;
            btn.appendChild(txt);
        }

        // Badge
        var badge = document.createElement('span');
        badge.className = 'nt-hub-badge';
        badge.style.cssText = 'display:none;position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#EF4444;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px;padding:0 5px;';

        launcher.appendChild(btn);
        launcher.appendChild(badge);

        btn.onclick = function() { NavTourHub.toggle(); };

        document.body.appendChild(launcher);

        // Auto-open behavior
        var behavior = data.behavior || {};
        if (behavior.autoOpen === 'always') {
            setTimeout(function() { NavTourHub.open(); }, behavior.autoOpenDelay || 3000);
        } else if (behavior.autoOpen === 'firstVisit') {
            if (!localStorage.getItem('nt-hub-visited-' + data.slug)) {
                localStorage.setItem('nt-hub-visited-' + data.slug, '1');
                setTimeout(function() { NavTourHub.open(); }, behavior.autoOpenDelay || 3000);
            }
        }

        // Keyboard shortcut
        if (behavior.keyboardShortcut) {
            document.addEventListener('keydown', function(e) {
                var shortcut = behavior.keyboardShortcut.toLowerCase();
                if (shortcut.includes('ctrl') && !e.ctrlKey) return;
                if (shortcut.includes('shift') && !e.shiftKey) return;
                var key = shortcut.replace(/ctrl\+?/i, '').replace(/shift\+?/i, '').trim();
                if (e.key.toLowerCase() === key) {
                    e.preventDefault();
                    NavTourHub.toggle();
                }
            });
        }
    }

    function showDrawer() {
        if (!hubData) return;
        if (drawer) { drawer.style.transform = 'translateX(0)'; isOpen = true; NavTourHub._emit('open'); return; }

        var appearance = hubData.appearance || {};
        var behavior = hubData.behavior || {};
        var categories = hubData.categories || [];
        activeCategory = null;
        searchText = '';

        // Create drawer
        drawer = document.createElement('div');
        drawer.className = 'nt-hub-drawer';
        drawer.style.cssText = 'position:fixed;top:0;right:0;width:420px;height:100vh;z-index:10000;' +
            'background:#fff;box-shadow:-8px 0 30px rgba(0,0,0,0.12);' +
            'display:flex;flex-direction:column;transition:transform 300ms cubic-bezier(0.32,0.72,0,1);' +
            'font-family:' + (appearance.fontFamily || 'system-ui,-apple-system,sans-serif') + ';' +
            'border-radius:' + (appearance.borderRadius || 12) + 'px 0 0 ' + (appearance.borderRadius || 12) + 'px;' +
            'overflow:hidden;';

        // Header
        var header = document.createElement('div');
        var headerBg = appearance.backgroundType === 'gradient'
            ? 'linear-gradient(135deg,' + (appearance.backgroundColor1 || '#4361ee') + ',' + (appearance.backgroundColor2 || '#818cf8') + ')'
            : (appearance.backgroundColor1 || '#4361ee');
        header.style.cssText = 'padding:24px 20px;background:' + headerBg + ';color:' + (appearance.textColor || '#fff') + ';position:relative;flex-shrink:0;text-align:' + (appearance.alignment || 'left') + ';';

        if (appearance.showCloseButton !== false) {
            var close = document.createElement('button');
            close.textContent = '\u00d7';
            close.style.cssText = 'position:absolute;top:12px;right:12px;background:none;border:none;color:' + (appearance.textColor || '#fff') + ';font-size:24px;cursor:pointer;opacity:0.7;line-height:1;';
            close.onmouseenter = function() { close.style.opacity = '1'; };
            close.onmouseleave = function() { close.style.opacity = '0.7'; };
            close.onclick = function() { NavTourHub.close(); };
            header.appendChild(close);
        }

        if (appearance.displayType === 'logo' && appearance.logoUrl) {
            var logo = document.createElement('img');
            logo.src = appearance.logoUrl;
            logo.style.cssText = 'height:32px;width:auto;margin-bottom:8px;';
            header.appendChild(logo);
        } else {
            var title = document.createElement('h3');
            title.textContent = appearance.title || 'Help Center';
            title.style.cssText = 'margin:0 0 4px;font-size:18px;font-weight:700;';
            header.appendChild(title);
        }

        if (appearance.subtitle) {
            var sub = document.createElement('p');
            sub.textContent = appearance.subtitle;
            sub.style.cssText = 'margin:0;font-size:13px;opacity:0.8;';
            header.appendChild(sub);
        }

        drawer.appendChild(header);

        // Search
        if (behavior.searchEnabled !== false) {
            var searchWrap = document.createElement('div');
            searchWrap.style.cssText = 'padding:12px 16px;border-bottom:1px solid #E5E5E5;flex-shrink:0;';
            var searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = behavior.searchPlaceholder || 'Search demos...';
            searchInput.style.cssText = 'width:100%;padding:8px 12px;border:1px solid #E5E5E5;border-radius:6px;font-size:14px;outline:none;font-family:inherit;box-sizing:border-box;';
            searchInput.onfocus = function() { searchInput.style.borderColor = appearance.accentColor || '#4361ee'; };
            searchInput.onblur = function() { searchInput.style.borderColor = '#E5E5E5'; };
            searchInput.oninput = function() {
                searchText = searchInput.value;
                NavTourHub._emit('search', { query: searchText });
                renderCards();
            };
            searchWrap.appendChild(searchInput);
            drawer.appendChild(searchWrap);
        }

        // Category tabs
        if (categories.length > 0) {
            var tabsWrap = document.createElement('div');
            tabsWrap.style.cssText = 'display:flex;gap:4px;padding:8px 16px;overflow-x:auto;border-bottom:1px solid #E5E5E5;flex-shrink:0;';

            var allTab = document.createElement('button');
            allTab.textContent = 'All';
            allTab.className = 'nt-hub-tab active';
            allTab.onclick = function() { activeCategory = null; updateTabs(); renderCards(); };
            tabsWrap.appendChild(allTab);

            categories.forEach(function(cat) {
                var tab = document.createElement('button');
                tab.textContent = (cat.icon ? cat.icon + ' ' : '') + cat.name;
                tab.className = 'nt-hub-tab';
                tab.dataset.catId = cat.id;
                tab.onclick = function() { activeCategory = cat.id; updateTabs(); renderCards(); };
                tabsWrap.appendChild(tab);
            });

            drawer.appendChild(tabsWrap);
        }

        // Cards container
        var cardsContainer = document.createElement('div');
        cardsContainer.className = 'nt-hub-cards';
        cardsContainer.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';
        drawer.appendChild(cardsContainer);

        // Footer
        var footer = document.createElement('div');
        footer.style.cssText = 'padding:12px 16px;border-top:1px solid #E5E5E5;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#737373;flex-shrink:0;';

        if (appearance.footerCta) {
            var ctaBtn = document.createElement('a');
            ctaBtn.href = appearance.footerCta.url;
            ctaBtn.textContent = appearance.footerCta.text;
            ctaBtn.target = '_blank';
            ctaBtn.style.cssText = 'padding:6px 16px;background:' + (appearance.footerCta.color || '#4361ee') + ';color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;';
            footer.appendChild(ctaBtn);
        }

        if (appearance.poweredBy !== 'hide') {
            var powered = document.createElement('span');
            powered.textContent = appearance.poweredBy === 'custom' && appearance.poweredByText
                ? appearance.poweredByText
                : 'Powered by NavTour';
            powered.style.cssText = 'font-size:11px;color:#A3A3A3;';
            footer.appendChild(powered);
        }

        drawer.appendChild(footer);

        // Inject styles
        if (!document.getElementById('nt-hub-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'nt-hub-styles';
            styleEl.textContent = getWidgetCSS(appearance);
            document.head.appendChild(styleEl);
        }

        document.body.appendChild(drawer);

        // Animate in
        drawer.style.transform = 'translateX(100%)';
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                drawer.style.transform = 'translateX(0)';
            });
        });

        // Escape to close
        document.addEventListener('keydown', handleEscape);

        isOpen = true;
        NavTourHub._emit('open');
        renderCards();
    }

    function hideDrawer() {
        if (!drawer) return;
        drawer.style.transform = 'translateX(100%)';
        setTimeout(function() {
            // Check if there's a demo playing — if so, go back to cards
            var iframe = drawer.querySelector('.nt-hub-demo-frame');
            if (iframe) {
                iframe.parentElement.remove();
                renderCards();
            }
        }, 300);
        isOpen = false;
        document.removeEventListener('keydown', handleEscape);
        NavTourHub._emit('close');
    }

    function handleEscape(e) {
        if (e.key === 'Escape') NavTourHub.close();
    }

    function updateTabs() {
        if (!drawer) return;
        var tabs = drawer.querySelectorAll('.nt-hub-tab');
        tabs.forEach(function(tab) {
            var isActive = (!activeCategory && !tab.dataset.catId) || (tab.dataset.catId === activeCategory);
            tab.className = 'nt-hub-tab' + (isActive ? ' active' : '');
        });
    }

    function renderCards() {
        if (!drawer || !hubData) return;
        var container = drawer.querySelector('.nt-hub-cards');
        if (!container) return;
        container.textContent = '';

        var appearance = hubData.appearance || {};
        var isGrid = (appearance.cardStyle || 'grid') === 'grid';

        container.style.display = isGrid ? 'grid' : 'flex';
        container.style.gridTemplateColumns = isGrid ? 'repeat(2, 1fr)' : '';
        container.style.gap = isGrid ? '12px' : '8px';
        container.style.flexDirection = isGrid ? '' : 'column';

        var allItems = [];
        (hubData.categories || []).forEach(function(cat) {
            if (activeCategory && cat.id !== activeCategory) return;
            (cat.items || []).forEach(function(item) {
                var name = item.titleOverride || item.demoName || 'Untitled';
                var desc = item.descriptionOverride || '';
                if (searchText && !name.toLowerCase().includes(searchText.toLowerCase()) && !desc.toLowerCase().includes(searchText.toLowerCase())) return;
                allItems.push(item);
            });
        });

        if (allItems.length === 0) {
            container.style.display = 'flex';
            container.style.gridTemplateColumns = '';
            var emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align:center;padding:40px 16px;color:#A3A3A3;font-size:14px;';
            emptyMsg.textContent = searchText ? 'No demos found for \u201c' + searchText + '\u201d' : 'No demos in this category';
            container.appendChild(emptyMsg);
            return;
        }

        allItems.forEach(function(item) {
            var card = document.createElement('div');
            card.className = 'nt-hub-card';

            var name = item.titleOverride || item.demoName || 'Untitled';

            if (appearance.showThumbnails !== false) {
                var thumb = document.createElement('div');
                thumb.className = 'nt-hub-card-thumb';
                card.appendChild(thumb);
            }

            var body = document.createElement('div');
            body.className = 'nt-hub-card-body';

            var titleEl = document.createElement('div');
            titleEl.className = 'nt-hub-card-title';
            titleEl.textContent = name;
            body.appendChild(titleEl);

            if (appearance.showDescriptions !== false && item.descriptionOverride) {
                var descEl = document.createElement('div');
                descEl.className = 'nt-hub-card-desc';
                descEl.textContent = item.descriptionOverride;
                body.appendChild(descEl);
            }

            var meta = [];
            if (appearance.showDuration !== false && item.demoStepCount > 0) {
                meta.push(Math.max(1, Math.round(item.demoStepCount * 0.5)) + ' min');
            }
            if (appearance.showStepCount !== false && item.demoStepCount > 0) {
                meta.push(item.demoStepCount + ' steps');
            }
            if (meta.length > 0) {
                var metaEl = document.createElement('div');
                metaEl.className = 'nt-hub-card-meta';
                metaEl.textContent = meta.join(' \u00b7 ');
                body.appendChild(metaEl);
            }

            card.appendChild(body);

            card.onclick = function() {
                if (item.itemType === 'link' && item.externalUrl) {
                    window.open(item.externalUrl, '_blank');
                } else if (item.itemType === 'demo' && item.demoSlug) {
                    launchDemo(item.demoSlug, name);
                }
            };

            container.appendChild(card);
        });
    }

    function launchDemo(slug, name) {
        if (!drawer) return;
        var container = drawer.querySelector('.nt-hub-cards');
        if (!container) return;

        NavTourHub._emit('demoStart', { slug: slug, name: name });

        container.style.display = 'flex';
        container.style.gridTemplateColumns = '';
        container.style.flexDirection = 'column';
        container.style.padding = '0';
        container.style.gap = '0';
        container.textContent = '';

        // Back button
        var backBar = document.createElement('div');
        backBar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #E5E5E5;cursor:pointer;font-size:14px;font-weight:500;color:#0A0A0A;';
        backBar.textContent = '\u2190 Back to demos';
        backBar.onclick = function() {
            container.style.padding = '16px';
            renderCards();
        };
        container.appendChild(backBar);

        // Iframe
        var frame = document.createElement('iframe');
        frame.className = 'nt-hub-demo-frame';
        frame.src = API_BASE + '/demo/' + slug;
        frame.style.cssText = 'flex:1;border:none;width:100%;';
        container.appendChild(frame);
    }

    function getWidgetCSS(appearance) {
        var accent = appearance.accentColor || '#4361ee';
        var radius = appearance.borderRadius || 12;

        return '' +
        '.nt-hub-tab{padding:6px 14px;border:none;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;' +
        'background:none;color:#737373;transition:all 150ms;font-family:inherit;}' +
        '.nt-hub-tab:hover{background:#F5F5F5;color:#0A0A0A;}' +
        '.nt-hub-tab.active{background:' + accent + ';color:#fff;}' +
        '.nt-hub-card{background:#fff;border:1px solid #E5E5E5;border-radius:' + Math.min(radius, 12) + 'px;overflow:hidden;cursor:pointer;transition:border-color 200ms,box-shadow 200ms,transform 200ms;}' +
        '.nt-hub-card:hover{border-color:#D4D4D4;box-shadow:0 4px 12px rgba(0,0,0,0.08);transform:translateY(-2px);}' +
        '.nt-hub-card-thumb{height:100px;background:linear-gradient(135deg,#F5F5F5,#E5E5E5);display:flex;align-items:center;justify-content:center;}' +
        '.nt-hub-card-body{padding:12px;}' +
        '.nt-hub-card-title{font-size:14px;font-weight:600;color:#0A0A0A;margin:0 0 4px;line-height:1.3;}' +
        '.nt-hub-card-desc{font-size:12px;color:#737373;margin:0 0 6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
        '.nt-hub-card-meta{font-size:11px;color:#A3A3A3;font-weight:500;}' +
        '.nt-hub-badge-dot{width:10px!important;height:10px!important;min-width:10px!important;border-radius:50%!important;padding:0!important;}' +
        '@media(max-width:480px){.nt-hub-drawer{width:100%!important;border-radius:0!important;}}' +
        '@media(prefers-reduced-motion:reduce){.nt-hub-drawer{transition:none!important;}.nt-hub-card{transition:none!important;}}';
    }

    // Expose API
    window.NavTour = window.NavTour || {};
    window.NavTour.hub = NavTourHub;
})();
