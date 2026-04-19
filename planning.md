# Recent Network CLI, STP, and Interface Updates

This note summarizes the recent STP PVST example, VLAN interface support, per-VLAN spanning tree priority fixes, and accessibility enhancements in the simulator.

## Overview

Created STP 3-Switch PVST example programmatically, added VLAN interface support for show interface command, fixed per-VLAN spanning tree priority calculation, and added comprehensive ARIA labels to improve accessibility for screen readers.

## STP 3-Switch PVST Example

### Overview
Created an advanced spanning-tree example with 3 L3 switches demonstrating Per-VLAN STP (PVST+) with different STP priorities per VLAN for load balancing.

### Configuration
- **SW1**: VLAN 10 root primary (priority 24576), VLAN 20 priority 32768
- **SW2**: VLAN 10 priority 32768, VLAN 20 root primary (priority 24576)
- **SW3**: VLAN 10/20 priority 28672 (secondary)
- **Connections**: Trunk connections via GigabitEthernet ports (Gi0/1, Gi0/2)
- **VLANs**: VLAN 1, 10, 20 with IP addresses on SVIs
- **Topology**: Triangle topology with all switches interconnected

### Implementation
- Programmatically created in `exampleProjects.ts` using `createL3SwitchDevice` helper
- Added `spanningTreeVlans` property to switch states for per-VLAN priority configuration
- Running config includes `spanning-tree vlan X root primary/secondary` commands
- Notes explaining PVST configuration and load balancing

### Files Modified
- `src/lib/network/exampleProjects.ts` - Added stpPvstDevices, stpPvstConnections, stpPvstNotes, stpPvstSw1/2/3
- `src/lib/network/examples/stp-3switch-pvst.json` - Deleted (replaced with programmatic creation)

## VLAN Interface Support

### Overview
Added support for displaying VLAN interfaces (SVI - Switched Virtual Interfaces) via `show interface vlan X` command.

### Implementation
- Modified `cmdShowInterface` to detect VLAN interface requests (e.g., "show interface vlan 10")
- Extracts VLAN ID from input and looks up VLAN in `state.vlans`
- Parses running config to extract IP address and subnet mask for VLAN interfaces
- Displays proper EtherSVI hardware description and interface status
- Interface shows as "up" if VLAN is active and has IP address configured

### Output Format
```
Vlan10 is up, line protocol is up
  Hardware is EtherSVI, address is 0011.0000.0100
  Internet address is 192.168.10.1/255.255.255.0
  Description: VLAN10
  MTU 1500 bytes, BW 1000000 Kbit/sec
  ...
```

### Files Modified
- `src/lib/network/core/showCommands.ts` - Added VLAN interface detection and display logic in cmdShowInterface

## Per-VLAN STP Priority Fix

### Issue
The `show spanning-tree` command was always using VLAN 1's priority for root bridge calculation, regardless of which VLAN was being displayed. This caused incorrect root bridge display for VLANs with different priorities.

### Resolution
- Moved priority calculation inside the VLAN loop in `cmdShowSpanningTree`
- Changed from using `spanningTreeVlans['1']` to `spanningTreeVlans[vlanId]` for each VLAN
- Updated root bridge selection to use per-VLAN priority for each VLAN iteration
- Added MAC address comparison for tie-breaking when priorities are equal

### Impact
- Correct root bridge display per VLAN based on VLAN-specific priorities
- SW2 now correctly shows as root bridge for VLAN 20 (priority 24576)
- SW1 correctly shows as root bridge for VLAN 10 (priority 24576)
- Proper load balancing demonstration in PVST scenarios

### Files Modified
- `src/lib/network/core/showCommands.ts` - Fixed cmdShowSpanningTree to use per-VLAN priorities

## Domain Lookup Command Fixes

### Issue
The `no ip domain-lookup` command was not working due to a key mismatch between the parser pattern and the command handler mapping.

### Resolution
- Fixed key mismatch in `globalConfigCommands.ts`: Changed handler key from `'no ip domain lookup'` (with space) to `'no ip domain-lookup'` (with hyphen) to match the parser pattern
- Added support for `ip domain-lookup` (with hyphen) to re-enable domain lookup, providing both hyphen and space variants for flexibility
- Both `ip domain lookup` and `ip domain-lookup` now work correctly to enable domain lookup
- `no ip domain-lookup` correctly disables domain lookup

### Files Modified
- `src/lib/network/parser.ts` - Added pattern for `ip domain-lookup` with hyphen
- `src/lib/network/core/globalConfigCommands.ts` - Fixed handler key mapping and added hyphen variant

## Code Cleanup

Removed debug console.log statements from production code to improve performance and code cleanliness:

### Files Modified
- `src/hooks/useDeviceManager.ts` - Removed DEBUG console.log statements for domainLookup tracking (2 statements)
- `src/components/network/PCPanel.tsx` - Removed debug console.log statements from IoT message handling (10+ statements)
- `src/components/network/WifiControlPanel.tsx` - Removed script loaded console.log statement

### Impact
- Cleaner console output in production
- Reduced unnecessary logging overhead
- Improved code maintainability

## Accessibility Improvements

Added comprehensive ARIA labels and role attributes to improve screen reader support and keyboard navigation:

### Files Modified
- `src/components/network/NetworkTopology.tsx` - Added ARIA labels to device palette buttons (PC, L2, L3, Router, IoT) and cable type selector buttons (straight, crossover, console) with role="group" and aria-pressed
- `src/components/network/RouterPanel.tsx` - Added ARIA labels to minimize/maximize button, tab buttons with role="tab", aria-selected, aria-controls, and tab panels with role="tabpanel" and corresponding ids

### Impact
- Improved screen reader support for device selection and cable type selection
- Proper tab pattern implementation for RouterPanel tabs (overview, ports, wifi, dhcp)
- Better keyboard navigation support
- WCAG 2.1 AA compliance improvements

## Previous Updates

### IoT Web Panel
- `generateIotWebPanelContent(iotDevices, language)` renders a login-protected IoT device list.
- `generateIotDevicePageContent(deviceId, deviceName, language)` renders the per-device management page.
- The IoT panel is opened through `http://iot-panel`.
- Individual device pages are opened through `iot://iot-device/<deviceId>`.
- The panel supports session-based login, device toggles, and a return-to-list flow without re-authentication.

### DNS and HTTP Flow
- DNS records in PC services support chained lookups such as `www.a10.com -> a10.com -> 192.168.1.10`.
- The DNS list now shows readable labels for record type.
- Record type labels are localized:
  - Turkish: `A Kaydı (Address Record)` and `CNAME Kaydı (Canonical Name Record)`
  - English: `A Record (Address Record)` and `CNAME Record (Canonical Name Record)`
- `http www.a10.com` should resolve correctly when the DNS chain ends in a valid IP address.

### UI Refinements
- Help modal tabs now use a unified tab-style layout.
- PC service subtabs for `DNS`, `HTTP`, and `DHCP` now share the same tab-style look.
- The IoT section includes a short `Internet of Things` description to make the panel clearer for first-time users.
- Example project JSON files were cleaned up so PC devices only keep their real ports instead of switch-like port dumps.

