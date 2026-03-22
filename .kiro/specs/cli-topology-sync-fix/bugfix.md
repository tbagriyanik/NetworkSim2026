# Bugfix Requirements Document

## Introduction

The network topology simulator has four interconnected bugs affecting the CLI terminal, running configuration display, cross-tab state synchronization, and autosave persistence. These issues collectively cause a broken simulation experience: commands may silently fail or produce stale output, the running-config panel shows a statically-generated view instead of the live device state, changes made in one tab (Topology, CLI, Tasks) are not reflected in the others, and the autosave mechanism has a missing `useState` import that causes a runtime crash. The fix must address all four defects while preserving all existing correct behaviors.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a CLI command that returns `saveConfig: true` (e.g. `write memory`, `copy running-config startup-config`) is executed THEN the system does not update `startupConfig` on the device state because the executor result field `saveConfig` is never consumed in `useDeviceManager.handleCommandForDevice`

1.2 WHEN a CLI command that returns `eraseConfig: true` (e.g. `erase startup-config`) is executed THEN the system does not clear `startupConfig` on the device state because the `eraseConfig` result field is never consumed in `useDeviceManager.handleCommandForDevice`

1.3 WHEN the user views the "Running Config" panel (ConfigPanel) for a device THEN the system displays a config string generated from a hardcoded `generateConfig()` function inside `ConfigPanel.tsx` rather than the live `runningConfig` array stored on the device state, causing the panel to be out of sync with actual CLI changes

1.4 WHEN the user executes CLI commands that modify device state (e.g. hostname, interface config, VLAN) THEN the system does not update the `runningConfig` array on the device state, so `show running-config` in the terminal and the ConfigPanel both reflect stale data

1.5 WHEN the user switches from the Topology tab to the Tasks tab THEN the system evaluates task completion using only the `activeDeviceId`'s state, ignoring all other devices in the topology, so tasks that depend on topology-wide state (e.g. connections, multiple devices) are incorrectly reported

1.6 WHEN the user renames a device in the Topology tab (via the canvas rename UI) THEN the system does not propagate the new name to the corresponding `deviceStates` hostname, causing the CLI prompt and `show running-config` to display the old hostname

1.7 WHEN the application loads saved state from `localStorage` THEN the system may crash with a runtime error because `useOptimizedAutosave.ts` exports a `useDebounce` hook that references `useState` but the `useState` import is placed after the function definition (import hoisting issue with the current file structure)

1.8 WHEN the user double-clicks a device to open its terminal and then switches back to the Topology tab THEN the system does not re-select the device visually in the topology canvas, causing the active device highlight to be out of sync with the selected terminal device

### Expected Behavior (Correct)

2.1 WHEN a CLI command returns `saveConfig: true` THEN the system SHALL update the device's `startupConfig` in `deviceStates` to a snapshot of the current `runningConfig` array

2.2 WHEN a CLI command returns `eraseConfig: true` THEN the system SHALL clear the device's `startupConfig` in `deviceStates` to an empty array or null

2.3 WHEN the ConfigPanel renders THEN the system SHALL display the device's live `runningConfig` array from `deviceStates` (joined with newlines) instead of the locally-generated `generateConfig()` string

2.4 WHEN a CLI command modifies device state (hostname, interface, VLAN, security, etc.) THEN the system SHALL update the `runningConfig` array on the device state so that subsequent `show running-config` commands and the ConfigPanel both reflect the current configuration

2.5 WHEN the Tasks tab is active THEN the system SHALL evaluate task completion using the full `deviceStates` map and `topologyConnections` so that topology-wide tasks (e.g. trunk ports across devices, multiple VLANs) are correctly assessed

2.6 WHEN a device is renamed in the Topology canvas THEN the system SHALL propagate the new name to the corresponding device's `hostname` field in `deviceStates` so the CLI prompt and running-config reflect the updated name

2.7 WHEN the application initializes `useOptimizedAutosave` THEN the system SHALL import `useState` at the top of the file so the `useDebounce` hook does not throw a runtime reference error

2.8 WHEN the user navigates between tabs THEN the system SHALL keep the active device selection in the topology canvas synchronized with the `activeDeviceId` so the correct device remains visually highlighted

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a CLI command does not return `saveConfig` or `eraseConfig` THEN the system SHALL CONTINUE TO update only the fields returned in `newState` without touching `startupConfig`

3.2 WHEN the user executes `reload` on a device THEN the system SHALL CONTINUE TO restore device state from `startupConfig` (applying startup config on boot) as it currently does

3.3 WHEN the user adds, moves, or deletes devices and connections in the Topology tab THEN the system SHALL CONTINUE TO persist those changes to `localStorage` via the existing autosave mechanism

3.4 WHEN the user opens the terminal for a switch or router THEN the system SHALL CONTINUE TO display the boot sequence output and accept CLI commands as before

3.5 WHEN VTP propagation logic runs after a `vlan` command THEN the system SHALL CONTINUE TO propagate VLAN additions and removals to neighboring switches over trunk links

3.6 WHEN the user saves a project to a JSON file and reloads it THEN the system SHALL CONTINUE TO restore all device states, topology, connections, and terminal outputs correctly

3.7 WHEN the Tasks tab evaluates task completion for a single active device THEN the system SHALL CONTINUE TO correctly check port, VLAN, and security tasks against that device's state

3.8 WHEN the ConfigPanel "Save" button is clicked THEN the system SHALL CONTINUE TO execute `write memory` via `onExecuteCommand` as it currently does
