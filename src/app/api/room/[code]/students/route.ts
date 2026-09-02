import { NextRequest, NextResponse } from 'next/server';
import { getRoomStudents, getRoomMeta, claimRoom } from '@/lib/roomStore';
import type { RoomApiResponse, StudentProgress } from '@/lib/roomTypes';
import { isRateLimited } from '@/lib/security/rateLimiter';
import { sanitizeInput } from '@/lib/security/sanitizer';
import { withErrorHandling } from '@/lib/api/withErrorHandling';
import { validateRoomCode, validateUserId } from '@/lib/security/roomValidation';

import { getClientIp } from '@/lib/security/clientIp';
import { verifyRoomSessionToken } from '@/lib/security/roomSession';

interface RouteParams {
  code: string;
}

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse<RoomApiResponse<StudentProgress[]>>> => {
  const ip = getClientIp(req);
  const { allowed } = await isRateLimited(`room_view_${ip}`, 100, 60 * 1000); // 100 requests per minute

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 },
    );
  }

  if (process.env.NEXT_PUBLIC_IS_ROOM_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Room system is disabled', code: 'DISABLED' },
      { status: 503 },
    );
  }
  const { code } = await params;

  const codeValidation = validateRoomCode(code);
  if (!codeValidation.valid) {
    return NextResponse.json(
      { success: false, error: codeValidation.error, code: codeValidation.code },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const rawTeacherId = url.searchParams.get('teacherId');
  const teacherId = rawTeacherId ? sanitizeInput(rawTeacherId) : null;
  const teacherValidation = validateUserId(teacherId, 'teacher');
  if (!teacherValidation.valid) {
    return NextResponse.json(
      { success: false, error: teacherValidation.error, code: teacherValidation.code },
      { status: 400 },
    );
  }

  const meta = await getRoomMeta(codeValidation.normalized);
  if (!meta) {
    return NextResponse.json(
      { success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' },
      { status: 404 },
    );
  }

  // Session Token Authorization Check for Teacher
  const sessionToken = req.headers.get('x-room-session-token');
  const isValidSession = verifyRoomSessionToken(sessionToken, {
    roomCode: codeValidation.normalized,
    userId: teacherValidation.normalized,
    role: 'teacher',
  });

  // Backward compatibility: if room has no teacherId, claim it for this browser
  if (!meta.teacherId) {
    await claimRoom(codeValidation.normalized, teacherValidation.normalized);
  } else if (meta.teacherId !== teacherValidation.normalized || !isValidSession) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized to view this room', code: 'UNAUTHORIZED' },
      { status: 403 },
    );
  }

  const students = await getRoomStudents(codeValidation.normalized);
  return NextResponse.json({ success: true, data: students }, { status: 200 });
});
