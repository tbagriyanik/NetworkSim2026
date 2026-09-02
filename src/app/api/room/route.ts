import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getActiveRoomCount } from '@/lib/roomStore';
import type { RoomApiResponse, RoomData } from '@/lib/roomTypes';
import { isRateLimited } from '@/lib/security/rateLimiter';
import { sanitizeObject } from '@/lib/security/sanitizer';
import { withErrorHandling } from '@/lib/api/withErrorHandling';
import { validateRoomCode, validateUserId } from '@/lib/security/roomValidation';

import { getClientIp } from '@/lib/security/clientIp';
import { generateRoomSessionToken } from '@/lib/security/roomSession';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_req: NextRequest): Promise<NextResponse> => {
  if (process.env.NEXT_PUBLIC_IS_ROOM_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Room system is disabled', code: 'DISABLED' },
      { status: 503 },
    );
  }
  const count = await getActiveRoomCount();
  return NextResponse.json({ success: true, count }, { status: 200 });
});

export const POST = withErrorHandling(async (req: NextRequest): Promise<NextResponse<RoomApiResponse<RoomData>>> => {
  const ip = getClientIp(req);
  const { allowed } = await isRateLimited(`room_create_${ip}`, 5, 60 * 60 * 1000); // 5 rooms per hour

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many rooms created', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 },
    );
  }

  if (process.env.NEXT_PUBLIC_IS_ROOM_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Room system is disabled', code: 'DISABLED' },
      { status: 503 },
    );
  }
  const rawBody = await req.json();
  const body = sanitizeObject(rawBody) as Record<string, unknown>;
  const { code, teacherId } = body;

  const codeValidation = validateRoomCode(code as string | undefined);
  if (!codeValidation.valid) {
    return NextResponse.json(
      { success: false, error: codeValidation.error, code: codeValidation.code },
      { status: 400 },
    );
  }

  const teacherValidation = validateUserId(teacherId as string | undefined, 'teacher');
  if (!teacherValidation.valid) {
    return NextResponse.json(
      { success: false, error: teacherValidation.error, code: teacherValidation.code },
      { status: 400 },
    );
  }

  const room = await createRoom(codeValidation.normalized, teacherValidation.normalized);
  const sessionToken = generateRoomSessionToken({
    roomCode: codeValidation.normalized,
    userId: teacherValidation.normalized,
    role: 'teacher',
  });

  return NextResponse.json({ success: true, data: { ...room, sessionToken } }, { status: 200 });
});
