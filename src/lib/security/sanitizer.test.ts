import { describe, it, expect } from 'vitest';
import { sanitizeInput } from './sanitizer';

describe('sanitizeInput', () => {
  it('should remove javascript: schemes', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('should remove data: schemes', () => {
    // Current implementation: data:text/html -> text/html
    expect(sanitizeInput('data:text/html')).toBe('text/html');
  });

  it('should remove vbscript: schemes', () => {
    expect(sanitizeInput('vbscript:msgbox("Hi")')).toBe('msgbox("Hi")');
  });

  it('should remove file: schemes', () => {
    expect(sanitizeInput('file:///etc/passwd')).toBe('///etc/passwd');
  });

  it('should handle nested/recursive schemes', () => {
    // javascript:data:alert(1) -> data:alert(1) -> alert(1)
    expect(sanitizeInput('javascript:data:alert(1)')).toBe('alert(1)');
    expect(sanitizeInput('java<javascript:>script:alert(1)')).toBe('alert(1)');
  });

  it('should strip HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeInput('<div>Hello</div>')).toBe('Hello');
  });

  it('should preserve safe text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
    expect(sanitizeInput('192.168.1.1')).toBe('192.168.1.1');
  });
});
