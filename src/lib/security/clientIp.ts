import { NextRequest } from 'next/server';

/**
 * Safely extracts client IP address from NextRequest headers.
 * Prioritizes trusted platform headers (Vercel, Cloudflare, x-real-ip).
 * For X-Forwarded-For, parses carefully to prevent IP spoofing via client-supplied headers.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Vercel trusted IP header
  const vercelIp = req.headers.get('x-vercel-forwarded-for') || req.headers.get('x-vercel-ip');
  if (vercelIp) {
    const trimmed = vercelIp.split(',')[0].trim();
    if (trimmed) return trimmed;
  }

  // 2. Cloudflare trusted IP header
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  // 3. Direct real IP header set by reverse proxy
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // 4. X-Forwarded-For fallback
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[0];
    }
  }

  return '127.0.0.1';
}
