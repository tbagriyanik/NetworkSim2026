'use client';

import { SwitchState } from '@/lib/network/types';
import type { DeviceType } from './networkTopology.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface AppFooterProps {
  state: SwitchState;
  selectedDevice: DeviceType | null;
  activeDeviceId: string;
  activeDeviceName?: string;
  isDark: boolean;
  isCLIActive?: boolean;
}

export function AppFooter({ state, selectedDevice, activeDeviceId, activeDeviceName, isDark, isCLIActive = true }: AppFooterProps) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const dark = isDark;

  // Get device info
  const deviceName = activeDeviceName || state.hostname;
  const deviceType = activeDeviceId.includes('pc') ? 'PC' : activeDeviceId.includes('router') ? 'Router' : 
    (state.switchModel === 'WS-C3650-24PS' ? 'C3650' : 'Switch');

  return (
    <footer
      className={cn(
        "mt-6 rounded-2xl p-4 border shadow-sm transition-colors duration-200",
        dark ? "bg-zinc-900/80 border-zinc-800 text-zinc-100" : "bg-white/80 border-zinc-200 text-zinc-900",
        "backdrop-blur-md"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Selected Device Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              deviceType === 'PC' ? 'bg-blue-500/10 text-blue-500' :
              deviceType === 'Router' ? 'bg-indigo-500/10 text-indigo-500' :
              deviceType === 'C3650' ? 'bg-purple-500/10 text-purple-500' :
              'bg-emerald-500/10 text-emerald-500'
            )}>
              {deviceType === 'PC' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : deviceType === 'Router' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              )}
            </div>
            <div>
              <div className={cn("text-[10px] font-medium uppercase tracking-wider opacity-60")}>
                {t.activeSystem}
              </div>
              <div className="text-sm font-bold tracking-tight">
                {deviceName}
              </div>
            </div>
          </div>

          <div className={cn("h-8 w-px", dark ? "bg-zinc-800" : "bg-zinc-200")} />

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">{t.nosVersion}</div>
              <div className="text-xs font-mono font-medium text-blue-500">{state.version.nosVersion}</div>
            </div>

            <div className="flex flex-col">
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">{t.model}</div>
              <div className="text-xs font-medium">{state.version.modelName}</div>
            </div>

            <div className="flex flex-col">
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">{t.activePorts}</div>
              <div className="text-xs font-mono font-bold">
                <span className="text-blue-500">{Object.values(state.ports).filter(p => p.status === 'connected' && !p.shutdown).length}</span>
                <span className="mx-1 opacity-20">/</span>
                <span className="opacity-60">{Object.keys(state.ports).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
