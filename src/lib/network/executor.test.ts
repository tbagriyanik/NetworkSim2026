import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwitchState, CommandMode } from './types';
import { getPrompt } from './executor';

vi.mock('./capabilities', () => ({
  getDeviceCapabilities: vi.fn(() => ({ switching: true, routing: false, firewall: false })),
}));

vi.mock('./switchModels', () => ({
  isRouterModel: vi.fn(() => false),
}));

vi.mock('./initialState', () => ({
  getModePrompt: vi.fn(() => ''),
}));

vi.mock('./networkUtils', () => ({
  ensureDeviceStatesMap: vi.fn((deviceStates) => deviceStates || new Map()),
}));

vi.mock('./core/iosErrors', () => ({
  IOS_ERRORS: { unknown: 'Unknown command' },
  iosModeError: vi.fn(() => 'Mode error'),
}));

vi.mock('@/components/network/networkTopology.types', () => ({
  CanvasDevice: vi.fn(),
  CanvasConnection: vi.fn(),
}));

describe('Executor Core Functions', () => {
  describe('getPrompt', () => {
    const baseState: SwitchState = {
      hostname: 'SW1',
      macAddress: '00:11:22:33:44:55',
      switchModel: 'WS-C2960-24TT-L',
      switchLayer: 'L2',
      currentMode: 'user',
      ports: {}
    } as any;

    it('should generate user EXEC mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'user' };
      const result = getPrompt(state);
      expect(result).toBe('SW1>');
    });

    it('should generate privileged EXEC mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'privileged' };
      const result = getPrompt(state);
      expect(result).toBe('SW1#');
    });

    it('should generate configuration mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'config' };
      const result = getPrompt(state);
      expect(result).toBe('SW1(config)#');
    });

    it('should generate interface configuration mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'interface' };
      const result = getPrompt(state);
      expect(result).toBe('SW1(config-if)#');
    });

    it('should use default hostname when not set', () => {
      const state: SwitchState = { ...baseState, hostname: '' };
      const result = getPrompt(state);
      expect(result).toBe('Switch>');
    });

    it('should handle all command modes', () => {
      const modes: CommandMode[] = ['user', 'privileged', 'config', 'interface', 'config-if-range', 'line', 'vlan', 'router-config', 'dhcp-config', 'ssid-config', 'dot11-config'];
      const expectedPrompts = [
        'SW1>', 'SW1#', 'SW1(config)#', 'SW1(config-if)#', 'SW1(config-if-range)#',
        'SW1(config-line)#', 'SW1(config-vlan)#', 'SW1(config-router)#', 'SW1(dhcp-config)#',
        'SW1(config-ssid)#', 'SW1(config-if)#'
      ];

      modes.forEach((mode, index) => {
        const state: SwitchState = { ...baseState, currentMode: mode };
        const result = getPrompt(state);
        expect(result).toBe(expectedPrompts[index]);
      });
    });
  });
});
