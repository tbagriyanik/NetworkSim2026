# Network Simulator 2026 - Detaylar

Bu dosya README'den çıkarılan uzun açıklamaları ve ayrıntılı proje notlarını tutar. README artık hızlı durum özeti, son değişiklikler ve güncel sayılar için kısa tutulur.

## Özellik Detayları

### Etkileşimli Topoloji

- Sürükle-bırak ile PC, IoT, L2 switch, L3 switch, router ve firewall ekleme.
- Zoom, pan, çoklu seçim, lastik kutu seçimi ve bağlam menüsü.
- Straight-through, crossover ve console kablo desteği.
- Port durumları, kablo uyumluluğu, STP bloklama rengi ve bağlantı animasyonları.
- Cihaz taşınırken port tıklama ve tooltip davranışı askıya alınır; drop sonrası otomatik döner.
- Pencere konumları otomatik kaydedilir; refresh sonrası geri yüklenir.

### CLI, CMD ve Console

- Switch/router CLI terminali, PC CMD ve PC üzerinden console bağlantısı.
- Komut geçmişi, autocomplete, yardım çıktısı ve anlık `?` desteği.
- Terminal girişleri, çıktı alanları ve öneri listeleri Geist Mono ile görüntülenir.
- Desteklenen komut aileleri: VLAN, trunk, VTP, STP, EtherChannel, port security, DHCP, DNS, HTTP, static routing, RIP, OSPF, EIGRP, HSRP, NAT, ACL, firewall, SSH, Telnet, ping ve show komutları (180+ komut).
- Hata mesajları gerçek IOS stilinde görüntülenir.

### Switching (Layer 2)

- VLAN oluşturma, adlandırma, access/trunk port atama (1-4094).
- Native VLAN ve allowed VLAN davranışı.
- VTP server/client/transparent senaryoları, domain ve password.
- EtherChannel/LACP (active/passive/on) yapılandırmaları, port-channel interface.
- STP, PVST+, Rapid-PVST ve MST görselleştirmesi:
  - Root/designated/alternate rol takibi.
  - VLAN bazlı STP yol hesaplama ve prioriteler.
  - Link kesilince yedek yolun devreye girmesi.
  - PortFast, BPDU guard, UplinkFast, BackboneFast.
- MAC adres tablosu (dinamik/statik, aging, temizleme).
- Port security (sticky MAC, violation protect/restrict/shutdown, aging).
- Voice VLAN, storm-control, SPAN/RSPAN port mirroring.
- UDLD aggressive/normal mode, errdisable recovery.
- DHCP snooping, DAI (Dynamic ARP Inspection), IP Source Guard.
- MLS QoS, CoS değerleri, trust cos/dscp.
- CDP komşu keşfi.
- L2 switch model: WS-C2960-24TT-L (24 FE + 2 GE).
- L3 switch model: WS-C3650-24PS (24 GE + 4 GE + WLAN).

### Routing (Layer 3)

- IPv4 ve IPv6 static routing (prefix/length desteği, administrative distance).
- Router ve L3 switch üzerinde route doğrulama.
- Inter-VLAN routing: Router-on-a-Stick (802.1Q subinterface), Legacy routing, L3 switch SVI.
- RIP (v1/v2) dynamic routing, network advertisement, no auto-summary.
- OSPF multi-area (backbone area 0, stub, route summarization).
- OSPFv3 (IPv6) per-interface enable.
- EIGRP (AS numarası, network, no auto-summary).
- RIPng (IPv6).
- HSRP redundancy (active/standby, priority, preempt).
- `show ip route` ve `show ipv6 route` çıktılarında protokol bazlı ayrım.
- Ping animasyonu IPv4/IPv6 route ve VLAN/STP durumunu dikkate alır.
- L3 switch'te `ip routing`, `no switchport` ve `sdm prefer` yapılandırması.

### NAT (Network Address Translation)

- Static NAT (one-to-one IP mapping).
- Dynamic NAT (pool-based).
- PAT / NAT Overload (interface overload).
- Inside/Outside interface ataması.
- `show ip nat translations` ve `show ip nat statistics` doğrulama.

### Access Control ve Firewall

- Standard ACL (1-99) ve Extended ACL (100-199, named).
- ACL interface'de `ip access-group` ile uygulama (in/out).
- Firewall cihaz tipi: özel panel, sürükle-bırak kural yönetimi.
- Firewall kuralları (allow/deny, protocol, port, IP).
- Firewall kuralları `running-config` ve `show access-lists` ile görünür.
- Kural kalıcılığı (cihaz yeniden seçilince korunur).

### IP Servisler

- DHCP server: pool yönetimi, default router, DNS, lease, domain, excluded addresses.
- DHCP client: `ipconfig /renew`, otomatik lease, DHCP discovery/offer flow.
- DHCP relay: `ip helper-address` ile broadcast forwarding.
- DNS server: `ip dns server`, `ip host` domain/IP kaydı.
- DNS client: `nslookup`, `ip name-server`, domain lookup.
- HTTP server: router üzerinde web panel, yapılandırılabilir içerik.
- NTP, SNMP, Syslog, SSH, Telnet.
- Banner MOTD/login/exec, enable secret/password, username/privilege.

### Wireless ve IoT

- Router/switch WiFi AP ve PC/IoT client modu.
- SSID, güvenlik tipi (Open/WPA/WPA2/WPA3), PSK parola, kanal ayarı.
- Hidden SSID desteği, WLAN-ID/VLAN binding.
- WiFi sinyal gücü göstergesi, WLC show komutları.
- Router yönetim web paneli.
- IoT paneli:
  - Oturum tabanlı giriş.
  - Sensör tipleri: temperature, humidity, motion, light, sound.
  - Aktüatörler: heater, cooler, lamp.
  - Kural motoru: condition-action (if-then) otomasyonu.
  - Çevresel değişkenler (sıcaklık, nem, ışık %0-100).
  - Cihaz işbirliği (cross-device rule evaluation).
  - IoT cihazını topolojiye odaklama, IP yenileme ve bağlantı kesme.
  - Greenhouse akıllı tarım senaryosu (9 IoT cihaz).

### Ping ve Diagnostik

- Ping (ICMP) IPv4/IPv6, parametre: size, count.
- Ping animasyonu: gerçek zamanlı paket animasyonu, renk kodlu başarı/basarsızlık.
- Packet info paneli: hop-by-hop analiz, latency, route detayı.
- Traceroute/tracert.
- ARP: `arp`, `arp -a`, `clear arp-cache` (4 saat timeout).
- MAC tablosu: `show mac address-table`, `clear mac address-table`.
- 50+ show komutu (tüm protokol ve servisler için).
- Debug: `debug <type>`, `undebug all`.
- STP bloklama ve yedek yol görselleştirmesi.

### Örnek Projeler ve Rehberli Dersler

- **39 hazır topoloji örneği** (9 basic, 12 intermediate, 18 advanced):
  - Basic: passwords, VLAN, SSH, DHCP, firewall, MAC table, ARP, IP config, native VLAN.
  - Intermediate: VTP, ROAS, legacy routing, port-security, WiFi, IoT WiFi, greenhouse, DNS/HTTP, DHCP distribution, trunk, ACL standard, NAT static.
  - Advanced: L3 routing, static routing, EtherChannel, STP redundant, STP triangle, campus, PVST, L3 VLAN, static L3, RIP, ACL extended, NAT dynamic, NAT PAT, HSRP, OSPF multi-area, EIGRP, IPv6 advanced.
- **3 rehberli ders** (Basic Switch, Intermediate, Advanced):
  - Adım adım yönlendirme, otomatik tamamlanma kontrolleri.
  - Cihaz erişimi, komut kalıbı, kablo tipi, konfigürasyon durumu kontrolü.

### UI/UX ve Kullanıcı Deneyimi

- İnteraktif topoloji canvas: SVG tabanlı, drag-drop, pan/zoom, bağlam menüsü.
- Cihaz paleti: PC, IoT, L2 switch, L3 switch, router, firewall, kablo araçları.
- Cihaz konfigürasyon paneli (Port, VLAN, Security, Config sekmeleri).
- Terminal/CLI paneli (tam özellikli terminal emülatörü).
- PC paneli (services, CMD, WiFi, IoT).
- Router paneli, VLAN paneli, Security paneli, Firewall paneli.
- WiFi kontrol paneli, Environment paneli, Help paneli.
- Ping görselleştirme, Task paneli (puanlama).
- Rehberli ders paneli, başarı rozetleri.
- Sürüklenebilir dialog pencereleri, pencere pozisyonu koruma.
- Dual dil desteği (Türkçe/İngilizce), dark/light tema.
- Yüksek kontrast modu, erişilebilirlik (ARIA, klavye kısayolları).
- Mobil navigasyon, responsive tasarım.

### Performans ve Altyapı

- Spatial partitioning ve viewport culling (büyük topolojilerde optimizasyon).
- react-window ile sanal liste (büyük cihaz listeleri).
- Skeleton ekranlar, dinamik bileşen yükleme (next/dynamic).
- Zustand store (merkezi state yönetimi, persistence).
- Tab-specific storage (çoklu sekme izolasyonu).
- localStorage ile proje kaydetme/yükleme, pencere pozisyonları.
- Flash file system simülasyonu (running-config, startup-config).
- Autosave, proje export/import (JSON).
- Toast bildirimleri (success/error/warning/info/critical).
- API client (retry, exponential backoff, timeout).
- App Error Boundary (global hata yakalama).

## Proje Metrikleri (v1.6.3)

| Grup | Satır Sayısı |
| --- | ---: |
| Uygulama Kodu | 103,498 |
| Dokümantasyon | 13,290 |
| **Toplam** | **128,176** |

| Diğer Metrikler | Sayı |
| --- | ---: |
| Toplam kod dosyası | 261 |
| Hazır topoloji örneği | 39 |
| Rehberli ders | 3 |
| CLI komut ailesi | 180+ |
| Test Dosyaları | 0 |
| Başarılı Testler | N/A |
| Derleme | Temiz |
| Lint | Temiz |
| TypeScript | Hata yok |

Örneklerin ayrıntılı listesi için [examples.md](examples.md) dosyasına bakın.
Değişiklik günlüğü ve planlama için [planning.md](planning.md) dosyasına bakın.

## Yol Haritası

### Tamamlanan Ana Başlıklar

- Interaktif topoloji ve cihaz yönetimi (PC, IoT, L2/L3 switch, router, firewall).
- PC CMD, router/switch CLI ve console bağlantısı.
- VLAN, trunk, VTP, STP/PVST/Rapid-PVST/MST, EtherChannel/LACP.
- Port security, voice VLAN, storm-control, SPAN, UDLD, errdisable.
- DHCP snooping, DAI, IP Source Guard, MLS QoS.
- Static routing, RIP, OSPF (multi-area), EIGRP, HSRP.
- NAT (static/dynamic/PAT), ACL (standard/extended), Firewall.
- DHCP, DNS, HTTP, NTP, SNMP, SSH, Telnet servisleri.
- WiFi AP/client, IoT sensör/aktüatör ve kural motoru.
- 39 hazır örnek proje, 3 rehberli ders.
- IPv4/IPv6 routing, RIPng, OSPFv3.
- Ping animasyonu, traceroute, ARP, diagnostik.
- Dual dil (TR/EN), dark/light tema, erişilebilirlik.
- Pencere pozisyonu koruma, otomatik kaydetme.
- UI/UX performans optimizasyonları (Faz 1 & 2).
- CLI ve topoloji senkronizasyon düzeltmeleri.

### Kısa Vadeli Plan

- Paket yakalama/izleme ekranı.
- Rehberli ders sayısını artırma.
- Otomatik lab değerlendirme.
- IPv6 mobil ve DHCPv6 desteği (temel eklendi).

### Uzun Vadeli Plan

- Çok kullanıcılı lab paylaşımı.
- Gelişmiş QoS ve trafik şekillendirme.
- BGP ve IS-IS protokol desteği.
- Sertifika hazırlık senaryoları.

---

## Düzeltme Geçmişi (2026-05-14)

Tüm örneklerde port bağlantıları, CLI mantığı ve gerçek Cisco IOS/Packet Tracer uyumluluğu denetlendi. **Toplam 45+ düzeltme.**

### Port Hataları (9 düzeltme)

| # | Dosya | Hata | Düzeltme |
|---|-------|------|----------|
| 1 | `examples.md` | L3 Inter-VLAN: L3SW1 için `Fa0/1-4` | `Gi1/0/1-4` |
| 2 | `examples.md` | 2 L3 Switch VLAN: Switch2/4 için `Gi0/1` trunk | `Gi1/0/5` |
| 3 | `examples.md` | 2 L3 Switch VLAN: Switch2/4 access portları `Fa0/x` | `Gi1/0/x` |
| 4 | `examples.md` | Static L3 Routing: ML1/ML2 için `fa0/1-2` | `gi1/0/1-2` |
| 5 | `examples.md` | RIP Routing: ML0/ML1 için `Fa0/23-24` | `Gi1/0/23-24` |
| 6 | `examples.md` | ROAS: L2 switch'te `gi1/0/x`, fazla VLAN/PC | `fa0/x`, fazlalıklar kaldırıldı |
| 7 | `exampleProjects.ts` | L3 Routing notu: `Gi1/1/1-2` | `Gi1/0/3-4` |
| 8 | `exampleProjects.ts` | Static Routing notu: L2 switch/router'da `Gi1/0/x` | Doğru portlarla değiştirildi |
| 9 | `exampleProjects.ts` | RIP notu: L3 switch'te `Fa0/x` | `Gi1/0/x` |

### CLI Mantık Hataları (14 düzeltme)

| # | Dosya | Hata | Düzeltme |
|---|-------|------|----------|
| 1 | `exampleProjects.ts` | Campus Network: Router IP'leri notla uyuşmuyor (`192.168.1.1/2.1`) | `192.168.10.1/20.1`, static route'lar düzeltildi |
| 2 | `exampleProjects.ts` | Legacy Routing detay: VLAN/port mapping yanlış | `Gi0/0: VLAN 10(192.168.10.1)` → `Gi0/1: VLAN 10(192.168.0.1)` |
| 3 | `exampleProjects.ts` | Static L3 Routing notu: ML1 IP'leri ters | `gi1/0/1=192.168.1.1` ↔ `gi1/0/2=10.0.0.1` düzeltildi |
| 4 | `exampleProjects.ts` | Greenhouse: Geçersiz `security wpa psk set-key` | `set-key` kaldırıldı |
| 5 | `exampleProjects.ts` | Campus: ACC-SW1/2 gi0/1 `mode: trunk` | `mode: access` |
| 6 | `exampleProjects.ts` | Router DHCP: SW1 gi0/1 `mode` eksik | `mode: 'access'` eklendi |
| 7 | `exampleProjects.ts` | Router SSH: PC→Router `straight` kablo | `crossover` |
| 8 | `exampleProjects.ts` | Firewall Basic: PC→Firewall `straight` kablo | `crossover` |
| 9 | `exampleProjects.ts` | STP PVST: L3 switch'lerde `ip routing` eksik | State + runningConfig'e eklendi |
| 10 | `exampleProjects.ts` | STP Triangle: Switch'ler arası `access` modu | `trunk` |
| 11 | `exampleProjects.ts` | Interface range spacing `gi1/0/1 - 2` | `gi1/0/1-2` |
| 12 | `examples.md` | Static L3 Routing: ML1 IP'leri ters (doküman) | `gi1/0/1=10.0.0.1`, `gi1/0/2=192.168.1.1` |

### Gerçek IOS/Packet Tracer Uyumsuzlukları (22+ düzeltme)

| # | Dosya | Hata | Düzeltme |
|---|-------|------|----------|
| 1 | `initialState.ts` | Router switchModel `WS-C3650-24PS` | `ISR4451-X` |
| 2 | `initialState.ts` | ASA port sayısı 2 (gerçekte 8+1) | 8 GE (`gi1/0/0-7`) + MGMT (`mgmt1/1`) |
| 3 | `initialState.ts` | ASA portları varsayılan `shutdown: false` | `shutdown: true` (MGMT hariç) |
| 4 | `initialState.ts` | ASA hostname `asa 5506-x` | `ciscoasa` |
| 5 | `globalConfigCommands.ts` | `no vlan 1` silinebiliyor | `% Cannot remove VLAN 1.` hatası |
| 6 | `interfaceCommands.ts` | `switchport trunk allowed vlan add/remove` parse edilmiyor | `add/remove/except/all` desteği eklendi |
| 7 | `parser.ts` | `ping` sadece privileged modda | `user` modu da eklendi |
| 8 | `parser.ts` | `ip default-gateway` interface modunda | Sadece `config` modu |
| 9 | `parser.ts` | `abort` interface/line/vlan modlarında | Sadece `config` modu |
| 10 | `parser.ts` | `line vty 0` (tek port) kabul edilmiyor | Artık kabul edilir |
| 11 | `parser.ts` | `exec-timeout` saniye zorunlu | Saniye opsiyonel yapıldı |
| 12 | `parser.ts` | `no ip domain-lookup` boşluklu kabul | Sadece hyphen formu |
| 13 | `parser.ts` | `spanning-tree vlan priority` regex'te `priorty` typo | Kaldırıldı |
| 14 | `parser.ts` | `errdisable recovery cause` her string kabul | Sadece geçerli cause'lar |
| 15 | `globalConfigCommands.ts` | `spanning-tree priority` değersiz kabul | Hata döndürür |
| 16 | `globalConfigCommands.ts` | `no enable secret` boş string atar | `delete` ile tamamen kaldırılır |
| 17 | `globalConfigCommands.ts` | `ip ssh authentication-retries` range yok | 0-5 arası validasyon |
| 18 | `showCommands.ts` | `show running-config` byte count sabit 1024 | Gerçek config boyutu hesaplanır |
| 19 | `showCommands.ts` | `formatMacAddressSimple` uppercase | lowercase (IOS formatı) |
| 20 | `showCommands.ts` | Boot mesajlarında trademarked IOS isimleri | Generic isimler |
| 21 | `executor.ts` | Boot mesajlarında trademarked IOS isimleri | Generic isimler |
| 22 | `executor.ts` | `vtp password` help tree'de eksik | Eklendi |
| 23 | `interfaceCommands.ts` | `cdp enable` global `cdp run` kontrolü yok | Eklendi |
| 24 | `interfaceCommands.ts` | `expandInterfaceRange` VLAN desteklemiyor | `vlan10-20` aralığı eklendi |
| 25 | `interfaceCommands.ts` | Stub komutlar sessiz `{success: true}` | `% command configured` çıktısı |
| 26 | `privilegedCommands.ts` | `reload` anında, onaysız | `Proceed with reload? [confirm]` |
| 27 | `lineCommands.ts` | `privilege level` hata mesajı `{0\|1\|15}` | `{0-15}` |
| 28 | `showCommands.ts` | `show version` uptime sabit string | `bootTime` timestamp ile dinamik hesaplama |
| 29 | `systemCommands.ts` | `do` hata mesajı `% Unknown command` | `% Invalid input detected at '^' marker.` |
| 30 | `types.ts` | `bootTime` alanı eksik | Eklendi |
| 31 | `initialState.ts` | `bootTime` tüm create*State fonksiyonlarına eklendi | `Date.now()` |

### Kapsam Dışı Bırakılanlar (mimari değişiklik gerektirir)

- ASA CLI'sini IOS'tan ayırma (tamamen farklı komut seti)
- Routing simülasyonunda routing tablosu kontrolü (BFS yerine)
- `help` komut açıklamaları (tüm komut ağacına description eklenmeli)
- `show interfaces` Hardware formatı (`FastEthernet0/1` vs `Fa0/1`)
- VLAN naming (`VLAN0010` vs `VLAN10` — mevcut hali IOS ile uyumlu)
