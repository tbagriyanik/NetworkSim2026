/**
 * ICMP Time Exceeded and Destination Unreachable message generator
 * RFC 792 / RFC 4443 Internet Control Message Protocol Specification
 */
import type { NetworkPacketFrame } from './packetFrame';

export type IcmpErrorType = 'time-exceeded' | 'destination-unreachable';

export type IcmpUnreachableCode =
  | 0 // Net Unreachable
  | 1 // Host Unreachable
  | 3 // Port Unreachable
  | 13; // Communication Administratively Prohibited (ACL drop)

export type IcmpTimeExceededCode =
  | 0 // TTL Exceeded in Transit
  | 1; // Fragment Reassembly Time Exceeded

export interface IcmpErrorDetails {
  type: IcmpErrorType;
  icmpType: number; // 3 for Unreachable, 11 for Time Exceeded
  code: number;
  codeName: string;
  reason: string;
}

export function getIcmpCodeDetails(
  type: IcmpErrorType,
  code: number = 0
): { icmpType: number; codeName: string } {
  if (type === 'time-exceeded') {
    return {
      icmpType: 11,
      codeName: code === 1 ? 'Fragment Reassembly Time Exceeded' : 'TTL Exceeded in Transit',
    };
  }
  // destination-unreachable
  switch (code) {
    case 0:
      return { icmpType: 3, codeName: 'Network Unreachable' };
    case 1:
      return { icmpType: 3, codeName: 'Host Unreachable' };
    case 3:
      return { icmpType: 3, codeName: 'Port Unreachable' };
    case 13:
      return { icmpType: 3, codeName: 'Communication Administratively Prohibited' };
    default:
      return { icmpType: 3, codeName: 'Destination Unreachable' };
  }
}

export function generateIcmpUnreachable(
  frame: NetworkPacketFrame,
  type: IcmpErrorType,
  reason: string,
  code: number = 0,
  reportingRouterIp?: string
): NetworkPacketFrame {
  const icmp = { ...frame };

  // Swap source and destination IPs for the ICMP response
  const originalSrcIp = frame.srcIp;
  const originalDstIp = frame.dstIp;

  icmp.srcIp = reportingRouterIp || originalDstIp || '127.0.0.1';
  icmp.dstIp = originalSrcIp || '127.0.0.1';

  // Swap source and destination MACs for the ICMP response
  const tempMac = icmp.srcMac;
  icmp.srcMac = icmp.dstMac;
  icmp.dstMac = tempMac;

  // Set protocol to ICMP and update info message
  icmp.protocol = 'ICMP';
  icmp.ttl = 64; // Fresh ICMP error packet TTL

  const { icmpType, codeName } = getIcmpCodeDetails(type, code);

  icmp.info = `ICMP (Type ${icmpType}, Code ${code}: ${codeName}) from ${icmp.srcIp}: ${reason}`;

  return icmp;
}