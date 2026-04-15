import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeHTML,
  sanitizeHTTPContent,
  sanitizeInput,
  sanitizeObject,
  validateEmail,
  validateIPAddress,
  validateSubnetMask,
  validateMACAddress,
  validateURL,
  escapeJSON,
  safeParseJSON,
  validateConfigData,
  secureLocalStorage,
  generateSecureToken,
} from '@/lib/security/sanitizer';

describe('security/sanitizer', () => {
  it('sanitizeHTML escapes tags', () => {
    expect(sanitizeHTML('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('sanitizeHTTPContent only allows <b>/<i>/<u> tags (escaped otherwise)', () => {
    const input = `<b>bold</b> <i>ital</i> <u>u</u> <script>alert(1)</script>`;
    const out = sanitizeHTTPContent(input);
    expect(out).toContain('<b>bold</b>');
    expect(out).toContain('<i>ital</i>');
    expect(out).toContain('<u>u</u>');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('sanitizeInput strips dangerous tokens', () => {
    expect(sanitizeInput(' javascript:alert(1) <b>`x`</b> ')).toBe('alert(1) bx/b');
  });

  it('sanitizeObject recursively sanitizes keys and string values', () => {
    const input = {
      '<k>': ' javascript:alert(1) ',
      nested: [{ a: '<x>' }],
    };
    expect(sanitizeObject(input)).toEqual({
      k: 'alert(1)',
      nested: [{ a: 'x' }],
    });
  });

  it('validates basic formats', () => {
    expect(validateEmail('a@b.com')).toBe(true);
    expect(validateEmail('nope')).toBe(false);

    expect(validateIPAddress('192.168.1.1')).toBe(true);
    expect(validateIPAddress('999.1.1.1')).toBe(false);

    expect(validateSubnetMask('255.255.255.0')).toBe(true);
    expect(validateSubnetMask('255.0.255.0')).toBe(false);

    expect(validateMACAddress('aa:bb:cc:dd:ee:ff')).toBe(true);
    expect(validateMACAddress('0000.0000.0000')).toBe(true);
    expect(validateMACAddress('zz:bb:cc:dd:ee:ff')).toBe(false);

    expect(validateURL('https://example.com')).toBe(true);
    expect(validateURL('not a url')).toBe(false);
  });

  it('escapeJSON returns safely escaped JSON string', () => {
    const s = escapeJSON({ k: 'a"b\\c\n' });
    expect(s).toContain('\\"');
    expect(s).toContain('\\\\');
    expect(s).not.toContain('\\n');
  });

  it('safeParseJSON returns fallback on invalid JSON', () => {
    expect(safeParseJSON('{"a":"<x>"}', { a: '' })).toEqual({ a: 'x' });
    expect(safeParseJSON('{oops', { ok: true })).toEqual({ ok: true });
  });

  it('validateConfigData reports errors', () => {
    expect(validateConfigData({} as any).valid).toBe(false);
    expect(validateConfigData({ name: 'n', ip: '999.1.1.1' }).errors).toContain('Invalid IP address format');
  });

  it('secureLocalStorage sanitizes keys and round-trips JSON', () => {
    const storage = secureLocalStorage();
    storage.setItem('<k>', { a: '<x>' });
    expect(window.localStorage.getItem('k')).toBeTruthy();
    expect(storage.getItem('<k>')).toEqual({ a: '<x>' });
    storage.removeItem('<k>');
    expect(window.localStorage.getItem('k')).toBeNull();
  });

  it('generateSecureToken returns expected length and charset', () => {
    // Stabilize randomness for deterministic tests
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((arr: any) => {
      for (let i = 0; i < arr.length; i += 1) arr[i] = i;
      return arr;
    });

    const token = generateSecureToken(16);
    expect(token).toHaveLength(16);
    expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);

    spy.mockRestore();
  });

  beforeEach(() => {
    // keep localStorage clean between tests
    window.localStorage.clear();
  });
});
