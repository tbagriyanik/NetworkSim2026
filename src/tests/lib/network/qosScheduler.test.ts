import { describe, expect, it } from 'vitest';
import { scheduleQosPackets } from '@/lib/network/qosScheduler';
const p = (id: string, className: string, bytes = 100) => ({ id, className, bytes });

describe('QoS queue scheduling', () => {
  it('serves LLQ priority traffic first under saturation', () => {
    const r = scheduleQosPackets('llq', [p('voice','voice'), p('data','data')], 100, [{name:'voice',priority:true},{name:'data'}]);
    expect(r.transmitted.map(x => x.id)).toEqual(['voice']); expect(r.dropped.map(x => x.id)).toEqual(['data']);
  });
  it('allocates CBWFQ capacity according to class bandwidth', () => {
    const r = scheduleQosPackets('cbwfq', [p('a','a'),p('b','b'),p('c','b')], 200, [{name:'a',bandwidthPercent:75},{name:'b',bandwidthPercent:25}]);
    expect(r.byClass.a.transmitted).toBe(1); expect(r.byClass.b.dropped).toBe(2);
  });
  it('uses weighted ordering for WFQ and drops excess packets', () => {
    const r = scheduleQosPackets('wfq', [p('low','low'),p('high','high')], 100, [{name:'low',weight:1},{name:'high',weight:3}]);
    expect(r.transmitted[0].id).toBe('high'); expect(r.dropped).toHaveLength(1);
  });
});
