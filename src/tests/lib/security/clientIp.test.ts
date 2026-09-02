import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/security/clientIp';

describe('getClientIp Security Helper', () => {
  it('should prioritize x-vercel-forwarded-for header', () => {
    const req = new NextRequest('http://localhost', {
      headers: {
        'x-vercel-forwarded-for': '203.0.113.195, 10.0.0.1',
        'x-forwarded-for': '1.1.1.1',
      },
    });
    expect(getClientIp(req)).toBe('203.0.113.195');
  });

  it('should prioritize cf-connecting-ip when present', () => {
    const req = new NextRequest('http://localhost', {
      headers: {
        'cf-connecting-ip': '198.51.100.42',
        'x-forwarded-for': '1.1.1.1',
      },
    });
    expect(getClientIp(req)).toBe('198.51.100.42');
  });

  it('should use x-real-ip when trusted proxy headers are missing', () => {
    const req = new NextRequest('http://localhost', {
      headers: {
        'x-real-ip': '192.0.2.1',
        'x-forwarded-for': '10.0.0.2',
      },
    });
    expect(getClientIp(req)).toBe('192.0.2.1');
  });

  it('should fallback to first entry in x-forwarded-for if no platform headers present', () => {
    const req = new NextRequest('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.5, 10.0.0.1',
      },
    });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });
});
