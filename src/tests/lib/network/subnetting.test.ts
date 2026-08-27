import { describe, expect, it } from 'vitest';
import { calculateSubnet } from '@/lib/network/subnetting';

describe('calculateSubnet', () => {
  it('calculates network, broadcast and usable range for /24', () => {
    expect(calculateSubnet('192.168.1.10', '255.255.255.0')).toMatchObject({
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      usableHosts: 254,
    });
  });

  it('supports CIDR masks and point-to-point /31 networks', () => {
    expect(calculateSubnet('10.0.0.2', '/31')).toMatchObject({
      network: '10.0.0.2',
      broadcast: '10.0.0.3',
      usableHosts: 2,
    });
  });

  it('rejects invalid IPv4 addresses and non-contiguous masks', () => {
    expect(calculateSubnet('300.1.1.1', '255.255.255.0')).toBeNull();
    expect(calculateSubnet('192.168.1.1', '255.0.255.0')).toBeNull();
  });
});
