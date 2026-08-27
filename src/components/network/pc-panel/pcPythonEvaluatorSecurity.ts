import type { PythonEvaluationResult } from './pcPythonEvaluatorLiterals';

const unsafeExpressionPattern = /\b(?:globalThis|window|document|global|process|require|module|exports|Function|eval|constructor|__proto__|prototype|import|fetch|XMLHttpRequest|WebSocket|setTimeout|setInterval|this|new)\b|[;`]/;

/** Restricts the legacy JavaScript fallback to side-effect-free expressions. */
export function evaluateSafeJavaScriptFallback(
  expression: string,
  scope: Record<string, unknown>,
): PythonEvaluationResult {
  if (unsafeExpressionPattern.test(expression)) return { handled: true, value: expression };

  try {
    const keys: string[] = [];
    const vals: unknown[] = [];
    for (const [key, value] of Object.entries(scope)) {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        keys.push(key);
        vals.push(value);
      }
    }
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `return (${expression});`);
    return { handled: true, value: fn(...vals) };
  } catch {
    return { handled: true, value: expression };
  }
}
