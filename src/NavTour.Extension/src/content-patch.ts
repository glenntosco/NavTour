// NavTour Content Patch — MAIN world, runs at document_start
// Monkey-patches browser APIs BEFORE page scripts execute to ensure
// reliable DOM capture. Inspired by Navattic's patch.js approach.

(function () {
  // Guard: only patch once
  if ((window as any).__navtour_patched) return;
  (window as any).__navtour_patched = true;

  // 1. Force Shadow DOM to always use open mode
  // Without this, closed shadow roots are invisible to our serializer
  const origAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (
    this: Element,
    init: ShadowRootInit
  ): ShadowRoot {
    return origAttachShadow.call(this, { ...init, mode: "open" });
  };

  // 2. Canvas: force preserveDrawingBuffer for WebGL
  // Without this, toDataURL() returns blank for WebGL canvases
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  (HTMLCanvasElement.prototype as any).getContext = function (
    this: HTMLCanvasElement,
    type: string,
    attrs?: any
  ) {
    if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
      attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
    }
    if (type === "2d") {
      attrs = Object.assign({}, attrs, { willReadFrequently: true });
    }
    return origGetContext.call(this, type, attrs);
  };

  // 3. Prevent blob URL revocation
  // Pages often revoke blob URLs after use, making them unavailable at capture time
  const revokedUrls = new Set<string>();
  const origRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = function (url: string) {
    revokedUrls.add(url);
    // Don't actually revoke — keep alive for capture
  };
  (window as any).__navtour_revoked_urls = revokedUrls;

  // 4. Track dynamically created fonts
  const injectedFonts: Array<{ family: string; source: string; descriptors?: FontFaceDescriptors }> = [];
  const OrigFontFace = window.FontFace;
  (window as any).FontFace = function (
    family: string,
    source: string | BinaryData,
    descriptors?: FontFaceDescriptors
  ) {
    if (typeof source === "string") {
      injectedFonts.push({ family, source, descriptors });
    }
    return new OrigFontFace(family, source, descriptors);
  };
  // Preserve prototype chain
  (window as any).FontFace.prototype = OrigFontFace.prototype;
  (window as any).__navtour_injected_fonts = injectedFonts;

  // 5. Force crossOrigin on dynamically created images
  const origImgSrcDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src"
  );
  if (origImgSrcDescriptor?.set) {
    const origSet = origImgSrcDescriptor.set;
    const origGet = origImgSrcDescriptor.get!;
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      set(val: string) {
        // Set crossOrigin before src to enable CORS fetch
        if (!this.crossOrigin && val && !val.startsWith("data:") && !val.startsWith("blob:")) {
          this.crossOrigin = "anonymous";
        }
        origSet.call(this, val);
        // If CORS fails, retry without crossOrigin
        this.addEventListener(
          "error",
          function onErr(this: HTMLImageElement) {
            if (this.crossOrigin) {
              this.removeEventListener("error", onErr);
              this.crossOrigin = "";
              origSet.call(this, val);
            }
          },
          { once: true }
        );
      },
      get() {
        return origGet.call(this);
      },
      configurable: true,
    });
  }

  // 6. Block service worker registration (can interfere with capture)
  if (navigator.serviceWorker) {
    const origRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function () {
      // Silent no-op during capture sessions
      return Promise.resolve(new (class {
        installing = null;
        waiting = null;
        active = null;
        scope = "";
        updateViaCache = "none" as ServiceWorkerUpdateViaCache;
        navigationPreload = {} as NavigationPreloadManager;
        onupdatefound = null;
        update() { return Promise.resolve(); }
        unregister() { return Promise.resolve(true); }
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() { return false; }
      })() as unknown as ServiceWorkerRegistration);
    };
  }
})();
