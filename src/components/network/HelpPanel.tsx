'use client';

import { useState, useMemo, useEffect } from 'react';
import { Translations } from '@/contexts/LanguageContext';
import { HelpCircle, X, Terminal, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { getCommandCategories } from './networkTopology.commands';

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
    router: false,
    dhcp: false,
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
  const categories = useMemo(() => getCommandCategories(isTR), [isTR]);

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
          'fixed z-[10001] rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center',
          isDark ? 'bg-slate-800 text-slate-200 border border-slate-600' : 'bg-white text-slate-700 border border-slate-300',
          isMobile ? 'bottom-4 right-4 w-10 h-10' : 'bottom-6 right-6 w-12 h-12'
        )}
        title={isTR ? 'Komut Yardımı' : 'Command Help'}
        aria-label={isTR ? 'Komut Yardımı' : 'Command Help'}
      >
        <HelpCircle className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50">
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
                {isTR ? 'CLI Komut Referansı' : 'CLI Command Reference'}
              </h2>
              <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {isTR ? '150+ komut' : '150+ commands'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            className={cn('p-1 rounded-full transition-colors', isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}
            aria-label={isTR ? 'Kapat' : 'Close'}
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
                aria-label={isTR ? 'Aramayı temizle' : 'Clear search'}
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
              {isTR ? 'Komut Modları:' : 'Command Modes:'}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>User (&gt;)</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Temel komutlar' : 'Basic commands'}</span>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Privileged (#)</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Tüm komutlar' : 'All commands'}</span>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Config (config)#</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Global yapılandırma' : 'Global config'}</span>
              <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Interface (config-if)#</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{isTR ? 'Arayüz yapılandırması' : 'Interface config'}</span>
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
                            <td className={cn('p-2', isDark ? 'text-slate-200' : 'text-slate-600')}>{desc}</td>
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

        {/* Network Terms Section */}
        <div className={cn('p-4 border-t shrink-0', isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200')}>
          <div className={cn('p-3 rounded-lg border', isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200')}>
            <h3 className={cn('text-xs font-semibold mb-2', isDark ? 'text-slate-200' : 'text-slate-700')}>
              {isTR ? 'Ağ Terimleri:' : 'Network Terms:'}
            </h3>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>STP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Spanning Tree Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Döngü önleme protokolü' : 'Loop prevention protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>VLAN</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Virtual Local Area Network</span>
                <span>-</span>
                <span>{isTR ? 'Sanal yerel ağ' : 'Virtual local network'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>DHCP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Dynamic Host Configuration Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Otomatik IP atama protokolü' : 'Automatic IP assignment protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>DNS</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Domain Name System</span>
                <span>-</span>
                <span>{isTR ? 'Alan adı çözümleme sistemi' : 'Domain name resolution system'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>MAC</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Media Access Control</span>
                <span>-</span>
                <span>{isTR ? 'Donanım adresi' : 'Hardware address'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>IP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Internet Protocol</span>
                <span>-</span>
                <span>{isTR ? 'İnternet protokol adresi' : 'Internet protocol address'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>TCP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Transmission Control Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Güvenilir veri iletim protokolü' : 'Reliable data transmission protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>UDP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>User Datagram Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Hızlı veri iletim protokolü' : 'Fast data transmission protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>HTTP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Hypertext Transfer Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Web sayfası iletim protokolü' : 'Web page transfer protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>FTP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>File Transfer Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Dosya transfer protokolü' : 'File transfer protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>SSH</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Secure Shell</span>
                <span>-</span>
                <span>{isTR ? 'Güvenli uzaktan erişim protokolü' : 'Secure remote access protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>ARP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Address Resolution Protocol</span>
                <span>-</span>
                <span>{isTR ? 'IP-MAC adresi eşleştirme protokolü' : 'IP to MAC address mapping protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>NAT</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Network Address Translation</span>
                <span>-</span>
                <span>{isTR ? 'Ağ adresi dönüştürme' : 'Network address translation'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>ACL</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Access Control List</span>
                <span>-</span>
                <span>{isTR ? 'Erişim kontrol listesi' : 'Access control list'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>OSPF</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Open Shortest Path First</span>
                <span>-</span>
                <span>{isTR ? 'Açık en kısa yol öncelikli yönlendirme protokolü' : 'Open shortest path first routing protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>RIP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Routing Information Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Mesafe vektör yönlendirme protokolü' : 'Distance vector routing protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>ICMP</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Internet Control Message Protocol</span>
                <span>-</span>
                <span>{isTR ? 'Hata ve bilgi mesajlaşma protokolü' : 'Error and informational messaging protocol'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>VPN</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Virtual Private Network</span>
                <span>-</span>
                <span>{isTR ? 'Sanal özel ağ' : 'Virtual private network'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>WLAN</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Wireless Local Area Network</span>
                <span>-</span>
                <span>{isTR ? 'Kablosuz yerel ağ' : 'Wireless local area network'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>SSID</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Service Set Identifier</span>
                <span>-</span>
                <span>{isTR ? 'Kablosuz ağ adı' : 'Wireless network name'}</span>
              </div>
              <div className={cn('flex gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span className={cn('font-mono font-semibold w-16', isDark ? 'text-emerald-400' : 'text-emerald-600')}>MTU</span>
                <span className={cn('text-slate-400', isDark ? 'text-slate-500' : 'text-slate-400')}>Maximum Transmission Unit</span>
                <span>-</span>
                <span>{isTR ? 'Maksimum paket boyutu' : 'Maximum packet size'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer stats - Fixed at bottom */}
        <div className={cn('p-4 border-t shrink-0', isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200')}>
          <div className={cn('flex items-center justify-between p-3 rounded-lg text-xs', isDark ? 'bg-slate-900/50 border border-slate-700 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600')}>
            <span>{isTR ? 'Toplam komut:' : 'Total commands:'}</span>
            <span className={cn('font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-600')}>150+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;
