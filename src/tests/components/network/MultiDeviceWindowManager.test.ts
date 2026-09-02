import { describe, it, expect, beforeEach } from 'vitest';
import { useMultiWindowStore } from '@/hooks/useMultiWindowStore';
import { useWindowStore } from '@/hooks/useWindowStore';

describe('useMultiWindowStore multi-window tests', () => {
  beforeEach(() => {
    useMultiWindowStore.getState().closeAllDeviceWindows();
  });

  it('should open independent windows for multiple devices', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc', 'home');
    store.openDeviceWindow('pc-2', 'pc', 'home');
    store.openDeviceWindow('sw-1', 'switchL2', 'console');
    store.openDeviceWindow('router-1', 'router', 'console');
    store.openDeviceWindow('fw-1', 'firewall', 'console');

    const windows = useMultiWindowStore.getState().openWindows;
    expect(windows).toHaveLength(5);
    expect(windows.map(w => w.id)).toEqual(['pc-1', 'pc-2', 'sw-1', 'router-1', 'fw-1']);
    expect(useMultiWindowStore.getState().isWindowOpen('pc-1')).toBe(true);
    expect(useMultiWindowStore.getState().isWindowOpen('sw-1')).toBe(true);
  });

  it('should not duplicate window when opening an already open device', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc', 'home');
    store.openDeviceWindow('pc-1', 'pc', 'desktop');

    const windows = useMultiWindowStore.getState().openWindows;
    expect(windows).toHaveLength(1);
    expect(windows[0].id).toBe('pc-1');
    expect(windows[0].initialTab).toBe('desktop');
  });

  it('should close individual device windows independently', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc');
    store.openDeviceWindow('pc-2', 'pc');
    store.openDeviceWindow('sw-1', 'switchL2');

    store.closeDeviceWindow('pc-1');

    const windows = useMultiWindowStore.getState().openWindows;
    expect(windows).toHaveLength(2);
    expect(windows.map(w => w.id)).toEqual(['pc-2', 'sw-1']);
    expect(useMultiWindowStore.getState().isWindowOpen('pc-1')).toBe(false);
  });

  it('should stagger positions for newly opened windows', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc');
    store.openDeviceWindow('pc-2', 'pc');

    const windows = useMultiWindowStore.getState().openWindows;
    expect(windows[0].x).not.toBe(windows[1].x);
    expect(windows[0].y).not.toBe(windows[1].y);
  });

  it('should loop through open windows', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc');
    store.openDeviceWindow('sw-1', 'switchL2');
    store.openDeviceWindow('router-1', 'router');

    useWindowStore.getState().setActiveWindow('pc-1');
    expect(useWindowStore.getState().activeWindowId).toBe('pc-1');

    const getNextWindowId = () => {
      const openWins = useMultiWindowStore.getState().openWindows;
      const currentId = useWindowStore.getState().activeWindowId;
      const curIdx = openWins.findIndex(w => w.id === currentId);
      const nextIdx = (curIdx + 1) % openWins.length;
      return openWins[nextIdx]?.id;
    };

    const firstNext = getNextWindowId();
    if (firstNext) useWindowStore.getState().setActiveWindow(firstNext);
    expect(useWindowStore.getState().activeWindowId).toBe('sw-1');

    const secondNext = getNextWindowId();
    if (secondNext) useWindowStore.getState().setActiveWindow(secondNext);
    expect(useWindowStore.getState().activeWindowId).toBe('router-1');

    const thirdNext = getNextWindowId();
    if (thirdNext) useWindowStore.getState().setActiveWindow(thirdNext);
    expect(useWindowStore.getState().activeWindowId).toBe('pc-1');
  });

  it('should elevate zIndex per distinct device window on focus', () => {
    useWindowStore.getState().setActiveWindow('pc-1');
    const z1 = useWindowStore.getState().windowZIndices['pc-1'];

    useWindowStore.getState().setActiveWindow('sw-1');
    const z2 = useWindowStore.getState().windowZIndices['sw-1'];

    expect(z2).toBeGreaterThan(z1);
    expect(useWindowStore.getState().activeWindowId).toBe('sw-1');

    useWindowStore.getState().setActiveWindow('pc-1');
    const z3 = useWindowStore.getState().windowZIndices['pc-1'];
    expect(z3).toBeGreaterThan(z2);
    expect(useWindowStore.getState().activeWindowId).toBe('pc-1');
  });

  it('should handle openSwitcher and stepSwitcher loop navigation', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc');
    store.openDeviceWindow('sw-1', 'switchL2');
    store.openDeviceWindow('router-1', 'router');

    useWindowStore.getState().setActiveWindow('pc-1');

    useMultiWindowStore.getState().openSwitcher('pc-1');
    expect(useMultiWindowStore.getState().isSwitcherOpen).toBe(true);
    expect(useMultiWindowStore.getState().switcherSelectedIndex).toBe(1);

    useMultiWindowStore.getState().stepSwitcher();
    expect(useMultiWindowStore.getState().switcherSelectedIndex).toBe(2);

    useMultiWindowStore.getState().stepSwitcher();
    expect(useMultiWindowStore.getState().switcherSelectedIndex).toBe(0);

    useMultiWindowStore.getState().stepSwitcher(true);
    expect(useMultiWindowStore.getState().switcherSelectedIndex).toBe(2);

    useMultiWindowStore.getState().closeSwitcher();
    expect(useMultiWindowStore.getState().isSwitcherOpen).toBe(false);
  });

  it('should calculate side-by-side split view layout positions', () => {
    const store = useMultiWindowStore.getState();

    store.openDeviceWindow('pc-1', 'pc');
    store.openDeviceWindow('router-1', 'router');

    store.splitViewSideBySide();

    expect(useMultiWindowStore.getState().layoutMode).toBe('split');
    const positions = useMultiWindowStore.getState().windowPositions;
    const sizes = useMultiWindowStore.getState().windowSizes;

    expect(positions['pc-1']).toBeDefined();
    expect(positions['router-1']).toBeDefined();
    expect(sizes['pc-1'].width).toBeGreaterThan(0);
    expect(sizes['router-1'].width).toBeGreaterThan(0);
  });

  it('should change layoutMode state correctly', () => {
    const store = useMultiWindowStore.getState();

    store.setLayoutMode('tabs');
    expect(useMultiWindowStore.getState().layoutMode).toBe('tabs');

    store.setLayoutMode('free');
    expect(useMultiWindowStore.getState().layoutMode).toBe('free');
  });
});
