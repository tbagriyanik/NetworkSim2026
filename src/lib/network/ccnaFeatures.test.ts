import { describe, it, expect } from 'vitest';
import { evaluateAcl } from './connectivity';
import { getRoutingTable } from './routing';
import { SwitchState } from './types';
import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';

describe('CCNA Features: ACL Logic', () => {
  const mockState: SwitchState = {
    id: 'R1',
    hostname: 'R1',
    currentMode: 'privileged',
    ports: {},
    accessLists: {
      '1': ['permit 192.168.1.0 0.0.0.255', 'deny any'],
      '101': [
        'permit tcp 192.168.1.0 0.0.0.255 any eq 80',
        'permit icmp any any',
        'deny ip any any'
      ]
    }
  } as any;

  it('should correctly evaluate standard ACLs', () => {
    expect(evaluateAcl('1', mockState, '192.168.1.5', '10.0.0.1')).toBe('permit');
    expect(evaluateAcl('1', mockState, '192.168.2.5', '10.0.0.1')).toBe('deny');
  });

  it('should correctly evaluate extended ACLs with protocol and port', () => {
    // TCP port 80 - permit
    expect(evaluateAcl('101', mockState, '192.168.1.5', '10.0.0.1', 'tcp', '80')).toBe('permit');
    // TCP port 443 - deny
    expect(evaluateAcl('101', mockState, '192.168.1.5', '10.0.0.1', 'tcp', '443')).toBe('deny');
    // ICMP - permit
    expect(evaluateAcl('101', mockState, '192.168.2.5', '10.0.0.1', 'icmp')).toBe('permit');
    // Other IP - deny
    expect(evaluateAcl('101', mockState, '192.168.2.5', '10.0.0.1', 'udp')).toBe('deny');
  });
});

describe('CCNA Features: HSRP/VRRP Logic', () => {
  it('should recognize virtual IP as connected when state is Active', () => {
    const activeState: SwitchState = {
      id: 'R1',
      ports: {
        'gi0/0': {
          ipAddress: '192.168.1.1',
          subnetMask: '255.255.255.0',
          shutdown: false,
          hsrp: {
            groups: {
              1: { virtualIp: '192.168.1.254', state: 'Active' }
            }
          }
        }
      }
    } as any;

    const deviceStates = new Map([['R1', activeState]]);
    const routes = getRoutingTable('R1', deviceStates);

    const virtualIpRoute = routes.find(r => r.destination === '192.168.1.254');
    expect(virtualIpRoute).toBeDefined();
    expect(virtualIpRoute?.type).toBe('connected');
  });

  it('should NOT recognize virtual IP as connected when state is Standby', () => {
    const standbyState: SwitchState = {
      id: 'R2',
      ports: {
        'gi0/0': {
          ipAddress: '192.168.1.2',
          subnetMask: '255.255.255.0',
          shutdown: false,
          hsrp: {
            groups: {
              1: { virtualIp: '192.168.1.254', state: 'Standby' }
            }
          }
        }
      }
    } as any;

    const deviceStates = new Map([['R2', standbyState]]);
    const routes = getRoutingTable('R2', deviceStates);

    const virtualIpRoute = routes.find(r => r.destination === '192.168.1.254');
    expect(virtualIpRoute).toBeUndefined();
  });
});

describe('CCNA Features: Multi-Area OSPF Logic', () => {
  const r1: CanvasDevice = { id: 'R1', name: 'R1', type: 'router', ip: '10.0.0.1' } as any;
  const r2: CanvasDevice = { id: 'R2', name: 'R2', type: 'router', ip: '10.0.0.2' } as any;
  const conn: CanvasConnection = { id: 'c1', sourceDeviceId: 'R1', targetDeviceId: 'R2', sourcePort: 'gi0/0', targetPort: 'gi0/0' } as any;

  const r1State: SwitchState = {
    id: 'R1',
    routingProtocol: 'ospf',
    ospfAreas: [0, 1],
    isAbr: true,
    ports: {
      'gi0/0': { ipAddress: '10.0.0.1', subnetMask: '255.255.255.0', shutdown: false }
    }
  } as any;

  const r2State: SwitchState = {
    id: 'R2',
    routingProtocol: 'ospf',
    ospfAreas: [1],
    ports: {
      'gi0/1': { ipAddress: '192.168.2.1', subnetMask: '255.255.255.0', shutdown: false }
    }
  } as any;

  it('should discover inter-area routes between OSPF routers', () => {
    const deviceStates = new Map([
      ['R1', r1State],
      ['R2', r2State]
    ]);

    const r1Routes = getRoutingTable('R1', deviceStates, [r1, r2], [conn]);
    // R1 should learn R2's connected network (192.168.2.0) as dynamic OSPF route
    const interAreaRoute = r1Routes.find(r => r.destination === '192.168.2.0');
    expect(interAreaRoute).toBeDefined();
    expect(interAreaRoute?.type).toBe('dynamic');
  });
});
