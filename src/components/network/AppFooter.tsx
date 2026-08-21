'use client';

import type { CanvasDevice, DeviceType } from '@/components/network/networkTopology.types';
import type { Translations } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

import { TooltipWrapper } from '@/components/ui/TooltipWrapper';

interface AppFooterProps {
  t: Translations;
  isDark: boolean;
  language: 'tr' | 'en';
  activeTab: string;
  activeDeviceType: DeviceType;
  activeDeviceId: string;
  hasUnsavedChanges: boolean;
  lastSaveTime: string | null;
  projectName: string;
  totalScore: number;
  maxScore: number;
  topologyDevices: CanvasDevice[];
  lastTaskEvent: { type: 'completed' | 'failed'; taskName: string; timestamp: number } | null;
  showProjectPicker: boolean;
  showOnboarding: boolean;
  setShowAboutModal: (v: boolean) => void;
  children?: React.ReactNode;
}

export function AppFooter({
  t, isDark, language, activeTab, activeDeviceType, activeDeviceId,
  hasUnsavedChanges, lastSaveTime, projectName, totalScore, maxScore,
  topologyDevices, lastTaskEvent, showProjectPicker, showOnboarding,
  setShowAboutModal, children
}: AppFooterProps) {
  const getDeviceCountLabel = (count: number) => (
    language === 'tr' ? t.devicesCount : (count === 1 ? 'device' : 'devices')
  );

  const getDeviceCountText = (count: number) => {
    if (count === 0) {
      return language === 'tr' ? 'Cihaz yok' : 'No devices';
    }

    return `${count} ${getDeviceCountLabel(count)}`;
  };

  const [isTaskEventRecent, setIsTaskEventRecent] = useState(false);

  useEffect(() => {
    if (!lastTaskEvent) {
      setTimeout(() => setIsTaskEventRecent(false), 0);
      return;
    }
    const check = () => setIsTaskEventRecent(Date.now() - lastTaskEvent.timestamp < 5000);
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [lastTaskEvent]);

  return (
    <>
      {/* Desktop Footer */}
      <footer className={`hidden md:block fixed bottom-0 inset-x-0 z-2 border-t backdrop-blur-xl transition-all h-[44px] pb-[50px] ${isDark ? 'bg-secondary-950/95 border-secondary-900' : 'bg-white/95 border-secondary-200'
        } ${showProjectPicker || showOnboarding || activeTab === 'terminal' ? 'hidden' : ''}`}>
        <div className="w-full px-5 py-2 pb-[10px]">
          <div className="flex items-center justify-between gap-4">
            {/* Save Status */}
            <div className="flex items-center gap-3">
              <TooltipWrapper title={hasUnsavedChanges ? t.unsaved : t.saved}>
                <div
                  role="status"
                  aria-label={hasUnsavedChanges ? t.unsaved : t.saved}
                  className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-secondary-900/50 border-secondary-800' : 'bg-secondary-50 border-secondary-200'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-warning-500' : 'bg-success-500'
                    }`} />
                  {lastSaveTime && (
                    <span className={`text-[11px] ${isDark ? 'text-secondary-300' : 'text-secondary-500'}`}>
                      <span className="w-[100px] inline-block text-left truncate">
                        {t.lastSavedAt + lastSaveTime}
                      </span>
                      {projectName !== 'Untitled' && (
                        <>
                          <span className="font-medium w-[120px] inline-block text-left truncate">{projectName}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </TooltipWrapper>

              {/* Quick Hints */}
              <div className={`hidden md:flex items-center gap-2 whitespace-nowrap`}>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  aria-label={t.contactTitle}
                  className={`text-[11px] font-medium transition-transform hover:scale-110 ${isDark ? 'text-secondary-400 hover:text-primary-400' : 'text-secondary-600 hover:text-primary-600'}`}
                >
                  {t.tips}
                </button>
                <span className={`text-[11px] ${isDark ? 'text-secondary-300' : 'text-secondary-700'} whitespace-nowrap`}>
                  {activeTab === 'topology' && (
                    <>
                      <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-secondary-700 text-secondary-300' : 'bg-secondary-200 text-secondary-700'
                        }`}>(Shift) TAB</kbd>
                      <span className="mx-1">{t.tabToNext}</span>
                      <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-secondary-700 text-secondary-300' : 'bg-secondary-200 text-secondary-700'
                        }`}>Ctrl+S</kbd>
                      <span className="mx-1">{t.saveLabel}</span>
                      <span className={`mx-2 ${isDark ? 'text-secondary-500' : 'text-secondary-400'}`}>|</span>
                      <span className={`text-[11px] ${isDark ? 'text-secondary-400' : 'text-secondary-600'}`}>
                        {getDeviceCountText(topologyDevices?.length || 0)}
                      </span>
                      <div className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-secondary-400' : 'text-secondary-500'}`}>
                        <span className="font-semibold">LeftMB</span>:{t.pan}
                        <span className="mx-1">·</span>
                        <span className="font-semibold">MidMB</span>:{t.boxSelect}
                        <span className="mx-1">·</span>
                        <span className="font-semibold">RightMB</span>:{t.menu}
                        <span className="mx-1">·</span>
                        <span className="font-semibold">{language === 'tr' ? 'Tekerlek' : 'Wheel'}</span>:{language === 'tr' ? 'Yakınlaştır' : 'Zoom'}
                      </div>
                    </>
                  )}
                  {(activeTab === 'cmd' || activeTab === 'terminal') && (
                    <span className="text-[11px] italic">{t.clickIconsToRun}</span>
                  )}
                </span>
              </div>

            </div>

            {/* Right Side: Task Event Notification & Lab Progress */}
            <div className="flex items-center gap-4">
              {/* Task Event Notification */}
              {isTaskEventRecent && lastTaskEvent && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border animate-slide-up z-[100] ${lastTaskEvent.type === 'completed'
                  ? isDark ? 'bg-success-500/10 border-success-500/30' : 'bg-success-50 border-success-200'
                  : isDark ? 'bg-warning-500/10 border-warning-500/30' : 'bg-warning-50 border-warning-200'
                  }`}>
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${lastTaskEvent.type === 'completed'
                    ? 'text-success-500'
                    : 'text-warning-500'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${lastTaskEvent.type === 'completed'
                      ? 'bg-success-500'
                      : 'bg-warning-500'
                      }`} />
                    {lastTaskEvent.type === 'completed'
                      ? t.taskCompleted
                      : t.taskFailed}
                  </span>
                  <span className={`text-[11px] font-bold ${isDark ? 'text-secondary-300' : 'text-secondary-700'}`}>
                    {lastTaskEvent.taskName}
                  </span>
                </div>
              )}

            {/* Lab Progress */}
            {activeDeviceType !== 'pc' && activeDeviceType !== 'iot' && activeDeviceType !== 'firewall' && topologyDevices && topologyDevices.length > 0 && activeDeviceId && maxScore > 0 && (
              <div className={`hidden md:flex items-center gap-2`}>
                <span className={`text-[11px] font-bold tracking-wider ${isDark ? 'text-secondary-500' : 'text-secondary-600'}`}>
                  {t.labProgress}
                </span>
                <div className={`w-20 h-1.5 rounded-full ${isDark ? 'bg-secondary-700' : 'bg-secondary-200'} overflow-hidden`}>
                  <div
                    className="h-full bg-accent-500 shadow-[0_0_2px_rgba(6,182,212,0.2)] transition-all duration-300"
                    style={{ width: `${(totalScore / maxScore) * 100}%` }}
                  />
                </div>
                <span className={`text-[11px] font-bold ${isDark ? 'text-accent-400' : 'text-accent-600'}`}>
                  {Math.round((totalScore / maxScore) * 100)}%
                </span>
              </div>
            )}
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Footer — status bar / informational messages */}
      <footer className={`md:hidden fixed bottom-0 inset-x-0 z-2 border-t backdrop-blur-xl transition-all h-[32px] flex items-center px-3 text-[11px] select-none ${isDark ? 'bg-secondary-900/95 border-secondary-800 text-secondary-300' : 'bg-white/95 border-secondary-200 text-secondary-600'
        } ${showProjectPicker || showOnboarding || activeTab === 'terminal' ? 'hidden' : ''}`}>
        <div className="w-full flex items-center justify-between gap-2 overflow-hidden">
          {/* Status & Device count */}
          <div className="flex items-center gap-2 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${hasUnsavedChanges ? 'bg-warning-400 animate-pulse' : 'bg-success-400'}`} />
            <span className="truncate font-medium">
              {hasUnsavedChanges ? t.unsaved : t.saved}
            </span>
            <span className="opacity-30">|</span>
            <span className="truncate opacity-80">
              {getDeviceCountText(topologyDevices?.length || 0)}
            </span>
          </div>

          {/* Task info / Lab score */}
          <div className="flex items-center gap-2 shrink-0">
            {isTaskEventRecent && lastTaskEvent ? (
              <span className={`font-semibold flex items-center gap-1 text-[10px] ${lastTaskEvent.type === 'completed' ? 'text-success-400' : 'text-warning-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="truncate max-w-[100px]">{lastTaskEvent.taskName}</span>
              </span>
            ) : maxScore > 0 && topologyDevices && topologyDevices.length > 0 && activeDeviceId ? (
              <span className={`font-bold text-[10px] ${isDark ? 'text-accent-400' : 'text-accent-600'}`}>
                {t.labProgress}: {Math.round((totalScore / maxScore) * 100)}%
              </span>
            ) : null}
          </div>
        </div>
      </footer>
    </>
  );
}
