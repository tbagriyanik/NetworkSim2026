/**
 * protocols/index.ts — Barrel export for all protocol state machine types and functions.
 */

export type {
  // OSPF
  OspfNeighborState,
  OspfNeighborRecord,
  OspfNeighborEvent,
  OspfNeighborTransitionResult,
  OspfProtocolEvent,
  // STP
  StpPortState,
  StpPortRole,
  StpPortRecord,
  StpPortEvent,
  StpPortTransitionResult,
  // DHCP
  DhcpClientState,
  DhcpClientRecord,
  DhcpClientEvent,
  DhcpClientTransitionResult,
  // EIGRP
  EigrpNeighborState,
  EigrpNeighborRecord,
  EigrpNeighborEvent,
  EigrpNeighborTransitionResult,
  // LACP
  LacpPortState,
  LacpPortRecord,
  LacpPortEvent,
  LacpPortTransitionResult,
} from './protocolStateMachines';

export {
  // OSPF
  ospfNeighborTransition,
  ospfTickDeadTimer,
  // STP
  stpPortTransition,
  stpTickPort,
  // DHCP
  dhcpClientTransition,
  dhcpTickClient,
  // EIGRP
  eigrpNeighborTransition,
  eigrpTickHoldTimer,
  // LACP
  lacpPortTransition,
  lacpTickTimer,
} from './protocolStateMachines';
