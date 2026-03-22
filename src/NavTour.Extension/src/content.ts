import type { CaptureResult } from "./types";

export async function captureDOM(): Promise<CaptureResult> {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;

  // Remove all script tags
  clone.querySelectorAll("script").forEach((el) => el.remove());

  // Remove inline event handlers
  const eventAttrs = [
    "onclick",
    "onload",
    "onerror",
    "onsubmit",
    "onchange",
    "onmouseover",
    "onmouseout",
    "onkeydown",
    "onkeyup",
    "onfocus",
    "onblur",
    "oninput",
  ];
  clone.querySelectorAll("*").forEach((el) => {
    eventAttrs.forEach((attr) => el.removeAttribute(attr));
  });

  // Remove existing link[rel=stylesheet] tags (will be replaced by inlined styles)
  clone.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());

  // Inline ALL stylesheets from document.styleSheets (captures JS-injected styles too)
  const inlinedCss: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules);
      let css = rules.map((r) => r.cssText).join("\n");

      // Absolutize url() references in CSS
      if (sheet.href) {
        const baseUrl = sheet.href;
        css = css.replace(/url\(["']?(?!data:)([^"')]+)["']?\)/g, (_match, url) => {
          if (url.startsWith("http") || url.startsWith("data:")) return _match;
          try {
            return `url("${new URL(url, baseUrl).href}")`;
          } catch {
            return _match;
          }
        });
      }

      inlinedCss.push(css);
    } catch {
      // Cross-origin stylesheet — try fetching it
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href);
          if (res.ok) inlinedCss.push(await res.text());
        } catch {
          // Skip unreachable stylesheets
        }
      }
    }
  }

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
