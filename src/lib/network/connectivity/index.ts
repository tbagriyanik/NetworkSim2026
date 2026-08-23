export { portsFormTrunk, getVlanSpecificSTPBlocking } from './vlanAndSwitching';
export { checkPortSecurityViolation, checkSerialEncapsulation } from './security';
export { evaluateAcl } from './acl';
export { checkConnectivity } from './pathResolution';
export { checkDeviceConnectivity, getPingDiagnostics } from './pingDiagnostics';

export {
  getDeviceWifiConfig,
  getDeviceMacAddress,
  getWirelessSignalStrength,
  getWirelessDistance,
  buildImplicitWirelessConnections,
  getApActiveSsids,
  wifiMacFilterMatches,
  type DeviceWifiConfig,
} from '../wireless';

export {
  isExternalDomain,
  resolveHostname,
} from '../dns';
