import { describe, expect, it } from 'vitest';
import { createIpSlaOperation, formatIpSlaStatistics, runSyntheticIpSlaProbe } from '@/lib/network/ipSla';

describe('IP SLA active probes', () => {
  it('records synthetic RTT samples and calculates jitter', () => {
    let op = createIpSlaOperation('1', '10.0.0.1', 'jitter');
    op = runSyntheticIpSlaProbe(op, { reachable: true, latency: 10 }, 1);
    op = runSyntheticIpSlaProbe(op, { reachable: true, latency: 16 }, 2);
    expect(op.statistics).toMatchObject({ attempts: 2, successes: 2, failures: 0, min: 10, max: 16, avg: 13, jitter: 6 });
  });

  it('counts unreachable targets as timeouts without corrupting RTT values', () => {
    const op = runSyntheticIpSlaProbe(createIpSlaOperation('2', '192.0.2.1'), { reachable: false }, 1);
    expect(op.statistics).toMatchObject({ attempts: 1, successes: 0, failures: 1 });
    expect(formatIpSlaStatistics({ '2': op })).toContain('Packets: Sent = 1, Received = 0, Lost = 1');
  });
});
