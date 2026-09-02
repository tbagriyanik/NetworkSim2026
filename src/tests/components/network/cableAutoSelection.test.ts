import { describe, it, expect } from 'vitest';
import {
  getInferredCableTypeForPort,
  getAutoCableTypeBetweenDevices,
  findOptimalFreePort,
} from '@/components/network/helpers/cableAutoSelection';

describe('getInferredCableTypeForPort', () => {
  it('infers console cable for PC, Switch, WLC, and Router console ports', () => {
    expect(getInferredCableTypeForPort('console', undefined, 'straight')).toBe('console');
    expect(getInferredCableTypeForPort('com1', undefined, 'straight')).toBe('console');
    expect(getInferredCableTypeForPort('com2', undefined, 'straight')).toBe('console');
    expect(getInferredCableTypeForPort('rs232', undefined, 'straight')).toBe('console');
    expect(getInferredCableTypeForPort('PORT_X', 'console', 'straight')).toBe('console');
  });

  it('infers serial cable for Router serial ports', () => {
    expect(getInferredCableTypeForPort('s0/0/0', undefined, 'straight')).toBe('serial');
    expect(getInferredCableTypeForPort('s0/1/0', undefined, 'straight')).toBe('serial');
    expect(getInferredCableTypeForPort('s0/2/0', undefined, 'straight')).toBe('serial');
    expect(getInferredCableTypeForPort('Se0/0/0', undefined, 'straight')).toBe('serial');
    expect(getInferredCableTypeForPort('serial0/0/0', undefined, 'straight')).toBe('serial');
    expect(getInferredCableTypeForPort('ANY_PORT', 'serial', 'straight')).toBe('serial');
  });

  it('infers wireless cable for WLAN ports', () => {
    expect(getInferredCableTypeForPort('wlan0', undefined, 'straight')).toBe('wireless');
    expect(getInferredCableTypeForPort('ANY_PORT', 'wireless', 'straight')).toBe('wireless');
  });

  it('retains current cable type for standard ethernet ports', () => {
    expect(getInferredCableTypeForPort('gi0/0', 'gigabitethernet', 'straight')).toBe('straight');
    expect(getInferredCableTypeForPort('fa0/1', 'fastethernet', 'crossover')).toBe('crossover');
    expect(getInferredCableTypeForPort('eth0', undefined, 'straight')).toBe('straight');
  });
});

describe('getAutoCableTypeBetweenDevices', () => {
  it('identifies crossover cable for same-layer devices', () => {
    expect(getAutoCableTypeBetweenDevices('pc', 'pc')).toBe('crossover');
    expect(getAutoCableTypeBetweenDevices('switchL2', 'switchL2')).toBe('crossover');
    expect(getAutoCableTypeBetweenDevices('router', 'router')).toBe('crossover');
    expect(getAutoCableTypeBetweenDevices('router', 'pc')).toBe('crossover');
  });

  it('identifies straight cable for different-layer devices', () => {
    expect(getAutoCableTypeBetweenDevices('pc', 'switchL2')).toBe('straight');
    expect(getAutoCableTypeBetweenDevices('router', 'switchL2')).toBe('straight');
  });
});

describe('findOptimalFreePort', () => {
  it('picks the first non-console free port', () => {
    const mockDevice = {
      id: 'sw-1',
      name: 'Switch-1',
      type: 'switchL2' as const,
      ip: '192.168.1.2',
      x: 0,
      y: 0,
      status: 'online' as const,
      ports: [
        { id: 'console', label: 'Console', status: 'disconnected' as const, type: 'console' },
        { id: 'fa0/1', label: 'Fa0/1', status: 'connected' as const },
        { id: 'fa0/2', label: 'Fa0/2', status: 'disconnected' as const },
        { id: 'fa0/3', label: 'Fa0/3', status: 'disconnected' as const },
      ],
    };

    const connectedPortIds = new Set(['sw-1-fa0/1']);
    const port = findOptimalFreePort(mockDevice, connectedPortIds);
    expect(port?.id).toBe('fa0/2');
  });
});


