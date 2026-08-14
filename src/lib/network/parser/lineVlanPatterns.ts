// VLAN config ve line komutlari
import type { CommandPattern } from './commandPatterns.types';

export const lineVlanPatterns: Record<string, CommandPattern> = {
  // VLAN config komutlarÄ±
  'name': {
    pattern: /^name\s+(.+)$/i,
    modes: ['vlan'],
    minArgs: 1,
    maxArgs: 1
  },
  'no name': {
    pattern: /^no\s+name$/i,
    modes: ['vlan'],
    minArgs: 0,
    maxArgs: 0
  },
  'state': {
    pattern: /^state\s+(active|suspend)$/i,
    modes: ['vlan'],
    minArgs: 1,
    maxArgs: 1
  },

  // Line komutlarÄ±
  'line console': {
    pattern: /^line\s+console\s+0$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'line vty': {
    pattern: /^line\s+vty\s+(\d+)(?:\s+(\d+))?$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 2
  },
  'line aux': {
    pattern: /^line\s+aux\s+0$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'line': {
    pattern: /^line\s+(\S+)(\s+(\d+)(\s+(\d+))?)?$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 4
  },
  'password': {
    pattern: /^password\s+(.+)$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 1
  },
  'no password': {
    pattern: /^no\s+password$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'login': {
    pattern: /^login(\s+local)?$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 1
  },
  'no login': {
    pattern: /^no\s+login$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'transport input': {
    pattern: /^transport\s+input\s+(ssh|telnet|all|none)(\s+(ssh|telnet|all|none))*$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 4
  },
  'transport output': {
    pattern: /^transport\s+output\s+(ssh|telnet|all|none)(\s+(ssh|telnet|all|none))*$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 4
  },
  'no transport input': {
    pattern: /^no\s+transport\s+input$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'transport preferred': {
    pattern: /^transport\s+preferred\s+(ssh|telnet|none)$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 1
  },
  'exec-timeout': {
    pattern: /^exec-timeout\s+(\d+)(?:\s+(\d+))?$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 2
  },
  'no exec-timeout': {
    pattern: /^no\s+exec-timeout$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'logging synchronous': {
    pattern: /^logging\s+synchronous$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'no logging synchronous': {
    pattern: /^no\s+logging\s+synchronous$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'history size': {
    pattern: /^history\s+size\s+(\d+)$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 1
  },
  'history': {
    pattern: /^history(\s+(enable|disable))?$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 1
  },
  'no history': {
    pattern: /^no\s+history$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'privilege level': {
    pattern: /^privilege\s+level\s+(\d+)$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 1
  },
  'access-class': {
    pattern: /^access-class\s+(\d+)\s+(in|out)$/i,
    modes: ['line'],
    minArgs: 2,
    maxArgs: 2
  },
  'session-limit': {
    pattern: /^session-limit\s+(\d+)$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 1
  },
  'no exec': {
    pattern: /^no\s+exec$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'exec': {
    pattern: /^exec$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'autocommand': {
    pattern: /^autocommand\s+(.+)$/i,
    modes: ['line'],
    minArgs: 1,
    maxArgs: 1
  },
  'no autocommand': {
    pattern: /^no\s+autocommand$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },
  'lockable': {
    pattern: /^lockable$/i,
    modes: ['line'],
    minArgs: 0,
    maxArgs: 0
  },

};
