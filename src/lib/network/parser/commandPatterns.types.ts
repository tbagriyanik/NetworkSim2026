import type { CommandMode } from '../types';

// Komut yapilari
export interface CommandPattern {
  pattern: RegExp;
  modes: CommandMode[];
  minArgs: number;
  maxArgs: number;
  capability?: 'routing' | 'switching' | 'firewall';
}
