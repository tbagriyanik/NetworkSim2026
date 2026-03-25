import { describe, it, expect } from 'vitest';
import { checkConnectivity } from '../lib/network/connectivity';
import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import { SwitchState } from '../lib/network/types';

describe('Network Connectivity', () => {
  it('should allow ping between two connected PCs on the same network', () => {
    const devices: CanvasDevice[] = [
      { id: 'pc-1', type: 'pc', name: 'PC-1', x: 0, y: 0, ip: '192.168.1.10', macAddress: '00:00:00:00:00:01', status: 'online', ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }] },
      { id: 'pc-2', type: 'pc', name: 'PC-2', x: 100, y: 0, ip: '192.168.1.11', macAddress: '00:00:00:00:00:02', status: 'online', ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }] }
    ];
    
    const connections: CanvasConnection[] = [
      { id: 'c1', sourceDeviceId: 'pc-1', sourcePort: 'eth0', targetDeviceId: 'pc-2', targetPort: 'eth0', active: true, cableType: 'crossover' }
    ];

    const result = checkConnectivity('pc-1', '192.168.1.11', devices, connections);
    expect(result.success).toBe(true);
  });

  it('should not allow ping between PCs in different VLANs connected through a switch', () => {
    const devices: CanvasDevice[] = [
      { id: 'pc-1', type: 'pc', name: 'PC-1', x: 0, y: 0, ip: '192.168.1.10', macAddress: '00:00:00:00:00:01', status: 'online', ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }] },
      { id: 'pc-2', type: 'pc', name: 'PC-2', x: 100, y: 0, ip: '192.168.1.11', macAddress: '00:00:00:00:00:02', status: 'online', ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }] }
    ];
    
    // Switch state with VLAN isolation
    const switchState: SwitchState = {
      hostname: 'SW1',
      currentMode: 'priv',
      ports: {
        'fa0/1': { id: 'fa0/1', mode: 'access', accessVlan: 10, status: 'connected', shutdown: false, ipAddress: '' },
        'fa0/2': { id: 'fa0/2', mode: 'access', accessVlan: 20, status: 'connected', shutdown: false, ipAddress: '' }
      },
      vlans: { 10: 'VLAN10', 20: 'VLAN20' },
      bannerMOTD: '',
      commandHistory: []
    };

    const deviceStates = new Map<string, SwitchState>();
    deviceStates.set('sw-1', switchState);

    const connections: CanvasConnection[] = [
      { id: 'c1', sourceDeviceId: 'pc-1', sourcePort: 'eth0', targetDeviceId: 'sw-1', targetPort: 'fa0/1', active: true, cableType: 'straight' },
      { id: 'c2', sourceDeviceId: 'pc-2', sourcePort: 'eth0', targetDeviceId: 'sw-1', targetPort: 'fa0/2', active: true, cableType: 'straight' }
    ];

    const result = checkConnectivity('pc-1', '192.168.1.11', devices, connections, deviceStates);
    // Ping should fail because PC-1 is in VLAN 10 and PC-2 is in VLAN 20
    expect(result.success).toBe(false);
  });

  it('should not recurse when resolving VLAN for a PC without switch state', () => {
    const devices: CanvasDevice[] = [
      { id: 'pc-1', type: 'pc', name: 'PC-1', x: 0, y: 0, ip: '192.168.1.10', macAddress: '00:00:00:00:00:01', vlan: 10, status: 'online', ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }] },
      { id: 'pc-2', type: 'pc', name: 'PC-2', x: 100, y: 0, ip: '192.168.1.11', macAddress: '00:00:00:00:00:02', vlan: 10, status: 'online', ports: [{ id: 'eth0', label: 'Eth0', status: 'connected' }] }
    ];

    const connections: CanvasConnection[] = [
      { id: 'c1', sourceDeviceId: 'pc-1', sourcePort: 'eth0', targetDeviceId: 'pc-2', targetPort: 'eth0', active: true, cableType: 'crossover' }
    ];

    expect(() => checkConnectivity('pc-1', '192.168.1.11', devices, connections, new Map())).not.toThrow();
    expect(checkConnectivity('pc-1', '192.168.1.11', devices, connections, new Map()).success).toBe(true);
  });
});
