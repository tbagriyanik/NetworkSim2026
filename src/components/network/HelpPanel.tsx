'use client';

import { useState, useMemo, useEffect } from 'react';
import { Translations } from '@/contexts/LanguageContext';
import { HelpCircle, X, Terminal, Globe, Wifi, Settings, Eye, Server, Router, ChevronDown, Search, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-breakpoint';

interface HelpPanelProps {
  t: Translations;
  theme: string;
  initialOpen?: boolean;
  onClose?: () => void;
}

export function HelpPanel({ t, theme, initialOpen = false, onClose }: HelpPanelProps) {
  const [open, setOpen] = useState(initialOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    system: true,
    privileged: false,
    global: false,
    interface: false,
    wireless: false,
    line: false,
    show: false,
  });

  const isDark = theme === 'dark';
  const isMobile = useIsMobile();
  const lang = (t as any).language || 'en';
  const isTR = lang === 'tr';

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Define categories with useMemo to prevent recreating on each render
  const categories = useMemo(() => [
    {
      id: 'system',
      icon: Terminal,
      title: isTR ? 'Sistem & Oturum' : 'System & Session',
      cmds: [
        ['enable', isTR ? 'Ayricalikli moda gec' : 'Enter privileged mode'],
        ['disable', isTR ? 'Kullanici moduna don' : 'Return to user mode'],
        ['configure terminal', isTR ? 'Konfigurasyon modu' : 'Enter config mode'],
        ['exit', isTR ? 'Moddan cik' : 'Exit current mode'],
        ['end', isTR ? 'Ayricilikli moda don' : 'Return to privileged'],
        ['help', isTR ? 'Yardim sistemini goster' : 'Display help system'],
      ]
    },
    {
      id: 'privileged',
      icon: Server,
      title: isTR ? 'Privileged EXEC' : 'Privileged EXEC',
      cmds: [
        ['ping <host> [s] [c]', isTR ? 'Baglanti testi (ICMP)' : 'Ping host (ICMP)'],
        ['traceroute <host>', isTR ? 'Rota izleme (Unix)' : 'Trace route (Unix)'],
        ['tracert <host>', isTR ? 'Rota izleme (Windows)' : 'Trace route (Windows)'],
        ['telnet <host> [port]', isTR ? 'Telnet baglantisi' : 'Telnet connection'],
        ['ssh [-l user] <host>', isTR ? 'SSH baglantisi' : 'SSH connection'],
        ['write memory', isTR ? 'Yapilandirmayi kaydet' : 'Save configuration'],
        ['copy run start', isTR ? 'Yapilandirmayi kaydet' : 'Save configuration'],
        ['erase startup-config', isTR ? 'Startup config sil' : 'Erase startup config'],
        ['erase nvram', isTR ? 'NVRAM dosya sistemini sil' : 'Erase NVRAM'],
        ['reload', isTR ? 'Cihazi yeniden yukle' : 'Reload device'],
        ['ip route <n> <mask> <h>', isTR ? 'Statik rota ekle' : 'Add static route'],
        ['no ip route <n> <mask> <h>', isTR ? 'Statik rotayi sil' : 'Remove static route'],
        ['debug <type>', isTR ? 'Hata ayiklamayi ac' : 'Enable debugging'],
        ['undebug all', isTR ? 'Tum hatalari kapat' : 'Disable all debugging'],
        ['terminal length <0-512>', isTR ? 'Terminal satiri' : 'Set terminal length'],
        ['clear arp-cache', isTR ? 'ARP onbellegini sil' : 'Clear ARP cache'],
        ['clear mac address-table', isTR ? 'MAC tablosunu sil' : 'Clear MAC table'],
        ['clear counters', isTR ? 'Sayaclari sifirla' : 'Clear counters'],
        ['do <command>', isTR ? 'Privileged komut calistir' : 'Execute privileged cmd'],
      ]
    },
    {
      id: 'global',
      icon: Globe,
      title: isTR ? 'Global Konfigurasyon' : 'Global Config',
      cmds: [
        ['hostname <name>', isTR ? 'Cihaz adi' : 'Set hostname'],
        ['vlan <id>', isTR ? 'VLAN olustur' : 'Create VLAN'],
        ['no vlan <id>', isTR ? 'VLAN sil' : 'Delete VLAN'],
        ['name <name>', isTR ? 'VLAN adi (vlan modunda)' : 'Set VLAN name'],
        ['interface <name>', isTR ? 'Arayuz sec' : 'Select interface'],
        ['interface range <r>', isTR ? 'Arayuz araligi' : 'Interface range'],
        ['no interface vlan <id>', isTR ? 'VLAN arayuzunu sil' : 'Delete VLAN interface'],
        ['ip routing', isTR ? 'IP yonlendirme (L3)' : 'Enable IP routing (L3)'],
        ['no ip routing', isTR ? 'IP yonlendirmeyi kapat' : 'Disable IP routing'],
        ['ip default-gateway <ip>', isTR ? 'Varsayilan ag gecidi' : 'Set default gateway'],
        ['ip domain-name <name>', isTR ? 'Alan adi' : 'Set domain name'],
        ['no ip domain lookup', isTR ? 'DNS aramayi kapat' : 'Disable DNS lookup'],
        ['ip http server', isTR ? 'HTTP sunucusunu ac' : 'Enable HTTP server'],
        ['no ip http server', isTR ? 'HTTP sunucusunu kapat' : 'Disable HTTP server'],
        ['ip ssh version {1|2}', isTR ? 'SSH versiyonu' : 'Set SSH version'],
        ['ip dhcp snooping', isTR ? 'DHCP snooping ac' : 'Enable DHCP snooping'],
        ['service password-enc', isTR ? 'Sifreleri sifrele' : 'Encrypt passwords'],
        ['enable secret <pass>', isTR ? 'Enable secret' : 'Set enable secret'],
        ['enable password <pass>', isTR ? 'Enable password' : 'Set enable password'],
        ['banner motd #<msg>#', isTR ? 'MOTD banner' : 'MOTD banner'],
        ['banner login #<msg>#', isTR ? 'Login banner' : 'Login banner'],
        ['no banner {motd|login}', isTR ? 'Banner sil' : 'Remove banner'],
        ['vtp mode {server|client}', isTR ? 'VTP modu' : 'Set VTP mode'],
        ['vtp domain <name>', isTR ? 'VTP domain' : 'Set VTP domain'],
        ['spanning-tree mode {m}', isTR ? 'STP modu' : 'Set STP mode'],
        ['no spanning-tree', isTR ? 'STP\'yi kapat' : 'Disable spanning-tree'],
        ['username <n> pass <p>', isTR ? 'Kullanici olustur' : 'Create user'],
        ['no username <name>', isTR ? 'Kullaniciyi sil' : 'Remove user'],
        ['cdp run', isTR ? 'CDP\'yi ac' : 'Enable CDP globally'],
        ['mls qos', isTR ? 'QoS\'u ac' : 'Enable MLS QoS'],
        ['ip dhcp pool <name>', isTR ? 'DHCP havuzu' : 'Create DHCP pool'],
        ['no ip dhcp pool <name>', isTR ? 'DHCP havuzunu sil' : 'Remove DHCP pool'],
        ['ip dhcp excluded <ip>', isTR ? 'DHCP haric tut' : 'Exclude DHCP addr'],
        ['ntp server <ip>', isTR ? 'NTP sunucusu' : 'Set NTP server'],
        ['clock timezone <n> <o>', isTR ? 'Zaman dilimi' : 'Set timezone'],
        ['ip name-server <ip>', isTR ? 'DNS sunucusu' : 'Set DNS server'],
        ['system mtu <size>', isTR ? 'Sistem MTU' : 'Set system MTU'],
        ['errdisable recovery', isTR ? 'Hata kurtarma' : 'Errdisable recovery'],
        ['spanning-tree portfast default', isTR ? 'Global PortFast' : 'Global PortFast'],
      ]
    },
    {
      id: 'interface',
      icon: Settings,
      title: isTR ? 'Arayuz Konfigurasyonu' : 'Interface Config',
      cmds: [
        ['shutdown', isTR ? 'Arayuzu kapat' : 'Disable interface'],
        ['no shutdown', isTR ? 'Arayuzu ac' : 'Enable interface'],
        ['speed {10|100|1000|auto}', isTR ? 'Hiz ayarla' : 'Set speed'],
        ['duplex {half|full|auto}', isTR ? 'Duplex ayarla' : 'Set duplex'],
        ['description <text>', isTR ? 'Arayuz aciklamasi' : 'Set description'],
        ['no description', isTR ? 'Aciklamayi sil' : 'Clear description'],
        ['switchport mode access', isTR ? 'Erisim modu' : 'Access mode'],
        ['switchport mode trunk', isTR ? 'Trunk modu' : 'Trunk mode'],
        ['switchport mode dynamic {m}', isTR ? 'DTP modu' : 'Set DTP mode'],
        ['no switchport mode', isTR ? 'Modu sifirla' : 'Reset switchport mode'],
        ['switchport access vlan <id>', isTR ? 'VLAN ata' : 'Assign VLAN'],
        ['no switchport access vlan', isTR ? 'VLAN atamasini sil' : 'Remove VLAN assign'],
        ['switchport trunk native <id>', isTR ? 'Native VLAN' : 'Set native VLAN'],
        ['switchport trunk allowed <l>', isTR ? 'Izinli VLANlar' : 'Set allowed VLANs'],
        ['switchport nonegotiate', isTR ? 'DTP\'yi kapat' : 'Disable DTP'],
        ['switchport voice vlan <id>', isTR ? 'Ses VLAN\'i' : 'Set voice VLAN'],
        ['switchport port-security', isTR ? 'Port guvenligi' : 'Port security'],
        ['switchport port-security max <n>', isTR ? 'Maksimum MAC' : 'Set max MACs'],
        ['switchport port-security violation {a}', isTR ? 'Ihlal aksiyonu' : 'Violation action'],
        ['switchport port-security sticky', isTR ? 'Sticky MAC' : 'Enable sticky MAC'],
        ['no switchport port-security', isTR ? 'Guvenligi kapat' : 'Disable port security'],
        ['no switchport', isTR ? 'L3 portuna donustur' : 'Convert to L3 port'],
        ['spanning-tree portfast', isTR ? 'PortFast ac' : 'Enable PortFast'],
        ['spanning-tree bpduguard {e|d}', isTR ? 'BPDU Guard' : 'BPDU Guard'],
        ['spanning-tree cost <cost>', isTR ? 'STP maliyeti' : 'Set STP cost'],
        ['spanning-tree priority <p>', isTR ? 'STP onceligi' : 'Set STP priority'],
        ['ip address <ip> <mask>', isTR ? 'IP adresi ata' : 'Set IP address'],
        ['no ip address', isTR ? 'IP adresini sil' : 'Remove IP address'],
        ['ip helper-address <ip>', isTR ? 'DHCP relay' : 'Set DHCP relay'],
        ['no ip helper-address', isTR ? 'DHCP relay sil' : 'Remove DHCP relay'],
        ['cdp enable', isTR ? 'CDP\'yi ac (arayuz)' : 'Enable CDP (interface)'],
        ['channel-group <n> mode', isTR ? 'EtherChannel' : 'EtherChannel'],
        ['no channel-group', isTR ? 'EtherChannel sil' : 'Remove from channel'],
        ['access-list <acl>', isTR ? 'Erisim listesi' : 'Apply access list'],
        ['monitor session <n>', isTR ? 'SPAN/RSPAN' : 'Configure SPAN/RSPAN'],
      ]
    },
    {
      id: 'wireless',
      icon: Wifi,
      title: isTR ? 'Kablosuz (WiFi)' : 'Wireless (WiFi)',
      cmds: [
        ['ssid <name>', isTR ? 'Ag adi (SSID)' : 'Set network name'],
        ['encryption {open|wpa2|wpa3}', isTR ? 'Guvenlik tipi' : 'Security type'],
        ['wifi-password <pass>', isTR ? 'WiFi sifresi' : 'WiFi password'],
        ['wifi-channel {band}', isTR ? 'WiFi bandi' : 'Set WiFi band'],
        ['wifi-mode {ap|client}', isTR ? 'WiFi modu' : 'WiFi mode'],
      ]
    },
    {
      id: 'line',
      icon: Router,
      title: isTR ? 'Hat Konfigurasyonu' : 'Line Config',
      cmds: [
        ['line console 0', isTR ? 'Konsol hatti' : 'Console line'],
        ['line vty 0 4', isTR ? 'VTY hatlari' : 'VTY lines'],
        ['password <pass>', isTR ? 'Sifre ayarla' : 'Set password'],
        ['no password', isTR ? 'Sifreyi sil' : 'Remove password'],
        ['login', isTR ? 'Giris kontrolu' : 'Enable login'],
        ['no login', isTR ? 'Giris kontrolu kapat' : 'Disable login'],
        ['transport input {p}', isTR ? 'Giris protokolleri' : 'Input protocols'],
        ['no transport input', isTR ? 'Girisleri sifirla' : 'Reset transport input'],
        ['logging synchronous', isTR ? 'Senkron loglama' : 'Sync logging'],
        ['no logging synchronous', isTR ? 'Senkron log kapat' : 'Disable sync logging'],
        ['exec-timeout <m> [s]', isTR ? 'Zaman asimi' : 'Exec timeout'],
        ['no exec-timeout', isTR ? 'Zaman asimi sifirla' : 'Reset exec timeout'],
        ['history size <n>', isTR ? 'Gecmis boyutu' : 'Set history size'],
        ['autocommand <cmd>', isTR ? 'Otomatik komut' : 'Set auto-command'],
        ['privilege level <0-15>', isTR ? 'Yetki seviyesi' : 'Set privilege level'],
      ]
    },
    {
      id: 'router',
      icon: Network,
      title: isTR ? 'Yonlendirme (Routing)' : 'Routing Config',
      cmds: [
        ['router rip', isTR ? 'RIP yonlendirmesi' : 'Enable RIP'],
        ['router ospf [<id>]', isTR ? 'OSPF yonlendirmesi' : 'Enable OSPF'],
        ['no router {rip|ospf}', isTR ? 'Yonlendirmeyi kapat' : 'Disable routing'],
        ['network <ip> [wildcard]', isTR ? 'Ag ekle' : 'Add network'],
        ['network <ip> area <id>', isTR ? 'OSPF agi ekle' : 'Add OSPF network'],
        ['router-id <ip>', isTR ? 'Router ID ayarla' : 'Set router ID'],
        ['passive-interface <int>', isTR ? 'Pasif arayuz' : 'Passive interface'],
        ['default-info originate', isTR ? 'Varsayilan rota' : 'Default route'],
      ]
    },
    {
      id: 'dhcp',
      icon: Server,
      title: isTR ? 'DHCP Havuzu' : 'DHCP Pool Config',
      cmds: [
        ['network <net> <mask>', isTR ? 'Havuz agi' : 'Pool network'],
        ['default-router <ip>', isTR ? 'Varsayilan gecit' : 'Default router'],
        ['dns-server <ip>', isTR ? 'DNS sunucusu' : 'DNS server'],
        ['lease {days|infinite}', isTR ? 'Kira suresi' : 'Lease duration'],
        ['domain-name <name>', isTR ? 'Alan adi' : 'Domain name'],
      ]
    },
    {
      id: 'show',
      icon: Eye,
      title: isTR ? 'Show Komutlari' : 'Show Commands',
      cmds: [
        ['show', isTR ? 'Ozet bilgi' : 'Display summary'],
        ['show running-config', isTR ? 'Calisan yapilandirma' : 'Running config'],
        ['show startup-config', isTR ? 'Baslangic yapilandirmasi' : 'Startup config'],
        ['show version', isTR ? 'Sistem bilgisi' : 'System version'],
        ['show interfaces', isTR ? 'Tum arayuzler' : 'Display all interfaces'],
        ['show interfaces trunk', isTR ? 'Trunk arayuzler' : 'Display trunks'],
        ['show interface <name>', isTR ? 'Arayuz ayrintisi' : 'Interface details'],
        ['show ip interface brief', isTR ? 'Arayuz ozeti' : 'IP interface brief'],
        ['show vlan [brief]', isTR ? 'VLAN listesi' : 'VLAN list'],
        ['show mac address-table', isTR ? 'MAC tablosu' : 'MAC address table'],
        ['show cdp neighbors', isTR ? 'CDP komsulari' : 'CDP neighbors'],
        ['show ip route', isTR ? 'Yonlendirme tablosu' : 'Routing table'],
        ['show clock', isTR ? 'Sistem saati' : 'Display system clock'],
        ['show flash', isTR ? 'Flash icerigi' : 'Display flash'],
        ['show boot', isTR ? 'Boot bilgisi' : 'Display boot info'],
        ['show spanning-tree', isTR ? 'STP durumu' : 'STP status'],
        ['show port-security', isTR ? 'Port guvenligi' : 'Port security status'],
        ['show wireless', isTR ? 'Kablosuz durumu' : 'Display wireless status'],
        ['show ip dhcp snooping', isTR ? 'DHCP snooping' : 'Display DHCP snooping'],
        ['show ip dhcp pool', isTR ? 'DHCP havuzlari' : 'Display DHCP pools'],
        ['show ip dhcp binding', isTR ? 'DHCP atamalari' : 'DHCP bindings'],
        ['show interfaces status', isTR ? 'Arayuz durumu' : 'Display port status'],
        ['show cdp', isTR ? 'CDP bilgisi' : 'Display CDP info'],
        ['show vtp status', isTR ? 'VTP durumu' : 'Display VTP status'],
        ['show etherchannel', isTR ? 'EtherChannel' : 'Display EtherChannel'],
        ['show arp', isTR ? 'ARP tablosu' : 'ARP table'],
        ['show mls qos', isTR ? 'QoS durumu' : 'Display QoS status'],
        ['show access-lists', isTR ? 'Erisim listeleri' : 'Display access lists'],
        ['show history', isTR ? 'Komut gecmisi' : 'Display command history'],
        ['show users', isTR ? 'Kullanicilar' : 'Connected users'],
        ['show environment', isTR ? 'Donanim durumu' : 'Display hardware status'],
        ['show inventory', isTR ? 'Donanim envanteri' : 'Display inventory'],
        ['show errdisable recovery', isTR ? 'Hata kurtarma' : 'Display errdisable'],
        ['show debug', isTR ? 'Debug durumu' : 'Display debug status'],
        ['show processes', isTR ? 'Islemler (CPU)' : 'Display processes'],
        ['show memory', isTR ? 'Bellek kullanimi' : 'Display memory usage'],
        ['show system mtu', isTR ? 'MTU ayarlari' : 'Display MTU settings'],
      ]
    },
  ], [isTR]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    const query = searchQuery.toLowerCase();
    return categories.map(cat => ({
      ...cat,
      cmds: cat.cmds.filter(([cmd, desc]) => 
        cmd.toLowerCase().includes(query) || 
        desc.toLowerCase().includes(query)
      )
    })).filter(cat => cat.cmds.length > 0);
  }, [searchQuery, categories]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpanded: Record<string, boolean> = {};
      filteredCategories.forEach(cat => {
        newExpanded[cat.id] = true;
      });
      setExpanded(prev => ({ ...prev, ...newExpanded }));
    }
  }, [searchQuery, filteredCategories]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed z-50 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center',
          isDark ? 'bg-slate-800 text-slate-200 border border-slate-600' : 'bg-white text-slate-700 border border-slate-300',
          isMobile ? 'bottom-4 right-4 w-10 h-10' : 'bottom-6 right-6 w-12 h-12'
        )}
        title={isTR ? 'Komut Yardimi' : 'Command Help'}
      >
        <HelpCircle className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={cn(
          'w-full max-w-3xl max-h-[85vh] rounded-lg shadow-xl overflow-hidden flex flex-col',
          isDark ? 'bg-slate-950 border border-slate-800' : 'bg-white border border-slate-200'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center justify-between p-4 border-b shrink-0', isDark ? 'border-slate-800' : 'border-slate-200')}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', isDark ? 'bg-emerald-500/20' : 'bg-emerald-100')}>
              <Terminal className={cn('w-5 h-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
            </div>
            <div>
              <h2 className={cn('text-lg font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
                {isTR ? 'CLI Komut Referansi' : 'CLI Command Reference'}
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {isTR ? '120+ komut' : '120+ commands'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            className={cn('p-1 rounded-full transition-colors', isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar - Fixed at top */}
        <div className={cn('p-4 space-y-3 border-b shrink-0', isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200')}>
          <div className="relative">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-slate-500' : 'text-slate-400')} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTR ? 'Komut ara...' : 'Search commands...'}
              autoFocus
              className={cn(
                'w-full pl-9 pr-9 py-2.5 rounded-lg text-sm border outline-none transition-all',
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={cn('absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors', isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {searchQuery.trim() && (
            <div className={cn('text-xs px-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
              {filteredCategories.reduce((acc, cat) => acc + cat.cmds.length, 0)} {isTR ? 'komut bulundu' : 'commands found'}
            </div>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {/* Command Modes */}
          {!searchQuery.trim() && (
            <div className={cn('p-3 rounded-lg text-xs space-y-1', isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200')}>
            <p className={cn('font-semibold mb-2', isDark ? 'text-slate-200' : 'text-slate-700')}>
              {isTR ? 'Komut Modlari:' : 'Command Modes:'}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>User (&gt;)</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Temel komutlar' : 'Basic commands'}</span>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Privileged (#)</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Tum komutlar' : 'All commands'}</span>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Config (config)#</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Global config' : 'Global config'}</span>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Interface (config-if)#</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Arayuz config' : 'Interface config'}</span>
            </div>
          </div>
          )}

          {/* Categories */}
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            const isExp = expanded[cat.id];
            return (
              <div key={cat.id} className={cn('rounded-lg border overflow-hidden', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}>
                <button
                  onClick={() => toggle(cat.id)}
                  className={cn('w-full flex items-center justify-between p-3 text-left transition-colors', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', isDark ? 'text-slate-400' : 'text-slate-500')} />
                    <span className={cn('font-medium text-sm', isDark ? 'text-slate-200' : 'text-slate-700')}>{cat.title}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}>
                      {cat.cmds.length}
                    </span>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', isExp ? 'rotate-180' : '', isDark ? 'text-slate-400' : 'text-slate-500')} />
                </button>

                {isExp && (
                  <div className={cn('border-t', isDark ? 'border-slate-700' : 'border-slate-200')}>
                    <table className="w-full text-xs">
                      <tbody>
                        {cat.cmds.map(([cmd, desc], idx) => (
                          <tr key={idx} className={cn('border-b last:border-b-0', isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50')}>
                            <td className="p-2 w-1/2">
                              <code className={cn('font-mono text-[11px]', isDark ? 'text-emerald-400' : 'text-emerald-600')}>{cmd}</code>
                            </td>
                            <td className={cn('p-2', isDark ? 'text-slate-400' : 'text-slate-600')}>{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer stats - Fixed at bottom */}
        <div className={cn('p-4 border-t shrink-0', isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200')}>
          <div className={cn('flex items-center justify-between p-3 rounded-lg text-xs', isDark ? 'bg-slate-900/50 border border-slate-700 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600')}>
            <span>{isTR ? 'Toplam komut:' : 'Total commands:'}</span>
            <span className={cn('font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-600')}>120+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;
