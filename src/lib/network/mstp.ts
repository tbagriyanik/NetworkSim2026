import type { MstConfig, SwitchState } from './types';

export interface MstBridge {
  id: string;
  priority: number;
  mac: string;
  config: MstConfig;
}

export interface MstMRecord {
  instance: number;
  vlans: number[];
  regionalRoot: string;
  internalCost: number;
}

export interface MstBpdu {
  protocol: 'MSTP';
  cistRoot: string;
  regionName: string;
  revision: number;
  digest: string;
  records: MstMRecord[];
  boundary: boolean;
}

/**
 * Calculate MST region MD5/String Digest from region name, revision, and VLAN-to-instance mappings
 */
export function mstRegionDigest(config?: MstConfig): string {
  if (!config) return 'default:0:';
  const name = config.name || '';
  const revision = config.revision || 0;
  const vlans = Object.entries(config.instances || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([id, values]) => `${id}:${[...values].sort((a, b) => a - b).join(',')}`)
    .join('|');
  return `${name}:${revision}:${vlans}`;
}

/**
 * Check if two switches belong to the exact same MST region
 */
export function areSameMstRegion(stateA: SwitchState, stateB: SwitchState): boolean {
  if (stateA.spanningTreeMode !== 'mst' || stateB.spanningTreeMode !== 'mst') {
    return false;
  }
  const digestA = mstRegionDigest(stateA.mstConfig);
  const digestB = mstRegionDigest(stateB.mstConfig);
  return digestA === digestB;
}

/**
 * Resolve MST Instance ID (0 for CIST, 1..N for MSTI) for a given VLAN
 */
export function getMstInstanceForVlan(state: SwitchState, vlanId: number): number {
  if (!state.mstConfig?.instances) return 0;
  for (const [instStr, vlans] of Object.entries(state.mstConfig.instances)) {
    if (Array.isArray(vlans) && vlans.includes(vlanId)) {
      return parseInt(instStr, 10);
    }
  }
  return 0;
}

/**
 * Elect CIST Root Bridge among available bridges
 */
export function electCistRoot(bridges: MstBridge[]): MstBridge | undefined {
  return [...bridges].sort((a, b) => (a.priority - b.priority) || a.mac.localeCompare(b.mac))[0];
}

/**
 * Build authentic IEEE 802.1s MST BPDU frame structure
 */
export function buildMstBpdu(bridge: MstBridge, peers: MstBridge[] = []): MstBpdu {
  const root = electCistRoot([bridge, ...peers]) || bridge;
  const config = bridge.config;
  const digest = mstRegionDigest(config);

  const records: MstMRecord[] = Object.entries(config.instances || {}).map(([id, vlans]) => ({
    instance: Number(id),
    vlans: [...vlans],
    regionalRoot: `${root.priority}.${root.mac}`,
    internalCost: 0
  }));

  return {
    protocol: 'MSTP',
    cistRoot: `${root.priority}.${root.mac}`,
    regionName: config.name || '',
    revision: config.revision || 0,
    digest,
    boundary: peers.some(p => mstRegionDigest(p.config) !== digest),
    records
  };
}

export function isMstRegionBoundary(local: MstBpdu, remote: MstBpdu): boolean {
  return local.regionName !== remote.regionName ||
         local.revision !== remote.revision ||
         local.digest !== remote.digest;
}
