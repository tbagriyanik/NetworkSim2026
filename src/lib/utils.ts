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
  // Normalize to 00-40-96-99-88-77
  if (/^([0-9A-Fa-f]{4}\.){2}([0-9A-Fa-f]{4})$/.test(mac)) {
    const parts = mac.split('.');
    const hex = parts.join('');
    return hex.match(/.{1,2}/g)?.join('-').toLowerCase() || mac;
  }
  return mac.toLowerCase();
}
