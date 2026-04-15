import { describe, it, expect } from 'vitest';
import { findRoute, ipToNumber, type Route } from '@/lib/network/routing';

describe('network/routing', () => {
  it('ipToNumber converts dotted decimal', () => {
    expect(ipToNumber('0.0.0.0')).toBe(0);
    expect(ipToNumber('255.255.255.255')).toBe(0xffffffff);
    expect(ipToNumber('192.168.1.1')).toBeGreaterThan(0);
  });

  it('findRoute chooses longest prefix match', () => {
    const routes: Route[] = [
      { destination: '0.0.0.0', subnetMask: '0.0.0.0', nextHop: '1.1.1.1', type: 'static' },
      { destination: '10.0.0.0', subnetMask: '255.0.0.0', nextHop: '10.0.0.1', type: 'connected' },
      { destination: '10.1.0.0', subnetMask: '255.255.0.0', nextHop: '10.1.0.1', type: 'connected' },
      { destination: '10.1.2.0', subnetMask: '255.255.255.0', nextHop: '10.1.2.1', type: 'connected' },
    ];

    expect(findRoute('10.1.2.99', routes)?.nextHop).toBe('10.1.2.1');
    expect(findRoute('10.9.9.9', routes)?.nextHop).toBe('10.0.0.1');
    expect(findRoute('8.8.8.8', routes)?.nextHop).toBe('1.1.1.1');
  });
});

