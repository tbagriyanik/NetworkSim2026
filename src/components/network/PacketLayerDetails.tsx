import { X } from 'lucide-react';

type Packet = { sourceIp: string; targetIp: string; protocol: string; info: string; length?: number };

export function PacketLayerDetails({ packet, onClose, isDark, language }: { packet: Packet; onClose: () => void; isDark: boolean; language: string }) {
  const protocol = packet.protocol.toUpperCase();
  const transport = ['TCP', 'UDP', 'ICMP', 'ICMPV6'].includes(protocol) ? protocol : '—';
  return <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4`} onClick={onClose}>
    <div className={`w-full max-w-md rounded-lg border p-4 shadow-2xl ${isDark ? 'bg-secondary-900 border-secondary-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3"><h3 className="font-bold">{language === 'tr' ? 'OSI Paket Ayrıştırma' : 'OSI Packet Dissection'}</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      <div className="space-y-2 text-xs font-mono">
        <div className="rounded border border-amber-500/40 p-2"><b>L2 Ethernet</b><div>Type: {packet.protocol}</div><div>Payload: {packet.length ?? '—'} bytes</div></div>
        <div className="rounded border border-sky-500/40 p-2"><b>L3 IP</b><div>Source: {packet.sourceIp}</div><div>Destination: {packet.targetIp}</div></div>
        <div className="rounded border border-emerald-500/40 p-2"><b>L4 {transport}</b><div>{packet.info || 'No transport details'}</div></div>
      </div>
    </div>
  </div>;
}
