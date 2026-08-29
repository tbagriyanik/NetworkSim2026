// Routing protocols ve router config alt komutlari
import type { CommandPattern } from './commandPatterns.types';

export const routingPatterns: Record<string, CommandPattern> = {
  // Routing protocols
  'router rip': {
    pattern: /^router\s+rip$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'router ospf': {
    pattern: /^router\s+ospf\s*(\d*)$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 1
  },
  'router eigrp': {
    pattern: /^router\s+eigrp\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'router bgp': {
    pattern: /^router\s+bgp\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'ipv6 router rip': {
    pattern: /^ipv6\s+router\s+rip\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'ipv6 router ospf': {
    pattern: /^ipv6\s+router\s+ospf\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no router rip': {
    pattern: /^no\s+router\s+rip$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'no ipv6 router rip': {
    pattern: /^no\s+ipv6\s+router\s+rip\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no ipv6 router ospf': {
    pattern: /^no\s+ipv6\s+router\s+ospf\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no router ospf': {
    pattern: /^no\s+router\s+ospf$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'no router eigrp': {
    pattern: /^no\s+router\s+eigrp\s*(\d*)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no router bgp': {
    pattern: /^no\s+router\s+bgp\s*(\d*)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  // Router config subcommands
  'network': {
    pattern: /^network\s+([0-9.]+)(?:\s+([0-9.]+))?(?:\s+area\s+(\d+)|(?:\s+mask\s+([0-9.]+)))?$/i,
    modes: ['router-config', 'dhcp-config'],
    minArgs: 1,
    maxArgs: 4
  },
  'version': {
    pattern: /^version\s+[12]$/i,
    modes: ['router-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'neighbor remote-as': {
    pattern: /^neighbor\s+([0-9.]+)\s+remote-as\s+(\d+)$/i,
    modes: ['router-config'],
    minArgs: 2,
    maxArgs: 2
  },
  'ipv6 dhcp pool': {
    pattern: /^ipv6\s+dhcp\s+pool\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no ipv6 dhcp pool': {
    pattern: /^no\s+ipv6\s+dhcp\s+pool\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'ipv6 dhcp server': {
    pattern: /^ipv6\s+dhcp\s+server\s+(\S+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'address prefix': {
    pattern: /^address\s+prefix\s+([0-9a-fA-F:]+\/\d+)$/i,
    modes: ['dhcp-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no auto-summary': {
    pattern: /^no\s+auto-summary$/i,
    modes: ['router-config'],
    minArgs: 0,
    maxArgs: 0
  },
  'router-id': {
    pattern: /^router-id\s+([0-9.]+)$/i,
    modes: ['router-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'passive-interface': {
    pattern: /^passive-interface\s+(\S+)$/i,
    modes: ['router-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'default-information originate': {
    pattern: /^default-information\s+originate$/i,
    modes: ['router-config'],
    minArgs: 0,
    maxArgs: 0
  },
  'default-information always': {
    pattern: /^default-information\s+always$/i,
    modes: ['router-config'],
    minArgs: 0,
    maxArgs: 0
  },

  'redistribute': {
    pattern: /^redistribute\s+(ospf|rip|eigrp|bgp|static|connected)(?:\s+(\d+))?(?:\s+metric\s+(\d+))?(\s+subnets)?$/i,
    modes: ['router-config'],
    minArgs: 1,
    maxArgs: 4
  },
  'no redistribute': {
    pattern: /^no\s+redistribute\s+(ospf|rip|eigrp|bgp|static|connected)(?:\s+(\d+))?$/i,
    modes: ['router-config'],
    minArgs: 2,
    maxArgs: 3
  },


  'cdp timer': {
    pattern: /^cdp\s+timer\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'cdp holdtime': {
    pattern: /^cdp\s+holdtime\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'lldp timer': {
    pattern: /^lldp\s+timer\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'lldp holdtime': {
    pattern: /^lldp\s+holdtime\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'lldp reinit': {
    pattern: /^lldp\s+reinit\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'vtp mode': {
    pattern: /^vtp\s+mode\s+(server|client|transparent|off)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'vtp domain': {
    pattern: /^vtp\s+domain\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'vtp password': {
    pattern: /^vtp\s+password\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'spanning-tree mode': {
    pattern: /^spanning-tree\s+mode\s+(pvst|rapid-pvst|mst)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'spanning-tree mst configuration': {
    pattern: /^spanning-tree\s+mst\s+configuration$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'spanning-tree mst priority': {
    pattern: /^spanning-tree\s+mst\s+(\d+)\s+priority\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 3,
    maxArgs: 3
  },
  'name': {
    pattern: /^name\s+(\S+)$/i,
    modes: ['config-mst'],
    minArgs: 1,
    maxArgs: 1
  },
  'revision': {
    pattern: /^revision\s+(\d+)$/i,
    modes: ['config-mst'],
    minArgs: 1,
    maxArgs: 1
  },
  'instance': {
    pattern: /^instance\s+(\d+)\s+vlan\s+([0-9,-]+)$/i,
    modes: ['config-mst'],
    minArgs: 3,
    maxArgs: 3
  },
  'no instance': {
    pattern: /^no\s+instance\s+(\d+)$/i,
    modes: ['config-mst'],
    minArgs: 2,
    maxArgs: 2
  },
  'show pending': {
    pattern: /^show\s+pending$/i,
    modes: ['config-mst'],
    minArgs: 0,
    maxArgs: 0
  },
  'spanning-tree vlan': {
    pattern: /^spanning-tree\s+vlan\s+(\d+)(?:\s+(priority|root)(?:\s+(primary|secondary|\d+))?)?$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 4
  },
  'spanning-tree portfast': {
    pattern: /^spanning-tree\s+portfast(\s+(default|edge|bpduguard\s+(enable|disable)))?$/i,
    modes: ['config', 'interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 2
  },
  'spanning-tree bpduguard': {
    pattern: /^spanning-tree\s+bpduguard\s+(enable|disable)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'no spanning-tree': {
    pattern: /^no\s+spanning-tree(\s+vlan\s+(\d+))?$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 2
  },
  'errdisable recovery': {
    pattern: /^errdisable\s+recovery\s+(cause|interval)\s+(.+)$/i,
    modes: ['config'],
    minArgs: 2,
    maxArgs: 2
  },
  'ipv6 rip enable': {
    pattern: /^ipv6\s+rip\s+(\S+)\s+enable$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'ipv6 ospf area': {
    pattern: /^ipv6\s+ospf\s+(\d+)\s+area\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'no ipv6 rip enable': {
    pattern: /^no\s+ipv6\s+rip\s+(\S+)\s+enable$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'ip ospf area': {
    pattern: /^ip\s+ospf\s+(\d+)\s+area\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'no ip ospf area': {
    pattern: /^no\s+ip\s+ospf\s+(\d+)\s+area\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'no ipv6 ospf area': {
    pattern: /^no\s+ipv6\s+ospf\s+(\d+)\s+area\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'errdisable recovery cause': {
    pattern: /^errdisable\s+recovery\s+cause\s+(all|bpduguard|channel-misconfig|dhcp-rate-limit|dtp-flap|gbic-invalid|l2ptguard|linkstate|loopback|mac-limit|pagp-flap|port-mode-failure|port-security|psecure-violation|security-violation|sfp-config-mismatch|small-frame|storm-control|udld|unicast-flood)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'show ipv6 route': {
    pattern: /^show\s+ipv6\s+route(\s+(.+))?$/i,
    modes: ['user', 'privileged'],
    minArgs: 0,
    maxArgs: 1
  },
  'mls qos': {
    pattern: /^mls\s+qos$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'no mls qos': {
    pattern: /^no\s+mls\s+qos$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip dhcp snooping': {
    pattern: /^ip\s+dhcp\s+snooping$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip dhcp snooping vlan': {
    pattern: /^ip\s+dhcp\s+snooping\s+vlan\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no ip dhcp snooping': {
    pattern: /^no\s+ip\s+dhcp\s+snooping$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip arp inspection': {
    pattern: /^ip\s+arp\s+inspection\s+vlan\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no ip arp inspection': {
    pattern: /^no\s+ip\s+arp\s+inspection(\s+vlan\s+(.+))?$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 2
  },
  'system mtu': {
    pattern: /^system\s+mtu\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'sdm prefer': {
    pattern: /^sdm\s+prefer\s+(default|dual-ipv4-and-ipv6|lanbase-routing|qos)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'snmp-server community': {
    pattern: /^snmp-server\s+community\s+(\S+)(\s+(RO|RW))?$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 2
  },
  'snmp-server contact': {
    pattern: /^snmp-server\s+contact\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'snmp-server location': {
    pattern: /^snmp-server\s+location\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'ntp server': {
    pattern: /^ntp\s+server\s+([0-9.]+|[\w.-]+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'clock timezone': {
    pattern: /^clock\s+timezone\s+(\S+)\s+([+-]?\d+)(:\d+)?$/i,
    modes: ['config'],
    minArgs: 2,
    maxArgs: 3
  },
  'archive': {
    pattern: /^archive$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'alias': {
    pattern: /^alias\s+(exec|configure|interface|line)\s+(\S+)\s+(.+)$/i,
    modes: ['config'],
    minArgs: 3,
    maxArgs: 3
  },
  'no alias': {
    pattern: /^no\s+alias\s+(exec|configure|interface|line)\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 2,
    maxArgs: 2
  },
  'macro': {
    pattern: /^macro\s+(name|global|auto\s+(execute|processing))\s+(.+)$/i,
    modes: ['config', 'interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 3
  },

};
