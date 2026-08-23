import { IOS_ERRORS, iosModeError } from './iosErrors';
import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult, Route } from '../types';
import { buildRunningConfig } from './configBuilder';
import { isLayer3Switch } from '../switchModels';
import { getPvstUpdate } from './commandHelpers';

/**
 * No IP HTTP Server - Disable HTTP server
 */
export function cmdNoIpHttpServer(state: SwitchState, _input: string, ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const lang = ctx.language || 'en';
  const services = state.services || {};
  return {
    success: true,
    output: lang === 'tr' ?
      'HTTP sunucusu devre dışı bırakıldı' :
      'HTTP server disabled',
    newState: {
      services: {
        ...services,
        http: {
          enabled: false,
          content: '',
          fontSize: 14
        }
      }
    }
  };
}

/**
 * No IP Domain Lookup - Disable domain lookup
 */
export function cmdNoIpDomainLookup(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: { domainLookup: false }
  };
}

export function cmdNoIpDomainName(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }
  return {
    success: true,
    newState: { domainName: undefined }
  };
}

/**
 * No IP Routing - Disable IP routing
 */
export function cmdNoIpRouting(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: { ipRouting: false }
  };
}

/**
 * No IP SSH Time-Out
 */
export function cmdNoIpSshTimeOut(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: { sshTimeout: undefined }
  };
}

/**
 * No Spanning-Tree - Disable spanning-tree globally or per-VLAN
 */
export function cmdNoSpanningTree(state: SwitchState, input: string, ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const lang = ctx.language || 'en';

  const vlanMatch = input.match(/^no\s+spanning-tree\s+vlan\s+(\d+)$/i);
  if (vlanMatch) {
    const vlanId = parseInt(vlanMatch[1]);
    const spanningTreeVlans = state.spanningTreeVlans || {};

    const updatedVlans = {
      ...spanningTreeVlans,
      [vlanId]: {
        ...spanningTreeVlans[vlanId],
        enabled: false
      }
    };

    const updatedCurrentState = {
      ...state,
      spanningTreeVlans: updatedVlans
    };

    const pvst = getPvstUpdate(updatedCurrentState, ctx);
    if ('error' in pvst) return pvst.error;
    const { allUpdatedStates, myUpdatedState } = pvst;

    return {
      success: true,
      output: lang === 'tr' ?
        `Spanning-tree VLAN ${vlanId} devre disi birakildi` :
        `Spanning-tree disabled on VLAN ${vlanId}`,
      newState: myUpdatedState || { spanningTreeVlans: updatedVlans },
      updatedDeviceStates: allUpdatedStates
    };
  }

  return {
    success: false,
    error: '% Command not available in Global Configuration mode.'
  };
}

/**
 * No MLS QoS - Disable MLS QoS
 */
export function cmdNoMlsQos(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: { mlsQosEnabled: false }
  };
}

/**
 * No IP DHCP Snooping - Disable DHCP snooping
 */
export function cmdNoIpDhcpSnooping(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: { dhcpSnoopingEnabled: false }
  };
}

/**
 * No Username - Remove username
 */
export function cmdNoUsername(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+username\s+(\S+)$/i);
  if (!match) {
    return { success: false, error: '% Invalid username command' };
  }

  const username = match[1];
  const currentUsers = Array.isArray(state.security?.users) ? state.security.users : [];
  const newUsers = currentUsers.filter((user: { username: string; password: string; privilege: number }) => (user?.username || '').toLowerCase() !== username.toLowerCase());

  return {
    success: true,
    newState: {
      security: {
        ...state.security,
        users: newUsers
      }
    }
  };
}

/**
 * No Interface - Delete interface config (for VLAN interfaces)
 */
export function cmdNoInterface(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+interface\s+vlan\s+(\d+)$/i);
  if (!match) {
    return { success: false, error: '% Invalid interface command' };
  }

  const vlanId = match[1];
  const newVlans = { ...state.vlans };

  if (!newVlans[vlanId]) {
    return { success: false, error: `% VLAN ${vlanId} does not exist` };
  }

  newVlans[vlanId] = {
    ...newVlans[vlanId],
    ipAddress: undefined,
    subnetMask: undefined
  };

  return {
    success: true,
    newState: { vlans: newVlans }
  };
}

/**
 * IP SSH Version - Set SSH version
 */
export function cmdIpSshVersion(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^ip\s+ssh\s+version\s+(1|2)$/i);
  if (!match) {
    return { success: false, error: '% Invalid ip ssh version command. Use: ip ssh version {1|2}' };
  }

  const version = parseInt(match[1]);
  return {
    success: true,
    output: `SSH version ${version} configured`,
    newState: { sshVersion: version as 1 | 2 }
  };
}

/**
 * IP DHCP Snooping VLAN
 */
export function cmdIpDhcpSnoopingVlan(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+dhcp\s+snooping\s+vlan\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };
  const vlans = match[1].split(',').map((v: string) => v.trim());
  return { success: true, output: `DHCP snooping enabled on VLAN(s): ${vlans.join(', ')}`, newState: { dhcpSnoopingVlans: vlans } };
}

/**
 * IP ARP Inspection VLAN
 */
export function cmdIpArpInspection(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+arp\s+inspection\s+vlan\s+(.+)$/i);
  if (match) {
    const vlans = match[1].split(',').map((v: string) => v.trim());
    return {
      success: true,
      output: `ARP inspection enabled on VLAN(s): ${vlans.join(', ')}`,
      newState: { arpInspectionEnabled: true, arpInspectionVlans: vlans }
    };
  }
  return { success: true, output: 'ARP inspection configured', newState: { arpInspectionEnabled: true } };
}

export function cmdNoIpArpInspection(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^no\s+ip\s+arp\s+inspection\s+vlan\s+(.+)$/i);
  if (match && state.arpInspectionVlans) {
    const removeVlans = match[1].split(',').map((v: string) => v.trim());
    const remaining = state.arpInspectionVlans.filter(v => !removeVlans.includes(v));
    return {
      success: true,
      output: remaining.length > 0 ? `ARP inspection remaining VLAN(s): ${remaining.join(', ')}` : 'ARP inspection disabled',
      newState: { arpInspectionVlans: remaining.length > 0 ? remaining : undefined, arpInspectionEnabled: remaining.length > 0 }
    };
  }
  return { success: true, output: 'ARP inspection disabled', newState: { arpInspectionEnabled: false, arpInspectionVlans: undefined } };
}

/**
 * Spanning-Tree VLAN - Enable STP on VLAN or configure priority/root
 */
export function cmdSpanningTreeVlan(state: SwitchState, input: string, ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };

  const match = input.match(/^spanning-tree\s+vlan\s+(\d+)(?:\s+(priority|root)(?:\s+(primary|secondary|\d+))?)?$/i);
  if (!match) return { success: false, error: '% Invalid spanning-tree vlan command' };

  const vlanId = parseInt(match[1]);
  const subCommand = match[2];
  const value = match[3];

  const lang = ctx.language || 'en';
  const spanningTreeVlans = state.spanningTreeVlans || {};

  if (!subCommand) {
    const updatedVlans = {
      ...spanningTreeVlans,
      [vlanId]: {
        ...spanningTreeVlans[vlanId],
        enabled: true
      }
    };

    return {
      success: true,
      output: lang === 'tr' ?
        `Spanning-tree VLAN ${vlanId} etkinlestirildi` :
        `Spanning-tree enabled on VLAN ${vlanId}`,
      newState: { spanningTreeVlans: updatedVlans }
    };
  }

  if (subCommand === 'priority' && value) {
    const priorityValue = parseInt(value);
    const allowedPriorities = [0, 4096, 8192, 12288, 16384, 20480, 24576, 28672, 32768, 36864, 40960, 45056, 49152, 53248, 57344, 61440];
    if (!allowedPriorities.includes(priorityValue)) {
      const firstLine = allowedPriorities.slice(0, 8).map(v => String(v).padStart(6)).join(' ');
      const secondLine = allowedPriorities.slice(8).map(v => String(v).padStart(6)).join(' ');
      return {
        success: false,
        error: `% Bridge Priority must be in increments of 4096.\n% Allowed values are:\n  ${firstLine}\n  ${secondLine}`
      };
    }
  }

  let finalValue = value;
  if (subCommand === 'root') {
    if (value === 'primary') {
      finalValue = '24576';
    } else if (value === 'secondary') {
      finalValue = '28672';
    } else if (!value) {
      finalValue = '24576';
    }
  } else if (subCommand === 'priority' && !value) {
    return { success: false, error: '% Incomplete command.' };
  }

  const updatedVlans = {
    ...spanningTreeVlans,
    [vlanId]: {
      ...spanningTreeVlans[vlanId],
      enabled: true,
      priority: subCommand === 'root' || subCommand === 'priority' ? finalValue : value
    }
  };

  const updatedCurrentState = {
    ...state,
    spanningTreeVlans: updatedVlans
  };

  const pvst = getPvstUpdate(updatedCurrentState, ctx);
  if ('error' in pvst) return pvst.error;
  const { allUpdatedStates, myUpdatedState } = pvst;

  return {
    success: true,
    output: lang === 'tr' ?
      `Spanning-tree VLAN ${vlanId} ${subCommand} yapılandırıldı` :
      `Spanning-tree VLAN ${vlanId} ${subCommand} configured`,
    newState: myUpdatedState || { spanningTreeVlans: updatedVlans },
    updatedDeviceStates: allUpdatedStates
  };
}

export function cmdSpanningTreePortfastDefault(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  return { success: true, output: 'PortFast will be configured in all non-trunking ports', newState: { spanningTreePortfastDefault: true } };
}

export function cmdErrdisableRecovery(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  return { success: true, output: 'Errdisable recovery configured' };
}

export function cmdVtpPassword(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^vtp\s+password\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid vtp password command' };
  return { success: true, newState: { vtpPassword: match[1] } };
}

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

export function cmdIpDomainLookup(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  return { success: true, newState: { domainLookup: true } };
}

export function cmdSystemMtu(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^system\s+mtu\s+(\d+)$/i);
  if (!match) return { success: false, error: '% Invalid system mtu command' };
  return { success: true, output: `Changes to the MTU will take effect after reload\nSystem MTU size is ${match[1]} bytes` };
}

export function cmdSdmPrefer(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };

  const match = input.match(/^sdm\s+prefer\s+(\S+)(?:\s+(\S+))?/i);
  if (!match) {
    return {
      success: false,
      error: `% Invalid sdm prefer command.\nUsage: sdm prefer {lanbase-routing | lanbase | desktop | default}`
    };
  }

  const template = match[1].toLowerCase();
  const validTemplates = ['lanbase-routing', 'lanbase', 'desktop', 'default', 'routing'];

  if (!validTemplates.includes(template)) {
    return {
      success: false,
      error: `% Invalid template: ${template}\nValid templates: lanbase-routing, lanbase, desktop, default`
    };
  }

  if (!isLayer3Switch(state.switchModel)) {
    return {
      success: false,
      error: `% SDM preference is not supported on ${state.switchModel}\nSDM prefer is only available on Layer 3 switches`
    };
  }

  let output = '';

  if (template === 'lanbase-routing' || template === 'routing') {
    output = `Changes to the SDM preferences will take effect after reload.\n`;
    output += `This template will configure: 16384 IPv4 ACL entries, 2048 QoS labels, 16384 IPv4 Multicast entries\n`;
  } else if (template === 'lanbase') {
    output = `Changes to the SDM preferences will take effect after reload.\n`;
    output += `This template will configure: 8192 IPv4 ACL entries, 2048 QoS labels, 2048 IPv4 Multicast entries\n`;
  } else if (template === 'desktop') {
    output = `Changes to the SDM preferences will take effect after reload.\n`;
    output += `This template will configure: 4096 IPv4 ACL entries, 512 QoS labels, 256 IPv4 Multicast entries\n`;
  } else {
    output = `Current SDM template is: ${template}\n`;
  }

  output += `\n% System needs to be reloaded for the new template to take effect.\n% Use 'reload' command to reboot the device.\n`;

  return {
    success: true,
    output,
    newState: {
      sdmPreferConfigured: true,
      sdmTemplate: template,
      reloaded: false
    }
  };
}

export function cmdIpv6UnicastRouting(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  return { success: true, newState: { ipv6Enabled: true } };
}

export function cmdNoIpv6UnicastRouting(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  return { success: true, newState: { ipv6Enabled: false } };
}

export function cmdIpv6Route(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^ipv6\s+route\s+([0-9a-fA-F:]+\/\d+)\s+(\S+)(?:\s+(\d+))?$/i);
  if (!match) {
    return { success: false, error: '% Invalid ipv6 route command' };
  }

  const [, prefix, nextHop, adminDistance] = match;
  const [destination, prefixLength] = prefix.split('/');
  const metric = adminDistance ? parseInt(adminDistance, 10) : 1;

  const newStaticRoutes = [...(state.ipv6StaticRoutes || [])];
  const filteredRoutes = newStaticRoutes.filter(
    (route: Route) => !(route.destination === destination && route.prefixLength === parseInt(prefixLength))
  );
  filteredRoutes.push({
    destination,
    prefixLength: parseInt(prefixLength),
    nextHop,
    metric,
    type: 'static'
  });

  return {
    success: true,
    newState: {
      ipv6StaticRoutes: filteredRoutes,
      ipv6Enabled: true
    }
  };
}

export function cmdNoIpv6Route(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+ipv6\s+route\s+([0-9a-fA-F:]+\/\d+)(?:\s+(\S+))?$/i);
  if (!match) {
    return { success: false, error: '% Invalid no ipv6 route command' };
  }

  const [, prefix, nextHop] = match;
  const [destination, prefixLength] = prefix.split('/');

  const newStaticRoutes = (state.ipv6StaticRoutes || []).filter(
    (route: Route) => {
      const matchDest = route.destination === destination && route.prefixLength === parseInt(prefixLength);
      if (nextHop) {
        return !(matchDest && route.nextHop === nextHop);
      }
      return !matchDest;
    }
  );

  return {
    success: true,
    newState: { ipv6StaticRoutes: newStaticRoutes }
  };
}

export function cmdIpv6RouterRip(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^ipv6\s+router\s+rip\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  return {
    success: true,
    output: `RIPng process "${match[1]}" started`,
    newState: {
      routingProtocol: 'ripng',
      ipv6Enabled: true,
      currentMode: 'router-config'
    }
  };
}

export function cmdIpv6RouterOspf(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^ipv6\s+router\s+ospf\s+(\d+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  return {
    success: true,
    output: `OSPFv3 process ${match[1]} started`,
    newState: {
      routingProtocol: 'ospfv3',
      ipv6Enabled: true,
      ospfv3ProcessId: match[1],
      currentMode: 'router-config'
    }
  };
}

export function cmdNoIpv6RouterRip(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: {
      routingProtocol: 'none',
      ipv6DynamicRoutes: []
    }
  };
}

export function cmdNoIpv6RouterOspf(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }

  return {
    success: true,
    newState: {
      routingProtocol: 'none',
      ipv6DynamicRoutes: []
    }
  };
}

export function cmdIpSshAuthRetries(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^ip\s+ssh\s+authentication-retries\s+(\d+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };
  const retries = parseInt(match[1], 10);
  if (retries < 0 || retries > 5) return { success: false, error: '% Value must be between 0 and 5' };
  return { success: true, output: `SSH authentication retries set to ${retries}` };
}

export function cmdCryptoKeyGenerateRsa(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };

  const match = input.match(/^crypto\s+key\s+generate\s+rsa(?:\s+modulus\s+(\d+))?$/i);
  const modulus = match?.[1] ? parseInt(match[1], 10) : 1024;
  const validModulus = modulus >= 360 && modulus <= 4096 ? modulus : 1024;

  const hostPart = state.hostname || 'Switch';
  const domainPart = state.domainName || 'local';

  return {
    success: true,
    output: `The name for the keys will be: ${hostPart}.${domainPart}\n`
      + `Choose the size of the key modulus in the range of 360 to 4096 for your\n`
      + `General Purpose Keys. Choosing a key modulus greater than 512 may take\n`
      + `a few minutes.\n\n`
      + `How many bits in the modulus [512]: ${validModulus}\n`
      + `% Generating ${validModulus} bit RSA keys, keys will be non-exportable...\n`
      + `[OK] (elapsed time was 1 seconds)\n`,
    newState: {
      rsaKeys: { modulus: validModulus, name: `${hostPart}.${domainPart}` }
    }
  };
}

export function cmdCryptoKeyZeroizeRsa(state: SwitchState, input: string, ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };

  if (!/^crypto\s+key\s+zeroize\s+rsa$/i.test(input)) {
    return { success: false, error: IOS_ERRORS.invalidInput };
  }

  if (!state.rsaKeys) {
    return { success: true, output: '% Keys do not exist.\n' };
  }

  const keyName = state.rsaKeys.name || `${state.hostname || 'Switch'}.${state.domainName || 'local'}`;

  if (ctx?.skipConfirm) {
    return {
      success: true,
      output: `% Keys to be removed are named ${keyName}.\n`
        + `% RSA key pair has been removed.\n`,
      newState: { rsaKeys: undefined }
    };
  }

  return {
    success: true,
    output: '% Are you sure you want to remove all RSA keys? [yes/no]: ',
    requiresConfirmation: true,
    confirmationMessage: `All RSA keys (${keyName}) will be removed. Continue?`,
    confirmationAction: 'crypto-key-zeroize'
  };
}

export function cmdIpDhcpPool(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }
  const match = input.match(/^ip\s+dhcp\s+pool\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ip dhcp pool command' };

  const poolName = match[1];
  const pools = { ...(state.dhcpPools || {}) };
  if (!pools[poolName]) {
    pools[poolName] = {};
  }

  const services = { ...state.services };
  if (!services.dhcp) services.dhcp = { enabled: true, pools: [] };
  const existingServicePool = services.dhcp.pools?.find((p: { poolName: string; subnetMask?: string; startIp?: string; defaultGateway?: string; dnsServer?: string; maxUsers?: number }) => p.poolName === poolName);
  if (!existingServicePool) {
    services.dhcp.pools = services.dhcp.pools || [];
    services.dhcp.pools.push({
      poolName,
      subnetMask: '255.255.255.0',
      startIp: '192.168.1.100',
      defaultGateway: '192.168.1.1',
      dnsServer: '8.8.8.8',
      maxUsers: 50
    });
  }

  const updatedState = { ...state, dhcpPools: pools, services };
  return {
    success: true,
    newState: {
      currentMode: 'dhcp-config',
      currentDhcpPool: poolName,
      dhcpPools: pools,
      services,
      runningConfig: buildRunningConfig(updatedState)
    }
  };
}

export function cmdNoIpDhcpPool(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }
  const match = input.match(/^no\s+ip\s+dhcp\s+pool\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid no ip dhcp pool command' };

  const poolName = match[1];
  const pools = { ...(state.dhcpPools || {}) };
  if (!pools[poolName]) {
    return { success: false, error: `% DHCP pool ${poolName} not found` };
  }
  delete pools[poolName];

  const services = { ...state.services };
  if (services.dhcp && services.dhcp.pools) {
    services.dhcp.pools = services.dhcp.pools.filter((p: { poolName: string; subnetMask?: string; startIp?: string; defaultGateway?: string; dnsServer?: string; maxUsers?: number }) => p.poolName !== poolName);
  }

  const updatedState = { ...state, dhcpPools: pools, services };
  return { success: true, newState: { dhcpPools: pools, services, runningConfig: buildRunningConfig(updatedState) } };
}

export function cmdIpv6DhcpPool(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }
  const match = input.match(/^ipv6\s+dhcp\s+pool\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ipv6 dhcp pool command' };

  const poolName = match[1];
  const pools = { ...(state.ipv6DhcpPools || {}) };
  if (!pools[poolName]) {
    pools[poolName] = {};
  }

  const updatedState = { ...state, ipv6DhcpPools: pools };
  return {
    success: true,
    newState: {
      currentMode: 'dhcp-config',
      currentIpv6DhcpPool: poolName,
      ipv6DhcpPools: pools,
      runningConfig: buildRunningConfig(updatedState)
    }
  };
}

export function cmdNoIpv6DhcpPool(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const match = input.match(/^no\s+ipv6\s+dhcp\s+pool\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid no ipv6 dhcp pool command' };

  const poolName = match[1];
  const pools = { ...(state.ipv6DhcpPools || {}) };
  if (!pools[poolName]) return { success: false, error: `% DHCP pool ${poolName} not found` };
  delete pools[poolName];

  const updatedState = { ...state, ipv6DhcpPools: pools };
  return { success: true, newState: { ipv6DhcpPools: pools, runningConfig: buildRunningConfig(updatedState) } };
}

export function cmdIpDhcpExcludedAddress(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }
  return { success: true };
}

export function cmdNoIpDhcpExcludedAddress(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') {
    return { success: false, error: iosModeError() };
  }
  return { success: true };
}

export function cmdIpAccessList(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: '% Invalid command' };

  const match = input.match(/^ip\s+access-list\s+(standard|extended)\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ip access-list command' };

  const aclTypeRaw = match[1].toLowerCase();
  const aclType = aclTypeRaw === 'extended' ? 'extended' as const : 'standard' as const;
  const aclName = match[2];
  const accessLists = { ...(state.accessLists || {}) };
  const namedAclTypes = { ...(state.namedAclTypes || {}) };
  if (!accessLists[aclName]) {
    accessLists[aclName] = [];
  }
  namedAclTypes[aclName] = aclType;

  if (aclType === 'extended') {
    return {
      success: true,
      output: '',
      newState: {
        currentMode: 'config-ext-nacl',
        currentExtendedAcl: aclName,
        accessLists,
        namedAclTypes
      }
    };
  }

  return {
    success: true,
    output: '',
    newState: {
      currentMode: 'config-std-nacl',
      currentNamedAcl: aclName,
      accessLists,
      namedAclTypes
    }
  };
}

export function cmdNamedAclPermit(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-std-nacl' || !state.currentNamedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^permit\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid permit command' };

  const rule = `permit ${match[1]}`;
  const accessLists = { ...(state.accessLists || {}) };
  const aclName = state.currentNamedAcl;
  accessLists[aclName] = [...(accessLists[aclName] || []), rule];

  return {
    success: true,
    newState: { accessLists }
  };
}

export function cmdNamedAclDeny(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-std-nacl' || !state.currentNamedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^deny\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid deny command' };

  const rule = `deny ${match[1]}`;
  const accessLists = { ...(state.accessLists || {}) };
  const aclName = state.currentNamedAcl;
  accessLists[aclName] = [...(accessLists[aclName] || []), rule];

  return {
    success: true,
    newState: { accessLists }
  };
}

export function cmdNamedAclNoPermit(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-std-nacl' || !state.currentNamedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+permit\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  const rule = `permit ${match[1]}`;
  const aclName = state.currentNamedAcl;
  const accessLists = { ...(state.accessLists || {}) };
  accessLists[aclName] = (accessLists[aclName] || []).filter((r: string) => r !== rule);

  return {
    success: true,
    newState: { accessLists }
  };
}

export function cmdNamedAclNoDeny(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-std-nacl' || !state.currentNamedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+deny\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  const rule = `deny ${match[1]}`;
  const aclName = state.currentNamedAcl;
  const accessLists = { ...(state.accessLists || {}) };
  accessLists[aclName] = (accessLists[aclName] || []).filter((r: string) => r !== rule);

  return {
    success: true,
    newState: { accessLists }
  };
}

export function cmdExtAclPermit(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-ext-nacl' || !state.currentExtendedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^permit\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid permit command' };

  const aclName = state.currentExtendedAcl;
  const accessLists = { ...(state.accessLists || {}) };
  accessLists[aclName] = [...(accessLists[aclName] || []), `permit ${match[1]}`];

  return { success: true, newState: { accessLists } };
}

export function cmdExtAclDeny(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-ext-nacl' || !state.currentExtendedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^deny\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid deny command' };

  const aclName = state.currentExtendedAcl;
  const accessLists = { ...(state.accessLists || {}) };
  accessLists[aclName] = [...(accessLists[aclName] || []), `deny ${match[1]}`];

  return { success: true, newState: { accessLists } };
}

export function cmdExtAclNoPermit(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-ext-nacl' || !state.currentExtendedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+permit\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  const rule = `permit ${match[1]}`;
  const aclName = state.currentExtendedAcl;
  const accessLists = { ...(state.accessLists || {}) };
  accessLists[aclName] = (accessLists[aclName] || []).filter((r: string) => r !== rule);

  return { success: true, newState: { accessLists } };
}

export function cmdExtAclNoDeny(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-ext-nacl' || !state.currentExtendedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^no\s+deny\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  const rule = `deny ${match[1]}`;
  const aclName = state.currentExtendedAcl;
  const accessLists = { ...(state.accessLists || {}) };
  accessLists[aclName] = (accessLists[aclName] || []).filter((r: string) => r !== rule);

  return { success: true, newState: { accessLists } };
}

export function cmdNoIpAccessList(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: '% Invalid command' };

  const match = input.match(/^no\s+ip\s+access-list\s+(standard|extended)\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  const aclName = match[2];
  const accessLists = { ...(state.accessLists || {}) };
  delete accessLists[aclName];

  return { success: true, output: `IP access-list ${aclName} removed`, newState: { accessLists } };
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

  const execAliases = { ...(state.execAliases || {}) };
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
  const pools = { ...(state.natPools || {}) };
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
