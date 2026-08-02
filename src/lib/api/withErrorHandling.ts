import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

type ApiHandler<TContext = unknown> = (
  req: NextRequest,
  context: TContext
) => Promise<NextResponse> | NextResponse;

/**
 * A wrapper for Next.js App Router API routes to consolidate error handling and enforce request boundaries.
 * Catches all unhandled exceptions, logs them safely, and returns a standard 500 JSON response.
 *
 * SENTINEL SECURITY ENHANCEMENT:
 * Implements a strict content-length limit (256KB) for all incoming API payloads
 * to protect server memory and serverless runtimes from payload-based Denial of Service (DoS) attacks.
 */
export function withErrorHandling<TContext = unknown>(handler: ApiHandler<TContext>): ApiHandler<TContext> {
  return async (req: NextRequest, context: TContext) => {
    try {
      // Enforce strict payload size limits to mitigate DoS via memory exhaustion
      const contentLengthHeader = req.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (!isNaN(contentLength) && contentLength > 256 * 1024) { // 256KB safe maximum payload limit
          logger.warn(`Rejected excessively large request body payload (${contentLength} bytes) to protect endpoint ${req.nextUrl.pathname}`);
          return NextResponse.json(
            { success: false, error: 'Payload too large', code: 'PAYLOAD_TOO_LARGE' },
            { status: 413 }
          );
        }
      }

      return await handler(req, context);
    } catch (err) {
      logger.error(`API Error in ${req.method} ${req.nextUrl.pathname}:`, err);
      return NextResponse.json(
        { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}
