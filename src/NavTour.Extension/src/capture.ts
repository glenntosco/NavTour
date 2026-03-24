// NavTour Capture Content Script — ISOLATED world
// Listens for capture messages from service worker, performs DOM capture,
// and sends result back via sendResponse (async).

const CRITICAL_PROPS = [
  "display","position","float","clear","box-sizing",
  "width","height","min-width","min-height","max-width","max-height",
  "margin","margin-top","margin-right","margin-bottom","margin-left",
  "padding","padding-top","padding-right","padding-bottom","padding-left",
  "border","border-top","border-right","border-bottom","border-left",
  "border-radius","border-collapse","border-spacing",
  "background","background-color","background-image","background-size","background-position","background-repeat",
  "color","font-family","font-size","font-weight","font-style","line-height","letter-spacing",
  "text-align","text-decoration","text-transform","text-overflow","white-space","word-break","overflow",
  "overflow-x","overflow-y","vertical-align","list-style","list-style-type",
  "flex","flex-direction","flex-wrap","flex-grow","flex-shrink","flex-basis",
  "align-items","align-self","justify-content","gap","order",
  "grid-template-columns","grid-template-rows","grid-column","grid-row","grid-gap",
  "opacity","visibility","z-index","cursor","pointer-events",
  "transform","box-shadow","outline","table-layout",
  "content","top","right","bottom","left",
];

function absUrl(url: string, base: string): string {
  if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("javascript:") || url.startsWith("#")) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) return url;
  try { return new URL(url, base).href; } catch { return url; }
}

function absUrlsInCss(css: string, base: string): string {
  return css.replace(/url\(\s*["']?(?!data:|blob:|https?:|\/\/)(.*?)["']?\s*\)/g, (_m, u) => {
    try { return `url("${new URL(u.trim(), base).href}")`; } catch { return _m; }
  });
}

async function performCapture(): Promise<{ html: string; title: string; url: string } | null> {
  try {
    const baseUri = document.baseURI;

    // --- Canvas to Image ---
    document.querySelectorAll("canvas").forEach((canvas) => {
      try {
        const c = canvas as HTMLCanvasElement;
        if (c.width === 0 || c.height === 0) return;
        const dataUrl = c.toDataURL("image/png");
        if (dataUrl === "data:,") return;
        const img = document.createElement("img");
        img.src = dataUrl;
        img.width = c.width;
        img.height = c.height;
        const style = c.getAttribute("style");
        if (style) img.setAttribute("style", style);
        img.className = c.className;
        c.parentNode?.replaceChild(img, c);
      } catch { /* tainted canvas */ }
    });

    // --- Collect CSS (smart: only matching rules + all @-rules) ---
    const collectedCss: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRule[];
      const base = sheet.href || baseUri;
      try {
        rules = Array.from(sheet.cssRules);
      } catch {
        // Cross-origin — try fetching
        if (sheet.href) {
          try {
            const resp = await fetch(sheet.href, { mode: "cors", cache: "force-cache" });
            if (resp.ok) {
              collectedCss.push(absUrlsInCss(await resp.text(), sheet.href));
            }
          } catch {}
        }
        continue;
      }
      const kept: string[] = [];
      for (const rule of rules) {
        if (rule.cssText.startsWith("@") || !(rule instanceof CSSStyleRule)) {
          kept.push(rule.cssText);
          continue;
        }
        try {
          if (document.querySelector(rule.selectorText)) kept.push(rule.cssText);
        } catch {
          kept.push(rule.cssText);
        }
      }
      let css = kept.join("\n");
      css = absUrlsInCss(css, base);
      if (css.length > 0) collectedCss.push(css);
    }

    // --- Clone DOM ---
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelector("#navtour-capture-bar")?.remove();
    clone.querySelectorAll("script, noscript").forEach(el => el.remove());

    const evtAttrs = ["onclick","ondblclick","onmousedown","onmouseup","onmouseover","onmouseout",
      "onmousemove","onkeydown","onkeyup","onkeypress","onfocus","onblur","onchange","oninput",
      "onsubmit","onload","onerror","onresize","onscroll","ontouchstart","ontouchend",
      "ontouchmove","ondragstart","ondragend","ondragover","ondrop","oncontextmenu"];
    clone.querySelectorAll("*").forEach(el => evtAttrs.forEach(a => el.removeAttribute(a)));

    // Remove stylesheet links (replaced by collected CSS)
    clone.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]').forEach(el => el.remove());
    clone.querySelectorAll('link[rel="dns-prefetch"], link[rel="prefetch"], link[rel="prerender"], link[rel="preconnect"], link[rel="modulepreload"]').forEach(el => el.remove());

    // --- Shadow DOM ---
    const origAll = document.querySelectorAll("*");
    const cloneAll = clone.querySelectorAll("*");
    origAll.forEach((origEl, i) => {
      if (i >= cloneAll.length) return;
      const shadow = origEl.shadowRoot;
      if (!shadow) return;
      const cloneEl = cloneAll[i];
      // Serialize shadow content into a wrapper div
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-navtour-shadow", "true");
      // Use DOM methods instead of innerHTML for safety
      Array.from(shadow.children).forEach(child => {
        wrapper.appendChild(child.cloneNode(true));
      });
      if (shadow.adoptedStyleSheets?.length) {
        const style = document.createElement("style");
        const cssTexts: string[] = [];
        shadow.adoptedStyleSheets.forEach(s => {
          try { Array.from(s.cssRules).forEach(r => cssTexts.push(r.cssText)); } catch {}
        });
        style.textContent = cssTexts.join("\n");
        wrapper.prepend(style);
      }
      cloneEl.appendChild(wrapper);
    });

    // --- Form Values ---
    const origInputs = document.querySelectorAll("input, textarea, select");
    const cloneInputs = clone.querySelectorAll("input, textarea, select");
    origInputs.forEach((origEl, i) => {
      if (i >= cloneInputs.length) return;
      const cloneEl = cloneInputs[i] as HTMLElement;
      if (origEl instanceof HTMLInputElement) {
        if (origEl.type === "checkbox" || origEl.type === "radio") {
          if (origEl.checked) cloneEl.setAttribute("checked", "checked");
          else cloneEl.removeAttribute("checked");
        } else if (origEl.type !== "password" && origEl.type !== "hidden") {
          cloneEl.setAttribute("value", origEl.value);
        }
      } else if (origEl instanceof HTMLTextAreaElement) {
        (cloneEl as HTMLTextAreaElement).textContent = origEl.value;
      } else if (origEl instanceof HTMLSelectElement) {
        const cs = cloneEl as HTMLSelectElement;
        for (let oi = 0; oi < origEl.options.length && oi < cs.options.length; oi++) {
          if (origEl.options[oi].selected) cs.options[oi].setAttribute("selected", "selected");
          else cs.options[oi].removeAttribute("selected");
        }
      }
    });

    // --- Inline Computed Styles ---
    const origElements = document.querySelectorAll("body *");
    const cloneElements = clone.querySelectorAll("body *");
    const isLarge = origElements.length > 3000;
    const props = isLarge ? CRITICAL_PROPS.slice(0, 25) : CRITICAL_PROPS;

    origElements.forEach((origEl, i) => {
      if (i >= cloneElements.length) return;
      const rect = origEl.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const computed = window.getComputedStyle(origEl);
      const styles: string[] = [];
      for (const prop of props) {
        const val = computed.getPropertyValue(prop);
        if (!val || val === "" || val === "none" || val === "normal" || val === "auto" ||
            val === "0px" || val === "0" || val === "rgba(0, 0, 0, 0)" ||
            val === "static" || val === "content-box" || val === "visible" ||
            val === "baseline" || val === "stretch" || val === "row" || val === "nowrap") continue;
        styles.push(`${prop}:${val}`);
      }
      if (styles.length > 0) {
        const existing = (cloneElements[i] as HTMLElement).getAttribute("style") || "";
        (cloneElements[i] as HTMLElement).setAttribute("style", existing + (existing ? ";" : "") + styles.join(";"));
      }
    });

    // --- Absolutize URLs ---
    clone.querySelectorAll("img[src]").forEach(img => {
      const src = img.getAttribute("src");
      if (src) img.setAttribute("src", absUrl(src, baseUri));
    });
    clone.querySelectorAll("[srcset]").forEach(el => {
      const ss = el.getAttribute("srcset");
      if (ss) el.setAttribute("srcset", ss.replace(/(\S+)(\s+\S+)?/g, (_, url, desc) => absUrl(url, baseUri) + (desc || "")));
    });
    clone.querySelectorAll("video[poster], video[src], audio[src], source[src]").forEach(el => {
      ["poster", "src"].forEach(attr => {
        const v = el.getAttribute(attr);
        if (v) el.setAttribute(attr, absUrl(v, baseUri));
      });
    });
    clone.querySelectorAll("[style]").forEach(el => {
      const s = el.getAttribute("style");
      if (s?.includes("url(")) el.setAttribute("style", absUrlsInCss(s, baseUri));
    });

    // --- Assemble ---
    clone.querySelectorAll("head > style:not([data-navtour-captured])").forEach(el => el.remove());
    const head = clone.querySelector("head") || clone;
    if (collectedCss.length > 0) {
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-navtour-captured", "true");
      styleEl.textContent = collectedCss.join("\n");
      head.appendChild(styleEl);
    }
    if (!clone.querySelector("base")) {
      const base = document.createElement("base");
      base.href = baseUri;
      head.prepend(base);
    }
    if (!clone.querySelector("meta[charset]")) {
      const meta = document.createElement("meta");
      meta.setAttribute("charset", "utf-8");
      head.prepend(meta);
    }

    return {
      html: "<!DOCTYPE html>" + clone.outerHTML,
      title: document.title,
      url: document.location.href,
    };
  } catch (e) {
    console.error("[NavTour] Capture failed:", e);
    return null;
  }
}

// Listen for capture requests from service worker
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "navtour:capture") {
    performCapture().then(result => sendResponse(result)).catch(() => sendResponse(null));
    return true; // Keep channel open for async
  }
});
