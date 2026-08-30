// pcPythonRunner.ts
// A lightweight, safe Python script interpreter for PC CMD.

export interface PythonExecutionResult {
  output: string;
  error?: string;
  waitingForInput?: boolean;
  inputPrompt?: string;
}

import {
  PythonInputRequiredException,
  PyClass,
  PyGenerator,
  formatPythonValue,
} from './pcPythonRunnerHelpers';
import { Statement, parseProgramLines, parseBlockAt } from './pcPythonParser';
import { createExpressionEvaluator } from './pcPythonEvaluator';
import { executeSinglePythonLine } from './pcPythonStatementParser';

export { PyComplex, pythonRange, formatPythonValue, PyClass, PyInstance, PySuper, PyGenerator } from './pcPythonRunnerHelpers';

export function executePythonScript(
  script: string,
  userInputs: string[] = [],
  onOutput?: (line: string, isAppend?: boolean) => void,
  deviceId?: string
): PythonExecutionResult {
  const scope: Record<string, unknown> = {
    PyGenerator,
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

  const evaluateExpr = createExpressionEvaluator(scope, pythonInput, deviceId);

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
    executeSinglePythonLine(line, scope, evaluateExpr, outputs, onOutput);
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
      } else if (stmt.type === 'class') {
        const { className, baseClasses: baseNames, body, decorators } = stmt;
        const baseClasses: PyClass[] = [];
        for (const b of baseNames) {
          const resolved = scope[b];
          if (resolved instanceof PyClass) baseClasses.push(resolved);
        }
        const createdMethods: Record<string, unknown> = {};
        const staticProps: Record<string, unknown> = {};
        const propertyGetters: Record<string, unknown> = {};
        const propertySetters: Record<string, unknown> = {};
        const staticMethods = new Set<string>();
        const classMethods = new Set<string>();

        const savedScope = { ...scope };
        execStatementsSync(body);
        for (const [k, v] of Object.entries(scope)) {
          if (!Object.prototype.hasOwnProperty.call(savedScope, k) || savedScope[k] !== v) {
            if (typeof v === 'function') {
              const fnObj = (v as unknown) as Record<string, unknown>;
              if (fnObj.__isPropertyGetter) {
                propertyGetters[k] = v;
              } else if (fnObj.__isPropertySetterFor) {
                propertySetters[String(fnObj.__isPropertySetterFor)] = v;
              } else {
                createdMethods[k] = v;
                if (fnObj.__isStaticMethod) staticMethods.add(k);
                if (fnObj.__isClassMethod) classMethods.add(k);
              }
            } else {
              staticProps[k] = v;
            }
          }
        }
        Object.keys(scope).forEach(k => delete scope[k]);
        Object.assign(scope, savedScope);

        const pyClass = new PyClass(className, baseClasses, createdMethods);
        pyClass.staticProps = staticProps;
        pyClass.propertyGetters = propertyGetters;
        pyClass.propertySetters = propertySetters;
        pyClass.staticMethods = staticMethods;
        pyClass.classMethods = classMethods;

        let targetCls: unknown = pyClass;
        if (decorators) {
          for (const dec of decorators) {
            const decFn = scope[dec];
            if (typeof decFn === 'function') {
              targetCls = decFn(targetCls);
            }
          }
        }
        scope[className] = targetCls;
      } else if (stmt.type === 'yield') {
        const retVal = evaluateExpr(stmt.expr);
        return { type: 'return', value: retVal };
      } else if (stmt.type === 'def') {
        const { funcName, paramNames, paramDefaults, body, decorators } = stmt;

        const isGen = (sList: Statement[]): boolean => {
          for (const s of sList) {
            if (s.type === 'yield') return true;
            if (s.type === 'if' && s.branches.some(b => isGen(b.body))) return true;
            if (s.type === 'while' && isGen(s.body)) return true;
            if (s.type === 'for' && isGen(s.body)) return true;
          }
          return false;
        };

        let rawFunc: unknown;

        if (isGen(body)) {
          rawFunc = (...fnArgs: unknown[]) => {
            return new PyGenerator(function* () {
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

              for (const subStmt of body) {
                if (subStmt.type === 'yield') {
                  yield evaluateExpr(subStmt.expr);
                } else if (subStmt.type === 'line') {
                  processLineSync(subStmt.text);
                }
              }

              Object.keys(scope).forEach(key => delete scope[key]);
              Object.assign(scope, savedScope);
            });
          };
        } else {
          rawFunc = (...fnArgs: unknown[]) => {
            const savedScope = { ...scope };
            paramNames.forEach((p, idx) => {
              if (p.startsWith('*')) {
                const varArgName = p.slice(1).trim();
                scope[varArgName] = fnArgs.slice(idx);
              } else if (idx < fnArgs.length && fnArgs[idx] !== undefined) {
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
        }

        (rawFunc as Record<string, unknown>).__pythonParamNames = paramNames;
        (rawFunc as Record<string, unknown>).__pythonParamDefaults = paramDefaults;

        if (decorators) {
          for (const dec of decorators.slice().reverse()) {
            if (dec === 'property') {
              (rawFunc as Record<string, unknown>).__isPropertyGetter = true;
            } else if (dec === 'staticmethod') {
              (rawFunc as Record<string, unknown>).__isStaticMethod = true;
            } else if (dec === 'classmethod') {
              (rawFunc as Record<string, unknown>).__isClassMethod = true;
            } else if (dec.endsWith('.setter')) {
              (rawFunc as Record<string, unknown>).__isPropertySetterFor = dec.slice(0, -7).trim();
            } else {
              const decFn = scope[dec];
              if (typeof decFn === 'function') {
                rawFunc = decFn(rawFunc);
              }
            }
          }
        }
        scope[funcName] = rawFunc;
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
          if (typeof (iterable as Record<string | symbol, unknown>)[Symbol.iterator] === 'function') {
            items = Array.from(iterable as Iterable<unknown>);
          } else {
            items = Object.keys(iterable);
          }
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
            const errName = err instanceof Error ? err.message : String(err);
            for (const ex of stmt.exceptBranches) {
              let matchesType = true;
              if (ex.varName) {
                const exTypeMatch = /^([a-zA-Z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?$/.exec(ex.varName.trim());
                if (exTypeMatch) {
                  const typeName = exTypeMatch[1];
                  const alias = exTypeMatch[2] || typeName;
                  if (typeName !== 'Exception' && typeName !== 'BaseException' && !errName.startsWith(typeName)) {
                    matchesType = false;
                  } else {
                    scope[alias] = errName;
                  }
                } else if (!errName.startsWith(ex.varName)) {
                  matchesType = false;
                }
              }
              if (matchesType) {
                const exSig = execStatementsSync(ex.body);
                if (exSig !== 'normal') brokeOrReturn = exSig;
                break;
              }
            }
          }
        } finally {
          if (stmt.finallyBody) {
            const finSig = execStatementsSync(stmt.finallyBody);
            if (finSig !== 'normal') brokeOrReturn = finSig;
          }
        }
        if (brokeOrReturn !== 'normal') return brokeOrReturn;
      } else if (stmt.type === 'with') {
        const fileObj = evaluateExpr(stmt.contextExpr);
        if (stmt.varName) {
          scope[stmt.varName] = fileObj;
        }
        try {
          const sig = execStatementsSync(stmt.body);
          if (sig !== 'normal') return sig;
        } finally {
          if (fileObj && typeof (fileObj as Record<string, unknown>).close === 'function') {
            (fileObj as { close: () => void }).close();
          }
        }
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
  onOutput?: (line: string, isAppend?: boolean) => void,
  deviceId?: string
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

  const evaluateExpr = createExpressionEvaluator(scope, pythonInput, deviceId);

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
    executeSinglePythonLine(line, scope, evaluateExpr, outputs, onOutput);
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
      } else if (stmt.type === 'class') {
        const { className, baseClasses: baseNames, body, decorators } = stmt;
        const baseClasses: PyClass[] = [];
        for (const b of baseNames) {
          const resolved = scope[b];
          if (resolved instanceof PyClass) baseClasses.push(resolved);
        }
        const createdMethods: Record<string, unknown> = {};
        const staticProps: Record<string, unknown> = {};
        const propertyGetters: Record<string, unknown> = {};
        const propertySetters: Record<string, unknown> = {};
        const staticMethods = new Set<string>();
        const classMethods = new Set<string>();

        const savedScope = { ...scope };
        execStatementsSync(body);
        for (const [k, v] of Object.entries(scope)) {
          if (!Object.prototype.hasOwnProperty.call(savedScope, k) || savedScope[k] !== v) {
            if (typeof v === 'function') {
              const fnObj = (v as unknown) as Record<string, unknown>;
              if (fnObj.__isPropertyGetter) {
                propertyGetters[k] = v;
              } else if (fnObj.__isPropertySetterFor) {
                propertySetters[String(fnObj.__isPropertySetterFor)] = v;
              } else {
                createdMethods[k] = v;
                if (fnObj.__isStaticMethod) staticMethods.add(k);
                if (fnObj.__isClassMethod) classMethods.add(k);
              }
            } else {
              staticProps[k] = v;
            }
          }
        }
        Object.keys(scope).forEach(k => delete scope[k]);
        Object.assign(scope, savedScope);

        const pyClass = new PyClass(className, baseClasses, createdMethods);
        pyClass.staticProps = staticProps;
        pyClass.propertyGetters = propertyGetters;
        pyClass.propertySetters = propertySetters;
        pyClass.staticMethods = staticMethods;
        pyClass.classMethods = classMethods;

        let targetCls: unknown = pyClass;
        if (decorators) {
          for (const dec of decorators) {
            const decFn = scope[dec];
            if (typeof decFn === 'function') {
              targetCls = decFn(targetCls);
            }
          }
        }
        scope[className] = targetCls;
      } else if (stmt.type === 'yield') {
        const retVal = evaluateExpr(stmt.expr);
        return { type: 'return', value: retVal };
      } else if (stmt.type === 'def') {
        const { funcName, paramNames, paramDefaults, body, decorators } = stmt;

        const isGen = (sList: Statement[]): boolean => {
          for (const s of sList) {
            if (s.type === 'yield') return true;
            if (s.type === 'if' && s.branches.some(b => isGen(b.body))) return true;
            if (s.type === 'while' && isGen(s.body)) return true;
            if (s.type === 'for' && isGen(s.body)) return true;
          }
          return false;
        };

        let rawFunc: unknown;

        if (isGen(body)) {
          rawFunc = (...fnArgs: unknown[]) => {
            return new PyGenerator(function* () {
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

              for (const subStmt of body) {
                if (subStmt.type === 'yield') {
                  yield evaluateExpr(subStmt.expr);
                } else if (subStmt.type === 'line') {
                  processLineSync(subStmt.text);
                }
              }

              Object.keys(scope).forEach(key => delete scope[key]);
              Object.assign(scope, savedScope);
            });
          };
        } else {
          rawFunc = (...fnArgs: unknown[]) => {
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
        }

        if (decorators) {
          for (const dec of decorators) {
            if (dec === 'property') {
              (rawFunc as Record<string, unknown>).__isPropertyGetter = true;
            } else if (dec === 'staticmethod') {
              (rawFunc as Record<string, unknown>).__isStaticMethod = true;
            } else if (dec === 'classmethod') {
              (rawFunc as Record<string, unknown>).__isClassMethod = true;
            } else if (dec.endsWith('.setter')) {
              (rawFunc as Record<string, unknown>).__isPropertySetterFor = dec.slice(0, -7).trim();
            } else {
              const decFn = scope[dec];
              if (typeof decFn === 'function') {
                rawFunc = decFn(rawFunc);
              }
            }
          }
        }
        scope[funcName] = rawFunc;
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
          if (typeof (iterable as Record<string | symbol, unknown>)[Symbol.iterator] === 'function') {
            items = Array.from(iterable as Iterable<unknown>);
          } else {
            items = Object.keys(iterable);
          }
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
      } else if (stmt.type === 'with') {
        const fileObj = evaluateExpr(stmt.contextExpr);
        if (stmt.varName) {
          scope[stmt.varName] = fileObj;
        }
        try {
          const sig = execStatementsSync(stmt.body);
          if (sig !== 'normal') return sig;
        } finally {
          if (fileObj && typeof (fileObj as Record<string, unknown>).close === 'function') {
            (fileObj as { close: () => void }).close();
          }
        }
      }
    }
    return 'normal';
  };

  const processLine = async (line: string): Promise<void> => {
    const trimmed = line.trim().replace(/;+\s*$/, '');
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
