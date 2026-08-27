import { findOperatorIndex, formatPythonValue } from './pcPythonRunnerHelpers';
import type { PythonEvaluationResult } from './pcPythonEvaluatorLiterals';

/** Evaluates logical and comparison operators while preserving short-circuiting. */
export function evaluatePythonLogicalOrComparison(
  expression: string,
  evaluateExpr: (expr: string) => unknown,
): PythonEvaluationResult {
  const trimmed = expression.trim();

  const orIdx = findOperatorIndex(trimmed, ' or ');
  if (orIdx !== -1) {
    const leftVal = evaluateExpr(trimmed.slice(0, orIdx));
    return { handled: true, value: leftVal || evaluateExpr(trimmed.slice(orIdx + 4)) };
  }

  const andIdx = findOperatorIndex(trimmed, ' and ');
  if (andIdx !== -1) {
    const leftVal = evaluateExpr(trimmed.slice(0, andIdx));
    return { handled: true, value: leftVal && evaluateExpr(trimmed.slice(andIdx + 5)) };
  }

  if (trimmed.startsWith('not ') || trimmed.startsWith('not(')) {
    const targetExpr = trimmed.startsWith('not ') ? trimmed.slice(4) : trimmed.slice(3);
    return { handled: true, value: !evaluateExpr(targetExpr) };
  }

  const isNotIdx = findOperatorIndex(trimmed, ' is not ');
  if (isNotIdx !== -1) {
    return { handled: true, value: evaluateExpr(trimmed.slice(0, isNotIdx)) !== evaluateExpr(trimmed.slice(isNotIdx + 8)) };
  }

  const isIdx = findOperatorIndex(trimmed, ' is ');
  if (isIdx !== -1) {
    return { handled: true, value: evaluateExpr(trimmed.slice(0, isIdx)) === evaluateExpr(trimmed.slice(isIdx + 4)) };
  }

  const notInIdx = findOperatorIndex(trimmed, ' not in ');
  if (notInIdx !== -1) {
    const leftVal = evaluateExpr(trimmed.slice(0, notInIdx));
    const rightVal = evaluateExpr(trimmed.slice(notInIdx + 8));
    if (Array.isArray(rightVal)) return { handled: true, value: !rightVal.includes(leftVal) };
    if (typeof rightVal === 'string') return { handled: true, value: !rightVal.includes(String(leftVal)) };
    if (rightVal instanceof Set) return { handled: true, value: !rightVal.has(leftVal) };
    if (rightVal && typeof rightVal === 'object') return { handled: true, value: !(String(leftVal) in rightVal) };
    return { handled: true, value: true };
  }

  const inIdx = findOperatorIndex(trimmed, ' in ');
  if (inIdx !== -1) {
    const leftVal = evaluateExpr(trimmed.slice(0, inIdx));
    const rightVal = evaluateExpr(trimmed.slice(inIdx + 4));
    if (Array.isArray(rightVal)) return { handled: true, value: rightVal.includes(leftVal) };
    if (typeof rightVal === 'string') return { handled: true, value: rightVal.includes(String(leftVal)) };
    if (rightVal instanceof Set) return { handled: true, value: rightVal.has(leftVal) };
    if (rightVal && typeof rightVal === 'object') return { handled: true, value: String(leftVal) in rightVal };
    return { handled: true, value: false };
  }

  const equalityOperators = [
    { token: '==', compare: (left: unknown, right: unknown) => left === right || formatPythonValue(left) === formatPythonValue(right) },
    { token: '!=', compare: (left: unknown, right: unknown) => left !== right && formatPythonValue(left) !== formatPythonValue(right) },
  ];
  for (const { token, compare } of equalityOperators) {
    const index = findOperatorIndex(trimmed, token);
    if (index === -1) continue;
    const leftVal = evaluateExpr(trimmed.slice(0, index));
    const rightVal = evaluateExpr(trimmed.slice(index + token.length));
    if (Array.isArray(leftVal) && Array.isArray(rightVal)) {
      const equal = leftVal.length === rightVal.length && leftVal.every((value, i) => value === rightVal[i] || formatPythonValue(value) === formatPythonValue(rightVal[i]));
      return { handled: true, value: token === '==' ? equal : !equal };
    }
    return { handled: true, value: compare(leftVal, rightVal) };
  }

  const numericOperators = [
    { token: '<=', compare: (left: number, right: number) => left <= right },
    { token: '>=', compare: (left: number, right: number) => left >= right },
    { token: '<', compare: (left: number, right: number) => left < right },
    { token: '>', compare: (left: number, right: number) => left > right },
  ];
  for (const { token, compare } of numericOperators) {
    const index = findOperatorIndex(trimmed, token);
    if (index === -1) continue;
    if ((token === '<' || token === '>') && (trimmed[index + 1] === '=' || trimmed[index + 1] === token)) continue;
    const leftVal = Number(evaluateExpr(trimmed.slice(0, index)));
    const rightVal = Number(evaluateExpr(trimmed.slice(index + token.length)));
    return { handled: true, value: compare(leftVal, rightVal) };
  }

  return { handled: false };
}
