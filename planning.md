# Network Simulator 2026 - Planning

## Güncel Durum

- **Sürüm**: 1.5.8
- **Tarih**: 2026-04-30
- **Kod satırı**: 64,521
- **Kod dosyası**: 166
- **Hazır topoloji örneği**: 28
- **Rehberli ders**: 3
- **Harici JSON örnek**: 6
- **Örnek JSON satırı**: 12,216
- **Örnek/doküman satırı**: 622
- **CLI komut ailesi**: 160+

Not: Örnek JSON dosyaları ve örnek dokümanları kod satırı sayısından ayrı izlenir.

## Son Yapılanlar

### UI/UX Modernizasyonu (Nisan 2026)

- **Klavye Kısayolları Yardımcısı** (`KeyboardShortcutsHelp`): `?` tuşu ile açılan, kategorilere ayrılmış kısayol rehberi.
- **Modern Panel Sekmeleri**: PCPanel hizmet sekmeleri (DNS/HTTP/DHCP) ve proje seçici sekmeler için yeni tab-header stili.
- **Glassmorphism Efektler**: Buton hover glow efektleri, glassmorphism primary/secondary/danger/warning/indigo stilleri.
- **Shimmer Loading**: Skeleton bileşenlerine shimmer animasyonu eklendi.
- **Yeni UI Bileşenleri**:
  - `LoadingSpinner` - Yükleme göstergesi
  - `EmptyState` / `NetworkEmptyState` - Boş durum şablonları
  - `KeyboardShortcutsHelp` - Kısayol rehberi
- **Erişilebilirlik**: `prefers-reduced-motion` medya sorgusu, geliştirilmiş focus visible stilleri, ARIA etiketleri.
- **HelpPanel Modernizasyonu**: Modern arayüz, arama fonksiyonu, animasyonlu kategoriler.
- **Proje Seçici Görsel İyileştirmeleri**: Seviye başlıkları (Basit/Orta/İleri) için mavi renk şeması ve çizgiler.

### README ve Dokümantasyon

- README kısa proje özeti olacak şekilde yenilendi.
- Uzun özellik açıklamaları ve yol haritası [detay.md](detay.md) içine taşındı.
- README başlangıcına son proje özellikleri, son değişiklikler ve güncel sayılar eklendi.
- Örnekler kod satırından ayrı sayıldı.

### Refresh Özeti

- F5 refresh bildirimine tıklanabilir cihaz listesi eklendi.
- Liste sırası: router, L3 SW, L2 SW, PC, IoT.
- Cihaz adına tıklanınca IP, MAC, GW, IPv6 ve açık hizmetler tablosu gösteriliyor.
- Açık hizmetlerde DHCP, DNS, HTTP, WiFi AP/Client, SSH ve Telnet algılanıyor.

### Drag UX

- Cihaz veya cihaz grubu sürüklenirken port hitboxları geçici devre dışı kalıyor.
- Sürükleme sırasında kablo başlatma engelleniyor.
- Cihaz/port tooltipleri drag sırasında gizleniyor.
- Drop sonrası tüm etkileşimler otomatik geri açılıyor.

### Modal UX

- PC CMD modalı ve Switch/Router CLI modalındaki sol yeşil dekoratif drag noktaları kaldırıldı.
- Tasks modalındaki durum noktası korundu.

### Terminal Fontu

- `font-geist-mono` utility sınıfı eklendi.
- CLI terminal çıktısı, prompt, metin girişi ve öneri/yardım listesi Geist Mono kullanıyor.
- PC CMD ve console çıktısı, prompt, metin girişi ve öneri/yardım listesi Geist Mono kullanıyor.

## Kararlı Özellikler

- Interaktif topoloji tuvali.
- PC, IoT, L2 switch, L3 switch ve router cihazları.
- Straight-through, crossover ve console kablolar.
- VLAN, trunk, native VLAN ve VTP.
- STP/PVST, VLAN bazlı yol hesaplama ve link failure davranışı.
- Port security ve aging komutları.
- Static routing, L3 routing, RIP ve route doğrulama.
- DHCP, DNS ve HTTP servisleri.
- WiFi AP/client modu ve IoT yönetim paneli.
- Rehberli ders modu.
- Türkçe/İngilizce arayüz.

## Yakın Plan

- ACL/NAT/firewall simülasyonlarını genişletmek.
- Paket yakalama ve analiz ekranı eklemek.
- Rehberli ders sayısını artırmak.
- Lab otomatik puanlama sistemini güçlendirmek.
- IPv6 komut ve görselleştirme kapsamını genişletmek.

## Doğrulama Notları

- `git diff --check` dokümantasyon değişiklikleri için çalıştırılmalı.
- Node/NPM bu ortamda daha önce `Could not determine Node.js install directory` ve `CSPRNG` hatası verdiği için lint/typecheck yerel Node düzeldikten sonra tekrar denenmeli.
