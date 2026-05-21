# Sentinel's Security Journal

## 2025-05-15 - Hardening cross-window communication in sandboxed iframes
**Vulnerability:** Use of wildcard `*` in `postMessage` and missing origin validation in message listeners.
**Learning:** Even with `allow-same-origin` in a `sandbox` attribute, `srcdoc` iframes can have an opaque origin (`null`) in some browsers or configurations. When sending messages from the iframe to the parent, using `window.parent.location.origin` ensures the data is only sent to the expected application origin. On the receiving side, the listener must explicitly allow both the application origin and `'null'` (to support these sandboxed frames) while rejecting all other origins.
**Prevention:** Always specify a target origin in `postMessage`. Always validate `event.origin` in `message` listeners.

## 2025-05-15 - Recursive URI scheme bypass in sanitization
**Vulnerability:** Single-pass `javascript:` scheme removal can be bypassed using nested schemes like `java<javascript:>script:`.
**Learning:** Attackers can use inner tags or schemes that the sanitizer removes to "assemble" a malicious scheme in a second pass if the sanitizer doesn't handle it. Recursively stripping schemes until no more matches are found prevents this class of bypass.
**Prevention:** Use a `do-while` loop for URI scheme removal and strip HTML tags before scheme validation.
