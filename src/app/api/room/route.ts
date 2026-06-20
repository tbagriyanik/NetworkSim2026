import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomStore';
import type { RoomApiResponse, RoomData } from '@/lib/roomTypes';

export async function POST(req: NextRequest): Promise<NextResponse<RoomApiResponse<RoomData>>> {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Room code is required', code: 'MISSING_CODE' },
        { status: 400 },
      );
    }

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4 || trimmed.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Room code must be 4-10 characters', code: 'INVALID_CODE' },
        { status: 400 },
      );
    }

    const room = await createRoom(trimmed);
    return NextResponse.json({ success: true, data: room }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
