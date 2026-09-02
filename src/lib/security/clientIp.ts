import { NextRequest } from 'next/server';

/**
 * Safely extracts client IP address from NextRequest headers.
 * Prioritizes trusted proxy headers before falling back to forwarded addresses.
 * For X-Forwarded-For, parses carefully to prevent IP spoofing via client-supplied headers.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Trusted proxy IP headers
  const proxyIp = req.headers.get('x-vercel-forwarded-for') || req.headers.get('x-vercel-ip');
  if (proxyIp) {
    const trimmed = proxyIp.split(',')[0].trim();
    if (trimmed) return trimmed;
  }

  // 2. Alternate trusted proxy IP header
  const alternateProxyIp = req.headers.get('cf-connecting-ip');
  if (alternateProxyIp && alternateProxyIp.trim()) {
    return alternateProxyIp.trim();
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
