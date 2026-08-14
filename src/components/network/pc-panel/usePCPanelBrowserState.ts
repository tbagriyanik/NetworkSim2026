import { useState, useEffect, useMemo } from 'react';
import type { CanvasDevice } from '../networkTopology.types';
import { errorHandler, STORAGE_ERRORS } from '@/lib/errors/errorHandler';

export interface UsePCPanelBrowserStateParams {
  topologyDevices: CanvasDevice[];
  httpAppUrl: string;
  setHttpAppUrl: (url: string) => void;
  httpAppContent: string | null;
  setHttpAppContent: (content: string | null) => void;
  setHttpAppDeviceId: (id: string | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function usePCPanelBrowserState({
  topologyDevices,
  httpAppUrl,
  setHttpAppUrl,
  httpAppContent,
  setHttpAppContent,
  setHttpAppDeviceId,
  inputRef
}: UsePCPanelBrowserStateParams) {

  const urlSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    suggestions.push('http://iot-panel');

    topologyDevices.forEach(device => {
      if (device.ip && device.ip !== '0.0.0.0') {
        suggestions.push(`http://${device.ip}`);
      }
    });

    return [...new Set(suggestions)];
  }, [topologyDevices]);

  const filteredSuggestions = useMemo(() => {
    if (!httpAppUrl) return urlSuggestions;
    const lowerInput = httpAppUrl.toLowerCase();
    return urlSuggestions.filter(s =>
      s.toLowerCase().includes(lowerInput)
    );
  }, [httpAppUrl, urlSuggestions]);

  const [browserWindow, setBrowserWindow] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pc-browser-window-state') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          x: typeof parsed.x === 'number' ? parsed.x : 40,
          y: typeof parsed.y === 'number' ? parsed.y : 140,
          width: typeof parsed.width === 'number' ? parsed.width : 960,
          height: typeof parsed.height === 'number' ? parsed.height : 400,
        };
      } catch (err) {
        errorHandler.logError(STORAGE_ERRORS.LOAD_FAILED({ key: 'pc-browser-window-state', savedValue: saved, parseError: String(err) }));
        return { x: 40, y: 140, width: 960, height: 400 };
      }
    }
    return { x: 40, y: 140, width: 960, height: 400 };
  });

  useEffect(() => {
    localStorage.setItem('pc-browser-window-state', JSON.stringify(browserWindow));
  }, [browserWindow]);

  useEffect(() => {
    if (!httpAppContent) return;

    const handleBrowserWindowEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setHttpAppUrl('');
        setHttpAppContent(null);
        setHttpAppDeviceId(null);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleBrowserWindowEscape, true);
    return () => {
      window.removeEventListener('keydown', handleBrowserWindowEscape, true);
    };
  }, [httpAppContent, setHttpAppUrl, setHttpAppContent, setHttpAppDeviceId, inputRef]);

  return {
    urlSuggestions,
    filteredSuggestions,
    browserWindow,
    setBrowserWindow
  };
}


