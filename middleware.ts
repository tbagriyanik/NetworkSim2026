import { NextRequest, NextResponse } from 'next/server';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, isValidCsrfRequest } from './src/lib/security/csrf';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Middleware that generates a per‑request CSP header.
 * Uses `unsafe-inline` to allow inline scripts in srcdoc iframe content
 * (IoT web panel, router admin page, etc.).
 */
export function middleware(request: NextRequest) {
  // Generate a random nonce for this request
  const nonce = generateNonce();
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' blob: 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  const isProd = process.env.NODE_ENV === 'production';
  const cspReportOnlyBase = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' blob: 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ');
  const cspReportOnly = isProd
    ? `${cspReportOnlyBase}; require-trusted-types-for 'script'; trusted-types default; report-uri /csp-report`
    : cspReportOnlyBase;

  const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
  const isUnsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);

  if (isApiRequest && isUnsafeMethod && !isValidCsrfRequest(request.headers.get('cookie'), request.headers.get(CSRF_HEADER_NAME))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  if (isApiRequest && request.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    preflight.headers.set('Allow', 'GET, HEAD, POST, OPTIONS');
    return preflight;
  }

  const response = NextResponse.next();
  if (isApiRequest) {
    const origin = request.headers.get('origin');
    if (origin === request.nextUrl.origin) response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Headers', `Content-Type, ${CSRF_HEADER_NAME}`);
    response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  }
  if (!request.cookies.has(CSRF_COOKIE_NAME)) {
    response.cookies.set(CSRF_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
  response.headers.set('Content-Security-Policy', csp);
  // Expose the nonce to the client for inline script tags
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy-Report-Only', cspReportOnly);

  return response;
}

export const config = { matcher: '/((?!_next/static|_next/image|favicon.ico).*)' };
