# Network Simulator 2026

A modern browser-based network simulator for learning switching, routing, wireless, IoT, and CLI workflows.

![Version](https://img.shields.io/badge/version-1.5.8-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016.2%20|%20React%2019%20|%20TypeScript%205.9%20|%20Tailwind%204-green)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Code Lines](https://img.shields.io/badge/code--lines-64521-blueviolet)

Live app: [network2026.vercel.app](https://network2026.vercel.app)

## Son Proje Özellikleri

- Etkileşimli topoloji tuvali: PC, IoT, L2 switch, L3 switch ve router cihazları.
- CLI/Console/CMD deneyimi: komut geçmişi, öneri listesi, yardım çıktısı ve Geist Mono terminal fontu.
- Switching: VLAN, trunk, native VLAN, VTP, EtherChannel, STP/PVST ve port security.
- Routing: static routing, L3 switch routing, RIP, OSPF kalıpları, `show ip route` çıktıları.
- Wireless ve IoT: WiFi AP/client modu, web tabanlı WiFi yönetimi, IoT paneli ve sensör simülasyonu.
- Rehberli ders modu: adım adım görevler, otomatik tamamlama algılama ve ilerleme takibi.
- F5 refresh özeti: cihazlar router, L3 SW, L2 SW, PC, IoT sırasıyla listelenir; cihaz adına tıklanınca IP/MAC/GW/IPv6/açık hizmetler tablosu görünür.
- Sürükleme UX düzeltmeleri: cihaz taşınırken kablo takma hitboxları ve tooltipler geçici kapanır.
- Modal UX düzeltmeleri: PC/CMD ve CLI pencerelerindeki gereksiz sol yeşil drag noktaları kaldırıldı.
- **Yeni UI/UX**: Klavye kısayolları yardımcısı (`?`), modern sekmeler, shimmer loading, glassmorphism efektler, erişilebilirlik iyileştirmeleri.

## Son Değişiklikler

- **UI/UX Modernizasyonu**: Klavye kısayolları yardımcısı (`?` tuşu), modern panel sekme stili, shimmer loading animasyonları, glassmorphism buton glow efektleri.
- **Erişilebilirlik**: `prefers-reduced-motion` desteği, geliştirilmiş focus stilleri, touch target optimizasyonları.
- **Yeni Bileşenler**: `KeyboardShortcutsHelp`, `LoadingSpinner`, `EmptyState`, `NetworkEmptyState`, iyileştirilmiş `ModernPanel`.
- **Proje Seçici**: Sekmeli başlık stili, mavi renk şemasıyla seviye (Basit/Orta/İleri) görsel farklılaşması.
- **HelpPanel**: Modern arayüz, arama, kategoriler ve animasyonlar.
- README sadeleştirildi; uzun açıklamalar [detay.md](detay.md) dosyasına taşındı.
- `planning.md` güncel metrikler ve son yapılan işler ile yenilendi.
- CMD, CLI ve console metin girişleri ile yardım/öneri listeleri `font-geist-mono` sınıfına alındı.
- Refresh bildirimine tıklanabilir cihaz listesi ve özet bilgi tablosu eklendi.
- Aktif sürükleme sırasında port tıklama, kablo başlatma ve tooltip gösterimi durduruldu.

## Güncel Sayılar

| Metrik | Değer |
| --- | ---: |
| Kod satırı | 64,521 |
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
