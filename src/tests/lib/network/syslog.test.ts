import { describe, it, expect } from 'vitest';
import { generateSyslogMessage, shouldLogMessage } from '@/lib/network/syslog';
import { SwitchState } from '@/lib/network/types';

describe('Syslog Engine', () => {
  const mockDevice = {
    hostname: 'Router1',
    ip: '192.168.1.1'
  } as SwitchState;

  it('generates syslog messages correctly', () => {
    const msg = generateSyslogMessage(mockDevice, 'SYS', 5, 'CONFIG_I', 'Configured from console by admin');

    expect(msg.id).toBeDefined();
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(msg.sourceIp).toBe('192.168.1.1');
    expect(msg.sourceName).toBe('Router1');
    expect(msg.facility).toBe('SYS');
    expect(msg.severity).toBe(5);
    expect(msg.severityName).toBe('notification');
    expect(msg.mnemonic).toBe('CONFIG_I');
    expect(msg.message).toBe('Configured from console by admin');
  });

  it('filters by severity properly (numeric)', () => {
    // Trap level 4 (warnings) means severity 0,1,2,3,4 are allowed. 5,6,7 are denied.
    expect(shouldLogMessage(0, '4')).toBe(true);  // emergency
    expect(shouldLogMessage(4, '4')).toBe(true);  // warning
    expect(shouldLogMessage(5, '4')).toBe(false); // notification
    expect(shouldLogMessage(7, '4')).toBe(false); // debugging
  });

  it('filters by severity properly (named)', () => {
    // Trap level 'warnings' (4)
    expect(shouldLogMessage(3, 'warnings')).toBe(true);  // error
    expect(shouldLogMessage(4, 'warnings')).toBe(true);  // warning
    expect(shouldLogMessage(6, 'warnings')).toBe(false); // informational
  });

  it('defaults to informational (6) when no trap level specified', () => {
    expect(shouldLogMessage(6, undefined)).toBe(true);  // informational
    expect(shouldLogMessage(7, undefined)).toBe(false); // debugging
  });
});
