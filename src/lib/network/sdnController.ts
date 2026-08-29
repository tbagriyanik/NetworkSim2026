export interface YangLeaf { name: string; type: string; config: boolean; }
export interface YangModule { name: string; namespace: string; leaves: YangLeaf[]; }
export type YangData = Record<string, string | number | boolean>;

/** Minimal YANG 1.1 subset parser for simulator data models. */
export function parseYangModule(source: string): YangModule {
  const name = source.match(/\bmodule\s+([\w-]+)\s*\{/i)?.[1];
  const namespace = source.match(/\bnamespace\s+"([^"]+)"\s*;/i)?.[1];
  if (!name || !namespace) throw new Error('Invalid YANG module: module and namespace are required');
  const leaves: YangLeaf[] = [];
  const leafPattern = /\bleaf\s+([\w-]+)\s*\{([\s\S]*?)\}/gi; let match: RegExpExecArray | null;
  while ((match = leafPattern.exec(source))) { const type = match[2].match(/\btype\s+([\w:-]+)/i)?.[1] || 'string'; leaves.push({name:match[1],type,config:! /\bconfig\s+false\s*;/i.test(match[2])}); }
  return {name,namespace,leaves};
}

export class SdnController {
  private readonly data = new Map<string, YangData>();
  constructor(public readonly modules: YangModule[] = []) {}
  get(path: string): YangData | undefined { const value=this.data.get(path); return value ? {...value} : undefined; }
  editConfig(path: string, patch: YangData): YangData { const current={...this.data.get(path)}; const schema=this.modules.flatMap(m=>m.leaves).filter(l=>l.config); for(const key of Object.keys(patch)){ const leaf=schema.find(l=>l.name===key); if(leaf && leaf.type==='boolean' && typeof patch[key]!=='boolean') throw new Error(`Invalid type for ${key}`); } const next={...current,...patch}; this.data.set(path,next); return {...next}; }
  netconfGet(path: string): string { return `<data><config path="${path}">${JSON.stringify(this.get(path)||{})}</config></data>`; }
  restconfGet(path: string): YangData | undefined { return this.get(path); }
  restconfPatch(path: string, patch: YangData): YangData { return this.editConfig(path,patch); }
}
