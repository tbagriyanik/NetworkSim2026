import crypto from 'crypto';

let warned = false;
function getSecretKey(): string {
  const secret = process.env.CERTIFICATE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('CERTIFICATE_SECRET environment variable is required in production');
    }
    if (!warned) {
      warned = true;
      console.warn('[SECURITY] CERTIFICATE_SECRET not set — using insecure development fallback. Do NOT deploy without setting this env var.');
    }
    return 'netsim-dev-insecure-fallback-key-2026';
  }
  return secret;
}

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
    .createHmac('sha256', getSecretKey())
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
  if (!token || typeof token !== 'string') return false;

  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);

    if (!data || typeof data !== 'object' || typeof data.signature !== 'string' || typeof data.timestamp !== 'number') {
      return false;
    }

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
      .createHmac('sha256', getSecretKey())
      .update(dataToSign)
      .digest('hex');

    const sigBuf = Buffer.from(data.signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    // timingSafeEqual requires buffers of identical length
    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
