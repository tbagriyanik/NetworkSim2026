/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { interfaceHandlers } from '@/lib/network/core/interfaceCommands';
import { SwitchState } from '@/lib/network/types';
import { CommandContext } from '@/lib/network/core/commandTypes';

const mockCtx: CommandContext = {
  language: 'en',
  deviceStates: new Map(),
};

function makeBaseState(overrides: Record<string, any> = {}): SwitchState {
  return {
    hostname: 'SW1',
    macAddress: '00:11:22:33:44:55',
    switchModel: 'WS-C2960-24TT-L' as const,
    switchLayer: 'L2' as const,
    currentMode: 'config' as const,
    ports: {
      wlan0: {
        id: 'wlan0', name: 'wlan0', status: 'connected' as const,
        vlan: 1, mode: 'access' as const, duplex: 'auto' as const,
        speed: 'auto' as const, shutdown: false, type: 'fastethernet' as const,
      },
    },
    vlans: {},
    security: {
      enableSecretEncrypted: false, servicePasswordEncryption: false,
      users: [], consoleLine: { login: false, transportInput: [] },
      vtyLines: { login: false, transportInput: [] },
    },
    runningConfig: [],
    commandHistory: [],
    historyIndex: -1,
    version: { nosVersion: '', modelName: '', serialNumber: '', uptime: '' },
    macAddressTable: [],
    arpCache: [],
    bootTime: Date.now(),
    ipRouting: false,
    ...overrides,
  } as SwitchState;
}

describe('interfaceHandlers - WLAN commands', () => {
  describe('cmdWlan', () => {
    it('should create a WLAN and store it in state', () => {
      const state = makeBaseState();
      const result = interfaceHandlers['wlan'](state, 'wlan MyWLAN 1 MySSID', mockCtx);
      expect(result.success).toBe(true);
      const newWlans = (result.newState as any)?.wlans;
      expect(newWlans).toBeDefined();
      expect(newWlans['1']).toEqual({ name: 'MyWLAN', ssid: 'MySSID' });
    });

    it('should update wlan0 interface with the ssid', () => {
      const state = makeBaseState();
      const result = interfaceHandlers['wlan'](state, 'wlan CorpNet 2 CorpSSID', mockCtx);
      expect(result.success).toBe(true);
      const newPorts = (result.newState as any)?.ports;
      expect(newPorts).toBeDefined();
      expect(newPorts['wlan0'].wifi).toBeDefined();
    });

    it('should return error for invalid syntax', () => {
      const state = makeBaseState();
      const result = interfaceHandlers['wlan'](state, 'wlan incomplete', mockCtx);
      expect(result.success).toBe(false);
    });
  });

  describe('cmdNoWlan', () => {
    it('should delete an existing WLAN', () => {
      const state = makeBaseState();
      (state as any).wlans = { '1': { name: 'MyWLAN', ssid: 'MySSID' } };
      const result = interfaceHandlers['no wlan'](state, 'no wlan 1', mockCtx);
      expect(result.success).toBe(true);
      const newWlans = (result.newState as any)?.wlans;
      expect(newWlans).toBeDefined();
      expect(newWlans['1']).toBeUndefined();
    });

    it('should return error when WLAN does not exist', () => {
      const state = makeBaseState();
      (state as any).wlans = {};
      const result = interfaceHandlers['no wlan'](state, 'no wlan 99', mockCtx);
      expect(result.success).toBe(false);
    });

    it('should return error for missing ID', () => {
      const state = makeBaseState();
      const result = interfaceHandlers['no wlan'](state, 'no wlan', mockCtx);
      expect(result.success).toBe(false);
    });
  });
});
