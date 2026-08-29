import { SwitchState } from './types';

export type NdpNeighborState = 'INCMP' | 'REACH' | 'STALE' | 'DELAY' | 'PROBE' | 'STATIC';

export interface NdpNeighborEntry {
  ipv6: string;
  mac: string;
  interface: string;
  state: NdpNeighborState;
  timestamp: number;
  isRouter?: boolean;
}

const NDP_TIMEOUT = 240000; // 4 minutes

/**
 * Get MAC address for an IPv6 from NDP cache
 */
export function getMacFromNdpCache(
  deviceId: string,
  targetIpv6: string,
  deviceStates: Map<string, SwitchState>
): string | null {
  const state = deviceStates.get(deviceId);
  if (!state || !state.ndpCache) return null;

  cleanExpiredNdpEntries(state);

  const entry = state.ndpCache.find(e => e.ipv6.toLowerCase() === targetIpv6.toLowerCase());
  return entry ? entry.mac : null;
}

/**
 * Add or update NDP entry
 */
export function updateNdpCache(
  deviceId: string,
  ipv6: string,
  mac: string,
  interfaceName: string,
  deviceStates: Map<string, SwitchState>,
  ndpState: NdpNeighborState = 'REACH',
  isRouter: boolean = false
): void {
  const state = deviceStates.get(deviceId);
  if (!state) return;

  if (!state.ndpCache) {
    state.ndpCache = [];
  }

  state.ndpCache = state.ndpCache.filter(e => e.ipv6.toLowerCase() !== ipv6.toLowerCase());

  state.ndpCache.push({
    ipv6,
    mac,
    interface: interfaceName,
    state: ndpState,
    timestamp: Date.now(),
    isRouter
  });
}

/**
 * Remove expired NDP entries
 */
export function cleanExpiredNdpEntries(state: SwitchState): void {
  if (!state.ndpCache || state.ndpCache.length === 0) return;

  const now = Date.now();
  const hasExpired = state.ndpCache.some(entry => (now - entry.timestamp) >= NDP_TIMEOUT);
  if (!hasExpired) return;

  state.ndpCache = state.ndpCache.filter(entry => {
    return (now - entry.timestamp) < NDP_TIMEOUT;
  });
}

/**
 * Clear entire NDP cache
 */
export function clearNdpCache(deviceId: string, deviceStates: Map<string, SwitchState>): void {
  const state = deviceStates.get(deviceId);
  if (!state) return;

  state.ndpCache = [];
}

/**
 * Simulate NDP NS/NA resolution process
 */
export function performNdpResolution(
  sourceDeviceId: string,
  targetIpv6: string,
  targetMac: string,
  interfaceName: string,
  deviceStates: Map<string, SwitchState>,
  isRouter: boolean = false
): string | null {
  const cachedMac = getMacFromNdpCache(sourceDeviceId, targetIpv6, deviceStates);
  if (cachedMac) {
    return cachedMac;
  }

  updateNdpCache(sourceDeviceId, targetIpv6, targetMac, interfaceName, deviceStates, 'REACH', isRouter);
  return targetMac;
}

/**
 * Get NDP cache for display
 */
export function getNdpCacheForDisplay(
  deviceId: string,
  deviceStates: Map<string, SwitchState>
): NdpNeighborEntry[] {
  const state = deviceStates.get(deviceId);
  if (!state || !state.ndpCache) return [];

  cleanExpiredNdpEntries(state);
  return state.ndpCache as NdpNeighborEntry[];
}

/**
 * Remove specific NDP entry
 */
export function removeNdpEntry(
  deviceId: string,
  ipv6: string,
  deviceStates: Map<string, SwitchState>
): void {
  const state = deviceStates.get(deviceId);
  if (!state || !state.ndpCache) return;

  state.ndpCache = state.ndpCache.filter(e => e.ipv6.toLowerCase() !== ipv6.toLowerCase());
}
