import { CanvasDevice, CanvasConnection } from '@/components/network/networkTopology.types';
import { SwitchState, Port } from './types';
import { ensureDeviceStatesMap } from './networkUtils';

export type WifiMode = 'ap' | 'client' | 'disabled' | 'sta';

export interface WirelessChannelOption {
  value: string;
  channelNumber?: number;
  frequencyGhz: number;
  band: '2.4GHz' | '5GHz';
  labelTr: string;
  labelEn: string;
}

export const WIRELESS_CHANNELS_2_4GHZ: WirelessChannelOption[] = [
  { value: '1', channelNumber: 1, frequencyGhz: 2.412, band: '2.4GHz', labelTr: 'Kanal 1 (2.412 GHz)', labelEn: 'Channel 1 (2.412 GHz)' },
  { value: '2', channelNumber: 2, frequencyGhz: 2.417, band: '2.4GHz', labelTr: 'Kanal 2 (2.417 GHz)', labelEn: 'Channel 2 (2.417 GHz)' },
  { value: '3', channelNumber: 3, frequencyGhz: 2.422, band: '2.4GHz', labelTr: 'Kanal 3 (2.422 GHz)', labelEn: 'Channel 3 (2.422 GHz)' },
  { value: '4', channelNumber: 4, frequencyGhz: 2.427, band: '2.4GHz', labelTr: 'Kanal 4 (2.427 GHz)', labelEn: 'Channel 4 (2.427 GHz)' },
  { value: '5', channelNumber: 5, frequencyGhz: 2.432, band: '2.4GHz', labelTr: 'Kanal 5 (2.432 GHz)', labelEn: 'Channel 5 (2.432 GHz)' },
  { value: '6', channelNumber: 6, frequencyGhz: 2.437, band: '2.4GHz', labelTr: 'Kanal 6 (2.437 GHz) - Önerilen', labelEn: 'Channel 6 (2.437 GHz) - Recommended' },
  { value: '7', channelNumber: 7, frequencyGhz: 2.442, band: '2.4GHz', labelTr: 'Kanal 7 (2.442 GHz)', labelEn: 'Channel 7 (2.442 GHz)' },
  { value: '8', channelNumber: 8, frequencyGhz: 2.447, band: '2.4GHz', labelTr: 'Kanal 8 (2.447 GHz)', labelEn: 'Channel 8 (2.447 GHz)' },
  { value: '9', channelNumber: 9, frequencyGhz: 2.452, band: '2.4GHz', labelTr: 'Kanal 9 (2.452 GHz)', labelEn: 'Channel 9 (2.452 GHz)' },
  { value: '10', channelNumber: 10, frequencyGhz: 2.457, band: '2.4GHz', labelTr: 'Kanal 10 (2.457 GHz)', labelEn: 'Channel 10 (2.457 GHz)' },
  { value: '11', channelNumber: 11, frequencyGhz: 2.462, band: '2.4GHz', labelTr: 'Kanal 11 (2.462 GHz) - Önerilen', labelEn: 'Channel 11 (2.462 GHz) - Recommended' },
];

export const WIRELESS_CHANNELS_5GHZ: WirelessChannelOption[] = [
  { value: '36', channelNumber: 36, frequencyGhz: 5.180, band: '5GHz', labelTr: 'Kanal 36 (5.180 GHz)', labelEn: 'Channel 36 (5.180 GHz)' },
  { value: '40', channelNumber: 40, frequencyGhz: 5.200, band: '5GHz', labelTr: 'Kanal 40 (5.200 GHz)', labelEn: 'Channel 40 (5.200 GHz)' },
  { value: '44', channelNumber: 44, frequencyGhz: 5.220, band: '5GHz', labelTr: 'Kanal 44 (5.220 GHz)', labelEn: 'Channel 44 (5.220 GHz)' },
  { value: '48', channelNumber: 48, frequencyGhz: 5.240, band: '5GHz', labelTr: 'Kanal 48 (5.240 GHz)', labelEn: 'Channel 48 (5.240 GHz)' },
  { value: '149', channelNumber: 149, frequencyGhz: 5.745, band: '5GHz', labelTr: 'Kanal 149 (5.745 GHz)', labelEn: 'Channel 149 (5.745 GHz)' },
  { value: '153', channelNumber: 153, frequencyGhz: 5.765, band: '5GHz', labelTr: 'Kanal 153 (5.765 GHz)', labelEn: 'Channel 153 (5.765 GHz)' },
  { value: '157', channelNumber: 157, frequencyGhz: 5.785, band: '5GHz', labelTr: 'Kanal 157 (5.785 GHz)', labelEn: 'Channel 157 (5.785 GHz)' },
  { value: '161', channelNumber: 161, frequencyGhz: 5.805, band: '5GHz', labelTr: 'Kanal 161 (5.805 GHz)', labelEn: 'Channel 161 (5.805 GHz)' },
  { value: '165', channelNumber: 165, frequencyGhz: 5.825, band: '5GHz', labelTr: 'Kanal 165 (5.825 GHz)', labelEn: 'Channel 165 (5.825 GHz)' },
];

export const ALL_WIRELESS_CHANNELS: WirelessChannelOption[] = [
  ...WIRELESS_CHANNELS_2_4GHZ,
  ...WIRELESS_CHANNELS_5GHZ,
];

export interface DeviceWifiSsidProfile {
  id: string;
  name: string;
  ssid: string;
  security: 'open' | 'wep' | 'wpa' | 'wpa2' | 'wpa3';
  password?: string;
  band?: '2.4GHz' | '5GHz' | 'both';
  enabled: boolean;
  hidden?: boolean;
}

export interface DeviceWifiConfig {
  enabled: boolean;
  ssid: string;
  bssid?: string;
  password?: string;
  security: 'open' | 'wep' | 'wpa' | 'wpa2' | 'wpa3';
  channel: '2.4GHz' | '5GHz' | string;
  mode: WifiMode;
  hidden?: boolean;
  maxClients?: number;
  macFilterEnabled?: boolean;
  macFilterMode?: 'allow' | 'deny';
  macFilterList?: string[];
  ssids?: DeviceWifiSsidProfile[];
  powerDisabled?: boolean;
}

const normalizeWifiMode = (mode: string | undefined, fallback: WifiMode): WifiMode => {
  if (!mode) return fallback;
  const words = mode.toLowerCase();
  if (words === 'ap') return 'ap';
  if (words === 'client') return 'client';
  if (words === 'sta') return 'sta';
  if (words === 'disabled') return 'disabled';
  return fallback;
};

const normalizeSecurity = (security: string | undefined): DeviceWifiConfig['security'] => {
  const value = security ? security.toLowerCase() : 'open';
  if (value === 'wpa3') return 'wpa3';
  if (value === 'wpa2') return 'wpa2';
  if (value === 'wpa') return 'wpa';
  if (value === 'wep') return 'wep';
  return 'open';
};

export const normalizeChannel = (channel: string | number | undefined): string => {
  if (!channel) return '2.4GHz';
  const trimmed = String(channel).trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'auto' || lower === 'otomatik') return 'auto';
  if (lower === '5ghz') return '5GHz';
  if (lower === '2.4ghz') return '2.4GHz';

  const numMatch = trimmed.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (!isNaN(num) && num >= 1 && num <= 165) {
      return String(num);
    }
  }

  return trimmed;
};

export function getChannelBand(channel: string | undefined): '2.4GHz' | '5GHz' | 'auto' {
  if (!channel) return '2.4GHz';
  const val = channel.trim().toLowerCase();
  if (val === 'auto' || val === 'otomatik') return 'auto';
  if (val === '5ghz') return '5GHz';
  if (val === '2.4ghz') return '2.4GHz';
  const numMatch = val.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (!isNaN(num) && num >= 36) return '5GHz';
  }
  return '2.4GHz';
}

export function formatChannelDisplay(channel: string | undefined, language = 'tr'): string {
  const isTr = language === 'tr';
  if (!channel) return isTr ? 'Otomatik' : 'Auto';
  const val = channel.trim();
  const lower = val.toLowerCase();
  if (lower === 'auto') return isTr ? 'Otomatik' : 'Auto';
  if (lower === '2.4ghz') return '2.4 GHz';
  if (lower === '5ghz') return '5 GHz';

  const numMatch = val.match(/\d+/);
  if (!numMatch) return val;
  const num = parseInt(numMatch[0], 10);
  if (isNaN(num)) return val;

  const ch24 = WIRELESS_CHANNELS_2_4GHZ.find(c => c.channelNumber === num);
  if (ch24) return isTr ? `Kanal ${num} (${ch24.frequencyGhz.toFixed(3)} GHz)` : `Channel ${num} (${ch24.frequencyGhz.toFixed(3)} GHz)`;

  const ch5 = WIRELESS_CHANNELS_5GHZ.find(c => c.channelNumber === num);
  if (ch5) return isTr ? `Kanal ${num} (${ch5.frequencyGhz.toFixed(3)} GHz)` : `Channel ${num} (${ch5.frequencyGhz.toFixed(3)} GHz)`;

  return isTr ? `Kanal ${num}` : `Channel ${num}`;
}

export function wifiChannelMatches(apWifi: DeviceWifiConfig | undefined, clientWifi: DeviceWifiConfig): boolean {
  if (!apWifi) return true;
  const apCh = normalizeChannel(apWifi.channel);
  const clientCh = normalizeChannel(clientWifi.channel);

  if (!clientCh || clientCh === 'auto' || !apCh || apCh === 'auto') return true;
  if (clientCh.toLowerCase() === apCh.toLowerCase()) return true;

  const apBand = getChannelBand(apCh);
  const clientBand = getChannelBand(clientCh);

  if (clientCh === '2.4GHz') return apBand === '2.4GHz';
  if (clientCh === '5GHz') return apBand === '5GHz';
  if (apCh === '2.4GHz') return clientBand === '2.4GHz';
  if (apCh === '5GHz') return clientBand === '5GHz';

  const clientNum = parseInt(clientCh, 10);
  const apNum = parseInt(apCh, 10);
  if (!isNaN(clientNum) && !isNaN(apNum)) {
    return clientNum === apNum;
  }

  return apBand === clientBand;
}

export function normalizeMac(mac: string | undefined): string {
  if (!mac) return '';
  const clean = mac.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (clean.length === 12) {
    return clean.match(/.{1,2}/g)?.join(':') || clean;
  }
  return mac.trim().toLowerCase();
}

export function getDeviceMacAddress(device: CanvasDevice | undefined, deviceStates?: Map<string, SwitchState>): string | undefined {
  if (!device) return undefined;
  if (device.macAddress) return device.macAddress;
  const wlanPort = device.ports?.find(p => p.id === 'wlan0');
  if (wlanPort?.macAddress) return wlanPort.macAddress;
  const firstPortWithMac = device.ports?.find(p => p.macAddress);
  if (firstPortWithMac?.macAddress) return firstPortWithMac.macAddress;

  const safeDeviceStates = ensureDeviceStatesMap(deviceStates);
  const state = safeDeviceStates?.get(device.id);
  if (state?.ports?.['wlan0']?.macAddress) return state.ports['wlan0'].macAddress;
  if (state?.macAddress) return state.macAddress;
  const firstStatePort = state?.ports ? Object.values(state.ports).find(p => p?.macAddress) : undefined;
  if (firstStatePort?.macAddress) return firstStatePort.macAddress;

  // Deterministic fallback MAC for devices without explicit MAC property
  let hash = 0;
  const id = device.id || device.name || 'client';
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
  return `00:50:79:${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`;
}

export function wifiMacFilterMatches(
  apWifi: DeviceWifiConfig | undefined,
  clientDevice: CanvasDevice | undefined,
  deviceStates?: Map<string, SwitchState>
): boolean {
  if (!apWifi || !apWifi.macFilterEnabled) return true;

  const filterList = Array.isArray(apWifi.macFilterList) ? apWifi.macFilterList : [];
  const filterMode = apWifi.macFilterMode === 'deny' ? 'deny' : 'allow';

  const clientMac = getDeviceMacAddress(clientDevice, deviceStates);
  if (!clientMac) {
    return filterMode === 'deny';
  }

  const normalizedClientMac = normalizeMac(clientMac);
  const isInList = filterList.some(item => normalizeMac(item) === normalizedClientMac);

  if (filterMode === 'deny') {
    // Blacklist: reject if in list
    return !isInList;
  }

  // Whitelist (allow): allow only if in list
  return isInList;
}

export function getDeviceWifiConfig(device: CanvasDevice | undefined, deviceStates?: Map<string, SwitchState>): DeviceWifiConfig | undefined {
  if (!device) return undefined;
  const safeDeviceStates = ensureDeviceStatesMap(deviceStates);
  const state = safeDeviceStates?.get(device.id);
  const wlanState: Port | undefined = state?.ports['wlan0'];
  const defaultMode: WifiMode = device.type === 'pc' ? 'client' : 'ap';

  if (wlanState?.wifi?.ssid) {
    const mode = normalizeWifiMode(wlanState.wifi.mode, defaultMode);
    const enabled = mode !== 'disabled' && !(wlanState.shutdown ?? false);
    return {
      enabled,
      ssid: wlanState.wifi.ssid,
      password: wlanState.wifi.password,
      security: normalizeSecurity(wlanState.wifi.security),
      channel: normalizeChannel(wlanState.wifi.channel),
      mode,
      hidden: wlanState.wifi.hidden ?? device.wifi?.hidden,
      maxClients: wlanState.wifi.maxClients ?? device.wifi?.maxClients,
      macFilterEnabled: Boolean(wlanState.wifi.macFilterEnabled ?? device.wifi?.macFilterEnabled),
      macFilterMode: (wlanState.wifi.macFilterMode || device.wifi?.macFilterMode) === 'deny' ? 'deny' : 'allow',
      macFilterList: Array.isArray(wlanState.wifi.macFilterList) && wlanState.wifi.macFilterList.length > 0
        ? wlanState.wifi.macFilterList
        : (Array.isArray(device.wifi?.macFilterList) ? device.wifi.macFilterList : []),
      ssids: Array.isArray(wlanState.wifi.ssids) && wlanState.wifi.ssids.length > 0
        ? wlanState.wifi.ssids
        : (Array.isArray(device.wifi?.ssids) ? device.wifi.ssids : []),
      powerDisabled: device.wifi?.powerDisabled,
    };
  }

  if (device.wifi?.ssid) {
    const mode = normalizeWifiMode(device.wifi.mode, defaultMode);
    return {
      enabled: device.wifi.enabled ?? true,
      ssid: device.wifi.ssid,
      password: device.wifi.password,
      security: normalizeSecurity(device.wifi.security),
      channel: normalizeChannel(device.wifi.channel),
      mode,
      hidden: device.wifi.hidden,
      maxClients: device.wifi.maxClients,
      macFilterEnabled: Boolean(device.wifi.macFilterEnabled),
      macFilterMode: device.wifi.macFilterMode === 'deny' ? 'deny' : 'allow',
      macFilterList: Array.isArray(device.wifi.macFilterList) ? device.wifi.macFilterList : [],
      ssids: Array.isArray(device.wifi.ssids) ? device.wifi.ssids : [],
    };
  }

  const wlanPort = device.ports.find(p => p.id === 'wlan0' && p.wifi?.ssid);
  if (wlanPort && wlanPort.wifi) {
    const mode = normalizeWifiMode(wlanPort.wifi.mode, defaultMode);
    return {
      enabled: mode !== 'disabled' && !(wlanPort.shutdown ?? false),
      ssid: wlanPort.wifi.ssid,
      password: wlanPort.wifi.password,
      security: normalizeSecurity(wlanPort.wifi.security),
      channel: normalizeChannel(wlanPort.wifi.channel),
      mode,
      hidden: wlanPort.wifi.hidden ?? device.wifi?.hidden,
      maxClients: wlanPort.wifi.maxClients ?? device.wifi?.maxClients,
      macFilterEnabled: Boolean(wlanPort.wifi.macFilterEnabled ?? device.wifi?.macFilterEnabled),
      macFilterMode: (wlanPort.wifi.macFilterMode || device.wifi?.macFilterMode) === 'deny' ? 'deny' : 'allow',
      macFilterList: Array.isArray(wlanPort.wifi.macFilterList) && wlanPort.wifi.macFilterList.length > 0
        ? wlanPort.wifi.macFilterList
        : (Array.isArray(device.wifi?.macFilterList) ? device.wifi.macFilterList : []),
      ssids: Array.isArray(wlanPort.wifi.ssids) && wlanPort.wifi.ssids.length > 0
        ? wlanPort.wifi.ssids
        : (Array.isArray(device.wifi?.ssids) ? device.wifi.ssids : []),
    };
  }

  // Support CLI-configured Dot11Radio / Wireless config on Router / Switch devices
  if (state?.wirelessRadios && Object.keys(state.wirelessRadios).length > 0) {
    const radio = Object.values(state.wirelessRadios).find(r => !r.shutdown && r.ssid) || Object.values(state.wirelessRadios)[0];
    if (radio && radio.ssid) {
      const config = state.wirelessConfig?.[radio.ssid];
      return {
        enabled: !radio.shutdown,
        ssid: radio.ssid,
        password: config?.presharedKey,
        security: normalizeSecurity(config?.authentication || radio.encryption),
        channel: normalizeChannel(radio.channel),
        mode: defaultMode,
      };
    }
  }

  if (state?.wirelessConfig && Object.keys(state.wirelessConfig).length > 0) {
    const firstConfig = Object.values(state.wirelessConfig)[0];
    if (firstConfig && firstConfig.name) {
      return {
        enabled: true,
        ssid: firstConfig.name,
        password: firstConfig.presharedKey,
        security: normalizeSecurity(firstConfig.authentication),
        channel: '2.4GHz',
        mode: defaultMode,
      };
    }
  }

  return undefined;
}

export function getWirelessSignalStrength(
  device: CanvasDevice | undefined,
  devices: CanvasDevice[] = [],
  deviceStates?: Map<string, SwitchState>
): number {
  if (!device) return 0;
  const safeDeviceStates = ensureDeviceStatesMap(deviceStates);
  const pcWifi = getDeviceWifiConfig(device, safeDeviceStates);
  if (!pcWifi || !pcWifi.enabled || !pcWifi.ssid) return 0;
  if (pcWifi.powerDisabled) return 0;
  if (pcWifi.mode !== 'client' && pcWifi.mode !== 'sta') return 0;

  const targetSsid = pcWifi.ssid.toLowerCase();
  let minDist = Infinity;

  devices.forEach(dev => {
    if (dev.id === device.id) return;
    if (dev.status === 'offline') return;
    const devState = safeDeviceStates.get(dev.id);
    const apWifi = getDeviceWifiConfig(dev, safeDeviceStates);
    const activeSsids = getApActiveSsids(apWifi, devState);
    const matchingSsid = activeSsids.find(s => s.ssid.toLowerCase() === targetSsid);
    if (!matchingSsid) return;

    const clientSec = (pcWifi.security || 'open').toLowerCase();
    const apSec = (matchingSsid.security || 'open').toLowerCase();
    if (clientSec !== apSec) return;
    if (apSec !== 'open' && matchingSsid.password !== pcWifi.password) return;

    if (apWifi && !wifiChannelMatches(apWifi, pcWifi)) return;
    if (!wifiMacFilterMatches(apWifi, device, safeDeviceStates)) return;

    const dx = (device.x || 0) - (dev.x || 0);
    const dy = (device.y || 0) - (dev.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  });

  if (minDist === Infinity) return 0;
  if (minDist < 150) return 5;
  if (minDist < 250) return 4;
  if (minDist < 350) return 3;
  if (minDist < 450) return 2;
  if (minDist < 550) return 1;
  return 0;
}

export function getWirelessDistance(
  device: CanvasDevice | undefined,
  devices: CanvasDevice[] = [],
  deviceStates?: Map<string, SwitchState>
): number {
  if (!device) return Infinity;
  const safeDeviceStates = ensureDeviceStatesMap(deviceStates);
  const pcWifi = getDeviceWifiConfig(device, safeDeviceStates);
  if (!pcWifi || !pcWifi.enabled || !pcWifi.ssid) return Infinity;
  if (pcWifi.mode !== 'client' && pcWifi.mode !== 'sta') return Infinity;

  const targetSsid = pcWifi.ssid.toLowerCase();
  let minDist = Infinity;

  devices.forEach(dev => {
    if (dev.id === device.id) return;
    const devState = safeDeviceStates.get(dev.id);
    const apWifi = getDeviceWifiConfig(dev, safeDeviceStates);
    const activeSsids = getApActiveSsids(apWifi, devState);
    const matchingSsid = activeSsids.find(s => s.ssid.toLowerCase() === targetSsid);
    if (!matchingSsid) return;

    if (apWifi && !wifiChannelMatches(apWifi, pcWifi)) return;
    if (!wifiMacFilterMatches(apWifi, device, safeDeviceStates)) return;

    const dx = (device.x || 0) - (dev.x || 0);
    const dy = (device.y || 0) - (dev.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  });

  return minDist;
}

function getApMaxClients(apWifi: DeviceWifiConfig | undefined): number {
  const value = Number(apWifi?.maxClients);
  if (!Number.isFinite(value) || value <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(value);
}

export function getApActiveSsids(
  apWifi: DeviceWifiConfig | undefined,
  state?: SwitchState,
  deviceStates?: Map<string, SwitchState>
): Array<{ ssid: string; security: string; password?: string }> {
  const list: Array<{ ssid: string; security: string; password?: string }> = [];

  if (apWifi && apWifi.enabled) {
    if (apWifi.ssid) {
      list.push({
        ssid: apWifi.ssid,
        security: apWifi.security || 'open',
        password: apWifi.password,
      });
    }

    if (Array.isArray(apWifi.ssids)) {
      for (const item of apWifi.ssids) {
        if (item.enabled !== false && item.ssid) {
          list.push({
            ssid: item.ssid,
            security: item.security || 'open',
            password: item.password,
          });
        }
      }
    }
  }

  if (state?.wlcWlans) {
    for (const wlan of Object.values(state.wlcWlans)) {
      if (wlan.status === 'enabled' && wlan.ssid) {
        list.push({
          ssid: wlan.ssid,
          security: wlan.security || 'open',
          password: wlan.password,
        });
      }
    }
  } else if (deviceStates && apWifi && apWifi.enabled) {
    for (const s of deviceStates.values()) {
      if (s.wlcWlans) {
        for (const wlan of Object.values(s.wlcWlans)) {
          if (wlan.status === 'enabled' && wlan.ssid) {
            list.push({
              ssid: wlan.ssid,
              security: wlan.security || 'open',
              password: wlan.password,
            });
          }
        }
      }
    }
  }

  if (state?.wirelessRadios) {
    for (const radio of Object.values(state.wirelessRadios)) {
      if (!radio.shutdown && radio.ssid) {
        const config = state.wirelessConfig?.[radio.ssid];
        list.push({
          ssid: radio.ssid,
          security: config?.authentication || radio.encryption || 'open',
          password: config?.presharedKey,
        });
      }
    }
  }

  if (state?.wirelessConfig) {
    for (const config of Object.values(state.wirelessConfig)) {
      if (config.name) {
        list.push({
          ssid: config.name,
          security: config.authentication || 'open',
          password: config.presharedKey,
        });
      }
    }
  }

  const seen = new Set<string>();
  return list.filter(item => {
    const key = item.ssid.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildImplicitWirelessConnections(
  devices: CanvasDevice[],
  deviceStates?: Map<string, SwitchState>,
  idPrefix = 'wireless'
): CanvasConnection[] {
  const safeDeviceStates = ensureDeviceStatesMap(deviceStates);
  const apDevices = devices.filter(d => d.type === 'switchL2' || d.type === 'switchL3' || d.type === 'router' || d.type === 'wlc');
  const clientDevices = devices.filter(d => {
    const wifi = getDeviceWifiConfig(d, safeDeviceStates);
    return (d.type === 'pc' || d.type === 'iot') && !!wifi && wifi.enabled && !!wifi.ssid && (wifi.mode === 'client' || wifi.mode === 'sta');
  });

  const candidatesByAp = new Map<string, Array<{ client: CanvasDevice; dist: number; ssidIndex: number; ssid: string }>>();

  for (const ap of apDevices) {
    const apState = safeDeviceStates?.get(ap.id);
    const apWifi = getDeviceWifiConfig(ap, safeDeviceStates);
    const activeSsids = getApActiveSsids(apWifi, apState, safeDeviceStates);
    if (activeSsids.length === 0) continue;

    for (const client of clientDevices) {
      const clientWifi = getDeviceWifiConfig(client, safeDeviceStates);
      if (!clientWifi || !clientWifi.enabled || !clientWifi.ssid) continue;
      if (clientWifi.bssid && clientWifi.bssid !== ap.id) continue;

      const matchingSsidIndex = activeSsids.findIndex(s => s.ssid.toLowerCase() === clientWifi.ssid.toLowerCase());
      if (matchingSsidIndex === -1) continue;
      const matchingSsid = activeSsids[matchingSsidIndex];

      const clientSec = (clientWifi.security || 'open').toLowerCase();
      const apSec = (matchingSsid.security || 'open').toLowerCase();
      if (clientSec !== apSec) continue;
      if (apSec !== 'open' && matchingSsid.password !== clientWifi.password) continue;

      if (!wifiChannelMatches(apWifi, clientWifi)) continue;
      if (!wifiMacFilterMatches(apWifi, client, safeDeviceStates)) continue;

      const dx = (client.x || 0) - (ap.x || 0);
      const dy = (client.y || 0) - (ap.y || 0);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 550) continue;

      const list = candidatesByAp.get(ap.id) || [];
      list.push({ client, dist, ssidIndex: matchingSsidIndex, ssid: matchingSsid.ssid });
      candidatesByAp.set(ap.id, list);
    }
  }

  const wirelessConnections: CanvasConnection[] = [];

  // A client associates with one AP only. When multiple APs advertise the
  // same SSID, prefer the closest eligible AP (unless BSSID is pinned above).
  const allCandidates = Array.from(candidatesByAp.entries()).flatMap(([apId, candidates]) =>
    candidates.map(candidate => ({ apId, ...candidate }))
  );
  allCandidates.sort((a, b) => a.dist - b.dist || a.client.id.localeCompare(b.client.id) || a.apId.localeCompare(b.apId));

  const connectedClients = new Set<string>();
  const apClientCounts = new Map<string, number>();
  for (const { apId, client, ssidIndex, ssid } of allCandidates) {
    if (connectedClients.has(client.id)) continue;
    const ap = apDevices.find(device => device.id === apId);
    if (!ap) continue;
    const limit = getApMaxClients(getDeviceWifiConfig(ap, safeDeviceStates));
    const currentCount = apClientCounts.get(apId) || 0;
    if (currentCount >= limit) continue;

    wirelessConnections.push({
      id: `${idPrefix}-${client.id}-${apId}`,
      sourceDeviceId: client.id,
      sourcePort: 'wlan0',
      targetDeviceId: apId,
      targetPort: 'wlan0',
      cableType: 'wireless',
      active: true,
      ssidIndex,
      ssid,
    } as CanvasConnection);
    connectedClients.add(client.id);
    apClientCounts.set(apId, currentCount + 1);
  }

  return wirelessConnections;
}
