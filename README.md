# Network Simulator 2026

A modern browser-based network simulator for learning switching, routing, wireless, IoT, and CLI workflows.

![Version](https://img.shields.io/badge/version-1.7.0-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016.2%20|%20React%2019%20|%20TypeScript%205.9%20|%20Tailwind%204-green)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Code Lines](https://img.shields.io/badge/code--lines-67587-blueviolet)
![Total Lines](https://img.shields.io/badge/total--lines-68920-lightgrey)

Live app: [network2026.vercel.app](https://network2026.vercel.app)

---

## English

### Core Features

- **Interactive Topology Canvas**: PCs, IoT devices, L2/L3 Switches, and Routers.
- **Realistic CLI/Console**: Command history, suggestion lists, help output, and Geist Mono terminal font.
- **Advanced Switching**: VLAN, Trunking, Native VLAN, VTP, EtherChannel, STP/PVST, and Port Security.
- **Robust Routing**: Static routing, L3 Switching, RIP, OSPF patterns, and `show ip route` analysis.
- **Wireless & IoT**: WiFi AP/Client modes, web-based WiFi management, IoT control panels, and sensor simulation.
- **Guided Lesson Mode**: Step-by-step tasks with automatic completion detection and progress tracking.
- **Modern UI/UX**: Keyboard shortcuts, glassmorphism effects, shimmer loading, and accessible design.

### Recent Updates (v1.7.0)

- **UI/UX Performance Phase 1 & 2**:
  - Implemented **Zustand Selectors** for granular state management and reduced re-renders.
  - Added **Spatial Partitioning** and **Viewport Culling** for smooth rendering of large topologies.
  - Replaced Framer Motion with optimized **CSS Animations**.
  - Integrated **Code Splitting** for faster initial loads (Terminal, Config Panel, etc.).
  - Added **Virtual Device Lists** using `react-window`.
- **CLI & Topology Synchronization**:
  - Full `startup-config` and `running-config` management via CLI (`write memory`, `erase`).
  - Live **Running Config Panel** showing real-time device state.
  - Automated **Hostname Propagation** between topology canvas and CLI prompt.
  - Cross-tab state synchronization (Topology, CLI, Tasks).
- **Standardized Port Density**: Industry-standard port layouts for C2960 (24eth+2gig), C3650 (24eth+4gig+1wlan), and ISR 4451 (4gig+1wlan).
- **Enhanced Documentation & Examples**:
  - Comprehensive **Documentation Index** with guides for CLI, error handling, and integration.
  - **28 Ready-to-Use Example Projects** with step-by-step instructions.
  - **Quick Reference Guide** for common tasks and commands.
  - **Implementation Complete** documentation with feature checklist.
- **Ping Packet Tracking & Visualization**:
  - Real-time **Ping Animation Overlay** showing packet flow on canvas.
  - **Packet Info Panel** with detailed hop-by-hop analysis.
  - Visual feedback for successful/failed pings with timing information.
  - **ESC key support** to close packet analysis panel.
  - **Mobile back button support** for seamless mobile navigation.
- **Improved Error Handling & Validation**:
  - **AppErrorBoundary** with graceful error recovery and user feedback.
  - **Form Validation** utilities for input sanitization and error messages.
  - **Notification Manager** for consistent toast and alert handling.
- **API Client & Contact Form**:
  - Robust **API Client** with retry logic and error handling.
  - Enhanced **Contact Form** with validation and submission tracking.
  - Support for feedback and issue reporting.

### Statistics

| Metric | Value |
| --- | ---: |
| Application Code | 67,587 |
| Example Code | 1,229 |
| Documentation | 104 |
| **Total Lines** | **68,920** |
| Source Files | 182 |
| Ready Topologies | 32 |
| Guided Lessons | 4 |
| CLI Command Families | 180+ |

---

## Türkçe

### Temel Özellikler

- **Etkileşimli Topoloji Tuvali**: PC, IoT, L2/L3 Switch ve Router cihazları.
- **Gerçekçi CLI/Console**: Komut geçmişi, öneri listesi, yardım çıktısı ve Geist Mono terminal fontu.
- **Gelişmiş Switching**: VLAN, Trunking, Native VLAN, VTP, EtherChannel, STP/PVST ve Port Security.
- **Kapsamlı Routing**: Statik yönlendirme, L3 Switch yönlendirme, RIP, OSPF kalıpları ve `show ip route` çıktıları.
- **Wireless ve IoT**: WiFi AP/Client modları, web tabanlı WiFi yönetimi, IoT paneli ve sensör simülasyonu.
- **Rehberli Ders Modu**: Otomatik tamamlama algılama ve ilerleme takibi ile adım adım görevler.
- **Modern UI/UX**: Klavye kısayolları, glassmorphism efektleri, shimmer loading ve erişilebilir tasarım.

### Son Güncellemeler (v1.6.0)

- **UI/UX Performans Faz 1 & 2**:
  - Gereksiz render'ları önlemek için **Zustand Seçiciler** ve memoizasyon eklendi.
  - Büyük ağlarda akıcı performans için **Spatial Partitioning** ve **Viewport Culling** algoritmaları uygulandı.
  - Performans artışı için Framer Motion yerine **CSS Animasyonları** kullanılmaya başlandı.
  - Açılış hızını artırmak için modüler **Kod Bölümleme** (Terminal, Config Panel vb.) yapıldı.
  - Büyük listeler için **Virtual Device List** (sanal liste) yapısı kuruldu.
- **CLI ve Topoloji Senkronizasyonu**:
  - CLI üzerinden `write memory` ve `erase` komutları ile tam **startup/running-config** yönetimi.
  - Cihazın canlı durumunu gösteren **Canlı Konfigürasyon Paneli**.
  - Tuval üzerindeki isim değişikliklerinin anında CLI prompt'una yansıması (**Hostname Yayılımı**).
  - Sekmeler arası (Topoloji, CLI, Görevler) tam durum senkronizasyonu.
- **Standart Port Yapısı**: C2960 (24eth+2gig), C3650 (24eth+4gig+1wlan) ve ISR 4451 (4gig+1wlan) modelleri için endüstri standardı port düzeni.
- **Geliştirilmiş Dokümantasyon & Örnekler**:
  - **Dokümantasyon İndeksi** ile CLI, hata yönetimi ve entegrasyon rehberleri.
  - **28 Hazır Örnek Proje** adım adım talimatlarla.
  - **Hızlı Referans Rehberi** yaygın görevler ve komutlar için.
  - **Uygulama Tamamlandı** dokümantasyonu özellik kontrol listesiyle.
- **Ping Paket Takibi & Görselleştirme**:
  - Gerçek zamanlı **Ping Animasyon Overlay** tuval üzerinde paket akışını gösteriyor.
  - **Paket Bilgi Paneli** detaylı hop-by-hop analizi ile.
  - Başarılı/başarısız ping'ler için görsel geri bildirim ve zamanlama bilgisi.
  - **ESC tuşu desteği** paket analiz panelini kapatmak için.
  - **Mobil geri düğmesi desteği** sorunsuz mobil navigasyon için.
- **Geliştirilmiş Hata Yönetimi & Doğrulama**:
  - **AppErrorBoundary** zarif hata kurtarma ve kullanıcı geri bildirimi ile.
  - **Form Doğrulama** araçları giriş sanitizasyonu ve hata mesajları için.
  - **Bildirim Yöneticisi** tutarlı toast ve uyarı işleme için.
- **API İstemcisi & İletişim Formu**:
  - Sağlam **API İstemcisi** yeniden deneme mantığı ve hata işleme ile.
  - Geliştirilmiş **İletişim Formu** doğrulama ve gönderim takibi ile.
  - Geri bildirim ve sorun raporlama desteği.

### İstatistikler

| Metrik | Değer |
| --- | ---: |
| Uygulama Kodu | 67,587 |
| Örnek Kod | 1,229 |
| Dokümantasyon | 104 |
| **Toplam Satır** | **68,920** |
| Kaynak Dosya | 182 |
| Hazır Topoloji | 32 |
| Rehberli Ders | 4 |
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
- **CLI Commands / CLI Komutları**: [CLI_COMMANDS.md](CLI_COMMANDS.md)
- **Installation / Kurulum**: [INSTALL.md](INSTALL.md)
- **Google Sheets Kurulum**: [Google Sheets](GOOGLE_SHEETS_SETUP.md)

## Tech Stack / Teknoloji

- Next.js 16.2, React 19, TypeScript 5.9, Tailwind CSS 4, Radix UI

## License / Lisans

Free and open source. See [LICENSE](LICENSE).
