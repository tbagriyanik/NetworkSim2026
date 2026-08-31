import type { CableType } from '@/lib/network/types';

/**
 * Automatically infers the cable type based on the port ID and port type.
 * - Console ports ('console', 'com1', 'com2', 'rs232', or type='console') -> 'console'
 * - Serial ports ('s0/*', 's1/*', 's2/*', 'se*', 'serial*', or type='serial') -> 'serial'
 * - Wireless ports ('wlan0' or type='wireless') -> 'wireless'
 * - Default: retains current cable type
 */
export function getInferredCableTypeForPort(
  portId: string,
  portType?: string,
  currentCableType: CableType = 'straight'
): CableType {
  const norm = portId.toLowerCase();
  if (norm === 'com1' || norm === 'com2' || norm === 'console' || norm === 'rs232' || portType === 'console') {
    return 'console';
  }
  if (
    portType === 'serial' ||
    norm.startsWith('s0/') ||
    norm.startsWith('s1/') ||
    norm.startsWith('s2/') ||
    norm.startsWith('se') ||
    norm.startsWith('serial')
  ) {
    return 'serial';
  }
  if (norm === 'wlan0' || portType === 'wireless') {
    return 'wireless';
  }
  return currentCableType;
}

