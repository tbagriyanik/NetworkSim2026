import { useEffect, useState } from 'react';
import { getDefaultPcFiles } from './pcPanelFiles';
import type { FtpSession, PcFile, PythonSession, PCActiveTab } from './PCPanel.types';

export function usePCPanelSessionState(
  deviceId: string,
  pcHistories: Map<string, string[]> | undefined,
  activeTab: PCActiveTab,
  setCurrentPath: (path: string) => void,
) {
  const [ftpSession, setFtpSession] = useState<FtpSession | null>(null);
  const [pythonSession, setPythonSession] = useState<PythonSession | null>(null);
  const [isFtpFilePickerOpen, setIsFtpFilePickerOpen] = useState(false);
  const [pcLocalFiles, setPcLocalFiles] = useState<PcFile[]>(() => {
    try { const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(`pc_files_${deviceId}`) : null; if (stored) return JSON.parse(stored); } catch { /* storage unavailable */ }
    const defaults = getDefaultPcFiles(deviceId);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(`pc_files_${deviceId}`, JSON.stringify(defaults)); } catch { /* storage unavailable */ }
    return defaults;
  });
  const [desktopHistory, setDesktopHistory] = useState<string[]>(() => {
    try { const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(`pc_history_${deviceId}`) : null; if (stored) return JSON.parse(stored); } catch { /* storage unavailable */ }
    return pcHistories?.get(deviceId) || [];
  });
  const [desktopHistoryIndex, setDesktopHistoryIndex] = useState(-1);
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [consoleHistoryIndex, setConsoleHistoryIndex] = useState(-1);

  useEffect(() => {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(`pc_files_${deviceId}`) : null;
      const files = stored ? JSON.parse(stored) : getDefaultPcFiles(deviceId);
      if (!stored && typeof localStorage !== 'undefined') localStorage.setItem(`pc_files_${deviceId}`, JSON.stringify(files));
      setPcLocalFiles(files);
    } catch { /* storage unavailable */ }
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(`pc_cwd_${deviceId}`, 'C:\\'); } catch { /* storage unavailable */ }
    setCurrentPath('C:\\');
    setDesktopHistoryIndex(-1); setConsoleHistoryIndex(-1);
  }, [deviceId, setCurrentPath]);

  useEffect(() => {
    if (desktopHistory.length > 0) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(`pc_history_${deviceId}`, JSON.stringify(desktopHistory)); } catch { /* storage unavailable */ } }
  }, [deviceId, desktopHistory]);

  useEffect(() => {
    if (activeTab === 'desktop') setDesktopHistoryIndex(-1);
    if (activeTab === 'terminal') setConsoleHistoryIndex(-1);
  }, [activeTab]);

  return { ftpSession, setFtpSession, pythonSession, setPythonSession, isFtpFilePickerOpen, setIsFtpFilePickerOpen, pcLocalFiles, setPcLocalFiles, desktopHistory, setDesktopHistory, desktopHistoryIndex, setDesktopHistoryIndex, consoleHistory, setConsoleHistory, consoleHistoryIndex, setConsoleHistoryIndex };
}
