import { isSingleStringLiteral, PyComplex } from './pcPythonRunnerHelpers';

export interface PythonEvaluationResult {
  handled: boolean;
  value?: unknown;
}

const handled = (value: unknown): PythonEvaluationResult => ({ handled: true, value });

/** Evaluates primitive Python literals and direct scope values. */
export function evaluatePythonLiteral(
  expression: string,
  scope: Record<string, unknown>,
): PythonEvaluationResult {
  const trimmed = expression.trim();

  if (isSingleStringLiteral(trimmed)) {
    let raw = '';
    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      raw = trimmed.slice(3, -3);
    } else {
      raw = trimmed.slice(1, -1);
    }
    return handled(raw
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\'));
  }

  // Complex literal: 3+4j, 4j, (3+4j), -2.5-1.2j
  const unparenthesized = (trimmed.startsWith('(') && trimmed.endsWith(')')) ? trimmed.slice(1, -1).trim() : trimmed;
  const complexMatch = /^([+-]?\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)j$/i.exec(unparenthesized);
  if (complexMatch) {
    const real = parseFloat(complexMatch[1]);
    const sign = complexMatch[2] === '-' ? -1 : 1;
    const imag = parseFloat(complexMatch[3]) * sign;
    return handled(new PyComplex(real, imag));
  }
  const pureImagMatch = /^([+-]?\d+(?:\.\d+)?)j$/i.exec(unparenthesized);
  if (pureImagMatch) {
    return handled(new PyComplex(0, parseFloat(pureImagMatch[1])));
  }

  if (!isNaN(Number(trimmed))) return handled(Number(trimmed));
  if (trimmed === 'True') return handled(true);
  if (trimmed === 'False') return handled(false);
  if (trimmed === 'None') return handled(null);
  if (scope[trimmed] !== undefined) return handled(scope[trimmed]);

  return { handled: false };
}
