import { iosModeError } from './iosErrors';
import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult } from '../types';
import { buildRunningConfig } from './configBuilder';

export function cmdNtpServer(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ntp\s+server\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ntp server command' };
  const servers = [...(state.ntpServers || [])];
  if (!servers.includes(match[1])) servers.push(match[1]);
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);
  const nextServices = {
    ...state.services,
    ntp: {
      enabled: true,
      server: match[1],
      timezone: state.services?.ntp?.timezone || 'UTC',
      date,
      time,
      timeOffset: state.services?.ntp?.timeOffset || 0,
    },
  };

  const updatedState = {
    ...state,
    ntpServers: servers,
    services: nextServices
  };

  return {
    success: true,
    output: `NTP server ${match[1]} configured`,
    newState: {
      ntpServers: servers,
      services: nextServices,
      runningConfig: buildRunningConfig(updatedState)
    },
  };
}

export function cmdClockTimezone(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^clock\s+timezone\s+(\S+)\s+([+-]?\d+)(?:\s+(\d+))?$/i);
  if (!match) return { success: false, error: '% Invalid clock timezone command' };
  return { success: true, output: `Timezone set to ${match[1]} UTC${match[2]}` };
}

export function cmdIpNameServer(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+name-server\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ip name-server command' };
  return { success: true, output: `Name server ${match[1]} configured`, newState: { dnsServer: match[1] } };
}

export function cmdIpHost(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };

  const match = input.match(/^ip\s+host\s+(\S+)\s+(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (!match) return { success: false, error: '% Invalid ip host command. Usage: ip host <name> <ip>' };

  const hostName = match[1];
  const ipAddress = match[2];

  const services = { ...state.services };
  if (!services.dns) services.dns = { enabled: true, records: [] };

  const records = [...(services.dns.records || [])];
  const existingIndex = records.findIndex(r => r.domain === hostName);
  if (existingIndex >= 0) {
    records[existingIndex] = { domain: hostName, address: ipAddress };
  } else {
    records.push({ domain: hostName, address: ipAddress });
  }

  services.dns.records = records;

  const updatedState = { ...state, services };
  return {
    success: true,
    newState: {
      services,
      runningConfig: buildRunningConfig(updatedState)
    }
  };
}

export function cmdAliasExec(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^alias\s+(exec|configure|interface|line)\s+(\S+)\s+(.+)$/i);
  if (!match) {
    return { success: false, error: '% Invalid alias command' };
  }

  const mode = match[1].toLowerCase();
  const aliasName = match[2];
  const aliasCommand = match[3];

  if (mode !== 'exec') {
    return { success: true, output: `% ${mode} mode aliases not supported yet` };
  }

  const execAliases = { ...state.execAliases };
  execAliases[aliasName.toLowerCase()] = aliasCommand;

  const updatedState = { ...state, execAliases };
  return {
    success: true,
    output: `% ${input.trim()} configured`,
    newState: {
      execAliases,
      runningConfig: buildRunningConfig(updatedState)
    }
  };
}

export function cmdNoAliasExec(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+alias\s+(exec|configure|interface|line)\s+(\S+)$/i);
  if (!match) {
    return { success: false, error: '% Invalid no alias command' };
  }

  const mode = match[1].toLowerCase();
  const aliasName = match[2].toLowerCase();

  if (mode !== 'exec') {
    return { success: true, output: `% ${mode} mode aliases not supported yet` };
  }

  if (!state.execAliases || !state.execAliases[aliasName]) {
    return { success: false, error: `% Alias ${aliasName} not found` };
  }

  const execAliases = { ...state.execAliases };
  delete execAliases[aliasName];

  const updatedState = { ...state, execAliases };
  return {
    success: true,
    output: `% no alias exec ${aliasName} configured`,
    newState: {
      execAliases,
      runningConfig: buildRunningConfig(updatedState)
    }
  };
}

export function cmdIpNatPool(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+nat\s+pool\s+(\S+)\s+([0-9.]+)\s+([0-9.]+)\s+netmask\s+([0-9.]+)$/i);
  if (!match) return { success: false, error: '% Invalid NAT pool command' };

  const [_, name, startIp, endIp, netmask] = match;
  const pools = { ...state.natPools };
  pools[name] = { startIp, endIp, netmask };

  return { success: true, newState: { natPools: pools } };
}

export function cmdIpNatInsideSourceStatic(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+nat\s+inside\s+source\s+static\s+([0-9.]+)\s+([0-9.]+)$/i);
  if (!match) return { success: false, error: '% Invalid static NAT command' };

  const [_, localIp, globalIp] = match;
  const staticTranslations = [...(state.natStaticTranslations || [])];
  staticTranslations.push({ localIp, globalIp });

  return { success: true, newState: { natStaticTranslations: staticTranslations } };
}

export function cmdIpNatInsideSourceList(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };

  const interfaceMatch = input.match(/^ip\s+nat\s+inside\s+source\s+list\s+(\d+)\s+interface\s+(\S+)\s+overload$/i);
  if (interfaceMatch) {
    const [_, aclId, iface] = interfaceMatch;
    const dynamicRules = [...(state.natDynamicRules || [])];
    dynamicRules.push({ aclId, interface: iface, overload: true });
    return { success: true, newState: { natDynamicRules: dynamicRules } };
  }

  const poolMatch = input.match(/^ip\s+nat\s+inside\s+source\s+list\s+(\d+)\s+pool\s+(\S+)(?:\s+overload)?$/i);
  if (poolMatch) {
    const [_, aclId, poolName] = poolMatch;
    const overload = input.toLowerCase().includes('overload');
    const dynamicRules = [...(state.natDynamicRules || [])];
    dynamicRules.push({ aclId, poolName, overload });
    return { success: true, newState: { natDynamicRules: dynamicRules } };
  }

  return { success: false, error: '% Invalid dynamic NAT command' };
}

/**
 * Logging host & trap commands (Syslog support)
 */
export function cmdLoggingHost(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^logging\s+(?:host\s+)?([0-9.]+)/i);
  if (!match) return { success: false, error: '% Invalid logging host command' };

  const hostIp = match[1];
  const updatedState = { ...state, syslogHost: hostIp };
  return {
    success: true,
    output: `Syslog server set to ${hostIp}`,
    newState: { syslogHost: hostIp, runningConfig: buildRunningConfig(updatedState) }
  };
}

export function cmdLoggingTrap(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^logging\s+trap\s+(\w+)/i);
  if (!match) return { success: false, error: '% Invalid logging trap command' };

  const level = match[1];
  const updatedState = { ...state, syslogTrapLevel: level };
  return {
    success: true,
    output: `Syslog trap level configured to ${level}`,
    newState: { syslogTrapLevel: level, runningConfig: buildRunningConfig(updatedState) }
  };
}

/**
 * IP SLA & MSTP CLI configuration handlers
 */
export function cmdIpSla(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+sla\s+(\d+)/i);
  if (!match) return { success: false, error: '% Invalid IP SLA command syntax' };

  const slaId = match[1];
  return {
    success: true,
    output: `IP SLA responder/operation ${slaId} configured`,
    newState: { currentSlaId: slaId }
  };
}

export function cmdSpanningTreeMst(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  return {
    success: true,
    output: '',
    newState: { currentMode: 'config-mst', spanningTreeMode: 'mst' }
  };
}