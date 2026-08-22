'use client';

import { useState, useEffect, useMemo } from 'react';
import { SwitchState } from '@/lib/network/types';
import { normalizeMAC } from '@/lib/utils';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CanvasDevice, DeviceType } from '@/components/network/networkTopology.types';
import {
  Terminal,
  Settings,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Server,
  Network,
  Shield,
  Radio,
  Monitor,
  Check
} from 'lucide-react';

// ─── Types & Constants ────────────────────────────────────────────────────────

export type RefreshDeviceSummary = {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  mac: string;
  gateway: string;
  ipv6: string;
  services: string;
  rawDevice?: CanvasDevice;
  rawState?: SwitchState;
};

export const REFRESH_DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  router: 'Router',
  switchL3: 'L3 SW',
  switchL2: 'L2 SW',
  pc: 'PC',
  iot: 'IoT',
  firewall: 'Firewall',
  wlc: 'WLC',
};

export const REFRESH_DEVICE_TYPE_ORDER: DeviceType[] = ['router', 'switchL3', 'switchL2', 'pc', 'iot', 'firewall', 'wlc'];

// ─── Helper Functions for CLI & Settings ──────────────────────────────────────

// ─── Helper Functions for CLI & Settings ──────────────────────────────────────

function getRecommendedCliCommands(
  type: DeviceType,
  isTR: boolean,
  rawState?: SwitchState,
  rawDevice?: CanvasDevice
): Array<{ cmd: string; desc: string; mode?: string }> {
  const cmds: Array<{ cmd: string; desc: string; mode?: string }> = [];

  // 1. DYNAMIC CONFIGURATION COMMANDS (Gerçek Değişken ve Yapılandırma Bilgileri)
  if (rawState) {
    // VLAN tanımları
    if (rawState.vlans) {
      Object.values(rawState.vlans).forEach((vlan) => {
        if (vlan.id !== 1 && vlan.id < 1002) { // Standart default VLAN 1 dışındaki tanımlı VLAN'lar
          cmds.push({
            cmd: `vlan ${vlan.id}\n name ${vlan.name || `VLAN${vlan.id}`}\n exit`,
            desc: isTR ? `VLAN ${vlan.id} (${vlan.name || `VLAN${vlan.id}`}) Yapılandırması` : `VLAN ${vlan.id} configuration`,
            mode: '(config)#'
          });
        }
      });
    }

    // Arayüz (Port) IP ve Switchport Yapılandırmaları
    if (rawState.ports) {
      Object.values(rawState.ports).forEach((port) => {
        // IP tanımlı L3 / Router portları
        if (port.ipAddress && !port.shutdown) {
          cmds.push({
            cmd: `interface ${port.id || port.name}\n ip address ${port.ipAddress} ${port.subnetMask || '255.255.255.0'}\n no shutdown\n exit`,
            desc: isTR ? `${port.id || port.name} IP ve Durum Yapılandırması` : `${port.id || port.name} IP and status config`,
            mode: '(config)#'
          });
        }
        // Trunk portlar
        else if (port.mode === 'trunk' && !port.shutdown) {
          cmds.push({
            cmd: `interface ${port.id || port.name}\n switchport mode trunk\n exit`,
            desc: isTR ? `${port.id || port.name} Trunk Port Modu` : `${port.id || port.name} trunk port config`,
            mode: '(config)#'
          });
        }
        // Access portlar (VLAN 1 harici özel VLAN'a atanmışsa)
        else if (port.mode === 'access' && port.vlan && port.vlan !== 1 && !port.shutdown) {
          cmds.push({
            cmd: `interface ${port.id || port.name}\n switchport mode access\n switchport access vlan ${port.vlan}\n exit`,
            desc: isTR ? `${port.id || port.name} Access VLAN ${port.vlan} Yapılandırması` : `${port.id || port.name} access vlan ${port.vlan}`,
            mode: '(config)#'
          });
        }
      });
    }

    // IP Routing Aktif mi?
    if (rawState.ipRouting) {
      cmds.push({
        cmd: 'ip routing',
        desc: isTR ? 'L3 IP Yönlendirme (Routing) Etkinleştirme' : 'Enable L3 IP Routing',
        mode: '(config)#'
      });
    }

    // DHCP Havuzları
    if (rawState.dhcpPools) {
      Object.entries(rawState.dhcpPools).forEach(([poolName, pool]) => {
        const poolCmdLines = [`ip dhcp pool ${poolName}`];
        if (pool.network && pool.subnetMask) poolCmdLines.push(` network ${pool.network} ${pool.subnetMask}`);
        if (pool.defaultRouter) poolCmdLines.push(` default-router ${pool.defaultRouter}`);
        if (pool.dnsServer) poolCmdLines.push(` dns-server ${pool.dnsServer}`);
        poolCmdLines.push(' exit');

        cmds.push({
          cmd: poolCmdLines.join('\n'),
          desc: isTR ? `DHCP Havuzu (${poolName}) Yapılandırması` : `DHCP Pool (${poolName}) config`,
          mode: '(config)#'
        });
      });
    }
  }

  // 2. PC / IoT Dinamik Ayar Komutları
  if ((type === 'pc' || type === 'iot') && rawDevice) {
    if (rawDevice.ip && rawDevice.ip !== '0.0.0.0') {
      cmds.push({
        cmd: `ipconfig /all`,
        desc: isTR ? `Mevcut IP: ${rawDevice.ip} | GW: ${rawDevice.gateway || '0.0.0.0'}` : `Current IP: ${rawDevice.ip}`
      });
      if (rawDevice.gateway && rawDevice.gateway !== '0.0.0.0') {
        cmds.push({
          cmd: `ping ${rawDevice.gateway}`,
          desc: isTR ? `Varsayılan Ağ Geçidine (${rawDevice.gateway}) Ping Testi` : `Ping default gateway (${rawDevice.gateway})`
        });
      }
    }
  }

  // 3. GENEL / ÖNERİLEN SHOW & TROUBLESHOOTING KOMUTLARI
  switch (type) {
    case 'router':
      cmds.push(
        { cmd: 'show ip interface brief', desc: isTR ? 'Arayüz ve IP özeti' : 'IP interface summary', mode: '#' },
        { cmd: 'show ip route', desc: isTR ? 'Yönlendirme tablosu' : 'Routing table', mode: '#' },
        { cmd: 'show running-config', desc: isTR ? 'Çalışan yapılandırma' : 'Running configuration', mode: '#' },
        { cmd: 'show ip protocols', desc: isTR ? 'Aktif yönlendirme protokolleri' : 'Active routing protocols', mode: '#' }
      );
      break;
    case 'switchL3':
      cmds.push(
        { cmd: 'show ip interface brief', desc: isTR ? 'L3 / SVI arayüz özetleri' : 'L3 / SVI interfaces brief', mode: '#' },
        { cmd: 'show vlan brief', desc: isTR ? 'Tanımlı VLAN listesi' : 'Defined VLANs', mode: '#' },
        { cmd: 'show ip route', desc: isTR ? 'L3 Yönlendirme tablosu' : 'L3 Routing table', mode: '#' },
        { cmd: 'show interfaces trunk', desc: isTR ? 'Trunk port durumları' : 'Trunk port status', mode: '#' },
        { cmd: 'show mac address-table', desc: isTR ? 'MAC adres tablosu' : 'MAC address table', mode: '#' }
      );
      break;
    case 'switchL2':
      cmds.push(
        { cmd: 'show vlan brief', desc: isTR ? 'VLAN listesi' : 'VLAN list', mode: '#' },
        { cmd: 'show interfaces trunk', desc: isTR ? 'Trunk portlar ve izinli VLANlar' : 'Trunk ports and allowed VLANs', mode: '#' },
        { cmd: 'show mac address-table', desc: isTR ? 'Öğrenilen MAC adresleri' : 'Learned MAC addresses', mode: '#' },
        { cmd: 'show spanning-tree', desc: isTR ? 'STP root ve port durumları' : 'STP root and port status', mode: '#' },
        { cmd: 'show port-security', desc: isTR ? 'Port güvenlik durumu' : 'Port security status', mode: '#' }
      );
      break;
    case 'firewall':
      cmds.push(
        { cmd: 'show nameif', desc: isTR ? 'Arayüz adları ve güvenlik seviyeleri' : 'Interface names & security levels', mode: '#' },
        { cmd: 'show ip access-group', desc: isTR ? 'Uygulanan erişim kuralları' : 'Applied access groups', mode: '#' },
        { cmd: 'show access-lists', desc: isTR ? 'Tanımlı ACL kuralları' : 'Configured ACL rules', mode: '#' },
        { cmd: 'show running-config', desc: isTR ? 'Güvenlik duvarı yapılandırması' : 'Firewall running config', mode: '#' }
      );
      break;
    case 'wlc':
      cmds.push(
        { cmd: 'show wlan summary', desc: isTR ? 'WLAN listesi ve SSID özeti' : 'WLAN summary & SSIDs', mode: '#' },
        { cmd: 'show ap summary', desc: isTR ? 'Bağlı Access Pointler' : 'Joined Access Points', mode: '#' },
        { cmd: 'show ap join statistics', desc: isTR ? 'AP bağlantı istatistikleri' : 'AP join stats', mode: '#' }
      );
      break;
    case 'pc':
    case 'iot':
    default:
      if (cmds.length === 0) {
        cmds.push(
          { cmd: 'ipconfig /all', desc: isTR ? 'Ayrıntılı IP/MAC/GW yapılandırması' : 'Detailed IP/MAC/GW config' },
          { cmd: 'ping <hedef-ip>', desc: isTR ? 'Ağ erişilebilirlik testi (ICMP)' : 'Network connectivity test' },
          { cmd: 'tracert <hedef-ip>', desc: isTR ? 'Paket rota izleme' : 'Trace route to target' },
          { cmd: 'nslookup <alan-adı>', desc: isTR ? 'DNS çözümleme sorgusu' : 'DNS lookup query' },
          { cmd: 'netstat', desc: isTR ? 'Aktif ağ bağlantıları' : 'Active network connections' },
          { cmd: 'arp -a', desc: isTR ? 'ARP önbellek tablosu' : 'ARP cache table' }
        );
      }
      break;
  }

  return cmds;
}

// ─── RefreshDeviceListToast ───────────────────────────────────────────────────

function RefreshDeviceListToast({
  devices,
  language,
}: {
  devices: RefreshDeviceSummary[];
  language: string;
}) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(devices[0]?.id ?? null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [commandIndex, setCommandIndex] = useState(0);
  const [openSection, setOpenSection] = useState<'details' | 'cli' | 'services'>('details');

  const selected = devices.find((device) => device.id === selectedId) || null;
  const isTR = language === 'tr';
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!devices.length) {
      setTimeout(() => setSelectedId(null), 0);
      return;
    }
    if (!selectedId || !devices.some((device) => device.id === selectedId)) {
      setTimeout(() => setSelectedId(devices[0].id), 0);
    }
  }, [devices, selectedId]);

  useEffect(() => {
    setCommandIndex(0);
  }, [selectedId]);

  const copyToClipboard = (text: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  if (devices.length === 0) {
    return <div className="text-xs opacity-60 p-2 text-center">{isTR ? 'Listelenecek cihaz yok.' : 'No devices to list.'}</div>;
  }

  const isPcOrIot = selected?.type === 'pc' || selected?.type === 'iot';
  const rawDev = selected?.rawDevice;
  const rawState = selected?.rawState;
  const recommendedCmds = selected ? getRecommendedCliCommands(selected.type, isTR, rawState, rawDev) : [];
  const activeCommand = recommendedCmds[commandIndex];

  // PC Active Services Data
  const servicesList: Array<{ name: string; info: string; active: boolean }> = [];
  if (isPcOrIot && rawDev) {
    if (rawDev.services?.http?.enabled) {
      servicesList.push({ name: 'HTTP Web Server', info: rawDev.services.http.mode === 'iot' ? (isTR ? 'IoT Web Kontrol Paneli' : 'IoT Web Panel') : (isTR ? 'Aktif Web Sayfası' : 'Active Web Page'), active: true });
    }
    if (rawDev.services?.dns?.enabled) {
      const count = rawDev.services.dns.records?.length || 0;
      servicesList.push({ name: 'DNS Server', info: `${count} ${isTR ? 'A/CNAME kaydı' : 'record(s)'}`, active: true });
    }
    if (rawDev.services?.dhcp?.enabled) {
      const pools = rawDev.services.dhcp.pools?.length || 0;
      servicesList.push({ name: 'DHCP Server', info: `${pools} ${isTR ? 'IP havuzu' : 'IP pool(s)'}`, active: true });
    }
    if (rawDev.services?.ftp?.enabled) {
      const files = rawDev.services.ftp.files?.length || 0;
      servicesList.push({ name: 'FTP Server', info: `${files} ${isTR ? 'dosya' : 'file(s)'} (${rawDev.services.ftp.username || 'admin'})`, active: true });
    }
    if (rawDev.services?.mail?.enabled) {
      servicesList.push({ name: 'Mail Server', info: rawDev.services.mail.domain || 'net.local', active: true });
    }
    if (rawDev.services?.ntp?.enabled) {
      servicesList.push({ name: 'NTP Server', info: rawDev.services.ntp.server || (isTR ? 'Yerel Saat Sunucusu' : 'Local Clock'), active: true });
    }
    if (rawDev.wifi?.enabled) {
      servicesList.push({
        name: rawDev.wifi.mode === 'ap' ? 'WiFi AP' : 'WiFi Client',
        info: `SSID: ${rawDev.wifi.ssid || '-'} (${rawDev.wifi.channel || '2.4GHz'}) [${rawDev.wifi.security || 'open'}]`,
        active: true
      });
    }
  }

  // Switch / Router runtime settings
  const switchRouterSummary = (() => {
    if (!selected || isPcOrIot || !rawState) return null;
    const ports = Object.values(rawState.ports || {});
    const upPorts = ports.filter(p => !p.shutdown && p.status === 'connected').length;
    const totalPorts = ports.length;
    const vlanCount = rawState.vlans ? Object.keys(rawState.vlans).length : 1;
    const dhcpPools = rawState.dhcpPools ? Object.keys(rawState.dhcpPools).length : 0;
    const isL3Routing = !!rawState.ipRouting;
    const activeIps = ports
      .filter(p => !!p.ipAddress && !p.shutdown)
      .map(p => `${p.id}: ${p.ipAddress}${p.subnetMask ? `/${p.subnetMask}` : ''}`);

    return {
      upPorts,
      totalPorts,
      vlanCount,
      dhcpPools,
      isL3Routing,
      activeIps
    };
  })();

  return (
    <div className="space-y-2.5">
      {/* Device Badges Selector */}
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
        {devices.map((device) => {
          const isSelected = selectedId === device.id;
          return (
            <button
              key={device.id}
              type="button"
              onClick={() => setSelectedId(device.id)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all border shrink-0 ${isSelected
                ? 'bg-primary-600 border-primary-700 text-white shadow-sm scale-105 z-10'
                : isDark
                  ? 'bg-secondary-800 border-secondary-700 text-secondary-400 hover:bg-secondary-700 hover:text-secondary-200'
                  : 'bg-secondary-100 border-secondary-200 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900'
                }`}
            >
              {device.name}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-2">
          {/* Main Info Card */}
          <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-900/40">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-100/70 dark:bg-secondary-800/70">
              <div className="flex items-center gap-1.5">
                {isPcOrIot ? (
                  <Monitor className="w-3.5 h-3.5 text-primary-500" />
                ) : selected.type === 'router' ? (
                  <Network className="w-3.5 h-3.5 text-emerald-500" />
                ) : selected.type === 'firewall' ? (
                  <Shield className="w-3.5 h-3.5 text-rose-500" />
                ) : selected.type === 'wlc' ? (
                  <Radio className="w-3.5 h-3.5 text-indigo-500" />
                ) : (
                  <Server className="w-3.5 h-3.5 text-purple-500" />
                )}
                <span className="font-bold text-xs">{selected.name}</span>
                <span className="text-[10px] px-1 py-0.2 rounded font-semibold bg-primary-500/10 text-primary-500 border border-primary-500/20">
                  {REFRESH_DEVICE_TYPE_LABELS[selected.type]}
                </span>
              </div>
              {rawDev?.ipConfigMode && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rawDev.ipConfigMode === 'dhcp' ? 'bg-success-500/15 text-success-500' : 'bg-secondary-500/15 text-secondary-400'}`}>
                  {rawDev.ipConfigMode === 'dhcp' ? 'DHCP' : (isTR ? 'Statik IP' : 'Static IP')}
                </span>
              )}
            </div>

            <table className="w-full text-[11px]">
              <tbody>
                {([
                  ['IP', selected.ip, true],
                  ['Alt Ağ / Mask', rawDev?.subnet || '-', true],
                  ['MAC', selected.mac ? normalizeMAC(selected.mac) : '-', true],
                  ['GW', selected.gateway, true],
                  ['DNS', rawDev?.dns || '-', true],
                  ['IPv6', selected.ipv6, true],
                  [isTR ? 'Açık Hizmetler' : 'Open Services', selected.services, false],
                ] as Array<[string, string, boolean]>).map(([label, value, copyable]) => {
                  if (value === '-' && (label === 'Alt Ağ / Mask' || label === 'DNS')) return null;
                  return (
                    <tr key={label} className="border-t first:border-t-0 border-secondary-200/80 dark:border-secondary-700/80">
                      <td className="w-24 bg-secondary-100/50 px-2 py-1 font-semibold dark:bg-secondary-800/40 text-secondary-600 dark:text-secondary-400">{label}</td>
                      <TooltipWrapper title={copyable && value !== '-' ? t.copy : undefined}>
                        <td
                          className={`px-2 py-1 font-mono ${copyable && value !== '-' ? 'cursor-pointer hover:bg-primary-500/10 hover:text-primary-500 dark:hover:bg-primary-500/20 rounded transition-colors' : ''}`}
                          onClick={copyable && value !== '-' ? () => copyToClipboard(value) : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <span>{value}</span>
                            {copyable && value !== '-' && (
                              <Copy className="w-2.5 h-2.5 opacity-30 hover:opacity-100" />
                            )}
                          </div>
                        </td>
                      </TooltipWrapper>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PC Aktif Servis & Ayarlar Detayı */}
          {isPcOrIot && (
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'services' ? 'details' : 'services')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-secondary-100/70 dark:bg-secondary-800/70 hover:bg-secondary-200/70 dark:hover:bg-secondary-700/70 transition-colors font-bold text-xs select-none"
              >
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                  <Settings className="w-3.5 h-3.5" />
                  <span>{isTR ? 'PC Aktif Servis ve Ayarları' : 'PC Active Services & Settings'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-secondary-500 font-normal">
                    {servicesList.length} {isTR ? 'aktif servis' : 'active'}
                  </span>
                  {openSection === 'services' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              {openSection === 'services' && (
                <div className="p-2 space-y-1.5 bg-white/50 dark:bg-secondary-900/30">
                  {servicesList.length > 0 ? (
                    <div className="space-y-1">
                      {servicesList.map((srv, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] p-1 rounded bg-secondary-100/60 dark:bg-secondary-800/60">
                          <span className="font-semibold text-primary-600 dark:text-primary-300">{srv.name}</span>
                          <span className="font-mono text-secondary-600 dark:text-secondary-400 truncate max-w-[170px]">{srv.info}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] opacity-60 italic text-center py-1">
                      {isTR ? 'Yapılandırılmış ek servis yok.' : 'No additional services configured.'}
                    </div>
                  )}

                  {/* PC Settings Quick Summary */}
                  <div className="pt-1.5 border-t border-secondary-200 dark:border-secondary-700/80 grid grid-cols-2 gap-1 text-[10px]">
                    <div className="p-1 rounded bg-secondary-100/40 dark:bg-secondary-800/40">
                      <span className="opacity-50 block">{isTR ? 'IP Yapılandırması' : 'IP Config'}</span>
                      <span className="font-bold text-success-500">{rawDev?.ipConfigMode === 'dhcp' ? 'DHCP (Auto)' : 'Static (Manual)'}</span>
                    </div>
                    <div className="p-1 rounded bg-secondary-100/40 dark:bg-secondary-800/40">
                      <span className="opacity-50 block">{isTR ? 'Kablosuz (WiFi)' : 'Wireless'}</span>
                      <span className="font-bold text-purple-500">{rawDev?.wifi?.enabled ? `${rawDev.wifi.ssid || 'Active'}` : (isTR ? 'Kapalı' : 'Disabled')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Switch / Router Durum & CLI Komut Özeti */}
          {!isPcOrIot && (
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'cli' ? 'details' : 'cli')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-secondary-100/70 dark:bg-secondary-800/70 hover:bg-secondary-200/70 dark:hover:bg-secondary-700/70 transition-colors font-bold text-xs select-none"
              >
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isTR ? 'CLI Komut ve Durum Özeti' : 'CLI Commands & Status Summary'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-secondary-500 font-normal">
                    {recommendedCmds.length} {isTR ? 'komut' : 'commands'}
                  </span>
                  {openSection === 'cli' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              {openSection === 'cli' && (
                <div className="p-2 space-y-2 bg-white/50 dark:bg-secondary-900/30 max-h-64 overflow-y-auto custom-scrollbar">
                  {/* Switch/Router Quick Stats */}
                  {switchRouterSummary && (
                    <div className="grid grid-cols-3 gap-1 text-[10px] pb-1 border-b border-secondary-200 dark:border-secondary-700/80">
                      <div className="p-1 rounded bg-secondary-100/40 dark:bg-secondary-800/40 text-center">
                        <span className="opacity-50 block">{isTR ? 'Portlar' : 'Ports'}</span>
                        <span className="font-bold text-success-500">{switchRouterSummary.upPorts}/{switchRouterSummary.totalPorts} UP</span>
                      </div>
                      <div className="p-1 rounded bg-secondary-100/40 dark:bg-secondary-800/40 text-center">
                        <span className="opacity-50 block">{isTR ? 'VLAN Sayısı' : 'VLANs'}</span>
                        <span className="font-bold text-purple-500">{switchRouterSummary.vlanCount} VLAN</span>
                      </div>
                      <div className="p-1 rounded bg-secondary-100/40 dark:bg-secondary-800/40 text-center">
                        <span className="opacity-50 block">{isTR ? 'Yönlendirme' : 'Routing'}</span>
                        <span className={`font-bold ${switchRouterSummary.isL3Routing ? 'text-emerald-500' : 'text-secondary-400'}`}>
                          {switchRouterSummary.isL3Routing ? (isTR ? 'Aktif' : 'Active') : (isTR ? 'Pasif' : 'Disabled')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Active Interface IPs */}
                  {switchRouterSummary?.activeIps && switchRouterSummary.activeIps.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold opacity-60 uppercase">{isTR ? 'Aktif Arayüz IP\'leri:' : 'Active Interface IPs:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {switchRouterSummary.activeIps.map((ipStr, i) => (
                          <span
                            key={i}
                            onClick={() => copyToClipboard(ipStr.split(': ')[1] || ipStr)}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                            title={isTR ? 'IP adresini kopyala' : 'Copy IP address'}
                          >
                            {ipStr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended CLI Commands */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold opacity-60 uppercase">{isTR ? 'Önerilen CLI Komutları:' : 'Recommended CLI Commands:'}</span>
                    <div className="space-y-1">
                      {activeCommand && (() => {
                        const isCopied = copiedCmd === activeCommand.cmd;
                        return (
                          <div
                            onClick={() => copyToClipboard(activeCommand.cmd)}
                            className="flex items-center justify-between p-1.5 rounded bg-secondary-100/70 dark:bg-secondary-800/70 hover:bg-secondary-200 dark:hover:bg-secondary-700/90 cursor-pointer transition-all border border-transparent hover:border-primary-500/30 group"
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-mono font-bold text-[11px] text-primary-600 dark:text-primary-300 whitespace-pre-wrap">
                                {activeCommand.mode ? `${activeCommand.mode} ` : ''}{activeCommand.cmd}
                              </span>
                              <span className="text-[9px] text-secondary-500 dark:text-secondary-400 mt-0.5">
                                {activeCommand.desc}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 p-1 rounded hover:bg-primary-500/20 text-secondary-400 group-hover:text-primary-500 transition-colors"
                              title={t.copy}
                            >
                              {isCopied ? <Check className="w-3 h-3 text-success-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                    {recommendedCmds.length > 1 && (
                      <div className="flex items-center justify-center gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setCommandIndex(index => Math.max(0, index - 1))}
                          disabled={commandIndex === 0}
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={isTR ? 'Önceki komut' : 'Previous command'}
                        >
                          <ChevronLeft className="w-3 h-3" />
                          {isTR ? 'Önceki' : 'Previous'}
                        </button>
                        <span className="min-w-[42px] text-center text-[10px] font-semibold text-secondary-500">
                          {commandIndex + 1} / {recommendedCmds.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCommandIndex(index => Math.min(recommendedCmds.length - 1, index + 1))}
                          disabled={commandIndex === recommendedCmds.length - 1}
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={isTR ? 'Sonraki komut' : 'Next command'}
                        >
                          {isTR ? 'Sonraki' : 'Next'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PC CMD Commands Summary for PCs */}
          {isPcOrIot && (
            <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'cli' ? 'details' : 'cli')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-secondary-100/70 dark:bg-secondary-800/70 hover:bg-secondary-200/70 dark:hover:bg-secondary-700/70 transition-colors font-bold text-xs select-none"
              >
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isTR ? 'PC Komut Satırı (CMD) Komutları' : 'PC Command Prompt Commands'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-secondary-500 font-normal">
                    {recommendedCmds.length} {isTR ? 'komut' : 'commands'}
                  </span>
                  {openSection === 'cli' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              {openSection === 'cli' && (
                <div className="p-2 space-y-1 bg-white/50 dark:bg-secondary-900/30 max-h-64 overflow-y-auto custom-scrollbar">
                  {activeCommand && (() => {
                    const isCopied = copiedCmd === activeCommand.cmd;
                    return (
                      <div
                        onClick={() => copyToClipboard(activeCommand.cmd)}
                        className="flex items-center justify-between p-1.5 rounded bg-secondary-100/70 dark:bg-secondary-800/70 hover:bg-secondary-200 dark:hover:bg-secondary-700/90 cursor-pointer transition-all border border-transparent hover:border-primary-500/30 group"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-mono font-bold text-[11px] text-primary-600 dark:text-primary-300 truncate">
                            C:\&gt; {activeCommand.cmd}
                          </span>
                          <span className="text-[9px] text-secondary-500 dark:text-secondary-400 truncate">
                            {activeCommand.desc}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 p-1 rounded hover:bg-primary-500/20 text-secondary-400 group-hover:text-primary-500 transition-colors"
                          title={t.copy}
                        >
                          {isCopied ? <Check className="w-3 h-3 text-success-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })()}
                  {recommendedCmds.length > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setCommandIndex(index => Math.max(0, index - 1))}
                        disabled={commandIndex === 0}
                        className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={isTR ? 'Önceki komut' : 'Previous command'}
                      >
                        <ChevronLeft className="w-3 h-3" />
                        {isTR ? 'Önceki' : 'Previous'}
                      </button>
                      <span className="min-w-[42px] text-center text-[10px] font-semibold text-secondary-500">
                        {commandIndex + 1} / {recommendedCmds.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCommandIndex(index => Math.min(recommendedCmds.length - 1, index + 1))}
                        disabled={commandIndex === recommendedCmds.length - 1}
                        className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={isTR ? 'Sonraki komut' : 'Next command'}
                      >
                        {isTR ? 'Sonraki' : 'Next'}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}

// ─── LiveDeviceList ───────────────────────────────────────────────────────────

export function LiveDeviceList({
  devices,
  deviceStates,
  language,
}: {
  devices: CanvasDevice[];
  deviceStates: Map<string, SwitchState>;
  language: string;
}) {
  const { t } = useLanguage();

  const hasValidIp = (ip: string | undefined) => !!ip && ip !== '0.0.0.0' && ip !== '169.254.0.0';
  const firstValue = (...values: Array<string | undefined | null>) =>
    values.find((value) => !!value && value !== '0.0.0.0') || '-';
  const normalizeWifiMode = (mode: string | undefined): 'ap' | 'client' | 'disabled' => {
    if (!mode) return 'disabled';
    const normalized = mode.toLowerCase().replace(/^wifi-/, '');
    if (normalized === 'client' || normalized === 'sta') return 'client';
    if (normalized === 'ap') return 'ap';
    return 'disabled';
  };
  const getEffectiveWifi = (device: CanvasDevice): CanvasDevice['wifi'] => {
    const state = deviceStates?.get(device.id);
    const wlan = state?.ports?.['wlan0'];
    const runtimeWifi = wlan?.wifi;
    if (!runtimeWifi) return device.wifi;
    const normalizedMode = normalizeWifiMode(runtimeWifi.mode);
    const enabled = !wlan.shutdown && normalizedMode !== 'disabled';
    const fallbackMode: 'ap' | 'client' = device.type === 'pc' ? 'client' : 'ap';
    const resolvedMode: 'ap' | 'client' = normalizedMode === 'disabled'
      ? (device.wifi?.mode || fallbackMode)
      : (normalizedMode === 'client' ? 'client' : 'ap');
    return {
      ...device.wifi,
      enabled,
      ssid: runtimeWifi.ssid || device.wifi?.ssid || '',
      security: runtimeWifi.security || device.wifi?.security || 'open',
      password: runtimeWifi.password || device.wifi?.password,
      channel: runtimeWifi.channel || device.wifi?.channel || '2.4GHz',
      mode: resolvedMode,
    };
  };
  const getOpenServices = (device: CanvasDevice, state?: SwitchState) => {
    const services = new Set<string>();
    if (device.services?.dhcp?.enabled || state?.services?.dhcp?.enabled) services.add('DHCP');
    if (device.services?.dns?.enabled || state?.services?.dns?.enabled) services.add('DNS');
    if (device.services?.http?.enabled || state?.services?.http?.enabled) services.add('HTTP');
    const effectiveWifi = getEffectiveWifi(device);
    if (effectiveWifi?.enabled) services.add(effectiveWifi.mode === 'ap' ? 'WiFi AP' : 'WiFi Client');
    if (state?.security?.vtyLines?.transportInput?.some((input) => input === 'ssh' || input === 'all')) services.add('SSH');
    if (state?.security?.vtyLines?.transportInput?.some((input) => input === 'telnet' || input === 'all')) services.add('Telnet');
    return Array.from(services).join(', ') || t.none;
  };

  const liveDevices = useMemo(() => {
    if (!devices || !deviceStates) return [];
    return devices.map((device) => {
      const state = deviceStates.get(device.id);
      const statePorts = Object.values(state?.ports || {});
      const topologyPorts = device.ports || [];
      const portIp = statePorts.find((port) => hasValidIp(port.ipAddress))?.ipAddress
        || topologyPorts.find((port) => hasValidIp(port.ipAddress))?.ipAddress;
      const portMac = statePorts.find((port) => port.macAddress)?.macAddress
        || topologyPorts.find((port) => port.macAddress)?.macAddress;
      const portIpv6 = statePorts.find((port) => port.ipv6Address)?.ipv6Address;
      return {
        id: device.id,
        name: device.name || device.id,
        type: device.type,
        ip: firstValue(device.ip, portIp),
        mac: firstValue(device.macAddress, state?.macAddress, portMac),
        gateway: device.gateway || state?.defaultGateway || '0.0.0.0',
        ipv6: device.ipv6 || portIpv6 || '::',
        services: getOpenServices(device, state),
        rawDevice: device,
        rawState: state,
      } as RefreshDeviceSummary;
    }).sort((a, b) => {
      const typeDiff = REFRESH_DEVICE_TYPE_ORDER.indexOf(a.type) - REFRESH_DEVICE_TYPE_ORDER.indexOf(b.type);
      if (typeDiff !== 0) return typeDiff;
      return a.name.localeCompare(b.name, language === 'tr' ? 'tr' : 'en');
    });
  }, [devices, deviceStates, language]);

  return <RefreshDeviceListToast devices={liveDevices} language={language} />;
}

