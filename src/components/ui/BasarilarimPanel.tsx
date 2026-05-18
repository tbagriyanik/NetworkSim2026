'use client';

import { useMemo } from 'react';
import { Trophy, X, Clock, BookOpen, FileText, GraduationCap } from 'lucide-react';
import { useDrag } from '@/hooks/useDrag';
import { getRecordsSorted, type AchievementRecord } from '@/utils/achievementRecords';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { cn } from '@/lib/utils';
import type { Translations } from '@/contexts/LanguageContext';

interface BasarilarimPanelProps {
  t: Translations;
  language: 'tr' | 'en';
  isDark: boolean;
  onClose: () => void;
  zIndex: number;
}

function formatDate(iso: string, lang: 'tr' | 'en'): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}sn`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s > 0 ? `${m}dk ${s}sn` : `${m}dk`;
}

export function BasarilarimPanel({ t, language, isDark, onClose, zIndex }: BasarilarimPanelProps) {
  const { containerRef, handleDragStart, position } = useDrag({
    storageKey: 'basarilarim-panel-pos',
    defaultPosition: { x: 16, y: 96 },
    origin: 'bottom-right',
    disableSnap: true,
  });

  const records = useMemo(() => getRecordsSorted(), []);

  return (
    <div
      ref={containerRef}
      className={cn("hidden md:block fixed animate-scale-in")}
      style={{ bottom: `${position.y}px`, right: `${position.x}px`, zIndex }}
    >
      <div className={`rounded-2xl border shadow-2xl w-[340px] max-h-[500px] flex flex-col backdrop-blur-md ${isDark ? 'bg-zinc-950/40 border-zinc-800/50 shadow-black/40' : 'bg-white/40 border-zinc-200/50 shadow-zinc-200/50'}`}>
        <div
          className={`flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing select-none shrink-0 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          onPointerDown={handleDragStart}
        >
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t.basarilarim}</span>
          </div>
          <TooltipWrapper title={t.close}>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-5 h-5 rounded-md bg-red-500 hover:bg-red-600 cursor-pointer transition-colors inline-flex items-center justify-center shrink-0">
              <X className="w-3 h-3 text-white pointer-events-none" />
            </button>
          </TooltipWrapper>
        </div>
        <div className="overflow-y-auto flex-1">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Trophy className="w-8 h-8 text-slate-400 mb-2" />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.basarilarimEmpty}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {records.map((record, i) => (
                <RecordItem key={`${record.date}-${i}`} record={record} t={t} language={language} isDark={isDark} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecordItem({ record, t, language, isDark }: { record: AchievementRecord; t: Translations; language: 'tr' | 'en'; isDark: boolean }) {
  const Icon = record.type === 'session' ? Clock :
    record.type === 'guided-lesson' ? BookOpen :
    record.type === 'exam' ? GraduationCap : FileText;

  const color = record.type === 'session' ? 'text-blue-500' :
    record.type === 'guided-lesson' ? 'text-emerald-500' :
    record.type === 'exam' ? 'text-purple-500' : 'text-cyan-500';

  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}>
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {record.type === 'session' ? t.sessionDuration :
             record.type === 'guided-lesson' ? t.guidedLesson :
             record.type === 'exam' ? t.examResult : t.projectSaved}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {formatDate(record.date, language)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {'name' in record ? record.name : ''}
            {record.type === 'session' ? (
              <span className="font-mono text-xs">{' '}{formatDuration(record.durationSeconds)}</span>
            ) : null}
          </span>
        </div>
        {(record.type === 'guided-lesson' || record.type === 'exam') && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[10px] font-mono font-semibold ${color}`}>
              {record.type === 'guided-lesson' ? `${record.points}/${record.totalPoints}` : `${record.score}/${record.maxScore}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
