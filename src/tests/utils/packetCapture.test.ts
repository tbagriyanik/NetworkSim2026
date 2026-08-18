import { describe, it, expect, vi, afterEach } from 'vitest';
import { dispatchCapturedPackets } from '@/utils/packetCapture';

describe('dispatchCapturedPackets', () => {
  const packet = {
    connectionId: 'c-1',
    sourceIp: '192.168.1.10',
    targetIp: '255.255.255.255',
    protocol: 'ARP',
    length: 42,
    info: 'ARP Request: Who has 192.168.1.20? Tell 192.168.1.10'
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches a packet-captured event for every packet', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    dispatchCapturedPackets([packet, { ...packet, protocol: 'ICMP', targetIp: '192.168.1.20', info: 'Echo Request' }]);

    const events = spy.mock.calls.map(call => (call[0] as CustomEvent).detail);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(packet);
    expect(events[1].protocol).toBe('ICMP');
  });

  it('does nothing when packets is empty or undefined', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    dispatchCapturedPackets([]);
    dispatchCapturedPackets(undefined);
    dispatchCapturedPackets(null);
    expect(spy).not.toHaveBeenCalled();
  });
});