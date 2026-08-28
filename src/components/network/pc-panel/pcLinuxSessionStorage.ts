export function clearPcLinuxSessions() {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith('pc_linux_output_') || key?.startsWith('pc_linux_history_')) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => window.localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('new-project-reset'));
}