/**
 * Removes every piece of persisted state that belongs to the *previous* project
 * so that opening an exam, a guided lesson, an example or a project file never
 * leaks data from the project that was loaded before it.
 *
 * Only project-scoped storage is cleared. Global user preferences (language,
 * theme, achievements, feature flags, onboarding state, etc.) are left intact.
 */
const PROJECT_STORAGE_KEYS = [
  'netsim_autosave',
  'netsim_history',
  'network-simulator-storage',
  'network-simulator-storage-backup',
  'netsim_window_positions_backup',
  'netsim_multi_device_windows',
  'examModeState',
  'guidedModeState',
  'guidedModeState_stepIndex',
  'guidedModeState_minimized',
  'lastProjectDescription',
];

const PROJECT_STORAGE_PREFIXES = [
  'draggable_position_',
  'mail_inbox_',
  'mail_sent_',
  'netsim_window_',
];

export function clearProjectLocalStorage(): void {
  if (typeof window === 'undefined') return;

  for (const key of PROJECT_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable — nothing to do */
    }
  }

  const prefixed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && PROJECT_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      prefixed.push(key);
    }
  }
  for (const key of prefixed) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable — nothing to do */
    }
  }
}
