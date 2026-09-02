import { describe, it, expect } from 'vitest';
import { executeCommand } from '@/lib/network/executor';
import { runFhrpElection, getGlbpVirtualMac } from '@/lib/network/fhrp';
import { calculateEigrp6Routes } from '@/lib/network/eigrp-dual';
import { SwitchState } from '@/lib/network/types';

function createMockState(overrides?: Partial<SwitchState>): SwitchState {
  return {
    hostname: 'Router1',
    macAddress: '0001.0002.0003',
    switchModel: 'WS-C3650-24PS' as any,
    switchLayer: 'L3',
    deviceType: 'router',
    currentMode: 'privileged',
    ports: {
      'gi0/0': {
        id: 'gi0/0',
        name: 'GigabitEthernet0/0',
        status: 'connected',
        vlan: 1,
        mode: 'routed',
        duplex: 'auto',
        speed: 'auto',
        shutdown: false,
        type: 'gigabitethernet',
        ipAddress: '10.0.0.1',
        subnetMask: '255.255.255.0',
        ipv6Address: '2001:db8:1::1/64'
      },
      'gi0/1': {
        id: 'gi0/1',
        name: 'GigabitEthernet0/1',
        status: 'connected',
        vlan: 1,
        mode: 'routed',
        duplex: 'auto',
        speed: 'auto',
        shutdown: false,
        type: 'gigabitethernet',
        ipAddress: '192.168.1.1',
        subnetMask: '255.255.255.0'
      }
    },
    vlans: {},
    security: {
      enableSecretEncrypted: false,
      servicePasswordEncryption: false,
      users: [],
      consoleLine: { login: false, transportInput: ['all'] },
      vtyLines: { login: false, transportInput: ['all'] }
    },
    runningConfig: [],
    commandHistory: [],
    historyIndex: 0,
    version: {
      nosVersion: '15.2',
      modelName: 'ISR4331',
      serialNumber: 'SN12345',
      uptime: '1 hour'
    },
    macAddressTable: [],
    arpCache: [],
    bootTime: Date.now(),
    ipRouting: true,
    ...overrides
  };
}

describe('Advanced Networking Features', () => {
  describe('EIGRP for IPv6', () => {
    it('configures ipv6 router eigrp globally and on interface', () => {
      let state = createMockState();
      let res = executeCommand(state, 'configure terminal');
      state = { ...state, ...res.newState };

      res = executeCommand(state, 'ipv6 router eigrp 100');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.eigrp6Config?.as).toBe('100');

      res = executeCommand(state, 'exit');
      state = { ...state, ...res.newState };

      res = executeCommand(state, 'interface gi0/0');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.currentMode).toBe('interface');
      expect(state.currentInterface).toBe('gi0/0');

      res = executeCommand(state, 'ipv6 eigrp 100');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.ports['gi0/0'].ipv6Eigrp?.enabled).toBe(true);
    });

    it('calculates IPv6 EIGRP routes', () => {
      const state1 = createMockState({
        eigrp6Config: { as: '100' },
        ports: {
          'gi0/0': {
            id: 'gi0/0',
            name: 'GigabitEthernet0/0',
            status: 'connected',
            vlan: 1,
            mode: 'routed',
            duplex: 'auto',
            speed: 'auto',
            shutdown: false,
            type: 'gigabitethernet',
            ipv6Address: '2001:db8:1::1/64',
            ipv6LinkLocal: 'FE80::1',
            ipv6Eigrp: { enabled: true, as: '100' }
          }
        }
      });

      const state2 = createMockState({
        hostname: 'Router2',
        eigrp6Config: { as: '100' },
        ports: {
          'gi0/0': {
            id: 'gi0/0',
            name: 'GigabitEthernet0/0',
            status: 'connected',
            vlan: 1,
            mode: 'routed',
            duplex: 'auto',
            speed: 'auto',
            shutdown: false,
            type: 'gigabitethernet',
            ipv6Address: '2001:db8:1::2/64',
            ipv6LinkLocal: 'FE80::2',
            ipv6Eigrp: { enabled: true, as: '100' }
          },
          'gi0/1': {
            id: 'gi0/1',
            name: 'GigabitEthernet0/1',
            status: 'connected',
            vlan: 1,
            mode: 'routed',
            duplex: 'auto',
            speed: 'auto',
            shutdown: false,
            type: 'gigabitethernet',
            ipv6Address: '2001:db8:2::1/64'
          }
        }
      });

      const deviceMap = new Map<string, SwitchState>([
        ['r1', state1],
        ['r2', state2]
      ]);

      const routes = calculateEigrp6Routes('r1', deviceMap);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.some(r => r.destination.includes('2001:db8:2::1'))).toBe(true);
    });
  });

  describe('Prefix-list & Route-map', () => {
    it('configures ip prefix-list and displays it', () => {
      let state = createMockState();
      state = { ...state, ...executeCommand(state, 'configure terminal').newState };

      let res = executeCommand(state, 'ip prefix-list MYLIST seq 10 permit 10.0.0.0/8 ge 16 le 24');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };

      expect(state.prefixLists?.['MYLIST']).toBeDefined();
      expect(state.prefixLists?.['MYLIST'][0].prefix).toBe('10.0.0.0/8');
      expect(state.prefixLists?.['MYLIST'][0].ge).toBe(16);

      res = executeCommand(state, 'do show ip prefix-list');
      expect(res.success).toBe(true);
      expect(res.output).toContain('MYLIST');
      expect(res.output).toContain('10.0.0.0/8');
    });

    it('configures route-map with match and set subcommands', () => {
      let state = createMockState();
      state = { ...state, ...executeCommand(state, 'configure terminal').newState };

      let res = executeCommand(state, 'route-map PBR_MAP permit 10');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.currentMode).toBe('config-route-map');

      res = executeCommand(state, 'match ip address prefix-list MYLIST');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };

      res = executeCommand(state, 'set metric 100');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };

      res = executeCommand(state, 'do show route-map');
      expect(res.success).toBe(true);
      expect(res.output).toContain('PBR_MAP');
      expect(res.output).toContain('prefix-list MYLIST');
      expect(res.output).toContain('metric 100');
    });
  });

  describe('GLBP (Gateway Load Balancing Protocol)', () => {
    it('generates virtual MACs correctly', () => {
      const mac1 = getGlbpVirtualMac(1, 1);
      expect(mac1).toBe('0007.b400.0101');
      const mac2 = getGlbpVirtualMac(10, 2);
      expect(mac2).toBe('0007.b400.0a02');
    });

    it('configures GLBP on interface and runs election', () => {
      let state1 = createMockState();
      state1 = { ...state1, ...executeCommand(state1, 'configure terminal').newState };
      state1 = { ...state1, ...executeCommand(state1, 'interface gi0/0').newState };
      state1 = { ...state1, ...executeCommand(state1, 'glbp 1 ip 192.168.1.254').newState };
      state1 = { ...state1, ...executeCommand(state1, 'glbp 1 priority 120').newState };

      let state2 = createMockState({
        hostname: 'Router2',
        ports: {
          'gi0/0': {
            id: 'gi0/0',
            name: 'GigabitEthernet0/0',
            status: 'connected',
            vlan: 1,
            mode: 'routed',
            duplex: 'auto',
            speed: 'auto',
            shutdown: false,
            type: 'gigabitethernet',
            ipAddress: '10.0.0.2',
            subnetMask: '255.255.255.0'
          }
        }
      });
      state2 = { ...state2, ...executeCommand(state2, 'configure terminal').newState };
      state2 = { ...state2, ...executeCommand(state2, 'interface gi0/0').newState };
      state2 = { ...state2, ...executeCommand(state2, 'glbp 1 ip 192.168.1.254').newState };
      state2 = { ...state2, ...executeCommand(state2, 'glbp 1 priority 100').newState };

      const map = new Map<string, SwitchState>([
        ['r1', state1],
        ['r2', state2]
      ]);

      const result = runFhrpElection(map);
      const resState1 = result.get('r1');
      const resState2 = result.get('r2');

      expect(resState1?.ports['gi0/0'].glbp?.groups?.[1].state).toBe('Active');
      expect(resState2?.ports['gi0/0'].glbp?.groups?.[1].state).toBe('Standby');
      expect(resState1?.ports['gi0/0'].glbp?.groups?.[1].avgMac).toBe('0007.b400.0101');
    });
  });

  describe('Loop Guard & NetFlow', () => {
    it('configures STP loopguard globally and per interface', () => {
      let state = createMockState({ switchLayer: 'L3', deviceType: 'switchL3', switchModel: 'WS-C3650-24PS' });
      state = { ...state, ...executeCommand(state, 'configure terminal').newState };

      let res = executeCommand(state, 'spanning-tree loopguard default');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.loopguardDefault).toBe(true);

      res = executeCommand(state, 'interface gi0/0');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };

      res = executeCommand(state, 'spanning-tree guard loop');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.ports['gi0/0'].spanningTree?.loopguard).toBe('enable');
    });

    it('configures NetFlow export and interface monitoring', () => {
      let state = createMockState();
      state = { ...state, ...executeCommand(state, 'configure terminal').newState };

      let res = executeCommand(state, 'ip flow-export destination 10.0.0.100 2055');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.netflowConfig?.exportDestination).toBe('10.0.0.100');

      res = executeCommand(state, 'interface gi0/0');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };

      res = executeCommand(state, 'ip flow ingress');
      expect(res.success).toBe(true);
      state = { ...state, ...res.newState };
      expect(state.ports['gi0/0'].netflowIngress).toBe(true);

      res = executeCommand(state, 'do show ip flow export');
      expect(res.success).toBe(true);
      expect(res.output).toContain('10.0.0.100');

      res = executeCommand(state, 'do show ip cache flow');
      expect(res.success).toBe(true);
      expect(res.output).toContain('IP packet size distribution');
    });
  });
});
