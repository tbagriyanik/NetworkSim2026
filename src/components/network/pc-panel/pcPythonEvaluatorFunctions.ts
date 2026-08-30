import { PyClass, PyInstance, parseFormatArgs } from './pcPythonRunnerHelpers';
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

  const { positional, kwargs } = match[2].trim() ? parseFormatArgs(match[2], evaluateExpr) : { positional: [], kwargs: {} as Record<string, unknown> };

  if (fn instanceof PyClass) {
    const instance = new PyInstance(fn);
    const initMethod = fn.findMethod('__init__');
    if (typeof initMethod === 'function') {
      const paramNames = (initMethod as unknown as Record<string, unknown>).__pythonParamNames as string[] | undefined;
      const orderedArgs = paramNames ? (() => {
        const bound: unknown[] = [];
        const remaining = [...positional];
        for (const name of paramNames) {
          if (Object.prototype.hasOwnProperty.call(kwargs, name)) {
            bound.push(kwargs[name]);
            delete kwargs[name];
          } else if (remaining.length > 0) {
            bound.push(remaining.shift()!);
          }
        }
        if (remaining.length > 0) bound.push(...remaining);
        return bound;
      })() : positional;
      initMethod(instance, ...orderedArgs);
    }
    return { handled: true, value: instance };
  }

  const paramNames = (fn as unknown as Record<string, unknown>).__pythonParamNames as string[] | undefined;
  const orderedArgs = paramNames ? (() => {
    const bound: unknown[] = [];
    const remaining = [...positional];
    for (const name of paramNames) {
      if (Object.prototype.hasOwnProperty.call(kwargs, name)) {
        bound.push(kwargs[name]);
        delete kwargs[name];
      } else if (remaining.length > 0) {
        bound.push(remaining.shift()!);
      }
    }
    if (remaining.length > 0) bound.push(...remaining);
    return bound;
  })() : positional;

  return { handled: true, value: fn(...orderedArgs) };
}
