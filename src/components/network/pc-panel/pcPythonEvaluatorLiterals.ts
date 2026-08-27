import { isSingleStringLiteral } from './pcPythonRunnerHelpers';

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
    const raw = trimmed.slice(1, -1);
    return handled(raw
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\'));
  }

  if (!isNaN(Number(trimmed))) return handled(Number(trimmed));
  if (trimmed === 'True') return handled(true);
  if (trimmed === 'False') return handled(false);
  if (trimmed === 'None') return handled(null);
  if (scope[trimmed] !== undefined) return handled(scope[trimmed]);

  return { handled: false };
}
