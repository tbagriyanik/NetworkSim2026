/**
 * agingEngine.ts — Real-time ARP and MAC Aging Engine
 *
 * Runs background aging checks to prune expired ARP cache entries and dynamic MAC entries.
 */

import { SwitchState } from './types';
import { cleanExpiredMacEntries, MacLifecycleEvent } from './macLearning';
import { cleanExpiredArpEntries } from './arp';

export interface AgingResult {
  agedMacCount: number;
  agedArpCount: number;
  events: MacLifecycleEvent[];
}

/**
 * Execute real-time aging tick across all device states.
 */
export function runAgingTick(deviceStates: Map<string, SwitchState>): AgingResult {
  let agedMacCount = 0;
  let agedArpCount = 0;
  const events: MacLifecycleEvent[] = [];

  for (const [deviceId, state] of deviceStates.entries()) {
    if (!state) continue;

    // MAC aging
    if (state.macAddressTable && state.macAddressTable.length > 0) {
      const prevCount = state.macAddressTable.length;
      const macEvents = cleanExpiredMacEntries(state, deviceId);
      const afterCount = state.macAddressTable.length;
      const removed = prevCount - afterCount;
      if (removed > 0) {
        agedMacCount += removed;
        events.push(...macEvents);
      }
    }

    // ARP aging
    if (state.arpCache && state.arpCache.length > 0) {
      const prevArpCount = state.arpCache.length;
      cleanExpiredArpEntries(state);
      const afterArpCount = state.arpCache.length;
      const removedArp = prevArpCount - afterArpCount;
      if (removedArp > 0) {
        agedArpCount += removedArp;
      }
    }
  }

  return { agedMacCount, agedArpCount, events };
}
