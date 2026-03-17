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

  // Inline external stylesheets
  const links = clone.querySelectorAll('link[rel="stylesheet"]');
  for (const link of Array.from(links)) {
    const href = link.getAttribute("href");
    if (!href) continue;

    const absoluteUrl = new URL(href, document.baseURI).href;
    try {
      const res = await fetch(absoluteUrl);
      if (res.ok) {
        const css = await res.text();
        const style = document.createElement("style");
        style.textContent = css;
        link.replaceWith(style);
      }
    } catch {
      // Keep the link tag if fetch fails
    }
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
