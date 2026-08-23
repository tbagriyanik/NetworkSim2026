import { NextRequest, NextResponse } from 'next/server';
import { generateScoreToken } from '@/lib/security/scoreSigner';
import { isRateLimited } from '@/lib/security/rateLimiter';
import { sanitizeInput } from '@/lib/security/sanitizer';
import { withErrorHandling } from '@/lib/api/withErrorHandling';
import type { RoomApiResponse } from '@/lib/roomTypes';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (
  req: NextRequest
): Promise<NextResponse<RoomApiResponse<{ scoreToken: string }>>> => {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const { allowed } = await isRateLimited(`sign_score_${ip}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many score signing requests', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { studentName, projectTitle, score, totalScore } = body;

  if (!studentName || !projectTitle || score == null || totalScore == null) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields', code: 'MISSING_FIELDS' },
      { status: 400 }
    );
  }

  const numScore = Number(score);
  const numTotalScore = Number(totalScore);

  if (isNaN(numScore) || isNaN(numTotalScore) || !isFinite(numScore) || !isFinite(numTotalScore)) {
    return NextResponse.json(
      { success: false, error: 'Invalid score values', code: 'INVALID_SCORE' },
      { status: 400 }
    );
  }

  if (numScore < 0 || numTotalScore <= 0 || numScore > numTotalScore) {
    return NextResponse.json(
      { success: false, error: 'Invalid score boundaries', code: 'INVALID_SCORE_RANGE' },
      { status: 400 }
    );
  }

  const cleanStudentName = sanitizeInput(String(studentName)).slice(0, 100);
  const cleanProjectTitle = sanitizeInput(String(projectTitle)).slice(0, 200);

  const scoreToken = generateScoreToken({
    studentName: cleanStudentName,
    projectTitle: cleanProjectTitle,
    score: numScore,
    totalScore: numTotalScore,
  });

  return NextResponse.json({ success: true, data: { scoreToken } }, { status: 200 });
});
