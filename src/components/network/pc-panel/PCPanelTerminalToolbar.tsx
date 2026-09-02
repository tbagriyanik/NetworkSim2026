'use client';

import { Search, Copy, Type, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { ShortcutBadge } from '@/components/ui/ShortcutBadge';
import { cn } from '@/lib/utils';
import type { PCActiveTab } from './PCPanel.types';

interface PCPanelTerminalToolbarProps {
  activeTab: PCActiveTab;
  isDark: boolean;
  t: Record<string, string>;
  isMobile: boolean;
  language: string;
  showCmdSettings: boolean;
  fontSize?: number;
  onFontSizeChange?: (val: number) => void;
  onClear?: () => void;
  onSearchOpen: () => void;
  onCopyAll: () => void;
  onToggleCmdSettings: () => void;
}

export function PCPanelTerminalToolbar({
  activeTab,
  isDark,
  t,
  isMobile,
  language,
  showCmdSettings,
  fontSize,
  onFontSizeChange,
  onClear,
  onSearchOpen,
  onCopyAll,
  onToggleCmdSettings,
}: PCPanelTerminalToolbarProps) {
  if (activeTab !== 'desktop' && activeTab !== 'terminal') return null;

  return (
    <div className="flex items-center gap-1">
      <TooltipWrapper title={(
        <div className="flex items-center gap-2">
          {t.search}
          {!isMobile && <ShortcutBadge shortcut="Ctrl+F" variant="primary" />}
        </div>
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className={cn("h-8 w-8 rounded-lg text-secondary-600 hover:text-secondary-900", isDark && "text-secondary-300 hover:text-secondary-100")}
          aria-controls="search-dialog"
          aria-label={t.search}
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </Button>
      </TooltipWrapper>
      <TooltipWrapper title={t.copy}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopyAll}
          className={cn("h-8 w-8 rounded-lg text-secondary-600 hover:text-secondary-900", isDark && "text-secondary-300 hover:text-secondary-100")}
          aria-label={t.copy}
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
        </Button>
      </TooltipWrapper>
      {onClear && (
        <TooltipWrapper title={t.clearTerminalBtn || 'Clear'}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className={cn("h-8 w-8 rounded-lg text-error-500 hover:text-error-600 hover:bg-error-500/10")}
            aria-label={t.clearTerminalBtn}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </TooltipWrapper>
      )}
      {fontSize !== undefined && onFontSizeChange && (
        <>
          <TooltipWrapper title={language === 'tr' ? 'Yazı Boyutunu Küçült (A-)' : 'Decrease Font Size (A-)'}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
              className={cn("h-8 w-8 rounded-lg text-secondary-600 hover:text-secondary-900 font-bold text-xs select-none", isDark && "text-secondary-300 hover:text-secondary-100")}
              aria-label="A-"
            >
              A-
            </Button>
          </TooltipWrapper>
          <TooltipWrapper title={language === 'tr' ? 'Yazı Boyutunu Büyüt (A+)' : 'Increase Font Size (A+)'}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFontSizeChange(Math.min(20, fontSize + 1))}
              className={cn("h-8 w-8 rounded-lg text-secondary-600 hover:text-secondary-900 font-bold text-xs select-none", isDark && "text-secondary-300 hover:text-secondary-100")}
              aria-label="A+"
            >
              A+
            </Button>
          </TooltipWrapper>
        </>
      )}
      <TooltipWrapper title={language === 'tr' ? 'Terminal Ayarları' : 'Terminal Settings'}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCmdSettings}
          className={cn("h-8 w-8 rounded-lg text-secondary-600 hover:text-secondary-900", showCmdSettings && "bg-accent", isDark && "text-secondary-300 hover:text-secondary-100")}
          aria-label={language === 'tr' ? 'Terminal Ayarları' : 'Terminal Settings'}
        >
          <Type className="w-4 h-4" aria-hidden="true" />
        </Button>
      </TooltipWrapper>
    </div>
  );
}
