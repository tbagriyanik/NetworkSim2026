# Network Simulator 2026 - Detaylar

Bu dosya README'den çıkarılan uzun açıklamaları ve ayrıntılı proje notlarını tutar. README artık hızlı durum özeti, son değişiklikler ve güncel sayılar için kısa tutulur.

## Özellik Detayları

### Etkileşimli Topoloji

- Sürükle-bırak ile PC, IoT, L2 switch, L3 switch ve router ekleme.
- Zoom, pan, çoklu seçim, lastik kutu seçimi ve bağlam menüsü.
- Straight-through, crossover ve console kablo desteği.
- Port durumları, kablo uyumluluğu, STP bloklama rengi ve bağlantı animasyonları.
- Cihaz taşınırken port tıklama ve tooltip davranışı askıya alınır; drop sonrası otomatik döner.

### CLI, CMD ve Console

- Switch/router CLI terminali, PC CMD ve PC üzerinden console bağlantısı.
- Komut geçmişi, autocomplete, yardım çıktısı ve anlık `?` desteği.
- Terminal girişleri, çıktı alanları ve öneri listeleri Geist Mono ile görüntülenir.
- Desteklenen komut aileleri: VLAN, trunk, VTP, STP, EtherChannel, port security, DHCP, DNS, HTTP, static routing, RIP, OSPF, SSH, Telnet, ping ve show komutları.

### Switching

- VLAN oluşturma, adlandırma, access/trunk port atama.
- Native VLAN ve allowed VLAN davranışı.
- VTP server/client senaryoları.
- EtherChannel/LACP yapılandırmaları.
- STP ve PVST görselleştirmesi:
  - Root/designated/alternate rol takibi.
  - VLAN bazlı STP yol hesaplama.
  - Link kesilince yedek yolun devreye girmesi.
  - VLAN 1 için özel bloklama görselleştirmesi.

### Routing

- Static routing ve administrative distance.
- Router ve L3 switch üzerinde route doğrulama.
- RIP dynamic routing örnekleri.
- `show ip route` çıktılarında connected/static/RIP gösterimi.
- Ping animasyonu route ve VLAN/STP durumunu dikkate alır.

### Wireless ve IoT

- Router/switch WiFi AP ve PC/IoT client modu.
- SSID, güvenlik tipi, parola ve kanal ayarları.
- WiFi sinyal gücü göstergesi.
- Router yönetim web paneli.
- IoT paneli:
  - Oturum tabanlı giriş.
  - Bağlı cihaz listesi.
  - Sensör durumu ve aktif/pasif kontrolü.
  - IoT cihazını topolojiye odaklama, IP yenileme ve bağlantı kesme.

### Rehberli Dersler

- Temel switch yapılandırma.
- Temel LAN kurulumu.
- VLAN yapılandırma.
- Her ders adımları otomatik tamamlanma kontrolleriyle izlenir:
  - Cihaz erişimi.
  - Komut kalıbı.
  - Bağlantı ve kablo tipi.
  - Konfigürasyon durumu.

### Performans ve Erişilebilirlik

- Spatial partitioning ve viewport culling.
- Büyük topolojilerde bağlantı ve cihaz render optimizasyonu.
- Skeleton ekranlar ve dinamik bileşen yükleme.
- Klavye kısayolları, ARIA etiketleri ve ekran okuyucu iyileştirmeleri.

## Proje Metrikleri (v1.7.0)

Kod metriklerinde uygulama kodu ile örnek veri ve dokümanlar ayrı raporlanır.

| Grup | Satır Sayısı |
| --- | ---: |
| Uygulama Kodu (TS/TSX/CSS) | 50,853 |
| Örnek JSON Topolojileri | 14,400 |
| Örnekler & Dokümantasyon | 850 |
| **Toplam** | **66,103** |

| Diğer Metrikler | Sayı |
| --- | ---: |
| Hazır topoloji örneği | 32 |
| Rehberli ders | 4 |
| Harici JSON örnek | 8 |
| CLI komut ailesi | 180+ |

Örneklerin ayrıntılı listesi için [examples.md](examples.md) dosyasına bakın.

## Yol Haritası

### Tamamlanan Ana Başlıklar

- Interaktif topoloji ve cihaz yönetimi.
- PC CMD, router/switch CLI ve console bağlantısı.
- VLAN, trunk, VTP, STP/PVST, EtherChannel.
- Port security ve aging komutları.
- Static routing, RIP ve route doğrulama.
- DHCP, DNS ve HTTP servisleri.
- WiFi ve IoT yönetim panelleri.
- Rehberli ders modu.
- Refresh sonrası cihaz özet tablosu.
- **UI/UX Performans Optimizasyonları (Faz 1 & 2)**.
- **CLI ve Topoloji Senkronizasyon Düzeltmeleri**.

### Kısa Vadeli Plan

- ACL, NAT ve firewall simülasyonunu genişletme.
- Paket yakalama/izleme ekranı.
- Rehberli ders sayısını artırma.
- Otomatik lab değerlendirme.
- IPv6 kapsamını genişletme.

### Uzun Vadeli Plan

- Çok kullanıcılı lab paylaşımı.
- Gelişmiş QoS ve trafik şekillendirme.
- IPv6 kapsamını genişletme.
- Sertifika hazırlık senaryoları.

## Kurulum

```bash
npm install
npm run dev
```

Build ve doğrulama:

```bash
npm run lint
npx tsc --noEmit
```

Not: Bu çalışma ortamında Node/NPM zaman zaman `Could not determine Node.js install directory` ve `CSPRNG` hatasıyla başlamadan kapanabiliyor. Bu durumda manuel derleme doğrulaması yerel Node kurulumu düzeltilince tekrar çalıştırılmalıdır.
