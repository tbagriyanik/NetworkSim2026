import { describe, expect, it } from 'vitest';
import {
  getDeviceWifiConfig,
  getWirelessSignalStrength,
  getWirelessDistance,
  buildImplicitWirelessConnections,
} from '@/lib/network/wireless';
import type { CanvasDevice } from '@/components/network/networkTopology.types';
import type { SwitchState } from '@/lib/network/types';
import { parseCommand, validateCommand } from '@/lib/network/parser';
import { createInitialState } from '@/lib/network/initialState';
import { interfaceHandlers } from '@/lib/network/core/interfaceCommands';

describe('Wireless WEP Security Support', () => {
  const routerWithWep: CanvasDevice = {
    id: 'router-1',
    type: 'router',
    name: 'R1-WEP',
    ip: '192.168.1.1',
    status: 'online',
    x: 100,
    y: 100,
    ports: [
      {
        id: 'wlan0',
        label: 'WLAN0',
        status: 'connected',
        shutdown: false,
        wifi: {
          ssid: 'SecretWepNet',
          security: 'wep',
          password: 'mywepkey123',
          channel: '2.4GHz',
          mode: 'ap',
        },
      },
    ],
  };

  const clientPcMatchingWep: CanvasDevice = {
    id: 'pc-1',
    type: 'pc',
    name: 'PC-1',
    ip: '192.168.1.50',
    status: 'online',
    x: 150,
    y: 150,
    ports: [
      {
        id: 'wlan0',
        label: 'WLAN0',
        status: 'connected',
        shutdown: false,
      },
    ],
    wifi: {
      enabled: true,
      ssid: 'SecretWepNet',
      security: 'wep',
      password: 'mywepkey123',
      channel: '2.4GHz',
      mode: 'client',
    },
  };

  const clientPcWrongPasswordWep: CanvasDevice = {
    id: 'pc-2',
    type: 'pc',
    name: 'PC-2',
    ip: '192.168.1.51',
    status: 'online',
    x: 150,
    y: 150,
    ports: [
      {
        id: 'wlan0',
        label: 'WLAN0',
        status: 'connected',
        shutdown: false,
      },
    ],
    wifi: {
      enabled: true,
      ssid: 'SecretWepNet',
      security: 'wep',
      password: 'wrongwepkey',
      channel: '2.4GHz',
      mode: 'client',
    },
  };

  const clientPcWrongSecurity: CanvasDevice = {
    id: 'pc-3',
    type: 'pc',
    name: 'PC-3',
    ip: '192.168.1.52',
    status: 'online',
    x: 150,
    y: 150,
    ports: [
      {
        id: 'wlan0',
        label: 'WLAN0',
        status: 'connected',
        shutdown: false,
      },
    ],
    wifi: {
      enabled: true,
      ssid: 'SecretWepNet',
      security: 'wpa2',
      password: 'mywepkey123',
      channel: '2.4GHz',
      mode: 'client',
    },
  };

  it('correctly reads WEP wifi config from device and wlan port', () => {
    const config = getDeviceWifiConfig(routerWithWep);
    expect(config).toBeDefined();
    expect(config?.security).toBe('wep');
    expect(config?.ssid).toBe('SecretWepNet');
    expect(config?.password).toBe('mywepkey123');
  });

  it('calculates wireless signal strength for WEP clients within range', () => {
    const strength = getWirelessSignalStrength(clientPcMatchingWep, [routerWithWep, clientPcMatchingWep]);
    expect(strength).toBeGreaterThan(0);
  });

  it('calculates wireless distance accurately', () => {
    const distance = getWirelessDistance(clientPcMatchingWep, [routerWithWep, clientPcMatchingWep]);
    expect(distance).toBeCloseTo(Math.sqrt(50 * 50 + 50 * 50), 1);
  });

  it('establishes implicit wireless connection when WEP security and password match', () => {
    const connections = buildImplicitWirelessConnections([routerWithWep, clientPcMatchingWep]);
    expect(connections.length).toBe(1);
    expect(connections[0].sourceDeviceId).toBe('pc-1');
    expect(connections[0].targetDeviceId).toBe('router-1');
    expect(connections[0].cableType).toBe('wireless');
  });

  it('does NOT establish connection when WEP password is incorrect', () => {
    const connections = buildImplicitWirelessConnections([routerWithWep, clientPcWrongPasswordWep]);
    expect(connections.length).toBe(0);
  });

  it('does NOT establish connection when security type mismatches (e.g. WPA2 client with WEP AP)', () => {
    const connections = buildImplicitWirelessConnections([routerWithWep, clientPcWrongSecurity]);
    expect(connections.length).toBe(0);
  });

  it('supports encryption wep CLI command on WLAN interface', () => {
    const state: SwitchState = {
      ...createInitialState(),
      deviceType: 'router',
      currentMode: 'interface',
      currentInterface: 'wlan0',
      ports: {
        wlan0: {
          id: 'wlan0',
          name: 'WLAN',
          status: 'notconnect',
          vlan: 1,
          mode: 'routed',
          duplex: 'auto',
          speed: 'auto',
          shutdown: false,
          type: 'fastethernet',
          wifi: {
            ssid: 'TestSSID',
            security: 'open',
            channel: '2.4GHz',
            mode: 'ap',
          },
        },
      },
    };

    const parsed = parseCommand('encryption wep', 'interface', state);
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    const validation = validateCommand(parsed, 'interface', state);
    expect(validation.valid).toBe(true);

    const result = interfaceHandlers.encryption(state, 'encryption wep', { language: 'en', deviceStates: new Map() });
    expect(result.success).toBe(true);
    expect(result.newState?.ports?.['wlan0']?.wifi?.security).toBe('wep');
  });

  it('supports security wep key set-key CLI command', () => {
    const state: SwitchState = {
      ...createInitialState(),
      currentMode: 'config',
      ports: {
        wlan0: {
          id: 'wlan0',
          name: 'WLAN',
          status: 'notconnect',
          vlan: 1,
          mode: 'routed',
          duplex: 'auto',
          speed: 'auto',
          shutdown: false,
          type: 'fastethernet',
        },
      },
    };

    const parsed = parseCommand('security wep key set-key ascii 0 secretkey123', 'config', state);
    expect(parsed).not.toBeNull();

    const result = interfaceHandlers['security wep key set-key'](
      state,
      'security wep key set-key ascii 0 secretkey123',
      { language: 'en', deviceStates: new Map() }
    );
    expect(result.success).toBe(true);
    expect(result.newState?.ports?.['wlan0']?.wifi?.security).toBe('wep');
    expect(result.newState?.ports?.['wlan0']?.wifi?.password).toBe('secretkey123');
  });
});
