import { createHash, createHmac, pbkdf2Sync, randomBytes, randomInt, timingSafeEqual } from 'crypto';

const HMAC_EXAM_KEY = 'SENTINEL_EXAM_HMAC_KEY_2026_SECURE_SIGNATURE';

// Cost parameters for the modern, computationally strong password hashing scheme.
// Story: 100,000 iterations of PBKDF2-HMAC-SHA256 is the OWASP-recommended minimum as of this writing.
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32;

/**
 * Generate HMAC-SHA256 signature for data integrity.
 * NOTE: This is used to sign non-secret session/payload integrity hashes (e.g. exam progress),
 * not to derive password hashes. HMAC-SHA256 is a strong, non-broken algorithm and is
 * intentionally NOT iterated because it is a MAC with a high-entropy secret, not a password
 * verifier. (CodeQL: cs/password-hash-with-insufficient-computational-effort)
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
 * Hash a plain text secret using the modern, computationally strong PBKDF2-HMAC-SHA256
 * scheme. This is the recommended replacement for the legacy MD5 (NOS Type 5) and
 * Type 7 (XOR) schemes, which exist solely for network-device CLI compatibility and
 * are cryptographically weak.
 *
 * Format: pbkdf2$<iterations>$<salt(base64url)>$<derivedKey(base64url)>
 */
export function hashPassword(plainSecret: string): string {
  const salt = randomBytes(16);
  const derivedKey = pbkdf2Sync(plainSecret, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256');
  return [
    'pbkdf2',
    PBKDF2_ITERATIONS.toString(),
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

/**
 * Verify a plain text secret against a strong (pbkdf2$...) or legacy (NOS Type 5 MD5)
 * stored hash. Uses a constant-time comparison.
 */
export function verifyPassword(plainSecret: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith('pbkdf2$')) {
    try {
      const [_scheme, iterStr, saltB64, keyB64] = stored.split('$');
      const iterations = parseInt(iterStr, 10);
      const salt = Buffer.from(saltB64, 'base64url');
      const expectedKey = Buffer.from(keyB64, 'base64url');
      if (!iterations || salt.length === 0 || expectedKey.length === 0) return false;
      const derivedKey = pbkdf2Sync(plainSecret, salt, iterations, expectedKey.length, 'sha256');
      return timingSafeEqual(derivedKey, expectedKey);
    } catch {
      return false;
    }
  }
  // Legacy NOS Type 5 (MD5) hash handled by verifyMd5Password.
  return verifyMd5Password(plainSecret, stored);
}

/**
 * MD5 password encryption (NOS Type 5)
 * NOS Type 5 password specification ($1$salt$hash) explicitly uses MD5 for CLI compatibility.
 * This is REQUIRED to produce `secret 5` lines in generated device configs and
 * cannot be changed without breaking network device CLI interoperability. For storage outside of
 * the CLI-compatible config path, prefer hashPassword/verifyPassword (PBKDF2-SHA256).
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
 * This is a simple XOR-based encryption with a fixed key.
 * NOTE: Type 7 is a proprietary reversible obfuscation, REQUIRED to produce `password 7`
 * lines in generated device configs. It is NOT secure and must never be used to protect secrets at
 * rest outside of CLI-compatible config output. Prefer hashPassword/verifyPassword (PBKDF2-SHA256)
 * for storage. (CodeQL: js/weak-cryptographic-algorithm)
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
