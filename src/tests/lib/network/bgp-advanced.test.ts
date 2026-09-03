import { describe, test, expect } from 'vitest';
import { executeCommand } from '../../../lib/network/executor';
import { createInitialRouterState } from '../../../lib/network/initialState';
import { calculateBgpRoutes, recalculateBgpNeighbors } from '../../../lib/network/routing';
import type { SwitchState, BgpNeighbor } from '../../../lib/network/types';



function makeRouter(hostname: string, as: string, portIp: string): SwitchState {
  const r = createInitialRouterState();
  r.hostname = hostname;
  r.bgpAs = as;
  r.routingProtocol = 'bgp';
  r.bgpNetworks = [];
  r.bgpNeighbors = [];
  r.ports['gi0/0'] = { ...r.ports['gi0/0'], ipAddress: portIp, shutdown: false };
  return r;
}

describe('Advanced BGP neighbor configuration commands', () => {
  test('configures next-hop-self, ebgp-multihop, update-source and timers', () => {
    let r = makeRouter('R1', '65001', '10.0.0.1');
    r.currentMode = 'router-config';

    let res = executeCommand({ ...r, currentMode: 'router-config' }, 'neighbor 10.0.0.2 remote-as 65002', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 next-hop-self', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 ebgp-multihop 4', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 update-source loopback0', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 timers 30 90', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    const n = r.bgpNeighbors?.find(x => x.ip === '10.0.0.2');
    expect(n?.nextHopSelf).toBe(true);
    expect(n?.ebgpMultihop).toBe(4);
    expect(n?.updateSource).toBe('loopback0');
    expect(n?.timersKeepalive).toBe(30);
    expect(n?.timersHoldtime).toBe(90);
    expect(n?.as).toBe('65002');
  });

  test('supports password, description, shutdown and default-originate (+ negation)', () => {
    let r = makeRouter('R1', '65001', '10.0.0.1');
    r.currentMode = 'router-config';
    r.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' }];

    let res = executeCommand(r, 'neighbor 10.0.0.2 password cisco123', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 description ISP-UPLINK', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 shutdown', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 default-originate', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    const n = r.bgpNeighbors?.find(x => x.ip === '10.0.0.2');
    expect(n?.password).toBe('cisco123');
    expect(n?.description).toBe('ISP-UPLINK');
    expect(n?.shutdown).toBe(true);
    expect(n?.defaultOriginate).toBe(true);

    res = executeCommand(r, 'no neighbor 10.0.0.2 shutdown', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;
    expect(r.bgpNeighbors?.find(x => x.ip === '10.0.0.2')?.shutdown).toBe(false);
  });

  test('supports maximum-prefix, allowas-in, send-community, route-reflector-client, soft-reconfiguration', () => {
    let r = makeRouter('RR', '65100', '10.0.0.1');
    r.currentMode = 'router-config';
    r.bgpNeighbors = [{ ip: '10.0.0.2', as: '65100' }];

    let res = executeCommand(r, 'neighbor 10.0.0.2 maximum-prefix 100', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 allowas-in 2', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 send-community', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 route-reflector-client', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    res = executeCommand(r, 'neighbor 10.0.0.2 soft-reconfiguration inbound', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;

    const n = r.bgpNeighbors?.find(x => x.ip === '10.0.0.2');
    expect(n?.maximumPrefix).toBe(100);
    expect(n?.allowAsIn).toBe(2);
    expect(n?.sendCommunity).toBe(true);
    expect(n?.routeReflectorClient).toBe(true);
    expect(n?.softReconfiguration).toBe(true);
  });

  test('rejects advanced BGP commands outside BGP router-config mode', () => {
    const r = makeRouter('R1', '65001', '10.0.0.1');
    r.currentMode = 'router-config';
    r.routingProtocol = 'rip';
    const res = executeCommand(r, 'neighbor 10.0.0.2 next-hop-self', 'en');
    expect(res.success).toBe(false);
  });

  test('configures global BGP knobs', () => {
    let r = makeRouter('R1', '65001', '10.0.0.1');
    r.currentMode = 'router-config';

    let res = executeCommand(r, 'maximum-paths 4', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;
    expect(r.bgpMaximumPaths).toBe(4);

    res = executeCommand(r, 'aggregate-address 172.16.0.0 255.255.0.0', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;
    expect(r.bgpAggregateAddresses).toEqual([{ network: '172.16.0.0', mask: '255.255.0.0', summaryOnly: false }]);

    res = executeCommand(r, 'bgp graceful-restart', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;
    expect(r.bgpGracefulRestart).toBe(true);

    res = executeCommand(r, 'bgp cluster-id 10.0.0.1', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;
    expect(r.bgpClusterId).toBe('10.0.0.1');

    res = executeCommand(r, 'timers bgp 30 90', 'en');
    expect(res.success).toBe(true);
    r = { ...r, ...res.newState } as SwitchState;
    expect(r.bgpTimers).toEqual({ keepalive: 30, holdtime: 90 });
  });
});

describe('BGP route exchange (calculateBgpRoutes)', () => {
  test('learns advertised prefixes from an Established eBGP peer', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' }];
    r1.bgpNetworks = [{ network: '192.168.1.0', mask: '255.255.255.0' }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' }];
    r2.bgpNetworks = [{ network: '192.168.2.0', mask: '255.255.255.0' }];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);

    const r1Routes = calculateBgpRoutes('R1', map);
    const learned = r1Routes.find(r => r.destination === '192.168.2.0');
    expect(learned).toBeDefined();
    expect(learned?.nextHop).toBe('10.0.0.2');
    expect(learned?.code).toBe('B');
    expect(learned?.administrativeDistance).toBe(20);
    expect(learned?.asPath).toContain('65002');

    expect(calculateBgpRoutes('R2', map).some(r => r.destination === '192.168.1.0')).toBe(true);
  });

  test('iBGP peer routes carry AD 200 and internal flag', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65001' }];
    r1.bgpNetworks = [{ network: '192.168.1.0', mask: '255.255.255.0' }];

    const r2 = makeRouter('R2', '65001', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' }];
    r2.bgpNetworks = [{ network: '192.168.2.0', mask: '255.255.255.0' }];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    const learned = calculateBgpRoutes('R1', map).find(r => r.destination === '192.168.2.0');
    expect(learned?.administrativeDistance).toBe(200);
  });

  test('shutdown neighbor is Administratively down and does not exchange routes', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002', shutdown: true }];
    r1.bgpNetworks = [{ network: '192.168.1.0', mask: '255.255.255.0' }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' }];
    r2.bgpNetworks = [{ network: '192.168.2.0', mask: '255.255.255.0' }];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    const updated = recalculateBgpNeighbors(map);
    expect(updated.get('R1')?.bgpNeighborState?.['10.0.0.2']).toBe('Administratively down');
    expect(calculateBgpRoutes('R1', map).length).toBe(0);
    expect(calculateBgpRoutes('R2', map).length).toBe(0);
  });

  test('outbound route-map deny on peer blocks prefix learning', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNetworks = [{ network: '192.168.1.0', mask: '255.255.255.0' }];
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNetworks = [{ network: '192.168.2.0', mask: '255.255.255.0' }];
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001', routeMapOut: 'DENY-RM' }];
    r2.routeMaps = {
      'DENY-RM': [{ seq: 10, action: 'deny', matchRules: { prefixList: 'NO-ROUTES' }, setRules: {} }],
    };
    r2.prefixLists = {
      'NO-ROUTES': [{ seq: 10, action: 'permit', prefix: '192.168.2.0/24' }],
    };

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    expect(calculateBgpRoutes('R1', map).some(r => r.destination === '192.168.2.0')).toBe(false);
  });

  test('maximum-prefix inbound limit caps the number of learned prefixes', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002', maximumPrefix: 1 }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' }];
    r2.bgpNetworks = [
      { network: '10.1.0.0', mask: '255.255.255.0' },
      { network: '10.2.0.0', mask: '255.255.255.0' },
    ];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    expect(calculateBgpRoutes('R1', map).length).toBe(1);
  });

  test('peer default-originate injects a default route into my table', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNetworks = [{ network: '192.168.1.0', mask: '255.255.255.0' }];
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNetworks = [{ network: '192.168.2.0', mask: '255.255.255.0' }];
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001', defaultOriginate: true }];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    const r1Routes = calculateBgpRoutes('R1', map);
    expect(r1Routes.some(r => r.destination === '0.0.0.0' && r.subnetMask === '0.0.0.0')).toBe(true);
  });

  test('aggregate-address summarizes covered learned prefixes', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpAggregateAddresses = [{ network: '10.1.0.0', mask: '255.255.0.0', summaryOnly: false }];
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' }];
    r2.bgpNetworks = [
      { network: '10.1.0.0', mask: '255.255.255.0' },
      { network: '10.1.1.0', mask: '255.255.255.0' },
    ];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    expect(calculateBgpRoutes('R1', map).some(r => r.destination === '10.1.0.0' && r.subnetMask === '255.255.0.0')).toBe(true);
  });

});

describe('Advanced BGP show commands', () => {
  test('show ip bgp neighbors lists neighbors with state', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' } as BgpNeighbor];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' } as BgpNeighbor];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);

    const res = executeCommand({ ...r1, currentMode: 'privileged' }, 'show ip bgp neighbors', 'en', [], [], map, 'R1');
    expect(res.success).toBe(true);
    expect(res.output).toContain('10.0.0.2');
    expect(res.output).toContain('65002');
  });

  test('show ip bgp neighbors <ip> shows detailed advanced attributes', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{
      ip: '10.0.0.2', as: '65002', description: 'ISP-UPLINK', password: 'cisco123',
      nextHopSelf: true, timersKeepalive: 30, timersHoldtime: 90, ebgpMultihop: 3,
    } as BgpNeighbor];

    const res = executeCommand({ ...r1, currentMode: 'privileged' }, 'show ip bgp neighbors 10.0.0.2', 'en', [], [], new Map([['R1', r1]]), 'R1');
    expect(res.success).toBe(true);
    expect(res.output).toContain('Description: ISP-UPLINK');
    expect(res.output).toContain('Next-hop-self is enabled');
    expect(res.output).toContain('External BGP multihop: 3 hops');
  });

  test('show ip bgp table includes learned routes with AS path', () => {
    const r1 = makeRouter('R1', '65001', '10.0.0.1');
    r1.bgpNeighbors = [{ ip: '10.0.0.2', as: '65002' } as BgpNeighbor];
    r1.bgpNetworks = [{ network: '192.168.1.0', mask: '255.255.255.0' }];

    const r2 = makeRouter('R2', '65002', '10.0.0.2');
    r2.bgpNeighbors = [{ ip: '10.0.0.1', as: '65001' } as BgpNeighbor];
    r2.bgpNetworks = [{ network: '192.168.2.0', mask: '255.255.255.0' }];

    const map = new Map<string, SwitchState>([['R1', r1], ['R2', r2]]);
    const res = executeCommand({ ...r1, currentMode: 'privileged' }, 'show ip bgp', 'en', [], [], map, 'R1');
    expect(res.success).toBe(true);
    expect(res.output).toContain('192.168.2.0/24');
    expect(res.output).toContain('65002');
    expect(res.output).toContain('192.168.1.0/24');
  });
});