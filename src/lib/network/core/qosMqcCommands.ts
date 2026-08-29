import type { CommandContext } from './commandTypes';
import type { SwitchState, CommandResult } from '../types';
import { iosModeError } from './iosErrors';
export function cmdClassMap(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success: false, error: iosModeError() };
  const m = input.match(/^class-map\s+(match-any|match-all)\s+(\S+)/i); if (!m) return { success:false,error:'% Invalid class-map syntax' };
  return { success:true, output:`Class-map ${m[2]} created`, newState:{ qosClassMaps:{ ...state.qosClassMaps, [m[2]]:{match:m[1].slice(6).toLowerCase() as 'all'|'any',criteria:[]} } } };
}
export function cmdPolicyMap(state: SwitchState, input: string, _ctx: CommandContext): CommandResult {
  if (state.currentMode !== 'config') return { success:false,error:iosModeError() }; const m=input.match(/^policy-map\s+(\S+)/i); if(!m)return {success:false,error:'% Invalid policy-map syntax'};
  return {success:true,output:`Policy-map ${m[1]} created`,newState:{qosPolicyMaps:{...state.qosPolicyMaps,[m[1]]:{classes:{}}}}};
}
