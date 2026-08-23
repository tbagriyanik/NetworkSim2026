import { useState } from 'react';
import { errorHandler, STORAGE_ERRORS } from '@/lib/errors/errorHandler';

export function usePCPanelState() {
  const [activeServiceTab, setActiveServiceTab] = useState<'dns' | 'http' | 'dhcp' | 'ftp' | 'mail' | 'ntp'>('dns');
  const [showCmdSettings, setShowCmdSettings] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('terminal-font-size') || '13', 10);
    } catch {
      errorHandler.logError(STORAGE_ERRORS.LOCAL_STORAGE_UNAVAILABLE({ key: 'terminal-font-size', operation: 'read' }));
      return 13;
    }
  });

  const handleFontSizeChange = (val: number) => {
    setFontSize(val);
    try {
      localStorage.setItem('terminal-font-size', String(val));
    } catch {
      errorHandler.logError(STORAGE_ERRORS.LOCAL_STORAGE_UNAVAILABLE({ key: 'terminal-font-size', operation: 'write', value: val }));
    }
  };

  return {
    activeServiceTab,
    setActiveServiceTab,
    fontSize,
    setFontSize,
    handleFontSizeChange,
    showCmdSettings,
    setShowCmdSettings,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
  };
}
