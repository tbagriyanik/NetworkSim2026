import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult } from '../types';
import type { Dot1xSession } from '../dot1x';

export function cmdDot1xSystem(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: '% Invalid mode' };
  return { success: true, output: 'dot1x system-auth-control enabled', newState: { dot1xSystemAuthControl: true } };
}

export function cmdDot1xPort(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  const m = input.match(/^dot1x\s+port-control\s+(auto|force-authorized|force-unauthorized)$/i);
  if (!m || !state.currentInterface) return { success: false, error: '% Invalid dot1x command' };
  const mode = m[1].toLowerCase() as 'auto' | 'force-authorized' | 'force-unauthorized';
  const newSession: Dot1xSession = {
    port: state.currentInterface,
    portControl: mode,
    state: mode === 'force-authorized' ? 'authorized' : 'unauthorized'
  };
  return {
    success: true,
    output: `802.1X port-control ${m[1]} configured`,
    newState: { dot1xSessions: { ...state.dot1xSessions, [state.currentInterface]: newSession } }
  };
}
