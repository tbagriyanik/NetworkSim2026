import { describe, it, expect } from 'vitest';
import { getInferredCableTypeForPort } from '@/components/network/helpers/cableAutoSelection';

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

