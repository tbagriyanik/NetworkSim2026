'use client';

import { useMemo } from 'react';
import { Globe, Radio, Server, Activity, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';

interface CloudDeviceViewProps {
  device: CanvasDevice;
  topologyDevices?: CanvasDevice[];
  topologyConnections: CanvasConnection[];
  isDark: boolean;
  language: string;
}

export function CloudDeviceView({
  device,
  topologyConnections,
  isDark,
  language,
}: CloudDeviceViewProps) {
  const isTr = language === 'tr';

  // Count active WAN links to Cloud
  const connectedLinks = useMemo(() => {
    return topologyConnections.filter(c => c.sourceDeviceId === device.id || c.targetDeviceId === device.id);
  }, [topologyConnections, device.id]);


  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
      {/* Header Info */}
      <div className={cn(
        "p-5 rounded-xl border flex items-center justify-between",
        isDark ? "bg-secondary-900/60 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              {device.name} — WAN / Internet Service Provider
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                {isTr ? 'Aktif İnternet Geçidi' : 'Active Internet Gateway'}
              </span>
            </h2>
            <p className="text-xs opacity-60">Global Autonomous System (AS15169 / Public WAN Transit Cloud)</p>
          </div>
        </div>
        <div className="text-right font-mono text-xs opacity-70">
          <div>Eth0 (WAN): Public ISP Bridge</div>
          <div>Active Links: {connectedLinks.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Public Internet Services */}
        <div className={cn(
          "p-5 rounded-xl border space-y-4",
          isDark ? "bg-secondary-900/40 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
        )}>
          <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3 border-secondary-700/40">
            <Server className="w-4 h-4 text-cyan-400" />
            {isTr ? 'Simüle Edilen Genel İnternet Servisleri' : 'Simulated Public Internet Services'}
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-secondary-950 border border-secondary-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold">Google Public DNS</div>
                  <div className="text-[10px] font-mono text-secondary-400">8.8.8.8 / 8.8.4.4</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">ONLINE</span>
            </div>

            <div className="p-3 rounded-lg bg-secondary-950 border border-secondary-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-semibold">Cloudflare Resolver</div>
                  <div className="text-[10px] font-mono text-secondary-400">1.1.1.1 / 1.0.0.1</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">ONLINE</span>
            </div>

            <div className="p-3 rounded-lg bg-secondary-950 border border-secondary-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold">Global NTP Pool</div>
                  <div className="text-[10px] font-mono text-secondary-400">pool.ntp.org</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">SYNCHRONIZED</span>
            </div>
          </div>
        </div>

        {/* Right Column: WAN Link Statistics */}
        <div className={cn(
          "p-5 rounded-xl border space-y-4",
          isDark ? "bg-secondary-900/40 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
        )}>
          <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3 border-secondary-700/40">
            <Activity className="w-4 h-4 text-cyan-400" />
            {isTr ? 'WAN Bağlantı & Trafik Monitörü' : 'WAN Link & Traffic Monitor'}
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary-950 border border-secondary-800">
              <span>{isTr ? 'Simüle Edilen Gecikme (WAN Latency)' : 'Simulated WAN Latency'}</span>
              <span className="font-mono text-cyan-400 font-bold">12 ms</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary-950 border border-secondary-800">
              <span>{isTr ? 'Aktif WAN Bağlantıları (Customer Links)' : 'Active Customer WAN Links'}</span>
              <span className="font-mono text-emerald-400 font-bold">{connectedLinks.length} Connections</span>
            </div>

            <div className="p-3 rounded-lg bg-secondary-950 border border-secondary-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                  {isTr ? 'Ağ Geçidi İletim Modu' : 'Gateway Forwarding Mode'}
                </span>
                <span className="text-cyan-400 font-mono">NAT / Transit Bridge</span>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                {isTr
                  ? 'Bulut (Cloud) nesnesi dış internet hatlarını ve servis sağlayıcı (ISP) omurgasını temsil eder. Yerel ağınızdaki cihazlar dış dünyadaki IP adreslerine veya alan adlarına eriştiğinde paketler Bulut geçidi üzerinden başarıyla iletilir.'
                  : 'The Cloud device simulates external ISP WAN connectivity. Any internal network devices reaching external IP addresses or domain names are automatically routed and bridged through the Cloud gateway.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
