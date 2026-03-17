// Frame Editor — injected into the iframe for click-to-edit DOM manipulation
// Communicates with Blazor via window.parent.postMessage

(function () {
    let selectedElement = null;
    let hoverOverlay = null;
    let selectOverlay = null;
    let isEditing = false;

    function init() {
        createOverlays();
        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('click', onClick, true);
        document.addEventListener('keydown', onKeyDown, true);
        notifyParent('editor-ready', {});
    }

    function createOverlays() {
        hoverOverlay = document.createElement('div');
        hoverOverlay.id = '__navtour_hover';
        hoverOverlay.style.cssText = 'position:fixed;pointer-events:none;border:2px dashed #4361ee;background:rgba(67,97,238,0.05);z-index:2147483646;display:none;transition:all 0.1s ease';
        document.body.appendChild(hoverOverlay);

        selectOverlay = document.createElement('div');
        selectOverlay.id = '__navtour_select';
        selectOverlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #4361ee;background:rgba(67,97,238,0.08);z-index:2147483647;display:none';
        document.body.appendChild(selectOverlay);
    }

    function onMouseMove(e) {
        if (isEditing) return;
        var el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el === hoverOverlay || el === selectOverlay || el.id?.startsWith('__navtour')) return;

        var rect = el.getBoundingClientRect();
        hoverOverlay.style.left = rect.left + 'px';
        hoverOverlay.style.top = rect.top + 'px';
        hoverOverlay.style.width = rect.width + 'px';
        hoverOverlay.style.height = rect.height + 'px';
        hoverOverlay.style.display = 'block';
    }

    function onClick(e) {
        if (isEditing) return;
        e.preventDefault();
        e.stopPropagation();

        var el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el.id?.startsWith('__navtour')) return;

        selectElement(el);
    }

    function selectElement(el) {
        selectedElement = el;
        var rect = el.getBoundingClientRect();

        selectOverlay.style.left = rect.left + 'px';
        selectOverlay.style.top = rect.top + 'px';
        selectOverlay.style.width = rect.width + 'px';
        selectOverlay.style.height = rect.height + 'px';
        selectOverlay.style.display = 'block';

        var tagName = el.tagName.toLowerCase();
        var isImage = tagName === 'img' || tagName === 'svg' || tagName === 'picture';
        var isText = !isImage && el.children.length === 0 && (el.textContent || '').trim().length > 0;
        var isContainer = !isImage && !isText;

        notifyParent('element-selected', {
            selector: getCssSelector(el),
            tagName: tagName,
            text: (el.textContent || '').substring(0, 200),
            src: el.getAttribute('src') || el.getAttribute('data-src') || '',
            isImage: isImage,
            isText: isText,
            isContainer: isContainer,
            rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
            computedStyle: {
                fontSize: getComputedStyle(el).fontSize,
                color: getComputedStyle(el).color,
                backgroundColor: getComputedStyle(el).backgroundColor,
            }
        });
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            deselectElement();
            if (isEditing) stopEditing();
        }
    }

    function deselectElement() {
        selectedElement = null;
        selectOverlay.style.display = 'none';
        notifyParent('element-deselected', {});
    }

    // --- Edit operations (called from parent via postMessage) ---

    function editText(selector, newText) {
        var el = document.querySelector(selector);
        if (el) {
            el.textContent = newText;
            notifyParent('edit-applied', { type: 'text', selector: selector });
        }
    }

    function startInlineEdit(selector) {
        var el = document.querySelector(selector);
        if (!el) return;
        isEditing = true;
        hoverOverlay.style.display = 'none';

        el.setAttribute('contenteditable', 'true');
        el.focus();
        el.style.outline = '2px solid #4361ee';
        el.style.outlineOffset = '2px';

        var finishEdit = function () {
            el.removeAttribute('contenteditable');
            el.style.outline = '';
            el.style.outlineOffset = '';
            isEditing = false;
            notifyParent('inline-edit-done', { selector: selector, text: el.textContent });
        };

        el.addEventListener('blur', finishEdit, { once: true });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                el.blur();
            }
        });
    }

    function swapImage(selector, newSrc) {
        var el = document.querySelector(selector);
        if (el && el.tagName.toLowerCase() === 'img') {
            el.setAttribute('src', newSrc);
            notifyParent('edit-applied', { type: 'image', selector: selector });
        }
    }

    function blurElement(selector) {
        var el = document.querySelector(selector);
        if (el) {
            el.style.filter = 'blur(8px)';
            el.style.userSelect = 'none';
            notifyParent('edit-applied', { type: 'blur', selector: selector });
        }
    }

    function unblurElement(selector) {
        var el = document.querySelector(selector);
        if (el) {
            el.style.filter = '';
            el.style.userSelect = '';
            notifyParent('edit-applied', { type: 'unblur', selector: selector });
        }
    }

    function deleteElement(selector) {
        var el = document.querySelector(selector);
        if (el) {
            el.remove();
            deselectElement();
            notifyParent('edit-applied', { type: 'delete', selector: selector });
        }
    }

    function hideElement(selector) {
        var el = document.querySelector(selector);
        if (el) {
            el.style.display = 'none';
            deselectElement();
            notifyParent('edit-applied', { type: 'hide', selector: selector });
        }
    }

    function setStyle(selector, prop, value) {
        var el = document.querySelector(selector);
        if (el) {
            el.style[prop] = value;
            notifyParent('edit-applied', { type: 'style', selector: selector });
        }
    }

    function findAndReplace(findText, replaceText) {
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        var count = 0;
        var node;
        while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.includes(findText)) {
                node.nodeValue = node.nodeValue.split(findText).join(replaceText);
                count++;
            }
        }
        notifyParent('find-replace-done', { count: count, find: findText, replace: replaceText });
        return count;
    }

    function getSerializedHtml() {
        // Remove editor overlays before serializing
        var hover = document.getElementById('__navtour_hover');
        var select = document.getElementById('__navtour_select');
        if (hover) hover.remove();
        if (select) select.remove();

        var html = '<!DOCTYPE html>' + document.documentElement.outerHTML;

        // Re-create overlays
        createOverlays();
        return html;
    }

    // --- Utilities ---

    function getCssSelector(el) {
        if (el.id) return '#' + CSS.escape(el.id);

        var path = [];
        var current = el;
        while (current && current !== document.documentElement) {
            var tag = current.tagName.toLowerCase();
            if (current.id) {
                path.unshift('#' + CSS.escape(current.id));
                break;
            }
            var parent = current.parentElement;
            if (parent) {
                var siblings = Array.from(parent.children).filter(function (c) { return c.tagName === current.tagName; });
                if (siblings.length > 1) {
                    var index = siblings.indexOf(current) + 1;
                    tag += ':nth-of-type(' + index + ')';
                }
            }
            path.unshift(tag);
            current = parent;
        }
        return path.join(' > ');
    }

    function notifyParent(type, data) {
        window.parent.postMessage({ source: 'navtour-frame-editor', type: type, data: data }, '*');
    }

    // --- Message handler (receives commands from parent Blazor component) ---

    window.addEventListener('message', function (e) {
        if (!e.data || e.data.source !== 'navtour-blazor') return;
        var cmd = e.data;

        switch (cmd.type) {
            case 'edit-text': editText(cmd.selector, cmd.text); break;
            case 'inline-edit': startInlineEdit(cmd.selector); break;
            case 'swap-image': swapImage(cmd.selector, cmd.src); break;
            case 'blur': blurElement(cmd.selector); break;
            case 'unblur': unblurElement(cmd.selector); break;
            case 'delete': deleteElement(cmd.selector); break;
            case 'hide': hideElement(cmd.selector); break;
            case 'set-style': setStyle(cmd.selector, cmd.prop, cmd.value); break;
            case 'find-replace': findAndReplace(cmd.find, cmd.replace); break;
            case 'get-html':
                var html = getSerializedHtml();
                notifyParent('serialized-html', { html: html });
                break;
            case 'deselect': deselectElement(); break;
        }
    });

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
