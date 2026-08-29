

/**
 * Obfuscation utilities for Exam files
 * NOTE: This is NOT a security feature. It only prevents casual viewing of
 * task requirements. The client-side fixed key means a determined user
 * can easily read or forge data. Exam integrity hash (XOR with same key)
 * detects accidental corruption but does NOT protect against intentional
 * tampering — see generateExamIntegrityHash JSDoc for details.
 */
// Key'i karakter kodları şeklinde tutarak daha zor okunur hale getiriyoruz
const EXAM_KEY_BYTES = Uint8Array.from([
  83, 69, 78, 84, 73, 78, 69, 76, 95, 69, 88, 65, 77, 95, 83, 69, 67, 85, 82, 69, 95, 75, 69, 89, 95, 50, 48, 50, 54, 95, 83, 85, 80, 69, 82, 83, 69, 67, 85, 82, 69, 68
]);

// UTF-8 string'i Uint8Array'a dönüştüren yardımcı fonksiyon
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// XOR şifrelemesi için yardımcı fonksiyon
function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // Dynamic rolling position shift to prevent repeating key patterns and frequency analysis
    const keyByte = key[i % key.length];
    const shift = (i * 17) % 256;
    result[i] = data[i] ^ keyByte ^ shift;
  }
  return result;
}

export function encryptExamData(data: unknown): string {
  const json = JSON.stringify(data);
  const bytes = stringToUint8Array(json);
  const xored = xorBytes(bytes, EXAM_KEY_BYTES);
  // Base64 URL safe encode (standart base64 de iş görür)
  return btoa(String.fromCharCode(...xored));
}

export function decryptExamData(encrypted: string): unknown {
  try {
    const decoded = atob(encrypted);
    const bytes = Uint8Array.from(decoded.split('').map(c => c.charCodeAt(0)));
    const xored = xorBytes(bytes, EXAM_KEY_BYTES);
    const json = new TextDecoder().decode(xored);
    return JSON.parse(json);
  } catch {
    // console.error('Failed to decrypt exam data', _e);
    return null;
  }
}