// Central packet capture dispatcher.
// Every network operation that produces captured packets (ping, curl, ssh, dns,
// dhcp, wget, tracert, ntp, telnet, ftp, mail, ...) dispatches them through this
// helper so the global "packet-captured" listener (usePageNetworkLogic) can add
// them to the per-cable capture list.
import { CapturedPacket } from '@/lib/store/appStore';

type CapturedPacketInput = Omit<CapturedPacket, 'id' | 'timestamp'>;

export function dispatchCapturedPackets(
  packets: CapturedPacketInput[] | undefined | null
): void {
  if (typeof window === 'undefined' || !packets || packets.length === 0) return;
  packets.forEach(pkt => {
    window.dispatchEvent(new CustomEvent('packet-captured', { detail: pkt }));
  });
}
