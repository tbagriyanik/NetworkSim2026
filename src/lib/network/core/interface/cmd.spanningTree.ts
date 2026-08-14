import { iosModeError } from '../iosErrors';
import type { CommandContext } from '../commandTypes';
import type { SwitchState, CommandResult, Port, EtherChannelMode } from '../../types';
import { getPvstUpdate } from '../commandHelpers';
import {
  isInInterfaceMode,
  applyToSelectedPorts,
  mutatePortAtInterface
} from './helpers';

export function cmdSpanningTreePortfast(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  return mutatePortAtInterface(state, (port) => {
    const spanningTree = port.spanningTree ?? {};
    return { ...port, spanningTree: { ...spanningTree, portfast: true } };
  });
}

/**
 * Spanning-Tree BPDU Guard
 */
export function cmdSpanningTreeBpduguard(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  return mutatePortAtInterface(state, (port) => {
    const spanningTree = port.spanningTree ?? {};
    return { ...port, spanningTree: { ...spanningTree, bpduguard: true } };
  });
}

/**
 * IP Address - Assign IP to routed port or VLAN interface
 */
export function cmdNoChannelGroup(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (!isInInterfaceMode(state) || !state.currentInterface) {
    return { success: false, error: '% No interface selected' };
  }

  const newPorts = applyToSelectedPorts(state, (port: Port) => ({
    ...port,
    channelGroup: undefined,
    channelProtocol: undefined
  }));

  return { success: true, newState: { ports: newPorts } };
}

/**
 * No UDLD - Disable UDLD on interface
 */
export function cmdNoSpanningTree(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (!isInInterfaceMode(state) || !state.currentInterface) {
    return { success: false, error: '% No interface selected' };
  }

  const newPorts = applyToSelectedPorts(state, (port: Port) => ({
    ...port,
    spanningTreeEnabled: false
  }));

  return { success: true, newState: { ports: newPorts } };
}

/**
 * Debug - Enable debug
 */
export function cmdChannelGroup(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (!isInInterfaceMode(state)) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^channel-group\s+(\d+)\s+mode\s+(active|passive|on|desirable|auto)$/i);
  if (!match) {
    return { success: false, error: '% Invalid channel-group command. Use: channel-group <1-48> mode {active|passive|on|desirable|auto}' };
  }

  const group = parseInt(match[1]);
  const mode = match[2].toLowerCase() as EtherChannelMode;

  const updatePort = (port: Port) => ({ ...port, channelGroup: group, channelMode: mode });

  if (state.selectedInterfaces?.length) {
    return { success: true, newState: { ports: applyToSelectedPorts(state, updatePort) } };
  }

  if (!state.currentInterface) return { success: false, error: '% No interface selected' };

  const newPorts = { ...state.ports };
  newPorts[state.currentInterface] = updatePort(newPorts[state.currentInterface] || {} as Port);
  return { success: true, output: `Channel-group ${group} mode ${mode} configured`, newState: { ports: newPorts } };
}

/**
 * IP Helper-Address - Set DHCP relay address
 */
export function cmdSpanningTreeBpduguardDisable(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (!isInInterfaceMode(state)) {
    return { success: false, error: iosModeError() };
  }

  const updatePort = (port: Port) => ({ ...port, bpduguard: false });

  if (state.selectedInterfaces?.length) {
    return { success: true, newState: { ports: applyToSelectedPorts(state, updatePort) } };
  }

  if (!state.currentInterface) return { success: false, error: '% No interface selected' };

  const newPorts = { ...state.ports };
  newPorts[state.currentInterface] = updatePort(newPorts[state.currentInterface] || {});
  return { success: true, output: 'BPDU guard disabled', newState: { ports: newPorts } };
}

/**
 * Spanning-Tree Cost - Set STP path cost
 */
export function cmdSpanningTreeCost(state: SwitchState, input: string, ctx: CommandContext): CommandResult {
  if (!isInInterfaceMode(state)) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^spanning-tree\s+cost\s+(\d+)$/i);
  if (!match) {
    return { success: false, error: '% Invalid spanning-tree cost command. Use: spanning-tree cost <1-200000000>' };
  }

  const cost = parseInt(match[1]);
  const updatePort = (port: Port) => ({ ...port, stpCost: cost });

  let newPorts;
  if (state.selectedInterfaces?.length) {
    newPorts = applyToSelectedPorts(state, updatePort);
  } else {
    if (!state.currentInterface) return { success: false, error: '% No interface selected' };
    newPorts = { ...state.ports };
    newPorts[state.currentInterface] = updatePort(newPorts[state.currentInterface] || {});
  }

  const updatedCurrentState = { ...state, ports: newPorts };
  const pvst = getPvstUpdate(updatedCurrentState, ctx);
  if ('error' in pvst) return pvst.error;
  const { allUpdatedStates, myUpdatedState } = pvst;

  return {
    success: true,
    output: `STP cost set to ${cost}`,
    newState: myUpdatedState || ({ ports: newPorts } as Partial<SwitchState>),
    deviceStates: allUpdatedStates
  };
}

/**
 * IPv6 Address
 */
export function cmdSpanningTreePriority(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (!isInInterfaceMode(state)) {
    return { success: false, error: iosModeError() };
  }

  const match = input.match(/^spanning-tree\s+priority\s+(\d+)$/i);
  if (!match) {
    return { success: false, error: '% Invalid spanning-tree priority command. Use: spanning-tree priority <0-240>' };
  }

  const priority = parseInt(match[1]);
  if (priority < 0 || priority > 240 || priority % 16 !== 0) {
    return { success: false, error: '% Priority must be a multiple of 16 between 0 and 240' };
  }

  const updatePort = (port: Port) => ({ ...port, stpPriority: priority });

  if (state.selectedInterfaces?.length) {
    return { success: true, newState: { ports: applyToSelectedPorts(state, updatePort) } };
  }

  if (!state.currentInterface) return { success: false, error: '% No interface selected' };

  const newPorts = { ...state.ports };
  newPorts[state.currentInterface] = updatePort(newPorts[state.currentInterface] || {});
  return { success: true, output: `STP port priority set to ${priority}`, newState: { ports: newPorts } };
}



/**
 * Switchport Trunk Encapsulation
 */
