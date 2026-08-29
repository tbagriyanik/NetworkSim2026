export type Dot1xState = 'unauthorized'|'authenticating'|'authorized'|'failed';
export interface EapolFrame { type:'start'|'identity'|'challenge'|'success'|'failure'; identity?:string; }
export interface Dot1xSession { port:string; state:Dot1xState; identity?:string; lastFrame?:EapolFrame['type']; }
export function processEapol(session: Dot1xSession, frame: EapolFrame, radiusAvailable: boolean, validIdentity = true): Dot1xSession {
  if (frame.type === 'start') return {...session,state:'authenticating',lastFrame:'start'};
  if (frame.type === 'identity') return {...session,state:'authenticating',identity:frame.identity,lastFrame:'identity'};
  if (frame.type === 'challenge') return {...session,state:radiusAvailable && validIdentity ? 'authorized' : 'failed',lastFrame:radiusAvailable && validIdentity ? 'success' : 'failure'};
  return {...session,state:frame.type === 'success' ? 'authorized' : 'failed',lastFrame:frame.type};
}
