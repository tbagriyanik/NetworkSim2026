import type { CommandMode, CommandResult, SwitchState } from './types';

export function processCommandResult(result: CommandResult, input: string, mode: CommandMode, state: SwitchState, language: 'tr' | 'en', getSuggestions: (input: string, mode: CommandMode, state?: SwitchState) => string[]): CommandResult {
  if (!result.success && result.error && !result.requiresPassword && !result.newState?.awaitingPassword && !result.error.includes('cancelled') && !result.error.includes('Access denied') && !result.error.includes('Erişim reddedildi')) {
    const suggestions = getSuggestions(input, mode, state);
    if (suggestions.length > 0) {
      const title = language === 'tr' ? 'Tahmini Öneriler' : 'Estimated Suggestions';
      let error = result.error;
      const trIndex = error.indexOf('\n\nBunu mu demek istediniz?');
      if (trIndex !== -1) error = error.substring(0, trIndex);
      const enIndex = error.indexOf('\n\nDid you mean?');
      if (enIndex !== -1) error = error.substring(0, enIndex);
      return { ...result, error: `${error}\n\n${title}: ${suggestions.join(', ')}` };
    }
  }
  return result;
}

export function applyPipeFilterOutput(output: string, filter: { type: 'include' | 'exclude' | 'begin' | 'section'; query: string }): string {
  const lines = output.split('\n'); const q = filter.query.toLowerCase(); const match = (line: string) => line.toLowerCase().includes(q);
  if (filter.type === 'include') return lines.filter(match).join('\n');
  if (filter.type === 'exclude') return lines.filter(line => !match(line)).join('\n');
  if (filter.type === 'begin') { const idx = lines.findIndex(match); return idx >= 0 ? lines.slice(idx).join('\n') : ''; }
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) { if (!match(lines[i])) continue; out.push(lines[i]); for (let j = i + 1; j < lines.length; j++) { const line = lines[j]; if (line.startsWith(' ') || line.startsWith('\t') || line.trim() === '!') out.push(line); else break; } }
  return out.join('\n');
}
