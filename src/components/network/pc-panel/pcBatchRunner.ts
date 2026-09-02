// pcBatchRunner.ts
// Interpreter and executor for user-defined batch (.bat / .cmd) files in PC Command Prompt.

import { FSNode, getNodeDetails, readFile, resolvePath } from './pcFileSystem';

export interface BatchExecutionOptions {
  fs: FSNode;
  scriptPath: string;
  content: string;
  args?: string[];
  envVars?: Record<string, string>;
  depth?: number;
  echoOn?: boolean;
  runSingleCommand: (cmdLine: string) => Promise<void> | void;
  emitOutput: (type: 'output' | 'error' | 'success' | 'command', content: string, prompt?: string) => void;
  clearOutput?: () => void;
}

/**
 * Resolve a batch file path given a command string and current working directory.
 * Returns the resolved absolute path if a .bat / .cmd file exists, or null otherwise.
 */
export function resolveBatchFilePath(fs: FSNode, currentPath: string, cmdName: string): string | null {
  const trimmed = cmdName.trim();
  if (!trimmed) return null;

  const isBatOrCmd = /\.bat$/i.test(trimmed) || /\.cmd$/i.test(trimmed);

  // 1. Direct path check (if specified as file.bat or relative/absolute path)
  const pathCandidate = resolvePath(currentPath, trimmed);
  const details = getNodeDetails(fs, pathCandidate);
  if (details && details.type === 'file' && isBatOrCmd) {
    return pathCandidate;
  }

  // 2. Append .bat or .cmd in current directory
  if (!isBatOrCmd) {
    const batInCwd = resolvePath(currentPath, `${trimmed}.bat`);
    if (getNodeDetails(fs, batInCwd)?.type === 'file') {
      return batInCwd;
    }
    const cmdInCwd = resolvePath(currentPath, `${trimmed}.cmd`);
    if (getNodeDetails(fs, cmdInCwd)?.type === 'file') {
      return cmdInCwd;
    }
  }

  // 3. Search in system folders C:\ and C:\CODE
  if (!isBatOrCmd) {
    const batInRoot = resolvePath('C:\\', `${trimmed}.bat`);
    if (getNodeDetails(fs, batInRoot)?.type === 'file') {
      return batInRoot;
    }
    const batInCode = resolvePath('C:\\CODE', `${trimmed}.bat`);
    if (getNodeDetails(fs, batInCode)?.type === 'file') {
      return batInCode;
    }
  } else {
    const batInRoot = resolvePath('C:\\', trimmed);
    if (getNodeDetails(fs, batInRoot)?.type === 'file') {
      return batInRoot;
    }
    const batInCode = resolvePath('C:\\CODE', trimmed);
    if (getNodeDetails(fs, batInCode)?.type === 'file') {
      return batInCode;
    }
  }

  return null;
}

/**
 * Perform variable substitution on a batch script line.
 * Handles %0..%9, %*, and %VAR% environment variables.
 */
export function substituteBatchVariables(
  line: string,
  envVars: Record<string, string>,
  positionalArgs: string[],
  scriptPath: string
): string {
  let result = line;

  // Replace %0 with scriptPath or script basename
  const scriptName = scriptPath.split(/[\\/]/).pop() || scriptPath;
  result = result.replace(/%0/g, scriptName);

  // Replace %* with all arguments joined by space
  result = result.replace(/%\*/g, positionalArgs.join(' '));

  // Replace %1..%9
  for (let i = 1; i <= 9; i++) {
    const val = positionalArgs[i - 1] ?? '';
    result = result.replace(new RegExp(`%${i}`, 'g'), val);
  }

  // Replace %VAR%
  result = result.replace(/%([a-zA-Z0-9_]+)%/g, (_match, varName) => {
    const upper = varName.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(envVars, upper)) {
      return envVars[upper];
    }
    if (Object.prototype.hasOwnProperty.call(envVars, varName)) {
      return envVars[varName];
    }
    return '';
  });

  return result;
}

/**
 * Execute a batch script (.bat / .cmd) line by line.
 */
export async function executeBatchScript(options: BatchExecutionOptions): Promise<void> {
  const {
    fs,
    scriptPath,
    content,
    args = [],
    envVars = {},
    depth = 0,
    runSingleCommand,
    emitOutput,
    clearOutput,
  } = options;

  if (depth > 5) {
    emitOutput('error', 'Batch execution error: Maximum recursion depth exceeded.');
    return;
  }

  let echoOn = options.echoOn ?? true;
  const localEnv: Record<string, string> = { ...envVars };

  const lines = content.split(/\r?\n/);

  // Pre-scan labels for GOTO support
  const labelMap = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith(':') && !trimmed.startsWith('::')) {
      const label = trimmed.slice(1).trim().toLowerCase();
      if (label && !labelMap.has(label)) {
        labelMap.set(label, i);
      }
    }
  }

  let lineIdx = 0;
  const batchStartTime = Date.now();
  const batchTimeoutMs = 3000;
  let batchStepCount = 0;
  const maxBatchSteps = 5000;

  while (lineIdx < lines.length) {
    batchStepCount++;
    if (Date.now() - batchStartTime > batchTimeoutMs || batchStepCount > maxBatchSteps) {
      emitOutput('error', 'Batch file execution terminated: timeout exceeded (3s limit reached or infinite loop detected)');
      break;
    }
    const rawLine = lines[lineIdx];
    lineIdx++;

    let line = rawLine.trim();
    if (!line) continue;

    // Check for @ prefix (suppresses line echo)
    let suppressEcho = false;
    if (line.startsWith('@')) {
      suppressEcho = true;
      line = line.slice(1).trim();
    }

    if (!line) continue;

    // Comments: REM or ::
    if (/^rem(\s+|$)/i.test(line) || line.startsWith('::')) {
      continue;
    }

    // Label declaration: :label
    if (line.startsWith(':')) {
      continue;
    }

    // Variable substitution
    const substitutedLine = substituteBatchVariables(line, localEnv, args, scriptPath);

    const firstWord = substitutedLine.split(/\s+/)[0].toLowerCase();
    const rest = substitutedLine.slice(firstWord.length).trim();

    // Directive: ECHO OFF / ECHO ON
    if (substitutedLine.toUpperCase() === 'ECHO OFF') {
      echoOn = false;
      continue;
    }
    if (substitutedLine.toUpperCase() === 'ECHO ON') {
      echoOn = true;
      continue;
    }

    // Directive: ECHO [message]
    if (firstWord === 'echo') {
      if (echoOn && !suppressEcho) {
        emitOutput('output', `C:\\> ${substitutedLine}`);
      }
      if (!rest || rest === '.') {
        emitOutput('output', '');
      } else {
        emitOutput('output', rest);
      }
      continue;
    }

    // Directive: SET [VAR=val]
    if (firstWord === 'set') {
      if (echoOn && !suppressEcho) {
        emitOutput('output', `C:\\> ${substitutedLine}`);
      }
      if (!rest) {
        const envList = Object.entries(localEnv)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n');
        emitOutput('output', envList || 'Environment variables are empty.');
      } else {
        const eqIdx = rest.indexOf('=');
        if (eqIdx !== -1) {
          const varName = rest.slice(0, eqIdx).trim().toUpperCase();
          const varVal = rest.slice(eqIdx + 1).trim();
          if (varVal === '') {
            delete localEnv[varName];
          } else {
            localEnv[varName] = varVal;
          }
        } else {
          const searchVar = rest.toUpperCase();
          const matches = Object.entries(localEnv)
            .filter(([k]) => k.startsWith(searchVar))
            .map(([k, v]) => `${k}=${v}`);
          emitOutput('output', matches.join('\n') || `Environment variable ${rest} not defined`);
        }
      }
      continue;
    }

    // Directive: PAUSE
    if (firstWord === 'pause') {
      if (echoOn && !suppressEcho) {
        emitOutput('output', `C:\\> ${substitutedLine}`);
      }
      emitOutput('output', 'Press any key to continue . . .');
      continue;
    }

    // Directive: CLS
    if (firstWord === 'cls') {
      clearOutput?.();
      continue;
    }

    // Directive: EXIT / EXIT /B
    if (firstWord === 'exit') {
      break;
    }

    // Directive: GOTO label
    if (firstWord === 'goto') {
      const targetLabel = rest.toLowerCase().replace(/^:/, '');
      if (labelMap.has(targetLabel)) {
        lineIdx = labelMap.get(targetLabel)!;
      } else {
        emitOutput('error', `The system cannot find the batch label specified - ${rest}`);
      }
      continue;
    }

    // Directive: CALL script.bat [args...]
    if (firstWord === 'call') {
      const callTokens = rest.split(/\s+/).filter(Boolean);
      if (callTokens.length > 0) {
        const targetScript = callTokens[0];
        const callArgs = callTokens.slice(1);
        const resolvedPath = resolveBatchFilePath(fs, 'C:\\', targetScript);
        if (resolvedPath) {
          const childContent = readFile(fs, resolvedPath);
          if (childContent !== null) {
            await executeBatchScript({
              fs,
              scriptPath: resolvedPath,
              content: childContent,
              args: callArgs,
              envVars: localEnv,
              depth: depth + 1,
              echoOn,
              runSingleCommand,
              emitOutput,
              clearOutput,
            });
            continue;
          }
        }
      }
    }

    // Standard CLI command execution
    if (echoOn && !suppressEcho) {
      emitOutput('output', `C:\\> ${substitutedLine}`);
    }

    await runSingleCommand(substitutedLine);
  }
}
