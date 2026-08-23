import { SwitchState } from '@/lib/network/types';

/**
 * Check port security for a switch port
 * Returns violation result if MAC is not allowed, null if allowed
 */
export function checkPortSecurityViolation(
  switchId: string,
  portId: string,
  sourceMac: string,
  deviceStates?: Map<string, SwitchState>
): { violation: boolean; action: 'shutdown' | 'restrict' | 'protect'; reason: string } | null {
  if (!deviceStates) return null;

  const switchState = deviceStates.get(switchId);
  if (!switchState) return null;

  const port = switchState.ports[portId];
  if (!port?.portSecurity?.enabled) return null;

  // Normalize MAC address for comparison
  const normalizedSourceMac = sourceMac.toLowerCase().replace(/[-:.]/g, '');
  const staticMacs = port.staticMacs || [];
  const normalizedStaticMacs = staticMacs.map(m => m.toLowerCase().replace(/[-:.]/g, ''));

  // Check if source MAC is in the allowed list
  const isAllowed = normalizedStaticMacs.includes(normalizedSourceMac);

  if (!isAllowed) {
    const action = port.portSecurity.violationAction || 'shutdown';
    return {
      violation: true,
      action,
      reason: `Port security violation on ${switchId} ${portId}: MAC ${sourceMac} not in secure MAC list`
    };
  }

  return null;
}

/**
 * Check serial encapsulation compatibility between two ports on a serial link.
 * Both ends must use the same encapsulation (HDLC or PPP).
 * For PPP with authentication, checks that auth is configured on both sides.
 */
export function checkSerialEncapsulation(
  srcDeviceId: string,
  srcPortId: string,
  dstDeviceId: string,
  dstPortId: string,
  deviceStates: Map<string, SwitchState>
): boolean {
  const srcState = deviceStates.get(srcDeviceId);
  const dstState = deviceStates.get(dstDeviceId);
  if (!srcState || !dstState) return true;

  const srcPort = srcState.ports[srcPortId];
  const dstPort = dstState.ports[dstPortId];
  if (!srcPort || !dstPort) return true;

  // Only check serial ports
  if (srcPort.type !== 'serial' && dstPort.type !== 'serial') return true;
  if (srcPort.type === 'serial' && dstPort.type !== 'serial') return false;
  if (srcPort.type !== 'serial' && dstPort.type === 'serial') return false;

  const srcEncap = srcPort.serialEncapsulation || 'hdlc';
  const dstEncap = dstPort.serialEncapsulation || 'hdlc';

  // Both ends must use the same encapsulation
  if (srcEncap !== dstEncap) return false;

  // PPP authentication check
  if (srcEncap === 'ppp') {
    const srcAuth = srcPort.pppAuth || 'none';
    const dstAuth = dstPort.pppAuth || 'none';

    // If one side requires authentication, both must authenticate
    if (srcAuth !== 'none' || dstAuth !== 'none') {
      // Both sides must have authentication configured
      if (srcAuth === 'none' || dstAuth === 'none') return false;

      // PAP: validate credentials match
      if (srcAuth === 'pap' && dstAuth === 'pap') {
        const srcUser = srcPort.pppPapUsername || '';
        const srcPass = srcPort.pppPapPassword || '';
        const dstUser = dstPort.pppPapUsername || '';
        const dstPass = dstPort.pppPapPassword || '';
        // In a real PPP link, the credentials are sent and verified
        // Source's sent-username/password should match target's expected credentials
        if (srcUser && srcPass && dstUser && dstPass) {
          if (srcUser !== dstUser || srcPass !== dstPass) return false;
        }
      }

      // CHAP: shared secret must match (simplified)
      if (srcAuth === 'chap' && dstAuth === 'chap') {
        const srcUser = srcPort.pppPapUsername || '';
        const srcPass = srcPort.pppPapPassword || '';
        const dstUser = dstPort.pppPapUsername || '';
        const dstPass = dstPort.pppPapPassword || '';
        if (srcUser && srcPass && dstUser && dstPass) {
          if (srcUser !== dstUser || srcPass !== dstPass) return false;
        }
      }
    }
  }

  return true;
}
