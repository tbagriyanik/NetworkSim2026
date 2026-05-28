# Sentinel's Security Journal

## 2025-05-15 - Hardening cross-window communication in sandboxed iframes
**Vulnerability:** Use of wildcard `*` in `postMessage` and missing origin validation in message listeners.
**Learning:** Even with `allow-same-origin` in a `sandbox` attribute, `srcdoc` iframes can have an opaque origin (`null`) in some browsers or configurations. When sending messages from the iframe to the parent, using `window.parent.location.origin` ensures the data is only sent to the expected application origin. On the receiving side, the listener must explicitly allow both the application origin and `'null'` (to support these sandboxed frames) while rejecting all other origins.
**Prevention:** Always specify a target origin in `postMessage`. Always validate `event.origin` in `message` listeners.

## 2025-05-15 - Recursive URI scheme bypass in sanitization
**Vulnerability:** Single-pass `javascript:` scheme removal can be bypassed using nested schemes like `java<javascript:>script:`.
**Learning:** Attackers can use inner tags or schemes that the sanitizer removes to "assemble" a malicious scheme in a second pass if the sanitizer doesn't handle it. Recursively stripping schemes until no more matches are found prevents this class of bypass.
**Prevention:** Use a `do-while` loop for URI scheme removal and strip HTML tags before scheme validation.

## 2025-05-15 - SVG XSS via dangerous URI schemes
**Vulnerability:** Whitelist-based SVG sanitizers can still be vulnerable if they allow attributes like `href` without validating their content for dangerous URI schemes like `javascript:`.
**Learning:** Even if a tag (like `<a>` or `<image>`) and an attribute (like `href` or `xlink:href`) are whitelisted, the *content* of that attribute must be inspected if it can trigger script execution. Attackers can use obfuscation like whitespace (`java script:`) or case variations to bypass simple string matching.
**Prevention:** Always validate URI-bearing attributes against a blacklist of dangerous schemes, and normalize the content (lowercase, remove whitespace) before validation.
