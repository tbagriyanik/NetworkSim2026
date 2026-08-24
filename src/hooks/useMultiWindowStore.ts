'use client';

import { create } from 'zustand';

export interface DeviceWindowItem {
  id: string; // deviceId e.g. "pc-1", "router-1", "sw-1"
  type: string; // "pc", "router", "switchL2", "switchL3", "firewall", "wlc"
  initialTab?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface MultiWindowStoreState {
  openWindows: DeviceWindowItem[];
  windowPositions: Record<string, { x: number; y: number }>;
  windowSizes: Record<string, { width: number; height: number }>;
  windowRestoreRequests: Record<string, number>;
  isSwitcherOpen: boolean;
  switcherSelectedIndex: number;

  openDeviceWindow: (id: string, type: string, initialTab?: string) => void;
  closeDeviceWindow: (id: string) => void;
  closeAllDeviceWindows: () => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  restoreWindow: (id: string) => void;
  isWindowOpen: (id: string) => boolean;

  openSwitcher: (activeWindowId: string | null, reverse?: boolean, fallbackDevices?: DeviceWindowItem[]) => void;
  stepSwitcher: (reverse?: boolean, totalCount?: number) => void;
  setSwitcherSelectedIndex: (index: number) => void;
  closeSwitcher: () => void;
}

const MULTI_WINDOW_STORAGE_KEY = 'netsim_multi_device_windows';
type PersistedWindowState = Pick<MultiWindowStoreState, 'openWindows' | 'windowPositions' | 'windowSizes'>;

const readPersistedWindowState = (): PersistedWindowState => {
  if (typeof window === 'undefined') {
    return { openWindows: [], windowPositions: {}, windowSizes: {} };
  }

  try {
    const stored = localStorage.getItem(MULTI_WINDOW_STORAGE_KEY);
    if (!stored) return { openWindows: [], windowPositions: {}, windowSizes: {} };

    const parsed = JSON.parse(stored) as Partial<PersistedWindowState>;
    return {
      openWindows: Array.isArray(parsed.openWindows) ? parsed.openWindows : [],
      windowPositions: parsed.windowPositions && typeof parsed.windowPositions === 'object' ? parsed.windowPositions : {},
      windowSizes: parsed.windowSizes && typeof parsed.windowSizes === 'object' ? parsed.windowSizes : {},
    };
  } catch {
    return { openWindows: [], windowPositions: {}, windowSizes: {} };
  }
};

const initialWindowState = readPersistedWindowState();

export const useMultiWindowStore = create<MultiWindowStoreState>((set, get) => ({
  ...initialWindowState,
  windowRestoreRequests: {},
  isSwitcherOpen: false,
  switcherSelectedIndex: 0,

  openDeviceWindow: (id: string, type: string, initialTab?: string) => {
    const { openWindows, windowPositions, windowSizes } = get();
    const existingIndex = openWindows.findIndex((w) => w.id === id);

    if (existingIndex !== -1) {
      const updated = [...openWindows];
      updated[existingIndex] = {
        ...updated[existingIndex],
        type,
        ...(initialTab ? { initialTab } : {}),
      };
      set((state) => ({
        openWindows: updated,
        windowRestoreRequests: {
          ...state.windowRestoreRequests,
          [id]: (state.windowRestoreRequests[id] || 0) + 1,
        },
      }));
    } else {
      const count = openWindows.length;
      const defaultX = typeof window !== 'undefined'
        ? Math.max(40, Math.min(window.innerWidth - 650, 120 + (count % 8) * 35))
        : 120;
      const defaultY = typeof window !== 'undefined'
        ? Math.max(40, Math.min(window.innerHeight - 550, 80 + (count % 8) * 35))
        : 80;

      const pos = windowPositions[id] || { x: defaultX, y: defaultY };
      const size = windowSizes[id] || {
        width: type === 'pc' ? 700 : type === 'firewall' ? 750 : 720,
        height: type === 'pc' ? 550 : type === 'firewall' ? 580 : 540,
      };

      set({
        openWindows: [
          ...openWindows,
          { id, type, initialTab, x: pos.x, y: pos.y, width: size.width, height: size.height },
        ],
        windowPositions: { ...windowPositions, [id]: pos },
        windowSizes: { ...windowSizes, [id]: size },
      });
    }
  },

  closeDeviceWindow: (id: string) => {
    set((state) => {
      const remaining = state.openWindows.filter((w) => w.id !== id);
      const nextIndex = Math.min(state.switcherSelectedIndex, Math.max(0, remaining.length - 1));
      return {
        openWindows: remaining,
        switcherSelectedIndex: nextIndex,
        isSwitcherOpen: remaining.length === 0 ? false : state.isSwitcherOpen,
      };
    });
  },

  closeAllDeviceWindows: () => {
    set({ openWindows: [], isSwitcherOpen: false, switcherSelectedIndex: 0 });
  },

  updateWindowPosition: (id: string, position: { x: number; y: number }) => {
    set((state) => ({
      windowPositions: { ...state.windowPositions, [id]: position },
      openWindows: state.openWindows.map((w) => (w.id === id ? { ...w, ...position } : w)),
    }));
  },

  updateWindowSize: (id: string, size: { width: number; height: number }) => {
    set((state) => ({
      windowSizes: { ...state.windowSizes, [id]: size },
      openWindows: state.openWindows.map((w) => (w.id === id ? { ...w, ...size } : w)),
    }));
  },

  restoreWindow: (id: string) => {
    set((state) => ({
      windowRestoreRequests: {
        ...state.windowRestoreRequests,
        [id]: (state.windowRestoreRequests[id] || 0) + 1,
      },
    }));
  },

  isWindowOpen: (id: string) => {
    return get().openWindows.some((w) => w.id === id);
  },

  openSwitcher: (activeWindowId: string | null, reverse = false, fallbackDevices: DeviceWindowItem[] = []) => {
    const { openWindows, isSwitcherOpen, stepSwitcher } = get();
    const list = openWindows.length > 0 ? openWindows : fallbackDevices;
    if (list.length === 0) return;

    if (isSwitcherOpen) {
      stepSwitcher(reverse, list.length);
      return;
    }

    const curIndex = list.findIndex((w) => w.id === activeWindowId);
    let nextIndex: number;
    if (reverse) {
      nextIndex = curIndex <= 0 ? list.length - 1 : curIndex - 1;
    } else {
      nextIndex = curIndex === -1 ? 0 : (curIndex + 1) % list.length;
    }

    set({ isSwitcherOpen: true, switcherSelectedIndex: nextIndex });
  },

  stepSwitcher: (reverse = false, totalCount?: number) => {
    const { openWindows, switcherSelectedIndex } = get();
    const len = totalCount ?? openWindows.length;
    if (len === 0) return;

    let nextIndex: number;
    if (reverse) {
      nextIndex = switcherSelectedIndex <= 0 ? len - 1 : switcherSelectedIndex - 1;
    } else {
      nextIndex = (switcherSelectedIndex + 1) % len;
    }

    set({ switcherSelectedIndex: nextIndex });
  },

  setSwitcherSelectedIndex: (index: number) => {
    set({ switcherSelectedIndex: index });
  },

  closeSwitcher: () => {
    set({ isSwitcherOpen: false });
  },
}));

if (typeof window !== 'undefined') {
  useMultiWindowStore.subscribe((state) => {
    try {
      const persistedState: PersistedWindowState = {
        openWindows: state.openWindows,
        windowPositions: state.windowPositions,
        windowSizes: state.windowSizes,
      };
      localStorage.setItem(MULTI_WINDOW_STORAGE_KEY, JSON.stringify(persistedState));
    } catch {
      // Storage may be unavailable in private or restricted browsing contexts.
    }
  });
}
