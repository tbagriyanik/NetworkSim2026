import type { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import type { SwitchState } from '@/lib/network/types';
import type { NetworkPacketFrame, PipelineExecutionResult } from './packetFrame';
import { forwardPacketFrame } from './commonForwardingEngine';
import { evaluateIpSlaOperations } from '@/lib/network/ipSlaEngine';
import { evaluateDhcpv6ForDevice } from '@/lib/network/eui64';
import { evaluatePppoeSessions } from '@/lib/network/pppoeEngine';

export function runNetworkEventPipeline(
  deviceStates: Map<string, SwitchState>,
  devices: CanvasDevice[],
  connections: CanvasConnection[],
  now: number = Date.now()
): PipelineExecutionResult {
  let updatedStates = new Map<string, SwitchState>(deviceStates);
  const dispatchedPackets: PipelineExecutionResult['dispatchedPackets'] = [];
  const processedFrames: NetworkPacketFrame[] = [];

  // 1. IP SLA Automated Probes & Object Tracking
  const slaResult = evaluateIpSlaOperations(updatedStates, devices, connections, now);
  slaResult.updatedStates.forEach((state, deviceId) => {
    updatedStates.set(deviceId, state);
  });
  dispatchedPackets.push(...slaResult.dispatchedPackets);

  // 2. DHCPv6 Lease Simulation
  devices.forEach(device => {
    const dhcpv6Res = evaluateDhcpv6ForDevice(device.id, updatedStates, connections);
    if (dhcpv6Res?.ipv6Address) {
      const state = updatedStates.get(device.id);
      if (state && state.ports?.['eth0']) {
        state.ports['eth0'].ipAddress = dhcpv6Res.ipv6Address;
      }
    }
  });


  // 3. PPPoE Session Evaluation
  updatedStates = evaluatePppoeSessions(updatedStates, connections);

  // 4. Periodic Protocol PDU Generation & Pipeline Processing (STP BPDUs, OSPF/EIGRP Hellos)
  devices.forEach(device => {
    const state = updatedStates.get(device.id);
    if (!state || device.status === 'offline') return;

    const isOspfActive = Boolean(state.ospfRouterId || state.routingProtocol === 'ospf');
    if (isOspfActive) {
      const ospfFrame: NetworkPacketFrame = {
        id: `ospf-hello-${device.id}-${now}`,
        protocol: 'OSPF',
        timestamp: now,
        ingressDeviceId: device.id,
        srcMac: device.macAddress || '00:00:00:00:00:00',
        dstMac: '01:00:5e:00:00:05',
        etherType: '0x0800',
        srcIp: device.ip || '10.0.0.1',
        dstIp: '224.0.0.5',
        ipProtocol: 89,
        ospfPayload: {
          packetType: 'hello',
          routerId: state.ospfRouterId || device.ip || '1.1.1.1',
          areaId: '0.0.0.0',
          neighbors: state.ospfNeighbors || []
        },
        length: 64,
        info: `OSPF Hello Router-ID ${state.ospfRouterId || device.ip || '1.1.1.1'}`
      };

      processedFrames.push(ospfFrame);
      const fwdResult = forwardPacketFrame(ospfFrame, device, state, devices, connections);
      if (fwdResult.accepted && fwdResult.responseFrame) {
        processedFrames.push(fwdResult.responseFrame);
      }
    }

    const isEigrpActive = Boolean(state.eigrpAs || state.routingProtocol === 'eigrp');
    if (isEigrpActive) {
      const asNum = parseInt(state.eigrpAs || '100', 10);
      const eigrpFrame: NetworkPacketFrame = {
        id: `eigrp-hello-${device.id}-${now}`,
        protocol: 'EIGRP',
        timestamp: now,
        ingressDeviceId: device.id,
        srcMac: device.macAddress || '00:00:00:00:00:00',
        dstMac: '01:00:5e:00:00:0a',
        etherType: '0x0800',
        srcIp: device.ip || '10.0.0.1',
        dstIp: '224.0.0.10',
        ipProtocol: 88,
        eigrpPayload: {
          opcode: 'hello',
          asNumber: isNaN(asNum) ? 100 : asNum,
          kValues: [1, 0, 1, 0, 0],
          bandwidth: 100000,
          delay: 10
        },
        length: 60,
        info: `EIGRP Hello AS ${state.eigrpAs || 100}`
      };

      processedFrames.push(eigrpFrame);
      const fwdResult = forwardPacketFrame(eigrpFrame, device, state, devices, connections);
      if (fwdResult.accepted && fwdResult.responseFrame) {
        processedFrames.push(fwdResult.responseFrame);
      }
    }

    if ((device.type === 'switchL2' || device.type === 'switchL3') && state.spanningTreePriority) {
      const stpFrame: NetworkPacketFrame = {
        id: `stp-bpdu-${device.id}-${now}`,
        protocol: 'STP',
        timestamp: now,
        ingressDeviceId: device.id,
        srcMac: state.macAddress || '00:00:00:00:00:00',
        dstMac: '01:80:c2:00:00:00',
        etherType: '0x4242',
        stpPayload: {
          protocolVersion: 'stp',
          rootId: state.macAddress || '0000.0000.0000',
          rootPathCost: 0,
          bridgeId: state.macAddress || '0000.0000.0000',
          portId: '8001',
          messageAge: 0,
          maxAge: 20,
          helloTime: 2,
          forwardDelay: 15
        },
        length: 52,
        info: `STP BPDU Root: ${state.macAddress || 'Self'}`
      };

      processedFrames.push(stpFrame);
      forwardPacketFrame(stpFrame, device, state, devices, connections);
    }
  });

  return {
    updatedStates,
    dispatchedPackets,
    processedFrames
  };
}
