import type { PythonEvaluationResult } from './pcPythonEvaluatorLiterals';

/** Restricts fallback expression handling without using dynamic code evaluation (new Function / eval). */
export function evaluateSafeJavaScriptFallback(
  expression: string,
  _scope: Record<string, unknown>,
): PythonEvaluationResult {
  return { handled: true, value: expression };
}
