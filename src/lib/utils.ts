import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidMAC(mac: string): boolean {
  // Canonical: 00-40-96-99-88-77, Dots: 950B.ACBE.D015
  const canonicalRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  const dotsRegex = /^([0-9A-Fa-f]{4}\.){2}([0-9A-Fa-f]{4})$/;
  return canonicalRegex.test(mac) || dotsRegex.test(mac);
}

export function normalizeMAC(mac: string): string {
  // Remove all separators and get clean hex
  const hex = mac.replace(/[^a-fA-F0-9]/g, '');
  if (hex.length !== 12) return mac.toLowerCase();
  // Format as 00-40-96-99-88-77
  return hex.match(/.{1,2}/g)?.join('-').toLowerCase() || mac.toLowerCase();
}

export const generateMacAddress = (seed?: number): string => {
  const chars = '0123456789ABCDEF';
  let hex = '';
  if (seed !== undefined) {
    for (let i = 0; i < 12; i++) {
      hex += chars[(seed + i) % 16];
    }
  } else {
    const bytes = new Uint8Array(12);
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 12; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    for (let i = 0; i < 12; i++) {
      hex += chars[bytes[i] % 16];
    }
  }
  return `${hex.slice(0, 4)}.${hex.slice(4, 8)}.${hex.slice(8, 12)}`;
};

export function generateUniqueMacAddress(reservedOrUsedMacs?: Set<string> | string[]): string {
  const used = new Set<string>();
  if (reservedOrUsedMacs) {
    if (reservedOrUsedMacs instanceof Set) {
      reservedOrUsedMacs.forEach(m => {
        if (m) used.add(normalizeMAC(m));
      });
    } else {
      reservedOrUsedMacs.forEach(m => {
        if (m) used.add(normalizeMAC(m));
      });
    }
  }

  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = generateMacAddress();
    if (!used.has(normalizeMAC(candidate))) {
      return candidate;
    }
  }
  return generateMacAddress();
}
