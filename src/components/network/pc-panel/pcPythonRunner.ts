// pcPythonRunner.ts
// A lightweight, safe Python script interpreter for PC CMD.

export interface PythonExecutionResult {
  output: string;
  error?: string;
  waitingForInput?: boolean;
  inputPrompt?: string;
}

import { PYTHON_MODULES } from './pcPythonModules';

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

  // A print expression using Python's `%` formatting is a single expression,
  // even when its format string contains spaces.
  if (trimmedRaw.includes('%') && (trimmedRaw.startsWith("'") || trimmedRaw.startsWith('"'))) {
    return { positional: [evalFn(trimmedRaw)], kwargs };
  }

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

    const isDelimiter = !inQuotes && parenDepth === 0 && (
      char === ',' || (trimmedRaw.indexOf(',') === -1 && /\s/.test(char))
    );

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
      const intMatch = /^(0)?(\d+)?d$/.exec(spec);
      if (intMatch) {
        const padZero = intMatch[1] === '0';
        const width = intMatch[2] ? parseInt(intMatch[2], 10) : 0;
        const intStr = String(Math.floor(val));
        return padZero && width > 0 ? intStr.padStart(width, '0') : intStr;
      }
    }

    return String(val);
  });
}

export class PyComplex {
  constructor(public real: number, public imag: number) { }

  add(other: unknown): PyComplex {
    const o = toPyComplex(other);
    return new PyComplex(this.real + o.real, this.imag + o.imag);
  }

  sub(other: unknown): PyComplex {
    const o = toPyComplex(other);
    return new PyComplex(this.real - o.real, this.imag - o.imag);
  }

  mul(other: unknown): PyComplex {
    const o = toPyComplex(other);
    return new PyComplex(
      this.real * o.real - this.imag * o.imag,
      this.real * o.imag + this.imag * o.real
    );
  }

  div(other: unknown): PyComplex {
    const o = toPyComplex(other);
    const denom = o.real * o.real + o.imag * o.imag;
    if (denom === 0) return new PyComplex(NaN, NaN);
    return new PyComplex(
      (this.real * o.real + this.imag * o.imag) / denom,
      (this.imag * o.real - this.real * o.imag) / denom
    );
  }

  toString(): string {
    const r = this.real;
    const i = this.imag;
    const sign = i >= 0 ? '+' : '-';
    const absI = Math.abs(i);
    return `(${r}${sign}${absI}j)`;
  }
}

export function toPyComplex(v: unknown): PyComplex {
  if (v instanceof PyComplex) return v;
  if (typeof v === 'number') return new PyComplex(v, 0);
  if (typeof v === 'string') {
    const match = /^\(?(-?\d+(?:\.\d+)?)\s*([+-])\s*(\d+(?:\.\d+)?)j\)?$/.exec(v.trim());
    if (match) {
      const r = parseFloat(match[1]);
      const sign = match[2] === '-' ? -1 : 1;
      const i = parseFloat(match[3]) * sign;
      return new PyComplex(r, i);
    }
  }
  return new PyComplex(Number(v || 0), 0);
}

function getPythonType(val: unknown): string {
  if (val === null || val === undefined) return "<class 'NoneType'>";
  if (val instanceof PyComplex) return "<class 'complex'>";
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
  if (val instanceof PyComplex) return val.toString();
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

export function isSingleStringLiteral(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length < 2) return false;
  const qChar = trimmed[0];
  if (qChar !== '"' && qChar !== "'") return false;
  if (trimmed[trimmed.length - 1] !== qChar) return false;

  let escaped = false;
  for (let i = 1; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === qChar) {
      return i === trimmed.length - 1;
    }
  }
  return false;
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

function isEnclosedInParens(str: string): boolean {
  if (!str.startsWith('(') || !str.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    if (depth === 0 && i < str.length - 1) {
      return false;
    }
  }
  return depth === 0;
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

export function pythonRange(...args: number[]): number[] {
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
  | { type: 'while'; condition: string; body: Statement[]; elseBody?: Statement[] }
  | { type: 'for'; varName: string; iterableExpr: string; body: Statement[]; elseBody?: Statement[] }
  | { type: 'def'; funcName: string; paramNames: string[]; paramDefaults: Record<string, string>; body: Statement[] }
  | { type: 'try'; body: Statement[]; exceptBranches: { errorType: string | null; varName: string | null; body: Statement[] }[]; elseBody?: Statement[]; finallyBody?: Statement[] };

interface ParsedLine {
  indent: number;
  text: string;
}

export function executePythonScript(code: string, inputs: string[] = []): PythonExecutionResult {
  return runPythonEngine(code, inputs, undefined, false) as PythonExecutionResult;
}

export async function executePythonScriptAsync(
  code: string,
  inputs: string[] = [],
  onOutput?: (chunk: string, replaceLastLine?: boolean) => void
): Promise<PythonExecutionResult> {
  return (await runPythonEngine(code, inputs, onOutput, true)) as PythonExecutionResult;
}

function runPythonEngine(
  code: string,
  inputs: string[] = [],
  onOutput?: (chunk: string, replaceLastLine?: boolean) => void,
  asyncMode = false
): PythonExecutionResult | Promise<PythonExecutionResult> {
  // Ignore Python triple-quoted documentation/comment blocks.
  const rawLines = code.replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, '').split('\n');
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
    divmod: (a: unknown, b: unknown) => {
      const n1 = Number(a || 0);
      const n2 = Number(b || 1);
      return [Math.floor(n1 / n2), n1 % n2];
    },
    range: (...args: unknown[]) => pythonRange(...args.map(a => Number(a))),
    bin: (v: unknown) => {
      const num = Math.floor(Number(v || 0));
      return num < 0 ? '-0b' + Math.abs(num).toString(2) : '0b' + num.toString(2);
    },
    oct: (v: unknown) => {
      const num = Math.floor(Number(v || 0));
      return num < 0 ? '-0o' + Math.abs(num).toString(8) : '0o' + num.toString(8);
    },
    hex: (v: unknown) => {
      const num = Math.floor(Number(v || 0));
      return num < 0 ? '-0x' + Math.abs(num).toString(16) : '0x' + num.toString(16);
    },
    ord: (v: unknown) => String(v || '').charCodeAt(0) || 0,
    chr: (v: unknown) => String.fromCharCode(Number(v || 0)),
    any: (v: unknown) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v)),
    all: (v: unknown) => (Array.isArray(v) ? v.every(Boolean) : Boolean(v)),
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

    // Handle Python string .join(...) method
    const joinIdx = trimmed.lastIndexOf('.join(');
    if (joinIdx !== -1 && trimmed.endsWith(')')) {
      const sepStrExpr = trimmed.slice(0, joinIdx).trim();
      const rawJoinArg = trimmed.slice(joinIdx + 6, -1).trim();
      const sepVal = evaluateExpr(sepStrExpr);
      const iterVal = evaluateExpr(rawJoinArg);
      if (typeof sepVal === 'string' && Array.isArray(iterVal)) {
        return iterVal.map(item => formatPythonValue(item)).join(sepVal);
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
      const num = Number(val);
      if (isNaN(num)) throw new Error(`ValueError: could not convert string to float: '${val}'`);
      return num;
    }

    // Handle int(...)
    const intMatch = /^int\s*\((.*)\)$/.exec(trimmed);
    if (intMatch) {
      const val = evaluateExpr(intMatch[1]);
      if (typeof val === 'boolean') return val ? 1 : 0;
      const num = Number(val);
      if (isNaN(num)) throw new Error(`ValueError: invalid literal for int() with base 10: '${val}'`);
      return Math.floor(num);
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

    // Basic list comprehension: [expression for name in iterable]
    const comprehensionMatch = /^\[\s*(.+?)\s+for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+?)\s*\]$/.exec(trimmed);
    if (comprehensionMatch) {
      const expression = comprehensionMatch[1];
      const variable = comprehensionMatch[2];
      const iterable = evaluateExpr(comprehensionMatch[3]);
      const items = Array.isArray(iterable)
        ? iterable
        : typeof iterable === 'string'
          ? iterable.split('')
          : [];
      const previous = scope[variable];
      const hadPrevious = Object.prototype.hasOwnProperty.call(scope, variable);
      const result = items.map(item => {
        scope[variable] = item;
        return evaluateExpr(expression);
      });
      if (hadPrevious) scope[variable] = previous;
      else delete scope[variable];
      return result;
    }

    // List literal: [value1, value2, ...]
    const listLiteralMatch = /^\[(.*)\]$/.exec(trimmed);
    if (listLiteralMatch) {
      const inner = listLiteralMatch[1].trim();
      if (!inner) return [];
      return splitOutsideQuotesAndParens(inner, ',')
        .filter(item => item.trim() !== '')
        .map(item => evaluateExpr(item));
    }

    // String join: separator.join(iterable)
    const joinMatch = /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\.join\s*\((.*)\)$/.exec(trimmed);
    if (joinMatch) {
      const separator = String(evaluateExpr(joinMatch[1]));
      const iterable = evaluateExpr(joinMatch[2]);
      if (Array.isArray(iterable) || typeof iterable === 'string') {
        return Array.from(iterable as string | unknown[]).map(String).join(separator);
      }
      return '';
    }

    // Handle abs(...)
    const absMatch = /^abs\s*\((.*)\)$/.exec(trimmed);
    if (absMatch) {
      const val = evaluateExpr(absMatch[1]);
      return Math.abs(Number(val || 0));
    }

    // Handle bin(...)
    const binMatch = /^bin\s*\((.*)\)$/.exec(trimmed);
    if (binMatch) {
      const num = Math.floor(Number(evaluateExpr(binMatch[1]) || 0));
      return num < 0 ? '-0b' + Math.abs(num).toString(2) : '0b' + num.toString(2);
    }

    // Handle oct(...)
    const octMatch = /^oct\s*\((.*)\)$/.exec(trimmed);
    if (octMatch) {
      const num = Math.floor(Number(evaluateExpr(octMatch[1]) || 0));
      return num < 0 ? '-0o' + Math.abs(num).toString(8) : '0o' + num.toString(8);
    }

    // Handle hex(...)
    const hexMatch = /^hex\s*\((.*)\)$/.exec(trimmed);
    if (hexMatch) {
      const num = Math.floor(Number(evaluateExpr(hexMatch[1]) || 0));
      return num < 0 ? '-0x' + Math.abs(num).toString(16) : '0x' + num.toString(16);
    }

    // Handle ord(...)
    const ordMatch = /^ord\s*\((.*)\)$/.exec(trimmed);
    if (ordMatch) {
      const str = String(evaluateExpr(ordMatch[1]) || '');
      return str.charCodeAt(0) || 0;
    }

    // Handle chr(...)
    const chrMatch = /^chr\s*\((.*)\)$/.exec(trimmed);
    if (chrMatch) {
      const code = Number(evaluateExpr(chrMatch[1]) || 0);
      return String.fromCharCode(code);
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

    // Handle divmod(...)
    const divmodMatch = /^divmod\s*\((.*)\)$/.exec(trimmed);
    if (divmodMatch) {
      const parts = splitOutsideQuotesAndParens(divmodMatch[1], ',').map(p => evaluateExpr(p));
      const n1 = Number(parts[0] || 0);
      const n2 = Number(parts[1] || 1);
      return [Math.floor(n1 / n2), n1 % n2];
    }

    // Handle set(...)
    const setMatch = /^set\s*\((.*)\)$/.exec(trimmed);
    if (setMatch) {
      const innerArg = setMatch[1].trim();
      if (!innerArg) return [];
      const val = evaluateExpr(innerArg);
      if (Array.isArray(val)) return Array.from(new Set(val));
      if (typeof val === 'string') return Array.from(new Set(val.split('')));
      if (val instanceof Set) return Array.from(val);
      return [val];
    }

    // Handle dict(...)
    const dictMatch = /^dict\s*\((.*)\)$/.exec(trimmed);
    if (dictMatch) {
      const innerArg = dictMatch[1].trim();
      if (!innerArg) return {};
      const val = evaluateExpr(innerArg);
      if (typeof val === 'object' && val !== null) return { ...val };
      return {};
    }

    // Handle tuple(...)
    const tupleMatch = /^tuple\s*\((.*)\)$/.exec(trimmed);
    if (tupleMatch) {
      const innerArg = tupleMatch[1].trim();
      if (!innerArg) return [];
      const val = evaluateExpr(innerArg);
      if (Array.isArray(val)) return [...val];
      return [val];
    }

    // Handle min(...)
    const minMatch = /^min\s*\((.*)\)$/.exec(trimmed);
    if (minMatch) {
      const parts = splitOutsideQuotesAndParens(minMatch[1], ',').map(p => evaluateExpr(p));
      const items = parts.length === 1 && Array.isArray(parts[0]) ? parts[0] : parts;
      const nums = items.map(i => Number(i));
      return Math.min(...nums);
    }

    // Handle max(...)
    const maxMatch = /^max\s*\((.*)\)$/.exec(trimmed);
    if (maxMatch) {
      const parts = splitOutsideQuotesAndParens(maxMatch[1], ',').map(p => evaluateExpr(p));
      const items = parts.length === 1 && Array.isArray(parts[0]) ? parts[0] : parts;
      const nums = items.map(i => Number(i));
      return Math.max(...nums);
    }

    // Handle sorted(...)
    const sortedMatch = /^sorted\s*\((.*)\)$/.exec(trimmed);
    if (sortedMatch) {
      const val = evaluateExpr(sortedMatch[1]);
      let arr: unknown[];
      if (Array.isArray(val)) {
        arr = [...val];
      } else if (typeof val === 'string') {
        arr = val.split('');
      } else {
        return val;
      }
      arr.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
      return arr;
    }

    // Handle list(...)
    const listMatch = /^list\s*\((.*)\)$/.exec(trimmed);
    if (listMatch) {
      const innerArg = listMatch[1].trim();
      if (!innerArg) return [];
      const val = evaluateExpr(innerArg);
      if (Array.isArray(val)) return [...val];
      if (val instanceof Set) return Array.from(val);
      if (typeof val === 'string') return val.split('');
      if (typeof val === 'object' && val !== null) return Object.values(val);
      return [val];
    }

    // Handle map(func, iterable)
    const mapMatch = /^map\s*\((.*)\)$/.exec(trimmed);
    if (mapMatch) {
      const parts = splitOutsideQuotesAndParens(mapMatch[1], ',');
      if (parts.length >= 2) {
        const fnVal = evaluateExpr(parts[0]);
        const iterVal = evaluateExpr(parts[1]);
        const items = Array.isArray(iterVal) ? iterVal : [];
        if (typeof fnVal === 'function') {
          return items.map(item => fnVal(item));
        }
      }
    }

    // Handle filter(func, iterable)
    const filterMatch = /^filter\s*\((.*)\)$/.exec(trimmed);
    if (filterMatch) {
      const parts = splitOutsideQuotesAndParens(filterMatch[1], ',');
      if (parts.length >= 2) {
        const fnVal = evaluateExpr(parts[0]);
        const iterVal = evaluateExpr(parts[1]);
        const items = Array.isArray(iterVal) ? iterVal : [];
        if (typeof fnVal === 'function') {
          return items.filter(item => Boolean(fnVal(item)));
        }
      }
    }

    // Handle lambda expression: lambda x, y: expr
    const lambdaMatch = /^lambda\s*([^:]*)\s*:\s*(.+)$/.exec(trimmed);
    if (lambdaMatch) {
      const paramNames = lambdaMatch[1].split(',').map(p => p.trim()).filter(Boolean);
      const bodyExpr = lambdaMatch[2].trim();
      return (...fnArgs: unknown[]) => {
        const savedValues: Record<string, unknown> = {};
        paramNames.forEach((p, idx) => {
          savedValues[p] = scope[p];
          scope[p] = fnArgs[idx];
        });
        const res = evaluateExpr(bodyExpr);
        paramNames.forEach(p => {
          if (savedValues[p] !== undefined) scope[p] = savedValues[p];
          else delete scope[p];
        });
        return res;
      };
    }

    // Element indexing / Chained indexing: targetExpr[idxExpr] (e.g. deck[i][0], matrix[r][c], arr[0])
    if (trimmed.endsWith(']') && !trimmed.startsWith('[')) {
      let bracketDepth = 0;
      let openIdx = -1;
      let inQuote: string | null = null;
      for (let i = trimmed.length - 1; i >= 0; i--) {
        const char = trimmed[i];
        if (inQuote) {
          if (char === inQuote && (i === 0 || trimmed[i - 1] !== '\\')) {
            inQuote = null;
          }
          continue;
        }
        if (char === '"' || char === "'") {
          inQuote = char;
          continue;
        }
        if (char === ']') {
          bracketDepth++;
        } else if (char === '[') {
          bracketDepth--;
          if (bracketDepth === 0) {
            openIdx = i;
            break;
          }
        }
      }
      if (openIdx > 0) {
        const targetExpr = trimmed.slice(0, openIdx).trim();
        const idxExpr = trimmed.slice(openIdx + 1, -1).trim();
        const targetVal = evaluateExpr(targetExpr);
        const idxVal = evaluateExpr(idxExpr);
        if (Array.isArray(targetVal) || typeof targetVal === 'string') {
          const idx = Number(idxVal);
          const realIdx = idx < 0 ? targetVal.length + idx : idx;
          return targetVal[realIdx];
        }
        if (typeof targetVal === 'object' && targetVal !== null) {
          return (targetVal as Record<string, unknown>)[String(idxVal)];
        }
      }
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
    if (isSingleStringLiteral(trimmed)) {
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

    // Member call: obj.method(...)
    const memberCallMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/.exec(trimmed);
    if (memberCallMatch) {
      const objName = memberCallMatch[1];
      const methodName = memberCallMatch[2];
      const rawArgs = memberCallMatch[3].trim();
      const obj: unknown = scope[objName];

      // Python string methods on JS string values
      if (typeof obj === 'string') {
        const sArgs = rawArgs ? splitOutsideQuotesAndParens(rawArgs, ',').map(a => evaluateExpr(a)) : [];
        switch (methodName) {
          case 'lower':
            return obj.toLowerCase();
          case 'upper':
            return obj.toUpperCase();
          case 'strip':
            return obj.trim();
          case 'lstrip':
            return obj.trimStart();
          case 'rstrip':
            return obj.trimEnd();
          case 'capitalize':
            return obj.charAt(0).toUpperCase() + obj.slice(1).toLowerCase();
          case 'title':
            return obj.replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          case 'replace':
            return obj.split(String(sArgs[0])).join(String(sArgs[1]));
          case 'split':
            return sArgs.length ? obj.split(String(sArgs[0])) : obj.split(/\s+/).filter(Boolean);
          case 'find':
            return obj.indexOf(String(sArgs[0]));
          case 'count': {
            const sub = String(sArgs[0]);
            return sub ? obj.split(sub).length - 1 : 0;
          }
          case 'startswith':
            return obj.startsWith(String(sArgs[0]));
          case 'endswith':
            return obj.endsWith(String(sArgs[0]));
          case 'isdigit':
            return /^\d+$/.test(obj);
          case 'isalpha':
            return /^[a-zA-ZçğıöşüÇĞİÖŞÜ]+$/.test(obj);
          case 'isupper':
            return obj === obj.toUpperCase() && /[A-ZÇĞİÖŞÜ]/.test(obj);
          case 'islower':
            return obj === obj.toLowerCase() && /[a-zçğıöşü]/.test(obj);
          case 'join':
            return Array.isArray(sArgs[0]) ? sArgs[0].map(String).join(obj) : String(sArgs[0]);
          default:
            break;
        }
      }

      const objectValue = obj as Record<string, unknown> | undefined;
      if (objectValue && typeof objectValue[methodName] === 'function') {
        const argList = rawArgs ? splitOutsideQuotesAndParens(rawArgs, ',').map(a => evaluateExpr(a)) : [];
        return (objectValue[methodName] as (...args: unknown[]) => unknown)(...argList);
      }
    }

    // Member property access: obj.prop or obj.sub.prop
    if (trimmed.includes('.') && !trimmed.includes('(')) {
      const parts = trimmed.split('.').map(p => p.trim());
      if (parts.every(p => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p))) {
        let curr: unknown = scope[parts[0]];
        for (let i = 1; i < parts.length; i++) {
          if (curr && typeof curr === 'object' && parts[i] in (curr as Record<string, unknown>)) {
            curr = (curr as Record<string, unknown>)[parts[i]];
          } else {
            curr = undefined;
            break;
          }
        }
        if (curr !== undefined) return curr;
      }
    }

    // Parenthesized expression or Tuple: (a, b, c) or (expr)
    if (isEnclosedInParens(trimmed)) {
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

    // Handle Logical Operators: or, and, not
    const orIdx = findOperatorIndex(trimmed, ' or ');
    if (orIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, orIdx));
      if (leftVal) return leftVal;
      return evaluateExpr(trimmed.slice(orIdx + 4));
    }

    const andIdx = findOperatorIndex(trimmed, ' and ');
    if (andIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, andIdx));
      if (!leftVal) return leftVal;
      return evaluateExpr(trimmed.slice(andIdx + 5));
    }

    if (trimmed.startsWith('not ') || trimmed.startsWith('not(')) {
      const targetExpr = trimmed.startsWith('not ') ? trimmed.slice(4) : trimmed.slice(3);
      return !evaluateExpr(targetExpr);
    }

    // Handle Comparison Operators: ==, !=, <=, >=, <, >, in, not in, is, is not
    const isNotIdx = findOperatorIndex(trimmed, ' is not ');
    if (isNotIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, isNotIdx));
      const rightVal = evaluateExpr(trimmed.slice(isNotIdx + 8));
      return leftVal !== rightVal;
    }

    const isIdx = findOperatorIndex(trimmed, ' is ');
    if (isIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, isIdx));
      const rightVal = evaluateExpr(trimmed.slice(isIdx + 4));
      return leftVal === rightVal;
    }

    const notInIdx = findOperatorIndex(trimmed, ' not in ');
    if (notInIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, notInIdx));
      const rightVal = evaluateExpr(trimmed.slice(notInIdx + 8));
      if (Array.isArray(rightVal)) return !rightVal.includes(leftVal);
      if (typeof rightVal === 'string') return !rightVal.includes(String(leftVal));
      return true;
    }

    const inIdx = findOperatorIndex(trimmed, ' in ');
    if (inIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, inIdx));
      const rightVal = evaluateExpr(trimmed.slice(inIdx + 4));
      if (Array.isArray(rightVal)) return rightVal.includes(leftVal);
      if (typeof rightVal === 'string') return rightVal.includes(String(leftVal));
      return false;
    }

    const eqEqIdx = findOperatorIndex(trimmed, '==');
    if (eqEqIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, eqEqIdx));
      const rightVal = evaluateExpr(trimmed.slice(eqEqIdx + 2));
      return leftVal === rightVal || formatPythonValue(leftVal) === formatPythonValue(rightVal);
    }

    const notEqIdx = findOperatorIndex(trimmed, '!=');
    if (notEqIdx !== -1) {
      const leftVal = evaluateExpr(trimmed.slice(0, notEqIdx));
      const rightVal = evaluateExpr(trimmed.slice(notEqIdx + 2));
      return leftVal !== rightVal && formatPythonValue(leftVal) !== formatPythonValue(rightVal);
    }

    const lteIdx = findOperatorIndex(trimmed, '<=');
    if (lteIdx !== -1) {
      const leftVal = Number(evaluateExpr(trimmed.slice(0, lteIdx)));
      const rightVal = Number(evaluateExpr(trimmed.slice(lteIdx + 2)));
      return leftVal <= rightVal;
    }

    const gteIdx = findOperatorIndex(trimmed, '>=');
    if (gteIdx !== -1) {
      const leftVal = Number(evaluateExpr(trimmed.slice(0, gteIdx)));
      const rightVal = Number(evaluateExpr(trimmed.slice(gteIdx + 2)));
      return leftVal >= rightVal;
    }

    const ltIdx = findOperatorIndex(trimmed, '<');
    if (ltIdx !== -1 && trimmed[ltIdx + 1] !== '=' && trimmed[ltIdx + 1] !== '<') {
      const leftVal = Number(evaluateExpr(trimmed.slice(0, ltIdx)));
      const rightVal = Number(evaluateExpr(trimmed.slice(ltIdx + 1)));
      return leftVal < rightVal;
    }

    const gtIdx = findOperatorIndex(trimmed, '>');
    if (gtIdx !== -1 && trimmed[gtIdx + 1] !== '=' && trimmed[gtIdx + 1] !== '>') {
      const leftVal = Number(evaluateExpr(trimmed.slice(0, gtIdx)));
      const rightVal = Number(evaluateExpr(trimmed.slice(gtIdx + 1)));
      return leftVal > rightVal;
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

    // Floor division //
    const floorDivIdx = findOperatorIndex(trimmed, '//');
    if (floorDivIdx !== -1) {
      const leftExpr = trimmed.slice(0, floorDivIdx).trim();
      const rightExpr = trimmed.slice(floorDivIdx + 2).trim();
      const leftVal = Number(evaluateExpr(leftExpr));
      const rightVal = Number(evaluateExpr(rightExpr));
      return Math.floor(leftVal / rightVal);
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
      if (parts.some(p => p instanceof PyComplex)) {
        return parts.reduce((acc: unknown, val: unknown) => toPyComplex(acc).add(val), new PyComplex(0, 0));
      }
      return parts.reduce((acc: number, val: unknown) => acc + Number(val || 0), 0);
    }

    const subParts = splitOutsideQuotesAndParens(trimmed, '-');
    if (subParts.length > 1) {
      if (subParts[0] === '') {
        const realParts = subParts.slice(1).map(p => evaluateExpr(p));
        if (realParts.length > 0) {
          const first = realParts[0];
          const negatedFirst = first instanceof PyComplex
            ? new PyComplex(-first.real, -first.imag)
            : typeof first === 'number'
              ? -first
              : toPyComplex(first).mul(-1);

          if (realParts.length === 1) {
            return negatedFirst;
          }
          if (realParts.some(p => p instanceof PyComplex) || negatedFirst instanceof PyComplex) {
            return realParts.slice(1).reduce((acc: unknown, val: unknown) => toPyComplex(acc).sub(val), negatedFirst);
          }
          return realParts.slice(1).reduce((acc: number, val: unknown) => acc - Number(val || 0), Number(negatedFirst));
        }
      } else {
        const parts = subParts.map(p => evaluateExpr(p));
        if (parts.some(p => p instanceof PyComplex)) {
          return parts.reduce((acc: unknown, val: unknown, idx: number) => (idx === 0 ? toPyComplex(val) : toPyComplex(acc).sub(val)), new PyComplex(0, 0));
        }
        return parts.reduce((acc: number, val: unknown, idx: number) => (idx === 0 ? Number(val) : acc - Number(val)), 0);
      }
    }

    const mulParts = splitOutsideQuotesAndParens(trimmed, '*');
    if (mulParts.length > 1 && !trimmed.includes('**')) {
      const parts = mulParts.map(p => evaluateExpr(p));
      if (parts.some(p => p instanceof PyComplex)) {
        return parts.reduce((acc: unknown, val: unknown) => toPyComplex(acc).mul(val), new PyComplex(1, 0));
      }
      return parts.reduce((acc: number, val: unknown) => acc * Number(val || 1), 1);
    }

    const divParts = splitOutsideQuotesAndParens(trimmed, '/');
    if (divParts.length > 1) {
      const parts = divParts.map(p => evaluateExpr(p));
      if (parts.some(p => p instanceof PyComplex)) {
        return parts.reduce((acc: unknown, val: unknown, idx: number) => (idx === 0 ? toPyComplex(val) : toPyComplex(acc).div(val)), new PyComplex(1, 0));
      }
      return parts.reduce((acc: number, val: unknown, idx: number) => (idx === 0 ? Number(val) : acc / Number(val)), 0);
    }

    // User-defined function call.
    const functionCallMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/.exec(trimmed);
    if (functionCallMatch) {
      const fn = scope[functionCallMatch[1]];
      if (typeof fn === 'function') {
        const args = functionCallMatch[2].trim()
          ? splitOutsideQuotesAndParens(functionCallMatch[2], ',').map(arg => evaluateExpr(arg))
          : [];
        return fn(...args);
      }
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

  const processLine = async (line: string): Promise<void> => {
    const trimmed = stripInlineComment(line).trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Handle time.sleep(...)
    const sleepMatch = /^time\.sleep\s*\((.*)\)$/.exec(trimmed);
    if (sleepMatch) {
      const secVal = Number(evaluateExpr(sleepMatch[1]) || 0);
      if (asyncMode && secVal > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(secVal, 10) * 1000));
      }
      return;
    }

    // Handle import statements: import random, math as m
    const importMatch = /^import\s+(.+)$/.exec(trimmed);
    if (importMatch) {
      const rawMods = splitOutsideQuotesAndParens(importMatch[1], ',');
      for (const item of rawMods) {
        const parts = item.split(/\s+as\s+/i);
        const modName = parts[0].trim();
        const alias = parts[1] ? parts[1].trim() : modName;
        if (PYTHON_MODULES[modName]) {
          scope[alias] = PYTHON_MODULES[modName];
        } else {
          scope[alias] = {};
        }
      }
      return;
    }

    // Handle from ... import ...
    const fromImportMatch = /^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/.exec(trimmed);
    if (fromImportMatch) {
      const modName = fromImportMatch[1].trim();
      const rawItems = splitOutsideQuotesAndParens(fromImportMatch[2], ',');
      const modObj = PYTHON_MODULES[modName] as Record<string, unknown> | undefined;
      for (const item of rawItems) {
        const parts = item.split(/\s+as\s+/i);
        const itemName = parts[0].trim();
        const alias = parts[1] ? parts[1].trim() : itemName;
        if (modObj && modObj[itemName] !== undefined) {
          scope[alias] = modObj[itemName];
        }
      }
      return;
    }

    // Handle print(...)
    const printMatch = /^print\s*\((.*)\)$/.exec(trimmed);
    if (printMatch) {
      const rawArgs = printMatch[1];
      if (!rawArgs.trim()) {
        outputs.push('');
        return;
      }

      const { positional, kwargs } = parseFormatArgs(rawArgs, evaluateExpr);
      if (
        positional.length === 1 &&
        positional[0] === undefined &&
        /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*\)$/.test(rawArgs.trim())
      ) {
        return;
      }
      const endArg = kwargs['end'] !== undefined ? String(kwargs['end']) : '\n';
      const sepArg = kwargs['sep'] !== undefined ? String(kwargs['sep']) : ' ';

      const formattedArgs = positional.map(a => formatPythonValue(a));
      const lineStr = formattedArgs.join(sepArg);

      if (endArg === '\r') {
        if (outputs.length > 0) {
          outputs[outputs.length - 1] = lineStr;
        } else {
          outputs.push(lineStr);
        }
        onOutput?.(lineStr, true);
      } else if (endArg === '' || endArg === ' ') {
        if (outputs.length > 0) {
          outputs[outputs.length - 1] += endArg + lineStr;
        } else {
          outputs.push(lineStr);
        }
        onOutput?.(lineStr, true);
      } else {
        outputs.push(lineStr);
        onOutput?.(lineStr, false);
      }
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

    // Handle augmented assignments (+=, -=, *=, /=, %=, //=, **=)
    const indexedSwapMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.+)\]\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.+)\]\s*=\s*(.+)$/.exec(trimmed);
    if (indexedSwapMatch) {
      const [, firstName, firstIndexExpr, secondName, secondIndexExpr, rhsExpr] = indexedSwapMatch;
      const firstList = scope[firstName];
      const secondList = scope[secondName];
      if (Array.isArray(firstList) && Array.isArray(secondList)) {
        const firstIndex = Number(evaluateExpr(firstIndexExpr));
        const secondIndex = Number(evaluateExpr(secondIndexExpr));
        const rhs = evaluateExpr(rhsExpr);
        const rhsValues = Array.isArray(rhs)
          ? rhs
          : splitOutsideQuotesAndParens(rhsExpr, ',').map(item => evaluateExpr(item));
        if (rhsValues.length >= 2) {
          firstList[firstIndex] = rhsValues[0];
          secondList[secondIndex] = rhsValues[1];
        }
      }
      return;
    }

    const augMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\/\/=|\*\*=|[-+/*%]=)\s*(.+)$/.exec(trimmed);
    if (augMatch) {
      const varName = augMatch[1];
      const op = augMatch[2];
      const rhsStr = augMatch[3];
      if (op === '//=') {
        const lNum = Number(evaluateExpr(varName) || 0);
        const rNum = Number(evaluateExpr(rhsStr) || 1);
        scope[varName] = Math.floor(lNum / rNum);
      } else if (op === '**=') {
        const lNum = Number(evaluateExpr(varName) || 0);
        const rNum = Number(evaluateExpr(rhsStr) || 1);
        scope[varName] = Math.pow(lNum, rNum);
      } else {
        const singleOp = op[0];
        scope[varName] = evaluateExpr(`${varName} ${singleOp} (${rhsStr})`);
      }
      return;
    }

    // Handle variable assignments (including tuple unpacking like x, y = y, x)
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
      const res = evaluateExpr(condStr);
      if (res === 'False' || res === 'false' || res === '0' || res === 0 || res === false || res === null || res === undefined) {
        return false;
      }
      return Boolean(res);
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
      const ifMatch = /^if(?:\s+|(?=\())(.+):\s*$/.exec(line.text);
      if (ifMatch) {
        const branches: { condition: string | null; body: Statement[] }[] = [];
        const cond = ifMatch[1];
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        branches.push({ condition: cond, body: bodyRes.statements });
        i = bodyRes.nextIndex;

        while (i < parsedLines.length && parsedLines[i].indent === line.indent) {
          const elifMatch = /^elif(?:\s+|(?=\())(.+):\s*$/.exec(parsedLines[i].text);
          const elseMatch = /^else:\s*$/.exec(parsedLines[i].text);

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
      const whileMatch = /^while(?:\s+|(?=\())(.+):\s*$/.exec(line.text);
      if (whileMatch) {
        const cond = whileMatch[1];
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        let nextI = bodyRes.nextIndex;
        let elseBody: Statement[] | undefined = undefined;

        if (nextI < parsedLines.length && parsedLines[nextI].indent === line.indent) {
          const elseMatch = /^else:\s*$/.exec(parsedLines[nextI].text);
          if (elseMatch) {
            const elseRes = parseBlockAt(nextI + 1, line.indent + 1);
            elseBody = elseRes.statements;
            nextI = elseRes.nextIndex;
          }
        }

        statements.push({ type: 'while', condition: cond, body: bodyRes.statements, elseBody });
        i = nextI;
        continue;
      }

      // Handle for loop (supports single and tuple-unpacked targets: for a, b in items:)
      const forMatch = /^for(?:\s+|(?=\())(.+?)\s+in\s+(.+):\s*$/.exec(line.text);
      if (forMatch) {
        const varName = forMatch[1];
        const iterableExpr = forMatch[2];
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        let nextI = bodyRes.nextIndex;
        let elseBody: Statement[] | undefined = undefined;

        if (nextI < parsedLines.length && parsedLines[nextI].indent === line.indent) {
          const elseMatch = /^else:\s*$/.exec(parsedLines[nextI].text);
          if (elseMatch) {
            const elseRes = parseBlockAt(nextI + 1, line.indent + 1);
            elseBody = elseRes.statements;
            nextI = elseRes.nextIndex;
          }
        }

        statements.push({ type: 'for', varName, iterableExpr, body: bodyRes.statements, elseBody });
        i = nextI;
        continue;
      }

      // Handle def function definition
      const defMatch = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\):\s*$/.exec(line.text);
      if (defMatch) {
        const funcName = defMatch[1];
        const paramsStr = defMatch[2].trim();
        const paramNames: string[] = [];
        const paramDefaults: Record<string, string> = {};
        if (paramsStr) {
          const params = splitOutsideQuotesAndParens(paramsStr, ',');
          for (const p of params) {
            const eqIdx = p.indexOf('=');
            const name = (eqIdx >= 0 ? p.slice(0, eqIdx) : p).trim();
            paramNames.push(name);
            if (eqIdx >= 0) {
              paramDefaults[name] = p.slice(eqIdx + 1).trim();
            }
          }
        }
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        statements.push({ type: 'def', funcName, paramNames, paramDefaults, body: bodyRes.statements });
        i = bodyRes.nextIndex;
        continue;
      }

      // Handle try / except / else / finally
      const tryMatch = /^try:\s*$/.exec(line.text);
      if (tryMatch) {
        const bodyRes = parseBlockAt(i + 1, line.indent + 1);
        const exceptBranches: { errorType: string | null; varName: string | null; body: Statement[] }[] = [];
        let nextI = bodyRes.nextIndex;
        let elseBody: Statement[] | undefined = undefined;
        let finallyBody: Statement[] | undefined = undefined;

        while (nextI < parsedLines.length && parsedLines[nextI].indent === line.indent) {
          const exceptMatch = /^except(?:\s+([a-zA-Z0-9_.]+)(?:\s+as\s+([a-zA-Z0-9_]+))?)?\s*:\s*$/.exec(parsedLines[nextI].text);
          const elseMatch = /^else:\s*$/.exec(parsedLines[nextI].text);
          const finallyMatch = /^finally:\s*$/.exec(parsedLines[nextI].text);

          if (exceptMatch) {
            const exBodyRes = parseBlockAt(nextI + 1, line.indent + 1);
            exceptBranches.push({
              errorType: exceptMatch[1] || null,
              varName: exceptMatch[2] || null,
              body: exBodyRes.statements,
            });
            nextI = exBodyRes.nextIndex;
          } else if (elseMatch) {
            const elseRes = parseBlockAt(nextI + 1, line.indent + 1);
            elseBody = elseRes.statements;
            nextI = elseRes.nextIndex;
          } else if (finallyMatch) {
            const finRes = parseBlockAt(nextI + 1, line.indent + 1);
            finallyBody = finRes.statements;
            nextI = finRes.nextIndex;
          } else {
            break;
          }
        }

        statements.push({ type: 'try', body: bodyRes.statements, exceptBranches, elseBody, finallyBody });
        i = nextI;
        continue;
      }

      // Simple line statement
      statements.push({ type: 'line', text: line.text });
      i++;
    }

    return { statements, nextIndex: i };
  };

  type ExecResult = 'normal' | 'break' | 'continue' | { type: 'return'; value: unknown };

  const execStatementsSync = (stmts: Statement[]): ExecResult => {
    for (const stmt of stmts) {
      if (stmt.type === 'line') {
        if (stmt.text === 'break') return 'break';
        if (stmt.text === 'continue') return 'continue';
        const returnMatch = /^return(?:\s+(.+))?$/.exec(stmt.text);
        if (returnMatch) {
          const retExpr = returnMatch[1];
          const retVal = retExpr ? evaluateExpr(retExpr) : undefined;
          return { type: 'return', value: retVal };
        }
        processLineSync(stmt.text);
      } else if (stmt.type === 'def') {
        const { funcName, paramNames, paramDefaults, body } = stmt;
        scope[funcName] = (...fnArgs: unknown[]) => {
          const savedScope = { ...scope };
          paramNames.forEach((p, idx) => {
            if (idx < fnArgs.length && fnArgs[idx] !== undefined) {
              scope[p] = fnArgs[idx];
            } else if (p in paramDefaults) {
              scope[p] = evaluateExpr(paramDefaults[p]);
            } else {
              scope[p] = undefined;
            }
          });
          const sig = execStatementsSync(body);
          Object.keys(scope).forEach(key => delete scope[key]);
          Object.assign(scope, savedScope);
          if (typeof sig === 'object' && sig !== null && sig.type === 'return') {
            return sig.value;
          }
          return undefined;
        };
      } else if (stmt.type === 'if') {
        let branchToExec: Statement[] | null = null;
        for (const branch of stmt.branches) {
          if (branch.condition === null || evalCondition(branch.condition)) {
            branchToExec = branch.body;
            break;
          }
        }
        if (branchToExec) {
          const sig = execStatementsSync(branchToExec);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'while') {
        let iterLimit = 10000;
        let brokeOut = false;
        while (evalCondition(stmt.condition) && iterLimit-- > 0) {
          const sig = execStatementsSync(stmt.body);
          if (sig === 'break') {
            brokeOut = true;
            break;
          }
          if (sig === 'continue') continue;
          if (typeof sig === 'object' && sig !== null && sig.type === 'return') {
            return sig;
          }
        }
        if (!brokeOut && stmt.elseBody) {
          const sig = execStatementsSync(stmt.elseBody);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'for') {
        const iterable = evaluateExpr(stmt.iterableExpr);
        let items: unknown[] = [];
        if (Array.isArray(iterable)) {
          items = iterable;
        } else if (typeof iterable === 'string') {
          items = iterable.split('');
        } else if (iterable instanceof Set) {
          items = Array.from(iterable);
        } else if (typeof iterable === 'object' && iterable !== null) {
          items = Object.keys(iterable);
        }
        let brokeOut = false;
        for (const item of items) {
          const targets = stmt.varName.split(',').map(t => t.trim());
          if (targets.length > 1 && Array.isArray(item)) {
            targets.forEach((t, idx) => { scope[t] = item[idx]; });
          } else {
            scope[stmt.varName] = item;
          }
          const sig = execStatementsSync(stmt.body);
          if (sig === 'break') {
            brokeOut = true;
            break;
          }
          if (sig === 'continue') continue;
          if (typeof sig === 'object' && sig !== null && sig.type === 'return') {
            return sig;
          }
        }
        if (!brokeOut && stmt.elseBody) {
          const sig = execStatementsSync(stmt.elseBody);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'try') {
        let brokeOrReturn: ExecResult = 'normal';
        try {
          const sig = execStatementsSync(stmt.body);
          if (sig !== 'normal') {
            brokeOrReturn = sig;
          } else if (stmt.elseBody) {
            const elseSig = execStatementsSync(stmt.elseBody);
            if (elseSig !== 'normal') brokeOrReturn = elseSig;
          }
        } catch (err) {
          if (err instanceof PythonInputRequiredException) throw err;
          if (stmt.exceptBranches && stmt.exceptBranches.length > 0) {
            for (const ex of stmt.exceptBranches) {
              if (ex.varName && err instanceof Error) {
                scope[ex.varName] = err.message;
              }
              const exSig = execStatementsSync(ex.body);
              if (exSig !== 'normal') brokeOrReturn = exSig;
              break;
            }
          }
        } finally {
          if (stmt.finallyBody) {
            const finSig = execStatementsSync(stmt.finallyBody);
            if (finSig !== 'normal') brokeOrReturn = finSig;
          }
        }
        if (brokeOrReturn !== 'normal') return brokeOrReturn;
      }
    }
    return 'normal';
  };

  const processLineSync = (line: string): void => {
    const trimmed = stripInlineComment(line).trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Handle time.sleep(...)
    const sleepMatch = /^time\.sleep\s*\((.*)\)$/.exec(trimmed);
    if (sleepMatch) return;

    // Handle import statements: import random, math as m
    const importMatch = /^import\s+(.+)$/.exec(trimmed);
    if (importMatch) {
      const rawMods = splitOutsideQuotesAndParens(importMatch[1], ',');
      for (const item of rawMods) {
        const parts = item.split(/\s+as\s+/i);
        const modName = parts[0].trim();
        const alias = parts[1] ? parts[1].trim() : modName;
        if (PYTHON_MODULES[modName]) {
          scope[alias] = PYTHON_MODULES[modName];
        } else {
          scope[alias] = {};
        }
      }
      return;
    }

    // Handle from ... import ...
    const fromImportMatch = /^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/.exec(trimmed);
    if (fromImportMatch) {
      const modName = fromImportMatch[1].trim();
      const rawItems = splitOutsideQuotesAndParens(fromImportMatch[2], ',');
      const modObj = PYTHON_MODULES[modName] as Record<string, unknown> | undefined;
      for (const item of rawItems) {
        const parts = item.split(/\s+as\s+/i);
        const itemName = parts[0].trim();
        const alias = parts[1] ? parts[1].trim() : itemName;
        if (modObj && modObj[itemName] !== undefined) {
          scope[alias] = modObj[itemName];
        }
      }
      return;
    }

    // Handle print(...)
    const printMatch = /^print\s*\((.*)\)$/.exec(trimmed);
    if (printMatch) {
      const rawArgs = printMatch[1];
      if (!rawArgs.trim()) {
        outputs.push('');
        return;
      }

      const { positional, kwargs } = parseFormatArgs(rawArgs, evaluateExpr);
      if (
        positional.length === 1 &&
        positional[0] === undefined &&
        /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*\)$/.test(rawArgs.trim())
      ) {
        return;
      }
      const endArg = kwargs['end'] !== undefined ? String(kwargs['end']) : '\n';
      const sepArg = kwargs['sep'] !== undefined ? String(kwargs['sep']) : ' ';

      const formattedArgs = positional.map(a => formatPythonValue(a));
      const lineStr = formattedArgs.join(sepArg);

      if (endArg === '\r') {
        if (outputs.length > 0) {
          outputs[outputs.length - 1] = lineStr;
        } else {
          outputs.push(lineStr);
        }
        onOutput?.(lineStr, true);
      } else if (endArg === '' || endArg === ' ') {
        if (outputs.length > 0) {
          outputs[outputs.length - 1] += endArg + lineStr;
        } else {
          outputs.push(lineStr);
        }
        onOutput?.(lineStr, true);
      } else {
        outputs.push(lineStr);
        onOutput?.(lineStr, false);
      }
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

    // Handle indexed swap: a[x], b[y] = c[z], d[w]
    const indexedSwapSyncMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.+)\]\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\[(.+)\]\s*=\s*(.+)$/.exec(trimmed);
    if (indexedSwapSyncMatch) {
      const [, firstName, firstIndexExpr, secondName, secondIndexExpr, rhsExpr] = indexedSwapSyncMatch;
      const firstList = scope[firstName];
      const secondList = scope[secondName];
      if (Array.isArray(firstList) && Array.isArray(secondList)) {
        const firstIndex = Number(evaluateExpr(firstIndexExpr));
        const secondIndex = Number(evaluateExpr(secondIndexExpr));
        const rhs = evaluateExpr(rhsExpr);
        const rhsValues = Array.isArray(rhs)
          ? rhs
          : splitOutsideQuotesAndParens(rhsExpr, ',').map(item => evaluateExpr(item));
        if (rhsValues.length >= 2) {
          firstList[firstIndex] = rhsValues[0];
          secondList[secondIndex] = rhsValues[1];
        }
      }
      return;
    }

    // Handle augmented assignments (+=, -=, *=, /=, %=, //=, **=)
    const augMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\/\/=|\*\*=|[-+/*%]=)\s*(.+)$/.exec(trimmed);
    if (augMatch) {
      const varName = augMatch[1];
      const op = augMatch[2];
      const rhsStr = augMatch[3];
      if (op === '//=') {
        const lNum = Number(evaluateExpr(varName) || 0);
        const rNum = Number(evaluateExpr(rhsStr) || 1);
        scope[varName] = Math.floor(lNum / rNum);
      } else if (op === '**=') {
        const lNum = Number(evaluateExpr(varName) || 0);
        const rNum = Number(evaluateExpr(rhsStr) || 1);
        scope[varName] = Math.pow(lNum, rNum);
      } else {
        const singleOp = op[0];
        scope[varName] = evaluateExpr(`${varName} ${singleOp} (${rhsStr})`);
      }
      return;
    }

    // Handle variable assignments (including tuple unpacking like x, y = y, x)
    const eqIdx = findOperatorIndex(trimmed, '=');
    if (eqIdx !== -1) {
      const prevChar = trimmed[eqIdx - 1];
      const nextChar = trimmed[eqIdx + 1];
      if (prevChar !== '=' && prevChar !== '!' && prevChar !== '<' && prevChar !== '>' && nextChar !== '=') {
        const leftSide = trimmed.slice(0, eqIdx).trim();
        const rightSide = trimmed.slice(eqIdx + 1).trim();

        const targets = splitOutsideQuotesAndParens(leftSide, ',').map(t => t.trim());
        if (targets.every(t => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t))) {
          if (targets.length === 1) {
            scope[targets[0]] = evaluateExpr(rightSide);
          } else {
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

    // Fallback for simple standalone expression
    try {
      evaluateExpr(trimmed);
    } catch {
      // ignore
    }
  };

  const execStatements = async (stmts: Statement[]): Promise<ExecResult> => {
    for (const stmt of stmts) {
      if (stmt.type === 'line') {
        if (stmt.text === 'break') return 'break';
        if (stmt.text === 'continue') return 'continue';
        const returnMatch = /^return(?:\s+(.+))?$/.exec(stmt.text);
        if (returnMatch) {
          const retExpr = returnMatch[1];
          const retVal = retExpr ? evaluateExpr(retExpr) : undefined;
          return { type: 'return', value: retVal };
        }
        await processLine(stmt.text);
      } else if (stmt.type === 'def') {
        const { funcName, paramNames, paramDefaults, body } = stmt;
        // User-defined functions run synchronously (this Python dialect has no
        // async/await). This keeps recursion and returned values correct in async mode.
        scope[funcName] = (...fnArgs: unknown[]) => {
          const savedScope = { ...scope };
          paramNames.forEach((p, idx) => {
            if (idx < fnArgs.length && fnArgs[idx] !== undefined) {
              scope[p] = fnArgs[idx];
            } else if (p in paramDefaults) {
              scope[p] = evaluateExpr(paramDefaults[p]);
            } else {
              scope[p] = undefined;
            }
          });

          const sig = execStatementsSync(body);

          Object.keys(scope).forEach(key => delete scope[key]);
          Object.assign(scope, savedScope);

          if (typeof sig === 'object' && sig !== null && sig.type === 'return') {
            return sig.value;
          }
          return undefined;
        };
      } else if (stmt.type === 'if') {
        let branchToExec: Statement[] | null = null;
        for (const branch of stmt.branches) {
          if (branch.condition === null || evalCondition(branch.condition)) {
            branchToExec = branch.body;
            break;
          }
        }
        if (branchToExec) {
          const sig = await execStatements(branchToExec);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'while') {
        let iterLimit = 10000;
        let brokeOut = false;
        while (evalCondition(stmt.condition) && iterLimit-- > 0) {
          const sig = await execStatements(stmt.body);
          if (sig === 'break') {
            brokeOut = true;
            break;
          }
          if (sig === 'continue') continue;
          if (typeof sig === 'object' && sig !== null && sig.type === 'return') {
            return sig;
          }
        }
        if (!brokeOut && stmt.elseBody) {
          const sig = await execStatements(stmt.elseBody);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'for') {
        const iterable = evaluateExpr(stmt.iterableExpr);
        let items: unknown[] = [];
        if (Array.isArray(iterable)) {
          items = iterable;
        } else if (typeof iterable === 'string') {
          items = iterable.split('');
        } else if (iterable instanceof Set) {
          items = Array.from(iterable);
        } else if (typeof iterable === 'object' && iterable !== null) {
          items = Object.keys(iterable);
        }
        let brokeOut = false;
        for (const item of items) {
          const targets = stmt.varName.split(',').map(t => t.trim());
          if (targets.length > 1 && Array.isArray(item)) {
            targets.forEach((t, idx) => { scope[t] = item[idx]; });
          } else {
            scope[stmt.varName] = item;
          }
          const sig = await execStatements(stmt.body);
          if (sig === 'break') {
            brokeOut = true;
            break;
          }
          if (sig === 'continue') continue;
          if (typeof sig === 'object' && sig !== null && sig.type === 'return') {
            return sig;
          }
        }
        if (!brokeOut && stmt.elseBody) {
          const sig = await execStatements(stmt.elseBody);
          if (sig !== 'normal') return sig;
        }
      } else if (stmt.type === 'try') {
        let brokeOrReturn: ExecResult = 'normal';
        try {
          const sig = await execStatements(stmt.body);
          if (sig !== 'normal') {
            brokeOrReturn = sig;
          } else if (stmt.elseBody) {
            const elseSig = await execStatements(stmt.elseBody);
            if (elseSig !== 'normal') brokeOrReturn = elseSig;
          }
        } catch (err) {
          if (err instanceof PythonInputRequiredException) throw err;
          if (stmt.exceptBranches && stmt.exceptBranches.length > 0) {
            for (const ex of stmt.exceptBranches) {
              if (ex.varName && err instanceof Error) {
                scope[ex.varName] = err.message;
              }
              const exSig = await execStatements(ex.body);
              if (exSig !== 'normal') brokeOrReturn = exSig;
              break;
            }
          }
        } finally {
          if (stmt.finallyBody) {
            const finSig = await execStatements(stmt.finallyBody);
            if (finSig !== 'normal') brokeOrReturn = finSig;
          }
        }
        if (brokeOrReturn !== 'normal') return brokeOrReturn;
      }
    }
    return 'normal';
  };

  if (asyncMode) {
    return (async () => {
      try {
        const { statements } = parseBlockAt(0, 0);
        await execStatements(statements);
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
    })();
  } else {
    try {
      const { statements } = parseBlockAt(0, 0);
      execStatementsSync(statements);
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
}
