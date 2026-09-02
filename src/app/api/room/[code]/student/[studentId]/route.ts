import { NextRequest, NextResponse } from 'next/server';
import { updateStudent } from '@/lib/roomStore';
import type { RoomApiResponse, StudentProgress } from '@/lib/roomTypes';
import { isRateLimited } from '@/lib/security/rateLimiter';
import { sanitizeObject } from '@/lib/security/sanitizer';
import { withErrorHandling } from '@/lib/api/withErrorHandling';
import { validateRoomCode, validateUserId } from '@/lib/security/roomValidation';

import { getClientIp } from '@/lib/security/clientIp';
import { verifyRoomSessionToken } from '@/lib/security/roomSession';

interface RouteParams {
  code: string;
  studentId: string;
}

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse<RoomApiResponse<StudentProgress>>> => {
  const ip = getClientIp(req);
  const { allowed } = await isRateLimited(`room_update_${ip}`, 30, 60 * 1000); // 30 updates per minute

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many updates', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 },
    );
  }

  if (process.env.NEXT_PUBLIC_IS_ROOM_ENABLED !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Room system is disabled', code: 'DISABLED' },
      { status: 503 },
    );
  }
  const { code, studentId: rawStudentId } = await params;

  const codeValidation = validateRoomCode(code);
  if (!codeValidation.valid) {
    return NextResponse.json(
      { success: false, error: codeValidation.error, code: codeValidation.code },
      { status: 400 },
    );
  }

  const studentValidation = validateUserId(rawStudentId, 'student');
  if (!studentValidation.valid) {
    return NextResponse.json(
      { success: false, error: studentValidation.error, code: studentValidation.code },
      { status: 400 },
    );
  }
  const studentId = studentValidation.normalized;

  // Session Token Authorization Check
  const sessionToken = req.headers.get('x-room-session-token');
  const isValidSession = verifyRoomSessionToken(sessionToken, {
    roomCode: codeValidation.normalized,
    userId: studentId,
    role: 'student',
  });

  if (!isValidSession) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing room session token', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const rawBody = await req.json();
  const body = sanitizeObject(rawBody) as Record<string, unknown>;
  const { displayName, currentTask, completedTasks, totalTasks, projectFile, durationMinutes } = body;

  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
    return NextResponse.json(
      { success: false, error: 'Invalid display name', code: 'INVALID_NAME' },
      { status: 400 },
    );
  }

  if (currentTask !== undefined && (typeof currentTask !== 'string' || currentTask.length > 200)) {
    return NextResponse.json(
      { success: false, error: 'Invalid task name', code: 'INVALID_TASK' },
      { status: 400 },
    );
  }

  if (projectFile !== undefined && (typeof projectFile !== 'string' || projectFile.length > 200)) {
    return NextResponse.json(
      { success: false, error: 'Invalid project file name', code: 'INVALID_PROJECT_FILE' },
      { status: 400 },
    );
  }

  if (completedTasks !== undefined && (typeof completedTasks !== 'number' || completedTasks < 0)) {
    return NextResponse.json(
      { success: false, error: 'Invalid completed tasks value', code: 'INVALID_COMPLETED' },
      { status: 400 },
    );
  }

  if (totalTasks !== undefined && (typeof totalTasks !== 'number' || totalTasks < 0)) {
    return NextResponse.json(
      { success: false, error: 'Invalid total tasks value', code: 'INVALID_TOTAL' },
      { status: 400 },
    );
  }

  if (durationMinutes !== undefined && (typeof durationMinutes !== 'number' || durationMinutes < 1 || durationMinutes > 600)) {
    return NextResponse.json(
      { success: false, error: 'Invalid duration minutes value', code: 'INVALID_DURATION' },
      { status: 400 },
    );
  }

  const student = await updateStudent(codeValidation.normalized, studentId, {
    displayName,
    currentTask,
    completedTasks,
    totalTasks,
    projectFile,
    durationMinutes,
  });

  if (!student) {
    return NextResponse.json(
      { success: false, error: 'Room not found', code: 'ROOM_NOT_FOUND' },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: student }, { status: 200 });
});
