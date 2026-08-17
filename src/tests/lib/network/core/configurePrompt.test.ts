import { describe, it, expect } from 'vitest';
import { executeCommand } from '@/lib/network/executor';
import { createInitialState } from '@/lib/network/initialState';
import type { SwitchState } from '@/lib/network/types';

function enable(state: SwitchState): SwitchState {
  const r = executeCommand(state, 'enable', 'en');
  if (!r.newState) throw new Error('enable failed');
  return { ...state, ...r.newState };
}

function promptForSource(state: SwitchState): SwitchState {
  const r = executeCommand(state, 'configure', 'en');
  if (!r.newState) throw new Error('configure prompt failed');
  return { ...state, ...r.newState };
}

describe('configure source prompt', () => {
  it('should ask "Configuring from terminal, memory, or network [terminal]?" when bare "configure" is entered', () => {
    const state = enable(createInitialState());
    const result = executeCommand(state, 'configure', 'en');
    expect(result.success).toBe(true);
    expect(result.output).toContain('Configuring from terminal, memory, or network [terminal]?');
    expect(result.newState?.awaitingConfigSource).toBe(true);
  });

  it('should enter config mode directly for explicit "configure terminal"', () => {
    const state = enable(createInitialState());
    const result = executeCommand(state, 'configure terminal', 'en');
    expect(result.success).toBe(true);
    expect(result.newState?.currentMode).toBe('config');
    expect(result.newState?.awaitingConfigSource).toBeUndefined();
  });

  it('should enter config mode when answering "terminal" to the prompt', () => {
    const state = promptForSource(enable(createInitialState()));
    const result = executeCommand(state, 'terminal', 'en');
    expect(result.success).toBe(true);
    expect(result.newState?.currentMode).toBe('config');
    expect(result.newState?.awaitingConfigSource).toBe(false);
  });

  it('should enter config mode when pressing enter (empty answer defaults to terminal)', () => {
    const state = promptForSource(enable(createInitialState()));
    const result = executeCommand(state, '', 'en');
    expect(result.success).toBe(true);
    expect(result.newState?.currentMode).toBe('config');
  });

  it('should report unsupported source for "network" and leave privileged mode', () => {
    const state = promptForSource(enable(createInitialState()));
    const result = executeCommand(state, 'network', 'en');
    expect(result.success).toBe(true);
    expect(result.output).toContain('not supported');
    expect(result.newState?.currentMode).toBeUndefined();
    expect(result.newState?.awaitingConfigSource).toBe(false);
  });

  it('should re-ask the prompt on invalid input', () => {
    const state = promptForSource(enable(createInitialState()));
    const result = executeCommand(state, 'bogus', 'en');
    expect(result.success).toBe(true);
    expect(result.output).toContain('Configuring from terminal, memory, or network [terminal]?');
    expect(result.newState?.awaitingConfigSource).toBe(true);
  });
});