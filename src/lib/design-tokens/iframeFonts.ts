/**
 * Shared font-face declarations + font stacks for iframe-rendered panels
 * (IoT web panel, printer panel, PC browser pages, etc.).
 * These documents run in a separate browsing context and do not inherit the
 * fonts loaded via next/font in the root layout, so the font files are
 * referenced directly from /public/fonts. CSP allows font-src 'self'.
 */
export const IFRAME_FONT_FACES_CSS = `
@font-face {
  font-family: 'Inria Sans';
  src: url('/fonts/InriaSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inria Sans';
  src: url('/fonts/InriaSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Geist Mono';
  src: url('/fonts/GeistMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
`;

/** Sans font stack — used everywhere in the app (Inria Sans). */
export const INRIA_SANS_STACK = "'Inria Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

/** Monospace font stack — used in consoles/terminals (Geist Mono). */
export const GEIST_MONO_STACK = "'Geist Mono', 'Courier New', monospace";

/**
 * Convenience helper for iframe HTML documents: a <style> block that
 * registers the fonts and applies Inria Sans globally, Geist Mono on
 * code/pre/monospace elements.
 */
export const IFRAME_FONT_STYLE_TAG = `<style>
${IFRAME_FONT_FACES_CSS}
body { font-family: ${INRIA_SANS_STACK}; }
pre, code, kbd, samp, .mono { font-family: ${GEIST_MONO_STACK}; }
</style>`;

/**
 * Wraps a content fragment into a full standalone HTML document that loads the
 * app fonts. Full documents (already containing a `<!DOCTYPE html>`/`<html>`
 * root with their own @font-face, e.g. the router admin page) are returned
 * unchanged so their own styling wins.
 */
export function wrapIframeContent(content: string): string {
    const trimmed = content.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
        return content;
    }
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${IFRAME_FONT_FACES_CSS}
      html, body { margin: 0; padding: 0; }
      body { font-family: ${INRIA_SANS_STACK}; }
      pre, code, kbd, samp, .mono { font-family: ${GEIST_MONO_STACK}; }
    </style>
  </head>
  <body>${content}</body>
</html>`;
}
