/**
 * Helper to calculate IPv6 EUI-64 Host Address from MAC Address and Prefix
 */
export function calculateEui64(macAddress: string | undefined, prefixStr: string): string {
  // 1. Clean & normalize MAC address
  let cleanMac = (macAddress || '').replace(/[^0-9a-fA-F]/g, '');
  if (cleanMac.length !== 12) {
    cleanMac = '001122334455'; // Fallback MAC if not provided or invalid
  }

  // 2. Parse 6 bytes of MAC address
  const bytes = [];
  for (let i = 0; i < 12; i += 2) {
    bytes.push(parseInt(cleanMac.substring(i, i + 2), 16));
  }

  // 3. Flip the 7th bit (Universal/Local bit: 0x02) of byte 0
  bytes[0] = bytes[0] ^ 0x02;

  // 4. Insert 0xFF, 0xFE in the middle (between byte 2 and byte 3)
  const euiBytes = [
    bytes[0], bytes[1], bytes[2],
    0xff, 0xfe,
    bytes[3], bytes[4], bytes[5]
  ];

  // 5. Combine into 4 16-bit hex words (lower case, trim leading zeros)
  const w1 = ((euiBytes[0] << 8) | euiBytes[1]).toString(16);
  const w2 = ((euiBytes[2] << 8) | euiBytes[3]).toString(16);
  const w3 = ((euiBytes[4] << 8) | euiBytes[5]).toString(16);
  const w4 = ((euiBytes[6] << 8) | euiBytes[7]).toString(16);
  const interfaceId = `${w1}:${w2}:${w3}:${w4}`;

  // 6. Clean prefix (remove trailing /64, trailing ::, etc.)
  let cleanPrefix = prefixStr.split('/')[0].trim();
  if (cleanPrefix.endsWith('::')) {
    cleanPrefix = cleanPrefix.slice(0, -2);
  }

  // Handle prefix expansion if short (e.g. "2001:db8:1:1" or "2001:db8")
  let prefixParts = cleanPrefix ? cleanPrefix.split(':') : ['2001', 'db8', '0', '0'];
  // Pad prefix parts to 4 blocks if needed
  while (prefixParts.length < 4) {
    prefixParts.push('0');
  }
  if (prefixParts.length > 4) {
    prefixParts = prefixParts.slice(0, 4);
  }

  const prefixFormatted = prefixParts.join(':');
  return `${prefixFormatted}:${interfaceId}`;
}
