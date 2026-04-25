import { SwitchState } from './types';

/**
 * Ensures that deviceStates is a Map.
 * If it's a plain object (Record<string, SwitchState>), it converts it to a Map.
 */
export function ensureDeviceStatesMap(deviceStates: Map<string, SwitchState> | Record<string, SwitchState> | undefined | null): Map<string, SwitchState> {
  if (!deviceStates) return new Map();
  if (deviceStates instanceof Map) return deviceStates;
  
  try {
    return new Map(Object.entries(deviceStates));
  } catch (err) {
    console.error('Failed to convert deviceStates to Map:', err);
    return new Map();
  }
}
