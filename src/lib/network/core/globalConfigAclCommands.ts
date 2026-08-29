import { iosModeError } from './iosErrors';
import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult } from '../types';

export function cmdIpAccessList(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: '% Invalid command' };

  const match = input.match(/^ip\s+access-list\s+(standard|extended)\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ip access-list command' };

  const aclTypeRaw = match[1].toLowerCase();
  const aclType = aclTypeRaw === 'extended' ? 'extended' as const : 'standard' as const;
  const aclName = match[2];
  const accessLists = { ...state.accessLists };
  const namedAclTypes = { ...state.namedAclTypes };
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

export function cmdIpv6AccessList(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: '% Invalid command' };

  const match = input.match(/^ipv6\s+access-list\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid ipv6 access-list command' };

  const aclName = match[1];
  const ipv6AccessLists = { ...state.ipv6AccessLists };
  if (!ipv6AccessLists[aclName]) {
    ipv6AccessLists[aclName] = [];
  }

  return {
    success: true,
    output: '',
    newState: {
      currentMode: 'config-ipv6-acl',
      currentIpv6Acl: aclName,
      ipv6AccessLists
    }
  };
}

export function cmdIpv6AclPermit(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-ipv6-acl' || !state.currentIpv6Acl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^permit\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid permit command' };

  const rule = `permit ${match[1]}`;
  const ipv6AccessLists = { ...state.ipv6AccessLists };
  const aclName = state.currentIpv6Acl;
  ipv6AccessLists[aclName] = [...(ipv6AccessLists[aclName] || []), rule];

  return {
    success: true,
    newState: { ipv6AccessLists }
  };
}

export function cmdIpv6AclDeny(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-ipv6-acl' || !state.currentIpv6Acl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^deny\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid deny command' };

  const rule = `deny ${match[1]}`;
  const ipv6AccessLists = { ...state.ipv6AccessLists };
  const aclName = state.currentIpv6Acl;
  ipv6AccessLists[aclName] = [...(ipv6AccessLists[aclName] || []), rule];

  return {
    success: true,
    newState: { ipv6AccessLists }
  };
}

export function cmdNamedAclPermit(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config-std-nacl' || !state.currentNamedAcl) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^permit\s+(.+)$/i);
  if (!match) return { success: false, error: '% Invalid permit command' };

  const rule = `permit ${match[1]}`;
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
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
  const accessLists = { ...state.accessLists };
  accessLists[aclName] = (accessLists[aclName] || []).filter((r: string) => r !== rule);

  return { success: true, newState: { accessLists } };
}

export function cmdNoIpAccessList(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: '% Invalid command' };

  const match = input.match(/^no\s+ip\s+access-list\s+(standard|extended)\s+(\S+)$/i);
  if (!match) return { success: false, error: '% Invalid command' };

  const aclName = match[2];
  const accessLists = { ...state.accessLists };
  delete accessLists[aclName];

  return { success: true, output: `IP access-list ${aclName} removed`, newState: { accessLists } };
}