import { describe, expect, it } from 'vitest';
import { portTasks, calculateTaskScore, getTaskStatus, type TaskContext } from '../taskDefinitions';
import type { SwitchState } from '../types';

const baseState = (): SwitchState => ({
  hostname: 'Switch',
  macAddress: '00:11:22:33:44:55',
  switchModel: 'WS-C2960-24TT-L',
  switchLayer: 'L2',
  currentMode: 'privileged',
  ports: {
    'fa0/1': {
      id: 'fa0/1',
      name: '',
      description: '',
      status: 'connected',
      vlan: 1,
      mode: 'access',
      duplex: 'auto',
      speed: 'auto',
      shutdown: false,
      type: 'fastethernet',
    },
  },
  vlans: { 1: { id: 1, name: 'default', status: 'active', ports: [] } },
  security: {
    enableSecretEncrypted: false,
    servicePasswordEncryption: false,
    users: [],
    consoleLine: { login: false, transportInput: [] },
    vtyLines: { login: false, transportInput: [] },
  },
  runningConfig: [],
  commandHistory: [],
  historyIndex: 0,
  version: { nosVersion: '15.2', modelName: '2960', serialNumber: 'ABC123', uptime: '1 day' },
  macAddressTable: [],
  ipRouting: false,
});

const context = (): TaskContext => ({
  cableInfo: {
    connected: false,
    cableType: 'straight',
    sourceDevice: 'pc',
    targetDevice: 'switchL2',
  },
  showPCPanel: false,
  selectedDevice: 'switchL2',
  language: 'tr',
});

describe('port description task', () => {
  it('credits description text stored in description field', () => {
    const state = baseState();
    state.ports['fa0/1'].description = 'Uplink to Core';

    const task = portTasks.find((item) => item.id === 'add-description');

    expect(task).toBeTruthy();
    expect(getTaskStatus(task!, state, context())).toBe(true);
  });

  it('includes description task in total score', () => {
    const state = baseState();
    state.ports['fa0/1'].description = 'Uplink to Core';

    const taskContext = context();
    expect(calculateTaskScore(portTasks, state, taskContext)).toBe(20);
  });
});
