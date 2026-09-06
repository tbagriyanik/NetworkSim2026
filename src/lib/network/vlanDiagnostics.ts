/**
 * vlanDiagnostics.ts — VLAN and Trunk Mismatch Diagnostic Utility
 *
 * Scans network topology connections and identifies:
 * - Native VLAN Mismatch between connected trunk ports
 * - Access VLAN Mismatch between connected access ports
 * - Tagged frame drops due to unallowed VLANs on trunk
 */

import type { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import type { SwitchState, Port } from './types';

export interface VlanDiagnosticIssue {
  type: 'NATIVE_VLAN_MISMATCH' | 'ACCESS_VLAN_MISMATCH' | 'TRUNK_ALLOWED_MISMATCH';
  severity: 'warning' | 'error';
  connectionId: string;
  sourceDeviceName: string;
  sourcePortId: string;
  sourceVlan: number | string;
  targetDeviceName: string;
  targetPortId: string;
  targetVlan: number | string;
  message: string;
  recommendation: string;
}

export function diagnoseVlanMismatches(
  devices: CanvasDevice[],
  connections: CanvasConnection[],
  deviceStates: Map<string, SwitchState>
): VlanDiagnosticIssue[] {
  const issues: VlanDiagnosticIssue[] = [];
  const deviceMap = new Map<string, CanvasDevice>(devices.map(d => [d.id, d]));

  for (const conn of connections) {
    const srcDevice = deviceMap.get(conn.sourceDeviceId);
    const tgtDevice = deviceMap.get(conn.targetDeviceId);
    const srcState = deviceStates.get(conn.sourceDeviceId);
    const tgtState = deviceStates.get(conn.targetDeviceId);

    if (!srcDevice || !tgtDevice || !srcState || !tgtState) continue;

    const srcPort: Port | undefined = srcState.ports?.[conn.sourcePort];
    const tgtPort: Port | undefined = tgtState.ports?.[conn.targetPort];

    if (!srcPort || !tgtPort || srcPort.shutdown || tgtPort.shutdown) continue;

    // Check Trunk Native VLAN Mismatch
    if (srcPort.mode === 'trunk' && tgtPort.mode === 'trunk') {
      const srcNative = srcPort.nativeVlan ?? 1;
      const tgtNative = tgtPort.nativeVlan ?? 1;

      if (srcNative !== tgtNative) {
        issues.push({
          type: 'NATIVE_VLAN_MISMATCH',
          severity: 'error',
          connectionId: conn.id,
          sourceDeviceName: srcDevice.name,
          sourcePortId: srcPort.id,
          sourceVlan: srcNative,
          targetDeviceName: tgtDevice.name,
          targetPortId: tgtPort.id,
          targetVlan: tgtNative,
          message: `Native VLAN mismatch on link ${srcDevice.name} (${srcPort.id}: Native VLAN ${srcNative}) <-> ${tgtDevice.name} (${tgtPort.id}: Native VLAN ${tgtNative})`,
          recommendation: `Align native VLAN on both ends: "switchport trunk native vlan ${srcNative}"`,
        });
      }

      // Check Trunk Allowed VLAN Discrepancy
      if (Array.isArray(srcPort.allowedVlans) && Array.isArray(tgtPort.allowedVlans)) {
        const srcSet = new Set(srcPort.allowedVlans);
        const tgtSet = new Set(tgtPort.allowedVlans);
        const diffSrc = srcPort.allowedVlans.filter(v => !tgtSet.has(v));
        const diffTgt = tgtPort.allowedVlans.filter(v => !srcSet.has(v));

        if (diffSrc.length > 0 || diffTgt.length > 0) {
          issues.push({
            type: 'TRUNK_ALLOWED_MISMATCH',
            severity: 'warning',
            connectionId: conn.id,
            sourceDeviceName: srcDevice.name,
            sourcePortId: srcPort.id,
            sourceVlan: srcPort.allowedVlans.join(','),
            targetDeviceName: tgtDevice.name,
            targetPortId: tgtPort.id,
            targetVlan: tgtPort.allowedVlans.join(','),
            message: `Allowed VLAN mismatch between trunks ${srcDevice.name}:${srcPort.id} and ${tgtDevice.name}:${tgtPort.id}`,
            recommendation: 'Ensure both trunk ports allow the same set of VLAN IDs',
          });
        }
      }
    }

    // Check Access Port VLAN Mismatch between switches
    if (srcPort.mode !== 'trunk' && tgtPort.mode !== 'trunk') {
      const srcVlan = srcPort.accessVlan ?? srcPort.vlan ?? 1;
      const tgtVlan = tgtPort.accessVlan ?? tgtPort.vlan ?? 1;

      // If both are switch ports or switch to host
      const isSwitchSrc = srcDevice.type === 'switchL2' || srcDevice.type === 'switchL3';
      const isSwitchTgt = tgtDevice.type === 'switchL2' || tgtDevice.type === 'switchL3';

      if (isSwitchSrc && isSwitchTgt && srcVlan !== tgtVlan) {
        issues.push({
          type: 'ACCESS_VLAN_MISMATCH',
          severity: 'warning',
          connectionId: conn.id,
          sourceDeviceName: srcDevice.name,
          sourcePortId: srcPort.id,
          sourceVlan: srcVlan,
          targetDeviceName: tgtDevice.name,
          targetPortId: tgtPort.id,
          targetVlan: tgtVlan,
          message: `Access VLAN mismatch on switch-to-switch link: ${srcDevice.name} (${srcPort.id}: VLAN ${srcVlan}) <-> ${tgtDevice.name} (${tgtPort.id}: VLAN ${tgtVlan})`,
          recommendation: 'Configure matching access VLAN or change link mode to trunk',
        });
      }
    }
  }

  return issues;
}
