'use client';

import { useEffect, useRef } from 'react';
import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';
import type { SwitchState } from '@/lib/network/types';
import { dispatchCapturedPackets } from '../../../utils/packetCapture';
import { runNetworkEventPipeline } from '@/lib/network/forwarding/eventPipeline';



interface UsePeriodicNetworkPacketsOptions {
  devices: CanvasDevice[];
  connections: CanvasConnection[];
  deviceStates?: Map<string, SwitchState>;
  onDeviceStatesChange?: (updater: (previous: Map<string, SwitchState>) => Map<string, SwitchState>) => void;
}

export function usePeriodicNetworkPackets({
  devices,
  connections,
  deviceStates,
  onDeviceStatesChange,
}: UsePeriodicNetworkPacketsOptions) {
  const devicesRef = useRef(devices);
  const connectionsRef = useRef(connections);
  const deviceStatesRef = useRef(deviceStates);

  useEffect(() => {
    devicesRef.current = devices;
    connectionsRef.current = connections;
    deviceStatesRef.current = deviceStates;
  }, [devices, connections, deviceStates]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Periodic timer every 10 seconds for background control protocols (CDP, OSPF, Routing, WLAN)
    const interval = setInterval(() => {
      const currentDevices = devicesRef.current;
      const currentConnections = connectionsRef.current;
      const currentStates = deviceStatesRef.current;

      if (!currentDevices.length) return;

      const packetsToDispatch: Array<{
        connectionId: string;
        sourceIp: string;
        targetIp: string;
        protocol: string;
        length: number;
        info: string;
      }> = [];

      let updatedStates: Map<string, SwitchState> | undefined;

      // Run Unified Network Event Pipeline (STP, ARP, DHCP, OSPF, EIGRP, IP SLA)
      if (currentStates) {
        const pipelineRes = runNetworkEventPipeline(currentStates, currentDevices, currentConnections);
        updatedStates = pipelineRes.updatedStates;
        packetsToDispatch.push(...pipelineRes.dispatchedPackets);
      }



      if (updatedStates && onDeviceStatesChange) {
        onDeviceStatesChange(previous => {
          const next = new Map(previous);
          updatedStates!.forEach((updatedState, deviceId) => next.set(deviceId, updatedState));
          return next;
        });
      }

      currentConnections.forEach(conn => {
        if (conn.active === false) return;
        const connId = conn.id || `${conn.sourceDeviceId}-${conn.targetDeviceId}`;
        const devA = currentDevices.find(d => d.id === conn.sourceDeviceId);
        const devB = currentDevices.find(d => d.id === conn.targetDeviceId);

        if (!devA || !devB || devA.status === 'offline' || devB.status === 'offline') return;

        const stateA = currentStates?.get(devA.id);
        const stateB = currentStates?.get(devB.id);

        // 1. CDP / LLDP Periodic Packets (Switch/Router every 10s)
        if (
          (devA.type === 'switchL2' || devA.type === 'switchL3' || devA.type === 'router') &&
          stateA?.cdpEnabled !== false
        ) {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devA.ip || stateA?.hostname || devA.name,
            targetIp: '01:00:0C:CC:CC:CC',
            protocol: 'CDP',
            length: 180,
            info: `CDP Announcement: Device ${devA.name} Port ${conn.sourcePort}`,
          });
        }

        if (
          (devB.type === 'switchL2' || devB.type === 'switchL3' || devB.type === 'router') &&
          stateB?.cdpEnabled !== false
        ) {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devB.ip || stateB?.hostname || devB.name,
            targetIp: '01:00:0C:CC:CC:CC',
            protocol: 'CDP',
            length: 180,
            info: `CDP Announcement: Device ${devB.name} Port ${conn.targetPort}`,
          });
        }

        // LLDP
        if (
          (devA.type === 'switchL2' || devA.type === 'switchL3' || devA.type === 'router') &&
          stateA?.lldpEnabled === true
        ) {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devA.ip || stateA?.hostname || devA.name,
            targetIp: '01:80:C2:00:00:0E',
            protocol: 'LLDP',
            length: 150,
            info: `LLDP Announcement: Device ${devA.name} Port ${conn.sourcePort}${stateA?.lldpMed ? ` MED TLVs: ${Object.keys(stateA.lldpMed).filter(k => stateA.lldpMed?.[k as keyof NonNullable<typeof stateA.lldpMed>]).join(', ')}` : ''}`,
          });
        }

        if (
          (devB.type === 'switchL2' || devB.type === 'switchL3' || devB.type === 'router') &&
          stateB?.lldpEnabled === true
        ) {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devB.ip || stateB?.hostname || devB.name,
            targetIp: '01:80:C2:00:00:0E',
            protocol: 'LLDP',
            length: 150,
            info: `LLDP Announcement: Device ${devB.name} Port ${conn.targetPort}${stateB?.lldpMed ? ` MED TLVs: ${Object.keys(stateB.lldpMed).filter(k => stateB.lldpMed?.[k as keyof NonNullable<typeof stateB.lldpMed>]).join(', ')}` : ''}`,
          });
        }

        // 2. OSPF Hello Periodic Packets (Router/SwitchL3 with OSPF enabled)
        const stA = stateA as unknown as { ospfEnabled?: boolean; routingProtocol?: string; ospfProcessId?: string; ospfArea?: string };
        const stB = stateB as unknown as { ospfEnabled?: boolean; routingProtocol?: string; ospfProcessId?: string; ospfArea?: string };

        const isOspfA = (devA.type === 'router' || devA.type === 'switchL3') && (stA?.ospfEnabled || stA?.routingProtocol === 'ospf');
        if (isOspfA) {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devA.ip || '192.168.1.1',
            targetIp: '224.0.0.5',
            protocol: 'OSPF',
            length: 64,
            info: `OSPF Hello: Router ${devA.name} Process ${stA?.ospfProcessId || '1'} Area ${stA?.ospfArea || '0'}`,
          });
        }

        const isOspfB = (devB.type === 'router' || devB.type === 'switchL3') && (stB?.ospfEnabled || stB?.routingProtocol === 'ospf');
        if (isOspfB) {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devB.ip || '192.168.1.2',
            targetIp: '224.0.0.5',
            protocol: 'OSPF',
            length: 64,
            info: `OSPF Hello: Router ${devB.name} Process ${stB?.ospfProcessId || '1'} Area ${stB?.ospfArea || '0'}`,
          });
        }

        // 3. EIGRP / RIP Periodic Updates
        if (stateA?.routingProtocol === 'rip') {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devA.ip || '192.168.1.1',
            targetIp: '224.0.0.9',
            protocol: 'RIP',
            length: 52,
            info: `RIPv2 Update: Router ${devA.name} routing table broadcast`,
          });
        }
        if (stateA?.routingProtocol === 'eigrp') {
          const eigrpAsNum = (stateA as unknown as { eigrpAs?: string | number }).eigrpAs || '100';
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devA.ip || '192.168.1.1',
            targetIp: '224.0.0.10',
            protocol: 'EIGRP',
            length: 60,
            info: `EIGRP Hello: AS ${eigrpAsNum} from ${devA.name}`,
          });
        }

        // 4. WLAN / Access Point Beacon Frame Periodic Packets
        if (devA.type === 'wlc') {
          packetsToDispatch.push({
            connectionId: connId,
            sourceIp: devA.macAddress || devA.name,
            targetIp: 'FF:FF:FF:FF:FF:FF',
            protocol: 'UDP',
            length: 128,
            info: `WLAN Beacon: SSID "${devA.name}-WiFi" Channel 6`,
          });
        }
      });

      if (packetsToDispatch.length > 0) {
        dispatchCapturedPackets(packetsToDispatch);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [onDeviceStatesChange]);
}
