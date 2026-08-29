import { describe, expect, it } from 'vitest';
import { buildMstBpdu, electCistRoot, isMstRegionBoundary } from '@/lib/network/mstp';
const cfg = (name='CORE') => ({ name, revision: 1, instances: { 1:[10,20], 2:[30] } });
describe('MSTP BPDU engine', () => {
  it('elects the lowest priority then MAC CIST root', () => { expect(electCistRoot([{id:'a',priority:4096,mac:'00:02',config:cfg()},{id:'b',priority:8192,mac:'00:01',config:cfg()}])?.id).toBe('a'); });
  it('builds MSTI M-records and detects a region boundary', () => { const a=buildMstBpdu({id:'a',priority:4096,mac:'00:01',config:cfg()}, []); const b=buildMstBpdu({id:'b',priority:8192,mac:'00:02',config:cfg('EDGE')}, []); expect(a.records).toHaveLength(2); expect(isMstRegionBoundary(a,b)).toBe(true); });
});
