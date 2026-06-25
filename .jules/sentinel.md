# Sentinel's Journal - Critical Security Learnings

This journal tracks critical security-related discoveries and learnings in this repository.

## 2025-05-15 - API Input Length Validation
**Vulnerability:** Lack of length constraints on Room API endpoints (`code`, `studentId`, `teacherId`, `currentTask`).
**Learning:** While the application had type checks, it lacked explicit length limits for several fields stored in Redis. This posed a risk for DoS (via large payloads) and could lead to UI breakage or unexpected behavior in downstream consumers like PDF generators.
**Prevention:** Always implement "Defense in Depth" by enforcing strict length limits at the API entry point, even if the frontend or database also performs some validation. This ensures the system fails fast and securely.
