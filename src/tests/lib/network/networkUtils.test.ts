import { describe, it, expect, vi } from 'vitest';
import { ensureDeviceStatesMap } from '@/lib/network/networkUtils';
import type { SwitchState } from '@/lib/network/types';

vi.mock('@/lib/errors/errorHandler', () => ({
  errorHandler: { logError: vi.fn() },
}));

function makeState(overrides?: Partial<SwitchState>): SwitchState {
  return { id: 'SW1', hostname: 'SW1', macAddress: '00:11:22:33:44:55', switchModel: 'WS-C2960-24TT-L', switchLayer: 'L2', currentMode: 'privileged', ports: {}, ...overrides } as SwitchState;
}

describe('ensureDeviceStatesMap', () => {
  it('should return empty map for null', () => {
    const result = ensureDeviceStatesMap(null);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should return empty map for undefined', () => {
    const result = ensureDeviceStatesMap(undefined);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should return the same Map instance if input is a Map', () => {
    const map = new Map<string, SwitchState>();
    map.set('SW1', makeState());
    const result = ensureDeviceStatesMap(map);
    expect(result).toBe(map);
  });

  it('should convert Record to Map', () => {
    const record = { SW1: makeState() };
    const result = ensureDeviceStatesMap(record);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(1);
    expect(result.has('SW1')).toBe(true);
  });

  it('should handle empty record', () => {
    const result = ensureDeviceStatesMap({});
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });
});
