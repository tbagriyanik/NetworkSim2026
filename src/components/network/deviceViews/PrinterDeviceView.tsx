'use client';

import { useState } from 'react';
import { Printer, Server, CheckCircle2, RefreshCw, Send, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/appStore';
import { checkConnectivity } from '@/lib/network/connectivity/pathResolution';

import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';
import type { SwitchState } from '@/lib/network/types';

interface PrinterDeviceViewProps {
  device: CanvasDevice;
  topologyDevices: CanvasDevice[];
  topologyConnections: CanvasConnection[];
  deviceStates: Map<string, SwitchState>;
  isDark: boolean;
  language: string;
}

export function PrinterDeviceView({
  device,
  topologyDevices,
  topologyConnections,
  deviceStates,
  isDark,
  language,
}: PrinterDeviceViewProps) {
  const isTr = language === 'tr';
  const setDevices = useAppStore(state => state.setDevices);

  // Local state for IP editing
  const [ipMode, setIpMode] = useState<'dhcp' | 'static'>(device.ipConfigMode === 'dhcp' ? 'dhcp' : 'static');
  const [ip, setIp] = useState(device.ip || '192.168.1.50');
  const [subnet, setSubnet] = useState(device.subnet || '255.255.255.0');
  const [gateway, setGateway] = useState(device.gateway || '192.168.1.1');
  const [dns, setDns] = useState(device.dns || '8.8.8.8');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Diagnostic Ping state
  const [targetPingIp, setTargetPingIp] = useState('192.168.1.1');
  const [pingResults, setPingResults] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState(false);

  const handleSaveIp = () => {
    setDevices(
      topologyDevices.map(d => {
        if (d.id === device.id) {
          return {
            ...d,
            ipConfigMode: ipMode,
            ip,
            subnet,
            gateway,
            dns,
          };
        }
        return d;
      })
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSendPing = () => {
    if (!targetPingIp.trim()) return;
    setIsPinging(true);
    setPingResults([isTr ? `Ping gönderiliyor: ${targetPingIp}...` : `Pinging ${targetPingIp}...`]);

    setTimeout(() => {
      const res = checkConnectivity(

        device.id,
        targetPingIp.trim(),
        topologyDevices,
        topologyConnections,
        deviceStates,
        isTr ? 'tr' : 'en',
        { protocol: 'icmp' }
      );

      if (res.success) {
        setPingResults([
          `PING ${targetPingIp} 56(84) bytes of data.`,
          `64 bytes from ${targetPingIp}: icmp_seq=1 ttl=64 time=1.24 ms`,
          `64 bytes from ${targetPingIp}: icmp_seq=2 ttl=64 time=1.08 ms`,
          `64 bytes from ${targetPingIp}: icmp_seq=3 ttl=64 time=1.15 ms`,
          `64 bytes from ${targetPingIp}: icmp_seq=4 ttl=64 time=1.11 ms`,
          `--- ${targetPingIp} ping statistics ---`,
          `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`
        ]);
      } else {
        setPingResults([
          `PING ${targetPingIp} 56(84) bytes of data.`,
          `Request timeout for icmp_seq 1`,
          `Request timeout for icmp_seq 2`,
          `Request timeout for icmp_seq 3`,
          `Request timeout for icmp_seq 4`,
          `--- ${targetPingIp} ping statistics ---`,
          `4 packets transmitted, 0 received, 100% packet loss`
        ]);
      }
      setIsPinging(false);
    }, 400);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
      {/* Header Info */}
      <div className={cn(
        "p-4 rounded-xl border flex items-center justify-between",
        isDark ? "bg-secondary-900/60 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              {device.name}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                {isTr ? 'Hazır / Online' : 'Ready / Online'}
              </span>
            </h2>
            <p className="text-xs opacity-60">Network Print Server (Wi-Fi & Ethernet Dual Interface)</p>
          </div>
        </div>
        <div className="text-right font-mono text-xs opacity-70">
          <div>MAC: {device.macAddress || '0050.56C0.0001'}</div>
          <div>Ethernet: Eth0 | Wireless: WLAN0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: IP Configuration */}
        <div className={cn(
          "p-5 rounded-xl border space-y-4",
          isDark ? "bg-secondary-900/40 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
        )}>
          <div className="flex items-center justify-between border-b pb-3 border-secondary-700/40">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              {isTr ? 'Ağ & IP Yapılandırması' : 'Network & IP Configuration'}
            </h3>
            <div className="flex items-center gap-1 bg-secondary-800/40 p-1 rounded-lg border border-secondary-700/50 text-xs">
              <button
                onClick={() => setIpMode('dhcp')}
                className={cn("px-2 py-0.5 rounded font-medium transition-colors", ipMode === 'dhcp' ? "bg-purple-600 text-white" : "opacity-60 hover:opacity-100")}
              >
                DHCP
              </button>
              <button
                onClick={() => setIpMode('static')}
                className={cn("px-2 py-0.5 rounded font-medium transition-colors", ipMode === 'static' ? "bg-purple-600 text-white" : "opacity-60 hover:opacity-100")}
              >
                Static
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block mb-1 font-medium opacity-80">{isTr ? 'IP Adresi' : 'IP Address'}</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={ip}
                onChange={e => setIp(e.target.value)}
                className={cn(
                  "w-full px-3 py-1.5 rounded-lg border font-mono outline-none transition-colors",
                  isDark ? "bg-secondary-950 border-secondary-700 text-white" : "bg-slate-50 border-secondary-300 text-slate-900",
                  ipMode === 'dhcp' && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium opacity-80">{isTr ? 'Alt Ağ Maskesi' : 'Subnet Mask'}</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={subnet}
                onChange={e => setSubnet(e.target.value)}
                className={cn(
                  "w-full px-3 py-1.5 rounded-lg border font-mono outline-none transition-colors",
                  isDark ? "bg-secondary-950 border-secondary-700 text-white" : "bg-slate-50 border-secondary-300 text-slate-900",
                  ipMode === 'dhcp' && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium opacity-80">{isTr ? 'Varsayılan Ağ Geçidi' : 'Default Gateway'}</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={gateway}
                onChange={e => setGateway(e.target.value)}
                className={cn(
                  "w-full px-3 py-1.5 rounded-lg border font-mono outline-none transition-colors",
                  isDark ? "bg-secondary-950 border-secondary-700 text-white" : "bg-slate-50 border-secondary-300 text-slate-900",
                  ipMode === 'dhcp' && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium opacity-80">DNS Server</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={dns}
                onChange={e => setDns(e.target.value)}
                className={cn(
                  "w-full px-3 py-1.5 rounded-lg border font-mono outline-none transition-colors",
                  isDark ? "bg-secondary-950 border-secondary-700 text-white" : "bg-slate-50 border-secondary-300 text-slate-900",
                  ipMode === 'dhcp' && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleSaveIp}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isTr ? 'Ayarları Kaydet' : 'Save Configuration'}
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse">
                {isTr ? 'Kaydedildi!' : 'Saved successfully!'}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Hardware & Toner Status */}
        <div className={cn(
          "p-5 rounded-xl border space-y-4",
          isDark ? "bg-secondary-900/40 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
        )}>
          <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3 border-secondary-700/40">
            <HardDrive className="w-4 h-4 text-purple-400" />
            {isTr ? 'Donanım & Sarf Malzemeleri' : 'Hardware & Supplies Status'}
          </h3>

          <div className="space-y-4 text-xs">
            {/* Paper Tray */}
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span>{isTr ? 'Kağıt Kasedi (Tray 1 - A4)' : 'Paper Tray 1 (A4)'}</span>
                <span className="text-emerald-400 font-mono">100% (Dolu)</span>
              </div>
              <div className="w-full bg-secondary-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]" />
              </div>
            </div>

            {/* Toner Cartridges */}
            <div className="space-y-2 pt-1">
              <span className="block font-medium opacity-80 mb-1">{isTr ? 'Toner Seviyeleri' : 'Toner Cartridge Levels'}</span>
              <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-700 text-white">
                  <div className="font-bold">BLACK</div>
                  <div className="text-emerald-400 mt-1">98%</div>
                </div>
                <div className="p-2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                  <div className="font-bold">CYAN</div>
                  <div className="text-cyan-400 mt-1">92%</div>
                </div>
                <div className="p-2 rounded bg-rose-950 border border-rose-700 text-rose-300">
                  <div className="font-bold">MAGENTA</div>
                  <div className="text-rose-400 mt-1">95%</div>
                </div>
                <div className="p-2 rounded bg-amber-950 border border-amber-700 text-amber-300">
                  <div className="font-bold">YELLOW</div>
                  <div className="text-amber-400 mt-1">90%</div>
                </div>
              </div>
            </div>

            {/* Print Queue */}
            <div className="p-3 rounded-lg bg-secondary-950 border border-secondary-800 space-y-1">
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span>{isTr ? 'Yazdırma Kuyruğu (Print Queue)' : 'Print Queue'}</span>
                <span className="text-purple-400 font-mono">0 Jobs</span>
              </div>
              <p className="text-[10px] opacity-60 italic">
                {isTr ? 'Bekleyen iş yok. Yazıcı hazır konumda.' : 'No active print jobs in queue. Printer ready.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics: Ping Tool */}
      <div className={cn(
        "p-5 rounded-xl border space-y-3",
        isDark ? "bg-secondary-900/40 border-secondary-800" : "bg-white border-secondary-200 shadow-sm"
      )}>
        <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3 border-secondary-700/40">
          <Send className="w-4 h-4 text-purple-400" />
          {isTr ? 'Yazıcı Ağ Teşhisi (Ping Testi)' : 'Printer Network Diagnostics (Ping Test)'}
        </h3>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={targetPingIp}
            onChange={e => setTargetPingIp(e.target.value)}
            placeholder={isTr ? 'Hedef IP (örn: 192.168.1.1)' : 'Target IP (e.g. 192.168.1.1)'}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg border font-mono text-xs outline-none",
              isDark ? "bg-secondary-950 border-secondary-700 text-white" : "bg-slate-50 border-secondary-300 text-slate-900"
            )}
          />
          <button
            onClick={handleSendPing}
            disabled={isPinging}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            {isPinging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isTr ? 'Ping Gönder' : 'Send Ping'}
          </button>
        </div>

        {pingResults.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto border border-slate-800">
            {pingResults.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
