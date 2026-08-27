import type { OutputLine } from './PCPanel.types';
import {
  loadFs, saveFs, readFile, writeFile, deleteFile, makeDir, getNode, resolvePath, copyFile, moveNode
} from './pcFileSystem';
import { executePythonScript } from './pcPythonRunner';

export interface LinuxExecutorParams {
  deviceId: string;
  internalPcHostname: string;
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
}

export const LINUX_SUGGESTIONS = [
  'ls', 'ls -l', 'ls -la', 'pwd', 'cd', 'cat', 'touch', 'mkdir', 'rm', 'cp', 'mv',
  'ifconfig', 'ip addr', 'ping', 'traceroute', 'nslookup', 'netstat', 'arp',
  'whoami', 'hostname', 'uname -a', 'clear', 'echo', 'sudo', 'help', 'date', 'uptime',
  'python3', 'python'
];

export function formatLinuxPath(winPath: string): string {
  if (!winPath || winPath === 'C:\\') return '~';
  const clean = winPath.replace(/^C:\\?/i, '').replace(/\\/g, '/');
  return clean ? `~/${clean}` : '~';
}

export function formatWinToUnixPath(winPath: string): string {
  if (!winPath || winPath === 'C:\\') return '/home/user';
  const clean = winPath.replace(/^C:\\?/i, '').replace(/\\/g, '/');
  return `/home/user/${clean}`;
}

export async function executeLinuxCommand(
  cmdLine: string,
  params: LinuxExecutorParams
): Promise<void> {
  const {
    deviceId,
    internalPcHostname,
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

  const rawCmd = cmdLine.trim();
  if (!rawCmd) return;

  const isSudo = rawCmd.startsWith('sudo ');
  const cleanCmd = isSudo ? rawCmd.substring(5).trim() : rawCmd;
  const parts = cleanCmd.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  const linuxPrompt = `${isSudo ? 'root' : 'user'}@${internalPcHostname.toLowerCase()}:${formatLinuxPath(currentPath)}${isSudo ? '#' : '$'}`;

  // Log command entry
  addLocalOutput('command', rawCmd, linuxPrompt);

  if (command === 'clear') {
    setLinuxOutput([]);
    return;
  }

  if (command === 'help') {
    const helpText =
`These shell commands are defined internally. Type 'help' to see this list.

  File Commands:       ls, pwd, cd, cat, touch, mkdir, rm, cp, mv
  Network Commands:    ifconfig, ip, ping, traceroute, nslookup, netstat, arp
  System Commands:     whoami, hostname, uname, date, uptime, clear, echo, sudo, python3`;
    addLocalOutput('output', helpText);
    return;
  }

  if (command === 'whoami') {
    addLocalOutput('output', isSudo ? 'root' : 'user');
    return;
  }

  if (command === 'hostname') {
    addLocalOutput('output', internalPcHostname.toLowerCase());
    return;
  }

  if (command === 'uname') {
    if (args.includes('-a')) {
      addLocalOutput('output', `Linux ${internalPcHostname.toLowerCase()} 6.1.0-28-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.119-1 (2026-08-27) x86_64 GNU/Linux`);
    } else {
      addLocalOutput('output', 'Linux');
    }
    return;
  }

  if (command === 'pwd') {
    addLocalOutput('output', formatWinToUnixPath(currentPath));
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
    const flags = args.filter(a => a.startsWith('-')).join('');
    const targetArg = args.find(a => !a.startsWith('-')) || '';
    const isLong = flags.includes('l');
    const showAll = flags.includes('a');

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

    const items: { name: string; isDir: boolean; size: number; modifiedAt: string }[] = [];

    if (showAll) {
      items.push({ name: '.', isDir: true, size: 4096, modifiedAt: 'Aug 27 12:00' });
      items.push({ name: '..', isDir: true, size: 4096, modifiedAt: 'Aug 27 12:00' });
    }

    Object.entries(targetNode.children).forEach(([name, child]) => {
      const isDir = child.type === 'dir';
      const size = child.type === 'file' ? (child.size || child.content.length || 0) : 4096;
      let dateStr = 'Aug 27 12:00';
      if (child.modifiedAt) {
        try {
          const d = new Date(child.modifiedAt);
          dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch { }
      }
      items.push({ name, isDir, size, modifiedAt: dateStr });
    });

    if (isLong) {
      const formatted = items.map(item => {
        const perms = item.isDir ? 'drwxr-xr-x 2 user user' : '-rw-r--r-- 1 user user';
        const sz = item.size.toString().padStart(6);
        return `${perms} ${sz} ${item.modifiedAt} ${item.name}`;
      }).join('\n');
      addLocalOutput('output', `total ${items.length * 4}\n${formatted}`);
    } else {
      const formatted = items.map(i => i.isDir ? `${i.name}/` : i.name).join('  ');
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
  if (command === 'cat' || command === 'type') {
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
    const dirName = args[0];
    if (!dirName) {
      addLocalOutput('error', 'mkdir: missing operand');
      return;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, dirName);
    makeDir(fs, fullPath);
    saveFs(deviceId, fs);
    return;
  }

  // Remove file or folder in PC file system
  if (command === 'rm') {
    const fileName = args.filter(a => !a.startsWith('-'))[0];
    if (!fileName) {
      addLocalOutput('error', 'rm: missing operand');
      return;
    }
    const fs = loadFs(deviceId);
    const fullPath = resolvePath(currentPath, fileName);
    const node = getNode(fs, fullPath);
    if (!node) {
      addLocalOutput('error', `rm: cannot remove '${fileName}': No such file or directory`);
      return;
    }
    deleteFile(fs, fullPath);
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
  if (command === 'ifconfig' || command === 'ipconfig') {
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

    const reachable = canReachTargetIp(targetIp);
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
From ${pcIP} icmp_seq=1 Destination Host Unreachable
From ${pcIP} icmp_seq=2 Destination Host Unreachable

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

  // Command not recognized
  addLocalOutput('error', `bash: ${command}: command not found`);
}
