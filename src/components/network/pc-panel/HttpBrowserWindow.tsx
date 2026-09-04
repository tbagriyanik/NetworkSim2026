import React, { useState, type MutableRefObject } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizablePortalWindow, type WindowState } from './ResizablePortalWindow';
import { useAppStore } from '@/lib/store/appStore';
import { dispatchCapturedPackets } from '@/utils/packetCapture';

type BrowserWindowState = WindowState;

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type ResizeSide = 'left' | 'right' | 'top' | 'bottom' | 'nw' | 'ne' | 'sw' | 'se';

type ResizeState = {
  side: ResizeSide;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
};

interface HttpBrowserWindowProps {
  isOpen: boolean;
  isMobile: boolean;
  isDark: boolean;
  language: string;
  browserWindow: BrowserWindowState;
  title: string;
  url: string;
  srcDoc: string;
  suggestions: string[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  urlInputRef: React.RefObject<HTMLInputElement | null>;
  dragStateRef: MutableRefObject<DragState | null>;
  resizeStateRef: MutableRefObject<ResizeState | null>;
  onClose: () => void;
  onUrlChange: (url: string) => void;
  onSetShowSuggestions: (show: boolean) => void;
  onSetSelectedSuggestionIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenWebPage: (target?: string, url?: string) => void;
  onBrowserWindowChange?: (newState: BrowserWindowState) => void;
}

export function HttpBrowserWindow({
  isOpen,
  isMobile,
  isDark,
  language,
  browserWindow,
  title,
  url,
  srcDoc,
  suggestions,
  showSuggestions,
  selectedSuggestionIndex,
  urlInputRef,
  dragStateRef: _dragStateRef,
  resizeStateRef: _resizeStateRef,
  onClose,
  onUrlChange,
  onSetShowSuggestions,
  onSetSelectedSuggestionIndex,
  onOpenWebPage,
  onBrowserWindowChange,
}: HttpBrowserWindowProps) {
  const [printSuccess, setPrintSuccess] = useState(false);
  const devices = useAppStore(state => state.topology?.devices || []);
  const setDevices = useAppStore(state => state.setDevices);

  const handlePrintDocument = () => {
    // Find printer devices in topology
    const safeDevices = Array.isArray(devices) ? devices : [];
    const printerDevices = safeDevices.filter(d => d.type === 'printer' && d.status !== 'offline');
    if (printerDevices.length === 0) {
      alert(language === 'tr' ? 'Ağda kullanılabilir aktif bir yazıcı bulunamadı!' : 'No active network printer found on the network!');
      return;
    }

    const docTitle = title && title !== 'Web Browser' ? title : (url || 'Web Document');
    const timestamp = new Date().toLocaleTimeString();

    // Add job to target printer queue and notify topology
    if (typeof setDevices === 'function') {
      const updatedDevices = safeDevices.map(d => {
        if (d.type === 'printer') {
          const currentJobs = d.printJobs || [];
          const newJob = {
            id: `job-${Date.now()}`,
            documentTitle: docTitle,
            senderName: language === 'tr' ? 'İstemci Tarayıcı' : 'Client Browser',
            pages: Math.floor(Math.random() * 3) + 1,
            timestamp,
            status: 'completed' as const,
          };
          const updatedPrinter = {
            ...d,
            printJobs: [newJob, ...currentJobs],
          };

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('update-topology-device-config', {
              detail: {
                deviceId: d.id,
                config: {
                  printJobs: updatedPrinter.printJobs
                }
              }
            }));
          }

          return updatedPrinter;
        }
        return d;
      });

      setDevices(updatedDevices);
    }

    // Dispatch LPD / IPP network print packets to global packet capture panel
    const connections = useAppStore.getState().topology?.connections || [];
    const targetPrinter = printerDevices[0];
    if (targetPrinter) {
      const activeConn = connections.find(c =>
        c.active !== false && (c.sourceDeviceId === targetPrinter.id || c.targetDeviceId === targetPrinter.id)
      );
      const connId = activeConn ? (activeConn.id || `${activeConn.sourceDeviceId}-${activeConn.targetDeviceId}`) : `print-${targetPrinter.id}`;
      const printerIp = targetPrinter.ip || '192.168.1.50';

      dispatchCapturedPackets([
        {
          connectionId: connId,
          sourceIp: '192.168.1.100',
          targetIp: printerIp,
          protocol: 'LPD/IPP',
          length: 512,
          info: `LPD Print Spooler: Send document "${docTitle}" to printer ${targetPrinter.name || printerIp} (Port 515/631)`
        },
        {
          connectionId: connId,
          sourceIp: printerIp,
          targetIp: '192.168.1.100',
          protocol: 'LPD/IPP',
          length: 128,
          info: `LPD ACK: Print job ${docTitle} queued successfully by ${targetPrinter.name || printerIp}`
        }
      ]);
    }

    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 2000);
  };
  const headerContent = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenWebPage(url);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      className="flex items-center gap-2 flex-1 min-w-0"
    >
      <div className="flex flex-col flex-1 min-w-0 relative">
        <span className="text-[10px] sm:text-sm font-semibold truncate">{title}</span>
        <input
          ref={urlInputRef}
          value={url || ''}
          onChange={(e) => {
            onUrlChange(e.target.value);
            onSetSelectedSuggestionIndex(-1);
          }}
          onFocus={() => {
            onSetShowSuggestions(true);
            onSetSelectedSuggestionIndex(-1);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            const visibleSuggestions = suggestions.slice(0, 10);

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              onSetSelectedSuggestionIndex(prev =>
                prev < visibleSuggestions.length - 1 ? prev + 1 : prev
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              onSetSelectedSuggestionIndex(prev =>
                prev > 0 ? prev - 1 : -1
              );
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (selectedSuggestionIndex >= 0 && visibleSuggestions[selectedSuggestionIndex]) {
                onUrlChange(visibleSuggestions[selectedSuggestionIndex]);
                onSetShowSuggestions(false);
                onOpenWebPage(visibleSuggestions[selectedSuggestionIndex]);
              } else {
                onSetShowSuggestions(false);
                onOpenWebPage(url);
              }
            }
          }}
          placeholder="http://"
          className={`mt-1 w-full text-[16px] sm:text-xs rounded-md px-2 py-1 border ${isDark ? 'bg-secondary-900 border-secondary-700 text-secondary-200' : 'bg-white border-secondary-300 text-secondary-700'
            }`}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            className={`absolute top-full left-0 right-0 mt-1 rounded-md border shadow-lg max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar z-50 ${isDark ? 'bg-secondary-900 border-secondary-700' : 'bg-white border-secondary-300'
              }`}
          >
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onUrlChange(suggestion);
                  onSetShowSuggestions(false);
                  onOpenWebPage(suggestion);
                }}
                onMouseEnter={() => onSetSelectedSuggestionIndex(index)}
                className={`w-full text-left px-2 py-1.5 text-xs cursor-pointer ${index === selectedSuggestionIndex
                    ? isDark
                      ? 'bg-secondary-700'
                      : 'bg-secondary-200'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  } ${isDark ? 'text-secondary-200' : 'text-secondary-700'}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        size="sm"
        type="submit"
        variant="default"
        className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white"
      >
        {language === 'tr' ? 'Git' : 'Go'}
      </Button>
      <Button
        size="sm"
        type="button"
        variant="outline"
        onClick={handlePrintDocument}
        title={language === 'tr' ? 'Sayfayı Yazdır (Ağ Yazıcısına Gönder)' : 'Print Page (Send to Network Printer)'}
        className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 font-medium transition-all ${
          printSuccess
            ? 'bg-emerald-600 text-white border-emerald-500'
            : isDark
            ? 'bg-purple-950/60 border-purple-700 text-purple-300 hover:bg-purple-900/80 hover:text-white'
            : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
        }`}
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{printSuccess ? (language === 'tr' ? 'Yazdırıldı!' : 'Sent!') : (language === 'tr' ? 'Yazdır' : 'Print')}</span>
      </Button>
    </form>
  );

  return (
    <ResizablePortalWindow
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<span className="w-2.5 h-2.5 rounded-full bg-success-500 animate-pulse shrink-0" />}
      isDark={isDark}
      isMobile={isMobile}
      windowState={browserWindow}
      onWindowStateChange={onBrowserWindowChange}
      minWidth={280}
      minHeight={150}
      headerContent={headerContent}
      borderColorClass={isDark ? 'border-success-500/30 bg-secondary-900' : 'border-success-500 bg-white'}
      headerBgClass={isDark ? 'border-success-500/30 bg-secondary-950 text-secondary-100' : 'border-success-500/50 bg-secondary-50 text-secondary-900'}
    >
      <div
        className="flex-1 overflow-hidden bg-gradient-to-b from-transparent to-secondary-50 dark:to-secondary-900"
        style={{ contain: 'layout style paint' }}
      >
        <iframe
          title={title}
          srcDoc={srcDoc}
          sandbox="allow-forms allow-scripts allow-modals"
          className="h-full w-full border-0 bg-white"
          style={{ display: 'block', touchAction: 'manipulation' }}
        />
      </div>
    </ResizablePortalWindow>
  );
}
