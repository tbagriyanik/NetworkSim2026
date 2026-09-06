import { describe, it, expect, beforeEach } from 'vitest';
import { runFullPacketPipeline } from '@/lib/network/forwarding/packetPipeline';
import { generateIcmpUnreachable, getIcmpCodeDetails } from '@/lib/network/forwarding/icmpUtils';
import { findRouteDetailed, Route } from '@/lib/network/routing';
import { learnMacAddress, onMacLifecycleEvent, MacLifecycleEvent } from '@/lib/network/macLearning';
import { diagnoseVlanMismatches } from '@/lib/network/vlanDiagnostics';
import { runAgingTick } from '@/lib/network/agingEngine';
import type { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import type { SwitchState } from '@/lib/network/types';

describe('Advanced Packet Forwarding & Diagnostics Engine', () => {
  let devices: CanvasDevice[];
  let connections: CanvasConnection[];
  let deviceStates: Map<string, SwitchState>;

  beforeEach(() => {
    devices = [
      { id: 'PC1', name: 'PC1', type: 'pc', x: 100, y: 100, ip: '10.0.0.2', subnetMask: '255.255.255.0', macAddress: '00:11:22:33:44:55' } as any,
      { id: 'SW1', name: 'SW1', type: 'switchL2', x: 200, y: 100 } as any,
      { id: 'R1', name: 'R1', type: 'router', x: 300, y: 100 } as any,
      { id: 'R2', name: 'R2', type: 'router', x: 400, y: 100 } as any,
      { id: 'PC2', name: 'PC2', type: 'pc', x: 500, y: 100, ip: '192.168.1.2', subnetMask: '255.255.255.0', macAddress: 'AA:BB:CC:DD:EE:FF' } as any,
    ];

    connections = [
      { id: 'c1', sourceDeviceId: 'PC1', sourcePort: 'Eth0', targetDeviceId: 'SW1', targetPort: 'Fa0/1' } as any,
      { id: 'c2', sourceDeviceId: 'SW1', sourcePort: 'Fa0/2', targetDeviceId: 'R1', targetPort: 'Gi0/0' } as any,
      { id: 'c3', sourceDeviceId: 'R1', sourcePort: 'Gi0/1', targetDeviceId: 'R2', targetPort: 'Gi0/0' } as any,
      { id: 'c4', sourceDeviceId: 'R2', sourcePort: 'Gi0/1', targetDeviceId: 'PC2', targetPort: 'Eth0' } as any,
    ];

    deviceStates = new Map<string, SwitchState>([
      [
        'PC1',
        {
          ports: {
            Eth0: { id: 'Eth0', name: 'Ethernet0', status: 'connected', shutdown: false, vlan: 1, mode: 'access', duplex: 'full', speed: '1000', type: 'fastethernet', ipAddress: '10.0.0.2', subnetMask: '255.255.255.0' },
          },
        } as any,
      ],
      [
        'SW1',
        {
          macAddressTable: [
            { mac: '00:11:22:33:44:55', vlan: 1, port: 'Fa0/1', type: 'DYNAMIC', timestamp: Date.now() },
            { mac: 'AA:BB:CC:DD:EE:FF', vlan: 1, port: 'Fa0/2', type: 'DYNAMIC', timestamp: Date.now() },
          ],
          ports: {
            'Fa0/1': { id: 'Fa0/1', name: 'FastEthernet0/1', status: 'connected', shutdown: false, vlan: 1, mode: 'access', duplex: 'full', speed: '100', type: 'fastethernet' },
            'Fa0/2': { id: 'Fa0/2', name: 'FastEthernet0/2', status: 'connected', shutdown: false, vlan: 1, mode: 'access', duplex: 'full', speed: '100', type: 'fastethernet' },
          },
        } as any,
      ],
      [
        'R1',
        {
          ports: {
            'Gi0/0': { id: 'Gi0/0', name: 'GigabitEthernet0/0', status: 'connected', shutdown: false, vlan: 1, mode: 'routed', duplex: 'full', speed: '1000', type: 'gigabitethernet', ipAddress: '10.0.0.1', subnetMask: '255.255.255.0' },
            'Gi0/1': { id: 'Gi0/1', name: 'GigabitEthernet0/1', status: 'connected', shutdown: false, vlan: 1, mode: 'routed', duplex: 'full', speed: '1000', type: 'gigabitethernet', ipAddress: '172.16.0.1', subnetMask: '255.255.255.0' },
          },
          staticRoutes: [
            { destination: '192.168.1.0', subnetMask: '255.255.255.0', nextHop: 'Gi0/1', type: 'static', metric: 1 },
          ],
        } as any,
      ],
      [
        'R2',
        {
          ports: {
            'Gi0/0': { id: 'Gi0/0', name: 'GigabitEthernet0/0', status: 'connected', shutdown: false, vlan: 1, mode: 'routed', duplex: 'full', speed: '1000', type: 'gigabitethernet', ipAddress: '172.16.0.2', subnetMask: '255.255.255.0' },
            'Gi0/1': { id: 'Gi0/1', name: 'GigabitEthernet0/1', status: 'connected', shutdown: false, vlan: 1, mode: 'routed', duplex: 'full', speed: '1000', type: 'gigabitethernet', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0' },
          },
          staticRoutes: [
            { destination: '10.0.0.0', subnetMask: '255.255.255.0', nextHop: 'Gi0/0', type: 'static', metric: 1 },
          ],
        } as any,
      ],
      [
        'PC2',
        {
          ports: {
            Eth0: { id: 'Eth0', name: 'Ethernet0', status: 'connected', shutdown: false, vlan: 1, mode: 'access', duplex: 'full', speed: '1000', type: 'fastethernet', ipAddress: '192.168.1.2', subnetMask: '255.255.255.0' },
          },
        } as any,
      ],
    ]);
  });

  it('Feature 1 & 10: Runs full packet pipeline with traces and standardized drop reasons', () => {
    const frame = {
      srcMac: '00:11:22:33:44:55',
      dstMac: 'AA:BB:CC:DD:EE:FF',
      srcIp: '10.0.0.2',
      dstIp: '192.168.1.2',
      protocol: 'ICMP',
      ttl: 64,
      vlanId: 1,
      ingressPortId: 'Eth0',
    };

    const res = runFullPacketPipeline(frame as any, 'PC1', devices, deviceStates, connections);
    expect(res.allTraces.length).toBeGreaterThan(0);
    expect(res.hopResults.length).toBeGreaterThan(0);
  });

  it('Feature 2: Generates RFC-compliant ICMP error frames with codes', () => {
    const frame = {
      srcIp: '10.0.0.2',
      dstIp: '192.168.1.2',
      srcMac: '00:11:22:33:44:55',
      dstMac: 'AA:BB:CC:DD:EE:FF',
      protocol: 'UDP',
      ttl: 64,
    };

    const icmpUnreach = generateIcmpUnreachable(frame as any, 'destination-unreachable', 'ACL Denied', 13, '10.0.0.1');
    expect(icmpUnreach.protocol).toBe('ICMP');
    expect(icmpUnreach.srcIp).toBe('10.0.0.1');
    expect(icmpUnreach.dstIp).toBe('10.0.0.2');
    expect(icmpUnreach.info).toContain('Code 13');
    expect(icmpUnreach.info).toContain('Communication Administratively Prohibited');

    const details = getIcmpCodeDetails('time-exceeded', 0);
    expect(details.icmpType).toBe(11);
    expect(details.codeName).toBe('TTL Exceeded in Transit');
  });

  it('Feature 3: Standardizes TTL decrementing across L3 hops and drops on TTL 0', () => {
    const frame = {
      srcMac: '00:11:22:33:44:55',
      dstMac: 'AA:BB:CC:DD:EE:FF',
      srcIp: '10.0.0.2',
      dstIp: '192.168.1.2',
      protocol: 'ICMP',
      ttl: 1, // Only 1 hop allowed before router drops
      vlanId: 1,
      ingressPortId: 'Gi0/0',
    };

    const res = runFullPacketPipeline(frame as any, 'R1', devices, deviceStates, connections);
    expect(res.success).toBe(false);
    expect(res.dropReason).toContain('Time to Live (TTL) Exceeded');
    expect(res.finalFrame?.protocol).toBe('ICMP');
  });

  it('Feature 4: Executes real-time ARP and MAC aging tick', () => {
    const state = deviceStates.get('SW1')!;
    state.macAddressTable![0].timestamp = Date.now() - 400000; // Older than 300s

    const result = runAgingTick(deviceStates);
    expect(result.agedMacCount).toBe(1);
    expect(state.macAddressTable?.length).toBe(1);
  });

  it('Feature 6: Diagnoses VLAN native and allowed mismatches', () => {
    const sw1State = deviceStates.get('SW1')!;
    const r1State = deviceStates.get('R1')!;

    sw1State.ports['Fa0/2'].mode = 'trunk';
    sw1State.ports['Fa0/2'].nativeVlan = 10;

    r1State.ports['Gi0/0'].mode = 'trunk';
    r1State.ports['Gi0/0'].nativeVlan = 20;

    const issues = diagnoseVlanMismatches(devices, connections, deviceStates);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].type).toBe('NATIVE_VLAN_MISMATCH');
    expect(issues[0].sourceVlan).toBe(10);
    expect(issues[0].targetVlan).toBe(20);
  });

  it('Feature 7: Detailed routing decisions (Longest Prefix Match, AD, Metric)', () => {
    const routingTable: Route[] = [
      { destination: '10.0.0.0', subnetMask: '255.0.0.0', nextHop: 'Gi0/0', type: 'dynamic', code: 'O', metric: 110 },
      { destination: '10.0.0.0', subnetMask: '255.255.255.0', nextHop: 'Gi0/1', type: 'static', metric: 1 },
    ];

    const decision = findRouteDetailed('10.0.0.5', routingTable);
    expect(decision).not.toBeNull();
    expect(decision?.matchedPrefix).toBe('10.0.0.0/24');
    expect(decision?.administrativeDistance).toBe(1);
    expect(decision?.explanation).toContain('LPM 10.0.0.0/24');
  });

  it('Feature 8: Emits MAC lifecycle events (LEARN, MOVE, AGE)', () => {
    const events: MacLifecycleEvent[] = [];
    const unsubscribe = onMacLifecycleEvent(e => events.push(e));

    learnMacAddress('SW1', 'AA:BB:CC:11:22:33', 'Fa0/3', 1, deviceStates);
    expect(events.some(e => e.type === 'LEARN')).toBe(true);

    learnMacAddress('SW1', 'AA:BB:CC:11:22:33', 'Fa0/4', 1, deviceStates);
    expect(events.some(e => e.type === 'MOVE')).toBe(true);

    unsubscribe();
  });

  it('Feature 9: Updates interface rx/tx/drop counters on real traffic', () => {
    const frame = {
      srcMac: '00:11:22:33:44:55',
      dstMac: 'AA:BB:CC:DD:EE:FF',
      srcIp: '10.0.0.2',
      dstIp: '192.168.1.2',
      protocol: 'ICMP',
      ttl: 64,
      length: 128,
      vlanId: 1,
      ingressPortId: 'Fa0/1',
    };

    runFullPacketPipeline(frame as any, 'SW1', devices, deviceStates, connections);

    const sw1Port = deviceStates.get('SW1')?.ports['Fa0/1'];
    expect(sw1Port?.stats).toBeDefined();
    expect(sw1Port?.stats?.rxPackets).toBeGreaterThan(0);
    expect(sw1Port?.stats?.rxBytes).toBeGreaterThan(0);
  });
});
