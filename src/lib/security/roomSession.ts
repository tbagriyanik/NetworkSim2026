import crypto from 'crypto';

function getSessionSecret(): string {
  return process.env.CERTIFICATE_SECRET || process.env.ROOM_SESSION_SECRET || 'room_session_dev_fallback_secret_32bytes_long!';
}

export interface RoomSessionPayload {
  roomCode: string;
  userId: string;
  role: 'student' | 'teacher';
  issuedAt: number;
}

export function generateRoomSessionToken(payload: Omit<RoomSessionPayload, 'issuedAt'>): string {
  const issuedAt = Date.now();
  const dataToSign = `${payload.roomCode.toUpperCase()}|${payload.userId}|${payload.role}|${issuedAt}`;
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(dataToSign)
    .digest('hex');

  const tokenObj: RoomSessionPayload & { signature: string } = {
    roomCode: payload.roomCode.toUpperCase(),
    userId: payload.userId,
    role: payload.role,
    issuedAt,
    signature,
  };

  return Buffer.from(JSON.stringify(tokenObj)).toString('base64url');
}

export function verifyRoomSessionToken(
  token: string | null | undefined,
  expected: { roomCode: string; userId: string; role?: 'student' | 'teacher' }
): boolean {
  if (!token || typeof token !== 'string') return false;

  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);

    if (
      !data ||
      typeof data !== 'object' ||
      typeof data.signature !== 'string' ||
      typeof data.issuedAt !== 'number'
    ) {
      return false;
    }

    // Check expiration (24 hours = 86400000 ms)
    if (Date.now() - data.issuedAt > 86400000) return false;

    // Verify roomCode, userId, and optional role match
    if (
      data.roomCode.toUpperCase() !== expected.roomCode.toUpperCase() ||
      data.userId !== expected.userId
    ) {
      return false;
    }

    if (expected.role && data.role !== expected.role) {
      return false;
    }

    const dataToSign = `${data.roomCode.toUpperCase()}|${data.userId}|${data.role}|${data.issuedAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(dataToSign)
      .digest('hex');

    const sigBuf = Buffer.from(data.signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
