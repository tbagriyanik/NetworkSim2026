import { describe, it, expect } from 'vitest';
import { checkConnectivity } from './connectivity';
import { SwitchState } from './types';
import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';

describe('Core Network Logic: VLAN Isolation', () => {
  const pc1: CanvasDevice = { id: 'PC1', name: 'PC1', type: 'pc', ip: '192.168.1.10', vlan: 10, ports: [{ id: 'eth0', status: 'connected' }] } as any;
  const pc2: CanvasDevice = { id: 'PC2', name: 'PC2', type: 'pc', ip: '192.168.1.20', vlan: 10, ports: [{ id: 'eth0', status: 'connected' }] } as any;
  const pc3: CanvasDevice = { id: 'PC3', name: 'PC3', type: 'pc', ip: '192.168.1.30', vlan: 20, ports: [{ id: 'eth0', status: 'connected' }] } as any;
  const sw1: CanvasDevice = { id: 'SW1', name: 'SW1', type: 'switchL2', ports: [] } as any;

  const connections: CanvasConnection[] = [
    { id: 'c1', sourceDeviceId: 'PC1', targetDeviceId: 'SW1', sourcePort: 'eth0', targetPort: 'fa0/1', cableType: 'straight', active: true } as any,
    { id: 'c2', sourceDeviceId: 'PC2', targetDeviceId: 'SW1', sourcePort: 'eth0', targetPort: 'fa0/2', cableType: 'straight', active: true } as any,
    { id: 'c3', sourceDeviceId: 'PC3', targetDeviceId: 'SW1', sourcePort: 'eth0', targetPort: 'fa0/3', cableType: 'straight', active: true } as any,
  ];

  const sw1State: SwitchState = {
    id: 'SW1',
    ports: {
      'fa0/1': { id: 'fa0/1', vlan: 10, mode: 'access', shutdown: false },
      'fa0/2': { id: 'fa0/2', vlan: 10, mode: 'access', shutdown: false },
      'fa0/3': { id: 'fa0/3', vlan: 20, mode: 'access', shutdown: false },
    }
  } as any;

  const deviceStates = new Map([['SW1', sw1State]]);

  it('should allow connectivity between devices in the same VLAN', () => {
    const result = checkConnectivity('PC1', '192.168.1.20', [pc1, pc2, pc3, sw1], connections, deviceStates);
    expect(result.success).toBe(true);
  });

  it('should block connectivity between devices in different VLANs without routing', () => {
    const result = checkConnectivity('PC1', '192.168.1.30', [pc1, pc2, pc3, sw1], connections, deviceStates);
    expect(result.success).toBe(false);
    expect(result.error).toContain('VLAN mismatch');
  });
});

describe('Core Network Logic: Firewall Rules', () => {
  const pc1: CanvasDevice = { id: 'PC1', name: 'PC1', type: 'pc', ip: '192.168.1.10', subnet: '255.255.255.0', ports: [{ id: 'eth0', status: 'connected' }] } as any;
  const pc2: CanvasDevice = { id: 'PC2', name: 'PC2', type: 'pc', ip: '192.168.1.20', subnet: '255.255.255.0', ports: [{ id: 'eth0', status: 'connected' }] } as any;
  const fw: CanvasDevice = {
    id: 'FW1',
    name: 'FW1',
    type: 'firewall',
    ports: [{ id: 'ge0/0', status: 'connected' }, { id: 'ge0/1', status: 'connected' }],
    firewallRules: [
      { id: '1', sourceIp: '192.168.1.10', targetIp: '192.168.1.20', protocol: 'tcp', port: '80', action: 'deny', enabled: true },
      { id: '2', sourceIp: 'any', targetIp: 'any', protocol: 'any', port: 'any', action: 'allow', enabled: true }
    ]
  } as any;

  const connections: CanvasConnection[] = [
    { id: 'c1', sourceDeviceId: 'PC1', targetDeviceId: 'FW1', sourcePort: 'eth0', targetPort: 'ge0/0', cableType: 'straight', active: true } as any,
    { id: 'c2', sourceDeviceId: 'FW1', targetDeviceId: 'PC2', sourcePort: 'ge0/1', targetPort: 'eth0', cableType: 'straight', active: true } as any,
  ];

  it('should block TCP port 80 traffic based on firewall rule', () => {
    const result = checkConnectivity('PC1', '192.168.1.20', [pc1, pc2, fw], connections, undefined, 'en', { protocol: 'tcp', port: '80' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('blocked by firewall');
  });

  it('should allow other traffic through firewall', () => {
    const result = checkConnectivity('PC1', '192.168.1.20', [pc1, pc2, fw], connections, undefined, 'en', { protocol: 'icmp' });
    expect(result.success).toBe(true);
  });
});
