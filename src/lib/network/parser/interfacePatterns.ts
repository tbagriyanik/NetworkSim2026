// Firewall ASA ve interface komutlari
import type { CommandPattern } from './commandPatterns.types';

export const interfacePatterns: Record<string, CommandPattern> = {
  // Firewall ASA specific commands
  'nameif': {
    pattern: /^nameif\s+(\S+)$/i,
    modes: ['interface'],
    minArgs: 1,
    maxArgs: 1,
    capability: 'firewall'
  },
  'security-level': {
    pattern: /^security-level\s+(\d+)$/i,
    modes: ['interface'],
    minArgs: 1,
    maxArgs: 1,
    capability: 'firewall'
  },
  'same-security-traffic': {
    pattern: /^same-security-traffic\s+permit\s+inter-interface$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0,
    capability: 'firewall'
  },
  'no same-security-traffic': {
    pattern: /^no\s+same-security-traffic\s+permit\s+inter-interface$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0,
    capability: 'firewall'
  },

  // Interface komutları - interface ÖNCE gelmeli (daha spesifik)
  'interface': {
    pattern: /^interface\s+(?!r(?:ange)?\s)(f(?:a(?:st(?:ethernet)?)?)?|g(?:i(?:g(?:abit(?:ethernet)?)?)?)?|e(?:thernet)?|se(?:rial)?|po(?:\s*port-channel)?|vlan|loopback|lo)?\s*(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'interface range': {
    pattern: /^interface\s+r(?:ange)?\s+(?:(?:f(?:a(?:st(?:ethernet)?)?)?|g(?:i(?:g(?:abit(?:ethernet)?)?)?)?|e(?:thernet)?|se(?:rial)?|po(?:\s*port-channel)?|vlan)\s*)?(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'default interface': {
    pattern: /^default\s+interface\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'no interface': {
    pattern: /^no\s+interface\s+(.+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'ipv6 address': {
    pattern: /^ipv6\s+address\s+([0-9a-fA-F:]+)\/(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'no shutdown': {
    pattern: /^no\s+shutdown$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'shutdown': {
    pattern: /^shutdown$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'speed': {
    pattern: /^speed\s+(10|100|1000|2500|5000|10000|auto)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'duplex': {
    pattern: /^duplex\s+(half|full|auto)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'description': {
    pattern: /^description\s+(.+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'no description': {
    pattern: /^no\s+description$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport mode': {
    pattern: /^switchport\s+mode\s+(access|trunk|dynamic\s+(auto|desirable)|dot1q-tunnel)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 2
  },
  'no switchport': {
    pattern: /^no\s+switchport$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no switchport mode': {
    pattern: /^no\s+switchport\s+mode$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport access vlan': {
    pattern: /^switchport\s+access\s+vlan\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'no switchport access vlan': {
    pattern: /^no\s+switchport\s+access\s+vlan$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport trunk allowed vlan': {
    pattern: /^switchport\s+trunk\s+allowed\s+vlan\s+(.+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport trunk native vlan': {
    pattern: /^switchport\s+trunk\s+native\s+vlan\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport trunk encapsulation': {
    pattern: /^switchport\s+trunk\s+encapsulation\s+(dot1q|isl|negotiate)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'encapsulation dot1q': {
    pattern: /^encapsulation\s+dot1q\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
    // Capability omitted - used by both routers and switches
  },
  'encapsulation hdlc': {
    pattern: /^encapsulation\s+hdlc$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'encapsulation ppp': {
    pattern: /^encapsulation\s+ppp$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'clock rate': {
    pattern: /^clock\s+rate\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'ppp authentication pap': {
    pattern: /^ppp\s+authentication\s+pap$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'ppp authentication chap': {
    pattern: /^ppp\s+authentication\s+chap$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'ppp pap sent-username': {
    pattern: /^ppp\s+pap\s+sent-username\s+(\S+)\s+password\s+0\s+(\S+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'no encapsulation': {
    pattern: /^no\s+encapsulation$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no clock rate': {
    pattern: /^no\s+clock\s+rate$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no ppp authentication': {
    pattern: /^no\s+ppp\s+authentication$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport nonegotiate': {
    pattern: /^switchport\s+nonegotiate$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport protected': {
    pattern: /^switchport\s+protected$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport block': {
    pattern: /^switchport\s+block\s+(unicast|multicast)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport port-security': {
    pattern: /^switchport\s+port-security$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no switchport port-security': {
    pattern: /^no\s+switchport\s+port-security$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport port-security maximum': {
    pattern: /^switchport\s+port-security\s+maximum\s+(\d+)(\s+vlan\s+(.+))?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 3
  },
  'switchport port-security violation': {
    pattern: /^switchport\s+port-security\s+violation\s+(protect|restrict|shutdown)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport port-security mac-address': {
    pattern: /^switchport\s+port-security\s+mac-address\s+(.+?)(\s+vlan\s+(\d+))?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 3
  },
  'switchport port-security mac-address sticky': {
    pattern: /^switchport\s+port-security\s+mac-address\s+sticky$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'switchport port-security aging time': {
    pattern: /^switchport\s+port-security\s+aging\s+time\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport port-security aging type': {
    pattern: /^switchport\s+port-security\s+aging\s+type\s+(absolute|inactivity)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport voice vlan': {
    pattern: /^switchport\s+voice\s+vlan\s+(\d+|dot1p|none|untagged)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'switchport voice': {
    pattern: /^switchport\s+voice\s+(.+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'cdp enable': {
    pattern: /^cdp\s+enable$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no cdp enable': {
    pattern: /^no\s+cdp\s+enable$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'channel-group': {
    pattern: /^channel-group\s+(\d+)(\s+mode\s+(on|active|passive|desirable|auto))?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 3
  },
  'ssid': {
    pattern: /^ssid\s+(.+)$/i,
    modes: ['interface', 'config-if-range', 'dot11-config'],
    minArgs: 1,
    maxArgs: 1,
    capability: 'routing' // Routers/APs
  },
  'encryption': {
    pattern: /^encryption\s+(open|wep|wpa|wpa2|wpa3)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1,
    capability: 'routing'
  },
  'no channel-group': {
    pattern: /^no\s+channel-group\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'channel-protocol': {
    pattern: /^channel-protocol\s+(lacp|pagp)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'storm-control': {
    pattern: /^storm-control\s+(broadcast|multicast|unicast)\s+level\s+(.+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 2,
    maxArgs: 2
  },
  'storm-control action': {
    pattern: /^storm-control\s+action\s+(shutdown|trap)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'udld enable': {
    pattern: /^udld\s+enable$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'udld port': {
    pattern: /^udld\s+port(\s+aggressive)?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 1
  },
  'no udld': {
    pattern: /^no\s+udld(\s+(enable|port))?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 1
  },
  'mls qos trust': {
    pattern: /^mls\s+qos\s+trust\s+(cos|dscp|ip-precedence)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'mls qos cos': {
    pattern: /^mls\s+qos\s+cos\s+(\d+)(\s+override)?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 2
  },
  'priority-queue out': {
    pattern: /^priority-queue\s+out$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'queue-set': {
    pattern: /^queue-set\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'tx-queue': {
    pattern: /^tx-queue\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'power inline': {
    pattern: /^power\s+inline\s+(auto|static|never)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'power inline consumption': {
    pattern: /^power\s+inline\s+consumption\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'wlan': {
    pattern: /^wlan\s+(\S+)\s+(\d+)\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 3,
    maxArgs: 3
  },
  'wlan shutdown': {
    pattern: /^wlan\s+shutdown$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'no wlan shutdown': {
    pattern: /^no\s+wlan\s+shutdown$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0
  },
  'ap': {
    pattern: /^ap\s+(\S+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1
  },
  'auth-mac': {
    pattern: /^auth-mac\s+([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})$/i,
    modes: ['ap-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'rf-channel': {
    pattern: /^rf-channel\s+(\d+)$/i,
    modes: ['ap-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'dot11 5ghz': {
    pattern: /^dot11\s+5ghz\s+(power-constraint|channelswitch\s+mode)\s+(.+)$/i,
    modes: ['ap-config'],
    minArgs: 1,
    maxArgs: 1
  },
  'security wpa psk set-key': {
    pattern: /^security\s+wpa\s+psk\s+set-key\s+ascii\s+(?:0|7)\s+(.+)$/i,
    modes: ['config'],
    minArgs: 5,
    maxArgs: 5,
    capability: 'routing'
  },
  'security wep key set-key': {
    pattern: /^security\s+wep\s+(?:key\s+set-key|key)\s+ascii\s+(?:0|7)\s+(.+)$/i,
    modes: ['config'],
    minArgs: 4,
    maxArgs: 5,
    capability: 'routing'
  },
  'mbssid': {
    pattern: /^mbssid$/i,
    modes: ['ssid-config'],
    minArgs: 0,
    maxArgs: 0,
    capability: 'routing'
  },
  'no mbssid': {
    pattern: /^no\s+mbssid$/i,
    modes: ['ssid-config'],
    minArgs: 0,
    maxArgs: 0,
    capability: 'routing'
  },
  'world-mode dot11d': {
    pattern: /^world-mode\s+dot11d\s+([1-9]|-1)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1,
    capability: 'routing'
  },
  'no security wpa psk': {
    pattern: /^no\s+security\s+wpa\s+psk$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 0,
    capability: 'routing'
  },
  'no security wep': {
    pattern: /^no\s+security\s+wep(?:\s+key)?$/i,
    modes: ['config'],
    minArgs: 0,
    maxArgs: 1,
    capability: 'routing'
  },
  'channel': {
    pattern: /^channel\s+(\d+)$/i,
    modes: ['config'],
    minArgs: 1,
    maxArgs: 1,
    capability: 'routing'
  },
  'station-role': {
    pattern: /^station-role\s+root$/i,
    modes: ['config'],
    minArgs: 2,
    maxArgs: 2,
    capability: 'routing'
  },
  'ip address': {
    pattern: /^ip\s+address\s+(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(\s+secondary)?|dhcp)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 3
  },
  'no ip address': {
    pattern: /^no\s+ip\s+address(?:\s+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\s+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?)?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 3
  },
  'ip helper-address': {
    pattern: /^ip\s+helper-address\s+([0-9.]+|[\w.-]+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'ip directed-broadcast': {
    pattern: /^ip\s+directed-broadcast$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no ip directed-broadcast': {
    pattern: /^no\s+ip\s+directed-broadcast$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip proxy-arp': {
    pattern: /^ip\s+proxy-arp$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no ip proxy-arp': {
    pattern: /^no\s+ip\s+proxy-arp$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip verify source': {
    pattern: /^ip\s+verify\s+source(\s+(vlan\s+dhcp-snooping|port-security))?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 2
  },
  'ip dhcp snooping trust': {
    pattern: /^ip\s+dhcp\s+snooping\s+trust$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no ip dhcp snooping trust': {
    pattern: /^no\s+ip\s+dhcp\s+snooping\s+trust$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip arp inspection trust': {
    pattern: /^ip\s+arp\s+inspection\s+trust$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'no ip arp inspection trust': {
    pattern: /^no\s+ip\s+arp\s+inspection\s+trust$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'ip arp inspection limit': {
    pattern: /^ip\s+arp\s+inspection\s+limit\s+(rate\s+\d+|none)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 2
  },
  'keepalive': {
    pattern: /^keepalive(\s+(\d+))?$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 1
  },
  'no keepalive': {
    pattern: /^no\s+keepalive$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 0,
    maxArgs: 0
  },
  'carrier-delay': {
    pattern: /^carrier-delay\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'bandwidth': {
    pattern: /^bandwidth\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'delay': {
    pattern: /^delay\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },
  'load-interval': {
    pattern: /^load-interval\s+(\d+)$/i,
    modes: ['interface', 'config-if-range'],
    minArgs: 1,
    maxArgs: 1
  },

};
