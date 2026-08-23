import { describe, it, expect } from 'vitest';
import { executeCommand } from '@/lib/network/executor';
import { createInitialState } from '@/lib/network/initialState';
import type { SwitchState } from '@/lib/network/types';

describe('Crypto Key Zeroize RSA', () => {
  const base = {
    ...createInitialState(),
    currentMode: 'config' as const,
    hostname: 'R1',
    domainName: 'lab.local',
  } as SwitchState;

  it('should report no keys when none were generated', () => {
    const result = executeCommand(base, 'crypto key zeroize rsa', 'en');
    expect(result.success).toBe(true);
    expect(result.output).toContain('% Keys do not exist.');
  });

  it('should store RSA keys after generate', () => {
    const result = executeCommand(base, 'crypto key generate rsa', 'en');
    expect(result.success).toBe(true);
    expect(result.newState?.rsaKeys).toEqual({ modulus: 1024, name: 'R1.lab.local' });
  });

  it('should prompt for confirmation when keys exist', () => {
    const gen = executeCommand(base, 'crypto key generate rsa', 'en');
    const withKeys = { ...base, ...gen.newState } as SwitchState;

    const result = executeCommand(withKeys, 'crypto key zeroize rsa', 'en');
    expect(result.success).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.confirmationAction).toBe('crypto-key-zeroize');
    expect(result.output).toContain('Are you sure you want to remove all RSA keys?');
  });

  it('should remove keys on confirmed zeroize', () => {
    const gen = executeCommand(base, 'crypto key generate rsa', 'en');
    const withKeys = { ...base, ...gen.newState } as SwitchState;

    const result = executeCommand(withKeys, 'crypto key zeroize rsa', 'en', undefined, undefined, undefined, undefined, true);
    expect(result.success).toBe(true);
    expect(result.output).toContain('% Keys to be removed are named R1.lab.local.');
    expect(result.output).toContain('% RSA key pair has been removed.');
    expect(result.newState?.rsaKeys).toBeUndefined();
  });

  it('should resolve abbreviated zeroize command', () => {
    const result = executeCommand(base, 'crypto key zeroize r', 'en');
    expect(result.success).toBe(true);
    expect(result.output).toContain('% Keys do not exist.');
  });

  it('should reject the command outside config mode', () => {
    const userMode = { ...base, currentMode: 'user' as const } as SwitchState;
    const result = executeCommand(userMode, 'crypto key zeroize rsa', 'en');
    expect(result.success).toBe(false);
  });
});