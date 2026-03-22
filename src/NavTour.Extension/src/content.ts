import type { CaptureResult } from "./types";

// Important CSS properties to inline when stylesheet capture fails
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
  "vertical-align","list-style","list-style-type",
  "flex","flex-direction","flex-wrap","flex-grow","flex-shrink","flex-basis",
  "align-items","align-self","justify-content","gap",
  "grid-template-columns","grid-template-rows","grid-column","grid-row",
  "opacity","visibility","z-index","cursor","pointer-events",
  "transform","transition","box-shadow","outline",
  "table-layout",
];

export async function captureDOM(): Promise<CaptureResult> {
  // Step 1: Try to collect all CSS from stylesheets
  const inlinedCss: string[] = [];
  let stylesheetsCaptured = 0;

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules);
      let css = rules.map((r) => r.cssText).join("\n");

      // Absolutize url() references
      if (sheet.href) {
        const baseUrl = sheet.href;
        css = css.replace(/url\(["']?(?!data:)([^"')]+)["']?\)/g, (_match, url) => {
          if (url.startsWith("http") || url.startsWith("data:")) return _match;
          try { return `url("${new URL(url, baseUrl).href}")`; }
          catch { return _match; }
        });
      }

      inlinedCss.push(css);
      stylesheetsCaptured++;
    } catch {
      // Cross-origin — try fetching
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href);
          if (res.ok) {
            inlinedCss.push(await res.text());
            stylesheetsCaptured++;
          }
        } catch { /* skip */ }
      }
    }
  }

  // Step 2: If few stylesheets captured, inline computed styles as fallback
  const needsComputedFallback = stylesheetsCaptured < document.styleSheets.length / 2;

  // Step 3: Clone the DOM
  const clone = document.documentElement.cloneNode(true) as HTMLElement;

  // Remove scripts
  clone.querySelectorAll("script").forEach((el) => el.remove());

  // Remove event handlers
  const eventAttrs = [
    "onclick","onload","onerror","onsubmit","onchange",
    "onmouseover","onmouseout","onkeydown","onkeyup",
    "onfocus","onblur","oninput",
  ];
  clone.querySelectorAll("*").forEach((el) => {
    eventAttrs.forEach((attr) => el.removeAttribute(attr));
  });

  // Remove link[rel=stylesheet] tags
  clone.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());

  // Step 4: If computed fallback needed, inline styles on every visible element
  if (needsComputedFallback) {
    const origElements = document.querySelectorAll("body *");
    const cloneElements = clone.querySelectorAll("body *");

    origElements.forEach((origEl, i) => {
      if (i >= cloneElements.length) return;
      const cloneEl = cloneElements[i] as HTMLElement;
      const computed = window.getComputedStyle(origEl);
      const styles: string[] = [];

      for (const prop of CRITICAL_PROPS) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== "" && val !== "none" && val !== "normal" && val !== "auto" && val !== "0px") {
          styles.push(`${prop}:${val}`);
        }
      }

      if (styles.length > 0) {
        const existing = cloneEl.getAttribute("style") || "";
        cloneEl.setAttribute("style", existing + ";" + styles.join(";"));
      }
    });
  }

  // Step 5: Add collected CSS
  if (inlinedCss.length > 0) {
    const styleEl = document.createElement("style");
    styleEl.textContent = inlinedCss.join("\n");
    const head = clone.querySelector("head");
    if (head) head.appendChild(styleEl);
    else clone.insertBefore(styleEl, clone.firstChild);
  }

  // Absolutize image src URLs
  clone.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && !src.startsWith("data:")) {
      img.setAttribute("src", new URL(src, document.baseURI).href);
    }
  });

  // Absolutize background images in inline styles
  clone.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style");
    if (style && style.includes("url(")) {
      el.setAttribute(
        "style",
        style.replace(/url\(["']?([^"')]+)["']?\)/g, (_match, url) => {
          if (url.startsWith("data:") || url.startsWith("http")) return _match;
          return `url("${new URL(url, document.baseURI).href}")`;
        })
      );
    }
  });

  const html = "<!DOCTYPE html>" + clone.outerHTML;

  return {
    html,
    title: document.title,
    url: document.location.href,
  };
}
