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
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
});

import { getTabId, getTabSpecificKey, createTabSpecificStorage, clearTabData, getActiveTabCount } from '@/lib/store/tabStorage';

describe('tabStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getTabId', () => {
    it('should generate a tab ID if none exists', () => {
      const tabId = getTabId();
      expect(tabId).toMatch(/^tab-/);
    });
  });

  describe('getTabSpecificKey', () => {
    it('should create prefixed key with tab ID', () => {
      const key = getTabSpecificKey('test-key');
      expect(key).toMatch(/^netsim-tab-/);
      expect(key).toContain('test-key');
    });
  });

  describe('createTabSpecificStorage', () => {
    it('should create storage with getItem/setItem/removeItem', () => {
      const storage = createTabSpecificStorage();
      expect(storage).toBeDefined();
      expect(storage?.getItem).toBeInstanceOf(Function);
      expect(storage?.setItem).toBeInstanceOf(Function);
      expect(storage?.removeItem).toBeInstanceOf(Function);
    });

    it('should delegate getItem to localStorage with tab key', () => {
      const storage = createTabSpecificStorage();
      storage?.getItem('base-key');
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });

    it('should delegate setItem to localStorage with tab key', () => {
      const storage = createTabSpecificStorage();
      storage?.setItem('base-key', { state: 'value' });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should delegate removeItem to localStorage with tab key', () => {
      const storage = createTabSpecificStorage();
      storage?.removeItem('base-key');
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('clearTabData', () => {
    it('should remove items with matching prefix', () => {
      localStorageMock.setItem('netsim-tab-abc-base', 'val');
      localStorageMock.setItem('netsim-tab-abc-other', 'val2');
      localStorageMock.setItem('netsim-tab-xyz-base', 'val3');
      clearTabData('abc');
      expect(localStorageMock.getItem('netsim-tab-abc-base')).toBeNull();
      expect(localStorageMock.getItem('netsim-tab-xyz-base')).toBe('val3');
    });
  });

  describe('getActiveTabCount', () => {
    it('should return 1 when no tab data exists', () => {
      const count = getActiveTabCount();
      expect(count).toBe(1);
    });

    it('should count unique tab IDs', () => {
      localStorageMock.setItem('netsim-tab-abc-key1', 'val1');
      localStorageMock.setItem('netsim-tab-abc-key2', 'val2');
      localStorageMock.setItem('netsim-tab-xyz-key1', 'val3');
      const count = getActiveTabCount();
      expect(count).toBe(2);
    });
  });
});
