import { describe, it, expect } from 'vitest';
import { generateRoomSessionToken, verifyRoomSessionToken } from '@/lib/security/roomSession';

describe('Room Session HMAC Token', () => {
  const samplePayload = {
    roomCode: 'ABCD',
    userId: 'student-12345678',
    role: 'student' as const,
  };

  it('should generate valid token and verify successfully', () => {
    const token = generateRoomSessionToken(samplePayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(30);

    const isValid = verifyRoomSessionToken(token, {
      roomCode: 'ABCD',
      userId: 'student-12345678',
      role: 'student',
    });
    expect(isValid).toBe(true);
  });

  it('should reject token if room code does not match', () => {
    const token = generateRoomSessionToken(samplePayload);
    const isValid = verifyRoomSessionToken(token, {
      roomCode: 'DIFFERENT',
      userId: 'student-12345678',
      role: 'student',
    });
    expect(isValid).toBe(false);
  });

  it('should reject token if user ID does not match', () => {
    const token = generateRoomSessionToken(samplePayload);
    const isValid = verifyRoomSessionToken(token, {
      roomCode: 'ABCD',
      userId: 'student-99999999',
      role: 'student',
    });
    expect(isValid).toBe(false);
  });

  it('should reject token if role does not match expected', () => {
    const token = generateRoomSessionToken(samplePayload);
    const isValid = verifyRoomSessionToken(token, {
      roomCode: 'ABCD',
      userId: 'student-12345678',
      role: 'teacher',
    });
    expect(isValid).toBe(false);
  });

  it('should safely reject invalid, tampered or empty tokens', () => {
    expect(verifyRoomSessionToken('', { roomCode: 'ABCD', userId: 'student-12345678' })).toBe(false);
    expect(verifyRoomSessionToken('invalid.token', { roomCode: 'ABCD', userId: 'student-12345678' })).toBe(false);
  });
});
