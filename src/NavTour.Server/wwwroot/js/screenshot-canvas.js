// screenshot-canvas.js
// Fabric.js canvas annotation engine for NavTour Screenshots

let canvas = null;
let dotnetRef = null;
let activeTool = 'select';
let shapeProps = { fillColor: 'transparent', lineColor: '#4361ee', lineWidth: 2, cornerRadius: 0 };
let textProps = { fontFamily: 'Inter', fontSize: 18, color: '#000000' };
let redactProps = { blurIntensity: 40 };
let undoStack = [];
let redoStack = [];
let isDrawing = false;
let drawStartX = 0;
let drawStartY = 0;
let activeObject = null;

function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

window.screenshotCanvas = {
    init: function(dotnetReference, canvasId, imageDataUrl) {
        dotnetRef = dotnetReference;
        if (canvas) { canvas.dispose(); canvas = null; }

        // Size canvas to fill the container
        const container = document.getElementById('canvas-container');
        const w = container ? container.clientWidth : 900;
        const h = container ? container.clientHeight : 600;

        canvas = new fabric.Canvas(canvasId, {
            width: w,
            height: h,
            selection: true,
            preserveObjectStacking: true
        });

        if (imageDataUrl) {
            fabric.Image.fromURL(imageDataUrl, function(img) {
                const scale = Math.min(
                    canvas.width / img.width,
                    canvas.height / img.height
                );
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                    scaleX: scale, scaleY: scale,
                    left: (canvas.width - img.width * scale) / 2,
                    top: (canvas.height - img.height * scale) / 2,
                    originX: 'left', originY: 'top'
                });
            });
        }

        canvas.on('mouse:down', window.screenshotCanvas._onMouseDown);
        canvas.on('mouse:move', window.screenshotCanvas._onMouseMove);
        canvas.on('mouse:up', window.screenshotCanvas._onMouseUp);
        canvas.on('object:modified', window.screenshotCanvas._saveState);

        window.screenshotCanvas._saveState();
    },

    setTool: function(tool) {
        activeTool = tool;
        canvas.isDrawingMode = false;
        canvas.selection = (tool === 'select');
        canvas.forEachObject(o => o.selectable = (tool === 'select'));
        canvas.renderAll();
    },

    setShapeProps: function(props) {
        shapeProps = { ...shapeProps, ...props };
    },

    setTextProps: function(props) {
        textProps = { ...textProps, ...props };
    },

    setRedactBlurIntensity: function(intensity) {
        redactProps.blurIntensity = intensity;
    },

    loadAnnotations: function(json) {
        if (!json || json === 'null') return;
        try {
            const annotations = JSON.parse(json);
            annotations.forEach(a => {
                let obj;
                if (a.type === 'rectangle') {
                    obj = new fabric.Rect({
                        left: a.x, top: a.y, width: a.w, height: a.h,
                        fill: a.fillColor || 'transparent',
                        stroke: a.lineColor, strokeWidth: a.lineWidth,
                        rx: a.cornerRadius || 0, ry: a.cornerRadius || 0,
                        selectable: activeTool === 'select'
                    });
                } else if (a.type === 'arrow') {
                    obj = new fabric.Line([a.x1, a.y1, a.x2, a.y2], {
                        stroke: a.lineColor, strokeWidth: a.lineWidth,
                        selectable: activeTool === 'select'
                    });
                } else if (a.type === 'highlighter') {
                    obj = new fabric.Rect({
                        left: a.x, top: a.y, width: a.w, height: a.h,
                        fill: hexToRgba(a.color, a.opacity || 0.4),
                        stroke: 'transparent', strokeWidth: 0,
                        selectable: activeTool === 'select',
                        _isHighlighter: true
                    });
                } else if (a.type === 'text') {
                    obj = new fabric.IText(a.text, {
                        left: a.x, top: a.y,
                        fontFamily: a.fontFamily, fontSize: a.fontSize,
                        fill: a.color,
                        selectable: activeTool === 'select'
                    });
                } else if (a.type === 'redact') {
                    obj = new fabric.Rect({
                        left: a.x, top: a.y, width: a.w, height: a.h,
                        fill: `rgba(0,0,0,0.5)`,
                        stroke: 'transparent',
                        selectable: activeTool === 'select',
                        _isRedact: true,
                        _blurIntensity: a.blurIntensity
                    });
                }
                if (obj) { obj._annotationType = a.type; canvas.add(obj); }
            });
            canvas.renderAll();
        } catch (e) { console.error('Failed to load annotations', e); }
    },

    getAnnotationsJson: function() {
        const annotations = [];
        canvas.getObjects().forEach(obj => {
            if (obj === canvas.backgroundImage) return;
            const type = obj._annotationType || 'rectangle';
            if (type === 'rectangle') {
                annotations.push({ type, x: obj.left, y: obj.top, w: obj.width * obj.scaleX, h: obj.height * obj.scaleY,
                    fillColor: obj.fill, lineColor: obj.stroke, lineWidth: obj.strokeWidth, cornerRadius: obj.rx || 0 });
            } else if (type === 'arrow') {
                annotations.push({ type, x1: obj.x1 + obj.left, y1: obj.y1 + obj.top, x2: obj.x2 + obj.left, y2: obj.y2 + obj.top,
                    lineColor: obj.stroke, lineWidth: obj.strokeWidth });
            } else if (type === 'highlighter') {
                annotations.push({ type, x: obj.left, y: obj.top, w: obj.width * obj.scaleX, h: obj.height * obj.scaleY,
                    color: '#ffff00', opacity: 0.4 });
            } else if (type === 'text') {
                annotations.push({ type, x: obj.left, y: obj.top, text: obj.text,
                    fontFamily: obj.fontFamily, fontSize: obj.fontSize, color: obj.fill });
            } else if (type === 'redact') {
                annotations.push({ type, x: obj.left, y: obj.top, w: obj.width * obj.scaleX, h: obj.height * obj.scaleY,
                    blurIntensity: obj._blurIntensity || 40 });
            }
        });
        return JSON.stringify(annotations);
    },

    undo: function() {
        if (undoStack.length <= 1) return;
        redoStack.push(undoStack.pop());
        const prev = undoStack[undoStack.length - 1];
        canvas.loadFromJSON(prev, canvas.renderAll.bind(canvas));
    },

    redo: function() {
        if (redoStack.length === 0) return;
        const next = redoStack.pop();
        undoStack.push(next);
        canvas.loadFromJSON(next, canvas.renderAll.bind(canvas));
    },

    resetAll: function() {
        canvas.getObjects().forEach(obj => canvas.remove(obj));
        canvas.renderAll();
        undoStack = [];
        redoStack = [];
        window.screenshotCanvas._saveState();
    },

    exportImage: function() {
        return canvas.toDataURL({ format: 'png', quality: 0.9 });
    },

    resize: function(width, height) {
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
    },

    dispose: function() {
        if (canvas) { canvas.dispose(); canvas = null; }
        dotnetRef = null;
    },

    _saveState: function() {
        undoStack.push(JSON.stringify(canvas));
        redoStack = [];
        if (undoStack.length > 50) undoStack.shift();
    },

    _onMouseDown: function(e) {
        if (activeTool === 'select') return;
        isDrawing = true;
        const ptr = canvas.getPointer(e.e);
        drawStartX = ptr.x;
        drawStartY = ptr.y;

        if (activeTool === 'text') {
            const text = new fabric.IText('Type here...', {
                left: ptr.x, top: ptr.y,
                fontFamily: textProps.fontFamily,
                fontSize: textProps.fontSize,
                fill: textProps.color,
                _annotationType: 'text'
            });
            canvas.add(text);
            canvas.setActiveObject(text);
            text.enterEditing();
            isDrawing = false;
            window.screenshotCanvas._saveState();
        }
    },

    _onMouseMove: function(e) {
        if (!isDrawing) return;
        const ptr = canvas.getPointer(e.e);
        if (activeObject) canvas.remove(activeObject);

        const x = Math.min(ptr.x, drawStartX);
        const y = Math.min(ptr.y, drawStartY);
        const w = Math.abs(ptr.x - drawStartX);
        const h = Math.abs(ptr.y - drawStartY);

        if (activeTool === 'rectangle') {
            activeObject = new fabric.Rect({
                left: x, top: y, width: w, height: h,
                fill: shapeProps.fillColor === 'transparent' ? 'transparent' : shapeProps.fillColor,
                stroke: shapeProps.lineColor, strokeWidth: shapeProps.lineWidth,
                rx: shapeProps.cornerRadius, ry: shapeProps.cornerRadius,
                _annotationType: 'rectangle', selectable: false
            });
        } else if (activeTool === 'arrow') {
            activeObject = new fabric.Line([drawStartX, drawStartY, ptr.x, ptr.y], {
                stroke: shapeProps.lineColor, strokeWidth: shapeProps.lineWidth,
                _annotationType: 'arrow', selectable: false
            });
        } else if (activeTool === 'highlighter') {
            activeObject = new fabric.Rect({
                left: x, top: y, width: w, height: h,
                fill: hexToRgba('#ffff00', 0.4),
                stroke: 'transparent', strokeWidth: 0,
                _annotationType: 'highlighter', _isHighlighter: true, selectable: false
            });
        } else if (activeTool === 'redact') {
            activeObject = new fabric.Rect({
                left: x, top: y, width: w, height: h,
                fill: 'rgba(0,0,0,0.5)',
                stroke: 'transparent', strokeWidth: 0,
                _annotationType: 'redact', _isRedact: true,
                _blurIntensity: redactProps.blurIntensity, selectable: false
            });
        }

        if (activeObject) canvas.add(activeObject);
        canvas.renderAll();
    },

    _onMouseUp: function() {
        if (!isDrawing) return;
        isDrawing = false;
        if (activeObject) {
            activeObject.selectable = (activeTool === 'select');
            activeObject = null;
            window.screenshotCanvas._saveState();
            if (dotnetRef) dotnetRef.invokeMethodAsync('OnAnnotationChanged');
        }
    }
};

// Read-only viewer — renders a slide with annotations, no editing
window.screenshotViewer = {
    _canvas: null,

    render: function(canvasId, containerId, imageData, annotationData) {
        if (this._canvas) { this._canvas.dispose(); this._canvas = null; }

        const container = document.getElementById(containerId);
        const w = container ? container.clientWidth : 900;
        const h = container ? container.clientHeight : 600;

        this._canvas = new fabric.Canvas(canvasId, {
            width: w, height: h,
            selection: false, interactive: false
        });

        const c = this._canvas;
        const self = this;

        if (imageData) {
            fabric.Image.fromURL(imageData, function(img) {
                const scale = Math.min(w / img.width, h / img.height);
                c.setBackgroundImage(img, c.renderAll.bind(c), {
                    scaleX: scale, scaleY: scale,
                    left: (w - img.width * scale) / 2,
                    top: (h - img.height * scale) / 2,
                    originX: 'left', originY: 'top'
                });
                if (annotationData) self._loadAnnotations(c, annotationData);
            });
        } else if (annotationData) {
            this._loadAnnotations(c, annotationData);
        }
    },

    _loadAnnotations: function(c, json) {
        if (!json || json === 'null') return;
        try {
            const annotations = JSON.parse(json);
            annotations.forEach(function(a) {
                let obj;
                if (a.type === 'rectangle') {
                    obj = new fabric.Rect({
                        left: a.x, top: a.y, width: a.w, height: a.h,
                        fill: a.fillColor || 'transparent',
                        stroke: a.lineColor, strokeWidth: a.lineWidth,
                        rx: a.cornerRadius || 0, ry: a.cornerRadius || 0,
                        selectable: false, evented: false
                    });
                } else if (a.type === 'arrow') {
                    obj = new fabric.Line([a.x1, a.y1, a.x2, a.y2], {
                        stroke: a.lineColor, strokeWidth: a.lineWidth,
                        selectable: false, evented: false
                    });
                } else if (a.type === 'highlighter') {
                    const r = parseInt(a.color.slice(1,3),16);
                    const g = parseInt(a.color.slice(3,5),16);
                    const b = parseInt(a.color.slice(5,7),16);
                    obj = new fabric.Rect({
                        left: a.x, top: a.y, width: a.w, height: a.h,
                        fill: `rgba(${r},${g},${b},${a.opacity||0.4})`,
                        stroke: 'transparent', strokeWidth: 0,
                        selectable: false, evented: false
                    });
                } else if (a.type === 'text') {
                    obj = new fabric.IText(a.text, {
                        left: a.x, top: a.y,
                        fontFamily: a.fontFamily, fontSize: a.fontSize,
                        fill: a.color,
                        selectable: false, evented: false
                    });
                } else if (a.type === 'redact') {
                    obj = new fabric.Rect({
                        left: a.x, top: a.y, width: a.w, height: a.h,
                        fill: 'rgba(0,0,0,0.5)', stroke: 'transparent',
                        selectable: false, evented: false
                    });
                }
                if (obj) c.add(obj);
            });
            c.renderAll();
        } catch(e) { console.error('Failed to load viewer annotations', e); }
    },

    dispose: function() {
        if (this._canvas) { this._canvas.dispose(); this._canvas = null; }
    }
};
