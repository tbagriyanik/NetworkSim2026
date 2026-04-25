# Recent Network CLI, STP, Interface, and UI Updates

This note summarizes the recent STP PVST example enhancements, VLAN-specific STP path calculation, STP redundancy support, VLAN interface support, per-VLAN spanning tree priority fixes, accessibility enhancements, keyboard shortcuts, STP blocking logic improvements, L3 Switch Static Routing example addition, RIP Dynamic Routing example, show ip route RIP support, and router-config mode fixes in the simulator.

## Current Code Metrics

- Total lines: 59754
- Last updated: 2026-04-25
- Example projects: 27

## Overview

Enhanced STP 3-Switch PVST example with PC devices for comprehensive testing, implemented VLAN-specific STP path calculation for ping animation, added STP redundancy support for automatic backup path activation, implemented VLAN 1-only STP visualization, added VLAN interface support for show interface command, fixed per-VLAN spanning tree priority calculation, added comprehensive ARIA labels to improve accessibility for screen readers, added P keyboard shortcut for ping functionality, improved STP blocking logic for link failure scenarios, added per-VLAN STP instances to 3-switch PVST example, added new L3 Switch Static Routing example (Figure 9.15) with 2 Multilayer Switches, 1 Router, 2 L2 Switches, and 2 PCs for inter-network communication via static routes, added RIP Dynamic Routing example (Figure 9.19) with 2 Multilayer Switches and 4 PCs across 3 networks, enhanced show ip route command with RIP route display support, and fixed network/exit/end command issues in router-config mode.

## P Keyboard Shortcut for Ping

### Overview
Added P keyboard shortcut to quickly enter ping mode and select ping source.

### Implementation
- Press P to enter ping mode
- If a device is selected, it becomes the ping source automatically
- If no device is selected, user can select source after entering ping mode
- Press P again to exit ping mode
- Added "(P)" shortcut indicator to toolbar tooltip
- Added "(P)" shortcut indicator to context menu ping item

### Files Modified
- `src/components/network/NetworkTopology.tsx` - Added P key handler in window keydown listener
- `src/components/network/NetworkTopologyContextMenu.tsx` - Added shortcut property to ping menu item
- `src/app/page.tsx` - Updated tooltip to show "(P)" shortcut

### Impact
- Faster ping workflow with keyboard shortcut
- Consistent with other keyboard shortcuts (Ctrl+A, Ctrl+Z, etc.)
- Improved user experience for frequent ping operations

## STP Blocking Logic Improvements

### Overview
Improved STP blocking logic to properly handle link failure and restoration scenarios in PVST configurations.

### Issue
Previously, when a link failed and was restored, STP blocking state was not properly recalculated, causing connectivity issues.

### Resolution
- Modified `getVlanSpecificSTPBlocking` function in connectivity.ts
- When connection is down (active === false), STP blocking is lifted (simulating STP reconvergence)
- When connection is up, original STP configuration is used
- Added per-VLAN STP instances to 3-switch PVST example in exampleProjects.ts
- SW1, SW2, SW3 trunk ports configured with VLAN-specific STP states (forwarding/blocking per VLAN)

### Impact
- Each VLAN uses its own path based on VLAN-specific STP
- When link fails, backup path automatically activates
- When link is restored, original STP topology is restored
- Proper PVST behavior demonstration

### Files Modified
- `src/lib/network/connectivity.ts` - Updated getVlanSpecificSTPBlocking function
- `src/lib/network/exampleProjects.ts` - Added per-VLAN STP instances to SW1, SW2, SW3 trunk ports

## VLAN-Specific STP Path Calculation

### Overview
Implemented VLAN-specific STP path calculation for ping animation to ensure traffic follows the correct VLAN-specific root bridge path.

### Issue
Previously, the ping animation used VLAN 1's STP path for all VLANs regardless of the source device's VLAN. This caused incorrect path visualization in PVST scenarios where different VLANs have different root bridges.

### Resolution
- Modified `checkConnectivity` function in `connectivity.ts` to determine source device's VLAN
- Added VLAN-specific STP blocking check using the source device's VLAN
- Created `getVlanSpecificSTPBlocking` helper function to calculate STP blocking state per VLAN
- Function considers VLAN-specific priorities from `spanningTreeVlans` property
- Reverted to using officially calculated STP state from port's `spanningTree.state` property

### Impact
- Ping animation now correctly follows VLAN-specific STP paths
- Traffic from VLAN 20 devices follows VLAN 20's root bridge (SW3)
- Traffic from VLAN 10 devices follows VLAN 10's root bridge (SW2)
- Traffic from VLAN 1 devices follows VLAN 1's root bridge (SW1)
- Accurate path visualization for PVST load balancing scenarios

### Files Modified
- `src/lib/network/connectivity.ts` - Added VLAN-specific STP blocking logic, then reverted to use port state
- `src/lib/network/types.ts` - Added `spanningTreeVlans` property to SwitchState interface

## Enhanced STP 3-Switch PVST Example

### Overview
Enhanced the STP 3-Switch PVST example by adding PC devices for VLAN 1, 10, and 20 to each switch for comprehensive testing.

### Configuration
- **9 PCs total**: 3 PCs per switch (VLAN 1, VLAN 10, VLAN 20)
- **SW1 PCs**: PC1-VLAN1 (fa0/3), PC1-VLAN10 (fa0/4), PC1-VLAN20 (fa0/5)
- **SW2 PCs**: PC2-VLAN1 (fa0/3), PC2-VLAN10 (fa0/4), PC2-VLAN20 (fa0/5)
- **SW3 PCs**: PC3-VLAN1 (fa0/3), PC3-VLAN10 (fa0/4), PC3-VLAN20 (fa0/5)
- **VLAN Priorities**: SW1 (VLAN 1 root), SW2 (VLAN 10 root), SW3 (VLAN 20 root)
- **IP Addresses**: 192.168.1.x (VLAN 1), 192.168.10.x (VLAN 10), 192.168.20.x (VLAN 20)

### Implementation
- Added PC devices using `createPcDevice` helper with VLAN parameter
- Configured switch access ports (fa0/3, fa0/4, fa0/5) with correct VLAN assignments
- Connected PCs to switches via appropriate ports
- Updated switch running configs to include all VLAN priority commands
- Added `spanningTreeMode = 'pvst'` to all switches
- Repositioned devices to prevent overlap (SW1 PCs left, SW2/SW3 PCs right)
- Updated notes to reflect new topology and PC connections
- Added redundancy explanation to PVST note

### Files Modified
- `src/lib/network/exampleProjects.ts` - Added PC devices, configured access ports, updated notes

## STP Redundancy Support

### Overview
Implemented automatic backup path activation when links fail, enabling traffic to flow through alternative paths in STP topology.

### Implementation
- Modified STP blocking logic to allow trunk ports to forward when no direct connection to root bridge exists
- If all direct connections to root bridge are shutdown, trunk ports automatically unblock
- Enables traffic to flow through intermediate switches (e.g., SW1->SW2->SW3)
- Dynamic STP state recalculation based on current topology
- Works for all VLANs in PVST configuration

### Impact
- When SW1-S3 link goes down, traffic can flow via SW1->SW2->SW3
- Automatic failover without manual intervention
- Improved network resilience and redundancy
- Better demonstration of STP's loop prevention and redundancy features

### Files Modified
- `src/lib/network/connectivity.ts` - Added logic to allow forwarding when no direct root connection

## VLAN 1-Only STP Visualization

### Overview
Modified STP blocking visualization (pink for ports, grey for cables) to only apply to VLAN 1 devices and connections.

### Issue
Previously, STP blocking visualization (pink ports, grey cables) was applied to all VLANs, causing visual confusion in PVST scenarios where different VLANs have different STP states.

### Resolution
- Modified port coloring logic to check device VLAN before applying pink color
- Modified cable coloring logic to check source/target device VLANs before applying grey color
- Added VLAN check to tooltip status indicators
- Only VLAN 1 devices/connections show STP blocking colors
- VLAN 10, 20, and other VLANs use normal colors regardless of STP state

### Impact
- Cleaner visual representation for multi-VLAN scenarios
- Easier to distinguish between different VLAN STP states
- Reduced visual confusion in PVST examples
- Focus on VLAN 1 as the default management VLAN for STP visualization

### Files Modified
- `src/components/network/NetworkTopology.tsx` - Added VLAN check to port coloring and tooltip indicators
- `src/components/network/ConnectionLine.tsx` - Added VLAN check to cable coloring

## STP 3-Switch PVST Example

### Overview
Created an advanced spanning-tree example with 3 L3 switches demonstrating Per-VLAN STP (PVST+) with different STP priorities per VLAN for load balancing.

### Configuration
- **SW1**: VLAN 1 root primary (priority 24576), VLAN 10 priority 32768, VLAN 20 priority 32768
- **SW2**: VLAN 1 priority 32768, VLAN 10 root primary (priority 24576), VLAN 20 priority 32768
- **SW3**: VLAN 1 priority 32768, VLAN 10 priority 32768, VLAN 20 root primary (priority 24576)
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

## L3 Switch Static Routing Example (Figure 9.15)

### Overview
Added a new advanced example project demonstrating static routing between two networks using L3 switches and a central router, matching the topology from Figure 9.15 in networking curriculum.

### Configuration
- **PC0**: 192.168.1.10/24, Gateway: 192.168.1.1 (Connected to MultilayerSwitch1 via Switch0)
- **PC4**: 192.168.2.10/24, Gateway: 192.168.2.1 (Connected to MultilayerSwitch2 via Switch1)
- **MultilayerSwitch1 (Left)**:
  - Fa0/2: 192.168.1.1/24 (local network)
  - Fa0/1: 10.0.0.1/8 (uplink to Router3)
  - Static route: `ip route 192.168.2.0 255.255.255.0 10.0.0.2`
- **Router3 (Center)**:
  - Fa0/0: 10.0.0.2/8 (downlink to MultilayerSwitch1)
  - Fa1/0: 20.0.0.1/8 (downlink to MultilayerSwitch2)
  - Static routes:
    - `ip route 192.168.1.0 255.255.255.0 10.0.0.1`
    - `ip route 192.168.2.0 255.255.255.0 20.0.0.2`
- **MultilayerSwitch2 (Right)**:
  - Fa0/1: 20.0.0.2/8 (uplink to Router3)
  - Fa0/2: 192.168.2.1/24 (local network)
  - Static route: `ip route 192.168.1.0 255.255.255.0 20.0.0.1`
- **Switch0 & Switch1**: L2 switches for PC connections

### Implementation
- Created using `createL3SwitchDevice`, `createRouterDevice`, `createSwitchDevice`, and `createPcDevice` helpers
- Configured routed ports on L3 switches with `mode: 'routed'`
- Added static routes to routing tables for inter-network communication
- Full running configs with IP routing enabled on all L3 devices
- Notes explaining topology and configuration commands in both TR/EN

### Testing
- **From PC0**: `ping 192.168.2.10` to test connectivity to PC4
- Path: PC0 → Switch0 → MultilayerSwitch1 → Router3 → MultilayerSwitch2 → Switch1 → PC4

### Files Modified
- `src/lib/network/exampleProjects.ts` - Added staticL3RoutingDevices, staticL3RoutingConnections, staticL3RoutingNotes, mlSwitch1State, router3State, mlSwitch2State, switch0State, switch1State

## RIP Dynamic Routing Example (Figure 9.19)

### Overview
Added a new example project demonstrating RIP (Routing Information Protocol) dynamic routing between two L3 switches with automatic route exchange.

### Configuration
- **PC0**: 192.168.1.10/24, **PC1**: 192.168.1.11/24 (Left network)
- **PC2**: 192.168.3.10/24, **PC3**: 192.168.3.20/24 (Right network)
- **MultilayerSwitch0**:
  - Fa0/23: 192.168.1.1/24 (local)
  - Fa0/24: 192.168.2.1/24 (trunk)
  - `router rip`, `network 192.168.1.0`, `network 192.168.2.0`
- **MultilayerSwitch1**:
  - Fa0/24: 192.168.2.2/24 (trunk)
  - Fa0/23: 192.168.3.1/24 (local)
  - `router rip`, `network 192.168.2.0`, `network 192.168.3.0`

### Testing
- **From PC0**: `ping 192.168.3.10` (PC2) to test inter-network communication
- Path: PC0 → Switch0-L2 → MultilayerSwitch0 → MultilayerSwitch1 → Switch3-L2 → PC2

### Files Modified
- `src/lib/network/exampleProjects.ts` - Added ripRoutingDevices, ripRoutingConnections, ripRoutingNotes, ripMlswitch0State, ripMlswitch1State, switch0L2State, switch3L2State

## Show IP Route RIP Support

### Overview
Enhanced `show ip route` command to display RIP (R) routes with proper formatting matching Cisco IOS output.

### Changes
- Added **R** code for RIP routes in routing table codes section
- Format: `R     192.168.3.0/24 [120/1] via 192.168.2.2, 00:00:11, FastEthernet0/24`
- RIP administrative distance: 120
- Shows metric, next hop, timer, and outgoing interface

### Files Modified
- `src/lib/network/core/showCommands.ts` - Added dynamic routes display in cmdShowIpRoute function

## Router Config Mode Fixes

### Issues Fixed
1. **Network Command**: `network` command was failing in router-config mode due to handler conflict between router and DHCP config handlers
2. **Exit Command**: `exit` was not working to exit router-config mode
3. **End Command**: `end` was not working to return to privileged mode from router-config

### Resolution
- Created mode-aware `network` command wrapper in executor that routes to appropriate handler:
  - `router-config` mode → `cmdRouterNetwork` (RIP/OSPF)
  - `dhcp-config` mode → `cmdDhcpNetwork`
- Added `'router-config'` to `exit` and `end` command modes in parser
- Exported `cmdRouterNetwork` and `cmdDhcpNetwork` functions for external use

### Files Modified
- `src/lib/network/parser.ts` - Added 'router-config' to exit/end command modes
- `src/lib/network/executor.ts` - Added network command wrapper with mode routing
- `src/lib/network/core/routerConfigCommands.ts` - Exported cmdRouterNetwork function
- `src/lib/network/core/dhcpConfigCommands.ts` - Exported cmdDhcpNetwork function

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

