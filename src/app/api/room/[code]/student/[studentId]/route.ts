import { NextRequest, NextResponse } from 'next/server';
import { updateStudent } from '@/lib/roomStore';
import type { RoomApiResponse, StudentProgress } from '@/lib/roomTypes';

interface RouteParams {
  code: string;
  studentId: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse<RoomApiResponse<StudentProgress>>> {
  try {
    const { code, studentId } = await params;

    if (!code || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing room code or student ID', code: 'MISSING_PARAMS' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { displayName, currentTask, completedTasks, totalTasks, projectFile, durationMinutes } = body;

    if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
      return NextResponse.json(
        { success: false, error: 'Invalid display name', code: 'INVALID_NAME' },
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

    const student = await updateStudent(code.toUpperCase(), studentId, {
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
