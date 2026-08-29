// Re-export all modular command handlers for backward compatibility
export {
  cmdNoIpHttpServer,
  cmdNoIpDomainLookup,
  cmdNoIpDomainName,
  cmdNoIpRouting,
  cmdNoIpSshTimeOut,
  cmdNoMlsQos,
  cmdIpSshVersion,
  cmdIpDomainLookup,
  cmdSystemMtu,
  cmdSdmPrefer,
  cmdIpSshAuthRetries
} from './globalConfigServiceCommands';

export {
  cmdIpDhcpPool,
  cmdNoIpDhcpPool,
  cmdIpv6DhcpPool,
  cmdNoIpv6DhcpPool,
  cmdIpDhcpExcludedAddress,
  cmdNoIpDhcpExcludedAddress,
  cmdIpDhcpSnoopingVlan,
  cmdNoIpDhcpSnooping
} from './globalConfigDhcpCommands';

export {
  cmdNoSpanningTree,
  cmdNoUsername,
  cmdNoInterface,
  cmdSpanningTreeVlan,
  cmdSpanningTreePortfastDefault,
  cmdErrdisableRecovery,
  cmdVtpPassword,
  cmdIpArpInspection,
  cmdNoIpArpInspection,
  cmdCryptoKeyGenerateRsa,
  cmdCryptoKeyZeroizeRsa
} from './globalConfigSecurityCommands';

export {
  cmdIpAccessList,
  cmdIpv6AccessList,
  cmdIpv6AclPermit,
  cmdIpv6AclDeny,
  cmdNamedAclPermit,
  cmdNamedAclDeny,
  cmdNamedAclNoPermit,
  cmdNamedAclNoDeny,
  cmdExtAclPermit,
  cmdExtAclDeny,
  cmdExtAclNoPermit,
  cmdExtAclNoDeny,
  cmdNoIpAccessList
} from './globalConfigAclCommands';

export {
  cmdIpv6UnicastRouting,
  cmdNoIpv6UnicastRouting,
  cmdIpv6Route,
  cmdNoIpv6Route,
  cmdIpv6RouterRip,
  cmdIpv6RouterOspf,
  cmdNoIpv6RouterRip,
  cmdNoIpv6RouterOspf
} from './globalConfigIpv6Commands';

export {
  cmdNtpServer,
  cmdClockTimezone,
  cmdIpNameServer,
  cmdIpHost,
  cmdAliasExec,
  cmdNoAliasExec,
  cmdIpNatPool,
  cmdIpNatInsideSourceStatic,
  cmdIpNatInsideSourceList,
  cmdLoggingHost,
  cmdLoggingTrap,
  cmdIpSla,
  cmdSpanningTreeMst
} from './globalConfigNetworkCommands';

export {
  cmdAaaNewModel,
  cmdNoAaaNewModel,
  cmdAaaAuthentication,
  cmdRadiusServerHost,
  cmdTacacsServerHost,
  cmdRadiusServerKey,
  cmdTacacsServerKey
} from './globalConfigAaaCommands';

export {
  parseVlanRange,
  cmdMstName,
  cmdMstRevision,
  cmdMstInstance,
  cmdNoMstInstance,
  cmdMstShowPending,
  cmdSpanningTreeMstPriority
} from './globalConfigMstpCommands';
