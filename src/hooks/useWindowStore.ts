import { create } from 'zustand';

interface WindowState {
  activeWindowId: string | null;
  globalZIndex: number;
  windowZIndices: Record<string, number>;
  setActiveWindow: (id: string) => number;
}

export const useWindowStore = create<WindowState>((set, get) => ({
  activeWindowId: null,
  globalZIndex: 100,
  windowZIndices: {},
  setActiveWindow: (id: string) => {
    let newZIndex = get().globalZIndex + 1;
    if (newZIndex > 9999) newZIndex = 100;

    set((state) => ({
      activeWindowId: id,
      globalZIndex: newZIndex,
      windowZIndices: { ...state.windowZIndices, [id]: newZIndex },
    }));
    return newZIndex;
  },
}));
