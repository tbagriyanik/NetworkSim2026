'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Keyboard, Command, CornerDownLeft, Delete, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Shortcut {
  keys: string[];
  description: string;
  descriptionTR: string;
}

interface ShortcutCategory {
  name: string;
  nameTR: string;
  shortcuts: Shortcut[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    name: 'General',
    nameTR: 'Genel',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts', descriptionTR: 'Klavye kısayollarını göster' },
      { keys: ['Ctrl', 'S'], description: 'Save project', descriptionTR: 'Projeyi kaydet' },
      { keys: ['Ctrl', 'O'], description: 'Open project', descriptionTR: 'Proje aç' },
      { keys: ['Ctrl', 'Z'], description: 'Undo', descriptionTR: 'Geri al' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', descriptionTR: 'Yinele' },
    ],
  },
  {
    name: 'Topology',
    nameTR: 'Topoloji',
    shortcuts: [
      { keys: ['Space'], description: 'Pan mode', descriptionTR: 'Kaydırma modu' },
      { keys: ['Ctrl', '+'], description: 'Zoom in', descriptionTR: 'Yakınlaştır' },
      { keys: ['Ctrl', '-'], description: 'Zoom out', descriptionTR: 'Uzaklaştır' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom', descriptionTR: 'Sıfırla' },
      { keys: ['Delete'], description: 'Delete selected', descriptionTR: 'Seçiliyi sil' },
      { keys: ['Esc'], description: 'Cancel/Deselect', descriptionTR: 'İptal/Seçimi kaldır' },
    ],
  },
  {
    name: 'Navigation',
    nameTR: 'Navigasyon',
    shortcuts: [
      { keys: ['Tab'], description: 'Next focus', descriptionTR: 'Sonraki odak' },
      { keys: ['Shift', 'Tab'], description: 'Previous focus', descriptionTR: 'Önceki odak' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const isTR = language === 'tr';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const renderKeyIcon = (key: string) => {
    const iconClass = 'w-3.5 h-3.5';
    switch (key) {
      case 'Ctrl':
        return <Command className={iconClass} />;
      case 'Enter':
      case 'Return':
        return <CornerDownLeft className={iconClass} />;
      case 'Delete':
      case 'Del':
        return <Delete className={iconClass} />;
      case '+':
      case 'ZoomIn':
        return <ZoomIn className={iconClass} />;
      case '-':
      case 'ZoomOut':
        return <ZoomOut className={iconClass} />;
      case 'Space':
        return <span className="text-xs">␣</span>;
      case 'Esc':
        return <span className="text-[10px] font-bold">ESC</span>;
      case 'Tab':
        return <span className="text-[10px] font-bold">TAB</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className={cn(
          'w-full max-w-lg max-h-[80vh] overflow-hidden rounded-xl shadow-2xl animate-scale-in',
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={isTR ? 'Klavye Kısayolları' : 'Keyboard Shortcuts'}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 border-b',
            isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'
          )}
        >
          <div className="flex items-center gap-2">
            <Keyboard className={cn('w-5 h-5', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
            <h2 className={cn('font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
              {isTR ? 'Klavye Kısayolları' : 'Keyboard Shortcuts'}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
            )}
            aria-label={isTR ? 'Kapat' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {SHORTCUTS.map((category) => (
            <div key={category.name}>
              <h3
                className={cn(
                  'text-sm font-semibold uppercase tracking-wider mb-3',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {isTR ? category.nameTR : category.name}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center justify-between py-2 px-3 rounded-lg',
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100/50'
                    )}
                  >
                    <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                      {isTR ? shortcut.descriptionTR : shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd
                            className={cn(
                              'flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md text-xs font-mono font-medium',
                              isDark
                                ? 'bg-slate-800 border border-slate-600 text-slate-200 shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 shadow-sm'
                            )}
                          >
                            {renderKeyIcon(key) || key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className={cn('text-xs mx-0.5', isDark ? 'text-slate-500' : 'text-slate-400')}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'px-4 py-3 border-t text-xs text-center',
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-500'
          )}
        >
          {isTR ? 'Kapatmak için ESC veya ? tuşuna basın' : 'Press ESC or ? to close'}
        </div>
      </div>
    </div>
  );
}
