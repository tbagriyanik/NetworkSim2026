import type React from 'react';
import { useEffect, useRef } from 'react';
import type { PCActiveTab } from './PCPanel.types';

interface UsePCPanelAutoTypeOptions {
  deviceId: string;
  isVisible: boolean;
  setActiveTab: (tab: PCActiveTab) => void;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  executeCommand: (cmd?: string) => Promise<void>;
}

/**
 * Listens for global `pc-auto-type` events and types the command into the
 * desktop input character by character. Extracted from PCPanel orchestrator.
 */
export function usePCPanelAutoType({ deviceId, isVisible, setActiveTab, setInput, executeCommand }: UsePCPanelAutoTypeOptions) {
  const executeCommandRef = useRef<((cmd?: string) => Promise<void>) | null>(null);

  useEffect(() => {
    executeCommandRef.current = executeCommand;
  }, [executeCommand]);

  useEffect(() => {
    const handleAutoType = (e: Event) => {
      const { deviceId: eventDeviceId, command } = (e as CustomEvent).detail;
      if (eventDeviceId !== deviceId) return;

      // Switch to CMD/desktop tab
      setActiveTab('desktop');

      let i = 0;
      setInput('');
      const typeInterval = setInterval(() => {
        if (i < command.length) {
          const char = command.charAt(i);
          setInput(prev => prev + char);
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            if (executeCommandRef.current) {
              executeCommandRef.current(command);
            }
          }, 300);
        }
      }, 70);
    };

    window.addEventListener('pc-auto-type', handleAutoType);
    return () => window.removeEventListener('pc-auto-type', handleAutoType);
  }, [deviceId, isVisible, setActiveTab, setInput]);

  return { executeCommandRef };
}
