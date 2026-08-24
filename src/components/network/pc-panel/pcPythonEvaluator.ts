import {
  PyComplex,
  toPyComplex,
  getPythonType,
  formatPythonValue,
  isSingleStringLiteral,
  findOperatorIndex,
  isEnclosedInParens,
  splitOutsideQuotesAndParens,
  formatPrintfString,
  pythonRange,
  parseFormatArgs,
  formatStringTemplate,
} from './pcPythonRunnerHelpers';

export function createExpressionEvaluator(
  scope: Record<string, unknown>,
  pythonInput: (promptMsg: unknown) => string
): (expr: string) => unknown {
  const evaluateExpr = (expr: string): unknown => {
    const trimmed = expr.trim();
    if (!trimmed) return undefined;

    const isCompleteCall = (name: string): boolean => {
      const prefix = new RegExp(`^${name}\\s*\\(`).exec(trimmed);
      if (!prefix) return false;
      let depth = 0;
      let inQuote = '';
      for (let i = prefix[0].length - 1; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (inQuote) {
          if (ch === inQuote && trimmed[i - 1] !== '\\') inQuote = '';
        } else if (ch === '"' || ch === "'") {
          inQuote = ch;
        } else if (ch === '(') {
          depth++;
        } else if (ch === ')' && --depth === 0) {
          return i === trimmed.length - 1;
        }
      }
      return false;
    };

    // Handle Python string .join(...) method: sep.join(iterable)
    const joinIdx = trimmed.lastIndexOf('.join(');
    if (joinIdx !== -1 && trimmed.endsWith(')')) {
      const sepStrExpr = trimmed.slice(0, joinIdx).trim();
      const rawJoinArg = trimmed.slice(joinIdx + 6, -1).trim();
      const sepVal = evaluateExpr(sepStrExpr);
      const iterVal = evaluateExpr(rawJoinArg);
      if (typeof sepVal === 'string') {
        const items = Array.isArray(iterVal)
          ? iterVal
          : iterVal instanceof Set
            ? Array.from(iterVal)
            : typeof iterVal === 'string'
              ? iterVal.split('')
              : [];
        return items.map(item => String(item ?? '')).join(sepVal);
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

    // Handle set(...)
    const setMatch = /^set\s*\((.*)\)$/.exec(trimmed);
    if (setMatch) {
      const val = evaluateExpr(setMatch[1]);
      if (Array.isArray(val)) return new Set(val);
      if (typeof val === 'string') return new Set(val.split(''));
      if (val instanceof Set) return new Set(val);
      return new Set();
    }

    // Handle divmod(...)
    const divmodMatch = /^divmod\s*\((.*)\)$/.exec(trimmed);
    if (divmodMatch) {
      const parts = splitOutsideQuotesAndParens(divmodMatch[1], ',').map(p => Number(evaluateExpr(p)));
      const a = parts[0] || 0;
      const b = parts[1] || 1;
      return [Math.floor(a / b), a % b];
    }

    // Handle round(...)
    const roundMatch = /^round\s*\((.*)\)$/.exec(trimmed);
    if (roundMatch) {
      const parts = splitOutsideQuotesAndParens(roundMatch[1], ',');
      const num = Number(evaluateExpr(parts[0]) || 0);
      const decimals = parts.length > 1 ? Number(evaluateExpr(parts[1])) : 0;
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
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
    // Match only a complete str(...) call. The greedy form also matched
    // expressions such as `str(a) + str(b)` as one call and swallowed the
    // concatenation operators.
    const strMatch = isCompleteCall('str') ? /^str\s*\((.*)\)$/.exec(trimmed) : null;
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
    const lenMatch = isCompleteCall('len') ? /^len\s*\((.*)\)$/.exec(trimmed) : null;
    if (lenMatch) {
      const val = evaluateExpr(lenMatch[1]);
      if (Array.isArray(val) || typeof val === 'string') return val.length;
      if (val instanceof Set) return val.size;
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
          : iterable instanceof Set
            ? Array.from(iterable)
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
      const val = evaluateExpr(ordMatch[1]);
      const str = String(val || '');
      return str.length > 0 ? str.charCodeAt(0) : 0;
    }

    // Handle chr(...)
    const chrMatch = /^chr\s*\((.*)\)$/.exec(trimmed);
    if (chrMatch) {
      const val = evaluateExpr(chrMatch[1]);
      const num = Math.floor(Number(val || 0));
      return String.fromCharCode(num);
    }

    // Handle sum(...)
    const sumMatch = /^sum\s*\((.*)\)$/.exec(trimmed);
    if (sumMatch) {
      const parts = splitOutsideQuotesAndParens(sumMatch[1], ',');
      const val = evaluateExpr(parts[0]);
      const startVal = parts.length > 1 ? Number(evaluateExpr(parts[1])) : 0;
      if (Array.isArray(val)) {
        return val.reduce((acc: number, item: unknown) => acc + Number(item || 0), startVal);
      }
      return startVal;
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
    const sortedMatch = isCompleteCall('sorted') ? /^sorted\s*\((.*)\)$/.exec(trimmed) : null;
    if (sortedMatch) {
      const val = evaluateExpr(sortedMatch[1]);
      let arr: unknown[];
      if (Array.isArray(val)) {
        arr = [...val];
      } else if (typeof val === 'string') {
        arr = val.split('');
      } else if (val instanceof Set) {
        arr = Array.from(val);
      } else {
        return val;
      }
      arr.sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
      });
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
        const items = Array.isArray(iterVal)
          ? iterVal
          : iterVal instanceof Set
            ? Array.from(iterVal)
            : typeof iterVal === 'string'
              ? iterVal.split('')
              : [];
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
        const items = Array.isArray(iterVal)
          ? iterVal
          : iterVal instanceof Set
            ? Array.from(iterVal)
            : typeof iterVal === 'string'
              ? iterVal.split('')
              : [];
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

    // Scope variable lookups
    if (scope[trimmed] !== undefined) {
      return scope[trimmed];
    }

    // Member call: targetExpr.method(...) (supports string literals, variables, etc.)
    const dotIdx = findOperatorIndex(trimmed, '.');
    if (dotIdx !== -1 && trimmed.endsWith(')')) {
      const targetStr = trimmed.slice(0, dotIdx).trim();
      const rest = trimmed.slice(dotIdx + 1).trim();
      const methodMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/.exec(rest);
      if (methodMatch) {
        const methodName = methodMatch[1];
        const rawArgs = methodMatch[2].trim();
        const obj = evaluateExpr(targetStr);

        if (typeof obj === 'string') {
          if (methodName === 'format') {
            const { positional, kwargs } = parseFormatArgs(rawArgs, evaluateExpr);
            return formatStringTemplate(obj, positional, kwargs);
          }
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
              return Array.isArray(sArgs[0])
                ? sArgs[0].map(String).join(obj)
                : sArgs[0] instanceof Set
                  ? Array.from(sArgs[0]).map(String).join(obj)
                  : String(sArgs[0]);
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
      const keys: string[] = [];
      const vals: unknown[] = [];
      for (const [k, v] of Object.entries(scope)) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) {
          keys.push(k);
          vals.push(v);
        }
      }
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return (${trimmed});`);
      return fn(...vals);
    } catch {
      return trimmed;
    }
  };

  return evaluateExpr;
}
