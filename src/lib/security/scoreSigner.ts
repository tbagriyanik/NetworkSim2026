import crypto from 'crypto';

const SECRET = process.env.CERTIFICATE_SECRET || 'netsim-secure-solo-cert-key-2026';

export interface ScorePayload {
  score: number;
  totalScore: number;
  studentName: string;
  projectTitle: string;
}

export function generateScoreToken(payload: ScorePayload): string {
  const timestamp = Date.now();
  const dataToSign = `${payload.studentName}|${payload.projectTitle}|${payload.score}|${payload.totalScore}|${timestamp}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(dataToSign)
    .digest('hex');

  const tokenObj = {
    ...payload,
    timestamp,
    signature,
  };

  return Buffer.from(JSON.stringify(tokenObj)).toString('base64url');
}

export function verifyScoreToken(token: string, claimed: ScorePayload): boolean {
  if (!token) return false;

  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);

    if (!data.signature || !data.timestamp) return false;

    // Check expiration (24 hours = 86400000 ms)
    if (Date.now() - data.timestamp > 86400000) return false;

    // Verify claimed match signed payload
    if (
      data.score !== claimed.score ||
      data.totalScore !== claimed.totalScore ||
      data.studentName !== claimed.studentName ||
      data.projectTitle !== claimed.projectTitle
    ) {
      return false;
    }

    const dataToSign = `${data.studentName}|${data.projectTitle}|${data.score}|${data.totalScore}|${data.timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(dataToSign)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(data.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
