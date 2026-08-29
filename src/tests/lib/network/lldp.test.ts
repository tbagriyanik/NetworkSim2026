import { describe, it, expect, beforeEach } from 'vitest';
import { executeCommand } from '@/lib/network/executor';
import { createInitialState } from '@/lib/network/initialState';
import type { SwitchState } from '@/lib/network/types';

describe('LLDP Protocol Implementation', () => {
  let state: SwitchState;

  beforeEach(() => {
    state = createInitialState('TestSwitch', 'WS-C2960-24TT-L');
  });

  it('should enable and disable LLDP globally', () => {
    state.currentMode = 'config';

    // Enable LLDP
    let result = executeCommand(state, 'lldp run', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.lldpEnabled).toBe(true);

    // Disable LLDP
    result = executeCommand(state, 'no lldp run', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.lldpEnabled).toBe(false);
  });

  it('should set LLDP timer', () => {
    state.currentMode = 'config';
    let result = executeCommand(state, 'lldp timer 45', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.lldpTimer).toBe(45);
  });

  it('should set LLDP holdtime', () => {
    state.currentMode = 'config';
    let result = executeCommand(state, 'lldp holdtime 150', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.lldpHoldtime).toBe(150);
  });

  it('should set LLDP reinit', () => {
    state.currentMode = 'config';
    let result = executeCommand(state, 'lldp reinit 4', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.lldpReinit).toBe(4);
  });

  it('should configure LLDP transmit and receive on interface', () => {
    state.currentMode = 'interface';
    state.currentInterface = 'fa0/1';

    let result = executeCommand(state, 'lldp transmit', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.ports['fa0/1'].lldpTransmit).toBe(true);

    result = executeCommand(state, 'no lldp transmit', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.ports['fa0/1'].lldpTransmit).toBe(false);

    result = executeCommand(state, 'lldp receive', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.ports['fa0/1'].lldpReceive).toBe(true);

    result = executeCommand(state, 'no lldp receive', 'en', [], []);
    expect(result.success).toBe(true);
    if (result.newState) {
      state = { ...state, ...result.newState };
    }
    expect(state.ports['fa0/1'].lldpReceive).toBe(false);
  });
});
