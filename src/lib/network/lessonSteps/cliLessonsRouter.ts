import type { GuidedStep } from '../guidedMode.types';

export const cliLessonsRouter: GuidedStep[] = [
  // ===== TÜM ROUTER İŞLEMLERİ (54-85) =====
  // Bölüm 8: Yönlendirme (Router)
  {
    id: 'cli-lesson-5-1',
    order: 54,
    sectionTitle: { tr: 'Bölüm 8: Yönlendirme (Router)', en: 'Section 8: Routing (Router)' },
    title: { tr: 'Statik Yönlendirme', en: 'Static Routing' },
    description: { tr: 'Statik rota ekleyin', en: 'Add static route' },
    hint: { tr: 'R-Lab: ip route 192.168.2.0 255.255.255.0 192.168.1.2 yazın', en: 'R-Lab: Type ip route 192.168.2.0 255.255.255.0 192.168.1.2' },
    checkType: 'command',
    checkParams: { commandPattern: 'ip route' },
    completed: false,
    points: 15
  },
  {
    id: 'cli-lesson-5-2a',
    order: 55,
    title: { tr: 'RIP Başlat', en: 'Start RIP' },
    description: { tr: 'RIP yönlendirme protokolünü başlatın', en: 'Start RIP routing protocol' },
    hint: { tr: 'R-Lab: router rip yazın', en: 'R-Lab: Type router rip' },
    checkType: 'command',
    checkParams: { commandPattern: 'router rip' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-5-2b',
    order: 56,
    title: { tr: 'Ağ Ekle', en: 'Add Network' },
    description: { tr: 'RIP\'e ağ adresini ekleyin', en: 'Add network address to RIP' },
    hint: { tr: 'R-Lab: network 192.168.1.0 yazın', en: 'R-Lab: Type network 192.168.1.0' },
    checkType: 'command',
    checkParams: { commandPattern: 'network 192.168.1.0' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-5-3a',
    order: 57,
    title: { tr: 'OSPF Başlat', en: 'Start OSPF' },
    description: { tr: 'OSPF yönlendirme protokolünü başlatın', en: 'Start OSPF routing protocol' },
    hint: { tr: 'R-Lab: router ospf 1 yazın', en: 'R-Lab: Type router ospf 1' },
    checkType: 'command',
    checkParams: { commandPattern: 'router ospf' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-5-3b',
    order: 58,
    title: { tr: 'Router ID', en: 'Router ID' },
    description: { tr: 'OSPF Router ID\'yi ayarlayın', en: 'Set OSPF router ID' },
    hint: { tr: 'R-Lab: router-id 1.1.1.1 yazın', en: 'R-Lab: Type router-id 1.1.1.1' },
    checkType: 'command',
    checkParams: { commandPattern: 'router-id' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-5-4a',
    order: 59,
    title: { tr: 'Protokolleri Göster', en: 'Show Protocols' },
    description: { tr: 'show ip protocols komutunu kullanın', en: 'Use show ip protocols command' },
    hint: { tr: 'R-Lab: show ip protocols yazın', en: 'R-Lab: Type show ip protocols' },
    checkType: 'command',
    checkParams: { commandPattern: 'show ip protocols' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-5-4b',
    order: 60,
    title: { tr: 'OSPF Komşuları Göster', en: 'Show OSPF Neighbors' },
    description: { tr: 'OSPF komşularını görüntüleyin', en: 'Display OSPF neighbors' },
    hint: { tr: 'R-Lab: show ip ospf neighbor yazın', en: 'R-Lab: Type show ip ospf neighbor' },
    checkType: 'command',
    checkParams: { commandPattern: 'show ip ospf neighbor' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-5-4c',
    order: 61,
    title: { tr: 'Traceroute', en: 'Traceroute' },
    description: { tr: 'traceroute komutu ile ağ yolunu izleyin', en: 'Use traceroute to trace network path' },
    hint: { tr: 'R-Lab: traceroute 192.168.2.1 yazın', en: 'R-Lab: Type traceroute 192.168.2.1' },
    checkType: 'command',
    checkParams: { commandPattern: 'traceroute' },
    completed: false,
    points: 10
  },
  // Bölüm 9: Güvenlik (Router)
  {
    id: 'cli-lesson-6-2a',
    order: 62,
    sectionTitle: { tr: 'Bölüm 9: Güvenlik (Router)', en: 'Section 9: Security (Router)' },
    title: { tr: 'RSA Anahtarı', en: 'RSA Key' },
    description: { tr: 'RSA anahtarı oluşturun', en: 'Generate RSA key' },
    hint: { tr: 'R-Lab: crypto key generate rsa yazın', en: 'R-Lab: Type crypto key generate rsa' },
    checkType: 'command',
    checkParams: { commandPattern: 'crypto key generate rsa' },
    completed: false,
    points: 15
  },
  {
    id: 'cli-lesson-6-2b',
    order: 63,
    title: { tr: 'SSH Versiyonu', en: 'SSH Version' },
    description: { tr: 'SSH versiyon 2\'yi ayarlayın', en: 'Set SSH version 2' },
    hint: { tr: 'R-Lab: ip ssh version 2 yazın', en: 'R-Lab: Type ip ssh version 2' },
    checkType: 'command',
    checkParams: { commandPattern: 'ip ssh version 2' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-6-3',
    order: 64,
    title: { tr: 'Kullanıcı Yönetimi', en: 'User Management' },
    description: { tr: 'Yerel kullanıcı oluşturun', en: 'Create local user' },
    hint: { tr: 'R-Lab: username admin privilege 15 secret password yazın', en: 'R-Lab: Type username admin privilege 15 secret password' },
    checkType: 'command',
    checkParams: { commandPattern: 'username' },
    completed: false,
    points: 15
  },
  // Bölüm 10: Kablosuz (Router)
  {
    id: 'cli-lesson-7-1',
    order: 65,
    sectionTitle: { tr: 'Bölüm 10: Kablosuz (Router)', en: 'Section 10: Wireless (Router)' },
    title: { tr: 'WLAN Oluştur', en: 'Create WLAN' },
    description: { tr: 'Kablosuz ağ oluşturun', en: 'Create a wireless network' },
    hint: { tr: 'R-Lab: wlan MyNetwork 1 MySSID yazın', en: 'R-Lab: Type wlan MyNetwork 1 MySSID' },
    checkType: 'command',
    checkParams: { commandPattern: 'wlan' },
    completed: false,
    points: 15
  },
  {
    id: 'cli-lesson-7-2a',
    order: 66,
    title: { tr: 'Station Role', en: 'Station Role' },
    description: { tr: 'Access Point rolünü ayarlayın', en: 'Set access point role' },
    hint: { tr: 'R-Lab: station-role root yazın', en: 'R-Lab: Type station-role root' },
    checkType: 'command',
    checkParams: { commandPattern: 'station-role' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-7-2b',
    order: 67,
    title: { tr: 'SSID Ayarla', en: 'Set SSID' },
    description: { tr: 'Kablosuz ağ SSID\'sini ayarlayın', en: 'Set wireless network SSID' },
    hint: { tr: 'R-Lab: ssid MySSID yazın', en: 'R-Lab: Type ssid MySSID' },
    checkType: 'command',
    checkParams: { commandPattern: 'ssid' },
    completed: false,
    points: 10
  },
  // Bölüm 11: Hata Ayıklama (Router)
  {
    id: 'cli-lesson-8-1a',
    order: 68,
    sectionTitle: { tr: 'Bölüm 11: Hata Ayıklama (Router)', en: 'Section 11: Debugging (Router)' },
    title: { tr: 'Debug Başlat', en: 'Start Debug' },
    description: { tr: 'Debug komutunu kullanın', en: 'Use debug command' },
    hint: { tr: 'R-Lab: debug ip packet yazın', en: 'R-Lab: Type debug ip packet' },
    checkType: 'command',
    checkParams: { commandPattern: 'debug ip packet' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-8-1b',
    order: 69,
    title: { tr: 'Debug Kapat', en: 'Stop Debug' },
    description: { tr: 'Undebug komutunu kullanın', en: 'Use undebug command' },
    hint: { tr: 'R-Lab: undebug all yazın', en: 'R-Lab: Type undebug all' },
    checkType: 'command',
    checkParams: { commandPattern: 'undebug all' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-8-2b',
    order: 70,
    title: { tr: 'Rotaları Göster', en: 'Show Routes' },
    description: { tr: 'show ip route komutunu kullanın', en: 'Use show ip route command' },
    hint: { tr: 'R-Lab: show ip route yazın', en: 'R-Lab: Type show ip route' },
    checkType: 'command',
    checkParams: { commandPattern: 'show ip route' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-8-2f',
    order: 71,
    title: { tr: 'IP Arayüz Özeti', en: 'Show IP Interface Brief' },
    description: { tr: 'show ip interface brief komutunu kullanın', en: 'Use show ip interface brief command' },
    hint: { tr: 'R-Lab: show ip interface brief yazın', en: 'R-Lab: Type show ip interface brief' },
    checkType: 'command',
    checkParams: { commandPattern: 'show ip interface brief' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-8-2g',
    order: 72,
    title: { tr: 'ARP Tablosu Göster', en: 'Show ARP Table' },
    description: { tr: 'show ip arp komutunu kullanın', en: 'Use show ip arp command' },
    hint: { tr: 'R-Lab: show ip arp yazın', en: 'R-Lab: Type show ip arp' },
    checkType: 'command',
    checkParams: { commandPattern: 'show ip arp' },
    completed: false,
    points: 10
  },
  // Bölüm 12: İleri Router Konuları
  {
    id: 'cli-lesson-9-1a',
    order: 73,
    sectionTitle: { tr: 'Bölüm 12: İleri Router Konuları', en: 'Section 12: Advanced Router Topics' },
    title: { tr: 'DHCP Havuzu Oluştur', en: 'Create DHCP Pool' },
    description: { tr: 'DHCP havuzu oluşturun', en: 'Create a DHCP pool' },
    hint: { tr: 'R-Lab: ip dhcp pool LAN yazın', en: 'R-Lab: Type ip dhcp pool LAN' },
    checkType: 'command',
    checkParams: { commandPattern: 'ip dhcp pool LAN' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-1b',
    order: 74,
    title: { tr: 'DHCP Ağı', en: 'DHCP Network' },
    description: { tr: 'DHCP havuzu için ağ tanımlayın', en: 'Define network for DHCP pool' },
    hint: { tr: 'R-Lab: network 192.168.1.0 255.255.255.0 yazın', en: 'R-Lab: Type network 192.168.1.0 255.255.255.0' },
    checkType: 'command',
    checkParams: { commandPattern: 'network 192.168.1.0' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-1c',
    order: 75,
    title: { tr: 'DHCP Varsayılan Ağ Geçidi', en: 'DHCP Default Gateway' },
    description: { tr: 'DHCP havuzu için varsayılan ağ geçidini ayarlayın', en: 'Set default gateway for DHCP pool' },
    hint: { tr: 'R-Lab: default-router 192.168.1.1 yazın', en: 'R-Lab: Type default-router 192.168.1.1' },
    checkType: 'command',
    checkParams: { commandPattern: 'default-router 192.168.1.1' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-4a',
    order: 76,
    title: { tr: 'IPv6 Yönlendirme', en: 'IPv6 Routing' },
    description: { tr: 'IPv6 yönlendirmeyi etkinleştirin', en: 'Enable IPv6 routing' },
    hint: { tr: 'R-Lab: ipv6 unicast-routing yazın', en: 'R-Lab: Type ipv6 unicast-routing' },
    checkType: 'command',
    checkParams: { commandPattern: 'ipv6 unicast-routing' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-4b',
    order: 77,
    title: { tr: 'IPv6 Arayüz Adresi', en: 'IPv6 Interface Address' },
    description: { tr: 'Arayüze IPv6 adresi atayın', en: 'Assign IPv6 address to interface' },
    hint: { tr: 'R-Lab: ipv6 address 2001::1/64 yazın', en: 'R-Lab: Type ipv6 address 2001::1/64' },
    checkType: 'command',
    checkParams: { commandPattern: 'ipv6 address' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-6',
    order: 78,
    title: { tr: 'Komut Takma Adı', en: 'Command Alias' },
    description: { tr: 'Komut takma adı oluşturun', en: 'Create command alias' },
    hint: { tr: 'R-Lab: alias exec si show interfaces yazın', en: 'R-Lab: Type alias exec si show interfaces' },
    checkType: 'command',
    checkParams: { commandPattern: 'alias exec' },
    completed: false,
    points: 15
  },
  {
    id: 'cli-lesson-9-6b',
    order: 79,
    title: { tr: 'Show Alias', en: 'Show Alias' },
    description: { tr: 'Oluşturulan takma adları görüntüleyin', en: 'Display created aliases' },
    hint: { tr: 'R-Lab: show alias yazın', en: 'R-Lab: Type show alias' },
    checkType: 'command',
    checkParams: { commandPattern: 'show alias' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-7a',
    order: 80,
    title: { tr: 'ACL Reddet', en: 'ACL Deny' },
    description: { tr: 'Standart ACL ile bir hostu reddedin', en: 'Deny a host with standard ACL' },
    hint: { tr: 'R-Lab: access-list 1 deny host 192.168.1.10 yazın', en: 'R-Lab: Type access-list 1 deny host 192.168.1.10' },
    checkType: 'command',
    checkParams: { commandPattern: 'access-list 1 deny' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-7b',
    order: 81,
    title: { tr: 'ACL İzin Ver', en: 'ACL Permit' },
    description: { tr: 'ACL ile tüm trafiğe izin verin', en: 'Permit all traffic with ACL' },
    hint: { tr: 'R-Lab: access-list 1 permit any yazın', en: 'R-Lab: Type access-list 1 permit any' },
    checkType: 'command',
    checkParams: { commandPattern: 'access-list 1 permit' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-7c',
    order: 82,
    title: { tr: 'Arayüz Seçimi', en: 'Interface Selection' },
    description: { tr: 'GigabitEthernet 0/0 arayüzüne girin', en: 'Enter GigabitEthernet 0/0 interface' },
    hint: { tr: 'R-Lab: interface gi0/0 yazın', en: 'R-Lab: Type interface gi0/0' },
    checkType: 'command',
    checkParams: { commandPattern: 'interface gi0/0|int gi0/0|interface gigabitethernet 0/0|int gigabitethernet 0/0|interface gigabitethernet0/0|int gigabitethernet0/0|interface gi 0/0|int gi 0/0|interface g0/0|int g0/0' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-7d',
    order: 83,
    title: { tr: 'ACL Uygula', en: 'Apply ACL' },
    description: { tr: 'ACL\'yi arayüze uygulayın', en: 'Apply ACL to interface' },
    hint: { tr: 'R-Lab: ip access-group 1 out yazın', en: 'R-Lab: Type ip access-group 1 out' },
    checkType: 'command',
    checkParams: { commandPattern: 'ip access-group 1' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-8a',
    order: 84,
    title: { tr: 'Yapılandırmayı Kaydet', en: 'Save Config' },
    description: { tr: 'copy running-config startup-config komutunu kullanın', en: 'Use copy running-config startup-config command' },
    hint: { tr: 'R-Lab: copy running-config startup-config yazın', en: 'R-Lab: Type copy running-config startup-config' },
    checkType: 'command',
    checkParams: { commandPattern: 'copy running-config startup-config' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-9-8b',
    order: 85,
    title: { tr: 'Cihazı Yeniden Başlat', en: 'Reload Device' },
    description: { tr: 'reload komutu ile cihazı yeniden başlatın', en: 'Use reload command to restart the device' },
    hint: { tr: 'R-Lab: reload yazın', en: 'R-Lab: Type reload' },
    checkType: 'command',
    checkParams: { commandPattern: 'reload' },
    completed: false,
    points: 10
  },
  // Bölüm 13: AAA Kimlik Doğrulama
  {
    id: 'cli-lesson-10-1a',
    order: 86,
    sectionTitle: { tr: 'Bölüm 13: AAA Kimlik Doğrulama', en: 'Section 13: AAA Authentication' },
    title: { tr: 'AAA Etkinleştir', en: 'Enable AAA' },
    description: { tr: 'AAA yeni modelini etkinleştirin', en: 'Enable the AAA new model' },
    hint: { tr: 'R-Lab: aaa new-model yazın', en: 'R-Lab: Type aaa new-model' },
    checkType: 'command',
    checkParams: { commandPattern: 'aaa new-model' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-10-1b',
    order: 87,
    title: { tr: 'Yerel Kullanıcı Oluştur', en: 'Create Local User' },
    description: { tr: 'Yerel kimlik doğrulama için kullanıcı oluşturun', en: 'Create a user for local authentication' },
    hint: { tr: 'R-Lab: username admin privilege 15 secret password yazın', en: 'R-Lab: Type username admin privilege 15 secret password' },
    checkType: 'command',
    checkParams: { commandPattern: 'username admin' },
    completed: false,
    points: 10
  },
  {
    id: 'cli-lesson-10-1c',
    order: 88,
    title: { tr: 'AAA Login Listesi', en: 'AAA Login List' },
    description: { tr: 'Login için yerel kullanıcı veritabanını seçin', en: 'Use the local user database for login' },
    hint: { tr: 'R-Lab: aaa authentication login default local yazın', en: 'R-Lab: Type aaa authentication login default local' },
    checkType: 'command',
    checkParams: { commandPattern: 'aaa authentication login' },
    completed: false,
    points: 10
  }
];