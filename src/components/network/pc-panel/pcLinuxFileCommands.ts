import type { OutputLine } from './PCPanel.types';
import {
  loadFs, saveFs, readFile, writeFile, deleteFile, removeDir, makeDir, getNode, resolvePath, copyFile, moveNode,
} from './pcFileSystem';
import type { FSNode } from './pcFileSystem';
import { formatLinuxPath } from './pcLinuxPathUtils';

export interface LinuxFileCommandContext {
  deviceId: string;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  addLocalOutput: (type: OutputLine['type'], content: string, prompt?: string) => void;
}

function removeTree(fs: FSNode, path: string): boolean {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length === 0) return false;
  const name = parts.pop() as string;
  let parent: FSNode = fs;
  for (const part of parts) {
    if (parent.type !== 'dir' || !parent.children[part]) return false;
    parent = parent.children[part];
  }
  if (parent.type !== 'dir' || !parent.children[name]) return false;
  delete parent.children[name];
  return true;
}

/** Executes commands that read or mutate the simulated PC filesystem. */
export function executeLinuxFileCommand(
  command: string,
  args: string[],
  context: LinuxFileCommandContext,
): boolean {
  const { deviceId, currentPath, setCurrentPath, addLocalOutput } = context;

  if (command === 'echo') {
    const redirGtIdx = args.indexOf('>');
    const redirAppendIdx = args.indexOf('>>');
    if (redirGtIdx !== -1 || redirAppendIdx !== -1) {
      const isAppend = redirAppendIdx !== -1;
      const splitIdx = isAppend ? redirAppendIdx : redirGtIdx;
      const textToEcho = args.slice(0, splitIdx).join(' ');
      const targetFileName = args[splitIdx + 1];
      if (!targetFileName) {
        addLocalOutput('error', 'bash: syntax error near unexpected token \'newline\'');
        return true;
      }
      const fs = loadFs(deviceId);
      const targetPath = resolvePath(currentPath, targetFileName);
      const existingContent = isAppend ? (readFile(fs, targetPath) || '') : '';
      const newContent = isAppend ? (existingContent ? `${existingContent}\n${textToEcho}` : textToEcho) : textToEcho;
      writeFile(fs, targetPath, newContent);
      saveFs(deviceId, fs);
      return true;
    }
    addLocalOutput('output', args.join(' '));
    return true;
  }

  if (command === 'ls' || command === 'dir') {
    const fs = loadFs(deviceId);
    const flags = args.filter(arg => arg.startsWith('-')).join('').replace(/^-+/g, '');
    const targetArg = args.find(arg => !arg.startsWith('-')) || '';
    const isLong = flags.includes('l');
    const showAll = flags.includes('a');
    const humanSize = flags.includes('h');
    const targetWinPath = targetArg ? resolvePath(currentPath, targetArg) : currentPath;
    const targetNode = getNode(fs, targetWinPath);

    if (!targetNode) {
      addLocalOutput('error', `ls: cannot access '${targetArg || formatLinuxPath(currentPath)}': No such file or directory`);
      return true;
    }
    if (targetNode.type === 'file') {
      addLocalOutput('output', targetArg || targetWinPath.split('\\').pop() || 'file');
      return true;
    }

    const items: { name: string; isDir: boolean; isExec: boolean; size: number; modifiedAt: string }[] = [];
    if (showAll) {
      items.push({ name: '.', isDir: true, isExec: false, size: 4096, modifiedAt: 'Aug 27 12:00' });
      items.push({ name: '..', isDir: true, isExec: false, size: 4096, modifiedAt: 'Aug 27 12:00' });
    }
    Object.entries(targetNode.children).forEach(([name, child]) => {
      const isDir = child.type === 'dir';
      const isExec = child.type === 'file' && (child.isExecutable !== undefined ? child.isExecutable : (name.endsWith('.sh') || name.endsWith('.py')));
      const size = child.type === 'file' ? (child.size || child.content.length || 0) : 4096;
      let dateStr = 'Aug 27 12:00';
      if (child.modifiedAt) {
        try {
          const date = new Date(child.modifiedAt);
          dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch { /* invalid metadata uses the default date */ }
      }
      items.push({ name, isDir, isExec, size, modifiedAt: dateStr });
    });
    if (flags.includes('t')) items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    if (flags.includes('r')) items.reverse();
    if (isLong) {
      const formatted = items.map(item => {
        const perms = item.isDir ? 'drwxr-xr-x 2 user user' : (item.isExec ? '-rwxr-xr-x 1 user user' : '-rw-r--r-- 1 user user');
        const sizeText = humanSize && item.size >= 1024 ? `${(item.size / 1024).toFixed(1)}K` : item.size.toString();
        return `${perms} ${sizeText.padStart(6)} ${item.modifiedAt} ${item.name}`;
      }).join('\n');
      addLocalOutput('output', `total ${items.length * 4}\n${formatted}`);
    } else {
      addLocalOutput('output', items.map(item => item.isDir ? `${item.name}/` : (item.isExec ? `${item.name}*` : item.name)).join('  ') || '(empty)');
    }
    return true;
  }

  if (command === 'cd') {
    const targetArg = args[0] || '~';
    if (targetArg === '~' || targetArg === '/home/user' || targetArg === '/') {
      setCurrentPath('C:\\');
      return true;
    }
    if (targetArg === '..') {
      setCurrentPath(resolvePath(currentPath, '..'));
      return true;
    }
    const fs = loadFs(deviceId);
    const targetWinPath = resolvePath(currentPath, targetArg);
    const targetNode = getNode(fs, targetWinPath);
    if (!targetNode) {
      addLocalOutput('error', `bash: cd: ${targetArg}: No such file or directory`);
      return true;
    }
    if (targetNode.type !== 'dir') {
      addLocalOutput('error', `bash: cd: ${targetArg}: Not a directory`);
      return true;
    }
    setCurrentPath(targetWinPath);
    return true;
  }

  if (command === 'cat') {
    const fileName = args[0];
    if (!fileName) {
      addLocalOutput('error', 'cat: missing file operand');
      return true;
    }
    const content = readFile(loadFs(deviceId), resolvePath(currentPath, fileName));
    addLocalOutput(content !== null ? 'output' : 'error', content !== null ? content : `cat: ${fileName}: No such file or directory`);
    return true;
  }

  if (command === 'grep') {
    const isCaseInsensitive = args.some(arg => arg === '-i' || arg === '-ic' || arg === '-ci');
    const isCountOnly = args.some(arg => arg === '-c' || arg === '-ic' || arg === '-ci');
    const nonFlags = args.filter(arg => !arg.startsWith('-'));
    if (nonFlags.length < 1) {
      addLocalOutput('error', 'grep: option requires an argument');
      return true;
    }
    const pattern = nonFlags[0];
    const fileArg = nonFlags[1];
    if (!fileArg) {
      addLocalOutput('error', 'grep: missing target file');
      return true;
    }
    const content = readFile(loadFs(deviceId), resolvePath(currentPath, fileArg));
    if (content === null) {
      addLocalOutput('error', `grep: ${fileArg}: No such file or directory`);
      return true;
    }
    let regex: RegExp;
    try { regex = new RegExp(pattern, isCaseInsensitive ? 'i' : ''); }
    catch {
      addLocalOutput('error', `grep: invalid regular expression: ${pattern}`);
      return true;
    }
    const matched = content.split(/\r?\n/).filter(line => regex.test(line));
    addLocalOutput('output', isCountOnly ? matched.length.toString() : matched.join('\n'));
    return true;
  }

  if (command === 'touch') {
    const fileName = args[0];
    if (!fileName) {
      addLocalOutput('error', 'touch: missing file operand');
      return true;
    }
    const fs = loadFs(deviceId);
    writeFile(fs, resolvePath(currentPath, fileName), '');
    saveFs(deviceId, fs);
    return true;
  }

  if (command === 'mkdir') {
    const dirName = args.find(arg => !arg.startsWith('-'));
    if (!dirName) {
      addLocalOutput('error', 'mkdir: missing operand');
      return true;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, dirName);
    if (!makeDir(fs, fullPath)) {
      addLocalOutput('error', `mkdir: cannot create directory '${dirName}'`);
      return true;
    }
    saveFs(deviceId, fs);
    return true;
  }

  if (command === 'rm') {
    const recursive = args.some(arg => arg === '-r' || arg === '-R');
    const force = args.includes('-f');
    const fileName = args.filter(arg => !arg.startsWith('-'))[0];
    if (!fileName) {
      addLocalOutput('error', 'rm: missing operand');
      return true;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, fileName);
    const node = getNode(fs, fullPath);
    if (!node) {
      if (!force) addLocalOutput('error', `rm: cannot remove '${fileName}': No such file or directory`);
      return true;
    }
    const removed = node.type === 'dir' ? (recursive ? removeTree(fs, fullPath) : removeDir(fs, fullPath)) : deleteFile(fs, fullPath);
    if (!removed) {
      addLocalOutput('error', `rm: cannot remove '${fileName}': ${node.type === 'dir' ? 'Is a directory or directory is not empty' : 'Operation not permitted'}`);
      return true;
    }
    saveFs(deviceId, fs);
    return true;
  }

  if (command === 'cp' || command === 'mv') {
    const [src, dest] = args;
    if (!src || !dest) {
      addLocalOutput('error', `${command}: missing file operand`);
      return true;
    }
    const fs = loadFs(deviceId);
    const srcPath = resolvePath(currentPath, src);
    const destPath = resolvePath(currentPath, dest);
    const changed = command === 'cp' ? copyFile(fs, srcPath, destPath) : moveNode(fs, srcPath, destPath);
    if (changed) saveFs(deviceId, fs);
    else addLocalOutput('error', `${command}: cannot stat '${src}': No such file or directory`);
    return true;
  }

  return false;
}
