'use client';

import { useCallback } from 'react';
import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';
import type { SwitchState } from '@/lib/network/types';
import type { OutputLine, FtpSession, PcFile, PCActiveTab } from './PCPanel.types';
import { checkConnectivity, getWirelessDistance } from '@/lib/network/connectivity';
import { dispatchCapturedPackets } from '../../../utils/packetCapture';
import { getL3Hops } from '@/lib/network/routing';
import { errorHandler, DHCP_ERRORS, DEVICE_ERRORS } from '@/lib/errors/errorHandler';
import { formatMacForArp } from './pcPanelHelpers';

export interface UsePCPanelCommandsParams {
  activeTabRef: React.MutableRefObject<PCActiveTab>;
  applyDhcpLeaseRef: React.MutableRefObject<((force?: boolean) => { ip: string; subnetMask: string; gateway: string; dns: string; serverName: string; poolName: string } | null) | null>;
  input: string;
  desktopHistory: string[];
  setDesktopHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setDesktopHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  consoleHistory: string[];
  setConsoleHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setShowAutocomplete: React.Dispatch<React.SetStateAction<boolean>>;
  setAutocompleteIndex: React.Dispatch<React.SetStateAction<number>>;
  setAutocompleteNavigated: React.Dispatch<React.SetStateAction<boolean>>;
  ftpSession: FtpSession | null;
  setFtpSession: React.Dispatch<React.SetStateAction<FtpSession | null>>;
  pcLocalFiles: PcFile[];
  setPcLocalFiles: React.Dispatch<React.SetStateAction<PcFile[]>>;
  setIsFtpFilePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pcIP: string;
  setPcIP: React.Dispatch<React.SetStateAction<string>>;
  pcSubnet: string;
  pcMAC: string;
  pcGateway: string;
  pcDNS: string;
  pcIPv6: string;
  internalPcHostname: string;
  ipConfigMode: string;
  deviceId: string;
  language: string;
  t: Record<string, string>;
  topologyDevices: CanvasDevice[];
  topologyConnections: { sourceDeviceId: string; sourcePort: string; targetDeviceId: string; targetPort: string; cableType?: string; active?: boolean }[];
  deviceStates: Map<string, SwitchState> | undefined;
  deviceFromTopology: CanvasDevice | undefined;
  isCmdInputDisabled: boolean;
  isConsoleInputDisabled: boolean;
  connectionErrorText: string;
  isConsoleConnected: boolean;
  connectedDeviceId: string | null;
  setConnectedDeviceId: React.Dispatch<React.SetStateAction<string | null>>;
  setConsoleConnectionTime: React.Dispatch<React.SetStateAction<number>>;
  setIsConsoleConnected: React.Dispatch<React.SetStateAction<boolean>>;
  wifiEnabled: boolean;
  consoleNeedsPassword: boolean;
  consoleConfirmDialog: { show: boolean; message: string } | null;
  consoleReloadPending: boolean;
  serviceHttpEnabled: boolean;
  serviceDnsEnabled: boolean;
  serviceDhcpEnabled: boolean;
  onUpdatePCHistory?: (deviceId: string, history: string[]) => void;
  onExecuteDeviceCommand?: (deviceId: string, command: string) => Promise<unknown>;
  onNavigate?: (tab: PCActiveTab) => void;
  onClose: () => void;
  setActiveTab: React.Dispatch<React.SetStateAction<PCActiveTab>>;
  setPcOutput: React.Dispatch<React.SetStateAction<OutputLine[]>>;
  addLocalOutput: (type: OutputLine['type'], content: string, prompt?: string) => void;
  addMultilineOutput: (type: OutputLine['type'], content: string, delayMs?: number) => Promise<void>;
  resolveDeviceNameTargetCallback: (raw: string) => { ip: string; label?: string } | null;
  resolveDomainWithDnsServicesCallback: (domain: string) => { address: string; server: { name: string; ip: string } } | null;
  hasGatewayForTargetCallback: (targetIp: string) => boolean;
  isLoopbackTarget: (target: string) => boolean;
  isValidIpv4: (value: string) => boolean;
  isValidIpv6: (value: string) => boolean;
  canReachTargetIp: (targetIp: string, options?: { protocol?: 'tcp' | 'udp' | 'icmp' | 'any'; port?: string }) => boolean;
  normalizeLookupTargetCallback: (raw: string) => string;
  buildArpTableOutput: () => string;
  addPcArpEntry?: (targetIp: string, targetMac: string, isIot?: boolean) => void;
  removePcArpEntry?: (targetIp: string) => void;
  clearPcArpTable?: () => void;
  openWebPage: (url: string, target?: string) => void;
  setPcHostname: (hostname: string) => void;
}

// ---------------------------------------------------------------------------
// Helper: apply a Windows-style pipe filter to multi-line output
// Supports: find /i "pattern", findstr /i "pattern", grep -i pattern
// ---------------------------------------------------------------------------
function applyPcPipeFilter(output: string, pipeExpr: string): string {
  // find [/i] "term"  OR  findstr [/i] [/v] "term"  OR  grep [-i] [-v] term
  const m = pipeExpr.match(
    /^(?:find(?:str)?|grep)\s+((?:\/[ivIV]\s+)*)("[^"]*"|'[^']*'|\S+)/i
  );
  if (!m) return output; // unrecognised pipe – pass through unchanged

  const flags = m[1].toLowerCase();
  const rawTerm = m[2].replace(/^["']|["']$/g, ''); // strip surrounding quotes
  const caseInsensitive = flags.includes('/i') || flags.includes('-i');
  const invert = flags.includes('/v') || flags.includes('-v');

  const lines = output.split('\n');
  const filtered = lines.filter(line => {
    const haystack = caseInsensitive ? line.toLowerCase() : line;
    const needle = caseInsensitive ? rawTerm.toLowerCase() : rawTerm;
    const found = haystack.includes(needle);
    return invert ? !found : found;
  });
  return filtered.join('\n');
}

export function usePCPanelCommands(params: UsePCPanelCommandsParams) {
  const {
    activeTabRef,
    applyDhcpLeaseRef,
    input,
    desktopHistory,
    setDesktopHistory,
    setDesktopHistoryIndex,
    consoleHistory,
    setConsoleHistory,
    setConsoleHistoryIndex,
    setInput,
    setShowAutocomplete,
    setAutocompleteIndex,
    setAutocompleteNavigated,
    ftpSession,
    setFtpSession,
    pcLocalFiles,
    setPcLocalFiles,
    setIsFtpFilePickerOpen,
    pcIP,
    setPcIP,
    pcSubnet,
    pcMAC,
    pcGateway,
    pcDNS,
    pcIPv6,
    internalPcHostname,
    ipConfigMode,
    deviceId,
    language,
    t,
    topologyDevices,
    topologyConnections,
    deviceStates,
    deviceFromTopology,
    isCmdInputDisabled,
    isConsoleInputDisabled,
    connectionErrorText,
    isConsoleConnected,
    connectedDeviceId,
    setConnectedDeviceId,
    setConsoleConnectionTime,
    setIsConsoleConnected,
    wifiEnabled,
    consoleNeedsPassword,
    consoleConfirmDialog,
    consoleReloadPending,
    serviceHttpEnabled,
    serviceDnsEnabled,
    serviceDhcpEnabled,
    onUpdatePCHistory,
    onExecuteDeviceCommand,
    onNavigate,
    onClose,
    setActiveTab,
    setPcOutput,
    addLocalOutput,
    addMultilineOutput,
    resolveDeviceNameTargetCallback,
    resolveDomainWithDnsServicesCallback,
    hasGatewayForTargetCallback,
    isLoopbackTarget,
    isValidIpv4,
    isValidIpv6,
    canReachTargetIp,
    normalizeLookupTargetCallback,
    buildArpTableOutput,
    addPcArpEntry,
    removePcArpEntry,
    clearPcArpTable,
    openWebPage,
    setPcHostname,
  } = params;

  const executeFtpPut = useCallback((fileName: string) => {
    const session = ftpSession;
    if (!session) return;
    const newFile = { name: fileName, size: 1024, modifiedAt: new Date().toISOString() };
    const nextFiles = [...(session.files || []), newFile];
    setFtpSession({ ...session, files: nextFiles });

    if (session.targetDeviceId) {
      const targetDev = topologyDevices.find(d => d.id === session.targetDeviceId);
      if (targetDev) {
        window.dispatchEvent(new CustomEvent('update-topology-device-config', {
          detail: {
            deviceId: session.targetDeviceId,
            config: {
              services: {
                ...targetDev.services,
                ftp: {
                  ...targetDev.services?.ftp,
                  enabled: true,
                  files: [...((targetDev.services?.ftp?.files || []).filter((f: { name: string }) => f.name !== fileName)), newFile]
                }
              }
            }
          }
        }));
      }
    }

    addLocalOutput('output', `150 Opening BINARY mode data connection for ${fileName}\n226 Transfer complete.`);
  }, [ftpSession, addLocalOutput, topologyDevices, setFtpSession]);

  const handleFtpSessionCommand = useCallback((cmdLine: string) => {
    const session = ftpSession;
    if (!session) return;
    const cmd = cmdLine.trim().toLowerCase();
    if (cmd === 'quit' || cmd === 'bye' || cmd === 'exit') {
      addLocalOutput('output', '221 Goodbye.');
      setFtpSession(null);
      return;
    }
    if (cmd === 'help' || cmd === '?') {
      addLocalOutput('output', 'Commands: put, ls, dir, get <file>, quit, bye, exit');
      return;
    }
    if (cmd === 'ls' || cmd === 'dir') {
      const files = session.files;
      if (!files || files.length === 0) {
        addLocalOutput('output', '(empty)');
      } else {
        const list = files.map(f => `${f.name.padEnd(20)} ${(f.size || 0).toString().padStart(8)} bytes`).join('\n');
        addLocalOutput('output', list);
      }
      return;
    }
    const getMatch = cmdLine.trim().match(/^(get|recv|mget)\s+(.+)/i);
    if (getMatch) {
      const fileName = getMatch[2];
      const serverFile = session.files?.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      const localFile = { name: fileName, size: serverFile?.size || 0, modifiedAt: new Date().toISOString() };
      setPcLocalFiles(prev => {
        const updated = prev.filter(f => f.name !== fileName).concat(localFile);
        try { localStorage.setItem(`pc_files_${deviceId}`, JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
      addLocalOutput('output', `150 Opening BINARY mode data connection for ${fileName}\n226 Transfer complete.`);
      return;
    }
    const putMatch = cmdLine.trim().match(/^(put|send|mput)(?:\s+(.+))?$/i);
    if (putMatch) {
      if (putMatch[2]) {
        const fileName = putMatch[2];
        const localFile = pcLocalFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
        if (localFile) {
          executeFtpPut(localFile.name);
        } else {
          addLocalOutput('error', `Local file '${fileName}' not found.`);
        }
      } else {
        setIsFtpFilePickerOpen(true);
      }
      return;
    }
    addLocalOutput('output', '200 Command okay.');
  }, [ftpSession, addLocalOutput, topologyDevices, setFtpSession, deviceId, setIsFtpFilePickerOpen, pcLocalFiles, executeFtpPut, setPcLocalFiles]);

  const executeCommand = useCallback(async (cmdToExecute?: string) => {
    const command = (cmdToExecute || input).trim();
    if (!command) return;
    if ((activeTabRef.current === 'desktop' && isCmdInputDisabled) || (activeTabRef.current === 'terminal' && isConsoleInputDisabled)) {
      addLocalOutput('error', connectionErrorText || t.pcConnectionError);
      setInput('');
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pc-command-executed', {
        detail: { deviceId, command }
      }));
    }

    if (activeTabRef.current === 'desktop') {
      if (desktopHistory[0] !== command) {
        const newHistory = [command, ...desktopHistory].slice(0, 50);
        setDesktopHistory(newHistory);
        if (onUpdatePCHistory) onUpdatePCHistory(deviceId, newHistory);
      }
      setDesktopHistoryIndex(-1);
    } else if (activeTabRef.current === 'terminal') {
      if (consoleHistory[0] !== command) {
        const newHistory = [command, ...consoleHistory].slice(0, 50);
        setConsoleHistory(newHistory);
      }
      setConsoleHistoryIndex(-1);
    }
    setInput('');
    setShowAutocomplete(false);
    setAutocompleteIndex(-1);
    setAutocompleteNavigated(false);
    if (activeTabRef.current === 'desktop') {
      const baseCmd = command.split(' ')[0].toLowerCase();
      if (ftpSession && baseCmd !== 'ftp') {
        addLocalOutput('command', command, 'ftp>');
        handleFtpSessionCommand(command);
        return;
      }
      addLocalOutput('command', command);

      const tokens = command.split(/(&&|&)/).map(t => t.trim()).filter(Boolean);
      let skipNext = false;
      let skipUntilNextAmpersand = false;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '&&') continue;
        if (token === '&') {
          skipNext = false;
          skipUntilNextAmpersand = false;
          continue;
        }

        if (skipNext || skipUntilNextAmpersand) {
          const nextOp = i + 1 < tokens.length ? tokens[i + 1] : null;
          if (nextOp === '&&') skipNext = true;
          else if (nextOp === '&') { skipNext = false; skipUntilNextAmpersand = false; }
          else skipUntilNextAmpersand = true;
          continue;
        }

        // --- Pipe detection: split token at first '|' ---
        let activeToken = token;
        let pipeExpr: string | null = null;
        const pipeIdx = token.indexOf('|');
        if (pipeIdx !== -1) {
          activeToken = token.slice(0, pipeIdx).trim();
          pipeExpr = token.slice(pipeIdx + 1).trim();
        }

        // Pipe-aware output helpers — filter ALL command output when a pipe expression is present.
        // This means every command automatically supports  cmd | find /i "x"  without per-command changes.
        const emit = (type: OutputLine['type'], content: string, prompt?: string) =>
          addLocalOutput(type, pipeExpr ? applyPcPipeFilter(content, pipeExpr) : content, prompt);
        const emitMulti = async (type: OutputLine['type'], content: string, delayMs?: number) =>
          addMultilineOutput(type, pipeExpr ? applyPcPipeFilter(content, pipeExpr) : content, delayMs);

        const parts = activeToken.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        let cmdSuccess = true;

        if (cmd === 'echo') {
          emit('output', args.join(' '));
        } else if (cmd === 'ipconfig') {
          if (args.includes('/release')) {
            setPcIP('0.0.0.0');
            emit('success', 'IP address released successfully.');
          } else if (args.includes('/renew')) {
            try {
              const lease = applyDhcpLeaseRef.current?.() ?? null;
              if (lease && lease.serverName !== 'link-local') {
                emit('success', `DHCP lease acquired from ${lease.serverName}/${lease.poolName}. New IP: ${lease.ip}`);
              } else {
                emit('success', `No DHCP server/pool found. Assigned link-local IP: ${lease?.ip || '(pending)'}`);
              }
            } catch (err) {
              emit('error', 'DHCP renew failed. Please check network connection.');
              errorHandler.logError(DHCP_ERRORS.LEASE_FAILED({ deviceId, source: 'ipconfigRenew', error: String(err) }));
            }
          } else if (args.includes('/all')) {
            const ipConfigModeText = ipConfigMode === 'dhcp' ? 'Yes' : 'No';
            const ipconfigAllOut = `Windows IP Configuration\n\n   Host Name . . . . . . . . . . . . : ${internalPcHostname}\n   Primary Dns Suffix  . . . . . . . : \n   Node Type . . . . . . . . . . . . : Hybrid\n   IP Routing Enabled. . . . . . . : No\n   WINS Proxy Enabled. . . . . . . . : No\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . : \n   Description . . . . . . . . . . . : PRO/1000 MT Network Connection\n   Physical Address. . . . . . . . . : ${pcMAC}\n   DHCP Enabled. . . . . . . . . . . : ${ipConfigModeText}\n   Autoconfiguration Enabled . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : ${pcIP}(Preferred)\n   Subnet Mask . . . . . . . . . . . : ${pcSubnet}\n   Default Gateway . . . . . . . . . : ${pcGateway}\n   DNS Servers . . . . . . . . . . . : ${pcDNS}\n   IPv6 Address. . . . . . . . . . . : ${pcIPv6}(Preferred)\n   NetBIOS over Tcpip. . . . . . . . : Enabled\n\n${wifiEnabled ? `Ethernet adapter Wireless Network Connection:\n\n   Connection-specific DNS Suffix  . : \n   Description . . . . . . . . . . . : Wireless WiFi Link 4965AGN\n   Physical Address. . . . . . . . . : ${pcMAC}\n   DHCP Enabled. . . . . . . . . . . : ${ipConfigModeText}\n   Autoconfiguration Enabled . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : ${pcIP}(Preferred)\n   Subnet Mask . . . . . . . . . . . : ${pcSubnet}\n   Default Gateway . . . . . . . . . : ${pcGateway}\n   DNS Servers . . . . . . . . . . . : ${pcDNS}\n   IPv6 Address. . . . . . . . . . . : ${pcIPv6}(Preferred)\n   NetBIOS over Tcpip. . . . . . . . : Enabled\n\n` : ''}`;
            await emitMulti('output', ipconfigAllOut, 80);
          } else {
            const ipconfigOut = `OS IP Configuration\n\nEthernet adapter Ethernet connection:\n   IPv4 Address. . . . . . . . . . . : ${pcIP}\n   Subnet Mask . . . . . . . . . . . : ${pcSubnet}\n   Default Gateway . . . . . . . . . : ${pcGateway}\n   IPv6 Address. . . . . . . . . . . : ${pcIPv6}`;
            await emitMulti('output', ipconfigOut, 80);
          }
        } else if (cmd === 'ping') {
          // Windows ping flags: -n count, -l size, -w timeout, -a, -t, -4, -6
          let count = 4;
          let bufferSize = 32;
          let resolveNames = false;
          let continuous = false;
          let ipFamily: '4' | '6' | null = null;
          let target: string | undefined;

          for (let ai = 0; ai < args.length; ai++) {
            const a = args[ai].toLowerCase();
            if (a === '-n') { count = parseInt(args[ai + 1], 10) || 4; ai++; }
            else if (a === '-l') { bufferSize = parseInt(args[ai + 1], 10) || 32; ai++; }
            else if (a === '-w') { ai++; } // timeout accepted; not simulated
            else if (a === '-a') { resolveNames = true; }
            else if (a === '-t') { continuous = true; }
            else if (a === '-6') { ipFamily = '6'; }
            else if (a === '-4') { ipFamily = '4'; }
            else if (target === undefined) { target = args[ai]; }
          }

          if (!target) {
            emit('output', 'Usage: ping [-n count] [-l size] [-w timeout] [-a] [-t] [-4|-6] <target_name_or_address>');
          } else {
            let targetIp = target;
            let dnsResolved = false;
            let hostnameLabel = target;

            const namedResult = resolveDeviceNameTargetCallback(target);
            if (namedResult) {
              targetIp = namedResult.ip;
              dnsResolved = true;
            }

            if (!isValidIpv4(targetIp) && !isValidIpv6(targetIp)) {
              const dnsResult = resolveDomainWithDnsServicesCallback(target);
              if (dnsResult) {
                targetIp = dnsResult.address;
                dnsResolved = true;
              } else {
                emit('output', `Ping request could not find host ${target}. Please check the name and try again.`);
                return;
              }
            }

            if (ipFamily === '6' && !isValidIpv6(targetIp)) {
              emit('output', 'General failure. This address family is not supported for the request.');
              return;
            }
            if (ipFamily === '4' && !isValidIpv4(targetIp)) {
              emit('output', 'General failure. This address family is not supported for the request.');
              return;
            }

            if (resolveNames && (isValidIpv4(targetIp) || isValidIpv6(targetIp))) {
              const matched = topologyDevices.find(d =>
                (d.ip && d.ip.toLowerCase() === targetIp.toLowerCase()) ||
                (d.ipv6 && d.ipv6.toLowerCase() === targetIp.toLowerCase())
              );
              if (matched && matched.name) {
                hostnameLabel = matched.name;
                dnsResolved = true;
              }
            }

            const replyCount = continuous ? Math.max(count, 12) : count;
            const pingTargetDisplay = dnsResolved ? `${hostnameLabel} [${targetIp.toLowerCase()}]` : targetIp.toLowerCase();

            const sendBatch = async (packets: number) => {
              if (isLoopbackTarget(targetIp)) {
                const replies: string[] = [];
                for (let i = 0; i < packets; i++) {
                  replies.push(`Reply from 127.0.0.1: bytes=${bufferSize} time<1ms TTL=128`);
                }
                await emitMulti('output', `Pinging ${pingTargetDisplay} with ${bufferSize} bytes of data:\n${replies.join('\n')}\n\nPing statistics for ${pingTargetDisplay}:\n    Packets: Sent = ${packets}, Received = ${packets}, Lost = 0 (0% loss)`, 100);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('pc-command-executed', {
                    detail: { deviceId, command, output: 'Reply from 127.0.0.1' }
                  }));
                }
                return;
              }

              const result = checkConnectivity(deviceId, targetIp, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map(), language as 'tr' | 'en', { protocol: 'icmp' });

              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pc-command-executed', {
                  detail: { deviceId, command, output: result.success ? 'Reply from' : 'timed out' }
                }));
              }

              dispatchCapturedPackets(result.capturedPackets);

              if (result.success) {
                const targetDevice = result.targetId ? topologyDevices.find(d => d.id === result.targetId) : undefined;
                if (targetDevice && targetDevice.macAddress) {
                  addPcArpEntry?.(targetIp, targetDevice.macAddress, targetDevice.type === 'iot');
                }

                const srcDist = getWirelessDistance(deviceFromTopology, topologyDevices, deviceStates);
                const dstDist = getWirelessDistance(targetDevice, topologyDevices, deviceStates);

                const srcWired = srcDist === Infinity;
                const dstWired = dstDist === Infinity;
                const effectiveDist = (srcWired ? 0 : srcDist) + (dstWired ? 0 : dstDist);
                const allWired = srcWired && dstWired;

                const generatePingTime = () => {
                  if (allWired) return 0;
                  const base = Math.exp(effectiveDist / 130);
                  return Math.max(1, Math.round(base * (1 + (Math.random() * 0.16 - 0.08))));
                };

                const formatTime = (ms: number) => ms === 0 ? '<1ms' : `${ms}ms`;

                const replies: string[] = [];
                for (let i = 0; i < packets; i++) {
                  const time = generatePingTime();
                  replies.push(`Reply from ${targetIp.toLowerCase()}: bytes=${bufferSize} time=${formatTime(time)} TTL=128`);
                }
                await emitMulti('output', `Pinging ${pingTargetDisplay} with ${bufferSize} bytes of data:\n${replies.join('\n')}\n\nPing statistics for ${pingTargetDisplay}:\n    Packets: Sent = ${packets}, Received = ${packets}, Lost = 0 (0% loss)`, 100);
              } else {
                cmdSuccess = false;
                const timeouts = Array(packets).fill('\nRequest timed out.').join('');
                await emitMulti('output', `Pinging ${pingTargetDisplay} with ${bufferSize} bytes of data:${timeouts}\n\nPing statistics for ${pingTargetDisplay}:\n    Packets: Sent = ${packets}, Received = 0, Lost = ${packets} (100% loss)`, 100);
              }
            };

            await sendBatch(replyCount);
          }
        } else if (cmd === 'nslookup') {
          const typeFlagIdx = args.findIndex(a => /^-type=/i.test(a));
          const queryType = typeFlagIdx !== -1 ? (args[typeFlagIdx].split('=')[1] || 'A').toUpperCase() : 'A';
          const positional = args.filter(a => !a.startsWith("-"));
          const rawTargetDomain = positional[0] ?? '';
          const queryServer = positional[1] ?? pcDNS;
          const targetDomain = rawTargetDomain ? normalizeLookupTargetCallback(rawTargetDomain) : '';
          const isTargetIp = isValidIpv4(targetDomain) || isValidIpv6(targetDomain);

          if (!targetDomain) {
            emit('output', 'Usage: nslookup [-type=A|AAAA|CNAME|MX|NS|PTR|TXT] <domain|ip> [server]');
          } else if (isTargetIp) {
            // Reverse lookup (PTR)
            const reverseMatch = topologyDevices.find(d => d.ip === targetDomain || d.ipv6 === targetDomain);
            if (reverseMatch?.name) {
              await emitMulti('output', `Server:  ${queryServer}\nAddress: ${queryServer}\n\nName:    ${reverseMatch.name}\nAddress: ${targetDomain}`, 80);
            } else {
              await emitMulti('output', `Server:  ${queryServer}\nAddress: ${queryServer}\n\n*** Can't find ${targetDomain}: Non-existent domain`, 80);
            }
          } else if (resolveDeviceNameTargetCallback(targetDomain)) {
            const resolved = resolveDeviceNameTargetCallback(targetDomain) as { ip: string; label: string };
            const devMatch = topologyDevices.find(d => d.name === targetDomain || d.name === resolved.label || d.ip === resolved.ip);
            if (queryType === 'AAAA') {
              const v6 = devMatch?.ipv6 || '::';
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\nName:    ${targetDomain}\nAddress: ${v6}`, 80);
            } else if (queryType === 'CNAME') {
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\n${targetDomain}  canonical name = ${resolved.label || targetDomain}`, 80);
            } else if (queryType === 'MX') {
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\n${targetDomain}  MX preference = 10, mail exchanger = mail.${targetDomain}`, 80);
            } else if (queryType === 'NS') {
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\n${targetDomain}  nameserver = ns.${targetDomain}`, 80);
            } else if (queryType === 'TXT') {
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\n${targetDomain}  text = "v=spf1 -all"`, 80);
            } else if (queryType === 'A') {
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\nName:    ${targetDomain}\nAddress: ${resolved.ip}`, 80);
            } else {
              await emitMulti('output', `Server:  local-device\nAddress: 127.0.0.1\n\n*** Invalid query type: ${queryType}`, 80);
            }
          } else if (!isValidIpv4(queryServer)) {
            emit('error', t.dnsInvalidAddress);
          } else if (!hasGatewayForTargetCallback(queryServer)) {
            emit('error', t.dnsGatewayRequired);
          } else {
            const dnsResult = resolveDomainWithDnsServicesCallback(targetDomain);
            if (!dnsResult) {
              await emitMulti('output', `*** DNS request timed out\n*** Can't find ${targetDomain}: Non-existent domain`, 80);
            } else {
              await emitMulti('output', `Server:  ${dnsResult.server.name}\nAddress: ${dnsResult.server.ip}\n\nName:    ${targetDomain}\nAddress: ${dnsResult.address}`, 80);
            }
          }
        } else if (cmd === 'curl' || cmd === 'wget') {
          const url = args[0];
          if (!url) {
            emit('output', `Usage: ${cmd} <url>`);
          } else {
            openWebPage(url, args[1]);
          }
        } else if (cmd === 'telnet' || cmd === 'ssh') {
          const isSsh = cmd === 'ssh';
          const targetSpec = args[0];
          const extraPort = args[1];

          const isSshLoginFlag = isSsh && targetSpec === '-l';
          const sshUserFromFlag = isSshLoginFlag ? (args[1] || '') : '';
          const sshTargetFromFlag = isSshLoginFlag ? (args[2] || '') : '';
          const sshPortFromFlag = isSshLoginFlag ? args[3] : undefined;

          const sshUserFromSpec = isSsh && !isSshLoginFlag && targetSpec?.includes('@')
            ? targetSpec.split('@')[0].trim()
            : '';
          const targetFromSpec = isSsh && !isSshLoginFlag && targetSpec?.includes('@')
            ? targetSpec.split('@').slice(1).join('@').trim()
            : targetSpec;

          const username = isSsh ? ((sshUserFromFlag || sshUserFromSpec) || 'admin') : '';
          const target = isSshLoginFlag ? sshTargetFromFlag : targetFromSpec;
          const port = isSsh
            ? ((sshPortFromFlag || (isSshLoginFlag ? undefined : extraPort)) || '22')
            : (extraPort || '23');
          if (!target) {
            emit('output', isSsh
              ? 'Usage: ssh -l <username> <ip> [port]\n       ssh <username>@<ip> [port]'
              : 'Usage: telnet <ip_or_domain> [port]');
            return;
          } else if (isSsh) {
            const isValidUsername = /^[A-Za-z0-9._-]+$/.test(username);
            const isValidTargetIp = isValidIpv4(target);
            if (!isValidUsername) {
              emit('error', 'Invalid SSH username format');
              return;
            }
            if (!isValidTargetIp) {
              emit('error', `Invalid SSH target IP: ${target}`);
              return;
            }
          }

          let targetIp = target;
          if (!isSsh) {
            const namedResult = resolveDeviceNameTargetCallback(target);
            if (namedResult) {
              targetIp = namedResult.ip;
            }
            if (!isValidIpv4(targetIp) && !isValidIpv6(targetIp)) {
              const dnsResult = resolveDomainWithDnsServicesCallback(target);
              if (dnsResult) {
                targetIp = dnsResult.address;
              } else {
                emit('error', `Could not resolve hostname ${target}`);
                return;
              }
            }
          }

          if (isLoopbackTarget(targetIp)) {
            emit('success', isSsh
              ? `Trying ${username}@127.0.0.1 ${port} ...\nConnected to 127.0.0.1 as ${username}.`
              : `Trying 127.0.0.1 ${port} ...\nConnected to 127.0.0.1.`);
            return;
          }

          const result = checkConnectivity(deviceId, targetIp, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map(), language as 'tr' | 'en', { protocol: 'tcp', port });

          dispatchCapturedPackets(result.capturedPackets);

          if (result.success && result.targetId) {
            const targetDevice = topologyDevices.find(d => d.id === result.targetId);

            // ARP güncelle: Her başarılı TCP bağlantısı ARP tablosunu günceller
            if (targetDevice?.macAddress) {
              addPcArpEntry?.(targetIp, targetDevice.macAddress, targetDevice.type === 'iot');
            }

            if (targetDevice && ((targetDevice.type === 'switchL2' || targetDevice.type === 'switchL3') || targetDevice.type === 'router')) {
              if (deviceStates) {
                const targetState = deviceStates.get(result.targetId);
                if (targetState?.security?.vtyLines) {
                  const transportInput = targetState.security.vtyLines.transportInput || [];
                  if (isSsh) {
                    const isSshActive = transportInput.includes('all') || transportInput.includes('ssh');
                    if (!isSshActive) {
                      emit('error', `Connecting to ${targetIp}...Could not open connection to the host, on port 22: Connect failed`);
                      return;
                    }
                  } else {
                    const isTelnetActive = transportInput.includes('all') || transportInput.includes('telnet');
                    if (!isTelnetActive) {
                      emit('error', `Connecting to ${targetIp}...Could not open connection to the host, on port 23: Connect failed`);
                      return;
                    }
                  }
                }
              }

              emit('success', isSsh
                ? `Trying ${username}@${targetIp} ${port} ...\nConnected to ${targetIp} as ${username}.`
                : `Trying ${targetIp} ${port} ...\nConnected to ${targetIp}.`);

              setTimeout(() => {
                setConnectedDeviceId(result.targetId as string);
                setConsoleConnectionTime(Date.now());
                setIsConsoleConnected(true);

                if (onExecuteDeviceCommand) {
                  void onExecuteDeviceCommand(
                    result.targetId as string,
                    isSsh ? `__SSH_CONNECT__:${username}` : '__TELNET_CONNECT__'
                  );
                }

                setActiveTab('terminal');
                onNavigate?.('terminal');
              }, 500);
            } else {
              emit('error', `Connection refused by ${targetIp}`);
            }
          } else {
            emit('error', `Connecting to ${targetIp}... failed: ${result.error || 'Destination unreachable'}`);
          }
        } else if (cmd === 'arp') {
          const flag = args[0]?.toLowerCase();
          if (args.length === 0 || flag === '-a' || flag === '-g' || flag === '-v') {
            emit('output', buildArpTableOutput());
            } else if (flag === '-d') {
              const delTarget = args[1];
              if (!delTarget || delTarget === '*') {
                clearPcArpTable?.();
                emit('success', 'The ARP entry was deleted successfully.');
              } else {
                removePcArpEntry?.(delTarget);
                emit('success', `The ARP entry ${delTarget} was deleted successfully.`);
            }
          } else if (flag === '-s') {
            const targetIp = args[1];
            const targetMac = args[2];
            if (!targetIp || !targetMac) {
              emit('output', 'Usage: arp -s <ip> <mac_address>');
            } else {
              addPcArpEntry?.(targetIp, targetMac);
              emit('success', `Static ARP entry ${targetIp} -> ${targetMac} added successfully.`);
            }
          } else {
            emit('output', 'Usage: arp -a\n       arp -g\n       arp -v\n       arp -d [*]\n       arp -s <ip> <mac_address>');
          }
        } else if (cmd === 'tracert' || cmd === 'traceroute') {
          // Windows tracert flags: -d (no name resolution), -h max_hops, -w timeout, -4, -6
          let maxHops = 30;
          let resolveNames = true;
          let target: string | undefined;
          for (let ai = 0; ai < args.length; ai++) {
            const a = args[ai].toLowerCase();
            if (a === '-h') { maxHops = parseInt(args[ai + 1], 10) || 30; ai++; }
            else if (a === '-w') { ai++; } // timeout accepted; not simulated
            else if (a === '-d') { resolveNames = false; }
            else if (a === '-4' || a === '-6') { /* address family accepted */ }
            else if (target === undefined) { target = args[ai]; }
          }
          if (!target) {
            emit('output', `Usage: ${cmd} [-d] [-h max_hops] [-w timeout] [-4|-6] <target_name_or_address>`);
          } else {
            let resolvedTarget = target;
            if (!isValidIpv4(target) && !isValidIpv6(target)) {
              const namedResult = resolveDeviceNameTargetCallback(target);
              if (namedResult) {
                resolvedTarget = namedResult.ip;
              } else {
                const dnsResult = resolveDomainWithDnsServicesCallback(target);
                if (dnsResult) {
                  resolvedTarget = dnsResult.address;
                }
              }
            }
            const formatHop = (name: string, ip: string) => resolveNames ? `${name} [${ip.toLowerCase()}]` : `[${ip.toLowerCase()}]`;
            if (isLoopbackTarget(resolvedTarget)) {
              await emitMulti('output', `Tracing route to 127.0.0.1 over a maximum of ${maxHops} hops:\n\n  1    <1 ms    <1 ms    <1 ms  localhost [127.0.0.1]\n\nTrace complete.`, 80);
              return;
            }
            emit('output', `Tracing route to ${target} over a maximum of ${maxHops} hops:\n`);
            const result = checkConnectivity(deviceId, resolvedTarget, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map(), language as 'tr' | 'en', { protocol: 'icmp' });

            dispatchCapturedPackets(result.capturedPackets);

            if (result.success) {
              // ARP güncelle: tracert sırasında hedefle iletişim ARP tablosunu günceller
              if (result.targetId) {
                const tracertTarget = topologyDevices.find(d => d.id === result.targetId);
                if (tracertTarget?.macAddress) {
                  addPcArpEntry?.(resolvedTarget, tracertTarget.macAddress, tracertTarget.type === 'iot');
                }
              }
              const l3Hops = getL3Hops(deviceId, resolvedTarget, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map());
              const limitedHops = l3Hops && l3Hops.length > 0 ? l3Hops.slice(0, maxHops) : [];
              if (limitedHops.length > 0) {
                let hopOutput = '';
                limitedHops.forEach((hop, index) => {
                  hopOutput += `  ${index + 1}    <1 ms    <1 ms    <1 ms  ${formatHop(hop.name, hop.ip)}\n`;
                });
                await emitMulti('output', hopOutput + '\nTrace complete.', 80);
              } else if (result.targetId) {
                // Directly reachable (no L3 hops, e.g. flat LAN): destination is the first hop
                const directTarget = topologyDevices.find(d => d.id === result.targetId);
                const directIp = directTarget ? (directTarget.ip || directTarget.ipv6 || resolvedTarget) : resolvedTarget;
                const directName = directTarget?.name || directIp;
                await emitMulti('output', `  1    <1 ms    <1 ms    <1 ms  ${formatHop(directName, directIp)}\n\nTrace complete.`, 80);
              } else {
                await emitMulti('output', `  1    *        *        *     Request timed out.\n\nTrace complete.`, 80);
              }
            } else {
              await emitMulti('output', `  1    *        *        *     Request timed out.\n\nTrace complete.`, 80);
            }
          }
        } else if (cmd === 'netstat') {
          const normFlag = (a: string) => a.replace(/^[-/]/, '').toLowerCase();
          const flagSet = args.filter(a => /^[-/]/.test(a)).map(normFlag);
          const hasFlag = (f: string) => flagSet.includes(f);
          const showAll = hasFlag('a');
          const numericOnly = hasFlag('n');
          const showOpid = hasFlag('o');
          const showRoute = hasFlag('r');
          const showStats = hasFlag('s');
          const showEthernet = hasFlag('e');
          const protoIdx = args.findIndex((a, i) => /^[-/]p$/i.test(a) && args[i + 1] !== undefined);
          const protoFilter = protoIdx !== -1 ? args[protoIdx + 1].toLowerCase() : '';

          if (showRoute) {
            const netAddr = pcSubnet === '255.255.255.0' ? `${pcIP.split('.').slice(0, 3).join('.')}.0` : pcIP;
            const gw = pcGateway || '0.0.0.0';
            await emitMulti('output', `\nRoute Table\n\n  Network Destination    Netmask          Gateway         Interface     Metric\n  ${'0.0.0.0'.padEnd(23)} 0.0.0.0          ${gw.padEnd(15)} ${pcIP.padEnd(15)} 25\n  ${netAddr.padEnd(23)} ${pcSubnet.padEnd(15)} ${gw.padEnd(15)} ${pcIP.padEnd(15)} 291\n  127.0.0.0              255.0.0.0        127.0.0.1        127.0.0.1        331\n  127.0.0.1              255.255.255.255  127.0.0.1        127.0.0.1        331\n`, 60);
          } else if (showStats) {
            await emitMulti('output', `\nIPv4 Statistics\n\n    Packets Received ...................: 12450\n    Received Header Errors .............: 0\n    Received Address Errors ............: 0\n    Packets Sent .......................: 8432\n\nTCP Statistics\n\n    Active Opens .......................: 14\n    Passive Opens ......................: 2\n    Failed Connection Attempts .........: 1\n    Resets .............................: 3\n    Connections Established ............: 12\n\nUDP Statistics\n\n    Datagrams Received .................: 230\n    Datagrams Sent .....................: 215\n`, 60);
          } else if (showEthernet) {
            await emitMulti('output', `\nInterface Statistics\n\n                                Received    Sent\n    Bytes ........................ 12.3 MB    9.8 MB\n    Unicast Packets ............... 10234      7234\n    Non-unicast Packets ........... 512        340\n    Discards ...................... 0          0\n    Errors ........................ 0          0\n    Unknown Protocols ............. 0\n`, 60);
          } else {
            const includeTcp = !protoFilter || protoFilter === 'tcp';
            const includeUdp = !protoFilter || protoFilter === 'udp';
            const pidSuffix = showOpid ? '    PID' : '';
            let netstatOut = `\nActive Connections\n\n  Proto  Local Address          Foreign Address        State${pidSuffix}\n`;
            if (includeTcp) {
              netstatOut += `  TCP    ${pcIP}:135            0.0.0.0:0              LISTENING${showOpid ? '      1234' : ''}\n`;
              netstatOut += `  TCP    ${pcIP}:445            0.0.0.0:0              LISTENING${showOpid ? '      4' : ''}\n`;
              if (serviceHttpEnabled) netstatOut += `  TCP    ${pcIP}:80             0.0.0.0:0              LISTENING${showOpid ? '      876' : ''}\n`;
              if (showAll || numericOnly) {
                netstatOut += `  TCP    ${pcIP}:49664          0.0.0.0:0              LISTENING${showOpid ? '      1234' : ''}\n`;
                netstatOut += `  TCP    ${pcIP}:49665          0.0.0.0:0              LISTENING${showOpid ? '      1234' : ''}\n`;
                netstatOut += `  TCP    ${pcIP}:49666          0.0.0.0:0              LISTENING${showOpid ? '      1234' : ''}\n`;
              }
            }
            if (includeUdp) {
              if (serviceDnsEnabled) netstatOut += `  UDP    ${pcIP}:53             *:*${showOpid ? '                      650' : ''}\n`;
              if (serviceDhcpEnabled) netstatOut += `  UDP    ${pcIP}:67             *:*${showOpid ? '                      652' : ''}\n`;
              if (showAll || numericOnly) {
                netstatOut += `  UDP    ${pcIP}:137            *:*${showOpid ? '                      4' : ''}\n`;
                netstatOut += `  UDP    ${pcIP}:138            *:*${showOpid ? '                      4' : ''}\n`;
              }
            }
            await emitMulti('output', netstatOut, 60);
          }
        } else if (cmd === 'nbtstat') {
          const has = (f: string) => args.some(a => a === f);
          if (has('-n')) {
            await emitMulti('output', `\nNetBIOS Local Name Table\n\n       Name               Type         Status\n    ---------------------------------------------\n    ${internalPcHostname.toUpperCase().padEnd(15)}  <00>  UNIQUE      Registered\n    WORKGROUP        <00>  GROUP       Registered\n    ${internalPcHostname.toUpperCase().padEnd(15)}  <20>  UNIQUE      Registered\n`, 80);
          } else if (has('-RR')) {
            emit('success', `NetBIOS names released and refreshed successfully for ${internalPcHostname}.`);
          } else if (has('-R')) {
            emit('success', 'Successfully purged the NetBIOS name cache and reloaded it from LMHOSTS.');
          } else if (has('-c')) {
            await emitMulti('output', `\nWindows IP Configuration\n\nNetBIOS Remote Cache Name Table\n\n       Name               Type         Host Address    Life [sec]\n    ---------------------------------------------\n    ${internalPcHostname.toUpperCase().padEnd(15)}  <03>  UNIQUE        ${pcIP.padEnd(13)}  900\n`, 80);
          } else if (has('-r')) {
            await emitMulti('output', `\nNetBIOS Names Resolution and Registration Statistics\n\n    Resolutions sent/received ...........: 3/3\n    Registrations sent/received .........: 1/1\n    Renewals sent/received ..............: 0/0\n`, 80);
          } else if (has('-S') || has('-s')) {
            await emitMulti('output', `\nNetBIOS connection table\n\n    Local Name                  In/Out   Remote Host            Input  Output\n    ------------------------------------------------\n    ${internalPcHostname.toUpperCase().padEnd(18)} <00>  Out     <Unknown>                 0      0\n\n`, 80);
          } else if (has('-a') || has('-A') || has('-L')) {
            const flagIdx = args.findIndex(a => a === '-a' || a === '-A' || a === '-L');
            const param = flagIdx !== -1 && args[flagIdx + 1] ? args[flagIdx + 1] : '';
            let targetIp = param;
            if (param && !isValidIpv4(param) && !isValidIpv6(param)) {
              const namedResult = resolveDeviceNameTargetCallback(param);
              if (namedResult) targetIp = namedResult.ip;
            }
            await emitMulti('output', `\nEthernet Adapter Status\n\n    Host Name ............ : ${internalPcHostname}\n    MAC Address .......... : ${formatMacForArp(pcMAC).toUpperCase()}\n    IP Address ........... : ${pcIP}\n    Subnet Mask .......... : ${pcSubnet}\n    Default Gateway ...... : ${pcGateway}\n    DNS Servers .......... : ${pcDNS}\n    Remote Target ........ : ${targetIp || '(unknown)'}\n`, 80);
          } else {
            emit('output', 'Usage: nbtstat [-n] [-c] [-r] [-R] [-RR] [-S] [-s] [-a name] [-A ip] [-L name]');
          }
        } else if (cmd === 'getmac') {
          const mac = formatMacForArp(pcMAC).toUpperCase();
          await emitMulti('output', `Physical Address    Transport Name\n=================== ============================================\n${mac.padEnd(19)} \\Device\\Tcpip_{${deviceId.toUpperCase()}}`, 60);
        } else if (cmd === 'ftp') {
          const targetArg = args[0];
          if (!targetArg) {
            emit('output', 'Usage: ftp <server_address>');
            return;
          }

          let targetIp = targetArg;
          let dnsResolved = false;
          if (!isValidIpv4(targetArg) && !isValidIpv6(targetArg)) {
            const namedResult = resolveDeviceNameTargetCallback(targetArg);
            if (namedResult) {
              targetIp = namedResult.ip;
              dnsResolved = true;
            } else {
              const dnsResult = resolveDomainWithDnsServicesCallback(targetArg);
              if (dnsResult) {
                targetIp = dnsResult.address;
                dnsResolved = true;
              } else {
                emit('error', language === 'tr'
                  ? `DNS sorgusu başarısız: '${targetArg}' çözümlenemedi.`
                  : `Could not resolve hostname '${targetArg}'.`);
                return;
              }
            }
          }

          const result = checkConnectivity(deviceId, targetIp, topologyDevices, topologyConnections as unknown as CanvasConnection[], deviceStates || new Map(), language as 'tr' | 'en', { protocol: 'tcp', port: '21' });

          dispatchCapturedPackets(result.capturedPackets);

          // ARP güncelle: FTP bağlantısı da ARP tablosunu günceller
          if (result.success && result.targetId) {
            const ftpTargetDevice = topologyDevices.find(d => d.id === result.targetId)
              || topologyDevices.find(d => d.ip === targetIp);
            if (ftpTargetDevice?.macAddress) {
              addPcArpEntry?.(targetIp, ftpTargetDevice.macAddress, ftpTargetDevice.type === 'iot');
            }
          }

          if (!result.success) {
            const err = result.error || '';
            const displayTarget = dnsResolved ? `${targetArg} [${targetIp}]` : targetIp;
            if (/firewall|güvenlik duvarı/i.test(err)) {
              emit('error', `${displayTarget}: ${err}`);
            } else if (/acl/i.test(err)) {
              emit('error', `${displayTarget}: ${err}`);
            } else if (/ip address/i.test(err)) {
              emit('error', language === 'tr'
                ? 'FTP bağlantısı sağlanamadı: Kaynak cihazın IP adresi yok.'
                : 'Could not connect to FTP server: Source device has no IP address.');
            } else {
              emit('error', language === 'tr'
                ? `FTP bağlantısı sağlanamadı: ${displayTarget} adresine ulaşılamıyor.`
                : `Could not connect to FTP server at ${displayTarget}: Destination unreachable.`);
            }
            return;
          }
          const targetDevice = result.targetId
            ? topologyDevices.find(d => d.id === result.targetId)
            : topologyDevices.find(d => d.ip === targetIp);
          const deviceByIp = topologyDevices.find(d => d.ip === targetIp);
          const targetDeviceId = targetDevice?.id || deviceByIp?.id;
          const targetState = targetDeviceId
            ? deviceStates?.get(targetDeviceId)
            : undefined;
          const ftpService =
            targetDevice?.services?.ftp?.enabled ? targetDevice.services.ftp :
              deviceByIp?.services?.ftp?.enabled ? deviceByIp.services.ftp :
                targetState?.services?.ftp?.enabled ? targetState.services.ftp :
                  undefined;
          if (!ftpService?.enabled) {
            emit('error', language === 'tr'
              ? `FTP bağlantısı sağlanamadı: ${targetIp} üzerinde FTP servisi aktif değil.`
              : `FTP service is not enabled on ${targetIp}.`);
            return;
          }
          const files = ftpService.files || [];
          const resolvedDeviceId = result.targetId || targetDevice?.id || deviceByIp?.id || '';
          setFtpSession({ host: targetArg, targetDeviceId: resolvedDeviceId, files });
          setIsFtpFilePickerOpen(true);
          emit('output', `Connected to ${targetArg}.`);
          emit('output', '220 FTP server ready.');
          emit('success', language === 'tr' ? 'Dosya transfer ekranı açıldı.' : 'File transfer window opened.');
        } else if (cmd === 'help' || cmd === '?') {
          emit('output', `Available commands: ipconfig, ping, tracert, traceroute, telnet, ssh, ftp, netstat, nbtstat, getmac, nslookup, curl, wget, arp, hostname, dir, ver, cls, exit, quit`);
        } else if (cmd === 'cls') {
          setPcOutput([]);
        } else if (cmd === 'exit' || cmd === 'quit') {
          onClose();
        } else if (cmd === 'hostname') {
          if (args[0]) {
            const newHostname = args[0].trim().slice(0, 20);
            setPcHostname(newHostname);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('update-topology-device-config', {
                detail: {
                  deviceId,
                  config: { name: newHostname }
                }
              }));
            }
            emit('success', `Hostname set to ${newHostname}`);
          } else {
            emit('output', internalPcHostname);
          }
        } else if (cmd === 'ver') {
          emit('output', `OS [Version 10.0.26200.8037]`);
        } else if (cmd === 'dir' || cmd === 'ls') {
          const localFiles = pcLocalFiles;
          let fileLines = '';
          let totalSize = 0;
          if (localFiles.length > 0) {
            fileLines = '\n' + localFiles.map(f => {
              const d = f.modifiedAt ? new Date(f.modifiedAt) : new Date();
              const month = (d.getMonth() + 1).toString().padStart(2, '0');
              const day = d.getDate().toString().padStart(2, '0');
              const year = d.getFullYear();
              const mm = d.getMinutes().toString().padStart(2, '0');
              const ap = d.getHours() >= 12 ? 'PM' : 'AM';
              const h12 = (d.getHours() % 12 || 12).toString().padStart(2, '0');
              totalSize += f.size || 0;
              return `${month}/${day}/${year}  ${h12}:${mm} ${ap}             ${(f.size || 0).toString().padStart(8)} ${f.name}`;
            }).join('\n');
          }
          emit('output', ` Volume in drive C is OS\n Volume Serial Number is 1234-5678\n\n Directory of C:\\\n03/27/2026  10:00 AM    <DIR>          .\n03/27/2026  10:00 AM    <DIR>          ..\n${fileLines}\n               ${localFiles.length} File(s)          ${totalSize} bytes\n                2 Dir(s)  100,000,000,000 bytes free`);
        } else {
          cmdSuccess = false;
          emit('error', `'${cmd}' is not recognized as an internal or external command.`);
        }

        const nextOp = i + 1 < tokens.length ? tokens[i + 1] : null;
        if (nextOp === '&&' && !cmdSuccess) {
          skipNext = true;
        }
      }

    } else {
      if (!isConsoleConnected) {
        addLocalOutput('error', t.pcNoDeviceConnected);
        return;
      }

      if (consoleNeedsPassword) {
        if (onExecuteDeviceCommand && connectedDeviceId) {
          try {
            await onExecuteDeviceCommand(connectedDeviceId, input);
          } catch (err) {
            errorHandler.logError(DEVICE_ERRORS.DEVICE_OFFLINE(connectedDeviceId, { operation: 'passwordInput', error: String(err) }));
          }
        }
        setInput('');
        return;
      }

      if ((consoleConfirmDialog?.show || consoleReloadPending)) {
        if (!command) {
          if (onExecuteDeviceCommand && connectedDeviceId) {
            try {
              await onExecuteDeviceCommand(connectedDeviceId, 'confirm');
            } catch (err) {
              errorHandler.logError(DEVICE_ERRORS.DEVICE_OFFLINE(connectedDeviceId, { operation: 'confirmDialog', error: String(err) }));
            }
          }
          setInput('');
          return;
        }
        const lowerCmd = command.toLowerCase().trim();
        if (lowerCmd === 'confirm' || lowerCmd === 'y' || lowerCmd === 'yes') {
          if (onExecuteDeviceCommand && connectedDeviceId) {
            try {
              await onExecuteDeviceCommand(connectedDeviceId, 'confirm');
            } catch (err) {
              errorHandler.logError(DEVICE_ERRORS.DEVICE_OFFLINE(connectedDeviceId, { operation: 'confirmResponse', error: String(err) }));
            }
          }
          setInput('');
          return;
        }
      }

      if (onExecuteDeviceCommand && connectedDeviceId) {
        try {
          await onExecuteDeviceCommand(connectedDeviceId, command);
        } catch (err) {
          errorHandler.logError(DEVICE_ERRORS.DEVICE_OFFLINE(connectedDeviceId, { operation: 'executeCommand', command, error: String(err) }));
        }
      }
    }
  }, [
    activeTabRef, applyDhcpLeaseRef, input, desktopHistory, setDesktopHistory, setDesktopHistoryIndex,
    consoleHistory, setConsoleHistory, setConsoleHistoryIndex, setInput, setShowAutocomplete,
    setAutocompleteIndex, setAutocompleteNavigated, ftpSession, setFtpSession,
    pcLocalFiles, setPcLocalFiles, setIsFtpFilePickerOpen,
    pcIP, setPcIP, pcSubnet, pcMAC, pcGateway, pcDNS, pcIPv6,
    internalPcHostname, ipConfigMode, deviceId, language, t,
    topologyDevices, topologyConnections, deviceStates, deviceFromTopology,
    isCmdInputDisabled, isConsoleInputDisabled, connectionErrorText,
    isConsoleConnected, connectedDeviceId, setConnectedDeviceId,
    setConsoleConnectionTime, setIsConsoleConnected,
    wifiEnabled, consoleNeedsPassword, consoleConfirmDialog, consoleReloadPending,
    serviceHttpEnabled, serviceDnsEnabled, serviceDhcpEnabled,
    onUpdatePCHistory, onExecuteDeviceCommand, onNavigate, onClose,
    setActiveTab, setPcOutput, addLocalOutput, addMultilineOutput,
    resolveDeviceNameTargetCallback, resolveDomainWithDnsServicesCallback,
    hasGatewayForTargetCallback, isLoopbackTarget,
    isValidIpv4, isValidIpv6, canReachTargetIp,
    normalizeLookupTargetCallback, buildArpTableOutput,
    addPcArpEntry, removePcArpEntry, clearPcArpTable,
    openWebPage, setPcHostname, executeFtpPut, handleFtpSessionCommand,
  ]);

  return {
    executeCommand,
    executeFtpPut,
    handleFtpSessionCommand,
  };
}
