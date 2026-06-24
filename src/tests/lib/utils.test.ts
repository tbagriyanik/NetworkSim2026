import { describe, it, expect } from 'vitest';
import { cn, isValidMAC, normalizeMAC } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should return empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('isValidMAC', () => {
  it('should accept canonical MAC format (colons)', () => {
    expect(isValidMAC('00:11:22:33:44:55')).toBe(true);
  });

  it('should accept canonical MAC format (hyphens)', () => {
    expect(isValidMAC('AA-BB-CC-DD-EE-FF')).toBe(true);
  });

  it('should accept dotted MAC format', () => {
    expect(isValidMAC('950B.ACBE.D015')).toBe(true);
  });

  it('should reject invalid MAC', () => {
    expect(isValidMAC('not-a-mac')).toBe(false);
  });

  it('should reject too short MAC', () => {
    expect(isValidMAC('00:11:22:33:44')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidMAC('')).toBe(false);
  });
});

describe('normalizeMAC', () => {
  it('should normalize colon-separated MAC', () => {
    expect(normalizeMAC('00:11:22:33:44:55')).toBe('00-11-22-33-44-55');
  });

  it('should convert to lowercase', () => {
    expect(normalizeMAC('AA:BB:CC:DD:EE:FF')).toBe('aa-bb-cc-dd-ee-ff');
  });

  it('should handle dotted MAC format', () => {
    expect(normalizeMAC('aabb.ccdd.eeff')).toBe('aa-bb-cc-dd-ee-ff');
  });

  it('should return as-is for invalid length', () => {
    expect(normalizeMAC('invalid')).toBe('invalid');
  });
});
