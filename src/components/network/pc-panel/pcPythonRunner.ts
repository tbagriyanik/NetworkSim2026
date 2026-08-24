// pcPythonRunner.ts
// A lightweight, safe Python script interpreter for PC CMD.

export interface PythonExecutionResult {
  output: string;
  error?: string;
  waitingForInput?: boolean;
  inputPrompt?: string;
}

import { PYTHON_MODULES } from './pcPythonModules';
import {
  PythonInputRequiredException,
  formatPythonValue,
  splitOutsideQuotesAndParens,
  parseFormatArgs,
} from './pcPythonRunnerHelpers';
import { Statement, parseProgramLines, parseBlockAt } from './pcPythonParser';
import { createExpressionEvaluator } from './pcPythonEvaluator';

export { PyComplex, pythonRange, formatPythonValue } from './pcPythonRunnerHelpers';

export function executePythonScript(
  script: string,
  userInputs: string[] = [],
  onOutput?: (line: string, isAppend?: boolean) => void
): PythonExecutionResult {
  const scope: Record<string, unknown> = {
    print: (...args: unknown[]) => {
      outputs.push(args.map(a => formatPythonValue(a)).join(' '));
    },
  };
  const outputs: string[] = [];
  let inputIdx = 0;

  const pythonInput = (promptMsg: unknown): string => {
    const promptStr = promptMsg ? String(promptMsg) : '';
    if (inputIdx < userInputs.length) {
      const val = userInputs[inputIdx++];
      if (promptStr) {
        outputs.push(promptStr);
        onOutput?.(promptStr + val, false);
      }
      return val;
    }
    throw new PythonInputRequiredException(promptStr || 'Input required: ');
  };

  const evaluateExpr = createExpressionEvaluator(scope, pythonInput);

  const rawLines = script.split(/\r?\n/);
  const parsedLines = parseProgramLines(rawLines);
  const { statements: programAst } = parseBlockAt(parsedLines, 0, 0);

  type ExecResult = 'normal' | 'break' | 'continue' | { type: 'return'; value: unknown };

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

  const processLineSync = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (/^time\.sleep\s*\((.*)\)$/.test(trimmed)) return;

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

    const reverseMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*reverse\s*\((.*)\)$/.exec(trimmed);
    if (reverseMatch) {
      const listVar = reverseMatch[1];
      const arr = scope[listVar];
      if (Array.isArray(arr)) {
        arr.reverse();
      }
      return;
    }

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

    const eqIdx = trimmed.indexOf('=');
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

    try {
      evaluateExpr(trimmed);
    } catch {
      // ignore
    }
  };

  const execStatementsSync = (stmts: Statement[]): ExecResult => {
    for (const stmt of stmts) {
      if (stmt.type === 'line') {
        if (stmt.text === 'break') return 'break';
        if (stmt.text === 'continue') return 'continue';
        if (stmt.text === 'return' || stmt.text.startsWith('return ') || stmt.text.startsWith('return(')) {
          const retExpr = stmt.text.length > 6 ? stmt.text.slice(6).trim() : '';
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

  try {
    execStatementsSync(programAst);
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
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return {
    output: outputs.join('\n'),
  };
}

export async function executePythonScriptAsync(
  script: string,
  userInputs: string[] = [],
  onOutput?: (line: string, isAppend?: boolean) => void
): Promise<PythonExecutionResult> {
  const scope: Record<string, unknown> = {
    print: (...args: unknown[]) => {
      outputs.push(args.map(a => formatPythonValue(a)).join(' '));
    },
  };
  const outputs: string[] = [];
  let inputIdx = 0;

  const pythonInput = (promptMsg: unknown): string => {
    const promptStr = promptMsg ? String(promptMsg) : '';
    if (inputIdx < userInputs.length) {
      const val = userInputs[inputIdx++];
      if (promptStr) {
        outputs.push(promptStr);
        onOutput?.(promptStr + val, false);
      }
      return val;
    }
    throw new PythonInputRequiredException(promptStr || 'Input required: ');
  };

  const evaluateExpr = createExpressionEvaluator(scope, pythonInput);

  const rawLines = script.split(/\r?\n/);
  const parsedLines = parseProgramLines(rawLines);
  const { statements: programAst } = parseBlockAt(parsedLines, 0, 0);

  type ExecResult = 'normal' | 'break' | 'continue' | { type: 'return'; value: unknown };

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

  const processLineSync = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (/^time\.sleep\s*\((.*)\)$/.test(trimmed)) return;

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

    const reverseMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*reverse\s*\((.*)\)$/.exec(trimmed);
    if (reverseMatch) {
      const listVar = reverseMatch[1];
      const arr = scope[listVar];
      if (Array.isArray(arr)) {
        arr.reverse();
      }
      return;
    }

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

    const eqIdx = trimmed.indexOf('=');
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

    try {
      evaluateExpr(trimmed);
    } catch {
      // ignore
    }
  };

  const execStatementsSync = (stmts: Statement[]): ExecResult => {
    for (const stmt of stmts) {
      if (stmt.type === 'line') {
        if (stmt.text === 'break') return 'break';
        if (stmt.text === 'continue') return 'continue';
        if (stmt.text === 'return' || stmt.text.startsWith('return ') || stmt.text.startsWith('return(')) {
          const retExpr = stmt.text.length > 6 ? stmt.text.slice(6).trim() : '';
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

  const processLine = async (line: string): Promise<void> => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const sleepMatch = /^time\.sleep\s*\((.*)\)$/.exec(trimmed);
    if (sleepMatch) {
      const secVal = Number(evaluateExpr(sleepMatch[1]) || 0);
      if (secVal > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(secVal, 10) * 1000));
      }
      return;
    }

    processLineSync(trimmed);
  };

  const execStatements = async (stmts: Statement[]): Promise<ExecResult> => {
    for (const stmt of stmts) {
      if (stmt.type === 'line') {
        if (stmt.text === 'break') return 'break';
        if (stmt.text === 'continue') return 'continue';
        if (stmt.text === 'return' || stmt.text.startsWith('return ') || stmt.text.startsWith('return(')) {
          const retExpr = stmt.text.length > 6 ? stmt.text.slice(6).trim() : '';
          const retVal = retExpr ? evaluateExpr(retExpr) : undefined;
          return { type: 'return', value: retVal };
        }
        await processLine(stmt.text);
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

  try {
    await execStatements(programAst);
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
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return {
    output: outputs.join('\n'),
  };
}
