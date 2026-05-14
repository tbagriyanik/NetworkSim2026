# Network Simulator 2026

A modern browser-based network simulator for learning switching, routing, wireless, IoT, and CLI workflows.

![Version](https://img.shields.io/badge/version-1.6.3-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016.2%20|%20React%2019%20|%20TypeScript%205.9%20|%20Tailwind%204-green)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Total Lines](https://img.shields.io/badge/total--lines-91694-lightgrey)

Live app: [network2026.vercel.app](https://network2026.vercel.app)

---

## English

### Core Features

- **Interactive Topology Canvas**: PCs, IoT devices, L2/L3 Switches, and Routers.
- **Realistic CLI/Console**: Command history, suggestion lists, help output, and Geist Mono terminal font.
- **Advanced Switching**: VLAN, Trunking, Native VLAN, VTP, EtherChannel, STP/PVST, and Port Security.
- **Robust Routing**: IPv4/IPv6 Static routing, L3 Switching, RIP, OSPF patterns, RIPng, OSPFv3, and `show ip route` analysis.
- **Wireless & IoT**: WiFi AP/Client modes, web-based WiFi management, IoT control panels, and sensor simulation.
- **Guided Lesson Mode**: Step-by-step tasks with automatic completion detection and progress tracking.
- **Modern UI/UX**: Keyboard shortcuts, glassmorphism effects, shimmer loading, and accessible design.

### Recent Updates (v1.6.3)

- **Glass Effect & UI Consistency (May 14, 2026)**:
  - All floating window panels standardized to `liquid-glass-strong` CSS class for consistent glassmorphism alpha values.
  - Unified header styling across PacketPopup, PingPacketInfoPanel, and DeviceInfoPopovers (same padding, close button, title style).
  - Tooltip border-radius reduced from `rounded-full` (pill) to `rounded-lg` for better multi-line content display.
  - Packet content tables (L2/L3/L4) now have `backdropFilter` blur glass effect.
  - PacketPopup (simple info popup) also uses glass effect with `isDark` support.

- **Floating Panel Behavior Improvements**:
  - Network refresh now automatically closes all floating panels (PacketPopup, PingPacketInfoPanel, info popovers).
  - Custom `network-refresh` DOM event dispatched on refresh for cross-component panel closing.
  - Context menu refresh uses `onRefreshNetwork` prop instead of dispatching F5 keyboard event.
  - Play/Next Hop buttons now close the PacketPopup (simple packet info popup).

- **WiFi Connected Count Fix**:
  - Fixed double-counting bug where AP devices showed 2× the actual connected client count.
  - Added password and BSSID validation to tooltip connected device count for accuracy.

- **Router Panel Close Button Fix**:
  - Removed duplicate close button in RouterPanel dialog by setting `showCloseButton={false}`.

- **IPv6 Ping Diagnostics & Pathfinding (May 13, 2026)**:
  - Fixed IPv6 routing logic to correctly respect the `ipv6 unicast-routing` state.
  - Resolved source IP ambiguity in multi-stack environments for IPv6 connectivity checks.
  - Standardized PC terminal ping output to match Windows "Request timed out" behavior for IPv6 failures.
  - Standardized IPv6 address representation to lowercase across all diagnostic outputs.

- **Infrastructure & Documentation Audit**:
  - Synchronized project metrics across all documentation files.
  - Audited `examples.md` to ensure all 39 lab scenarios are accurately described.
  - Updated example projects metadata to support continued growth.

- **Firewall & IoT Persistence Update (May 9, 2026)**:
  - Firewall rules are now persisted when re-selecting devices.
  - Firewall rules are synchronized into device runtime state (`deviceStates`).
  - Firewall rules are included in generated `running-config` output.
  - `show access-lists` now displays firewall ACL-style rules (`OUTSIDE-IN`) when present.

- **IPv6 Routing Protocols (RIPng & OSPFv3)**:
  - Added support for **RIPng** and **OSPFv3** with multi-area capability.
  - Implemented **IPv6 Static Routing** with prefix/length notation.
  - New show commands: `show ipv6 route` and `show ipv6 interface brief`.

- **Bug Fixes & Stability Improvements (May 8, 2026)**:
  - Fixed React hooks immutability errors (`latestDevicesRef`, ref synchronization)
  - Fixed `useTheme`, `isTR`, `rulesHtml` errors
  - Added `firewall` device type and IoT device `rules` system
  - All builds, lint, and TypeScript checks now passing ✅

- **UI/UX Performance Phase 1 & 2**: Zustand Selectors, Spatial Partitioning, Viewport Culling, CSS Animations, Code Splitting, Virtual Device Lists.
- **CLI & Topology Synchronization**: Full startup/running-config management, live config panel, hostname propagation, cross-tab sync.
- **Standardized Port Density**: Industry-standard port layouts for C2960, C3650, and ISR 4451.
- **37 Example Projects** (now 39), **3 Guided Lessons**, **180+ CLI command families**.
- **Ping Packet Tracking & Visualization**: Real-time animation overlay, hop-by-hop packet info panel, ESC/mobile back support.

### Statistics

| Metric | Value |
| --- | ---: |
| Application Code | 91,694 |
| Example Projects | 39 |
| Documentation | 150+ |
| **Total Lines** | **91,694** |
| Source Files | 256 |
| Ready Topologies | 39 |
| Guided Lessons | 3 |
| CLI Command Families | 180+ |

---

## Türkçe

### Temel Özellikler

- **Etkileşimli Topoloji Tuvali**: PC, IoT, L2/L3 Switch ve Router cihazları.
- **Gerçekçi CLI/Console**: Komut geçmişi, öneri listesi, yardım çıktısı ve Geist Mono terminal fontu.
- **Gelişmiş Switching**: VLAN, Trunking, Native VLAN, VTP, EtherChannel, STP/PVST ve Port Security.
- **Kapsamlı Routing**: IPv4/IPv6 Statik yönlendirme, L3 Switch yönlendirme, RIP, OSPF, RIPng, OSPFv3 ve `show ip route` çıktıları.
- **Wireless ve IoT**: WiFi AP/Client modları, web tabanlı WiFi yönetimi, IoT paneli ve sensör simülasyonu.
- **Rehberli Ders Modu**: Otomatik tamamlama algılama ve ilerleme takibi ile adım adım görevler.
- **Modern UI/UX**: Klavye kısayolları, glassmorphism efektleri, shimmer loading ve erişilebilir tasarım.

### Son Güncellemeler (v1.6.3)

- **Glass Effect ve UI Tutarlılığı (14 Mayıs 2026)**:
  - Tüm pencere panelleri `liquid-glass-strong` CSS sınıfına standardize edildi.
  - PacketPopup, PingPacketInfoPanel ve DeviceInfoPopovers başlık stilleri birleştirildi.
  - Tooltip border-radius 'rounded-full' → 'rounded-lg' olarak düşürüldü.
  - Paket içeriği tablolarına (L2/L3/L4) blur glass efekti eklendi.
  - PacketPopup bileşenine glass efekt ve koyu/aydınlık tema desteği eklendi.

- **Panel Davranış İyileştirmeleri**:
  - Ağ yenilendiğinde tüm açık paneller otomatik kapanıyor (PacketPopup, PingPacketInfoPanel, info popoverlar).
  - Oynat/Sonraki Hop butonları PacketPopup'u kapatıyor.
  - RouterPanel'deki çift kapat butonu düzeltildi.

- **WiFi Bağlı Sayısı Düzeltmesi**:
  - AP cihazlarda bağlı istemci sayısının 2× gösterilmesi hatası giderildi.
  - Araç ipucunda şifre ve BSSID doğrulaması eklendi.

- **IPv6 Ping Teşhis ve Yönlendirme (13 Mayıs 2026)**:
  - `ipv6 unicast-routing` durumuna saygı gösteren yönlendirme mantığı.
  - Çoklu-stack ortamlarda kaynak IP çözümleme düzeltmesi.
  - IPv6 ping çıktısı Windows formatına standardize edildi.

- **Firewall ve IoT Kalıcılık (9 Mayıs 2026)**:
  - Firewall kuralları cihaz yeniden seçildiğinde korunur.
  - Kurallar `deviceStates`, `running-config` ve `show access-lists` ile görünür.

- **IPv6 Yönlendirme Protokolleri**: RIPng, OSPFv3, IPv6 Statik Rotalar.
- **Hata Düzeltmeleri**: React hooks, theme, scope ve IoT hataları giderildi.
- **UI/UX Performans Faz 1 & 2**: Zustand, Spatial Partitioning, CSS Animasyonları, Code Splitting.
- **CLI-Topoloji Senkronizasyonu**: Config yönetimi, hostname yayılımı.
- **39 Örnek Proje**, **3 Rehberli Ders**, **180+ CLI komut ailesi**.

### İstatistikler

| Metrik | Değer |
| --- | ---: |
| Uygulama Kodu | 91,694 |
| Örnek Proje | 39 |
| Dokümantasyon | 150+ |
| **Toplam Satır** | **91,694** |
| Kaynak Dosya | 256 |
| Hazır Topoloji | 39 |
| Rehberli Ders | 3 |
| CLI Komut Ailesi | 180+ |

---

## Quick Start / Hızlı Başlangıç

```bash
npm install
npm run dev
```

## Documentation / Belgeler

- **Detailed Description / Ayrıntılı Açıklama**: [detay.md](detay.md)
- **Examples / Örnekler**: [examples.md](examples.md)
- **CLI Commands / CLI Komutları**: [doc/CLI_COMMANDS.md](doc/CLI_COMMANDS.md)
- **Installation / Kurulum**: [INSTALL.md](INSTALL.md)
- **Google Sheets Kurulum**: [doc/GOOGLE_SHEETS_SETUP.md](doc/GOOGLE_SHEETS_SETUP.md)

## Tech Stack / Teknoloji

- Next.js 16.2, React 19, TypeScript 5.9, Tailwind CSS 4, Radix UI

## License / Lisans

Free and open source. See [LICENSE](LICENSE).
