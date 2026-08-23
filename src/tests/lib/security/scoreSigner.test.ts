import { describe, it, expect } from 'vitest';
import { generateScoreToken, verifyScoreToken, type ScorePayload } from '@/lib/security/scoreSigner';

describe('scoreSigner Security Unit Tests', () => {
  const validPayload: ScorePayload = {
    score: 100,
    totalScore: 100,
    studentName: 'Alice Student',
    projectTitle: 'CCNA Final Exam',
  };

  it('should generate and verify valid score token', () => {
    const token = generateScoreToken(validPayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const isValid = verifyScoreToken(token, validPayload);
    expect(isValid).toBe(true);
  });

  it('should reject score token with mismatched payload', () => {
    const token = generateScoreToken(validPayload);
    const tamperedPayload = { ...validPayload, score: 99 };
    expect(verifyScoreToken(token, tamperedPayload)).toBe(false);
  });

  it('should safely handle invalid or non-string tokens', () => {
    expect(verifyScoreToken('', validPayload)).toBe(false);
    expect(verifyScoreToken(null as unknown as string, validPayload)).toBe(false);
    expect(verifyScoreToken('invalid-base64-token!', validPayload)).toBe(false);
  });

  it('should safely reject tokens with invalid signature lengths without throwing', () => {
    const malformedObj = {
      ...validPayload,
      timestamp: Date.now(),
      signature: 'abc123short', // Malformed signature of wrong byte length
    };
    const malformedToken = Buffer.from(JSON.stringify(malformedObj)).toString('base64url');
    expect(verifyScoreToken(malformedToken, validPayload)).toBe(false);
  });

  it('should reject expired tokens (>24h old)', () => {
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000);
    const expiredObj = {
      ...validPayload,
      timestamp: oldTimestamp,
      signature: '00'.repeat(32),
    };
    const expiredToken = Buffer.from(JSON.stringify(expiredObj)).toString('base64url');
    expect(verifyScoreToken(expiredToken, validPayload)).toBe(false);
  });
});
