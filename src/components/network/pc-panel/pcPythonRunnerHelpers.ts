export class PythonInputRequiredException {
  constructor(public prompt: string) {}
}

export class PyComplex {
  constructor(public real: number, public imag: number) {}

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

export function getPythonType(val: unknown): string {
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
  if (val instanceof Set) {
    const items = Array.from(val).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return formatPythonValue(a).localeCompare(formatPythonValue(b));
    });
    return `{${items.map(item => formatPythonValue(item)).join(', ')}}`;
  }
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

export function stripInlineComment(line: string): string {
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

export function findOperatorIndex(str: string, op: string): number {
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

export function isEnclosedInParens(str: string): boolean {
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

export function splitOutsideQuotesAndParens(str: string, op: string): string[] {
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

export function formatPrintfString(template: string, args: unknown[]): string {
  let argIndex = 0;
  return template.replace(/%([-+0 #]*)(\d+)?(?:\.(\d+))?([sdiXxfgeEG%])/g, (_match, _flags, _widthStr, precStr, type) => {
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
      return num.toFixed(prec);
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

export function parseFormatArgs(
  rawArgs: string,
  evalFn: (expr: string) => unknown
): { positional: unknown[]; kwargs: Record<string, unknown> } {
  const positional: unknown[] = [];
  const kwargs: Record<string, unknown> = {};

  const trimmedRaw = rawArgs.trim();
  if (!trimmedRaw) {
    return { positional, kwargs };
  }

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

export function formatStringTemplate(
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

export function assignValueToLhs(
  leftSide: string,
  rhsVal: unknown,
  scope: Record<string, unknown>,
  evaluateExpr: (expr: string) => unknown
): boolean {
  const targets = splitOutsideQuotesAndParens(leftSide, ',').map(t => t.trim());
  if (targets.every(t => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t))) {
    if (targets.length === 1) {
      scope[targets[0]] = rhsVal;
    } else {
      const rawRhsParts = Array.isArray(rhsVal) ? (rhsVal as unknown[]) : [rhsVal];
      for (let i = 0; i < targets.length; i++) {
        scope[targets[i]] = rawRhsParts[i];
      }
    }
    return true;
  } else if (leftSide.endsWith(']')) {
    const indexMatches: string[] = [];
    let varName = '';
    let k = 0;
    while (k < leftSide.length && leftSide[k] !== '[') {
      varName += leftSide[k];
      k++;
    }
    varName = varName.trim();

    if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
      while (k < leftSide.length) {
        if (leftSide[k] === '[') {
          let depth = 1;
          let j = k + 1;
          while (j < leftSide.length && depth > 0) {
            if (leftSide[j] === '[') depth++;
            else if (leftSide[j] === ']') depth--;
            j++;
          }
          const idxExpr = leftSide.slice(k + 1, j - 1).trim();
          indexMatches.push(idxExpr);
          k = j;
        } else {
          k++;
        }
      }

      if (indexMatches.length > 0) {
        const evaluatedIndices = indexMatches.map(idxStr => evaluateExpr(idxStr));
        let current: any = scope[varName];
        if (current !== undefined) {
          for (let m = 0; m < evaluatedIndices.length - 1; m++) {
            const idxKey = evaluatedIndices[m];
            if (current === null || typeof current !== 'object') break;
            current = current[idxKey as any];
          }
          if (current !== null && typeof current === 'object') {
            const lastKey = evaluatedIndices[evaluatedIndices.length - 1];
            current[lastKey as any] = rhsVal;
            return true;
          }
        }
      }
    }
  }
  return false;
}
