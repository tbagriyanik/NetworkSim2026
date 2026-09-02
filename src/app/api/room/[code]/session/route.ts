import { NextRequest, NextResponse } from 'next/server';
import { generateRoomSessionToken } from '@/lib/security/roomSession';
import { validateRoomCode, validateUserId } from '@/lib/security/roomValidation';
import { checkRoomExists, getRoomMeta } from '@/lib/roomStore';
import { withErrorHandling } from '@/lib/api/withErrorHandling';
import { getClientIp } from '@/lib/security/clientIp';
import { isRateLimited } from '@/lib/security/rateLimiter';
import type { RoomApiResponse } from '@/lib/roomTypes';

export const dynamic = 'force-dynamic';

interface RouteParams {
  code: string;
}

export const POST = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse<RoomApiResponse<{ sessionToken: string }>>> => {
  const ip = getClientIp(req);
  const { allowed } = await isRateLimited(`room_session_${ip}`, 60, 60 * 1000); // 60 session issues per min
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many session requests', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }

  if (process.env.NEXT_PUBLIC_IS_ROOM_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Room system is disabled', code: 'DISABLED' },
      { status: 503 }
    );
  }

  const { code } = await params;
  const codeVal = validateRoomCode(code);
  if (!codeVal.valid) {
    return NextResponse.json(
      { success: false, error: codeVal.error, code: codeVal.code },
      { status: 400 }
    );
  }

  const roomExists = await checkRoomExists(codeVal.normalized);
  if (!roomExists) {
    return NextResponse.json(
      { success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { userId, role } = body || {};

  const userRole = role === 'teacher' ? 'teacher' : 'student';
  const userVal = validateUserId(userId, userRole);
  if (!userVal.valid) {
    return NextResponse.json(
      { success: false, error: userVal.error, code: userVal.code },
      { status: 400 }
    );
  }

  // If role is teacher, verify they match room meta if room meta exists
  if (userRole === 'teacher') {
    const meta = await getRoomMeta(codeVal.normalized);
    if (meta && meta.teacherId && meta.teacherId !== userVal.normalized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized teacher ID for room', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }
  }

  const sessionToken = generateRoomSessionToken({
    roomCode: codeVal.normalized,
    userId: userVal.normalized,
    role: userRole,
  });

  return NextResponse.json({ success: true, data: { sessionToken } }, { status: 200 });
});
