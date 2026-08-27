import { PyClass, PyInstance } from './pcPythonRunnerHelpers';
import { splitOutsideQuotesAndParens } from './pcPythonRunnerHelpers';
import type { PythonEvaluationResult } from './pcPythonEvaluatorLiterals';

/** Evaluates user-defined Python functions and class constructors. */
export function evaluatePythonFunctionCall(
  expression: string,
  scope: Record<string, unknown>,
  evaluateExpr: (expr: string) => unknown,
): PythonEvaluationResult {
  const match = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/.exec(expression.trim());
  if (!match) return { handled: false };

  const fn = scope[match[1]];
  if (!(fn instanceof PyClass) && typeof fn !== 'function') return { handled: false };

  const args = match[2].trim()
    ? splitOutsideQuotesAndParens(match[2], ',').map(arg => evaluateExpr(arg))
    : [];

  if (fn instanceof PyClass) {
    const instance = new PyInstance(fn);
    const initMethod = fn.findMethod('__init__');
    if (typeof initMethod === 'function') initMethod(instance, ...args);
    return { handled: true, value: instance };
  }

  return { handled: true, value: fn(...args) };
}
