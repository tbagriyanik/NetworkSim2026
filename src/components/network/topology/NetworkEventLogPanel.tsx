'use client';

import { useState } from 'react';
import { X, AlertTriangle, Info, AlertCircle, Trash2, Filter } from 'lucide-react';
import { useNetworkEventLogs, useAppStore } from '@/lib/store/appStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface NetworkEventLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function NetworkEventLogPanel({ isOpen, onClose, isDark }: NetworkEventLogPanelProps) {
  const logs = useNetworkEventLogs();
  const clearLogs = useAppStore(state => state.clearNetworkEventLogs);
  const { language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (level: string) => {
    if (isDark) {
      switch (level) {
        case 'error': return 'bg-red-500/10 border-red-500/30';
        case 'warning': return 'bg-amber-500/10 border-amber-500/30';
        default: return 'bg-blue-500/10 border-blue-500/30';
      }
    }
    switch (level) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={cn(
        "absolute right-4 top-20 bottom-4 w-80 md:w-96 rounded-xl shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-in-out border",
        isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200",
        isOpen ? "translate-x-0" : "translate-x-[120%]"
      )}
    >
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        isDark ? "border-slate-800" : "border-slate-100"
      )}>
        <div className="flex items-center gap-2">
          <AlertCircle className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-slate-500")} />
          <h2 className={cn("font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>
            {language === 'tr' ? 'Ağ Olay Günlüğü' : 'Network Event Log'}
          </h2>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
          )}>
            {logs.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className={cn(
            "p-1.5 rounded-md hover:bg-slate-100 transition-colors",
            isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className={cn(
        "p-3 flex items-center justify-between border-b gap-2",
        isDark ? "border-slate-800 bg-slate-800/50" : "border-slate-100 bg-slate-50"
      )}>
        <div className="flex items-center gap-1 flex-1">
          <Filter className={cn("w-4 h-4 mr-1", isDark ? "text-slate-400" : "text-slate-500")} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'error' | 'warning')}
            className={cn(
              "text-xs rounded border px-2 py-1 outline-none flex-1",
              isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
            )}
          >
            <option value="all">{language === 'tr' ? 'Tümü' : 'All'}</option>
            <option value="error">{language === 'tr' ? 'Sadece Hatalar' : 'Errors Only'}</option>
            <option value="warning">{language === 'tr' ? 'Sadece Uyarılar' : 'Warnings Only'}</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={clearLogs}
          disabled={logs.length === 0}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          {language === 'tr' ? 'Temizle' : 'Clear'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm">
              {logs.length === 0
                ? (language === 'tr' ? 'Günlükte kayıt yok.' : 'No logs recorded.')
                : (language === 'tr' ? 'Bu filtreye uygun kayıt yok.' : 'No logs match this filter.')}
            </p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className={cn(
                "p-3 rounded-lg border flex gap-3 items-start",
                getBgColor(log.level)
              )}
            >
              <div className="shrink-0 mt-0.5">
                {getIcon(log.level)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded",
                    log.level === 'error' ? (isDark ? "bg-red-500/25 text-red-300 border border-red-500/30" : "bg-red-100 text-red-800 border border-red-200") :
                    log.level === 'warning' ? (isDark ? "bg-amber-500/25 text-amber-300 border border-amber-500/30" : "bg-amber-100 text-amber-900 border border-amber-200") :
                    (isDark ? "bg-blue-500/25 text-blue-300 border border-blue-500/30" : "bg-blue-100 text-blue-800 border border-blue-200")
                  )}>
                    {log.category}
                  </span>
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-slate-200" : "text-slate-800"
                )}>
                  {log.message}
                </p>
                {log.detail && (
                  <p className={cn(
                    "text-xs mt-1 break-words leading-relaxed",
                    isDark ? "text-slate-300" : "text-slate-700"
                  )}>
                    {log.detail}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
