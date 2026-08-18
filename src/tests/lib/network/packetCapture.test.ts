import { expect, test, describe } from 'vitest';
import { checkConnectivity, checkDeviceConnectivity } from '@/lib/network/connectivity';
import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import { SwitchState } from '@/lib/network/types';
import { createInitialState } from '@/lib/network/initialState';

describe('Packet Capture Backend', () => {
  const devices: CanvasDevice[] = [
    {
      id: 'pc-1',
      type: 'pc',
      name: 'PC-1',
      ip: '192.168.1.10',
      subnet: '255.255.255.0',
      gateway: '192.168.1.1',
      macAddress: '00:00:00:00:00:01',
      x: 0, y: 0, status: 'online',
      ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }]
    },
    {
      id: 'pc-2',
      type: 'pc',
      name: 'PC-2',
      ip: '192.168.1.20',
      subnet: '255.255.255.0',
      gateway: '192.168.1.1',
      macAddress: '00:00:00:00:00:02',
      x: 100, y: 100, status: 'online',
      ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }]
    }
  ];

  const connections: CanvasConnection[] = [
    {
      id: 'conn-1',
      sourceDeviceId: 'pc-1',
      sourcePort: 'eth0',
      targetDeviceId: 'pc-2',
      targetPort: 'eth0',
      cableType: 'crossover', // PC to PC needs crossover
      active: true
    }
  ];

  const deviceStates = new Map<string, SwitchState>();
  deviceStates.set('pc-1', {
    hostname: 'PC-1',
    macAddress: '00:00:00:00:00:01',
    ports: {
      'eth0': { id: 'eth0', label: 'Eth0', status: 'connected', shutdown: false }
    },
    arpCache: []
  } as unknown as SwitchState);
  deviceStates.set('pc-2', {
    hostname: 'PC-2',
    macAddress: '00:00:00:00:00:02',
    ports: {
      'eth0': { id: 'eth0', label: 'Eth0', status: 'connected', shutdown: false }
    },
    arpCache: []
  } as unknown as SwitchState);

  test('captures ICMP and ARP packets between two PCs', () => {
    const result = checkConnectivity(
      'pc-1',
      '192.168.1.20',
      devices,
      connections,
      deviceStates,
      'en',
      { protocol: 'icmp' }
    );

    // Connectivity error handled via the success check below

    expect(result.success).toBe(true);
    expect(result.capturedPackets).toBeDefined();
    expect(result.capturedPackets?.length).toBeGreaterThan(0);

    // Should have ARP if no MAC known (simulated)
    const hasArp = result.capturedPackets?.some(p => p.protocol === 'ARP');
    const hasIcmp = result.capturedPackets?.some(p => p.protocol === 'ICMP');

    expect(hasArp).toBe(true);
    expect(hasIcmp).toBe(true);

    // Verify packet fields
    const icmpPacket = result.capturedPackets?.find(p => p.protocol === 'ICMP');
    expect(icmpPacket?.sourceIp).toBe('192.168.1.10');
    expect(icmpPacket?.targetIp).toBe('192.168.1.20');
    expect(icmpPacket?.connectionId).toBe('conn-1');
  });

  test('does not capture packets if connection is inactive', () => {
    const inactiveConnections = connections.map(c => ({ ...c, active: false }));
    const result = checkConnectivity(
      'pc-1',
      '192.168.1.20',
      devices,
      inactiveConnections,
      deviceStates,
      'en',
      { protocol: 'icmp' }
    );

    expect(result.success).toBe(false);
    expect(result.capturedPackets || []).toHaveLength(0);
  });

  test('records ARP broadcast on every switch flood port except the source cable', () => {
    const pc1 = devices[0];
    const pc2 = devices[1];
    const pc3: CanvasDevice = {
      id: 'pc-3',
      type: 'pc',
      name: 'PC-3',
      ip: '192.168.1.30',
      subnet: '255.255.255.0',
      gateway: '192.168.1.1',
      macAddress: '00:00:00:00:00:03',
      x: 200, y: 100, status: 'online',
      ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }]
    };
    const sw: CanvasDevice = {
      id: 'sw-1',
      type: 'switchL2',
      name: 'SW-1',
      ip: '',
      x: 50, y: 50, status: 'online',
      ports: [
        { id: 'fa0/1', label: 'Fa0/1', status: 'connected' },
        { id: 'fa0/2', label: 'Fa0/2', status: 'connected' },
        { id: 'fa0/3', label: 'Fa0/3', status: 'connected' }
      ]
    };

    const switchConns: CanvasConnection[] = [
      { id: 'c-pc1', sourceDeviceId: 'pc-1', sourcePort: 'eth0', targetDeviceId: 'sw-1', targetPort: 'fa0/1', cableType: 'straight', active: true },
      { id: 'c-pc2', sourceDeviceId: 'sw-1', sourcePort: 'fa0/2', targetDeviceId: 'pc-2', targetPort: 'eth0', cableType: 'straight', active: true },
      { id: 'c-pc3', sourceDeviceId: 'sw-1', sourcePort: 'fa0/3', targetDeviceId: 'pc-3', targetPort: 'eth0', cableType: 'straight', active: true }
    ];

    const switchStates = new Map<string, SwitchState>();
    const mkPcState = (mac: string) => ({
      hostname: 'PC',
      macAddress: mac,
      ports: { 'eth0': { id: 'eth0', label: 'Eth0', status: 'connected', shutdown: false } },
      arpCache: []
    } as unknown as SwitchState);
    switchStates.set('pc-1', mkPcState('00:00:00:00:00:01'));
    switchStates.set('pc-2', mkPcState('00:00:00:00:00:02'));
    switchStates.set('pc-3', mkPcState('00:00:00:00:00:03'));
    switchStates.set('sw-1', createInitialState());

    const result = checkConnectivity(
      'pc-1',
      '192.168.1.20',
      [pc1, sw, pc2, pc3],
      switchConns,
      switchStates,
      'en',
      { protocol: 'icmp' }
    );

    expect(result.success).toBe(true);

    const arpPackets = result.capturedPackets?.filter(p => p.protocol === 'ARP') || [];
    const arpConnIds = arpPackets.map(p => p.connectionId);

    // Source cable carries the ARP request
    expect(arpConnIds).toContain('c-pc1');
    // The broadcast floods to the target device and every other device on the switch
    expect(arpConnIds).toContain('c-pc2');
    expect(arpConnIds).toContain('c-pc3');

    // ARP reply traverses every cable on the path back to the source
    const replyConnIds = arpPackets.filter(p => p.info.startsWith('ARP Reply')).map(p => p.connectionId);
    expect(replyConnIds).toContain('c-pc1');
    expect(replyConnIds).toContain('c-pc2');
    // The reply does not reach the device that is not on the path
    expect(replyConnIds).not.toContain('c-pc3');
  });

  test('ARP broadcast only occurs when the MAC is not cached; cached MAC within 2 minutes skips ARP', () => {
    const states = new Map<string, SwitchState>();
    const mkPcState = (mac: string) => ({
      hostname: 'PC',
      macAddress: mac,
      ports: { 'eth0': { id: 'eth0', label: 'Eth0', status: 'connected', shutdown: false } },
      arpCache: []
    } as unknown as SwitchState);
    states.set('pc-1', mkPcState('00:00:00:00:00:01'));
    states.set('pc-2', mkPcState('00:00:00:00:00:02'));

    // First ping: MAC unknown -> ARP broadcast is captured
    const first = checkConnectivity('pc-1', '192.168.1.20', devices, connections, states, 'en', { protocol: 'icmp' });
    expect(first.capturedPackets?.filter(p => p.protocol === 'ARP').length).toBeGreaterThan(0);
    expect(first.capturedPackets?.some(p => p.protocol === 'ARP' && p.info.startsWith('ARP Request'))).toBe(true);
    expect(first.capturedPackets?.some(p => p.protocol === 'ARP' && p.info.startsWith('ARP Reply'))).toBe(true);

    // ARP cache now has the entry
    const sourceState = states.get('pc-1');
    expect(sourceState?.arpCache?.some(e => e.ip === '192.168.1.20')).toBe(true);

    // Second ping (right-click path) within 2 minutes: MAC cached -> no ARP broadcast
    const second = checkDeviceConnectivity('pc-1', 'pc-2', devices, connections, states, { protocol: 'icmp' });
    expect(second.success).toBe(true);
    const secondPackets = second.capturedPackets || [];
    expect(secondPackets.some(p => p.protocol === 'ICMP' && p.info.includes('Echo Request'))).toBe(true);
    expect(secondPackets.filter(p => p.protocol === 'ARP')).toHaveLength(0);
  });

  test('ARP broadcast repeats after the 2-minute cache entry expires', () => {
    const states = new Map<string, SwitchState>();
    const mkPcState = (mac: string) => ({
      hostname: 'PC',
      macAddress: mac,
      ports: { 'eth0': { id: 'eth0', label: 'Eth0', status: 'connected', shutdown: false } },
      arpCache: []
    } as unknown as SwitchState);
    states.set('pc-1', mkPcState('00:00:00:00:00:01'));
    states.set('pc-2', mkPcState('00:00:00:00:00:02'));

    // Populate the cache
    checkConnectivity('pc-1', '192.168.1.20', devices, connections, states, 'en', { protocol: 'icmp' });
    const sourceState = states.get('pc-1');
    expect(sourceState?.arpCache?.some(e => e.ip === '192.168.1.20')).toBe(true);

    // Age the entry past the 2-minute (120000ms) lifetime
    const sourceCache = sourceState?.arpCache || [];
    if (sourceState) {
      sourceState.arpCache = sourceCache.map(e => ({ ...e, timestamp: Date.now() - 121000 }));
    }

    // Next ping: entry expired -> ARP broadcast happens again
    const expired = checkConnectivity('pc-1', '192.168.1.20', devices, connections, states, 'en', { protocol: 'icmp' });
    expect(expired.capturedPackets?.some(p => p.protocol === 'ARP' && p.info.startsWith('ARP Request'))).toBe(true);
    expect(expired.capturedPackets?.some(p => p.protocol === 'ARP' && p.info.startsWith('ARP Reply'))).toBe(true);
  });

  test('switches learn the source MAC on their ingress port from the ARP broadcast', () => {
    const pc1 = devices[0];
    const pc2 = devices[1];
    const sw: CanvasDevice = {
      id: 'sw-1',
      type: 'switchL2',
      name: 'SW-1',
      ip: '',
      x: 50, y: 50, status: 'online',
      ports: [
        { id: 'fa0/1', label: 'Fa0/1', status: 'connected' },
        { id: 'fa0/2', label: 'Fa0/2', status: 'connected' },
        { id: 'fa0/3', label: 'Fa0/3', status: 'connected' }
      ]
    };
    const pc3: CanvasDevice = {
      id: 'pc-3',
      type: 'pc',
      name: 'PC-3',
      ip: '192.168.1.30',
      subnet: '255.255.255.0',
      gateway: '192.168.1.1',
      macAddress: '00:00:00:00:00:03',
      x: 200, y: 100, status: 'online',
      ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }]
    };

    const switchConns: CanvasConnection[] = [
      { id: 'c-pc1', sourceDeviceId: 'pc-1', sourcePort: 'eth0', targetDeviceId: 'sw-1', targetPort: 'fa0/1', cableType: 'straight', active: true },
      { id: 'c-pc2', sourceDeviceId: 'sw-1', sourcePort: 'fa0/2', targetDeviceId: 'pc-2', targetPort: 'eth0', cableType: 'straight', active: true },
      { id: 'c-pc3', sourceDeviceId: 'sw-1', sourcePort: 'fa0/3', targetDeviceId: 'pc-3', targetPort: 'eth0', cableType: 'straight', active: true }
    ];

    const switchStates = new Map<string, SwitchState>();
    const mkPcState = (mac: string) => ({
      hostname: 'PC',
      macAddress: mac,
      ports: { 'eth0': { id: 'eth0', label: 'Eth0', status: 'connected', shutdown: false } },
      arpCache: []
    } as unknown as SwitchState);
    switchStates.set('pc-1', mkPcState('00:00:00:00:00:01'));
    switchStates.set('pc-2', mkPcState('00:00:00:00:00:02'));
    switchStates.set('pc-3', mkPcState('00:00:00:00:00:03'));
    switchStates.set('sw-1', createInitialState());

    const result = checkConnectivity('pc-1', '192.168.1.20', [pc1, sw, pc2, pc3], switchConns, switchStates, 'en', { protocol: 'icmp' });
    expect(result.success).toBe(true);

    // The switch learned PC-1's MAC (broadcast source) on the ingress port fa0/1
    const swState = switchStates.get('sw-1');
    const learned = swState?.macAddressTable?.find(e => e.mac.toLowerCase() === '00:00:00:00:00:01');
    expect(learned).toBeDefined();
    expect(learned?.port).toBe('fa0/1');
    expect(learned?.type).toBe('DYNAMIC');
  });
});
