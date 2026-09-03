import { ExamTask } from './examTypes';

// Exam tasks - Basic Connectivity Exam
export const basicConnectivityExamTasks: ExamTask[] = [
  {
    id: 'exam-connect-pc-switch',
    title: { tr: 'PC ve Switch Bağlantısı', en: 'PC and Switch Connection' },
    description: { tr: 'PC-1 cihazını Switch-1\'e doğru kablo ile bağlayın.', en: 'Connect PC-1 to Switch-1 using the correct cable.' },
    weight: 20,
    checkType: 'connection',
    checkParams: {
      cableType: 'straight',
      sourceDevice: 'pc-1',
      sourcePort: 'eth0',
      targetDevice: 'switch-1',
      targetPort: 'fa0/1'
    },
    completed: false
  },
  {
    id: 'exam-config-hostname',
    title: { tr: 'Hostname Yapılandırması', en: 'Hostname Configuration' },
    description: { tr: 'Switch ismini "Sinav-Switch" olarak değiştirin.', en: 'Change switch name to "Sinav-Switch".' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'hostname Sinav-Switch' },
    completed: false
  },
  {
    id: 'exam-config-vlan10',
    title: { tr: 'VLAN 10 Oluşturma', en: 'Create VLAN 10' },
    description: { tr: 'VLAN 10 oluşturun ve ismini "MUHASEBE" yapın.', en: 'Create VLAN 10 and name it "MUHASEBE".' },
    weight: 30,
    checkType: 'command',
    checkParams: { commandPattern: 'vlan 10' }, // Simplified check for creation
    completed: false
  },
  {
    id: 'exam-assign-port',
    title: { tr: 'Port Atama', en: 'Assign Port' },
    description: { tr: 'Fa0/1 portunu VLAN 10\'a atayın.', en: 'Assign Fa0/1 port to VLAN 10.' },
    weight: 30,
    checkType: 'config',
    checkParams: { configKey: 'ports.fa0/1.vlan', configValue: 10 },
    completed: false
  }
];

// Exam tasks - Routing Basics
export const routingBasicsExamTasks: ExamTask[] = [
  {
    id: 'exam-route-connect-pc1',
    title: { tr: 'PC-1 Bağlantısı', en: 'PC-1 Connection' },
    description: { tr: 'PC-1\'i R1 Gi0/0 portuna doğru kablo ile bağlayın.', en: 'Connect PC-1 to R1 Gi0/0 with the correct cable.' },
    weight: 15,
    checkType: 'connection',
    checkParams: {
      cableType: 'straight',
      sourceDevice: 'pc-1',
      sourcePort: 'eth0',
      targetDevice: 'r-1',
      targetPort: 'gi0/0'
    },
    completed: false
  },
  {
    id: 'exam-route-connect-pc2',
    title: { tr: 'PC-2 Bağlantısı', en: 'PC-2 Connection' },
    description: { tr: 'PC-2\'yi R1 Gi0/1 portuna doğru kablo ile bağlayın.', en: 'Connect PC-2 to R1 Gi0/1 with the correct cable.' },
    weight: 15,
    checkType: 'connection',
    checkParams: {
      cableType: 'straight',
      sourceDevice: 'pc-2',
      sourcePort: 'eth0',
      targetDevice: 'r-1',
      targetPort: 'gi0/1'
    },
    completed: false
  },
  {
    id: 'exam-route-gi00',
    title: { tr: 'R1 Gi0/0 Arayüz Yapılandırması', en: 'R1 Gi0/0 Interface Configuration' },
    description: { tr: 'R1 Gi0/0 portuna 192.168.1.1/24 IP atayın ve no shutdown ile aktif edin.', en: 'Assign 192.168.1.1/24 to R1 Gi0/0 and enable it with no shutdown.' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'ip address 192.168.1.1 255.255.255.0' },
    completed: false
  },
  {
    id: 'exam-route-gi01',
    title: { tr: 'R1 Gi0/1 Arayüz Yapılandırması', en: 'R1 Gi0/1 Interface Configuration' },
    description: { tr: 'R1 Gi0/1 portuna 192.168.2.1/24 IP atayın ve no shutdown ile aktif edin.', en: 'Assign 192.168.2.1/24 to R1 Gi0/1 and enable it with no shutdown.' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'ip address 192.168.2.1 255.255.255.0' },
    completed: false
  },
  {
    id: 'exam-route-pc1',
    title: { tr: 'PC-1 IP Yapılandırması', en: 'PC-1 IP Configuration' },
    description: { tr: 'PC-1\'e 192.168.1.10/24 IP ve 192.168.1.1 gateway atayın.', en: 'Assign IP 192.168.1.10/24 and gateway 192.168.1.1 to PC-1.' },
    weight: 10,
    checkType: 'config',
    checkParams: { configKey: 'pc.pc-1.ip', configValue: '192.168.1.10', subnetMask: '255.255.255.0' },
    completed: false
  },
  {
    id: 'exam-route-pc2',
    title: { tr: 'PC-2 IP Yapılandırması', en: 'PC-2 IP Configuration' },
    description: { tr: 'PC-2\'ye 192.168.2.10/24 IP ve 192.168.2.1 gateway atayın.', en: 'Assign IP 192.168.2.10/24 and gateway 192.168.2.1 to PC-2.' },
    weight: 10,
    checkType: 'config',
    checkParams: { configKey: 'pc.pc-2.ip', configValue: '192.168.2.10', subnetMask: '255.255.255.0' },
    completed: false
  },
  {
    id: 'exam-route-static',
    title: { tr: 'Statik Rota', en: 'Static Route' },
    description: { tr: 'R1 üzerinde 10.0.0.0/24 ağına giden statik rota tanımlayın.', en: 'Define a static route to 10.0.0.0/24 on R1.' },
    weight: 10,
    checkType: 'command',
    checkParams: { commandPattern: 'ip route 10.0.0.0 255.255.255.0' },
    completed: false
  }
];

// Exam tasks - L3 Switch & DHCP
export const l3SwitchDhcpExamTasks: ExamTask[] = [
  {
    id: 'exam-l3-enable-routing',
    title: { tr: 'IP Routing Etkinleştirme', en: 'Enable IP Routing' },
    description: { tr: 'L3 Switch üzerinde "ip routing" komutunu çalıştırın.', en: 'Run "ip routing" command on L3 Switch.' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'ip routing' },
    completed: false
  },
  {
    id: 'exam-l3-vlan20-create',
    title: { tr: 'VLAN 20 Oluşturma', en: 'Create VLAN 20' },
    description: { tr: 'VLAN 20 oluşturun.', en: 'Create VLAN 20.' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'vlan 20' },
    completed: false
  },
  {
    id: 'exam-l3-svi20-ip',
    title: { tr: 'SVI VLAN 20 IP Atama', en: 'Assign SVI VLAN 20 IP' },
    description: { tr: 'Interface VLAN 20\'ye 172.16.20.1/24 IP\'sini atayın.', en: 'Assign 172.16.20.1/24 IP to Interface VLAN 20.' },
    weight: 20,
    checkType: 'config',
    checkParams: { configKey: 'interfaces.vlan20.ip', configValue: '172.16.20.1' },
    completed: false
  },
  {
    id: 'exam-l3-dhcp-pool-create',
    title: { tr: 'DHCP Havuzu Oluşturma', en: 'Create DHCP Pool' },
    description: { tr: 'L3 Switch üzerinde "MY-POOL" isminde bir DHCP havuzu oluşturun.', en: 'Create a DHCP pool named "MY-POOL" on L3 Switch.' },
    weight: 5,
    checkType: 'command',
    checkParams: { commandPattern: 'ip dhcp pool MY-POOL' },
    completed: false
  },
  {
    id: 'exam-l3-dhcp-excluded',
    title: { tr: 'DHCP Hariç Tutulan IP', en: 'DHCP Excluded IP' },
    description: { tr: '172.16.20.1 adresini DHCP dağıtımından hariç tutun.', en: 'Exclude 172.16.20.1 from DHCP allocation.' },
    weight: 5,
    checkType: 'command',
    checkParams: { commandPattern: 'ip dhcp excluded-address 172.16.20.1' },
    completed: false
  },
  {
    id: 'exam-l3-dhcp-network',
    title: { tr: 'DHCP Network Tanımı', en: 'DHCP Network Definition' },
    description: { tr: 'DHCP havuzunda ağı 172.16.20.0/24 olarak tanımlayın.', en: 'Define DHCP pool network as 172.16.20.0/24.' },
    weight: 10,
    checkType: 'command',
    checkParams: { commandPattern: 'network 172.16.20.0 255.255.255.0' },
    completed: false
  },
  {
    id: 'exam-l3-dhcp-default-router',
    title: { tr: 'DHCP Varsayılan Ağ Geçidi', en: 'DHCP Default Gateway' },
    description: { tr: 'DHCP havuzunda varsayılan ağ geçidi olarak 172.16.20.1 tanımlayın.', en: 'Set DHCP default gateway to 172.16.20.1 in the pool.' },
    weight: 10,
    checkType: 'command',
    checkParams: { commandPattern: 'default-router 172.16.20.1' },
    completed: false
  },
  {
    id: 'exam-l3-dhcp-dns',
    title: { tr: 'DHCP DNS Tanımı', en: 'DHCP DNS Definition' },
    description: { tr: 'DHCP havuzunda DNS sunucusu olarak 8.8.8.8 tanımlayın.', en: 'Set DHCP DNS server to 8.8.8.8 in the pool.' },
    weight: 5,
    checkType: 'command',
    checkParams: { commandPattern: 'dns-server 8.8.8.8' },
    completed: false
  },
  {
    id: 'exam-l3-dhcp-lease',
    title: { tr: 'DHCP Lease Süresi', en: 'DHCP Lease Duration' },
    description: { tr: 'DHCP havuzunda kira süresini 7 gün olarak ayarlayın.', en: 'Set DHCP lease time to 7 days in the pool.' },
    weight: 5,
    checkType: 'command',
    checkParams: { commandPattern: 'lease 7' },
    completed: false
  }
];

// Exam tasks - VLAN Trunking & VTP
export const vlanTrunkingExamTasks: ExamTask[] = [
  {
    id: 'exam-vtp-mode-server',
    title: { tr: 'VTP Mode Server', en: 'VTP Mode Server' },
    description: { tr: 'SW1 cihazını VTP server moduna alın.', en: 'Set SW1 to VTP server mode.' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'vtp mode server' },
    completed: false
  },
  {
    id: 'exam-vtp-domain',
    title: { tr: 'VTP Domain', en: 'VTP Domain' },
    description: { tr: 'VTP domain adını "SINAV" olarak belirleyin.', en: 'Set VTP domain name to "SINAV".' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'vtp domain SINAV' },
    completed: false
  },
  {
    id: 'exam-trunk-config',
    title: { tr: 'Trunk Yapılandırması', en: 'Trunk Configuration' },
    description: { tr: 'Gi0/1 portunu trunk moduna alın.', en: 'Configure Gi0/1 as a trunk port.' },
    weight: 30,
    checkType: 'command',
    checkParams: { commandPattern: 'switchport mode trunk' },
    completed: false
  },
  {
    id: 'exam-vlan-creation',
    title: { tr: 'VLAN Oluşturma', en: 'VLAN Creation' },
    description: { tr: 'VLAN 50 oluşturun ve ismini "IDARI" yapın.', en: 'Create VLAN 50 and name it "IDARI".' },
    weight: 30,
    checkType: 'command',
    checkParams: { commandPattern: 'vlan 50' },
    completed: false
  }
];

// Exam tasks - Standard ACL
export const basicAclExamTasks: ExamTask[] = [
  {
    id: 'exam-acl-create',
    title: { tr: 'Standard ACL Oluşturma', en: 'Create Standard ACL' },
    description: { tr: '10 numaralı standard ACL oluşturun ve 192.168.1.10 hostunu engelleyin.', en: 'Create standard ACL 10 and deny host 192.168.1.10.' },
    weight: 40,
    checkType: 'command',
    checkParams: { commandPattern: 'access-list 10 deny host 192.168.1.10' },
    completed: false
  },
  {
    id: 'exam-acl-permit-any',
    title: { tr: 'ACL Permit Any', en: 'ACL Permit Any' },
    description: { tr: 'ACL 10 listesine diğer tüm trafiğe izin veren kuralı ekleyin.', en: 'Add a rule to ACL 10 to permit all other traffic.' },
    weight: 20,
    checkType: 'command',
    checkParams: { commandPattern: 'access-list 10 permit any' },
    completed: false
  },
  {
    id: 'exam-acl-apply',
    title: { tr: 'ACL Uygulama', en: 'Apply ACL' },
    description: { tr: 'ACL 10\'u Gi0/0 arayüzüne giriş (in) yönünde uygulayın.', en: 'Apply ACL 10 to Gi0/0 interface in the "in" direction.' },
    weight: 40,
    checkType: 'command',
    checkParams: { commandPattern: 'ip access-group 10 in' },
    completed: false
  }
];

// Comprehensive Final Exam Tasks
export const comprehensiveFinalExamTasks: ExamTask[] = [
  {
    id: 'master-conn-pc-as',
    title: { tr: 'PC-AS1 Bağlantısı', en: 'PC-AS1 Connection' },
    description: { tr: 'PC-1 cihazını AS-1 Switch\'inin Fa0/1 portuna bağlayın.', en: 'Connect PC-1 to Fa0/1 port of AS-1 Switch.' },
    weight: 5,
    checkType: 'connection',
    checkParams: { sourceDevice: 'pc-1', sourcePort: 'eth0', targetDevice: 'as-1', targetPort: 'fa0/1', cableType: 'straight' },
    completed: false
  },
  {
    id: 'master-conn-as-ds',
    title: { tr: 'Trunk Bağlantısı', en: 'Trunk Connection' },
    description: { tr: 'AS-1 (Gi0/1) ile DS-1 (Gi1/0/1) arasını crossover kablo ile bağlayın.', en: 'Connect AS-1 (Gi0/1) and DS-1 (Gi1/0/1) with a crossover cable.' },
    weight: 5,
    checkType: 'connection',
    checkParams: { sourceDevice: 'as-1', sourcePort: 'gi0/1', targetDevice: 'ds-1', targetPort: 'gi1/0/1', cableType: 'crossover' },
    completed: false
  },
  {
    id: 'master-conn-ds-r1',
    title: { tr: 'Dağıtım-Yönlendirici Bağlantısı', en: 'Distribution-Router Connection' },
    description: { tr: 'DS-1 (Gi1/0/2) ile R1 (Gi0/0) arasını crossover kablo ile bağlayın.', en: 'Connect DS-1 (Gi1/0/2) and R1 (Gi0/0) with a crossover cable.' },
    weight: 5,
    checkType: 'connection',
    checkParams: { sourceDevice: 'ds-1', sourcePort: 'gi1/0/2', targetDevice: 'r-1', targetPort: 'gi0/0', cableType: 'crossover' },
    completed: false
  },
  {
    id: 'master-ds1-hostname',
    title: { tr: 'L3 Switch Hostname', en: 'L3 Switch Hostname' },
    description: { tr: 'L3 Switch ismini "DS-1" olarak ayarlayın.', en: 'Set L3 Switch hostname to "DS-1".' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', commandPattern: 'hostname DS-1' },
    completed: false
  },
  {
    id: 'master-r1-hostname',
    title: { tr: 'Router Hostname', en: 'Router Hostname' },
    description: { tr: 'Router ismini "R-1" olarak ayarlayın.', en: 'Set Router hostname to "R-1".' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'router', commandPattern: 'hostname R-1' },
    completed: false
  },
  {
    id: 'master-vlan10-as1',
    title: { tr: 'AS-1 VLAN 10', en: 'AS-1 VLAN 10' },
    description: { tr: 'AS-1 üzerinde VLAN 10 oluşturun.', en: 'Create VLAN 10 on AS-1.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', targetDeviceId: 'as-1', commandPattern: 'vlan 10' },
    completed: false
  },
  {
    id: 'master-vlan10-assign',
    title: { tr: 'Port VLAN Ataması', en: 'Port VLAN Assignment' },
    description: { tr: 'AS-1 Fa0/1 portunu VLAN 10\'a atayın.', en: 'Assign AS-1 Fa0/1 port to VLAN 10.' },
    weight: 5,
    checkType: 'config',
    checkParams: { targetDeviceId: 'as-1', configKey: 'ports.fa0/1.vlan', configValue: 10 },
    completed: false
  },
  {
    id: 'master-trunk-as1',
    title: { tr: 'AS-1 Trunk', en: 'AS-1 Trunk' },
    description: { tr: 'AS-1 Gi0/1 portunu trunk moduna alın.', en: 'Set AS-1 Gi0/1 port to trunk mode.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', targetDeviceId: 'as-1', commandPattern: 'switchport mode trunk' },
    completed: false
  },
  {
    id: 'master-trunk-ds1',
    title: { tr: 'Trunk Yapılandırması (DS-1)', en: 'Trunk Configuration (DS-1)' },
    description: { tr: 'DS-1 Gi1/0/1 portunu trunk moduna alın.', en: 'Set DS-1 Gi1/0/1 port to trunk mode.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', targetDeviceId: 'ds-1', commandPattern: 'switchport mode trunk' },
    completed: false
  },
  {
    id: 'master-l3-routing',
    title: { tr: 'L3 Yönlendirme', en: 'L3 Routing' },
    description: { tr: 'DS-1 üzerinde IP yönlendirmeyi etkinleştirin.', en: 'Enable IP routing on DS-1.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', targetDeviceId: 'ds-1', commandPattern: 'ip routing' },
    completed: false
  },
  {
    id: 'master-svi-vlan10',
    title: { tr: 'SVI Yapılandırması', en: 'SVI Configuration' },
    description: { tr: 'DS-1 interface VLAN 10\'a 192.168.10.1/24 IP atayın.', en: 'Assign 192.168.10.1/24 to interface VLAN 10 on DS-1.' },
    weight: 5,
    checkType: 'config',
    checkParams: { targetDeviceId: 'ds-1', configKey: 'ports.vlan10.ipAddress', configValue: '192.168.10.1' },
    completed: false
  },
  {
    id: 'master-routed-port',
    title: { tr: 'Routed Port', en: 'Routed Port' },
    description: { tr: 'DS-1 Gi1/0/2 portunu "no switchport" ile routed port yapın ve 10.0.0.1 IP atayın.', en: 'Make DS-1 Gi1/0/2 a routed port using "no switchport" and assign 10.0.0.1 IP.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', targetDeviceId: 'ds-1', commandPattern: 'no switchport' },
    completed: false
  },
  {
    id: 'master-r1-ip',
    title: { tr: 'Router IP Ataması', en: 'Router IP Assignment' },
    description: { tr: 'R-1 Gi0/0 arayüzüne 10.0.0.2/30 IP adresini atayın.', en: 'Assign 10.0.0.2/30 to R-1 Gi0/0 interface.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'router', targetDeviceId: 'r-1', commandPattern: 'ip address 10.0.0.2 255.255.255.252' },
    completed: false
  },
  {
    id: 'master-r1-dhcp',
    title: { tr: 'Router DHCP Havuzu', en: 'Router DHCP Pool' },
    description: { tr: 'R-1 üzerinde "IOT-POOL" isminde 192.168.100.0/24 ağını dağıtan bir havuz oluşturun.', en: 'Create a DHCP pool named "IOT-POOL" on R-1 distributing 192.168.100.0/24.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'router', targetDeviceId: 'r-1', commandPattern: 'ip dhcp pool IOT-POOL' },
    completed: false
  },
  {
    id: 'master-wifi-ssid',
    title: { tr: 'WiFi SSID Ayarı', en: 'WiFi SSID Config' },
    description: { tr: 'R-1 üzerinde MasterWiFi isminde kablosuz ağ oluşturun.', en: 'Create a wireless network named MasterWiFi on R-1.' },
    weight: 5,
    checkType: 'config',
    checkParams: { targetDeviceId: 'r-1', configKey: 'ports.wlan0.wifi.ssid', configValue: 'MasterWiFi' },
    completed: false
  },
  {
    id: 'master-iot-wifi',
    title: { tr: 'IoT WiFi Bağlantısı', en: 'IoT WiFi Connection' },
    description: { tr: 'IoT-1 cihazını MasterWiFi ağına bağlayın.', en: 'Connect IoT-1 device to MasterWiFi network.' },
    weight: 5,
    checkType: 'config',
    checkParams: { configKey: 'iot.iot-1.ssid', configValue: 'MasterWiFi' },
    completed: false
  },
  {
    id: 'master-static-route',
    title: { tr: 'Varsayılan Rota', en: 'Default Route' },
    description: { tr: 'DS-1 üzerinde tüm trafik için R-1\'i (10.0.0.2) gateway olarak ayarlayın.', en: 'Configure R-1 (10.0.0.2) as the gateway for all traffic on DS-1.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'switch', targetDeviceId: 'ds-1', commandPattern: 'ip route 0.0.0.0 0.0.0.0 10.0.0.2' },
    completed: false
  },
  {
    id: 'master-acl-restrict',
    title: { tr: 'ACL Kısıtlaması', en: 'ACL Restriction' },
    description: { tr: 'R-1 üzerinde 192.168.10.10 hostunun dışarı çıkmasını engelleyen ACL yazın.', en: 'Create an ACL on R-1 to block host 192.168.10.10 from going outside.' },
    weight: 5,
    checkType: 'command',
    checkParams: { deviceType: 'router', targetDeviceId: 'r-1', commandPattern: 'access-list 1 deny 192.168.10.10' },
    completed: false
  },
  {
    id: 'master-fw-ip',
    title: { tr: 'Firewall IP Yapılandırması', en: 'Firewall IP Config' },
    description: { tr: 'Firewall-1 cihazına 10.0.0.10 IP adresini atayın.', en: 'Assign IP 10.0.0.10 to Firewall-1.' },
    weight: 5,
    checkType: 'config',
    checkParams: { configKey: 'firewall.fw-1.ip', configValue: '10.0.0.10' },
    completed: false
  },
  {
    id: 'master-dns-enable',
    title: { tr: 'DNS Servisi', en: 'DNS Service' },
    description: { tr: 'Server-1 üzerinde DNS servisini etkinleştirin.', en: 'Enable DNS service on Server-1.' },
    weight: 5,
    checkType: 'config',
    checkParams: { targetDeviceId: 'server-1', configKey: 'services.dns.enabled', configValue: true },
    completed: false
  }
];
