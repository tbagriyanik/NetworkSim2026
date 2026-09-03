import type { MstConfig } from './types';

export interface MstBridge { id: string; priority: number; mac: string; config: MstConfig; }
export interface MstMRecord { instance: number; vlans: number[]; regionalRoot: string; internalCost: number; }
export interface MstBpdu { protocol: 'MSTP'; cistRoot: string; regionName: string; revision: number; digest: string; records: MstMRecord[]; boundary: boolean; }

export function mstRegionDigest(config: MstConfig): string {
  const vlans = Object.entries(config.instances || {}).sort(([a], [b]) => Number(a) - Number(b)).map(([id, values]) => `${id}:${[...values].sort((a, b) => a - b).join(',')}`).join('|');
  return `${config.name || ''}:${config.revision || 0}:${vlans}`;
}
export function electCistRoot(bridges: MstBridge[]): MstBridge | undefined {
  return [...bridges].sort((a, b) => (a.priority - b.priority) || a.mac.localeCompare(b.mac))[0];
}
export function buildMstBpdu(bridge: MstBridge, peers: MstBridge[] = []): MstBpdu {
  const root = electCistRoot([bridge, ...peers]) || bridge;
  const config = bridge.config; const digest = mstRegionDigest(config);
  return { protocol: 'MSTP', cistRoot: `${root.priority}.${root.mac}`, regionName: config.name || '', revision: config.revision || 0, digest, boundary: peers.some(p => mstRegionDigest(p.config) !== digest), records: Object.entries(config.instances || {}).map(([id, vlans]) => ({ instance: Number(id), vlans: [...vlans], regionalRoot: `${root.priority}.${root.mac}`, internalCost: 0 })) };
}
export function isMstRegionBoundary(local: MstBpdu, remote: MstBpdu): boolean { return local.regionName !== remote.regionName || local.revision !== remote.revision || local.digest !== remote.digest; }
