// pcPythonRunner.ts
// A lightweight, safe Python script interpreter for PC CMD.

export interface PythonExecutionResult {
  output: string;
  error?: string;
  waitingForInput?: boolean;
  inputPrompt?: string;
}

class PythonInputRequiredException {
  constructor(public prompt: string) { }
}

function parseFormatArgs(
  rawArgs: string,
  evalFn: (expr: string) => unknown
): { positional: unknown[]; kwargs: Record<string, unknown> } {
  const positional: unknown[] = [];
  const kwargs: Record<string, unknown> = {};

  const trimmedRaw = rawArgs.trim();
  if (!trimmedRaw) {
    return { positional, kwargs };
  }

  const hasComma = trimmedRaw.includes(',');

  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let parenDepth = 0;

  for (let i = 0; i < trimmedRaw.length; i++) {
    const char = trimmedRaw[i];
    if ((char === '"' || char === "'") && (i === 0 || rawArgs[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inQuotes = false;
      }
    } else if (!inQuotes) {
      if (char === '(' || char === '[' || char === '{') parenDepth++;
      else if (char === ')' || char === ']' || char === '}') parenDepth--;
    }

    const isDelimiter = hasComma
      ? char === ',' && !inQuotes && parenDepth === 0
      : (char === ',' || /\s/.test(char)) && !inQuotes && parenDepth === 0;

    if (isDelimiter) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    tokens.push(current.trim());
  }

  for (const token of tokens) {
    const kwMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/.exec(token);
    if (kwMatch && !token.startsWith('"') && !token.startsWith("'")) {
      kwargs[kwMatch[1]] = evalFn(kwMatch[2]);
    } else {
      positional.push(evalFn(token));
    }
  }

  return { positional, kwargs };
}

function formatStringTemplate(
  template: string,
  positional: unknown[],
  kwargs: Record<string, unknown>
): string {
  let autoIndex = 0;
  return template.replace(/\{([^{}]*)\}/g, (match, key: string) => {
    let cleanKey = key.trim();
    let spec = '';

    if (cleanKey.includes(':')) {
      const parts = cleanKey.split(':');
      cleanKey = parts[0].trim();
      spec = parts[1].trim();
    }

    let val: unknown;
    if (cleanKey === '') {
      val = positional[autoIndex++];
    } else if (/^\d+$/.test(cleanKey)) {
      const idx = parseInt(cleanKey, 10);
      val = positional[idx];
    } else if (cleanKey in kwargs) {
      val = kwargs[cleanKey];
    } else {
      val = match;
    }

    if (val === undefined) {
      return match;
    }

    if (spec && typeof val === 'number') {
      const floatMatch = /\.([0-9]+)f/.exec(spec);
      if (floatMatch) {
        const decimals = parseInt(floatMatch[1], 10);
        return val.toFixed(decimals);
      }
    }

    return String(val);
  });
}

function getPythonType(val: unknown): string {
  if (val === null || val === undefined) return "<class 'NoneType'>";
  if (typeof val === 'boolean') return "<class 'bool'>";
  if (typeof val === 'number') {
    return Number.isInteger(val) ? "<class 'int'>" : "<class 'float'>";
  }
  if (typeof val === 'string') return "<class 'str'>";
  if (Array.isArray(val)) return "<class 'list'>";
  if (typeof val === 'object') return "<class 'dict'>";
  return `<class '${typeof val}'>`;
}

export function formatPythonValue(val: unknown): string {
  if (val === null || val === undefined) return 'None';
  if (val === true) return 'True';
  if (val === false) return 'False';
  if (Array.isArray(val)) {
    return `[${val.map(item => formatPythonValue(item)).join(', ')}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>).map(
      ([k, v]) => `'${k}': ${formatPythonValue(v)}`
    );
    return `{${entries.join(', ')}}`;
  }
  return String(val);
}

function stripInlineComment(line: string): string {
  let inQuotes = false;
  let quoteChar = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if ((char === '"' || char === "'") && (i === 0 || line[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inQuotes = false;
      }
    } else if (char === '#' && !inQuotes) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

function findOperatorIndex(str: string, op: string): number {
  let inQ = false;
  let qChar = '';
  let pDepth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inQ) { inQ = true; qChar = char; }
      else if (qChar === char) { inQ = false; }
    } else if (!inQ) {
      if (char === '(' || char === '[' || char === '{') pDepth++;
      else if (char === ')' || char === ']' || char === '}') pDepth--;
      else if (pDepth === 0 && str.startsWith(op, i)) {
        return i;
      }
    }
  }
  return -1;
}

function splitOutsideQuotesAndParens(str: string, op: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQ = false;
  let qChar = '';
  let pDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inQ) { inQ = true; qChar = char; }
      else if (qChar === char) { inQ = false; }
    } else if (!inQ) {
      if (char === '(' || char === '[' || char === '{') pDepth++;
      else if (char === ')' || char === ']' || char === '}') pDepth--;
      else if (pDepth === 0 && str.startsWith(op, i)) {
        parts.push(current);
        current = '';
        i += op.length - 1;
        continue;
      }
    }
    current += char;
  }
  if (current || parts.length > 0) parts.push(current);
  return parts.map(p => p.trim());
}

function formatPrintfString(template: string, args: unknown[]): string {
  let argIndex = 0;
  return template.replace(/%([-+0 #]*)(\d+)?(?:\.(\d+))?([sdiXxfgeEG%])/g, (_match, flags, widthStr, precStr, type) => {
    if (type === '%') return '%';
    const val = args[argIndex++];
    if (type === 's') return formatPythonValue(val);
    if (type === 'd' || type === 'i') {
      const num = Math.floor(Number(val || 0));
      return String(num);
    }
    if (type === 'f' || type === 'F' || type === 'g' || type === 'e') {
      const num = Number(val || 0);
      const prec = precStr !== undefined ? parseInt(precStr, 10) : 6;
      const str = num.toFixed(prec);
      const width = widthStr ? parseInt(widthStr, 10) : 0;
      if (flags.includes('0') && str.length < width) {
        const isNeg = str.startsWith('-');
        const digits = isNeg ? str.slice(1) : str;
        const padded = digits.padStart(width - (isNeg ? 1 : 0), '0');
        return isNeg ? '-' + padded : padded;
      }
      return str;
    }
    return String(val ?? '');
  });
}

function pythonRange(...args: number[]): number[] {
  let start = 0;
  let stop = 0;
  let step = 1;

  if (args.length === 1) {
    stop = args[0];
  } else if (args.length === 2) {
    start = args[0];
    stop = args[1];
  } else if (args.length >= 3) {
    start = args[0];
    stop = args[1];
    step = args[2] || 1;
  }

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < stop; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > stop; i += step) {
      result.push(i);
    }
  }
  return result;
}

type Statement =
  | { type: 'line'; text: string }
  | { type: 'if'; branches: { condition: string | null; body: Statement[] }[] }
  | { type: 'while'; condition: string; body: Statement[] }
  | { type: 'for'; varName: string; iterableExpr: string; body: Statement[] };

interface ParsedLine {
  indent: number;
  text: string;
}

export function executePythonScript(code: string, inputs: string[] = []): PythonExecutionResult {
  const rawLines = code.split('\n');
  const outputs: string[] = [];

  const inputsQueue = [...inputs];

  const pythonInput = (promptMsg?: unknown): string => {
    const pStr = promptMsg !== undefined && promptMsg !== null ? String(promptMsg) : '';
    if (inputsQueue.length > 0) {
      if (pStr) {
        outputs.push(pStr);
      }
      return inputsQueue.shift()!;
    }
    throw new PythonInputRequiredException(pStr);
  };

  const scope: Record<string, unknown> = {
    true: true,
    false: false,
    None: null,
    True: true,
    False: false,
    float: (v: unknown) => Number(v),
    int: (v: unknown) => {
      if (typeof v === 'boolean') return v ? 1 : 0;
      return Math.floor(Number(v));
    },
    str: (v: unknown) => String(v),
    bool: (v: unknown) => {
      if (v === 'False' || v === 'false' || v === '0' || v === 0 || v === false || v === null || v === undefined) return false;
      return Boolean(v);
    },
    type: (v: unknown) => getPythonType(v),
    len: (v: unknown) => {
      if (Array.isArray(v) || typeof v === 'string') return v.length;
      if (typeof v === 'object' && v !== null) return Object.keys(v).length;
      return 0;
    },
    abs: (v: unknown) => Math.abs(Number(v || 0)),
    round: (v: unknown, ndigits?: unknown) => {
      const num = Number(v || 0);
      const digits = ndigits !== undefined ? Number(ndigits) : 0;
      return digits > 0 ? Number(num.toFixed(digits)) : Math.round(num);
    },
    sum: (v: unknown) => (Array.isArray(v) ? v.reduce((acc: number, item: unknown) => acc + Number(item || 0), 0) : 0),
    range: (...args: unknown[]) => pythonRange(...args.map(a => Number(a))),
    input: pythonInput,
  };

  const evaluateExpr = (expr: string): unknown => {
    const trimmed = expr.trim();
    if (!trimmed) return '';

    // Handle Python string .format(...) method
    const formatIdx = trimmed.lastIndexOf('.format(');
    if (formatIdx !== -1 && trimmed.endsWith(')')) {
      const targetStrExpr = trimmed.slice(0, formatIdx).trim();
      const rawFormatArgs = trimmed.slice(formatIdx + 8, -1);
      const targetVal = evaluateExpr(targetStrExpr);
      if (typeof targetVal === 'string') {
        const { positional, kwargs } = parseFormatArgs(rawFormatArgs, evaluateExpr);
        return formatStringTemplate(targetVal, positional, kwargs);
      }
    }

    // Handle Python f-strings: f"..." or f'...'
    if ((trimmed.startsWith('f"') && trimmed.endsWith('"')) || (trimmed.startsWith("f'") && trimmed.endsWith("'"))) {
      const raw = trimmed.slice(2, -1);
      return raw.replace(/\{([^{}]+)\}/g, (_, inner) => String(evaluateExpr(inner) ?? ''));
    }

    // Handle input(...)
    const inputMatch = /^input\s*\((.*)\)$/.exec(trimmed);
    if (inputMatch) {
      const promptArg = inputMatch[1].trim();
      const promptMsg = promptArg ? evaluateExpr(promptArg) : '';
      return pythonInput(promptMsg);
    }

    // Handle type(...)
    const typeMatch = /^type\s*\((.*)\)$/.exec(trimmed);
    if (typeMatch) {
      const val = evaluateExpr(typeMatch[1]);
      return getPythonType(val);
    }

    // Handle float(...)
    const floatMatch = /^float\s*\((?:[^()]|\([^()]*\))*\)$/.exec(trimmed);
    if (floatMatch) {
      const val = evaluateExpr(trimmed.slice(trimmed.indexOf('(') + 1, -1));
      return Number(val);
    }

    // Handle int(...)
    const intMatch = /^int\s*\((.*)\)$/.exec(trimmed);
    if (intMatch) {
      const val = evaluateExpr(intMatch[1]);
      return typeof val === 'boolean' ? (val ? 1 : 0) : Math.floor(Number(val));
    }

    // Handle str(...)
    const strMatch = /^str\s*\((.*)\)$/.exec(trimmed);
    if (strMatch) {
      const val = evaluateExpr(strMatch[1]);
      return String(val);
    }

    // Handle bool(...)
    const boolMatch = /^bool\s*\((.*)\)$/.exec(trimmed);
    if (boolMatch) {
      const val = evaluateExpr(boolMatch[1]);
      if (val === 'False' || val === 'false' || val === '0' || val === 0 || val === false || val === null || val === undefined) return false;
      return Boolean(val);
    }

    // Handle len(...)
    const lenMatch = /^len\s*\((.*)\)$/.exec(trimmed);
    if (lenMatch) {
      const val = evaluateExpr(lenMatch[1]);
      if (Array.isArray(val) || typeof val === 'string') return val.length;
      if (typeof val === 'object' && val !== null) return Object.keys(val).length;
      return 0;
    }

    // Handle abs(...)
    const absMatch = /^abs\s*\((.*)\)$/.exec(trimmed);
    if (absMatch) {
      const val = evaluateExpr(absMatch[1]);
      return Math.abs(Number(val || 0));
    }

    // Handle round(...)
    const roundMatch = /^round\s*\((.*)\)$/.exec(trimmed);
    if (roundMatch) {
      const parts = roundMatch[1].split(',').map(p => evaluateExpr(p));
      const val = Number(parts[0] || 0);
      const digits = parts[1] !== undefined ? Number(parts[1]) : 0;
      return digits > 0 ? Number(val.toFixed(digits)) : Math.round(val);
    }

    // Handle sum(...)
    const sumMatch = /^sum\s*\((.*)\)$/.exec(trimmed);
    if (sumMatch) {
      const val = evaluateExpr(sumMatch[1]);
      return Array.isArray(val) ? val.reduce((acc: number, item: unknown) => acc + Number(item || 0), 0) : 0;
    }

    // List method pop(...) as expression
    const popExprMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*pop\s*\((.*)\)$/.exec(trimmed);
    if (popExprMatch) {
      const listVar = popExprMatch[1];
      const listObj = scope[listVar];
      if (Array.isArray(listObj)) {
        const argStr = popExprMatch[2].trim();
        const idx = argStr ? Number(evaluateExpr(argStr)) : listObj.length - 1;
        const removed = listObj.splice(idx, 1);
        return removed[0];
      }
    }

    // String literal
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // List literal: [a, b, c]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return [];
      const parts: string[] = [];
      let current = '';
      let inQ = false;
      let qChar = '';
      let pDepth = 0;
      for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if ((char === '"' || char === "'") && (i === 0 || inner[i - 1] !== '\\')) {
          if (!inQ) { inQ = true; qChar = char; }
          else if (qChar === char) { inQ = false; }
        } else if (!inQ) {
          if (char === '(' || char === '[' || char === '{') pDepth++;
          else if (char === ')' || char === ']' || char === '}') pDepth--;
        }
        if (char === ',' && !inQ && pDepth === 0) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) parts.push(current.trim());
      return parts.map(p => evaluateExpr(p));
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

    // Parenthesized expression or Tuple: (a, b, c) or (expr)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return [];
      const parts: string[] = [];
      let current = '';
      let inQ = false;
      let qChar = '';
      let pDepth = 0;
      for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if ((char === '"' || char === "'") && (i === 0 || inner[i - 1] !== '\\')) {
          if (!inQ) { inQ = true; qChar = char; }
          else if (qChar === char) { inQ = false; }
        } else if (!inQ) {
          if (char === '(' || char === '[' || char === '{') pDepth++;
          else if (char === ')' || char === ']' || char === '}') pDepth--;
        }
        if (char === ',' && !inQ && pDepth === 0) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) parts.push(current.trim());
      if (parts.length > 1) {
        return parts.map(p => evaluateExpr(p));
      } else if (parts.length === 1) {
        return evaluateExpr(parts[0]);
      }
    }

    // Handle Python % string formatting or modulo
    const percentIdx = findOperatorIndex(trimmed, '%');
    if (percentIdx !== -1) {
      const leftExpr = trimmed.slice(0, percentIdx).trim();
      const rightExpr = trimmed.slice(percentIdx + 1).trim();
      const leftVal = evaluateExpr(leftExpr);
      const rightVal = evaluateExpr(rightExpr);
      if (typeof leftVal === 'string') {
        const argsArray = Array.isArray(rightVal) ? rightVal : [rightVal];
        return formatPrintfString(leftVal, argsArray);
      } else {
        return Number(leftVal) % Number(rightVal);
      }
    }

    // Exponentiation **
    const powIdx = findOperatorIndex(trimmed, '**');
    if (powIdx !== -1) {
      const baseExpr = trimmed.slice(0, powIdx).trim();
      const expExpr = trimmed.slice(powIdx + 2).trim();
      const baseVal = Number(evaluateExpr(baseExpr));
      const expVal = Number(evaluateExpr(expExpr));
      return Math.pow(baseVal, expVal);
    }

    // Handle range(n) or range(start, stop) or range(start, stop, step)
    const rangeMatch = /^range\((.+)\)$/.exec(trimmed);
    if (rangeMatch) {
      const args = rangeMatch[1].split(',').map(a => Number(evaluateExpr(a)));
      return pythonRange(...args);
    }

    // Handle math & concatenation outside parens/quotes
    const addParts = splitOutsideQuotesAndParens(trimmed, '+');
    if (addParts.length > 1) {
      const parts = addParts.map(p => evaluateExpr(p));
      if (parts.some(p => typeof p === 'string')) {
        return parts.map(p => String(p ?? '')).join('');
      }
      return parts.reduce((acc: number, val: unknown) => acc + Number(val || 0), 0);
    }

    const subParts = splitOutsideQuotesAndParens(trimmed, '-');
    if (subParts.length > 1 && subParts[0] !== '') {
      const parts = subParts.map(p => evaluateExpr(p));
      return parts.reduce((acc: number, val: unknown, idx: number) => (idx === 0 ? Number(val) : acc - Number(val)), 0);
    }

    const mulParts = splitOutsideQuotesAndParens(trimmed, '*');
    if (mulParts.length > 1 && !trimmed.includes('**')) {
      const parts = mulParts.map(p => evaluateExpr(p));
      return parts.reduce((acc: number, val: unknown) => acc * Number(val || 1), 1);
    }

    const divParts = splitOutsideQuotesAndParens(trimmed, '/');
    if (divParts.length > 1) {
      const parts = divParts.map(p => evaluateExpr(p));
      return parts.reduce((acc: number, val: unknown, idx: number) => (idx === 0 ? Number(val) : acc / Number(val)), 0);
    }

    // Fallback: JS Function evaluation in isolated scope
    try {
      const { keys, vals } = getSafeScope();
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

      // Split arguments respecting quotes and parenthesis depth
      const args: string[] = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';
      let parenDepth = 0;

      for (let i = 0; i < rawArgs.length; i++) {
        const char = rawArgs[i];
        if ((char === '"' || char === "'") && (i === 0 || rawArgs[i - 1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (quoteChar === char) {
            inQuotes = false;
          }
        } else if (!inQuotes) {
          if (char === '(' || char === '[' || char === '{') parenDepth++;
          else if (char === ')' || char === ']' || char === '}') parenDepth--;
        }

        if (char === ',' && !inQuotes && parenDepth === 0) {
          args.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      if (current) args.push(current);

      const evaluatedArgs = args.map(a => formatPythonValue(evaluateExpr(a)));
      outputs.push(evaluatedArgs.join(' '));
      return;
    }

    // Handle List Methods:
    // .append(...)
    const appendMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*append\s*\((.*)\)$/.exec(trimmed);
    if (appendMatch) {
      const listVar = appendMatch[1];
      const val = evaluateExpr(appendMatch[2]);
      if (Array.isArray(scope[listVar])) {
        (scope[listVar] as unknown[]).push(val);
      } else {
        scope[listVar] = [val];
      }
      return;
    }

    // .remove(...)
    const removeMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*remove\s*\((.*)\)$/.exec(trimmed);
    if (removeMatch) {
      const listVar = removeMatch[1];
      const val = evaluateExpr(removeMatch[2]);
      const arr = scope[listVar];
      if (Array.isArray(arr)) {
        const idx = arr.indexOf(val);
        if (idx !== -1) arr.splice(idx, 1);
      }
      return;
    }

    // .pop(...)
    const popMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*pop\s*\((.*)\)$/.exec(trimmed);
    if (popMatch) {
      const listVar = popMatch[1];
      const arr = scope[listVar];
      if (Array.isArray(arr)) {
        const argStr = popMatch[2].trim();
        const idx = argStr ? Number(evaluateExpr(argStr)) : arr.length - 1;
        arr.splice(idx, 1);
      }
      return;
    }

    // .sort(...)
    const sortMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*sort\s*\((.*)\)$/.exec(trimmed);
    if (sortMatch) {
      const listVar = sortMatch[1];
      const arr = scope[listVar];
      if (Array.isArray(arr)) {
        arr.sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b));
        });
      }
      return;
    }

    // .reverse(...)
    const reverseMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*reverse\s*\((.*)\)$/.exec(trimmed);
    if (reverseMatch) {
      const listVar = reverseMatch[1];
      const arr = scope[listVar];
      if (Array.isArray(arr)) {
        arr.reverse();
      }
      return;
    }

    // Handle variable assignments (including tuple unpacking like x, y = y, x and augmented assignments +=, -=, *=, /=)
    const eqIdx = findOperatorIndex(trimmed, '=');
    if (eqIdx !== -1) {
      const prevChar = trimmed[eqIdx - 1];
      const nextChar = trimmed[eqIdx + 1];
      if (prevChar !== '=' && prevChar !== '!' && prevChar !== '<' && prevChar !== '>' && nextChar !== '=') {
        let isAugmented = false;
        let augOp = '';
        if (prevChar === '+' || prevChar === '-' || prevChar === '*' || prevChar === '/') {
          isAugmented = true;
          augOp = prevChar;
        }

        const leftSide = isAugmented ? trimmed.slice(0, eqIdx - 1).trim() : trimmed.slice(0, eqIdx).trim();
        const rightSide = trimmed.slice(eqIdx + 1).trim();

        if (isAugmented) {
          const varName = leftSide;
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
            scope[varName] = evaluateExpr(`${varName} ${augOp} (${rightSide})`);
            return;
          }
        } else {
          const targets = splitOutsideQuotesAndParens(leftSide, ',').map(t => t.trim());
          if (targets.every(t => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t))) {
            if (targets.length === 1) {
              scope[targets[0]] = evaluateExpr(rightSide);
            } else {
              // Multiple assignment / tuple unpacking (e.g. x, y = y, x)
              const rawRhsParts = splitOutsideQuotesAndParens(rightSide, ',');
              let rhsValues: unknown[];
              if (rawRhsParts.length > 1) {
                rhsValues = rawRhsParts.map(p => evaluateExpr(p));
              } else {
                const evalRhs = evaluateExpr(rightSide);
                rhsValues = Array.isArray(evalRhs) ? (evalRhs as unknown[]) : [evalRhs];
              }

              for (let i = 0; i < targets.length; i++) {
                scope[targets[i]] = rhsValues[i];
              }
            }
            return;
          }
        }
      }
    }

    // Fallback for simple standalone expression
    try {
      evaluateExpr(trimmed);
    } catch {
      // ignore
    }
  };

  // Structured Block Parser & Executor
  const parsedLines: ParsedLine[] = [];
  for (const l of rawLines) {
    const stripped = stripInlineComment(l);
    if (!stripped.trim() || stripped.trim().startsWith('#')) continue;
    const indentMatch = stripped.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0].replace(/\t/g, '    ').length : 0;
    parsedLines.push({ indent, text: stripped.trim() });
  }

  const getSafeScope = () => {
    const keys: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(scope)) {
      if (k === 'true' || k === 'false' || k === 'null' || k === 'undefined' || k === 'let' || k === 'var' || k === 'const' || k === 'function' || k === 'if' || k === 'else' || k === 'for' || k === 'while' || k === 'return' || k === 'class' || k === 'import' || k === 'export' || k === 'default' || k === 'try' || k === 'catch' || k === 'finally') {
        continue;
      }
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) {
        keys.push(k);
        vals.push(v);
      }
    }
    return { keys, vals };
  };

  const evalCondition = (condStr: string): boolean => {
    try {
      const { keys, vals } = getSafeScope();
      const jsCond = condStr
        .replace(/==/g, '===')
        .replace(/!=/g, '!==')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\b/g, '!');
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return Boolean(${jsCond});`);
      return Boolean(fn(...vals));
    } catch {
      return false;
    }
  };

  const parseBlockAt = (index: number, minIndent: number): { statements: Statement[]; nextIndex: number } => {
    const statements: Statement[] = [];
    let i = index;

    while (i < parsedLines.length) {
      const line = parsedLines[i];
      if (line.indent < minIndent) break;

      // Handle if / elif / else
      const ifMatch = /^if\s+(.+):$/.exec(line.text);
      if (ifMatch) {
        const branches: { condition: string | null; body: Statement[] }[] = [];
        const cond = ifMatch[1];
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        branches.push({ condition: cond, body: bodyRes.statements });
        i = bodyRes.nextIndex;

        while (i < parsedLines.length && parsedLines[i].indent === line.indent) {
          const elifMatch = /^elif\s+(.+):$/.exec(parsedLines[i].text);
          const elseMatch = /^else:$/.exec(parsedLines[i].text);

          if (elifMatch) {
            const elifBodyRes = parseBlockAt(i + 1, line.indent + 1);
            branches.push({ condition: elifMatch[1], body: elifBodyRes.statements });
            i = elifBodyRes.nextIndex;
          } else if (elseMatch) {
            const elseBodyRes = parseBlockAt(i + 1, line.indent + 1);
            branches.push({ condition: null, body: elseBodyRes.statements });
            i = elseBodyRes.nextIndex;
            break;
          } else {
            break;
          }
        }
        statements.push({ type: 'if', branches });
        continue;
      }

      // Handle while loop
      const whileMatch = /^while\s+(.+):$/.exec(line.text);
      if (whileMatch) {
        const cond = whileMatch[1];
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        statements.push({ type: 'while', condition: cond, body: bodyRes.statements });
        i = bodyRes.nextIndex;
        continue;
      }

      // Handle for loop
      const forMatch = /^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+):$/.exec(line.text);
      if (forMatch) {
        const varName = forMatch[1];
        const iterableExpr = forMatch[2];
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        statements.push({ type: 'for', varName, iterableExpr, body: bodyRes.statements });
        i = bodyRes.nextIndex;
        continue;
      }

      // Simple line statement
      statements.push({ type: 'line', text: line.text });
      i++;
    }

    return { statements, nextIndex: i };
  };

  const execStatements = (stmts: Statement[]): 'normal' | 'break' | 'continue' => {
    for (const stmt of stmts) {
      if (stmt.type === 'line') {
        if (stmt.text === 'break') return 'break';
        if (stmt.text === 'continue') return 'continue';
        processLine(stmt.text);
      } else if (stmt.type === 'if') {
        let branchToExec: Statement[] | null = null;
        for (const branch of stmt.branches) {
          if (branch.condition === null || evalCondition(branch.condition)) {
            branchToExec = branch.body;
            break;
          }
        }
        if (branchToExec) {
          const sig = execStatements(branchToExec);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'while') {
        let iterLimit = 10000;
        while (evalCondition(stmt.condition) && iterLimit-- > 0) {
          const sig = execStatements(stmt.body);
          if (sig === 'break') break;
          if (sig === 'continue') continue;
        }
      } else if (stmt.type === 'for') {
        const iterable = evaluateExpr(stmt.iterableExpr);
        const items = Array.isArray(iterable) ? iterable : [];
        for (const item of items) {
          scope[stmt.varName] = item;
          const sig = execStatements(stmt.body);
          if (sig === 'break') break;
          if (sig === 'continue') continue;
        }
      }
    }
    return 'normal';
  };

  try {
    const { statements } = parseBlockAt(0, 0);
    execStatements(statements);
  } catch (err) {
    if (err instanceof PythonInputRequiredException) {
      return {
        output: outputs.join('\n'),
        waitingForInput: true,
        inputPrompt: err.prompt,
      };
    }
    return {
      output: outputs.join('\n'),
      error: `Python error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return {
    output: outputs.join('\n'),
  };
}
