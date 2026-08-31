import { createHash, createHmac, randomInt } from 'crypto';

const HMAC_EXAM_KEY = 'SENTINEL_EXAM_HMAC_KEY_2026_SECURE_SIGNATURE';

/**
 * Generate HMAC-SHA256 signature for data integrity
 */
export function generateHmacSignature(payloadData: string, secretKey: string = HMAC_EXAM_KEY): string {
  return createHmac('sha256', secretKey).update(payloadData).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature against payload data
 */
export function verifyHmacSignature(payloadData: string, signature: string, secretKey: string = HMAC_EXAM_KEY): boolean {
  try {
    const expected = generateHmacSignature(payloadData, secretKey);
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
export function encryptMd5Password(plainSecret: string, saltValue?: string): string {
  // Generate random salt if not provided (8 characters)
  const actualSalt = saltValue || generateSalt();

  // Create MD5 hash per NOS Type 5 specification: salt + secret
  const hash = createHash('md5')
    .update(actualSalt + plainSecret)
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
export function encryptType7Password(plainSecret: string): string {
  let result = '';
  for (let i = 0; i < plainSecret.length; i++) {
    const charCode = plainSecret.charCodeAt(i);
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
export function decryptType7Password(encryptedSecret: string): string {
  let result = '';
  for (let i = 0; i < encryptedSecret.length; i += 2) {
    const hexPair = encryptedSecret.substring(i, i + 2);
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
export function verifyType7Password(inputSecret: string, encryptedSecret: string): boolean {
  try {
    const decrypted = decryptType7Password(encryptedSecret);
    return decrypted === inputSecret;
  } catch {
    return false;
  }
}

/**
 * Verify a plain text password against a Type 5 (MD5) hashed password ($1$salt$hash)
 */
export function verifyMd5Password(inputSecret: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length < 4 || parts[1] !== '1') return false;
    const salt = parts[2];
    const computed = encryptMd5Password(inputSecret, salt);
    return computed === storedHash;
  } catch {
    return false;
  }
}
