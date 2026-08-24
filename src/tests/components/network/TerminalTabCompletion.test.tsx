import { describe, it, expect } from 'vitest';
import { expandCommandContext, DESKTOP_COMMANDS } from '@/components/network/pcPanel.utils';
import { getAutocompleteSuggestions } from '@/components/network/pc-panel/pcTerminal.utils';
import { commandHelp } from '@/lib/network/executor';

describe('TAB completion data path', () => {
  it('device CLI: expandCommandContext returns top-level candidates for empty context', () => {
    const ctx = expandCommandContext('user', 'en');
    expect(ctx.candidates).toContain('enable');
    const matches = ctx.candidates.filter((c) => c.toLowerCase().startsWith('en'));
    expect(matches).toContain('enable');
  });

  it('device CLI: multi-word context (show ?) yields sub-commands', () => {
    const ctx = expandCommandContext('privileged', 'show ip');
    expect(ctx.candidates.length).toBeGreaterThan(0);
    expect(ctx.candidates).toContain('ip');
  });

  it('PC desktop: getAutocompleteSuggestions returns matching desktop commands', () => {
    const mode = () => 'user';
    const sug = getAutocompleteSuggestions({
      value: 'ipc',
      activeTab: 'desktop',
      topologyDevices: [],
      deviceStates: new Map(),
      getCommandMode: mode,
    });
    expect(sug).toContain('ipconfig');
  });

  it('PC desktop: DESKTOP_COMMANDS is non-empty', () => {
    expect(DESKTOP_COMMANDS.length).toBeGreaterThan(0);
    expect(commandHelp.user['']).toBeDefined();
  });
});
