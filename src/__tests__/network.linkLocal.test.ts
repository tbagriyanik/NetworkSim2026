import { describe, it, expect, vi } from 'vitest';
import { generateRandomLinkLocalIpv4, isLinkLocalIpv4 } from '@/lib/network/linkLocal';

describe('network/linkLocal', () => {
  it('detects link-local IPv4', () => {
    expect(isLinkLocalIpv4('169.254.1.2')).toBe(true);
    expect(isLinkLocalIpv4('169.253.1.2')).toBe(false);
    expect(isLinkLocalIpv4('not-an-ip')).toBe(false);
  });

  it('generates 169.254.x.x and avoids collisions', () => {
    const used = new Set<string>();
    // force deterministic collisions
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0); // third=1, fourth=1
    used.add('169.254.1.1');

    const ip = generateRandomLinkLocalIpv4(used, 3);
    expect(isLinkLocalIpv4(ip)).toBe(true);
    expect(used.has(ip)).toBe(false);

    rnd.mockRestore();
  });
});

