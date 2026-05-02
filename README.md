# Network Simulator 2026

A modern browser-based network simulator for learning switching, routing, wireless, IoT, and CLI workflows.

![Version](https://img.shields.io/badge/version-1.6.0-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016.2%20|%20React%2019%20|%20TypeScript%205.9%20|%20Tailwind%204-green)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Code Lines](https://img.shields.io/badge/code--lines-65195-blueviolet)

Live app: [network2026.vercel.app](https://network2026.vercel.app)

## Son Proje Özellikleri

- Etkileşimli topoloji tuvali: PC, IoT, L2 switch, L3 switch ve router cihazları.
- CLI/Console/CMD deneyimi: komut geçmişi, öneri listesi, yardım çıktısı ve Geist Mono terminal fontu.
- Switching: VLAN, trunk, native VLAN, VTP, EtherChannel, STP/PVST ve port security.
- Routing: static routing, L3 switch routing, RIP, OSPF kalıpları, `show ip route` çıktıları.
- Wireless ve IoT: WiFi AP/client modu, web tabanlı WiFi yönetimi, IoT paneli ve sensör simülasyonu.
- Rehberli ders modu: adım adım görevler, otomatik tamamlama algılama ve ilerleme takibi.
- F5 refresh özeti: cihazlar router, L3 SW, L2 SW, PC, IoT sırasıyla listelenir; cihaz adına tıklanınca IP/MAC/GW/IPv6/açık hizmetler tablosu görünür.
- DHCP yenileme ve tarama akışı: refresh sonrası DHCP istemcileri tekrar taranır, lease özeti ve atama bildirimleri gösterilir.
- Sürükleme UX düzeltmeleri: cihaz taşınırken kablo takma hitboxları ve tooltipler geçici kapanır.
- Modal UX düzeltmeleri: PC/CMD ve CLI pencerelerindeki gereksiz sol yeşil drag noktaları kaldırıldı.
- PC/CMD bilgi panelleri: cihaz servis rozetleri, DHCP modu ve yönetim görünümü daha tutarlı hale getirildi.
- **Yeni UI/UX**: Klavye kısayolları yardımcısı (`?`), modern sekmeler, shimmer loading, glassmorphism efektler, erişilebilirlik iyileştirmeleri.
- **Port Standartizasyonu**: L2 Switch (24+2), L3 Switch (24+4+1) ve Router (4+1) port yapıları standartlaştırıldı; `show version` çıktısı 24 FE / 4 GE raporlayacak şekilde güncellendi.

## Son Değişiklikler

- **Cihaz Port Yapılandırması**: Tüm cihaz modelleri için fiziksel port sayıları endüstri standartlarına (2960: 24+2, 3650: 24+4+1, ISR: 4+1) göre düzenlendi.
- **Raporlama Sistemi**: `show version` ve boot mesajları, donanımdan bağımsız olarak her zaman 24 FastEthernet ve 4 Gigabit Ethernet (L3 için +Wireless) raporlayacak şekilde sabitlendi.
- **Gelişmiş Boot Sekansı**: Router ve Switch modelleri için gerçekçi donanım POST ve flash yükleme mesajları eklendi.
- **UI/UX Modernizasyonu**: Modern panel sekme stili, shimmer loading animasyonları, glassmorphism buton glow efektleri.
- **Erişilebilirlik**: `prefers-reduced-motion` desteği, geliştirilmiş focus stilleri, touch target optimizasyonları.
- **Yeni Bileşenler**: `LoadingSpinner`, `EmptyState`, `NetworkEmptyState`, iyileştirilmiş `ModernPanel`.
- **Proje Seçici**: Sekmeli başlık stili, mavi renk şemasıyla seviye (Basit/Orta/İleri) görsel farklılaşması.
- **HelpPanel**: Modern arayüz, arama, kategoriler ve animasyonlar.
- README sadeleştirildi; uzun açıklamalar [detay.md](detay.md) dosyasına taşındı.
- `planning.md` güncel metrikler ve son yapılan işler ile yenilendi.
- CMD, CLI ve console metin girişleri ile yardım/öneri listeleri `font-geist-mono` sınıfına alındı.
- Refresh bildirimine tıklanabilir cihaz listesi ve özet bilgi tablosu eklendi.
- Aktif sürükleme sırasında port tıklama, kablo başlatma ve tooltip gösterimi durduruldu.
- Refresh akışına DHCP sunucu/istemci taraması, lease sayımı ve toplu DHCP atama özeti eklendi.
- PC panelinde DHCP lease alma/yenileme ve servis görünümü router/switch DHCP havuzlarıyla daha tutarlı çalışacak şekilde iyileştirildi.
- Info ve CMD panel düzenlemeleriyle cihaz detay kartları ve modal akışı sadeleştirildi.

## Güncel Sayılar

| Metrik | Değer |
| --- | ---: |
| Kod satırı | 65,195 |
| Kod dosyası | 166 |
| Hazır topoloji örneği | 28 |
| Rehberli ders | 3 |
| Harici JSON örnek | 6 |
| Örnek JSON satırı | 12,216 |
| Örnek/doküman satırı | 622 |
| CLI komut ailesi | 160+ |

Not: Kod satırı sayısı örnek JSON içerikleri ayrı sayılarak raporlanır.

## Hızlı Başlangıç

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

## Belgeler

- Ayrıntılı proje açıklaması: [detay.md](detay.md)
- Örnek projeler: [examples.md](examples.md)
- CLI komut listesi: [CLI_COMMANDS.md](CLI_COMMANDS.md)
- Kurulum notları: [INSTALL.md](INSTALL.md)

## Teknoloji

- Next.js 16.2
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Radix UI ve lucide-react

## Lisans

Free and open source. See [LICENSE](LICENSE).
