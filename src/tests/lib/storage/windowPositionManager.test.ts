import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { saveWindowPositions, restoreWindowPositions, clearWindowPositionsBackup, getWindowPositionsBackup } from '@/lib/storage/windowPositionManager';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

describe('windowPositionManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveWindowPositions', () => {
    it('should save modal positions', () => {
      localStorageMock.setItem('tasks-modal-position', JSON.stringify({ x: 100, y: 200 }));
      localStorageMock.setItem('tasks-modal-size', JSON.stringify({ width: 400, height: 300 }));

      saveWindowPositions();

      const backup = getWindowPositionsBackup();
      expect(backup?.tasks).toBeDefined();
      expect(backup?.tasks?.position).toEqual({ x: 100, y: 200 });
    });

    it('should skip missing modals gracefully', () => {
      saveWindowPositions();
      const backup = getWindowPositionsBackup();
      expect(backup).toBeDefined();
    });
  });

  describe('restoreWindowPositions', () => {
    it('should restore modal positions from backup', () => {
      localStorageMock.setItem('netsim_window_positions_backup', JSON.stringify({
        tasks: { position: { x: 50, y: 60 }, size: { width: 500, height: 400 } },
      }));

      restoreWindowPositions();

      expect(localStorageMock.getItem('tasks-modal-position')).toBe(JSON.stringify({ x: 50, y: 60 }));
      expect(localStorageMock.getItem('tasks-modal-size')).toBe(JSON.stringify({ width: 500, height: 400 }));
    });

    it('should do nothing if no backup exists', () => {
      restoreWindowPositions();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('clearWindowPositionsBackup', () => {
    it('should remove backup', () => {
      localStorageMock.setItem('netsim_window_positions_backup', 'data');
      clearWindowPositionsBackup();
      expect(localStorageMock.getItem('netsim_window_positions_backup')).toBeNull();
    });
  });

  describe('getWindowPositionsBackup', () => {
    it('should return null when no backup', () => {
      expect(getWindowPositionsBackup()).toBeNull();
    });

    it('should return parsed backup', () => {
      localStorageMock.setItem('netsim_window_positions_backup', JSON.stringify({ cli: { position: { x: 1, y: 2 }, size: { w: 3, h: 4 } } }));
      const result = getWindowPositionsBackup();
      expect(result?.cli?.position.x).toBe(1);
    });
  });
});
