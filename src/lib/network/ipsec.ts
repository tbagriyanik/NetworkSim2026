export interface IpsecSa { peer: string; phase1: 'up'; phase2: 'up'; transformSet: string; establishedAt: number; }
export interface EspPacket { protocol: 50; spi: string; encrypted: boolean; originalProtocol: string; }
export function establishIpsecSa(peer: string, transformSet: string, now = Date.now()): IpsecSa { return { peer, phase1: 'up', phase2: 'up', transformSet, establishedAt: now }; }
export function encapsulateEsp(protocol: string, sa: IpsecSa): EspPacket { return { protocol: 50, spi: `${sa.peer}:${sa.transformSet}`, encrypted: true, originalProtocol: protocol }; }
