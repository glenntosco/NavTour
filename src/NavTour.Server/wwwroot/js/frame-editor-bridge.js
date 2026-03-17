// Bridge between Blazor and the frame-editor.js running inside the iframe
// Manages iframe injection, message routing, and serialization

window.frameEditorBridge = {
    _dotnetRef: null,
    _iframe: null,

    init: function (dotnetRef, iframeElement) {
        this._dotnetRef = dotnetRef;
        this._iframe = iframeElement;

        // Listen for messages from the iframe editor
        window.addEventListener('message', this._onMessage.bind(this));

        // Inject editor script once iframe loads
        if (iframeElement.contentDocument && iframeElement.contentDocument.readyState !== 'loading') {
            this._injectEditor(iframeElement);
        }
        iframeElement.addEventListener('load', function () {
            frameEditorBridge._injectEditor(iframeElement);
        });
    },

    _injectEditor: function (iframe) {
        try {
            var doc = iframe.contentDocument;
            if (!doc) return;

            // Check if already injected
            if (doc.getElementById('__navtour_editor_script')) return;

            var script = doc.createElement('script');
            script.id = '__navtour_editor_script';
            script.src = '/js/frame-editor.js';
            doc.head.appendChild(script);
        } catch (e) {
            console.error('[NavTour] Failed to inject frame editor:', e);
        }
    },

    _onMessage: function (e) {
        if (!e.data || e.data.source !== 'navtour-frame-editor') return;
        if (!this._dotnetRef) return;

        var msg = e.data;
        switch (msg.type) {
            case 'editor-ready':
                this._dotnetRef.invokeMethodAsync('OnEditorReady');
                break;
            case 'element-selected':
                this._dotnetRef.invokeMethodAsync('OnElementSelected', JSON.stringify(msg.data));
                break;
            case 'element-deselected':
                this._dotnetRef.invokeMethodAsync('OnElementDeselected');
                break;
            case 'edit-applied':
                this._dotnetRef.invokeMethodAsync('OnEditApplied', msg.data.type);
                break;
            case 'inline-edit-done':
                this._dotnetRef.invokeMethodAsync('OnInlineEditDone', msg.data.selector, msg.data.text);
                break;
            case 'find-replace-done':
                this._dotnetRef.invokeMethodAsync('OnFindReplaceDone', msg.data.count);
                break;
            case 'serialized-html':
                this._dotnetRef.invokeMethodAsync('OnSerializedHtml', msg.data.html);
                break;
        }
    },

    // Send command to the iframe editor
    sendCommand: function (type, data) {
        if (!this._iframe || !this._iframe.contentWindow) return;
        this._iframe.contentWindow.postMessage(
            Object.assign({ source: 'navtour-blazor', type: type }, data || {}),
            '*'
        );
    },

    dispose: function () {
        window.removeEventListener('message', this._onMessage);
        this._dotnetRef = null;
        this._iframe = null;
    }
};
