import { describe, expect, it } from 'vitest';
import { scheduleQosPackets, policePacket, shapePacketQueue, type TokenBucket, type PoliceConfig } from '@/lib/network/qosScheduler';

const p = (id: string, className: string, bytes = 100) => ({ id, className, bytes });

describe('QoS queue scheduling & Rate Limiting', () => {
  it('serves LLQ priority traffic first under saturation', () => {
    const r = scheduleQosPackets('llq', [p('voice','voice'), p('data','data')], 100, [{name:'voice',priority:true},{name:'data'}]);
    expect(r.transmitted.map(x => x.id)).toEqual(['voice']); expect(r.dropped.map(x => x.id)).toEqual(['data']);
  });

  it('allocates CBWFQ capacity according to class bandwidth', () => {
    const r = scheduleQosPackets('cbwfq', [p('a','a'),p('b','b'),p('c','b')], 200, [{name:'a',bandwidthPercent:75},{name:'b',bandwidthPercent:25}]);
    expect(r.byClass.a.transmitted).toBe(1); expect(r.byClass.b.dropped).toBe(2);
  });

  it('polices traffic using single rate token bucket and drops non-conforming packets', () => {
    const config: PoliceConfig = {
      cirBps: 8000, // 1000 bytes / sec
      burstBytes: 200,
      conformAction: 'transmit',
      exceedAction: 'drop'
    };
    const bucket: TokenBucket = { tokens: 100, lastUpdatedMs: Date.now() };

    // First packet (100 bytes) conforms
    const res1 = policePacket(bucket, p('p1', 'data', 100), config);
    expect(res1.conformed).toBe(true);
    expect(res1.actionTaken).toBe('transmit');

    // Second packet (100 bytes) exceeds available tokens
    const res2 = policePacket(res1.nextBucketState, p('p2', 'data', 100), config);
    expect(res2.exceeded).toBe(true);
    expect(res2.actionTaken).toBe('drop');
  });

  it('shapes traffic by calculating queue transmission delay', () => {
    const packets = [p('p1', 'data', 1000), p('p2', 'data', 1000)];
    const shapeRes = shapePacketQueue(packets, { type: 'average', rateBps: 8000 }); // 1000 bytes/sec
    expect(shapeRes.transmitted).toHaveLength(2);
    expect(shapeRes.totalDelayMs).toBeGreaterThan(0);
  });
});
