import type { SwitchState, CommandResult } from '../types';
import type { CommandContext } from './commandTypes';
import { calculatePVST } from './showCommands';

export type PvstUpdateResult =
  | { error: CommandResult }
  | { allUpdatedStates: Map<string, SwitchState>; myUpdatedState: SwitchState | undefined };

export function getPvstUpdate(
  updatedCurrentState: SwitchState,
  ctx: CommandContext
): PvstUpdateResult {
  const sourceDeviceId = ctx.sourceDeviceId;
  if (!sourceDeviceId) {
    return { error: { success: false, error: '% Internal error: source device not available' } };
  }

  const allUpdatedStates = calculatePVST(updatedCurrentState, ctx, sourceDeviceId);
  return { allUpdatedStates, myUpdatedState: allUpdatedStates.get(sourceDeviceId) };
}
