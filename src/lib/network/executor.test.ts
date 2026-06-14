import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwitchState, CommandMode } from './types';
import { getPrompt, getEstimatedSuggestions, commandHelp, executeCommand } from './executor';

// Import actual objects from parser to get commandPatterns
import { commandPatterns } from './parser';

// Mock imports should not have top-level variables
vi.mock('./parser', () => {
  return {
    parseCommand: vi.fn((input) => ({ command: input, args: [], rawInput: input, resolvedInput: input, intent: null })),
    validateCommand: vi.fn(() => ({ valid: true, reason: 'ok', matchedPattern: 'test' })),
    getLevenshteinDistance: vi.fn(() => 0),
    expandKeywordPrefixes: vi.fn((input) => input),
    resolveAliases: vi.fn((input) => input),
    commandPatterns: commandPatterns,
    getInvalidCommandError: vi.fn((input) => {
      return input + ' (error)';
    }),
  };
});

vi.mock('./capabilities', () => ({
  getDeviceCapabilities: vi.fn(() => ({ switching: true, routing: false, firewall: false })),
}));

vi.mock('./switchModels', () => ({
  isRouterModel: vi.fn(() => false),
}));

vi.mock('./initialState', () => ({
  getModePrompt: vi.fn(() => ''),
}));

vi.mock('./networkUtils', () => ({
  ensureDeviceStatesMap: vi.fn((deviceStates) => deviceStates || new Map()),
}));

vi.mock('./core/iosErrors', () => ({
  IOS_ERRORS: { unknown: 'Unknown command' },
  iosModeError: vi.fn(() => 'Mode error'),
}));

vi.mock('@/components/network/networkTopology.types', () => ({
  CanvasDevice: vi.fn(),
  CanvasConnection: vi.fn(),
}));

describe('Executor Core Functions', () => {
  describe('getPrompt', () => {
    const baseState: SwitchState = {
      hostname: 'SW1',
      macAddress: '00:11:22:33:44:55',
      switchModel: 'WS-C2960-24TT-L',
      switchLayer: 'L2',
      currentMode: 'user',
      ports: {}
    } as any;

    it('should generate user EXEC mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'user' };
      const result = getPrompt(state);
      expect(result).toBe('SW1>');
    });

    it('should generate privileged EXEC mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'privileged' };
      const result = getPrompt(state);
      expect(result).toBe('SW1#');
    });

    it('should generate configuration mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'config' };
      const result = getPrompt(state);
      expect(result).toBe('SW1(config)#');
    });

    it('should generate interface configuration mode prompt', () => {
      const state: SwitchState = { ...baseState, currentMode: 'interface' };
      const result = getPrompt(state);
      expect(result).toBe('SW1(config-if)#');
    });

    it('should use default hostname when not set', () => {
      const state: SwitchState = { ...baseState, hostname: '' };
      const result = getPrompt(state);
      expect(result).toBe('Switch>');
    });

    it('should handle all command modes', () => {
      const modes: CommandMode[] = ['user', 'privileged', 'config', 'interface', 'config-if-range', 'line', 'vlan', 'router-config', 'dhcp-config', 'ssid-config', 'dot11-config'];
      const expectedPrompts = [
        'SW1>', 'SW1#', 'SW1(config)#', 'SW1(config-if)#', 'SW1(config-if-range)#',
        'SW1(config-line)#', 'SW1(config-vlan)#', 'SW1(config-router)#', 'SW1(dhcp-config)#',
        'SW1(config-ssid)#', 'SW1(config-if)#'
      ];

      modes.forEach((mode, index) => {
        const state: SwitchState = { ...baseState, currentMode: mode };
        const result = getPrompt(state);
        expect(result).toBe(expectedPrompts[index]);
      });
    });
  });

  describe('getEstimatedSuggestions', () => {
    it('should provide suggestions for partial commands', () => {
      const state: SwitchState = {
        hostname: 'SW1',
        macAddress: '00:11:22:33:44:55',
        switchModel: 'WS-C2960-24TT-L',
        switchLayer: 'L2',
        currentMode: 'user',
        ports: {}
      } as any;

      const result = getEstimatedSuggestions('en', state.currentMode, state);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should provide help for empty suggestions', () => {
      const state: SwitchState = {
        hostname: 'SW1',
        macAddress: '00:11:22:33:44:55',
        switchModel: 'WS-C2960-24TT-L',
        switchLayer: 'L2',
        currentMode: 'user',
        ports: {}
      } as any;

      const result = getEstimatedSuggestions('', state.currentMode, state);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle various command prefixes', () => {
      const state: SwitchState = {
        hostname: 'SW1',
        macAddress: '00:11:22:33:44:55',
        switchModel: 'WS-C2960-24TT-L',
        switchLayer: 'L2',
        currentMode: 'user',
        ports: {}
      } as any;

      const testCases: [string, string[]][] = [
        ['s', ['show', 'ssh']],
        ['sh', ['show']],
        ['en', ['enable']],
        ['p', ['ping']],
      ];

      testCases.forEach(([prefix, expected]) => {
        const result = getEstimatedSuggestions(prefix, state.currentMode, state);
        expect(result).toContainEqual(expect.arrayContaining(expected));
      });
    });
  });

  describe('commandHelp', () => {
    it('should have help content for user mode', () => {
      expect(commandHelp.user).toBeDefined();
      expect(commandHelp.user[''] as any).toContain('enable');
      expect(commandHelp.user[''] as any).toContain('help');
    });

    it('should have help content for privileged mode', () => {
      expect(commandHelp.privileged).toBeDefined();
      expect(commandHelp.privileged[''] as any).toContain('configure terminal');
    });

    it('should have help content for config mode', () => {
      expect(commandHelp.config).toBeDefined();
      expect(commandHelp.config[''] as any).toContain('hostname');
    });

    it('should provide prefix-based help entries', () => {
      expect(commandHelp.privileged).toHaveProperty('s');
      expect(commandHelp.privileged).toHaveProperty('sh');
      expect(commandHelp.privileged).toHaveProperty('en');
    });

    it('should have smart hint for general help requests', () => {
      const emptyHelp = commandHelp.privileged as any;
      const keys = Object.keys(emptyHelp);
      const emptyKey = keys.find(key => key === '');
      expect(emptyKey).toBeDefined();
    });
  });

  describe('executeCommand - Basic Commands', () => {
    const baseState: SwitchState = {
      hostname: 'SW1',
      macAddress: '00:11:22:33:44:55',
      switchModel: 'WS-C2960-24TT-L',
      switchLayer: 'L2',
      currentMode: 'user',
      ports: {},
      security: {
        enableSecret: 'secret',
        enableSecretEncrypted: false,
        enablePassword: '',
        servicePasswordEncryption: false,
        users: [],
        consoleLine: { login: false, transportInput: [] },
        vtyLines: []
      }
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle enable command', () => {
      const state: SwitchState = { ...baseState, currentMode: 'user' };
      const result = executeCommand(state, 'enable');
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle help command', () => {
      const state: SwitchState = { ...baseState, currentMode: 'user' };
      const result = executeCommand(state, 'help');
      expect(result.success).toBe(true);
    });

    it('should handle show commands', () => {
      const state: SwitchState = { ...baseState, currentMode: 'privileged' };
      const result = executeCommand(state, 'show version');
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle configuration commands', () => {
      const state: SwitchState = { ...baseState, currentMode: 'config' };
      const result = executeCommand(state, 'configure terminal');
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle invalid commands gracefully', () => {
      const state: SwitchState = { ...baseState, currentMode: 'user' };
      const result = executeCommand(state, 'nonexistentcommand123');
      expect(result.success).toBe(false);
    });

    it('should provide prompts for different modes', () => {
      const userState: SwitchState = { ...baseState, currentMode: 'user' };
      const privilegedState: SwitchState = { ...baseState, currentMode: 'privileged' };

      const userPrompt = getPrompt(userState);
      const privilegedPrompt = getPrompt(privilegedState);

      expect(userPrompt).toBe('SW1>');
      expect(privilegedPrompt).toBe('SW1#');
    });

    it('should process special console tokens', () => {
      const state: SwitchState = { ...baseState, currentMode: 'user' };
      const result = executeCommand(state, '__CANCEL__');
      expect(result.success).toBe(false);
    });

    it('should handle password authentication flow', () => {
      const state: SwitchState = {
        ...baseState,
        currentMode: 'user',
        awaitingPassword: true
      };
      const result = executeCommand(state, '__PASSWORD_CANCELLED__');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
