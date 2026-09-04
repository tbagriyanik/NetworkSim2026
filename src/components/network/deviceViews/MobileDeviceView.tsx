'use client';

import { useState, useMemo } from 'react';
import { Smartphone, Wifi, Server, CheckCircle2, RefreshCw, Send, Radio, BatteryCharging, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/appStore';
import { checkConnectivity } from '@/lib/network/connectivity/pathResolution';

import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';
import type { SwitchState } from '@/lib/network/types';

interface MobileDeviceViewProps {
  device: CanvasDevice;
  topologyDevices: CanvasDevice[];
  topologyConnections: CanvasConnection[];
  deviceStates: Map<string, SwitchState>;
  isDark: boolean;
  language: string;
}

export function MobileDeviceView({
  device,
  topologyDevices,
  topologyConnections,
  deviceStates,
  isDark,
  language,
}: MobileDeviceViewProps) {
  const isTr = language === 'tr';
  const setDevices = useAppStore(state => state.setDevices);

  const [activeScreen, setActiveScreen] = useState<'wifi' | 'ip' | 'ping'>('wifi');

  // IP Settings
  const [ipMode, setIpMode] = useState<'dhcp' | 'static'>(device.ipConfigMode === 'dhcp' ? 'dhcp' : 'static');
  const [ip, setIp] = useState(device.ip || '192.168.1.105');
  const [subnet, setSubnet] = useState(device.subnet || '255.255.255.0');
  const [gateway, setGateway] = useState(device.gateway || '192.168.1.1');
  const [dns, setDns] = useState(device.dns || '8.8.8.8');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Wi-Fi Connection
  const [selectedSsid, setSelectedSsid] = useState(device.wifi?.ssid || 'Corporate-WiFi');

  // Diagnostic Ping state
  const [targetPingIp, setTargetPingIp] = useState('192.168.1.1');
  const [pingResults, setPingResults] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState(false);

  // Detect available wireless SSIDs from AP / WLC in topology
  const availableSsids = useMemo(() => {

    const ssids = new Set<string>(['Corporate-WiFi', 'Guest-Net', 'Branch-Wireless']);
    topologyDevices.forEach(d => {
      if (d.type === 'wlc' || d.type === 'iot') {
        if (d.wifi?.ssid) ssids.add(d.wifi.ssid);
      }
    });
    return Array.from(ssids);
  }, [topologyDevices]);

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
            wifi: {
              ssid: selectedSsid,
              security: 'open' as const,
              channel: '2.4GHz' as const,
              mode: 'client' as const,
              enabled: true,
            }
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
          `64 bytes from ${targetPingIp}: icmp_seq=1 ttl=64 time=2.10 ms`,
          `64 bytes from ${targetPingIp}: icmp_seq=2 ttl=64 time=1.85 ms`,
          `64 bytes from ${targetPingIp}: icmp_seq=3 ttl=64 time=1.92 ms`,
          `64 bytes from ${targetPingIp}: icmp_seq=4 ttl=64 time=1.88 ms`,
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
    <div className="h-full overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center custom-scrollbar">
      {/* Smartphone Outer Chassis Frame */}
      <div className={cn(
        "w-full max-w-sm rounded-[32px] border-4 p-4 shadow-2xl flex flex-col space-y-4",
        isDark ? "bg-slate-950 border-slate-700 shadow-cyan-950/20" : "bg-slate-900 border-slate-800 text-white"
      )}>
        {/* Status Bar */}
        <div className="flex justify-between items-center text-[10px] font-mono opacity-80 px-2">
          <span>12:45</span>
          <div className="w-16 h-3 bg-black rounded-full border border-slate-700" />
          <div className="flex items-center gap-1">
            <Signal className="w-3 h-3 text-emerald-400" />
            <Wifi className="w-3 h-3 text-sky-400" />
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Screen Header */}
        <div className="text-center pb-2 border-b border-slate-800">
          <h2 className="text-sm font-bold flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4 text-sky-400" />
            {device.name}
          </h2>
          <p className="text-[10px] text-slate-400">iOS / Android Mobile OS • Wi-Fi Wireless Interface</p>
        </div>

        {/* App Navigation Bar */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveScreen('wifi')}
            className={cn("py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors", activeScreen === 'wifi' ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white")}
          >
            <Wifi className="w-3 h-3" />
            Wi-Fi
          </button>
          <button
            onClick={() => setActiveScreen('ip')}
            className={cn("py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors", activeScreen === 'ip' ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white")}
          >
            <Server className="w-3 h-3" />
            {isTr ? 'IP Ağ' : 'IP Config'}
          </button>
          <button
            onClick={() => setActiveScreen('ping')}
            className={cn("py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors", activeScreen === 'ping' ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white")}
          >
            <Send className="w-3 h-3" />
            Ping App
          </button>
        </div>

        {/* Screen Content */}
        <div className="min-h-[300px] flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 text-xs space-y-4">
          {activeScreen === 'wifi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Radio className="w-4 h-4" />
                  {isTr ? 'Kablosuz Ağlar (Wi-Fi)' : 'Available Wi-Fi SSIDs'}
                </span>
                <span className="text-[10px] text-emerald-400">802.11ax Ready</span>
              </div>

              <div className="space-y-2">
                {availableSsids.map((ssid, idx) => {
                  const isConnected = selectedSsid === ssid;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSsid(ssid)}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                        isConnected ? "bg-sky-950/60 border-sky-500 text-white" : "bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Wifi className={cn("w-4 h-4", isConnected ? "text-sky-400" : "text-slate-500")} />
                        <div>
                          <div className="font-semibold text-xs">{ssid}</div>
                          <div className="text-[10px] opacity-60">WPA2/WPA3 Enterprise • 5GHz</div>
                        </div>
                      </div>
                      {isConnected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-medium">
                          {isTr ? 'Bağlı' : 'Connected'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">{isTr ? 'Bağlan' : 'Connect'}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveIp}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isTr ? 'Ağı Güncelle' : 'Update Wireless Link'}
                </button>
              </div>
            </div>
          )}

          {activeScreen === 'ip' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Server className="w-4 h-4" />
                  {isTr ? 'IP Adresi Ayarları' : 'IP Address Settings'}
                </span>
                <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setIpMode('dhcp')}
                    className={cn("px-2 py-0.5 rounded font-medium", ipMode === 'dhcp' ? "bg-sky-600 text-white" : "text-slate-400")}
                  >
                    DHCP
                  </button>
                  <button
                    onClick={() => setIpMode('static')}
                    className={cn("px-2 py-0.5 rounded font-medium", ipMode === 'static' ? "bg-sky-600 text-white" : "text-slate-400")}
                  >
                    Static
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block mb-1 font-medium opacity-80">{isTr ? 'IP Adresi' : 'IP Address'}</label>
                  <input
                    type="text"
                    disabled={ipMode === 'dhcp'}
                    value={ip}
                    onChange={e => setIp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium opacity-80">{isTr ? 'Alt Ağ Maskesi' : 'Subnet Mask'}</label>
                  <input
                    type="text"
                    disabled={ipMode === 'dhcp'}
                    value={subnet}
                    onChange={e => setSubnet(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium opacity-80">{isTr ? 'Ağ Geçidi' : 'Gateway'}</label>
                  <input
                    type="text"
                    disabled={ipMode === 'dhcp'}
                    value={gateway}
                    onChange={e => setGateway(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium opacity-80">DNS Server</label>
                  <input
                    type="text"
                    disabled={ipMode === 'dhcp'}
                    value={dns}
                    onChange={e => setDns(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={handleSaveIp}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isTr ? 'Kaydet' : 'Save Config'}
                </button>
              </div>
              {saveSuccess && (
                <div className="text-[10px] text-emerald-400 text-center font-medium animate-pulse">
                  {isTr ? 'Ağ ayarları güncellendi!' : 'Network settings saved!'}
                </div>
              )}
            </div>
          )}

          {activeScreen === 'ping' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Send className="w-4 h-4" />
                  {isTr ? 'Ping Teşhis Uygulaması' : 'Ping Diagnostics App'}
                </span>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={targetPingIp}
                  onChange={e => setTargetPingIp(e.target.value)}
                  placeholder="Target IP (192.168.1.1)"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-white outline-none text-xs"
                />
                <button
                  onClick={handleSendPing}
                  disabled={isPinging}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1"
                >
                  {isPinging ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Ping
                </button>
              </div>

              {pingResults.length > 0 && (
                <div className="p-2.5 rounded-lg bg-black font-mono text-[10px] text-emerald-400 space-y-1 overflow-x-auto border border-slate-800 max-h-[140px]">
                  {pingResults.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
