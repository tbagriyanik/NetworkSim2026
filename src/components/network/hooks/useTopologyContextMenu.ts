import { useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ContextMenuMode, ContextMenuState } from '../networkTopology.types';

interface TopologyContextMenuOptions {
  setContextMenu: (menu: ContextMenuState | null) => void;
  pingMode: boolean;
}

export function useTopologyContextMenu({ setContextMenu, pingMode }: TopologyContextMenuOptions) {
  const openContextMenu = useCallback((clientX: number, clientY: number, deviceId: string | null = null, mode: ContextMenuMode = deviceId ? 'device' : 'canvas', noteId: string | null = null) => {
    const menuWidth = 180;
    const menuHeight = deviceId ? 400 : 200;
    const x = Math.max(10, Math.min(clientX, window.innerWidth - menuWidth - 10));
    const y = Math.max(10, Math.min(clientY, window.innerHeight - menuHeight - 10));
    window.dispatchEvent(new CustomEvent('close-menus-broadcast', { detail: { source: 'topology' } }));
    setContextMenu({ x, y, deviceId, noteId, mode });
  }, [setContextMenu]);

  const handleContextMenu = useCallback((event: ReactMouseEvent, deviceId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (pingMode) return;
    openContextMenu(event.clientX, event.clientY, deviceId || null, deviceId ? 'device' : 'canvas');
  }, [openContextMenu, pingMode]);

  return { openContextMenu, handleContextMenu };
}
