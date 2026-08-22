'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { LiveDeviceList } from '@/components/network/LiveDeviceList';
import { CanvasDevice } from './networkTopology.types';
import { SwitchState } from '@/lib/network/types';
import { RefreshNetworkReport } from '@/hooks/useRefreshReport';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface LiveSummary {
  deviceCount: { total: number; routers: number; switches: number; pcs: number; iot: number; firewalls: number; wlcs: number };
  activeLinks: number;
  vlanCount: number;
  routingTableSummary: { totalRoutes: number; connected: number; static: number; dynamic: number };
  protocolStats: {
    ospf: { count: number; neighbors: number };
    stp: { roots: number; blocked: number };
    hsrp: { active: number; standby: number };
    eigrp: { count: number; neighbors: number };
  };
}

interface RefreshReportPanelProps {
  refreshNetworkReport: RefreshNetworkReport | null;
  setRefreshNetworkReport: React.Dispatch<React.SetStateAction<RefreshNetworkReport | null>>;
  refreshReportRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  isDark: boolean;
  focusedOverlay: string;
  setFocusedOverlay: (overlay: 'refresh' | 'packet' | 'pc-info' | 'router-info' | 'switch-info') => void;
  language: 'tr' | 'en';
  t: Record<string, string>;
  handleRefreshNetwork: () => void;
  liveSummary: LiveSummary | null;
  topologyDevices: CanvasDevice[];
  deviceStates: Map<string, SwitchState>;
  bringElementToFront: (el: HTMLElement) => void;
}

export function RefreshReportPanel({
  refreshNetworkReport,
  setRefreshNetworkReport,
  refreshReportRef,
  isMobile,
  isDark,
  focusedOverlay,
  setFocusedOverlay,
  language,
  t,
  handleRefreshNetwork,
  liveSummary,
  topologyDevices,
  deviceStates,
  bringElementToFront,
}: RefreshReportPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('refresh-report-collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh-report-collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  if (!refreshNetworkReport?.show) return null;

  return (
    <div
      ref={refreshReportRef}
      data-draggable-id="refresh-network-report"
      className={`fixed z-[100] flex flex-col overflow-hidden backdrop-blur-md select-none ${isMobile
        ? 'top-[84px] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[360px] rounded-xl border shadow-2xl'
        : 'top-20 right-4 w-full max-w-sm rounded-xl border shadow-2xl'
        } animate-in slide-in-from-right-full duration-300 ${isDark
          ? (focusedOverlay === 'refresh' ? 'bg-secondary-950/70 border-emerald-400 text-secondary-100 shadow-[0_0_0_1px_rgba(52,211,153,0.35),0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-secondary-950/70 border-secondary-850/80 text-secondary-100 shadow-black/40')
          : (focusedOverlay === 'refresh' ? 'bg-white/70 border-emerald-500 text-secondary-900 shadow-[0_0_0_1px_rgba(34,197,94,0.24),0_20px_40px_rgba(15,23,42,0.12)]' : 'bg-white/70 border-secondary-200/80 text-secondary-900 shadow-secondary-200/50')
        }`}
      style={{
        zIndex: 100,
        ...(!isMobile ? { maxHeight: 'calc(100vh - 20px)' } : { maxHeight: 'calc(100vh - 20px)' }),
        resize: 'both',
        overflow: 'hidden',
      }}
      onMouseDown={() => setFocusedOverlay('refresh')}
      onPointerDownCapture={(e) => bringElementToFront(e.currentTarget as HTMLElement)}
    >
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <div className="flex h-full min-h-0 flex-col">
          <div
            className={`flex items-center justify-between px-3 py-2 border-b rounded-t-xl select-none ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''} ${isDark ? 'bg-white/5 border-success-500/20' : 'bg-black/5 border-success-500/30'}`}
            data-drag-handle={!isMobile ? true : undefined}
            onDoubleClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button, input, select, textarea, .no-drag')) return;
              setIsCollapsed(prev => !prev);
            }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2 pointer-events-none">
              {refreshNetworkReport.title}
            </h3>
            <div className="flex items-center gap-1">
              <TooltipWrapper title={t.refreshNetwork}>
                <button
                  onClick={() => { handleRefreshNetwork(); }}
                  className="w-5 h-5 rounded-md bg-primary-500 hover:bg-primary-600 cursor-pointer transition-colors inline-flex items-center justify-center shrink-0"
                >
                  <RefreshCw className="w-3 h-3 text-white pointer-events-none" />
                </button>
              </TooltipWrapper>
              <TooltipWrapper title={t.close}>
                <button
                  onClick={() => setRefreshNetworkReport(prev => prev ? { ...prev, show: false } : null)}
                  className="w-5 h-5 rounded-md bg-error-500 hover:bg-error-600 cursor-pointer transition-colors inline-flex items-center justify-center shrink-0"
                >
                  <X className="w-3 h-3 text-white pointer-events-none" />
                </button>
              </TooltipWrapper>
              <TooltipWrapper title={isCollapsed ? t.expand : t.collapse}>
                <button
                  className="p-1 rounded hover:bg-secondary-100/50 dark:hover:bg-secondary-800/50 transition-colors"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? <ChevronDown className="w-3 h-3 text-secondary-500 dark:text-secondary-400" /> : <ChevronUp className="w-3 h-3 text-secondary-500 dark:text-secondary-400" />}
                </button>
              </TooltipWrapper>
            </div>
          </div>
          <CollapsibleContent className="flex min-h-0 flex-1 flex-col max-h-none">
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className={`w-full grid grid-cols-2 rounded-lg ${isDark ? 'bg-secondary-800/80' : 'bg-secondary-200/80'}`}>
                  <TabsTrigger value="summary" className="text-xs">
                    {language === 'tr' ? 'Özet' : 'Summary'}
                  </TabsTrigger>
                  <TabsTrigger value="devices" className="text-xs">
                    {language === 'tr' ? 'Cihazlar' : 'Devices'} ({refreshNetworkReport.devices.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-2 space-y-2">
                  {/* Quick status messages */}
                  {refreshNetworkReport.dhcpMessages.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 opacity-80 text-xs">
                      {refreshNetworkReport.dhcpMessages.map((msg, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span>{i + 1}.</span>
                          <span>{msg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {refreshNetworkReport.stpMessage && (
                    <div className="text-pink-700 dark:text-pink-300 font-medium py-0.5 px-2 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-500/30 rounded-lg w-fit text-xs">
                      {refreshNetworkReport.stpMessage}
                    </div>
                  )}
                  {refreshNetworkReport.portSecurityMessage && (
                    <div className="text-red-700 dark:text-red-300 font-medium py-0.5 px-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-lg w-fit text-xs">
                      {refreshNetworkReport.portSecurityMessage}
                    </div>
                  )}
                  {refreshNetworkReport.topologyMessage && (
                    <div className="text-amber-800 dark:text-amber-300 font-medium py-0.5 px-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-lg w-fit text-xs">
                      {refreshNetworkReport.topologyMessage}
                    </div>
                  )}

                  {/* Summary grid - live from store, real-time reactive */}
                  {liveSummary && (
                    <>
                      <div className={`grid grid-cols-2 gap-2 text-xs`}>
                        <div className={`rounded-lg p-2.5 ${isDark ? 'bg-secondary-800/60' : 'bg-secondary-100/80'}`}>
                          <div className={`font-semibold mb-1 ${isDark ? 'text-secondary-400' : 'text-secondary-500'}`}>
                            {language === 'tr' ? 'Cihaz Sayısı' : 'Device Count'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>{language === 'tr' ? 'Toplam' : 'Total'}</span>
                              <span className="font-bold">{liveSummary.deviceCount.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{language === 'tr' ? 'Yönlendirici' : 'Router'}</span>
                              <span>{liveSummary.deviceCount.routers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{language === 'tr' ? 'Anahtar' : 'Switch'}</span>
                              <span>{liveSummary.deviceCount.switches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>PC</span>
                              <span>{liveSummary.deviceCount.pcs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>IoT</span>
                              <span>{liveSummary.deviceCount.iot}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{language === 'tr' ? 'Güvenlik Duvarı' : 'Firewall'}</span>
                              <span>{liveSummary.deviceCount.firewalls}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>WLC</span>
                              <span>{liveSummary.deviceCount.wlcs}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`rounded-lg p-2.5 ${isDark ? 'bg-secondary-800/60' : 'bg-secondary-100/80'}`}>
                          <div className={`font-semibold mb-1 ${isDark ? 'text-secondary-400' : 'text-secondary-500'}`}>
                            {language === 'tr' ? 'Ağ Uyarıları' : 'Network Warnings'} ({refreshNetworkReport.summary.networkWarnings.length})
                          </div>
                          <div className="space-y-0.5">
                            {refreshNetworkReport.summary.networkWarnings.map((w, i) => (
                              <div key={i} className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                                <span>⚠</span>
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {refreshNetworkReport.summary.networkWarnings.length === 0 && (
                        <div className={`rounded-lg p-2.5 ${isDark ? 'bg-secondary-800/60' : 'bg-secondary-100/80'} text-xs text-center ${isDark ? 'text-secondary-400' : 'text-secondary-500'}`}>
                          {language === 'tr' ? 'Uyarı yok' : 'No warnings'}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="devices" className="mt-2">
                  <LiveDeviceList devices={topologyDevices} deviceStates={deviceStates} language={language} />
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
