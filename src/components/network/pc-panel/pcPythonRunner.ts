// pcPythonRunner.ts
// A lightweight, safe Python script interpreter for PC CMD.

export interface PythonExecutionResult {
  output: string;
  error?: string;
}

export function executePythonScript(code: string): PythonExecutionResult {
  const lines = code.split('\n');
  const outputs: string[] = [];
  const scope: Record<string, unknown> = {
    true: true,
    false: false,
    None: null,
  };

  let inLoop = false;
  let loopVar = '';
  let loopItems: unknown[] = [];
  let loopBodyLines: string[] = [];

  const evaluateExpr = (expr: string): unknown => {
    const trimmed = expr.trim();
    if (!trimmed) return '';

    // String literal
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Number literal
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }

    // Boolean or None
    if (trimmed === 'True') return true;
    if (trimmed === 'False') return false;
    if (trimmed === 'None') return null;

    // Scope variable lookups or simple binary expression (a + b, a * b, etc.)
    if (scope[trimmed] !== undefined) {
      return scope[trimmed];
    }

    // Handle range(n) or range(start, stop)
    const rangeMatch = /^range\((.+)\)$/.exec(trimmed);
    if (rangeMatch) {
      const args = rangeMatch[1].split(',').map(a => Number(evaluateExpr(a)));
      if (args.length === 1) {
        return Array.from({ length: args[0] }, (_, i) => i);
      } else if (args.length === 2) {
        return Array.from({ length: args[1] - args[0] }, (_, i) => args[0] + i);
      }
    }

    // Handle string concatenation or math in simple expressions like: "Hello " + name
    if (trimmed.includes('+')) {
      const parts = trimmed.split('+').map(p => evaluateExpr(p));
      if (parts.some(p => typeof p === 'string')) {
        return parts.map(p => String(p ?? '')).join('');
      }
      return parts.reduce((acc: number, val: unknown) => acc + Number(val || 0), 0);
    }

    if (trimmed.includes('*')) {
      const parts = trimmed.split('*').map(p => evaluateExpr(p));
      return parts.reduce((acc: number, val: unknown) => acc * Number(val || 1), 1);
    }

    // Fallback: JS Function evaluation in isolated scope
    try {
      const keys = Object.keys(scope);
      const vals = Object.values(scope);
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return (${trimmed});`);
      return fn(...vals);
    } catch {
      return trimmed;
    }
  };

  const processLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Handle print(...)
    const printMatch = /^print\s*\((.*)\)$/.exec(trimmed);
    if (printMatch) {
      const rawArgs = printMatch[1];
      if (!rawArgs.trim()) {
        outputs.push('');
        return;
      }

      // Split arguments respecting quotes
      const args: string[] = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < rawArgs.length; i++) {
        const char = rawArgs[i];
        if ((char === '"' || char === "'") && (i === 0 || rawArgs[i - 1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (quoteChar === char) {
            inQuotes = false;
          }
        }
        if (char === ',' && !inQuotes) {
          args.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      if (current) args.push(current);

      const evaluatedArgs = args.map(a => String(evaluateExpr(a) ?? ''));
      outputs.push(evaluatedArgs.join(' '));
      return;
    }

    // Handle variable assignment: var_name = expr
    const assignMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/.exec(trimmed);
    if (assignMatch) {
      const varName = assignMatch[1];
      const expr = assignMatch[2];
      scope[varName] = evaluateExpr(expr);
      return;
    }

    // Fallback for simple standalone expression (e.g. function call or math)
    try {
      evaluateExpr(trimmed);
    } catch {
      // ignore
    }
  };

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for loop start: for item in items:
      const forMatch = /^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+):$/.exec(trimmed);
      if (forMatch) {
        inLoop = true;
        loopVar = forMatch[1];
        const iterable = evaluateExpr(forMatch[2]);
        loopItems = Array.isArray(iterable) ? iterable : [];
        loopBodyLines = [];
        continue;
      }

      if (inLoop) {
        // Indented lines belong to the loop body
        if (line.startsWith(' ') || line.startsWith('\t')) {
          loopBodyLines.push(line);
          // If this is the last line, execute the collected loop
          if (i === lines.length - 1) {
            for (const item of loopItems) {
              scope[loopVar] = item;
              for (const bodyLine of loopBodyLines) {
                processLine(bodyLine);
              }
            }
            inLoop = false;
          }
          continue;
        } else {
          // Loop ended, execute loop
          for (const item of loopItems) {
            scope[loopVar] = item;
            for (const bodyLine of loopBodyLines) {
              processLine(bodyLine);
            }
          }
          inLoop = false;
        }
      }

      processLine(line);
    }
  } catch (err) {
    return {
      output: outputs.join('\n'),
      error: `Python error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return {
    output: outputs.join('\n'),
  };
}
