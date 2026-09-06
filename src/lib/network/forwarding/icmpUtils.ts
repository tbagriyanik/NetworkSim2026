/**
 * ICMP Time Exceeded and Destination Unreachable message generator
 * RFC 792 - Internet Control Message Protocol
 */
import type { NetworkPacketFrame } from './packetFrame';

export function generateIcmpUnreachable(
  frame: NetworkPacketFrame,
  type: 'time-exceeded' | 'destination-unreachable',
  reason: string
): NetworkPacketFrame {
  const icmp = { ...frame };

  // Swap source and destination IPs for the ICMP response
  const tempIp = icmp.srcIp;
  icmp.srcIp = icmp.dstIp;
  icmp.dstIp = tempIp;

  // Swap source and destination MACs for the ICMP response
  const tempMac = icmp.srcMac;
  icmp.srcMac = icmp.dstMac;
  icmp.dstMac = tempMac;

  // Set protocol to ICMP and update info message
  icmp.protocol = 'ICMP';

  if (type === 'time-exceeded') {
    icmp.info = `ICMP Time Exceeded (TTL=0): ${reason}`;
  } else if (type === 'destination-unreachable') {
    icmp.info = `ICMP Destination Unreachable: ${reason}`;
  }

  return icmp;
}