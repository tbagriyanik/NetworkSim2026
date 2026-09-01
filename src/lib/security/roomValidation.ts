/**
 * Shared validation helpers for room codes, student IDs, and teacher IDs.
 * Eliminates duplication across API routes.
 */

export interface ValidationError {
  valid: false;
  error: string;
  code: string;
}

export interface ValidationResult {
  valid: true;
  normalized: string;
}

/** Validate and normalize a room code (4-10 alphanumeric uppercase chars). */
export function validateRoomCode(code: string | undefined | null): ValidationError | ValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Missing room code', code: 'MISSING_CODE' };
  }

  const upperCode = code.toUpperCase().trim();

  if (upperCode.length < 4 || upperCode.length > 10) {
    return { valid: false, error: 'Room code must be 4-10 characters', code: 'INVALID_CODE' };
  }

  if (!/^[A-Z0-9]+$/.test(upperCode)) {
    return { valid: false, error: 'Room code must be alphanumeric', code: 'INVALID_CODE_FORMAT' };
  }

  return { valid: true, normalized: upperCode };
}

/** Validate a student or teacher ID (8-100 alphanumeric + hyphens). */
export function validateUserId(
  id: string | undefined | null,
  label: 'student' | 'teacher',
): ValidationError | ValidationResult {
  if (!id || typeof id !== 'string') {
    return {
      valid: false,
      error: `Valid ${label} ID is required (8-100 chars)`,
      code: label === 'student' ? 'INVALID_ID' : 'MISSING_TEACHER_ID',
    };
  }

  if (id.length < 8 || id.length > 100) {
    return {
      valid: false,
      error: `${label} ID must be 8-100 characters`,
      code: label === 'student' ? 'INVALID_ID' : 'INVALID_TEACHER_ID',
    };
  }

  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return {
      valid: false,
      error: `${label} ID must be alphanumeric and hyphens only`,
      code: label === 'student' ? 'INVALID_ID_FORMAT' : 'INVALID_TEACHER_ID_FORMAT',
    };
  }

  return { valid: true, normalized: id };
}
