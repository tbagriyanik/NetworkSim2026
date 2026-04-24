import { describe, it, expect } from 'vitest';
import { executeCommand } from '../lib/network/executor';
import { createInitialState, normalizePortId } from '../lib/network/initialState';
import { SwitchState } from '../lib/network/types';

describe('Interface Validation', () => {
  it('normalizePortId should parse fastethernet0/2222 correctly', () => {
    const result = normalizePortId('fastethernet0/2222');
    console.log('normalizePortId result for fastethernet0/2222:', result);
    expect(result).toBe('fa0/2222');
  });

  it('normalizePortId should return null for invalid faa0/232323', () => {
    const result = normalizePortId('faa0/232323');
    console.log('normalizePortId result for faa0/232323:', result);
    expect(result).toBeNull();
  });

  it('should reject invalid interface fa0/2222', () => {
    // Create initial state (config mode'a geç)
    let state: SwitchState = createInitialState();
    
    // Önce enable moduna geç
    let result = executeCommand(state, 'enable');
    expect(result.success).toBe(true);
    state = { ...state, ...result.newState };
    
    // Sonra config mode'a geç
    result = executeCommand(state, 'configure terminal');
    expect(result.success).toBe(true);
    state = { ...state, ...result.newState };
    expect(state.currentMode).toBe('config');
    
    // Şimdi geçersiz interface'e girme denemesi
    result = executeCommand(state, 'interface fastethernet0/2222');
    console.log('Result for fa0/2222:', result);
    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('should reject invalid interface faa0/232323', () => {
    let state: SwitchState = createInitialState();
    
    // enable -> config mode
    let result = executeCommand(state, 'enable');
    state = { ...state, ...result.newState };
    result = executeCommand(state, 'configure terminal');
    state = { ...state, ...result.newState };
    
    // Tamamen geçersiz interface
    result = executeCommand(state, 'interface faa0/232323');
    console.log('Result for faa0/232323:', result);
    console.log('state.ports keys:', Object.keys(state.ports));
    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('should reject invalid interface int fa0/9999', () => {
    let state: SwitchState = createInitialState();
    
    // enable -> config mode
    let result = executeCommand(state, 'enable');
    state = { ...state, ...result.newState };
    result = executeCommand(state, 'configure terminal');
    state = { ...state, ...result.newState };
    
    // Kısa form deneyelim (executor.ts'de dönüştürülüyor)
    result = executeCommand(state, 'int fa0/9999');
    console.log('Result for int fa0/9999:', result);
    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('should accept valid interface fa0/1', () => {
    let state: SwitchState = createInitialState();
    
    // enable -> config mode
    let result = executeCommand(state, 'enable');
    state = { ...state, ...result.newState };
    result = executeCommand(state, 'configure terminal');
    state = { ...state, ...result.newState };
    
    // Geçerli interface
    result = executeCommand(state, 'interface fastethernet0/1');
    console.log('Result for fa0/1:', result);
    expect(result.success).toBe(true);
    expect(result.newState?.currentMode).toBe('interface');
  });
});
