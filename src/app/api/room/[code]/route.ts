import { NextRequest, NextResponse } from 'next/server';
import { checkRoomExists } from '@/lib/roomStore';
import type { RoomApiResponse } from '@/lib/roomTypes';
import { withErrorHandling } from '@/lib/api/withErrorHandling';
import { validateRoomCode } from '@/lib/security/roomValidation';

export const dynamic = 'force-dynamic';

interface RouteParams {
  code: string;
}

export const GET = withErrorHandling(async (
  _req: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse<RoomApiResponse<{ exists: boolean }>>> => {
  const { code } = await params;
  const validation = validateRoomCode(code);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error, code: validation.code },
      { status: 400 },
    );
  }

  const exists = await checkRoomExists(validation.normalized);
  return NextResponse.json({ success: true, data: { exists } }, { status: 200 });
});
