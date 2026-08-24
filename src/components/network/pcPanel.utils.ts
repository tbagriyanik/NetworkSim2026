import { commandHelp } from '@/lib/network/executor';

/** Expands autocomplete context for the given command mode and raw input value */
export const expandCommandContext = (mode: keyof typeof commandHelp, rawValue: string) => {
    const isDoPrefix = rawValue.trim().toLowerCase().startsWith('do ') && mode !== 'privileged' && mode !== 'user';
    const effectiveMode = isDoPrefix ? 'privileged' : mode;
    const valueToProcess = isDoPrefix ? (rawValue.trim().substring(3) + (rawValue.endsWith(' ') ? ' ' : '')) : rawValue;

    const helpTree = commandHelp[effectiveMode] || commandHelp.user;
    const tokens = valueToProcess.trim().split(/\s+/).filter(Boolean);
    const hasTrailingSpace = valueToProcess.endsWith(' ');
    const contextTokens = hasTrailingSpace ? tokens : tokens.slice(0, -1);
    const currentWord = hasTrailingSpace ? '' : (tokens[tokens.length - 1] || '').toLowerCase();
    const contextKey = contextTokens.join(' ').toLowerCase();

    const finalContextTokens = isDoPrefix ? ['do', ...contextTokens] : contextTokens;

    // Get all candidates
    const candidates = contextTokens.length === 0 ? (helpTree[''] || []) : (helpTree[contextKey] || []);

    // Filter candidates based on currentWord (for TAB completion)
    const filteredCandidates = currentWord
        ? candidates.filter(c => c.toLowerCase().startsWith(currentWord))
        : candidates;

    return {
        candidates: filteredCandidates,
        currentWord,
        contextTokens: finalContextTokens,
        allCandidates: candidates // Keep all candidates for ? help
    };
};

export const DESKTOP_COMMANDS = [
    'ipconfig',
    'ping',
    'tracert',
    'telnet',
    'ssh',
    'ftp',
    'netstat',
    'nbtstat',
    'getmac',
    'nslookup',
    'curl',
    'wget',
    'arp',
    'hostname',
    'cd',
    'md',
    'rd',
    'dir',
    'type',
    'del',
    'edit',
    'python',
    'ver',
    'cls',
    'exit',
    'quit',
    'help',
    '?',
] as const;
