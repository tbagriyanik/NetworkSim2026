/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { showHandlers } from '@/lib/network/core/showCommands';
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
    switchModel: 'WS-C3650-24PS' as const,
    switchLayer: 'L3' as const,
    currentMode: 'privileged' as const,
    ports: {
      'gi0/1': {
        id: 'gi0/1', name: 'GigabitEthernet0/1', status: 'connected' as const,
        vlan: 1, mode: 'access' as const, duplex: 'auto' as const,
        speed: 'auto' as const, shutdown: false, type: 'gigabitethernet' as const,
        accessGroupIn: 'INSIDE_ACL',
      },
      'gi0/2': {
        id: 'gi0/2', name: 'GigabitEthernet0/2', status: 'connected' as const,
        vlan: 1, mode: 'access' as const, duplex: 'auto' as const,
        speed: 'auto' as const, shutdown: false, type: 'gigabitethernet' as const,
        accessGroupOut: 'OUTSIDE_ACL',
        nameif: 'outside',
        securityLevel: 0,
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

describe('showHandlers - new commands', () => {
  describe('show nameif', () => {
    it('should display interfaces with nameif configured', () => {
      const state = makeBaseState();
      const result = showHandlers['show nameif'](state, 'show nameif', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('gi0/2');
      expect(result.output).toContain('outside');
    });

    it('should show "not set" for interfaces without nameif', () => {
      const state = makeBaseState();
      const result = showHandlers['show nameif'](state, 'show nameif', mockCtx);
      expect(result.output).toContain('not set');
    });
  });

  describe('show ip access-group', () => {
    it('should display ACLs applied to interfaces', () => {
      const state = makeBaseState();
      const result = showHandlers['show ip access-group'](state, 'show ip access-group', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('INSIDE_ACL');
      expect(result.output).toContain('OUTSIDE_ACL');
    });
  });

  describe('show dot11 associations', () => {
    it('should show message when no clients are associated', () => {
      const state = makeBaseState();
      const result = showHandlers['show dot11 associations'](state, 'show dot11 associations', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('No wireless clients');
    });

    it('should list associated clients', () => {
      const state = makeBaseState();
      (state as any).wirelessClients = [
        { iface: 'Dot11Radio0', ssid: 'CorpNet', mac: 'aaaa.bbbb.cccc', status: 'associated' },
      ];
      const result = showHandlers['show dot11 associations'](state, 'show dot11 associations', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('CorpNet');
      expect(result.output).toContain('aaaa.bbbb.cccc');
    });
  });

  describe('show dot11 statistics', () => {
    it('should show zero statistics when none recorded', () => {
      const state = makeBaseState();
      const result = showHandlers['show dot11 statistics'](state, 'show dot11 statistics', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Packets Received: 0');
      expect(result.output).toContain('Packets Transmitted: 0');
    });

    it('should display recorded statistics', () => {
      const state = makeBaseState();
      (state as any).dot11Stats = { rxPackets: 150, txPackets: 200, crcErrors: 3, retries: 10 };
      const result = showHandlers['show dot11 statistics'](state, 'show dot11 statistics', mockCtx);
      expect(result.output).toContain('Packets Received: 150');
      expect(result.output).toContain('Packets Transmitted: 200');
      expect(result.output).toContain('CRC Errors: 3');
      expect(result.output).toContain('Retries: 10');
    });
  });

  describe('show wlan', () => {
    it('should display specific WLAN details', () => {
      const state = makeBaseState();
      (state as any).wlans = { '1': { name: 'CorpNet', ssid: 'CorpSSID' } };
      const result = showHandlers['show wlan'](state, 'show wlan 1', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('WLAN ID: 1');
      expect(result.output).toContain('CorpNet');
      expect(result.output).toContain('CorpSSID');
    });

    it('should return error for non-existent WLAN', () => {
      const state = makeBaseState();
      (state as any).wlans = {};
      const result = showHandlers['show wlan'](state, 'show wlan 99', mockCtx);
      expect(result.success).toBe(false);
    });
  });

  describe('show vtp password', () => {
    it('should show VTP password when set', () => {
      const state = makeBaseState();
      (state as any).vtp = { password: 'mypassword' };
      const result = showHandlers['show vtp password'](state, 'show vtp password', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('mypassword');
    });

    it('should show not set message when no password', () => {
      const state = makeBaseState();
      (state as any).vtp = {};
      const result = showHandlers['show vtp password'](state, 'show vtp password', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('not set');
    });
  });

  describe('show ip eigrp neighbors', () => {
    it('should show message when no neighbors', () => {
      const state = makeBaseState();
      const result = showHandlers['show ip eigrp neighbors'](state, 'show ip eigrp neighbors', mockCtx);
      expect(result.success).toBe(true);
    });
  });

  describe('show ip bgp summary', () => {
    it('should render without error', () => {
      const state = makeBaseState();
      const result = showHandlers['show ip bgp summary'](state, 'show ip bgp summary', mockCtx);
      expect(result.success).toBe(true);
    });
  });

  describe('show ip bgp', () => {
    it('should render without error', () => {
      const state = makeBaseState();
      const result = showHandlers['show ip bgp'](state, 'show ip bgp', mockCtx);
      expect(result.success).toBe(true);
    });
  });

  describe('show ipv6 rip', () => {
    it('should show not configured message', () => {
      const state = makeBaseState();
      const result = showHandlers['show ipv6 rip'](state, 'show ipv6 rip', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('not configured');
    });

    it('should show configured RIPng processes', () => {
      const state = makeBaseState();
      (state as any).ipv6RipProcesses = { R1: { interfaces: ['gi0/1'] } };
      const result = showHandlers['show ipv6 rip'](state, 'show ipv6 rip', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('R1');
    });
  });

  describe('show ipv6 ospf', () => {
    it('should show not configured message', () => {
      const state = makeBaseState();
      const result = showHandlers['show ipv6 ospf'](state, 'show ipv6 ospf', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('not configured');
    });

    it('should show configured OSPFv3 processes', () => {
      const state = makeBaseState();
      (state as any).ipv6OspfProcesses = { '10': { routerId: '1.1.1.1', areas: ['0'] } };
      const result = showHandlers['show ipv6 ospf'](state, 'show ipv6 ospf', mockCtx);
      expect(result.success).toBe(true);
      expect(result.output).toContain('1.1.1.1');
    });
  });
});
