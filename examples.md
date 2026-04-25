# Network Simulator 2026 - Example Projects

This document provides detailed descriptions of all 28 example projects available in the Network Simulator 2026.

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
**Tasks:**
- Configure enable secret and enable password.
- Set console and VTY line passwords with login enabled.
- Assign an IP address to the management VLAN interface.
- Connect to the switch console via PC COM port and test Telnet from PC CMD.

### 2. Single Switch VLANs
**ID:** `single-vlan`  
**Tag:** VLAN  
**Description:** VLAN 10/20 with two access PCs.  
**Tasks:**
- Create VLAN 10 (VLAN10) and VLAN 20 (VLAN20).
- Assign switch ports to respective VLANs using access mode.
- Verify VLAN membership with `show vlan brief`.

### 3. Router SSH (1 PC + 1 Router)
**ID:** `router-ssh-1pc`  
**Tag:** SSH  
**Description:** SSH access from PC-1 to router R1.  
**Details:** Command: ssh admin@192.168.1.150 | password: 1234  
**Tasks:**
- Configure IP domain-name and generate RSA keys.
- Enable SSH version 2.
- Create a local user with privilege 15.
- Enable local login on VTY lines and set transport input to SSH.

### 4. Router DHCP (2 PCs + 1 Switch + 1 Router)
**ID:** `router-dhcp-2pc`  
**Tag:** DHCP  
**Description:** Automatic IP assignment to two PCs via router DHCP pool.  
**Details:** R1: ip dhcp pool LAN, PC-1/PC-2: ipconfig /renew  
**Tasks:**
- Configure router interface IP and enable it.
- Create a DHCP pool with network, default-router, and dns-server settings.
- Set PCs to DHCP mode and verify IP assignment using `ipconfig /renew`.

### 5. MAC Table Lab
**ID:** `mac-table-lab`  
**Tag:** MAC  
**Description:** Use show mac address-table on SWITCH-1 to compare the MAC entries for PC1, PC2, and ROUTER-2.  
**Details:** PC1: 00-e0-f7-01-a1-b1, PC2: 97-31-e5-97-a7-03, SW1: 042c.802b.9da9, R2: 4145.c35d.e6d1  
**Tasks:**
- Generate traffic between devices.
- Inspect learned MAC addresses on the switch.
- Understand how switches build the address table based on source MACs.

### 6. ARP vs MAC Table
**ID:** `mac-arp-lab`  
**Tag:** MAC  
**Description:** Match ARP and show mac address-table output between PCs and SWITCH-1.  
**Details:** PC terminal: arp, arp -a | SWITCH-1#: show mac address-table  
**Tasks:**
- Check PC ARP cache using `arp -a`.
- Compare with switch MAC table.
- Differentiate between Layer 2 (MAC) and Layer 3 (ARP) address mappings.

### 7. IP Configuration Lab
**ID:** `ip-config-lab`  
**Tag:** IP  
**Description:** Discover how identical IP/mask on PC1 & PC2 enables connectivity while PC3 differs.  
**Details:** PC1/PC2: 192.168.1.x/255.255.255.0; PC3: different config, ping fails.  
**Tasks:**
- Configure static IP addresses and subnet masks.
- Test connectivity between devices in the same subnet.
- Identify connectivity issues caused by subnet mismatches.

### 8. Native VLAN Configuration
**ID:** `native-vlan-basic`  
**Tag:** NATIVE  
**Description:** Basic native VLAN configuration with trunk connection between 2 switches.  
**Details:** VLAN 99 as native.  
**Tasks:**
- Create VLAN 99 on both switches.
- Configure trunk ports between switches.
- Set VLAN 99 as the native VLAN on the trunk interface.
- Verify communication between PCs on the native VLAN.

---

## Intermediate Level

### 9. Two Switch Trunk + VTP
**ID:** `trunk-vtp`  
**Tag:** TRUNK/VTP  
**Description:** Gi0/1 trunk, VTP domain LAB, VLAN 10/20 ready.  
**Tasks:**
- Set one switch as VTP server and the other as VTP client.
- Configure VTP domain name.
- Create VLANs on the server switch and verify synchronization on the client.
- Configure 802.1Q trunking on interconnecting ports.

### 10. ROAS (Router-on-a-Stick)
**ID:** `roas`  
**Tag:** ROAS  
**Description:** Switch trunk + router with ROAS subinterface configuration.  
**Tasks:**
- Configure a trunk port on the switch connected to the router.
- Create subinterfaces on the router for each VLAN.
- Apply 802.1Q encapsulation and IP addresses to subinterfaces.
- Verify inter-VLAN routing through the router.

### 11. Legacy Inter-VLAN Routing
**ID:** `legacy-routing`  
**Tag:** LEGACY ROUTING  
**Description:** Router connects to VLANs with 2 separate physical interfaces (no trunk).  
**Details:** 2 router interfaces, access ports, ip routing auto-enabled.  
**Tasks:**
- Connect separate router physical ports to different switch VLAN access ports.
- Configure unique IP subnets on each router interface.
- Verify routing between subnets.

### 12. Port-Security
**ID:** `port-security`  
**Tag:** SECURITY  
**Description:** Port-security enabled on Fa0/3.  
**Tasks:**
- Enable port security on an interface.
- Configure maximum number of allowed MAC addresses.
- Enable sticky MAC learning.
- Set violation action to shutdown and test with unauthorized device.

### 13. Wireless Network (WiFi)
**ID:** `wifi-intermediate`  
**Tag:** WiFi  
**Description:** Router AP and two PCs wireless connectivity.  
**Details:** SSID: HomeWiFi, Router AP mode.  
**Tasks:**
- Configure router wlan0 port in Access Point (AP) mode.
- Set SSID to "HomeWiFi".
- Connect PCs in Client mode using matching SSID.
- Verify wireless connectivity and access the WiFi control panel via browser.

### 14. IoT WiFi Lab
**ID:** `iot-wifi-lab`  
**Tag:** IoT  
**Description:** 3 IoT devices (Temp, Humidity, Motion), WiFi open PC and Router.  
**Details:** SSID: IoT-Network (Open).  
**Tasks:**
- Deploy IoT sensors and connect them to the "IoT-Network" WiFi.
- Manage IoT devices from PC via the IoT control panel (http://iot-panel).
- Monitor real-time environmental data from sensors.

### 15. Greenhouse Sketch (Smart Farm)
**ID:** `greenhouse-iot-lab`  
**Tag:** ENV  
**Description:** 4 IoT sensors (Temp/Humidity/Light/Door), WPA2 WiFi, environmental monitoring.  
**Details:** SSID: GreenHouse-Network (WPA2), Password: sera2026.  
**Tasks:**
- Secure the wireless network with WPA2-PSK.
- Connect specialized IoT sensors (Light, Door/Motion).
- Monitor a simulated greenhouse environment.

### 16. DNS + HTTP Test
**ID:** `dns-http`  
**Tag:** DNS/HTTP  
**Description:** Send HTTP requests and use nslookup to verify server services.  
**Details:** http 192.168.1.10 / http a10.com / nslookup a10.com.  
**Tasks:**
- Configure DNS server with A records.
- Set up an HTTP server.
- Test name resolution from PC using `nslookup`.
- Access the web server via domain name in the PC browser.

### 17. DHCP Distribution Scenario
**ID:** `dhcp-distribution`  
**Tag:** DHCP  
**Description:** Observe DHCP server handing out IPs to PC1 & PC2 while PC3 stays static.  
**Details:** Verify with `sh ip dhcp binding` on the server.  
**Tasks:**
- Set up a dedicated DHCP server (or router service).
- Compare automatic vs manual IP configuration.
- Inspect the DHCP binding table to track assigned leases.

### 18. 2 Switch Trunk Application
**ID:** `trunk-2switch`  
**Tag:** TRUNK  
**Description:** 2 switches, trunk connection, VLAN 100/200 access ports.  
**Details:** SW-1: Fa0/1=VLAN100, Fa0/11=VLAN200 | SW-2: Fa0/1=VLAN100, Fa0/11=VLAN200.  
**Tasks:**
- Configure multiple VLANs across two switches.
- Enable trunking to allow multiple VLAN traffic over a single link.
- Test end-to-end connectivity for devices in the same VLAN across different switches.

---

## Advanced Level

### 19. Inter-VLAN Routing (L3 Switch)
**ID:** `l3-routing`  
**Tag:** L3 ROUTING  
**Description:** 4 VLANs, L3 switch, inter-VLAN routing enabled.  
**Details:** ip routing, VLAN 10/20/30/40 SVI.  
**Tasks:**
- Enable IP routing on a Multilayer Switch.
- Create Switched Virtual Interfaces (SVIs) for each VLAN.
- Assign IP addresses to SVIs to act as gateways.
- Verify routing without an external router.

### 20. Static Routing Lab
**ID:** `static-routing`  
**Tag:** ROUTING  
**Description:** 2 routers, 2 switches, 2 PCs, static routes.  
**Details:** R1: ip route 192.168.20.0/24 192.168.2.2.  
**Tasks:**
- Configure point-to-point links between routers.
- Add manual static routes to reach remote networks.
- Verify path and connectivity using `ping` and `show ip route`.

### 21. EtherChannel Lab
**ID:** `etherchannel`  
**Tag:** ETHERCHANNEL  
**Description:** 2 switches, LACP, link aggregation.  
**Details:** channel-group 1 mode active, Po1 trunk.  
**Tasks:**
- Bundle multiple physical links into a single logical Port-channel.
- Configure LACP (Active/Passive) or Static modes.
- Verify Port-channel status and load balancing.

### 22. STP Redundant Links
**ID:** `stp-redundant`  
**Tag:** STP  
**Description:** 2 switches, redundant links, Rapid-PVST.  
**Details:** spanning-tree priority 28672.  
**Tasks:**
- Configure STP root bridge by adjusting priority.
- Observe blocking (BLK) and forwarding (FWD) states to prevent loops.
- Test STP convergence by breaking a link and watching the redundant path activate.

### 23. STP Triangle Topology
**ID:** `stp-triangle`  
**Tag:** STP  
**Description:** 3 switches, triangle topology, STP blocking.  
**Details:** SW1: Fa0/1 blocked (orange).  
**Tasks:**
- Implement a loop-prone triangle topology.
- Identify the root bridge and blocked ports.
- Verify how STP maintains a loop-free tree structure.

### 24. Campus Network
**ID:** `campus-network`  
**Tag:** CAMPUS  
**Description:** Core router + 2 access switches, routing.  
**Details:** CORE-R1 ip routing, VLAN 10/20.  
**Tasks:**
- Design a hierarchical network with Core and Access layers.
- Implement routing at the core.
- Verify campus-wide connectivity across different access segments.

### 25. STP 3 Switch PVST
**ID:** `stp-3switch-pvst`  
**Tag:** STP  
**Description:** 3 switches, 3 VLANs, different root bridge per VLAN, trunk connections.  
**Details:** VLAN1 root SW1, VLAN10 root SW2, VLAN20 root SW3.  
**Tasks:**
- Configure Per-VLAN Spanning Tree (PVST+).
- Optimize path usage by setting different root bridges for different VLANs.
- Verify VLAN-specific blocked ports and forwarding paths.

### 26. 2 L3 Switch VLAN (AG1/AG2)
**ID:** `l3-switch-2vlan`  
**Tag:** L3 VLAN  
**Description:** 2 L3 switches, VLAN 10 (AG1) and VLAN 20 (AG2), SVI gateway, 8 PCs.  
**Details:** Switch2/Switch4: ip routing, VLAN10 SVI 192.168.10.1, VLAN20 SVI 192.168.20.1.  
**Tasks:**
- Implement a distributed L3 switching environment.
- Configure redundant gateways using SVIs.
- Verify inter-VLAN and inter-switch routing for multiple hosts.

### 27. L3 Switch Static Routing
**ID:** `static-l3-routing`  
**Tag:** STATIC ROUTING  
**Description:** 2 Multilayer Switches + 1 Router + 2 L2 Switches + 2 PCs.  
**Tasks:**
- Configure L3 routed ports on switches (no switchport).
- Set up static routing across multiple L3 hops.
- Test connectivity between distant end-nodes.

### 28. RIP Dynamic Routing
**ID:** `rip-dynamic-routing`  
**Tag:** RIP ROUTING  
**Description:** 2 Multilayer Switches + 2 L2 Switches + 4 PCs. RIP dynamic routing.  
**Tasks:**
- Enable Routing Information Protocol (RIP) on L3 devices.
- Configure network statements to advertise subnets.
- Observe automatic route discovery and convergence in the routing table.

---

## Summary

| Level | Count |
|-------|-------|
| Basic | 8 |
| Intermediate | 10 |
| Advanced | 10 |
| **Total** | **28** |

## Getting Started

To use these examples:
1. Open the Network Simulator 2026.
2. Click on "Example Projects" in the sidebar.
3. Select an example from the list.
4. The example will load with pre-configured devices and connections.
5. Follow the notes provided in the canvas for specific configuration steps.

## Contributing

To add a new example:
1. Define devices in `src/lib/network/exampleProjects.ts`.
2. Configure connections between devices.
3. Set initial states for each device.
4. Add notes explaining the topology and configuration.
5. Add the example to the `exampleProjects` array.
6. Update this documentation.
