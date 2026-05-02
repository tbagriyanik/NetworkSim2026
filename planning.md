# Network Simulator 2026 - Planning

## Güncel Durum

- **Sürüm**: 1.6.0
- **Tarih**: 2026-05-02
- **Kod satırı**: 65,195
- **Kod dosyası**: 166
- **Hazır topoloji örneği**: 28
- **Rehberli ders**: 3
- **Harici JSON örnek**: 6
- **Örnek JSON satırı**: 12,216
- **Örnek/doküman satırı**: 622
- **CLI komut ailesi**: 160+

Not: Örnek JSON dosyaları ve örnek dokümanları kod satırı sayısından ayrı izlenir.

## Son Yapılanlar

### DHCP Tarama ve Lease Akışı (Mayıs 2026)

- **Refresh sırasında DHCP taraması**: Ağ yenileme akışına DHCP sunucu/istemci taraması, aktif havuz kontrolü ve deterministic lease özeti eklendi.
- **Toplu atama bildirimi**: Refresh sonrası lease alan istemciler için toplu DHCP atama toast'ı ve sunucu/lease sayımı gösteriliyor.
- **Otomatik yenileme**: DHCP modundaki ve geçerli IP alamamış PC'ler için sayfa açılışında ve yenileme sonrasında otomatik lease denemesi güçlendirildi.
- **Havuz kaynakları birleşimi**: Router/switch CLI havuzları ile servis paneli havuzları birlikte değerlendirilerek DHCP görünürlüğü tutarlı hale getirildi.

### PC/CMD ve Bilgi Paneli Düzeltmeleri (Mayıs 2026)

- **PC bilgi kartları**: Servis rozetleri, DHCP/Static durumu ve cihaz özetleri daha net ve tutarlı gösteriliyor.
- **CMD modal akışı**: PC CMD görünümü ve ilgili modal davranışlarında düzenleme yapıldı; bilgi panelleri ile etkileşim sadeleştirildi.
- **Info panel düzenlemeleri**: Cihaz detay alanları ve yönetim görünümleri son UI düzenlemeleriyle hizalandı.

### Cihaz ve Port Standartizasyonu (Mayıs 2026)

- **Fiziksel Port Düzenlemeleri**:
  - L2 Switch (2960): 24 FastEthernet + 2 Gigabit Ethernet.
  - L3 Switch (3650): 24 FastEthernet + 4 Gigabit Ethernet + 1 WLAN.
  - Router (ISR): 4 Gigabit Ethernet + 1 WLAN.
- **Dinamik Raporlama (sh ver)**: `show version` çıktısı artık cihazın fiziksel portlarından bağımsız olarak her zaman **24 FE / 4 GE** (ve varsa Wireless) raporlayacak şekilde standardize edildi.
- **Gerçekçi Boot Sekansı**: Router ve Switch modelleri için donanıma özel POST, CPU/PCIe kontrolleri ve flash dosya sistemi başlatma mesajları eklendi.
- **Hata Giderme**: Port sayımı ve cihaz tipi tespiti sırasında oluşan TypeScript değişken çakışmaları ve tip hataları giderildi.

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
