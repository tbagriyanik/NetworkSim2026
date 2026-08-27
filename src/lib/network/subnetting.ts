export interface SubnetInfo {
  ip: string;
  mask: string;
  prefixLength: number;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  usableHosts: number;
}

function ipToNumber(ip: string): number | null {
  const octets = ip.trim().split('.').map(Number);
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

function numberToIp(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

function maskToPrefix(mask: string): number | null {
  const value = ipToNumber(mask);
  if (value === null) return null;
  let prefix = 0;
  let bit = 0x80000000;
  while ((value & bit) !== 0) { prefix++; bit >>>= 1; }
  const expectedMask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  if (value !== expectedMask) return null;
  return prefix;
}

export function calculateSubnet(ip: string, mask: string): SubnetInfo | null {
  const ipNumber = ipToNumber(ip);
  const prefixLength = mask.startsWith('/') ? Number(mask.slice(1)) : maskToPrefix(mask);
  if (ipNumber === null || prefixLength === null || !Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) return null;
  const maskNumber = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0;
  const networkNumber = (ipNumber & maskNumber) >>> 0;
  const broadcastNumber = (networkNumber | (~maskNumber >>> 0)) >>> 0;
  const totalAddresses = 2 ** (32 - prefixLength);
  const usableHosts = prefixLength === 32 ? 1 : prefixLength === 31 ? 2 : Math.max(0, totalAddresses - 2);
  const firstNumber = prefixLength >= 31 ? networkNumber : networkNumber + 1;
  const lastNumber = prefixLength === 32 ? broadcastNumber : prefixLength >= 31 ? broadcastNumber : broadcastNumber - 1;
  return {
    ip: ip.trim(),
    mask: prefixLength === 0 ? '0.0.0.0' : numberToIp(maskNumber),
    prefixLength,
    network: numberToIp(networkNumber),
    broadcast: numberToIp(broadcastNumber),
    firstHost: numberToIp(firstNumber),
    lastHost: numberToIp(lastNumber),
    usableHosts,
  };
}
