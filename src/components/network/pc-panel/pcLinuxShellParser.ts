import { formatWinToUnixPath } from './pcLinuxPathUtils';

const shellVariables = new Map<string, Record<string, string>>();

export function expandShellVariables(
  input: string,
  deviceId: string,
  currentPath?: string,
  hostname?: string,
): string {
  const vars = shellVariables.get(deviceId) || {};
  const withSubstitution = input.replace(/\$\((pwd|hostname|whoami)\)/g, (_, command) =>
    command === 'pwd' ? formatWinToUnixPath(currentPath || 'C:\\') : command === 'hostname' ? (hostname || '') : 'user');
  return withSubstitution.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
    (_, braced, plain) => vars[braced || plain] ?? '');
}

export function setShellVariable(deviceId: string, name: string, value: string): void {
  const vars = shellVariables.get(deviceId) || {};
  vars[name] = value.replace(/^['"]|['"]$/g, '');
  shellVariables.set(deviceId, vars);
}

export function parseShellAssignment(command: string): { name: string; value: string } | null {
  const match = command.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  return match ? { name: match[1], value: match[2] } : null;
}

/** Splits shell words while preserving quoted whitespace and removing quote delimiters. */
export function splitShellWords(input: string): string[] {
  const words: string[] = [];
  let current = '';
  let quote: string | null = null;
  let escaped = false;

  for (const char of input.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        words.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (escaped) current += '\\';
  if (current) words.push(current);
  return words;
}

export function splitPipeline(command: string): string[] {
  const stages: string[] = [];
  let current = '';
  let quote: string | null = null;
  let escaped = false;

  for (const char of command) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      current += char;
      escaped = true;
    } else if (quote) {
      current += char;
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      current += char;
      quote = char;
    } else if (char === '|') {
      if (current.trim()) stages.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) stages.push(current.trim());
  return stages;
}

export interface OutputRedirection {
  command: string;
  operator: '>' | '>>';
  target: string;
}

export function parseOutputRedirection(input: string): OutputRedirection | null {
  let quote: string | null = null;
  let escaped = false;
  let operatorIndex = -1;
  let operator: '>' | '>>' = '>';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '>') {
      operatorIndex = i;
      if (input[i + 1] === '>') {
        operator = '>>';
        i++;
      } else {
        operator = '>';
      }
    }
  }

  if (operatorIndex === -1) return null;
  const command = input.slice(0, operatorIndex).trim();
  const target = input.slice(operatorIndex + operator.length).trim();
  const targetWords = splitShellWords(target);
  if (!command || !targetWords[0]) return null;
  return { command, operator, target: targetWords[0] };
}
