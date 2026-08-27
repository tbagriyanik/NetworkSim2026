import type { OutputLine } from './PCPanel.types';
import {
  loadFs, saveFs, readFile, writeFile, deleteFile, removeDir, makeDir, getNode, resolvePath, copyFile, moveNode
} from './pcFileSystem';
import type { FSNode } from './pcFileSystem';
import { executePythonScript } from './pcPythonRunner';
import { formatLinuxPath, formatWinToUnixPath } from './pcLinuxPathUtils';
export { formatLinuxPath, formatWinToUnixPath } from './pcLinuxPathUtils';

export interface LinuxExecutorParams {
  deviceId: string;
  internalPcHostname: string;
  setPcHostname?: (name: string) => void;
  setEditingFile?: (file: { path: string; content: string } | null) => void;
  pcIP: string;
  pcSubnet: string;
  pcMAC: string;
  pcGateway: string;
  pcDNS: string;
  pcIPv6: string;
  wifiEnabled: boolean;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  canReachTargetIp: (targetIp: string) => boolean;
  resolveDeviceNameTargetCallback: (raw: string) => { ip: string; label?: string } | null;
  addLocalOutput: (type: OutputLine['type'], content: string, prompt?: string) => void;
  setLinuxOutput: React.Dispatch<React.SetStateAction<OutputLine[]>>;
  executeCommand?: (cmdToExecute?: string) => Promise<void>;
  linuxHistory?: string[];
  silent?: boolean;
}

export const LINUX_SUGGESTIONS = [
  'ls', 'ls -l', 'ls -la', 'pwd', 'cd', 'cat', 'touch', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'grep', 'wc', 'nano', 'vim', 'vi', 'notepad',
  'ifconfig', 'ip addr', 'ping', 'traceroute', 'nslookup', 'netstat', 'arp', 'ftp', 'ssh', 'telnet',
  'whoami', 'hostname', 'hostnamectl', 'uname -a', 'clear', 'history', 'echo', 'sudo', 'help', 'date', 'uptime',
  'for', 'while', 'if', 'python3', 'python'
];

const shellVariables = new Map<string, Record<string, string>>();

function expandShellVariables(input: string, deviceId: string, currentPath?: string, hostname?: string): string {
  const vars = shellVariables.get(deviceId) || {};
  const withSubstitution = input.replace(/\$\((pwd|hostname|whoami)\)/g, (_, command) =>
    command === 'pwd' ? formatWinToUnixPath(currentPath || 'C:\\') : command === 'hostname' ? (hostname || '') : 'user');
  return withSubstitution.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
    (_, braced, plain) => vars[braced || plain] ?? '');
}

const FILE_COMMANDS = new Set([
  'cd', 'ls', 'dir', 'cat', 'touch', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'nano', 'vim', 'vi', 'notepad', 'python', 'python3', 'sh', 'bash'
]);

const UNSUPPORTED_LINUX_COMMANDS = new Set(['type', 'edit', 'ipconfig']);

export function getLinuxSuggestions(
  inputVal: string,
  currentPath: string,
  deviceId: string
): string[] {
  const trimmed = inputVal.trimStart();
  const parts = trimmed.split(/\s+/);

  // If typing the command itself (no trailing space yet)
  if (parts.length <= 1 && !inputVal.endsWith(' ')) {
    const typed = parts[0] || '';
    if (!typed) return [];
    return LINUX_SUGGESTIONS.filter(s => s.toLowerCase().startsWith(typed.toLowerCase()));
  }

  const command = parts[0].toLowerCase();
  let effectiveCmd = command;

  // Handle sudo subcommands
  if (command === 'sudo') {
    const subCmd = parts[1]?.toLowerCase();
    if (!subCmd || (parts.length === 2 && !inputVal.endsWith(' '))) {
      const typed = subCmd || '';
      return LINUX_SUGGESTIONS.filter(s => s.toLowerCase().startsWith(typed.toLowerCase()) && s !== 'sudo');
    }
    effectiveCmd = subCmd;
    if (!FILE_COMMANDS.has(subCmd)) {
      return [];
    }
  } else if (!FILE_COMMANDS.has(command)) {
    // Commands that don't take file arguments (clear, pwd, whoami, hostname, date, uptime, ifconfig, help, etc.)
    return [];
  }

  // Determine last argument being typed
  const lastArg = inputVal.endsWith(' ') ? '' : (parts[parts.length - 1] || '');

  // If typing option flags (e.g. -l, -la), offer flag suggestions for ls
  if (lastArg.startsWith('-')) {
    if (effectiveCmd === 'ls') {
      const flags = ['-l', '-la', '-a', '-lh', '-t', '-r', '-S'];
      return flags.filter(f => f.startsWith(lastArg));
    }
    return [];
  }

  // Separate path directory prefix from current filename search query
  let dirPrefix = '';
  let searchPrefix = lastArg;
  let targetSearchDir = currentPath;

  const lastSlashIdx = Math.max(lastArg.lastIndexOf('/'), lastArg.lastIndexOf('\\'));
  if (lastSlashIdx !== -1) {
    dirPrefix = lastArg.substring(0, lastSlashIdx + 1);
    searchPrefix = lastArg.substring(lastSlashIdx + 1);
    const relDir = lastArg.substring(0, lastSlashIdx);
    targetSearchDir = resolvePath(currentPath, relDir);
  }

  const fs = loadFs(deviceId);
  const dirNode = getNode(fs, targetSearchDir);
  if (!dirNode || dirNode.type !== 'dir') return [];

  const isDirOnlyCmd = ['cd', 'chdir', 'mkdir', 'rmdir'].includes(effectiveCmd);
  const candidates: string[] = [];

  Object.entries(dirNode.children).forEach(([name, child]) => {
    if (name.toLowerCase().startsWith(searchPrefix.toLowerCase())) {
      const isDir = child.type === 'dir';
      if (isDir) {
        candidates.push(dirPrefix + name + '/');
      } else if (!isDirOnlyCmd) {
        candidates.push(dirPrefix + name);
      }
    }
  });

  return candidates;
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

export async function executeLinuxCommand(
  cmdLine: string,
  params: LinuxExecutorParams
): Promise<void> {
  const {
    deviceId,
    internalPcHostname,
    setPcHostname,
    setEditingFile,
    pcIP,
    pcSubnet,
    pcMAC,
    pcGateway,
    pcDNS,
    pcIPv6,
    wifiEnabled,
    currentPath,
    setCurrentPath,
    canReachTargetIp,
    resolveDeviceNameTargetCallback,
    addLocalOutput,
    setLinuxOutput,
  } = params;

  const rawCmd = expandShellVariables(cmdLine.trim(), deviceId, currentPath, internalPcHostname);
  if (!rawCmd) return;

  const isSudo = rawCmd.startsWith('sudo ');
  const cleanCmd = isSudo ? rawCmd.substring(5).trim() : rawCmd;
  const parts = cleanCmd.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (UNSUPPORTED_LINUX_COMMANDS.has(command)) {
    addLocalOutput('error', `bash: ${command}: command not found`);
    return;
  }

  const linuxPrompt = `${isSudo ? 'root' : 'user'}@${internalPcHostname.toLowerCase()}:${formatLinuxPath(currentPath)}${isSudo ? '#' : '$'}`;

  // 1. Handle Pipe (|) Pipelines (e.g. ifconfig | grep inet, cat file.txt | grep -i test | wc -l)
  if (cleanCmd.includes('|') && !params.silent) {
    const pipeline = cleanCmd.split('|').map(c => c.trim()).filter(Boolean);
    if (pipeline.length > 1) {
      addLocalOutput('command', rawCmd, linuxPrompt);
      let pipeData = '';

      for (let i = 0; i < pipeline.length; i++) {
        const stageCmd = pipeline[i];
        let stageOutput = '';
        let stageError = '';

        const stageAddOutput = (type: OutputLine['type'], content: string) => {
          if (type === 'error') stageError += (stageError ? '\n' : '') + content;
          else stageOutput += (stageOutput ? '\n' : '') + content;
        };

        const stageParts = stageCmd.split(/\s+/);
        const stageName = stageParts[0].toLowerCase();
        const stageArgs = stageParts.slice(1);

        if (stageName === 'grep') {
          const isCaseInsensitive = stageArgs.some(a => a === '-i' || a === '-ic' || a === '-ci');
          const isCountOnly = stageArgs.some(a => a === '-c' || a === '-ic' || a === '-ci');
          const patternArg = stageArgs.find(a => !a.startsWith('-')) || '';
          const cleanPattern = patternArg.replace(/^["']|["']$/g, '');

          if (!cleanPattern) {
            stageError = 'grep: option requires an argument';
          } else {
            const lines = pipeData.split(/\r?\n/);
            let regex: RegExp;
            try { regex = new RegExp(cleanPattern, isCaseInsensitive ? 'i' : ''); }
            catch { stageError = `grep: invalid regular expression: ${cleanPattern}`; regex = /$a/; }
            const matched = lines.filter(l => regex.test(l));

            if (isCountOnly) {
              stageOutput = matched.length.toString();
            } else {
              stageOutput = matched.join('\n');
            }
          }
        } else if (stageName === 'wc') {
          const lines = pipeData.split(/\r?\n/).filter(l => l.length > 0 || pipeData.includes('\n'));
          if (stageArgs.includes('-l')) {
            stageOutput = lines.length.toString();
          } else {
            const words = pipeData.split(/\s+/).filter(Boolean).length;
            const bytes = pipeData.length;
            stageOutput = `  ${lines.length}  ${words}  ${bytes}`;
          }
        } else {
          // Execute stage command collecting output
          await executeLinuxCommand(stageCmd, {
            ...params,
            silent: true,
            addLocalOutput: stageAddOutput
          });
        }

        if (stageError) {
          addLocalOutput('error', stageError);
          return;
        }
        pipeData = stageOutput;
      }

      if (pipeData) {
        addLocalOutput('output', pipeData);
      }
      return;
    }
  }

  // 2. Handle Output Redirection (> and >>) for any command (e.g., ifconfig > ifconfig.txt, ping 127.0.0.1 >> log.txt)
  if ((cleanCmd.includes(' > ') || cleanCmd.includes(' >> ') || cleanCmd.includes('>') || cleanCmd.includes('>>')) && !cleanCmd.startsWith('echo ')) {
    const isAppend = cleanCmd.includes('>>');
    const splitToken = isAppend ? '>>' : '>';
    const lastTokenIdx = cleanCmd.lastIndexOf(splitToken);
    const targetCmdStr = cleanCmd.substring(0, lastTokenIdx).trim();
    const targetFileArg = cleanCmd.substring(lastTokenIdx + splitToken.length).trim().split(/\s+/)[0];

    if (targetCmdStr && targetFileArg) {
      if (!params.silent) {
        addLocalOutput('command', rawCmd, linuxPrompt);
      }
      let capturedOut = '';
      let capturedErr = '';
      const redirectAddOutput = (type: OutputLine['type'], content: string) => {
        if (type === 'error') capturedErr += (capturedErr ? '\n' : '') + content;
        else capturedOut += (capturedOut ? '\n' : '') + content;
      };

      await executeLinuxCommand(targetCmdStr, {
        ...params,
        silent: true,
        addLocalOutput: redirectAddOutput
      });

      if (capturedErr) {
        addLocalOutput('error', capturedErr);
        return;
      }

      const fs = loadFs(deviceId);
      const targetPath = resolvePath(currentPath, targetFileArg);
      const existingContent = isAppend ? (readFile(fs, targetPath) || '') : '';
      const newContent = isAppend ? (existingContent ? `${existingContent}\n${capturedOut}` : capturedOut) : capturedOut;
      writeFile(fs, targetPath, newContent);
      saveFs(deviceId, fs);
      return;
    }
  }

  // Log command entry (unless running sub-command inside loop/script silently)
  if (!params.silent) {
    addLocalOutput('command', rawCmd, linuxPrompt);
  }

  if (command === 'clear') {
    setLinuxOutput([]);
    return;
  }

  // Shell variable assignment: NAME=value, export NAME=value
  const assignment = cleanCmd.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (assignment) {
    const vars = shellVariables.get(deviceId) || {};
    vars[assignment[1]] = assignment[2].replace(/^['"]|['"]$/g, '');
    shellVariables.set(deviceId, vars);
    return;
  }

  if (command === 'export') {
    const exportArg = args[0] || '';
    const exportMatch = exportArg.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (exportMatch) {
      const vars = shellVariables.get(deviceId) || {};
      vars[exportMatch[1]] = exportMatch[2].replace(/^['"]|['"]$/g, '');
      shellVariables.set(deviceId, vars);
    }
    return;
  }

  // Handle Bash For Loops (e.g., for i in 1 2 3; do ping 192.168.1.$i; done OR for i in {1..5}; do echo $i; done)
  if (cleanCmd.startsWith('for ')) {
    const forMatch = cleanCmd.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+?)\s*;\s*do\s+(.+?)\s*;\s*done$/i)
      || cleanCmd.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+?)\s*\n\s*do\s*\n\s*(.+?)\s*\n\s*done$/i);

    if (forMatch) {
      const varName = forMatch[1];
      const itemsRaw = forMatch[2].trim();
      const loopBody = forMatch[3].trim();

      let items: string[] = [];
      const rangeMatch = itemsRaw.match(/^\{(\d+)\.\.(\d+)\}$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        for (let n = start; n <= end; n++) items.push(n.toString());
      } else {
        items = itemsRaw.split(/\s+/).filter(Boolean);
      }

      for (const item of items) {
        // Replace $varName or ${varName} in body with current item value
        const subCmd = loopBody.replace(new RegExp(`\\$${varName}\\b|\\$\\{${varName}\\}`, 'g'), item);
        await executeLinuxCommand(subCmd, { ...params, silent: false });
      }
      return;
    }
  }

  // Handle Bash If Conditionals (e.g. if [ "$x" = "1" ]; then echo yes; else echo no; fi)
  if (cleanCmd.startsWith('if ')) {
    const ifMatch = cleanCmd.match(/^if\s+\[\s*(.+?)\s*\]\s*;\s*then\s+(.+?)(?:\s*;\s*elif\s+\[\s*(.+?)\s*\]\s*;\s*then\s+(.+?))?(?:\s*;\s*else\s+(.+?))?\s*;\s*fi$/i);
    if (ifMatch) {
      const cond = ifMatch[1].trim();
      const thenBody = ifMatch[2].trim();
      const elifCond = ifMatch[3]?.trim();
      const elifBody = ifMatch[4]?.trim();
      const elseBody = ifMatch[5]?.trim();

      // Simple condition evaluator
      let condResult = false;
      const eqMatch = cond.match(/^"?(.*?)"?\s*(==|=|!=)\s*"?(.*?)"?$/);
      if (eqMatch) {
        const left = eqMatch[1];
        const op = eqMatch[2];
        const right = eqMatch[3];
        if (op === '=' || op === '==') condResult = left === right;
        else if (op === '!=') condResult = left !== right;
      } else if (cond) {
        condResult = cond !== '0' && cond !== 'false';
      }

      let targetCmd = condResult ? thenBody : undefined;
      if (!targetCmd && elifCond) {
        const elifEq = elifCond.match(/^"?(.*?)"?\s*(==|=|!=)\s*"?(.*?)"?$/);
        const elifResult = elifEq ? (elifEq[2] === '!=' ? elifEq[1] !== elifEq[3] : elifEq[1] === elifEq[3]) : elifCond !== '0' && elifCond !== 'false';
        targetCmd = elifResult ? elifBody : elseBody;
      } else if (!targetCmd) targetCmd = elseBody;
      if (targetCmd) {
        await executeLinuxCommand(targetCmd, { ...params, silent: false });
      }
      return;
    }
  }

  if (command === 'help') {
    const helpText =
      `GNU Bash Simulator, version 5.2.15 (x86_64-pc-linux-gnu)
These shell commands are defined internally. Type 'help' to see this list.

  File System Commands:
    ls [-l] [-la]     List directory contents (long format, hidden files)
    pwd               Print current working directory
    cd <dir>          Change directory (e.g. cd ~, cd .., cd upload)
    cat <file>        Display content of a file
    nano / vim <file> Open file in Notepad text editor
    touch <file>      Create an empty file
    mkdir <dir>       Create a new directory
    rm <file>         Remove file or directory
    cp <src> <dest>   Copy file
    mv <src> <dest>   Move or rename file
    chmod <mode> <f>  Change file mode permissions (e.g. chmod +x, 755)
    grep [-i] [-c]    Search pattern in file or stream (e.g. grep inet, cat f | grep -i test)
    cmd > file        Redirect command output to file (overwrites or >> appends)
    cmd1 | cmd2       Pipe output from cmd1 as input to cmd2 (e.g. ifconfig | grep inet)
    echo "text" > f   Write or append (>>) text to file

  Network Commands:
    ifconfig / ip a   Display network interfaces & IP configurations
    ip route          Display IP routing table
    ping <host>       Send ICMP Echo requests to target IP/hostname
    traceroute <host> Trace network packet route to destination
    nslookup <domain> Perform DNS lookup for domain name
    netstat / arp     Display network statistics & ARP cache
    ftp <server>      Connect to remote FTP server
    ssh <user@host>   Connect securely to remote host via SSH
    telnet <host>     Connect to remote host via Telnet

  System & Execution:
    whoami            Display current user
    hostname <name>   Display or change system hostname (e.g. hostname aa)
    uname [-a]        Print system kernel & OS information
    date / uptime     Print current date & system uptime / load
    history           Display list of previously executed commands
    for i in ...; do  Bash for loop execution (e.g. for i in 1 2 3; do ping -n 1 192.168.1.$i; done)
    if [ cond ]; then Bash conditional branching execution (if/elif/else)
    python3 <file.py> Execute Python script on PC file system
    clear             Clear terminal screen output`;
    addLocalOutput('output', helpText);
    return;
  }

  if (command === 'whoami') {
    addLocalOutput('output', isSudo ? 'root' : 'user');
    return;
  }

  // Text editor command (nano, vim, vi, edit, notepad -> opens Notepad editor modal)
  if (command === 'nano' || command === 'vim' || command === 'vi' || command === 'notepad') {
    const rawFileName = args.join(' ').trim();
    const fileName = rawFileName || 'new_file.txt';
    const fs = loadFs(deviceId);
    const targetPath = resolvePath(currentPath, fileName);
    const existingContent = rawFileName ? (readFile(fs, targetPath) ?? '') : '';
    if (setEditingFile) {
      setEditingFile({ path: targetPath, content: existingContent });
    }
    addLocalOutput('output', rawFileName ? `Opening text editor for ${fileName}...` : `Opening empty text editor (${fileName})...`);
    return;
  }

  // Fully functional hostname command (hostname or hostname <name> or hostnamectl set-hostname <name>)
  if (command === 'hostname' || command === 'hostnamectl') {
    const targetName = command === 'hostnamectl' && args[0] === 'set-hostname' ? args[1] : args[0];
    if (targetName) {
      const newHostname = targetName.trim().slice(0, 20);
      if (setPcHostname) {
        setPcHostname(newHostname);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('update-topology-device-config', {
          detail: {
            deviceId,
            config: { name: newHostname }
          }
        }));
      }
      addLocalOutput('success', `Hostname set to ${newHostname}`);
    } else {
      addLocalOutput('output', internalPcHostname);
    }
    return;
  }

  if (command === 'uname') {
    if (args.includes('-a')) {
      addLocalOutput('output', `Linux ${internalPcHostname.toLowerCase()}`);
    } else {
      addLocalOutput('output', 'Linux');
    }
    return;
  }

  if (command === 'pwd') {
    addLocalOutput('output', formatWinToUnixPath(currentPath));
    return;
  }

  if (command === 'history') {
    const historyList = params.linuxHistory || [];
    if (historyList.length === 0) {
      addLocalOutput('output', '   1  history');
    } else {
      // Reverse array so oldest commands are at top (standard history order)
      const formatted = [...historyList].reverse().map((hCmd, idx) => ` ${(idx + 1).toString().padStart(4)}  ${hCmd}`).join('\n');
      addLocalOutput('output', formatted);
    }
    return;
  }

  if (command === 'chmod' || command === 'chown') {
    if (args.length < 2) {
      addLocalOutput('error', `${command}: missing operand`);
      return;
    }
    const modeOrOwner = args[0];
    const targetFile = args[1];
    const fs = loadFs(deviceId);
    const targetPath = resolvePath(currentPath, targetFile);
    const node = getNode(fs, targetPath);
    if (!node) {
      addLocalOutput('error', `${command}: cannot access '${targetFile}': No such file or directory`);
      return;
    }

    if (command === 'chmod' && node.type === 'file') {
      const isGrantingX = modeOrOwner.includes('+x') || modeOrOwner === '755' || modeOrOwner === '777' || modeOrOwner === '700' || modeOrOwner === '750';
      const isRemovingX = modeOrOwner.includes('-x') || modeOrOwner === '644' || modeOrOwner === '600' || modeOrOwner === '400';
      if (isGrantingX) {
        node.isExecutable = true;
        saveFs(deviceId, fs);
      } else if (isRemovingX) {
        node.isExecutable = false;
        saveFs(deviceId, fs);
      }
    }
    addLocalOutput('output', '');
    return;
  }

  if (command === 'date') {
    addLocalOutput('output', new Date().toUTCString());
    return;
  }

  if (command === 'uptime') {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    addLocalOutput('output', ` ${timeStr} up 2:15,  1 user,  load average: 0.04, 0.03, 0.00`);
    return;
  }

  // Handle echo & file redirection (e.g. echo "hello" > test.txt)
  if (command === 'echo') {
    const redirGtIdx = args.indexOf('>');
    const redirAgtIdx = args.indexOf('>>');
    if (redirGtIdx !== -1 || redirAgtIdx !== -1) {
      const isAppend = redirAgtIdx !== -1;
      const splitIdx = isAppend ? redirAgtIdx : redirGtIdx;
      const textToEcho = args.slice(0, splitIdx).join(' ').replace(/^["']|["']$/g, '');
      const targetFileName = args[splitIdx + 1];
      if (!targetFileName) {
        addLocalOutput('error', 'bash: syntax error near unexpected token \'newline\'');
        return;
      }
      const fs = loadFs(deviceId);
      const targetPath = resolvePath(currentPath, targetFileName);
      const existingContent = isAppend ? (readFile(fs, targetPath) || '') : '';
      const newContent = isAppend ? (existingContent ? `${existingContent}\n${textToEcho}` : textToEcho) : textToEcho;
      writeFile(fs, targetPath, newContent);
      saveFs(deviceId, fs);
      return;
    }

    addLocalOutput('output', args.join(' '));
    return;
  }

  // List directory contents using exact PC file system
  if (command === 'ls' || command === 'dir') {
    const fs = loadFs(deviceId);
    const flags = args.filter(a => a.startsWith('-')).join('').replace(/^-+/g, '');
    const targetArg = args.find(a => !a.startsWith('-')) || '';
    const isLong = flags.includes('l');
    const showAll = flags.includes('a');
    const humanSize = flags.includes('h');

    const targetWinPath = targetArg ? resolvePath(currentPath, targetArg) : currentPath;
    const targetNode = getNode(fs, targetWinPath);

    if (!targetNode) {
      addLocalOutput('error', `ls: cannot access '${targetArg || formatLinuxPath(currentPath)}': No such file or directory`);
      return;
    }

    if (targetNode.type === 'file') {
      addLocalOutput('output', targetArg || targetWinPath.split('\\').pop() || 'file');
      return;
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
          const d = new Date(child.modifiedAt);
          dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch { }
      }
      items.push({ name, isDir, isExec, size, modifiedAt: dateStr });
    });

    if (flags.includes('t')) items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    if (flags.includes('r')) items.reverse();
    if (isLong) {
      const formatted = items.map(item => {
        const perms = item.isDir ? 'drwxr-xr-x 2 user user' : (item.isExec ? '-rwxr-xr-x 1 user user' : '-rw-r--r-- 1 user user');
        const sizeText = humanSize && item.size >= 1024 ? `${(item.size / 1024).toFixed(1)}K` : item.size.toString();
        const sz = sizeText.padStart(6);
        return `${perms} ${sz} ${item.modifiedAt} ${item.name}`;
      }).join('\n');
      addLocalOutput('output', `total ${items.length * 4}\n${formatted}`);
    } else {
      const formatted = items.map(i => i.isDir ? `${i.name}/` : (i.isExec ? `${i.name}*` : i.name)).join('  ');
      addLocalOutput('output', formatted || '(empty)');
    }
    return;
  }

  // Change directory using resolvePath on PC file system
  if (command === 'cd') {
    const targetArg = args[0] || '~';
    if (targetArg === '~' || targetArg === '/home/user' || targetArg === '/') {
      setCurrentPath('C:\\');
      return;
    }
    if (targetArg === '..') {
      const parentPath = resolvePath(currentPath, '..');
      setCurrentPath(parentPath);
      return;
    }

    const fs = loadFs(deviceId);
    const targetWinPath = resolvePath(currentPath, targetArg);
    const targetNode = getNode(fs, targetWinPath);

    if (!targetNode) {
      addLocalOutput('error', `bash: cd: ${targetArg}: No such file or directory`);
      return;
    }

    if (targetNode.type !== 'dir') {
      addLocalOutput('error', `bash: cd: ${targetArg}: Not a directory`);
      return;
    }

    setCurrentPath(targetWinPath);
    return;
  }

  // Read file from PC file system
  if (command === 'cat') {
    const fileName = args[0];
    if (!fileName) {
      addLocalOutput('error', 'cat: missing file operand');
      return;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, fileName);
    const content = readFile(fs, fullPath);
    if (content !== null) {
      addLocalOutput('output', content);
    } else {
      addLocalOutput('error', `cat: ${fileName}: No such file or directory`);
    }
    return;
  }

  // Standalone grep command (e.g. grep "inet" config.txt, grep -i "test" file.txt)
  if (command === 'grep') {
    const isCaseInsensitive = args.some(a => a === '-i' || a === '-ic' || a === '-ci');
    const isCountOnly = args.some(a => a === '-c' || a === '-ic' || a === '-ci');
    const nonFlags = args.filter(a => !a.startsWith('-'));

    if (nonFlags.length < 1) {
      addLocalOutput('error', 'grep: option requires an argument');
      return;
    }

    const pattern = nonFlags[0].replace(/^["']|["']$/g, '');
    const fileArg = nonFlags[1];

    if (!fileArg) {
      addLocalOutput('error', 'grep: missing target file');
      return;
    }

    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, fileArg);
    const content = readFile(fs, fullPath);

    if (content === null) {
      addLocalOutput('error', `grep: ${fileArg}: No such file or directory`);
      return;
    }

    const lines = content.split(/\r?\n/);
    let regex: RegExp;
    try { regex = new RegExp(pattern, isCaseInsensitive ? 'i' : ''); }
    catch {
      addLocalOutput('error', `grep: invalid regular expression: ${pattern}`);
      return;
    }
    const matched = lines.filter(l => regex.test(l));

    if (isCountOnly) {
      addLocalOutput('output', matched.length.toString());
    } else {
      addLocalOutput('output', matched.join('\n'));
    }
    return;
  }

  // Create empty file in PC file system
  if (command === 'touch') {
    const fileName = args[0];
    if (!fileName) {
      addLocalOutput('error', 'touch: missing file operand');
      return;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, fileName);
    writeFile(fs, fullPath, '');
    saveFs(deviceId, fs);
    return;
  }

  // Create folder in PC file system
  if (command === 'mkdir') {
    const dirName = args.find(a => !a.startsWith('-'));
    if (!dirName) {
      addLocalOutput('error', 'mkdir: missing operand');
      return;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, dirName);
    if (!makeDir(fs, fullPath)) {
      addLocalOutput('error', `mkdir: cannot create directory '${dirName}'`);
      return;
    }
    saveFs(deviceId, fs);
    return;
  }

  // Remove file or folder in PC file system
  if (command === 'rm') {
    const recursive = args.some(a => a === '-r' || a === '-R');
    const force = args.includes('-f');
    const fileName = args.filter(a => !a.startsWith('-'))[0];
    if (!fileName) {
      addLocalOutput('error', 'rm: missing operand');
      return;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, fileName);
    const node = getNode(fs, fullPath);
    if (!node) {
      if (force) return;
      addLocalOutput('error', `rm: cannot remove '${fileName}': No such file or directory`);
      return;
    }
    const removed = node.type === 'dir'
      ? (recursive ? removeTree(fs, fullPath) : removeDir(fs, fullPath))
      : deleteFile(fs, fullPath);
    if (!removed) {
      addLocalOutput('error', `rm: cannot remove '${fileName}': ${node.type === 'dir' ? 'Is a directory or directory is not empty' : 'Operation not permitted'}`);
      return;
    }
    saveFs(deviceId, fs);
    return;
  }

  // Copy file in PC file system
  if (command === 'cp') {
    const [src, dest] = args;
    if (!src || !dest) {
      addLocalOutput('error', 'cp: missing file operand');
      return;
    }
    const fs = loadFs(deviceId);
    const srcPath = resolvePath(currentPath, src);
    const destPath = resolvePath(currentPath, dest);
    if (copyFile(fs, srcPath, destPath)) {
      saveFs(deviceId, fs);
    } else {
      addLocalOutput('error', `cp: cannot stat '${src}': No such file or directory`);
    }
    return;
  }

  // Move / Rename file in PC file system
  if (command === 'mv') {
    const [src, dest] = args;
    if (!src || !dest) {
      addLocalOutput('error', 'mv: missing file operand');
      return;
    }
    const fs = loadFs(deviceId);
    const srcPath = resolvePath(currentPath, src);
    const destPath = resolvePath(currentPath, dest);
    if (moveNode(fs, srcPath, destPath)) {
      saveFs(deviceId, fs);
    } else {
      addLocalOutput('error', `mv: cannot stat '${src}': No such file or directory`);
    }
    return;
  }

  // Execute Shell / Bash / Direct executable scripts on PC file system
  if (command === 'bash' || command === 'sh' || command.startsWith('./') || command.startsWith('.\\')) {
    const scriptArg = (command === 'bash' || command === 'sh') ? args[0] : command;
    if (!scriptArg) {
      addLocalOutput('output', `GNU bash, version 5.2.15(1)-release (x86_64-pc-linux-gnu)`);
      return;
    }

    const fs = loadFs(deviceId);
    const scriptPath = resolvePath(currentPath, scriptArg);
    const node = getNode(fs, scriptPath);

    if (!node) {
      addLocalOutput('error', `bash: ${scriptArg}: No such file or directory`);
      return;
    }

    if (node.type === 'dir') {
      addLocalOutput('error', `bash: ${scriptArg}: Is a directory`);
      return;
    }

    // Direct invocation (./script.sh) requires executable permission unless explicit bash/sh or root (sudo)
    const isDirectExec = command.startsWith('./') || command.startsWith('.\\');
    if (isDirectExec && !isSudo) {
      const hasExecPerm = node.isExecutable !== undefined ? node.isExecutable : (scriptArg.endsWith('.sh') || scriptArg.endsWith('.py'));
      if (!hasExecPerm) {
        addLocalOutput('error', `bash: ${scriptArg}: Permission denied`);
        return;
      }
    }

    const content = node.content.trim();
    if (!content) return;

    // Check if it is a python script or has python shebang
    const isPython = scriptArg.endsWith('.py') || content.startsWith('#!/usr/bin/env python') || content.startsWith('#!/usr/bin/python');
    if (isPython) {
      const res = executePythonScript(content, args.slice(command === 'bash' || command === 'sh' ? 1 : 0), undefined, deviceId);
      if (res.error) addLocalOutput('error', res.error);
      else if (res.output) addLocalOutput('output', res.output);
      return;
    }

    // Process line by line for shell script commands
    const lines: string[] = [];
    let pending = '';
    for (const sourceLine of content.split(/\r?\n/)) {
      const line = sourceLine.trim();
      if (line.endsWith('\\')) pending += line.slice(0, -1) + ' ';
      else { lines.push(pending + line); pending = ''; }
    }
    if (pending) lines.push(pending);
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      await executeLinuxCommand(trimmedLine, params);
    }
    return;
  }

  // Execute Python scripts on PC file system
  if (command === 'python' || command === 'python3') {
    const scriptArg = args[0];
    if (!scriptArg) {
      addLocalOutput('output', `Python 3.11.4 (main, Jun 2026)\nType "exit()" or "quit()" for interactive python.`);
      return;
    }
    if (scriptArg === '-c') {
      const codeToRun = args.slice(1).join(' ').replace(/^["']|["']$/g, '');
      const res = executePythonScript(codeToRun, [], undefined, deviceId);
      if (res.error) addLocalOutput('error', res.error);
      else if (res.output) addLocalOutput('output', res.output);
      return;
    }

    const fs = loadFs(deviceId);
    const scriptPath = resolvePath(currentPath, scriptArg);
    const scriptContent = readFile(fs, scriptPath);
    if (scriptContent !== null) {
      const res = executePythonScript(scriptContent, [], undefined, deviceId);
      if (res.error) addLocalOutput('error', res.error);
      else if (res.output) addLocalOutput('output', res.output);
    } else {
      addLocalOutput('error', `python: can't open file '${scriptArg}': No such file or directory`);
    }
    return;
  }

  // Network commands
  if (command === 'ifconfig') {
    const ifconfigOut =
      `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${pcIP}  netmask ${pcSubnet}  broadcast ${pcGateway || '0.0.0.0'}
        inet6 ${pcIPv6 || 'fe80::1'}  prefixlen 64  scopeid 0x20<link>
        ether ${pcMAC}  txqueuelen 1000  (Ethernet)
        RX packets 1542  bytes 134210 (134.2 KB)
        TX packets 1204  bytes 105820 (105.8 KB)

${wifiEnabled ? `wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${pcIP}  netmask ${pcSubnet}
        ether ${pcMAC}  txqueuelen 1000  (Wireless)
` : ''}lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)`;
    addLocalOutput('output', ifconfigOut);
    return;
  }

  if (command === 'ip') {
    const sub = args[0]?.toLowerCase();
    if (sub === 'a' || sub === 'addr' || sub === 'address') {
      const ipOut =
        `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
    inet6 ::1/128 scope host
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default
    link/ether ${pcMAC} brd ff:ff:ff:ff:ff:ff
    inet ${pcIP}/${pcSubnet === '255.255.255.0' ? '24' : '16'} brd ${pcGateway || '0.0.0.0'} scope global eth0
    inet6 ${pcIPv6 || 'fe80::1'}/64 scope link`;
      addLocalOutput('output', ipOut);
      return;
    }
    if (sub === 'route' || sub === 'r') {
      addLocalOutput('output', `default via ${pcGateway} dev eth0 proto dhcp src ${pcIP} metric 100\n127.0.0.0/8 dev lo scope link\n${pcIP.replace(/\.\d+$/, '.0')}/24 dev eth0 proto kernel scope link src ${pcIP}`);
      return;
    }
    if (sub === 'neigh' || sub === 'n') {
      addLocalOutput('output', `${pcGateway} dev eth0 lladdr 00:1a:2b:3c:4d:5e REACHABLE`);
      return;
    }
    addLocalOutput('output', 'Usage: ip [ addr | route | neigh ]');
    return;
  }

  if (command === 'ping') {
    const rawTarget = args.find(a => !a.startsWith('-'));
    if (!rawTarget) {
      addLocalOutput('error', 'ping: usage error: Destination address required');
      return;
    }
    let targetIp = rawTarget;
    const resolved = resolveDeviceNameTargetCallback(rawTarget);
    if (resolved) targetIp = resolved.ip;

    const isLoopback = targetIp.startsWith('127.') || targetIp === '::1' || targetIp.toLowerCase() === 'localhost';
    const reachable = isLoopback || canReachTargetIp(targetIp);
    if (reachable) {
      const out =
        `PING ${rawTarget} (${targetIp}) 56(84) bytes of data.
64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.82 ms
64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.79 ms
64 bytes from ${targetIp}: icmp_seq=3 ttl=64 time=0.81 ms
64 bytes from ${targetIp}: icmp_seq=4 ttl=64 time=0.76 ms

--- ${rawTarget} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 0.76/0.80/0.84/0.03 ms`;
      addLocalOutput('output', out);
    } else {
      const out =
        `PING ${rawTarget} (${targetIp}) 56(84) bytes of data.
From ${pcIP || '127.0.0.1'} icmp_seq=1 Destination Host Unreachable
From ${pcIP || '127.0.0.1'} icmp_seq=2 Destination Host Unreachable

--- ${rawTarget} ping statistics ---
4 packets transmitted, 0 received, +2 errors, 100% packet loss, time 3008ms`;
      addLocalOutput('error', out);
    }
    return;
  }

  if (command === 'traceroute' || command === 'tracert') {
    const rawTarget = args.find(a => !a.startsWith('-'));
    if (!rawTarget) {
      addLocalOutput('error', 'traceroute: usage error: Destination required');
      return;
    }
    let targetIp = rawTarget;
    const resolved = resolveDeviceNameTargetCallback(rawTarget);
    if (resolved) targetIp = resolved.ip;

    const reachable = canReachTargetIp(targetIp);
    if (reachable) {
      const out =
        `traceroute to ${rawTarget} (${targetIp}), 30 hops max, 60 byte packets
 1  ${pcGateway || '192.168.1.1'} (${pcGateway || '192.168.1.1'})  0.892 ms  0.781 ms  0.745 ms
 2  ${targetIp} (${targetIp})  1.234 ms  1.102 ms  1.089 ms`;
      addLocalOutput('output', out);
    } else {
      const out =
        `traceroute to ${rawTarget} (${targetIp}), 30 hops max, 60 byte packets
 1  ${pcGateway || '192.168.1.1'} (${pcGateway || '192.168.1.1'})  0.892 ms  0.781 ms  0.745 ms
 2  * * *
 3  * * *`;
      addLocalOutput('error', out);
    }
    return;
  }

  if (command === 'nslookup') {
    const domain = args[0] || 'google.com';
    const out =
      `Server:		${pcDNS || '8.8.8.8'}
Address:	${pcDNS || '8.8.8.8'}#53

Non-authoritative answer:
Name:	${domain}
Address: 142.250.180.206`;
    addLocalOutput('output', out);
    return;
  }

  if (command === 'netstat' || command === 'arp') {
    addLocalOutput('output', `Address                  HWtype  HWaddress           Flags Mask            Iface\n${pcGateway || '192.168.1.1'}          ether   00:11:22:33:44:55   C                     eth0`);
    return;
  }

  if (command === 'ftp' || command === 'ssh' || command === 'telnet') {
    if (params.executeCommand) {
      await params.executeCommand(cleanCmd);
      return;
    }
  }

  // Command not recognized
  addLocalOutput('error', `bash: ${command}: command not found`);
}
