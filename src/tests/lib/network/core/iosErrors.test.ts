import { describe, it, expect } from 'vitest';
import { IOS_ERRORS, iosModeError } from '@/lib/network/core/iosErrors';

describe('IOS_ERRORS', () => {
  it('should define invalidInput error', () => {
    expect(IOS_ERRORS.invalidInput).toContain("Invalid input detected");
  });

  it('should define incomplete command error', () => {
    expect(IOS_ERRORS.incomplete).toContain('Incomplete command');
  });

  it('should define ambiguous command error', () => {
    expect(IOS_ERRORS.ambiguous).toContain('Ambiguous command');
  });

  it('should define unknown command error', () => {
    expect(IOS_ERRORS.unknown).toContain('Unrecognized command');
  });

  it('should define access denied error', () => {
    expect(IOS_ERRORS.accessDenied).toContain('Access denied');
  });

  it('should define bad passwords error', () => {
    expect(IOS_ERRORS.badPasswords).toContain('Bad passwords');
  });

  it('should define marker', () => {
    expect(IOS_ERRORS.marker).toBe('^');
  });
});

describe('iosModeError', () => {
  it('should return error for user EXEC mode', () => {
    const result = iosModeError('show vlan', 'user', 'en');
    expect(result).toContain('User EXEC');
    expect(result).toContain('not available');
  });

  it('should return error for privileged EXEC mode', () => {
    const result = iosModeError('configure terminal', 'privileged', 'en');
    expect(result).toContain('Privileged EXEC');
  });

  it('should return error for config mode', () => {
    const result = iosModeError('copy running-config startup-config', 'config', 'en');
    expect(result).toContain('Global Configuration');
  });

  it('should handle unknown mode gracefully', () => {
    const result = iosModeError('test', 'unknown-mode', 'en');
    expect(result).toContain('unknown');
  });
});
