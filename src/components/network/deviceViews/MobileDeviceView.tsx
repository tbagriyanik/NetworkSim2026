'use client';

import { useState, useMemo, useRef } from 'react';
import { Smartphone, Wifi, Server, CheckCircle2, RefreshCw, Send, Radio, BatteryCharging, Signal, Globe, Bookmark, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/appStore';
import { checkConnectivity } from '@/lib/network/connectivity/pathResolution';
import { isRouterDevice, generateRouterAdminPage } from '@/components/network/WifiControlPanel';
import { generatePrinterWebPanelContent } from '@/lib/network/printerWebPanel';
import { generateIotWebPanelContent } from '@/lib/network/iotWebPanel';
import { HttpBrowserWindow } from '@/components/network/pc-panel/HttpBrowserWindow';

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

  // Mobile Web Browser Floating Window State
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserUrl, setBrowserUrl] = useState(device.gateway || '192.168.1.1');
  const [browserContent, setBrowserContent] = useState<string>('');
  const [browserTitle, setBrowserTitle] = useState('Web Browser');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [browserWindow, setBrowserWindow] = useState({
    x: Math.max(20, typeof window !== 'undefined' ? Math.floor(window.innerWidth / 2 - 280) : 100),
    y: Math.max(20, typeof window !== 'undefined' ? Math.floor(window.innerHeight / 2 - 220) : 100),
    width: 560,
    height: 400,
  });

  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeStateRef = useRef<{ side: any; startX: number; startY: number; originX: number; originY: number; originW: number; originH: number } | null>(null);

  // Address bar autocomplete suggestions
  const suggestions = useMemo(() => {
    const list = [
      device.gateway || '192.168.1.1',
      '8.8.8.8',
      '1.1.1.1',
      'http://iot-panel',
    ];
    topologyDevices.forEach(d => {
      if (d.ip) list.push(`http://${d.ip}`);
    });
    return Array.from(new Set(list));
  }, [device.gateway, topologyDevices]);

  // Detect available active wireless SSIDs exclusively from real topology devices
  const availableSsids = useMemo(() => {
    const ssids = new Set<string>();
    topologyDevices.forEach(d => {
      if (d.wifi?.enabled && d.wifi?.mode === 'ap' && d.wifi?.ssid?.trim()) {
        ssids.add(d.wifi.ssid.trim());
      } else if (d.type === 'wlc' && d.wifi?.enabled && d.wifi?.ssid?.trim()) {
        ssids.add(d.wifi.ssid.trim());
      }
    });
    if (device.wifi?.ssid?.trim()) {
      ssids.add(device.wifi.ssid.trim());
    }
    return Array.from(ssids);
  }, [topologyDevices, device.wifi?.ssid]);

  // Helper to obtain DHCP IP based on connected AP/WLC or default subnet
  const obtainDhcpIpForSsid = (targetSsid: string) => {
    const targetAp = topologyDevices.find(d => d.wifi?.ssid === targetSsid && d.wifi?.enabled);
    let assignedIp = '192.168.1.105';
    let assignedSubnet = '255.255.255.0';
    let assignedGateway = '192.168.1.1';
    let assignedDns = '8.8.8.8';

    if (targetAp) {
      const baseIp = targetAp.ip || '192.168.1.1';
      const parts = baseIp.split('.');
      if (parts.length === 4) {
        const hostNum = Math.floor(Math.random() * 150) + 50;
        assignedIp = `${parts[0]}.${parts[1]}.${parts[2]}.${hostNum}`;
        assignedSubnet = targetAp.subnet || '255.255.255.0';
        assignedGateway = targetAp.gateway || baseIp;
        assignedDns = targetAp.dns || '8.8.8.8';
      }
    }

    return { assignedIp, assignedSubnet, assignedGateway, assignedDns };
  };

  const handleSelectSsid = (ssid: string) => {
    setSelectedSsid(ssid);
    let nextIp = ip;
    let nextSubnet = subnet;
    let nextGateway = gateway;
    let nextDns = dns;

    if (ipMode === 'dhcp') {
      const dhcpConfig = obtainDhcpIpForSsid(ssid);
      nextIp = dhcpConfig.assignedIp;
      nextSubnet = dhcpConfig.assignedSubnet;
      nextGateway = dhcpConfig.assignedGateway;
      nextDns = dhcpConfig.assignedDns;
      setIp(nextIp);
      setSubnet(nextSubnet);
      setGateway(nextGateway);
      setDns(nextDns);
    }

    setDevices(
      topologyDevices.map(d => {
        if (d.id === device.id) {
          return {
            ...d,
            ipConfigMode: ipMode,
            ip: nextIp,
            subnet: nextSubnet,
            gateway: nextGateway,
            dns: nextDns,
            wifi: {
              ssid,
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
  };

  const handleSetIpMode = (mode: 'dhcp' | 'static') => {
    setIpMode(mode);
    if (mode === 'dhcp') {
      const dhcpConfig = obtainDhcpIpForSsid(selectedSsid);
      setIp(dhcpConfig.assignedIp);
      setSubnet(dhcpConfig.assignedSubnet);
      setGateway(dhcpConfig.assignedGateway);
      setDns(dhcpConfig.assignedDns);
    }
  };

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

  const handleNavigateBrowser = (targetUrl?: string) => {
    const rawUrl = (targetUrl || browserUrl || '192.168.1.1').trim();
    if (!rawUrl || rawUrl === '0.0.0.0') return;

    let displayUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `http://${rawUrl}`;
    setBrowserUrl(displayUrl);

    let hostOrIp = displayUrl.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

    // Handle IoT Web Panel shortcut
    if (rawUrl === 'http://iot-panel' || rawUrl === 'iot-panel') {
      const iotDevices = topologyDevices.filter(d => d.type === 'iot');
      const content = generateIotWebPanelContent(iotDevices, language, undefined, undefined, topologyConnections as unknown as { sourceDeviceId: string; targetDeviceId: string }[]);
      setBrowserContent(content);
      setBrowserTitle(isTr ? 'IoT Kontrol Paneli' : 'IoT Web Panel');
      return;
    }

    // Check target device by IP or hostname
    let targetDev = topologyDevices.find(d => d.ip === hostOrIp || d.name?.toLowerCase() === hostOrIp.toLowerCase() || d.id === hostOrIp);

    // If host is gateway, resolve device.gateway
    if (!targetDev && (hostOrIp === 'gateway' || hostOrIp === '192.168.1.1' || hostOrIp === device.gateway)) {
      const gwIp = device.gateway || '192.168.1.1';
      targetDev = topologyDevices.find(d => d.ip === gwIp) || topologyDevices.find(d => d.type === 'router' || d.type === 'wlc' || d.type === 'firewall');
      if (targetDev) hostOrIp = targetDev.ip || gwIp;
    }

    const connRes = checkConnectivity(
      device.id,
      targetDev?.ip || hostOrIp,
      topologyDevices,
      topologyConnections,
      deviceStates,
      isTr ? 'tr' : 'en',
      { protocol: 'tcp', port: '80' }
    );

    if (!connRes.success && !hostOrIp.includes('8.8.8.8') && !hostOrIp.includes('1.1.1.1')) {
      setBrowserTitle(isTr ? 'Bağlantı Hatası' : 'Connection Error');
      setBrowserContent(`
        <main style="padding:32px;font-family:system-ui,sans-serif;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">🚫</div>
          <h1 style="margin:0 0 8px;font-size:22px;color:#ef4444;">${isTr ? 'Sunucuya Ulaşılamıyor' : 'Server Unreachable'}</h1>
          <p style="margin:0 0 12px;font-size:14px;color:#64748b;">${connRes.error || (isTr ? 'Ağ geçidi veya sunucu yanıt vermiyor.' : 'Gateway or server not responding.')}</p>
          <code style="display:inline-block;padding:6px 12px;border-radius:8px;background:#fee2e2;color:#991b1b;font-size:12px;">${displayUrl}</code>
        </main>
      `);
      return;
    }

    // 1. Router / WLC Admin Panel
    if (targetDev && (isRouterDevice(targetDev) || targetDev.type === 'router' || targetDev.type === 'wlc')) {
      const runtimeState = deviceStates.get(targetDev.id);
      const adminPage = generateRouterAdminPage(targetDev, language, runtimeState, [], []);
      setBrowserTitle(targetDev.name || 'Router Admin');
      setBrowserContent(adminPage);
    }
    // 2. Printer Control Panel
    else if (targetDev && targetDev.type === 'printer') {
      const printerPage = generatePrinterWebPanelContent(targetDev, language);
      setBrowserTitle(targetDev.name || 'Printer Web');
      setBrowserContent(printerPage);
    }
    // 3. Public WAN / Cloud Internet Services (8.8.8.8, 1.1.1.1)
    else if (hostOrIp === '8.8.8.8' || hostOrIp === '8.8.4.4' || hostOrIp === '1.1.1.1' || targetDev?.type === 'cloud') {
      setBrowserTitle(isTr ? 'Genel Arama Portalı - WAN' : 'Public Search Portal - WAN');
      setBrowserContent(`
        <main style="padding:32px;font-family:system-ui,sans-serif;text-align:center;">
          <div style="font-size:36px;font-weight:bold;color:#3b82f6;margin-bottom:8px;">🌐 ${isTr ? 'Arama Portalı' : 'Web Portal'}</div>
          <p style="font-size:14px;color:#64748b;margin-bottom:20px;">${isTr ? 'Genel WAN İnternet Geçidi (8.8.8.8)' : 'Public WAN Internet Gateway (8.8.8.8)'}</p>
          <div style="border:1px solid #cbd5e1;border-radius:24px;padding:10px 20px;max-width:320px;margin:0 auto 20px;font-size:13px;color:#475569;">🔍 ${isTr ? 'Arama yapın veya URL girin' : 'Search or type URL'}</div>
          <div style="background:#f1f5f9;padding:16px;border-radius:12px;font-size:12px;color:#334155;text-align:left;max-width:400px;margin:0 auto;">
            <strong style="color:#1e293b;">${isTr ? 'İnternet Bağlantısı Aktif' : 'Internet Connection Active'}</strong><br/>
            ${isTr ? 'WAN Köprüsü ve Genel DNS Sunucusu başarıyla yanıt verdi.' : 'WAN Transit Bridge and Public DNS Server responded successfully.'}
          </div>
        </main>
      `);
    }
    // 4. End Device HTTP Web Server
    else if (targetDev && (targetDev.services?.http?.enabled || targetDev.ip)) {
      const pageContent = targetDev.services?.http?.content || `
        <main style="padding:32px;font-family:system-ui,sans-serif;text-align:center;">
          <h2 style="font-size:24px;color:#10b981;margin-bottom:8px;">Welcome to ${targetDev.name || targetDev.id}</h2>
          <p style="font-size:14px;color:#475569;">HTTP Web Server is online and active.</p>
        </main>
      `;
      setBrowserTitle(`${targetDev.name || targetDev.id} Web`);
      setBrowserContent(pageContent);
    }
    // 5. Fallback 404
    else {
      setBrowserTitle('404 Not Found');
      setBrowserContent(`
        <main style="padding:32px;font-family:system-ui,sans-serif;text-align:center;">
          <h1 style="font-size:40px;margin:0 0 8px;">404</h1>
          <p style="font-size:14px;color:#64748b;margin:0 0 12px;">${isTr ? 'Web Sayfası Bulunamadı' : 'Web Page Not Found'}</p>
          <code style="display:inline-block;padding:6px 12px;border-radius:8px;background:#f1f5f9;color:#0f172a;font-size:12px;">${displayUrl}</code>
        </main>
      `);
    }
  };

  const handleOpenBrowserWindow = (targetUrl?: string) => {
    const defaultUrl = (device.gateway && device.gateway !== '0.0.0.0') ? device.gateway : '192.168.1.1';
    const target = targetUrl || (browserUrl && browserUrl !== '0.0.0.0' ? browserUrl : defaultUrl);
    handleNavigateBrowser(target);
    setIsBrowserOpen(true);
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
          <p className="text-[10px] text-slate-400">iOS / Android Mobile OS • Wi-Fi & Web</p>
        </div>

        {/* App Navigation Bar (3 Tabs: Wi-Fi, IP Config, Ping) */}
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

        {/* Web Browser App Launcher Banner Button */}
        <button
          onClick={() => handleOpenBrowserWindow()}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-between shadow-lg shadow-sky-600/20 active:scale-[0.99] group border border-sky-400/30"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 text-cyan-200" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xs">{isTr ? 'Mobil Web Tarayıcısı' : 'Mobile Web Browser'}</div>
              <div className="text-[9px] opacity-70 font-mono">{browserUrl || 'http://192.168.1.1'}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] bg-black/30 px-2 py-1 rounded-lg font-mono">
            <span>{isTr ? 'Pencerede Aç' : 'Open Window'}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </button>

        {/* Screen Content */}
        <div className="min-h-[280px] flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-800 text-xs space-y-4">
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
                {availableSsids.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-slate-400 text-xs">
                    {isTr ? 'Kapsama alanında aktif Wi-Fi ağı bulunamadı' : 'No active Wi-Fi networks found in range'}
                  </div>
                ) : (
                  availableSsids.map((ssid, idx) => {
                    const isConnected = selectedSsid === ssid;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectSsid(ssid)}
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
                  })
                )}
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
                    onClick={() => handleSetIpMode('dhcp')}
                    className={cn("px-2 py-0.5 rounded font-medium", ipMode === 'dhcp' ? "bg-sky-600 text-white" : "text-slate-400")}
                  >
                    DHCP
                  </button>
                  <button
                    onClick={() => handleSetIpMode('static')}
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

      {/* PC-style Floating Resizable Browser Window Portal */}
      <HttpBrowserWindow
        isOpen={isBrowserOpen}
        isMobile={false}
        isDark={isDark}
        language={language}
        browserWindow={browserWindow}
        onBrowserWindowChange={setBrowserWindow}
        title={browserTitle}
        url={browserUrl || ''}
        srcDoc={browserContent}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        selectedSuggestionIndex={selectedSuggestionIndex}
        urlInputRef={urlInputRef}
        dragStateRef={dragStateRef}
        resizeStateRef={resizeStateRef}
        onClose={() => setIsBrowserOpen(false)}
        onUrlChange={setBrowserUrl}
        onSetShowSuggestions={setShowSuggestions}
        onSetSelectedSuggestionIndex={setSelectedSuggestionIndex}
        onOpenWebPage={(url) => handleNavigateBrowser(url)}
      />
    </div>
  );
}

