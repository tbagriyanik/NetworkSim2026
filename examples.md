# Network Simulator 2026 - Example Projects

This document provides detailed descriptions of all 27 example projects available in the Network Simulator 2026.

## Table of Contents

- [Basic Level](#basic-level)
- [Intermediate Level](#intermediate-level)
- [Advanced Level](#advanced-level)

---

## Basic Level

### 1. Basic Network + Passwords
**ID:** `basic-secure`  
**Tag:** BASIC  
**Description:** Console, VTY, and enable passwords with 1 PC + 1 switch.  
**Details:** enable secret: class, enable password: paswd, console: console, vty: vty123  
**Configuration:**
- Switch with console, VTY, and enable passwords configured
- Single PC connected to the switch
- Password authentication for console and VTY access

### 2. Single Switch VLANs
**ID:** `single-vlan`  
**Tag:** VLAN  
**Description:** VLAN 10/20 with two access PCs.  
**Configuration:**
- Single switch with VLAN 10 and VLAN 20 configured
- Two PCs connected via access ports
- Each PC assigned to a different VLAN

### 3. Router SSH (1 PC + 1 Router)
**ID:** `router-ssh-1pc`  
**Tag:** SSH  
**Description:** SSH access from PC-1 to router R1.  
**Details:** Command: ssh admin@192.168.1.150 | password: 1234  
**Configuration:**
- Router with SSH enabled
- PC configured to connect via SSH
- Username: admin, Password: 1234

### 4. Router DHCP (2 PCs + 1 Router)
**ID:** `router-dhcp-2pc`  
**Tag:** DHCP  
**Description:** Automatic IP assignment to two PCs via router DHCP pool.  
**Details:** R1: ip dhcp pool LAN, PC-1/PC-2: ipconfig /renew  
**Configuration:**
- Router with DHCP pool configured
- Two PCs receive IP addresses automatically
- DHCP pool name: LAN

### 5. MAC Table Lab
**ID:** `mac-table-lab`  
**Tag:** MAC  
**Description:** Use show mac address-table on SWITCH-1 to compare the MAC entries for PC1, PC2, and ROUTER-2.  
**Details:** PC1: 00-e0-f7-01-a1-b1, PC2: 97-31-e5-97-a7-03, SW1: 042c.802b.9da9, R2: 4145.c35d.e6d1  
**Configuration:**
- Switch connected to multiple devices
- Learn MAC addresses through traffic
- Use `show mac address-table` to view learned addresses

### 6. ARP vs MAC Table
**ID:** `mac-arp-lab`  
**Tag:** MAC  
**Description:** Match ARP and show mac address-table output between PCs and SWITCH-1.  
**Details:** PC terminal: arp, arp -a | SWITCH-1#: show mac address-table  
**Configuration:**
- PCs connected to switch
- Compare ARP cache with switch MAC table
- Understand relationship between ARP and MAC learning

### 7. IP Configuration Lab
**ID:** `ip-config-lab`  
**Tag:** IP  
**Description:** Discover how identical IP/mask on PC1 & PC2 enables connectivity while PC3 differs.  
**Details:** PC1/PC2: 192.168.1.x/255.255.255.0; PC3: different config, ping fails.  
**Configuration:**
- Three PCs with different IP configurations
- PC1 and PC2: Same subnet (can communicate)
- PC3: Different subnet (cannot communicate with PC1/PC2)

---

## Intermediate Level

### 8. Two Switch Trunk + VTP
**ID:** `trunk-vtp`  
**Tag:** TRUNK/VTP  
**Description:** Gi0/1 trunk, VTP domain LAB, VLAN 10/20 ready.  
**Configuration:**
- Two switches connected via trunk (Gi0/1)
- VTP domain: LAB
- VLAN 10 and VLAN 20 synchronized via VTP

### 9. ROAS (Router-on-a-Stick)
**ID:** `roas`  
**Tag:** ROAS  
**Description:** Switch trunk + router with ROAS notes.  
**Configuration:**
- Switch with trunk port to router
- Router with subinterfaces for inter-VLAN routing
- ROAS configuration for VLAN routing

### 10. Legacy Inter-VLAN Routing
**ID:** `legacy-routing`  
**Tag:** LEGACY ROUTING  
**Description:** Router connects to VLANs with 2 separate physical interfaces (no trunk).  
**Details:** 2 router interfaces, access ports, ip routing auto-enabled  
**Configuration:**
- Router with two physical interfaces
- Each interface connected to a different VLAN
- No trunk, legacy routing method

### 11. Port-Security
**ID:** `port-security`  
**Tag:** SECURITY  
**Description:** Port-security enabled on Fa0/3.  
**Configuration:**
- Switch with port-security on Fa0/3
- Limits MAC addresses on the port
- Security violation handling

### 12. Wireless Network (WiFi)
**ID:** `wifi-intermediate`  
**Tag:** WiFi  
**Description:** Router AP and two PCs wireless connectivity.  
**Details:** SSID: HomeWiFi, Router AP mode  
**Configuration:**
- Router configured as Access Point
- Two PCs connected wirelessly
- SSID: HomeWiFi

### 13. IoT WiFi Lab
**ID:** `iot-wifi-lab`  
**Tag:** IoT  
**Description:** 3 IoT devices (Temp, Humidity, Motion), WiFi open PC and Router.  
**Details:** SSID: IoT-Network (Open), IoT devices manageable via WiFi panel  
**Configuration:**
- Router with open WiFi network
- 3 IoT sensors: Temperature, Humidity, Motion
- IoT panel for device management

### 14. Greenhouse Sketch (Smart Farm)
**ID:** `greenhouse-iot-lab`  
**Tag:** ENV  
**Description:** 4 IoT sensors (Temp/Humidity/Light/Door), WPA2 WiFi, environmental monitoring.  
**Details:** SSID: GreenHouse-Network (WPA2), Password: sera2026, IP: 192.168.2.x  
**Configuration:**
- Router with WPA2 secured WiFi
- 4 IoT sensors for greenhouse monitoring
- Environmental data collection

### 15. DNS + HTTP Test
**ID:** `dns-http`  
**Tag:** DNS/HTTP  
**Description:** From PC-1 send HTTP requests and use nslookup to verify server services.  
**Details:** http 192.168.1.10 / http a10.com / nslookup a10.com  
**Configuration:**
- DNS server configured
- HTTP server running
- Test DNS resolution and HTTP access

### 16. DHCP Distribution Scenario
**ID:** `dhcp-distribution`  
**Tag:** DHCP  
**Description:** Observe the DHCP server handing out IPs to PC1 & PC2 while PC3 stays static.  
**Details:** PC1/PC2 via DHCP, PC3 manual; verify with sh ip dhcp binding.  
**Configuration:**
- DHCP server configured
- PC1 and PC2: DHCP clients
- PC3: Static IP configuration

### 17. 2 Switch Trunk Application
**ID:** `trunk-2switch`  
**Tag:** TRUNK  
**Description:** 2 switches, trunk connection, VLAN 100/200 access ports.  
**Details:** SW-1: Fa0/1=VLAN100, Fa0/11=VLAN200, Gi0/1=trunk | SW-2: Fa0/1=VLAN100, Fa0/11=VLAN200, Gi0/1=trunk  
**Configuration:**
- Two switches connected via trunk
- VLAN 100 and VLAN 200 configured
- Access ports for each VLAN

---

## Advanced Level

### 18. Inter-VLAN Routing (L3 Switch)
**ID:** `l3-routing`  
**Tag:** L3 ROUTING  
**Description:** 4 VLANs, L3 switch, inter-VLAN routing enabled.  
**Details:** ip routing, VLAN 10/20/30/40 SVI  
**Configuration:**
- L3 switch with IP routing enabled
- 4 VLANs with SVI interfaces
- Inter-VLAN routing without external router

### 19. Static Routing Lab
**ID:** `static-routing`  
**Tag:** ROUTING  
**Description:** 2 routers, 2 switches, 2 PCs, static routes.  
**Details:** R1: ip route 192.168.20.0/24 192.168.2.2  
**Configuration:**
- Two routers connected via serial link
- Static routes configured on both routers
- Inter-network communication via static routing

### 20. EtherChannel Lab
**ID:** `etherchannel`  
**Tag:** ETHERCHANNEL  
**Description:** 2 switches, LACP, link aggregation.  
**Details:** channel-group 1 mode active, Po1 trunk  
**Configuration:**
- Two switches with multiple links
- LACP for link aggregation
- Port-channel 1 configured as trunk

### 21. STP Redundant Links
**ID:** `stp-redundant`  
**Tag:** STP  
**Description:** 2 switches, redundant links, Rapid-PVST.  
**Details:** spanning-tree priority 28672  
**Configuration:**
- Two switches with redundant links
- Rapid-PVST for fast convergence
- STP blocking one link to prevent loops

### 22. STP Triangle Topology
**ID:** `stp-triangle`  
**Tag:** STP  
**Description:** 3 switches, triangle topology, STP blocking.  
**Details:** SW1: Fa0/1 blocked (orange)  
**Configuration:**
- Three switches in triangle topology
- STP blocks one port to prevent loops
- Visual indication: Orange color for blocked port

### 23. Campus Network
**ID:** `campus-network`  
**Tag:** CAMPUS  
**Description:** Core router + 2 access switches, routing.  
**Details:** CORE-R1 ip routing, VLAN 10/20  
**Configuration:**
- Core router with IP routing
- Two access layer switches
- VLAN 10 and VLAN 20 for segmentation

### 24. STP 3 Switch PVST
**ID:** `stp-3switch-pvst`  
**Tag:** STP  
**Description:** 3 switches, 3 VLANs, different root bridge per VLAN, trunk connections.  
**Details:** VLAN1 root SW1, VLAN10 root SW2, VLAN20 root SW3. Each VLAN uses its own path; if a link fails, backup path opens.  
**Configuration:**
- Three switches with PVST+
- Different root bridge for each VLAN
- VLAN-specific STP paths
- Automatic failover with backup paths

### 25. 2 L3 Switch VLAN (AG1/AG2)
**ID:** `l3-switch-2vlan`  
**Tag:** L3 VLAN  
**Description:** 2 L3 switches, VLAN 10 (AG1) and VLAN 20 (AG2), SVI gateway configuration, trunk connection, 8 PCs.  
**Details:** Switch2/Switch4: ip routing, VLAN10 SVI 192.168.10.1, VLAN20 SVI 192.168.20.1, Trunk Gi0/1  
**Configuration:**
- Two L3 switches with IP routing
- VLAN 10 (AG1) and VLAN 20 (AG2)
- SVI gateways for each VLAN
- Trunk connection between switches
- 8 PCs across both VLANs

### 26. L3 Switch Static Routing
**ID:** `static-l3-routing`  
**Tag:** STATIC ROUTING  
**Description:** 2 Multilayer Switches + 1 Router + 2 L2 Switches + 2 PCs. Communication from PC0 to PC4.  
**Details:** MultilayerSwitch1: ip route 192.168.2.0 255.255.255.0 10.0.0.2 | Router3: ip route 192.168.1.0 255.255.255.0 10.0.0.1, ip route 192.168.2.0 255.255.255.0 20.0.0.2 | MultilayerSwitch2: ip route 192.168.1.0 255.255.255.0 20.0.0.1  
**Configuration:**
- 2 Multilayer Switches with IP routing
- 1 Router in the middle
- 2 L2 switches for access
- Static routes configured on all L3 devices
- Test: PC0 ping PC4 (192.168.2.10)

### 27. RIP Dynamic Routing
**ID:** `rip-dynamic-routing`  
**Tag:** RIP ROUTING  
**Description:** 2 Multilayer Switches + 2 L2 Switches + 4 PCs. RIP dynamic routing.  
**Details:** MultilayerSwitch0: router rip, network 192.168.1.0, network 192.168.2.0 | MultilayerSwitch1: router rip, network 192.168.2.0, network 192.168.3.0  
**Configuration:**
- 2 Multilayer Switches with RIP routing protocol
- 2 L2 switches for access
- 4 PCs across 3 networks:
  - 192.168.1.0/24 (PC0, PC1)
  - 192.168.2.0/24 (trunk network)
  - 192.168.3.0/24 (PC2, PC3)
- RIP automatically exchanges routes between switches
- Test: PC0 ping PC2 (192.168.3.10)

---

## Summary

| Level | Count |
|-------|-------|
| Basic | 7 |
| Intermediate | 10 |
| Advanced | 10 |
| **Total** | **27** |

## Getting Started

To use these examples:
1. Open the Network Simulator 2026
2. Click on "Example Projects" in the sidebar
3. Select an example from the list
4. The example will load with pre-configured devices and connections
5. Follow the notes provided in the canvas for specific configuration steps

## Contributing

To add a new example:
1. Define devices in `src/lib/network/exampleProjects.ts`
2. Configure connections between devices
3. Set initial states for each device
4. Add notes explaining the topology and configuration
5. Add the example to the `allExampleProjects` array
6. Update this documentation
