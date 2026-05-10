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

- IPv4 ve IPv6 Static routing (prefix/length desteği).
- Router ve L3 switch üzerinde route doğrulama.
- RIP ve OSPF dynamic routing desteği.
- **IPv6 Yönlendirme**: RIPng ve OSPFv3 protokolleri.
- `show ip route` ve `show ipv6 route` çıktılarında protokol bazlı ayrım.
- Ping animasyonu IPv4/IPv6 route ve VLAN/STP durumunu dikkate alır.

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

## Eski ve Yeni Güncellemeler

### Yeni Güncellemeler (v1.6.2 - Mayıs 2026)

- Sürüm `1.6.2` olarak güncellendi (`package.json`, `package-lock.json`, dokümantasyon başlıkları).
- Örnek proje seti genişletildi ve toplam **37** örneğe çıkarıldı.
- Yeni eklenen 9 örnek:
  - ACL Standard + Extended (2 örnek)
  - NAT Static + Dynamic + PAT (3 örnek)
  - HSRP Redundancy (1 örnek)
  - OSPF Multi-Area (2 örnek)
  - EIGRP Basic (1 örnek)
- `examples.md` içinde 29-37 arası yeni örnekler, diğerleriyle aynı formatta detaylandırıldı:
  - Kısa tanıtım
  - Adım adım proje yapımı
  - Doğrulama/test adımları
- README, planning ve examples dokümanlarındaki örnek sayıları ve sürüm metinleri eşitlendi.
- Kod/metrik raporlarında örnek JSON/TS toplamı ayrıca hesaplanarak dokümana işlendi.

### Önceki Güncellemeler (v1.6.1 - Mayıs 2026)

- Firewall kurallarının kalıcılığı güçlendirildi; cihaz yeniden seçildiğinde kurallar korunur.
- Firewall kuralları `running-config` üretimine dahil edildi.
- `show access-lists` çıktısı firewall kural görünürlüğü ile genişletildi.
- IPv6 yönlendirme kapsamı genişletildi:
  - RIPng
  - OSPFv3 (multi-area dahil)
  - `show ipv6 route` ve `show ipv6 interface brief`
- React hook kararlılık düzeltmeleri ve UI/UX performans iyileştirmeleri tamamlandı.
- Jest tabanlı testlerin Vitest API uyumluluk geçişleri yapıldı.

## Proje Metrikleri (v1.6.2)

Kod metriklerinde uygulama kodu ile örnek veri ve dokümanlar ayrı raporlanır.

| Grup | Satır Sayısı |
| --- | ---: |
| Uygulama Kodu | 88,624 |
| Örnek JSON+TS Kod Toplamı | 15,298 |
| **Toplam** | **103,922** |

| Diğer Metrikler | Sayı |
| --- | ---: |
| Hazır topoloji örneği | 37 |
| Rehberli ders | 4 |
| Harici JSON örnek | 6 |
| CLI komut ailesi | 180+ |
| Test Dosyaları | 4 |
| Başarısız Testler | 0 |

Örneklerin ayrıntılı listesi için [examples.md](examples.md) dosyasına bakın.

### Test Durumu (2026-05-10)

**Vitest Altyapısı**: ✅ Aktif
- Test altyapısı Vitest standardına taşındı.
- Dokümantasyon tarafında başarısız Jest-API uyumsuzluk maddeleri kapatıldı.

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
- IPv6 mobil ve DHCPv6 desteği.

### Uzun Vadeli Plan

- Çok kullanıcılı lab paylaşımı.
- Gelişmiş QoS ve trafik şekillendirme.
- BGP ve IS-IS protokol desteği.
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
