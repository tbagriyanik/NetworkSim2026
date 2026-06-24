import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFromStorage, setToStorage, removeFromStorage } from '@/lib/logger';

const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

describe('logger storage utilities', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('getFromStorage', () => {
    it('should return null for missing key', () => {
      const result = getFromStorage('nonexistent', mockStorage as unknown as Storage);
      expect(result).toBeNull();
    });

    it('should retrieve stored value', () => {
      mockStorage.setItem('test-key', 'test-value');
      const result = getFromStorage('test-key', mockStorage as unknown as Storage);
      expect(result).toBe('test-value');
    });
  });

  describe('setToStorage', () => {
    it('should store a value and return true', () => {
      const result = setToStorage('key', 'value', mockStorage as unknown as Storage);
      expect(result).toBe(true);
      expect(mockStorage.getItem('key')).toBe('value');
    });

    it('should overwrite existing value', () => {
      setToStorage('key', 'first', mockStorage as unknown as Storage);
      setToStorage('key', 'second', mockStorage as unknown as Storage);
      expect(mockStorage.getItem('key')).toBe('second');
    });
  });

  describe('removeFromStorage', () => {
    it('should remove a value and return true', () => {
      mockStorage.setItem('key', 'value');
      const result = removeFromStorage('key', mockStorage as unknown as Storage);
      expect(result).toBe(true);
      expect(mockStorage.getItem('key')).toBeNull();
    });

    it('should return true for non-existent key', () => {
      const result = removeFromStorage('nonexistent', mockStorage as unknown as Storage);
      expect(result).toBe(true);
    });
  });
});
