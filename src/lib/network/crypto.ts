import { createHash, createHmac, randomInt } from 'crypto';

const HMAC_EXAM_KEY = 'SENTINEL_EXAM_HMAC_KEY_2026_SECURE_SIGNATURE';

/**
 * Generate HMAC-SHA256 signature for data integrity
 */
export function generateHmacSignature(data: string, key: string = HMAC_EXAM_KEY): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature against payload data
 */
export function verifyHmacSignature(data: string, signature: string, key: string = HMAC_EXAM_KEY): boolean {
  try {
    const expected = generateHmacSignature(data, key);
    return expected === signature;
  } catch {
    return false;
  }
}

/**
 * MD5 password encryption (NOS Type 5)
 * NOS Type 5 password specification ($1$salt$hash) explicitly uses MD5 for CLI compatibility.
 * Format: $1$salt$hash
 */
export function encryptMd5Password(password: string, salt?: string): string {
  // Generate random salt if not provided (8 characters)
  const actualSalt = salt || generateSalt();

  // Create MD5 hash per NOS Type 5 specification: salt + password
  const hash = createHash('md5')
    .update(actualSalt + password)
    .digest('hex');

  return `$1$${actualSalt}$${hash}`;
}

/**
 * Generate random salt for MD5 encryption (8 characters)
 * Uses cryptographically secure random integers.
 */
function generateSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
  let salt = '';
  for (let i = 0; i < 8; i++) {
    salt += chars.charAt(randomInt(0, chars.length));
  }
  return salt;
}

/**
 * Type 7 password encryption/decryption
 * This is a simple XOR-based encryption with a fixed key
 */
const TYPE7_KEY = 'dsfd;kfoA,.0ewthl2,7djh3fng,vho1mrqinhjge,4dju7s,rb/0p5l;8q7,6lyo,4acc.4iui,;76.ujmu5f,.;0,6,wfn3rpcdj9,ly6,ojd3,fngi,vhoqmrqinhjge,k4dju7s,rb/0p5l;8q7,6lyo,4acc.4iui,;76.ujmu5f,.;0,6,wfn3rpcdj9,ly6,ojd3,fngi,vhoqmrqinhjge';

/**
 * Encrypt password using Type 7 algorithm
 */
export function encryptType7Password(password: string): string {
  let result = '';
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i);
    const keyChar = TYPE7_KEY.charCodeAt(i % TYPE7_KEY.length);
    const encrypted = (charCode ^ keyChar) + 1; // add 1 to the result
    const hex = encrypted.toString(16).padStart(2, '0');
    result += hex;
  }
  return result;
}

/**
 * Decrypt password using Type 7 algorithm
 */
export function decryptType7Password(encrypted: string): string {
  let result = '';
  for (let i = 0; i < encrypted.length; i += 2) {
    const hexPair = encrypted.substring(i, i + 2);
    const encryptedValue = parseInt(hexPair, 16) - 1; // subtracts 1
    const keyChar = TYPE7_KEY.charCodeAt((i / 2) % TYPE7_KEY.length);
    const decrypted = encryptedValue ^ keyChar;
    result += String.fromCharCode(decrypted);
  }
  return result;
}

/**
 * Verify a plain text password against a Type 7 encrypted password
 */
export function verifyType7Password(inputPassword: string, encryptedPassword: string): boolean {
  try {
    const decrypted = decryptType7Password(encryptedPassword);
    return decrypted === inputPassword;
  } catch {
    return false;
  }
}

/**
 * Verify a plain text password against a Type 5 (MD5) hashed password ($1$salt$hash)
 */
export function verifyMd5Password(inputPassword: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length < 4 || parts[1] !== '1') return false;
    const salt = parts[2];
    const computed = encryptMd5Password(inputPassword, salt);
    return computed === storedHash;
  } catch {
    return false;
  }
}
