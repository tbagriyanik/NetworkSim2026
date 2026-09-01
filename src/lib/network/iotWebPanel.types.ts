/**
 * IoT Web Panel Type Definitions
 * Centralized types for IoT web panel functionality
 */

export interface IotRule {
  id: string;
  condition: string;
  action: string;
  enabled?: boolean;
}

export interface IotDevice {
  id: string;
  name: string;
  ip?: string;
  macAddress?: string;
  status: 'online' | 'offline';
  wifi?: {
    enabled: boolean;
    ssid?: string;
    powerDisabled?: boolean;
  };
  iot?: {
    collaborationEnabled?: boolean;
    rules?: IotRule[];
  };
}

export interface IotPanelConfig {
  language: 'tr' | 'en';
  routerId?: string;
  routerSsid?: string;
  topologyConnections?: Array<{
    sourceDeviceId: string;
    targetDeviceId: string;
    from?: string;
    to?: string;
  }>;
}

export interface IotDevicePageConfig {
  deviceId: string;
  deviceName: string;
  language: 'tr' | 'en';
  isActive: boolean;
  isPoweredOff: boolean;
  kind: string;
  rules: IotRule[];
  sensorType: string;
  iotDevices: IotDevice[];
  dataFlowDirection: 'input' | 'output' | 'input/output';
  allDevices: IotDevice[];
}