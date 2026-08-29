import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMacFromNdpCache,
  updateNdpCache,
  cleanExpiredNdpEntries,
  clearNdpCache,
  performNdpResolution,
  getNdpCacheForDisplay,
  removeNdpEntry
} from '@/lib/network/ndp';
import { SwitchState } from '@/lib/network/types';

describe('NDP Cache and Resolution', () => {
  let deviceStates: Map<string, SwitchState>;
  let mockState: SwitchState;

  beforeEach(() => {
    vi.useFakeTimers();
    deviceStates = new Map();
    mockState = {
      ndpCache: [],
      // stub just enough for test
    } as unknown as SwitchState;
    deviceStates.set('device1', mockState);
  });

  it('adds and gets a MAC address from the NDP cache', () => {
    updateNdpCache('device1', '2001:db8::1', 'AA:BB:CC:DD:EE:FF', 'Gi0/0', deviceStates);
    const mac = getMacFromNdpCache('device1', '2001:DB8::1', deviceStates); // check case insensitivity
    expect(mac).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('cleans expired NDP entries', () => {
    updateNdpCache('device1', '2001:db8::1', 'AA:BB:CC:DD:EE:FF', 'Gi0/0', deviceStates);
    expect(mockState.ndpCache?.length).toBe(1);

    // Advance time by 5 minutes (300,000 ms), timeout is 4 mins (240,000 ms)
    vi.advanceTimersByTime(300000);

    cleanExpiredNdpEntries(mockState);
    expect(mockState.ndpCache?.length).toBe(0);
  });

  it('does not clean active NDP entries', () => {
    updateNdpCache('device1', '2001:db8::1', 'AA:BB:CC:DD:EE:FF', 'Gi0/0', deviceStates);
    vi.advanceTimersByTime(100000); // 1.6 mins
    cleanExpiredNdpEntries(mockState);
    expect(mockState.ndpCache?.length).toBe(1);
  });

  it('removes specific NDP entry', () => {
    updateNdpCache('device1', '2001:db8::1', 'AA:BB:CC:DD:EE:FF', 'Gi0/0', deviceStates);
    updateNdpCache('device1', '2001:db8::2', '11:22:33:44:55:66', 'Gi0/1', deviceStates);

    removeNdpEntry('device1', '2001:DB8::1', deviceStates);
    expect(mockState.ndpCache?.length).toBe(1);
    expect(mockState.ndpCache?.[0].ipv6).toBe('2001:db8::2');
  });

  it('clears all NDP entries', () => {
    updateNdpCache('device1', '2001:db8::1', 'AA:BB:CC:DD:EE:FF', 'Gi0/0', deviceStates);
    updateNdpCache('device1', '2001:db8::2', '11:22:33:44:55:66', 'Gi0/1', deviceStates);

    clearNdpCache('device1', deviceStates);
    expect(mockState.ndpCache?.length).toBe(0);
  });

  it('performs NDP resolution and updates cache', () => {
    const result = performNdpResolution('device1', '2001:db8::5', '00:11:22:33:44:55', 'Fa0/1', deviceStates, true);
    expect(result).toBe('00:11:22:33:44:55');

    const entry = mockState.ndpCache?.find(e => e.ipv6 === '2001:db8::5');
    expect(entry).toBeDefined();
    expect(entry?.mac).toBe('00:11:22:33:44:55');
    expect(entry?.isRouter).toBe(true);
    expect(entry?.state).toBe('REACH');
  });

  it('returns cached MAC if already resolved in performNdpResolution', () => {
    updateNdpCache('device1', '2001:db8::5', '00:11:22:33:44:55', 'Fa0/1', deviceStates);
    // Even if we provide a different MAC, it should return the cached one
    const result = performNdpResolution('device1', '2001:db8::5', '99:99:99:99:99:99', 'Fa0/1', deviceStates);
    expect(result).toBe('00:11:22:33:44:55');
  });

  it('gets NDP cache for display, filtering out expired ones', () => {
    updateNdpCache('device1', '2001:db8::1', 'AA:BB:CC:DD:EE:FF', 'Gi0/0', deviceStates);
    vi.advanceTimersByTime(300000);
    updateNdpCache('device1', '2001:db8::2', '11:22:33:44:55:66', 'Gi0/1', deviceStates);

    const displayList = getNdpCacheForDisplay('device1', deviceStates);
    expect(displayList.length).toBe(1);
    expect(displayList[0].ipv6).toBe('2001:db8::2');
  });
});
