import { describe, it, expect, vi } from 'vitest';
import { migrateAndValidatePersistedState } from '@/lib/store/appStore';

vi.mock('@/lib/store/tabStorage', () => ({
  createTabSpecificStorage: vi.fn(() => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  })),
}));

describe('migrateAndValidatePersistedState', () => {
  it('should return valid topology state', () => {
    const input = {
      state: {
        topology: {
          devices: [{ id: 'pc1', type: 'pc', name: 'PC1', x: 100, y: 200, ip: '192.168.1.10', ports: [] }],
          connections: [],
          notes: [],
          selectedDeviceId: null,
          zoom: 1,
          pan: { x: 0, y: 0 },
          environment: { background: 'none', temperature: 22, humidity: 50, light: 70 },
        },
        deviceStates: { switchStates: {}, pcOutputs: {} },
        activeTab: 'topology',
        activePanel: null,
        sidebarOpen: true,
        graphicsQuality: 'high',
        helpLevel: 'beginner',
      },
    };
    const result = migrateAndValidatePersistedState(input);
    expect(result.topology).toBeDefined();
    expect(result.topology?.devices).toHaveLength(1);
  });

  it('should filter invalid devices', () => {
    const input = {
      state: {
        topology: {
          devices: [
            { id: 'pc1', type: 'pc', name: 'PC1', x: 100, y: 200, ip: '192.168.1.10', ports: [] },
            { id: 'bad', type: 'unknown', name: 'Bad', x: 0, y: 0, ip: '', ports: [] },
          ],
          connections: [],
          notes: [],
          selectedDeviceId: null,
          zoom: 1,
          pan: { x: 0, y: 0 },
          environment: { background: 'none', temperature: 22, humidity: 50, light: 70 },
        },
        deviceStates: { switchStates: {}, pcOutputs: {} },
      },
    };
    const result = migrateAndValidatePersistedState(input);
    expect(result.topology?.devices).toHaveLength(1);
  });

  it('should use defaults for missing topology', () => {
    const result = migrateAndValidatePersistedState({});
    expect(result.topology?.devices).toEqual([]);
    expect(result.topology?.zoom).toBe(1);
  });

  it('should reset graphics quality for older version', () => {
    const result = migrateAndValidatePersistedState({ state: {} }, 1);
    expect(result.graphicsQuality).toBe('high');
  });

  it('should handle direct state without wrapping', () => {
    const input = {
      topology: {
        devices: [],
        connections: [],
        notes: [],
        selectedDeviceId: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        environment: { background: 'none', temperature: 22, humidity: 50, light: 70 },
      },
    };
    const result = migrateAndValidatePersistedState(input);
    expect(result.topology).toBeDefined();
  });

  it('should clean invalid connection entries', () => {
    const input = {
      state: {
        topology: {
          devices: [],
          connections: [
            { id: 'c1', sourceDeviceId: 'pc1', sourcePort: 'eth0', targetDeviceId: 'sw1', targetPort: 'fa0/1', cableType: 'straight', active: true },
            { id: 'c2', sourceDeviceId: 'pc2' },
          ],
          notes: [],
          selectedDeviceId: null,
          zoom: 1,
          pan: { x: 0, y: 0 },
          environment: { background: 'none', temperature: 22, humidity: 50, light: 70 },
        },
      },
    };
    const result = migrateAndValidatePersistedState(input);
    expect(result.topology?.connections).toHaveLength(1);
  });
});
