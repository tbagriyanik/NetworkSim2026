import { NoteItem } from './examTypes';

/**
 * Extract CLI commands from note text and return them as a deduplicated array.
 * Detects lines that start with known NOS command verbs.
 */
export function extractCliCommandsFromNotes(notes: NoteItem[]): string[] {
  if (!notes || !Array.isArray(notes)) return [];

  const reservedVlanIds = new Set([1002, 1003, 1004, 1005]);

  const knownCliVerbs = [
    'enable', 'disable', 'configure', 'conf', 'hostname', 'interface',
    'ip', 'ipv6', 'vlan', 'name', 'no', 'show', 'do', 'ping', 'traceroute',
    'switchport', 'username', 'banner', 'motd', 'line', 'router',
    'network', 'passive-interface', 'default-router', 'dns-server', 'domain-name',
    'dhcp', 'lease', 'excluded-address', 'exit', 'end',
    'write', 'copy', 'reload', 'delete', 'erase',
    'description', 'speed', 'duplex', 'mac', 'arp',
    'service', 'login', 'password', 'secret', 'encryption',
    'ssh', 'crypto', 'access-list', 'access-group', 'nat', 'pool', 'route',
    'standby', 'vtp', 'spanning-tree', 'channel-group', 'channel-protocol',
    'wlan', 'station-role', 'security', 'radius', 'aaa',
    'clock', 'ntp', 'logging', 'snmp', 'privilege',
    'alias', 'prompt', 'exec', 'timeout', 'history',
    'terminal', 'monitor', 'debug', 'undebug', 'clear',
    'lacp', 'pagp', 'lldp', 'cdp', 'mls', 'sdm',
    'power', 'environment', 'redundancy', 'errdisable',
    'storm-control', 'port-security', 'dot1x',
    'default', 'set', 'reset', 'restart', 'startup',
    'help', 'telnet', 'shutdown', 'state', 'active', 'suspend',
    'ipconfig', 'ifconfig', 'arp', 'nslookup',
    'ip host', 'wget', 'curl', 'ssh', 'crypto',
  ];

  const seen = new Set<string>();
  const commands: string[] = [];

  for (const note of notes) {
    if (!note.text) continue;
    const lines = note.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip lines that clearly aren't CLI commands
      if (/^[\u{1F000}-\u{1FFFF}]/u.test(trimmed)) continue;
      if (/^#{1,6}\s/.test(trimmed)) continue;
      if (/^[A-ZÖÇŞİĞÜ]/u.test(trimmed) && trimmed.length > 3) continue;

      // Remove bullet markers and numbering prefixes
      const cleaned = trimmed.replace(/^[-–*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
      if (!cleaned) continue;

      // Skip remaining non-command patterns
      if (/^[A-ZÖÇŞİĞÜ]/u.test(cleaned) && !cleaned.startsWith('IP') && !cleaned.startsWith('PC-')) continue;
      if (/^["'`()[\]]/.test(cleaned)) continue;
      if (cleaned.length < 2) continue;
      if (/^[\d]+$/.test(cleaned)) continue;

      // Check if the line starts with a known CLI verb
      const lowerLine = cleaned.toLowerCase();
      const matched = knownCliVerbs.some(verb =>
        lowerLine === verb || lowerLine.startsWith(verb + ' ')
      );

      if (matched && !seen.has(lowerLine)) {
        // Skip reserved VLAN creation (1002-1005)
        const vlanMatch = lowerLine.match(/^vlan\s+(\d+)$/);
        if (vlanMatch && reservedVlanIds.has(parseInt(vlanMatch[1]))) continue;

        // Skip reserved VLAN in switchport access (1002-1005)
        const switchportVlanMatch = lowerLine.match(/^switchport\s+access\s+vlan\s+(\d+)$/);
        if (switchportVlanMatch && reservedVlanIds.has(parseInt(switchportVlanMatch[1]))) continue;

        seen.add(lowerLine);
        commands.push(cleaned);
      }
    }
  }

  return commands;
}

/**
 * Extract PC IP configuration information from note text.
 * Parses patterns like "PC-1: IP 192.168.1.10, Subnet 255.255.255.0"
 * or "PC-1: IP 192.168.1.10, DNS 192.168.1.10"
 * or "PC-1 → IP: 192.168.1.10 /24"
 * Returns an array of { deviceId, ip, subnet, gateway, dns } objects.
 */
interface NotePcConfig {
  deviceId: string;
  ip?: string;
  subnet?: string;
  gateway?: string;
  dns?: string;
}

export function extractPcConfigsFromNotes(notes: NoteItem[]): NotePcConfig[] {
  if (!notes || !Array.isArray(notes)) return [];
  const configs: NotePcConfig[] = [];
  const seen = new Set<string>();

  for (const note of notes) {
    if (!note.text) continue;
    const lines = note.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Remove numbering prefixes like "1) ", "1. ", "- ", "* "
      const cleaned = trimmed.replace(/^[-–*•\d]+[.)]\s*/, '').trim();
      if (!cleaned) continue;

      // Pattern: "PC-X: IP a.b.c.d, Subnet w.x.y.z"
      // or "PC-X: IP a.b.c.d, DNS w.x.y.z"
      // or "PC-X: IP a.b.c.d, Subnet w.x.y.z, Gateway a.b.c.d"
      const pcMatch = cleaned.match(/^(PC-[\w-]+)\s*[:\-–→]\s*IP\s+([\d.]+)/i);
      if (pcMatch) {
        const deviceId = pcMatch[1].toLowerCase();
        const ip = pcMatch[2];
        if (!seen.has(deviceId)) {
          seen.add(deviceId);
          configs.push({ deviceId, ip });
        } else {
          const existing = configs.find(c => c.deviceId === deviceId);
          if (existing) existing.ip = ip;
        }

        // Extract Subnet from same line
        const subnetMatch = cleaned.match(/Subnet\s+([\d.]+)/i);
        if (subnetMatch) {
          const existing = configs.find(c => c.deviceId === deviceId);
          if (existing) existing.subnet = subnetMatch[1];
        }

        // Extract Gateway from same line
        const gwMatch = cleaned.match(/Gateway\s+([\d.]+)/i);
        if (gwMatch) {
          const existing = configs.find(c => c.deviceId === deviceId);
          if (existing) existing.gateway = gwMatch[1];
        }

        // Extract DNS from same line
        const dnsMatch = cleaned.match(/DNS\s+([\d.]+)/i);
        if (dnsMatch) {
          const existing = configs.find(c => c.deviceId === deviceId);
          if (existing) existing.dns = dnsMatch[1];
        }
      }
    }
  }
  return configs;
}

/**
 * Extract connection information from note text.
 * Parses patterns like "PC-1 (eth0) ile Switch-1 (fa0/1) arasını bağlayın"
 * Returns an array of { sourceDevice, sourcePort, targetDevice, targetPort } objects.
 */
interface NoteConnectionInfo {
  sourceDevice: string;
  sourcePort?: string;
  targetDevice: string;
  targetPort?: string;
}

export function extractConnectionsFromNotes(notes: NoteItem[]): NoteConnectionInfo[] {
  if (!notes || !Array.isArray(notes)) return [];
  const connections: NoteConnectionInfo[] = [];
  const seen = new Set<string>();

  for (const note of notes) {
    if (!note.text) continue;
    const lines = note.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Remove numbering prefixes like "3) ", "1. ", "- ", "* "
      const cleaned = trimmed.replace(/^[-–*•\d]+[.)]\s*/, '').trim();
      if (!cleaned) continue;

      // Pattern: "PC-1 (eth0) ile Switch-1 (fa0/1) arasını bağlayın"
      // or "PC-1 → Switch-1"
      // or "PC-1 bağla Switch-1"
      const connMatch = cleaned.match(/([\w-]+)\s*(?:\((\w+)\))?\s*(?:ile|→|bağla|bağlayın|connect)\s+([\w-]+)\s*(?:\((\w+)\))?/i);
      if (connMatch) {
        const source = connMatch[1].toLowerCase();
        const sourcePort = connMatch[2]?.toLowerCase();
        const target = connMatch[3]?.toLowerCase();
        const targetPort = connMatch[4]?.toLowerCase();
        if (source && target) {
          const key = `${source}-${target}`;
          if (!seen.has(key)) {
            seen.add(key);
            connections.push({
              sourceDevice: source,
              sourcePort: sourcePort || undefined,
              targetDevice: target,
              targetPort: targetPort || undefined,
            });
          }
        }
      }
    }
  }
  return connections;
}