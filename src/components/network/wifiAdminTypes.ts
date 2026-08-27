import type { DeviceWifiSsidProfile } from '@/lib/network/wireless';

export interface WifiAdminConfig {
  enabled: boolean;
  ssid: string;
  security: 'open' | 'wep' | 'wpa' | 'wpa2' | 'wpa3';
  password?: string;
  channel: '2.4GHz' | '5GHz' | string;
  mode: 'ap' | 'client';
  hidden?: boolean;
  maxClients?: number;
  macFilterEnabled?: boolean;
  macFilterMode?: 'allow' | 'deny';
  macFilterList?: string[];
  ssids?: DeviceWifiSsidProfile[];
}

export interface ConnectedIoTDevice {
  id: string;
  name: string;
  sensorType: string;
  connected: boolean;
  ip?: string;
  isWired?: boolean;
  mac?: string;
  ssid?: string;
  signalPercent?: number;
  rssiDbm?: number;
}

export interface AvailableIoTDevice {
  id: string;
  name: string;
  sensorType: string;
  currentSsid?: string;
}
