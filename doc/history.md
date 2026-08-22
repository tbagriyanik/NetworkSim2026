# 📅 Network Simulator — Proje Geçmişi

Yeniden eskiye, tarih ve özellik listesi.

## v2.8.0 — 2026-08-22

| Tarih | Değişiklik |
|---|---|
| 2026-08-22 | **Sürüm Yükseltmesi (v2.8.0)** — Ağ Yenileme Raporu penceresine koyu/açık tema sürükleme (drag-and-drop) ve çift tıkla daraltma desteği eklendi. Olay günlüğü rozeti renk uyumu sağlandı. Örnek projelerdeki taban MAC çakışmaları ve cihaz kapatıp açma durumunda MAC adresinin korunması sağlandı. Çift yönlü arama ile ACL filtresi ve `access-list` Global Konfigürasyon mod desteği entegre edildi. |

---

## v2.7.0 — 2026-08-21

| Tarih | Değişiklik |
|---|---|
| 2026-08-21 | **Sürüm Yükseltmesi (v2.7.0)** — Dokümantasyondaki 18 eksik özellik tam olarak belgelendi. `PC_CMD_REFERENCE.md`, `PACKET_CAPTURE_GUIDE.md` ve `TOPOLOGY_GENERATOR.md` oluşturuldu. Tüm kılavuzlar ve kitapçık v2.7.0'a göre güncellendi. Örnek uygulama projeleri sayısı 46'ya çıkarıldı. |

---

## v2.6.0 — 2026-08-20

| Tarih | Değişiklik |
|---|---|
| 2026-08-20 | **Sürüm Yükseltmesi (v2.6.0)** — Uygulama versiyonu v2.6.0 olarak güncellendi, derleme ve test doğrulamaları yapıldı. |

---

## v2.5.0 — 2026-08-19

| Tarih | Değişiklik |
|---|---|
| 2026-08-19 | Switch/router arayüz komutları ve PC CMD ARP yönetimi iyileştirildi; kullanılmayan wireless kodu temizlendi ve type-check düzeltildi. |

---

## v2.4.0 — 2026-08-19

| Tarih | Özellik |
|-------|---------|
| 2026-08-19 | **Arka Plan Ağ Hareketliliği Yakalama** — İstemci DHCP IP alma adımları (`DHCP Discover`, `DHCP Offer`, `DHCP Request`, `DHCP ACK`), `STP BPDU` döngü engelleme paketleri, periyodik `CDP`, `OSPF Hello`, `RIP`, `EIGRP` ve `WLAN Beacon` paketleri canlı Paket Yakalama paneline bağlandı. |
| 2026-08-19 | **Paket Yakalama Arama ve Sayfalama Desteği** — Paket yakalama paneline canlı IP/protokol/içerik arama çubuğu ve sayfa başına 10 paket gösteren gezinti (pagination) sistemi eklendi. |
| 2026-08-19 | **Paket Yakalamada Çoklu Dışlama Filtresi (Multi-term Exclude)** — Dışlama alanına virgül/boşluk ile ayrılmış çoklu terimler (`cdp, stp, arp` vb.) girilerek istenmeyen paketlerin anlık gizlenebilmesi sağlandı. |
| 2026-08-18 | **Sürüm Yükseltmesi (v2.4)** — Uygulama versiyonu 2.4'e yükseltildi. |
| 2026-08-18 | **Paket Analizinde Protokol Numarası Gösterimi** — Paket analizi panelindeki protokol sütununda, her protokolün port/protokol numarası parantez içinde gösteriliyor: ICMP (1), ICMPv6 (58), TCP (6), UDP (17), GRE (47), OSPF (89), EIGRP (88), ARP (0x0806), RARP (0x8035), STP (0x4242). |
| 2026-08-18 | **Pencere Başlığı Çift Tıklama ile Daraltma/Genişletme (Toggle Collapse)** — PC Paneli, Router Bilgi Paneli, Paket Analizi / Yakalama ve Ağ Yenileme Raporu pencerelerinin başlık çubuğuna çift tıklandığında pencereyi hızlıca küçültme/büyütme desteği eklendi. |
| 2026-08-18 | **CLI Geçmiş Paneli Tıklama Odaklanması** — Terminal ve PC CMD ekranlarında çıktı / geçmiş alanına tıklandığında komut yazma kutusunun (input) otomatik olarak odaklanması (`focus`) sağlandı. |
| 2026-08-18 | **Trunk İzinli VLAN Desteği (`switchport trunk allowed vlan`)** — `switchport trunk allowed vlan 10,20`, `10-20`, `add`, `remove`, `except` ve `all` sözdizimleri ile VLAN filtreleme, simülasyon ve PVST Spanning Tree hesaplamalarına entegre edildi. |
| 2026-08-18 | **Paket Yakalamada ARP İstek ve Yanıt Entegrasyonu** — Sağ tık ile başlatılan ping işlemlerinde, hedef MAC adresi önbellekte yoksa `ARP Request (Broadcast)` ve `ARP Reply` paketlerinin kablo paket yakalama (Packet Capture) tablosuna otomatik işlenmesi doğrulandı ve optimize edildi. |

---

## v2.2.0 — 2026-08-15

| Tarih | Özellik |
|-------|---------|
| 2026-08-15 | **Sürüm Yükseltmesi (v2.2)** — Uygulama versiyonu 2.2'ye yükseltildi; Next.js 16.2.4, React 19.2.5, TypeScript 6.0.3 ve Tailwind CSS 4.2.2 paketleri güncellendi. |
| 2026-08-15 | **Ping & Paket Animasyonu İyileştirmeleri** — Ping animasyonu oynatma/duraklatma ve paket ilerleme mantığındaki senkronizasyon hataları giderildi. |
| 2026-08-15 | **Pencere & Başlık Görsel Optimizasyonları** — Başlık rengi, tema geçişleri, Toolbar başlığı ve fare etkileşimleri (hover/drag) daha akıcı hale getirildi. |
| 2026-08-15 | **Topoloji ve Çizim Performansı** — `ConnectionLine` özel memo karşılaştırıcısı ve topoloji çizim döngüsü optimize edilerek yüksek cihaz sayılarında FPS artışı sağlandı. |
| 2026-08-15 | **CLI Parser & Arayüz İyileştirmeleri** — `parser.ts`, `interfaceCommands.ts` ve cihaz panelleri (PCPanel vb.) modüler hale getirilip temizlendi. |
| 2026-08-17 | **PC CMD Parametre Desteği** — `ping` (-n, -l, -w, -a, -t, -4/-6), `tracert` (-d, -h, -w, -4/-6), `nbtstat` (-n, -c, -r, -R, -RR, -S, -s, -a/-A/-L), `netstat` (-a, -n, -o, -p, -r, -s, -e), `arp` (-a, -g, -v, -d, -s) ve `nslookup` (-type, ters/PTR çözümleme, sunucu seçimi) komutları için Windows tarzı parametreler eklendi. |

---

## v2.0.1 — 2026-08-01

| Tarih | Özellik |
|-------|---------|
| 2026-08-01 | **Genel Bakım ve Hata Düzeltmeleri** — Bağlantı render optimizasyonu (ConnectionLine memo comparator), bellek optimizasyonları ve kod temizliği yapıldı. |
| 2026-07-28 | **Proje Açıklamaları & Topoloji Şablonları** — 12 yeni topoloji şablonu ve detaylı proje açıklamaları güncellendi. |

---

## v2.0.0 — 2026-07-20

| Tarih | Özellik |
|-------|---------|
| 2026-07-20 | **İsim ve Marka Güncellemesi** — Proje adı "NetworkSimulator" olarak güncellendi ve tüm markalama buna göre düzenlendi. |
| 2026-07-20 | **LocalStorage Güvenliği (XOR+Base64)** — Yerel depolama verileri, tüm uygulamayı kapsayan bir interceptor aracılığıyla (XOR ve Base64 kullanarak) şifrelendi; geriye dönük uyumluluk eklendi. |
| 2026-07-20 | **Metin Limiti ve XSS Koruması** — İsim ve proje açıklama alanları için aşırı uzun girdileri engelleyecek otomatik karakter limitleri ve anti-XSS (`<`, `>` filtrelemesi) korumaları aktif edildi. |
| 2026-07-20 | **Gelişmiş Topoloji Üretimi** — "Topoloji Üret" sihirbazına arama işlevi eklendi; üretilen şablonlar kendi özgün proje başlıklarını ve açıklamalarını özet notlarına otomatik olarak ekliyor. |

---

## v1.9.9 — 2026-07-18

| Tarih | Özellik |
|-------|---------|
| 2026-07-18 | **Minör Güncelleme** — Hata düzeltmeleri, stabilite artışı ve genel performans iyileştirmeleri |

---

## v1.9.8 — 2026-07-16

| Tarih | Özellik |
|-------|---------|
| 2026-07-12 | **Daraltılabilir Bilgi Panelörleri** — PC ve Router bilgilendirme popup'ları artık daraltılabilir; bölümler (WiFi, Servisler, IP Modu, vb.) tek tıkla gizlenip gösterilebilir ve durum localStorage'da saklanır |
| 2026-07-12 | **Daraltılabilir Ağ Yenileme Raporu Paneli** — Ağ yenileme raporu panelini (Ağ Yenilendi) artık daraltılabilir; başlık düğmesiyle genişletme/daraltma mümkün ve durum localStorage'da saklanır |
| 2026-07-16 | **Sürüm Güncellemesi** — Uygulama versiyonu 1.9.7'den 1.9.8'e yükseltildi |

---

## v1.9.7 — 2026-07-12

| Tarih | Özellik |
|-------|---------|
| 2026-07-12 | **Minör Güncelleme** — Arayüzdeki ufak hataların giderilmesi ve altyapı iyileştirmeleri |

---

## v1.9.6 — 2026-07-08

| Tarih | Özellik |
|-------|---------|
| 2026-07-08 | **"Bana Öğret" Rehberli Dersleri** — Sıfırdan öğretim için 3 yeni rehberli proje: Temel (PC ipconfig, switch enable/configure terminal/hostname), Orta (router IP yapılandırma) ve İleri (OSPF + ACL) seviyeleri |
| 2026-07-08 | **PC Tabanlı Arıza Giderme** — Arıza tanımı artık `pc.` ön eki ile PC özelliklerini (IP, gateway, DNS, hostname vb.) doğrulayabiliyor; TroubleshootingPanel `topologyDevices` üzerinden PC arızalarını çözüyor |
| 2026-07-08 | **Otomatik Komut Yazdırma** — `pc-auto-type` olayı ile dışarıdan komutların karakter karakter PC CMD'ye yazdırılması ve otomatik çalıştırılması desteği |
| 2026-07-08 | **Yeni Pencere Olayları** — `pc-tab-changed` ve `pc-command-executed` olayları ile PC paneli durumu dış bileşenlere bildiriliyor |

---

## v1.9.5 — 2026-07-07

| Tarih | Özellik |
|-------|---------|
| 2026-07-07 | **Sektörel Senaryolar** — SOHO, Okul Kampüsü, Hastane, E-Ticaret; çok adımlı doğrulama |
| 2026-07-07 | **Sesli Anlatım (TTS)** — Rehberli Modda "Sesli Dinle" butonu; konuşma sentezi desteği |
| 2026-07-07 | **PDF Sertifikaları** — Lab tamamlandığında öğrenci adı ve puanını içeren otomatik sertifika üretimi |
| 2026-07-07 | **Gelişmiş Arıza Giderme** — Trunk yapılandırma hataları ve OSPF alan uyumsuzlukları için "Bul ve Düzelt" görevleri |
| 2026-07-07 | **IPv6 Master Lab** — OSPFv3 ve IPv6 ACL içeren kapsamlı dual-stack senaryosu |
| 2026-07-07 | **Mobil PNG Dışa Aktarma** — Web Share API ile mobil paylaşım ve bellek optimizasyonu |
| 2026-07-07 | **Gelişmiş Kablo Bağlantı Deneyimi** — `onPointerDown` ile porttan porta tıklayarak kablo bağlama kararlı hale getirildi |
| 2026-07-07 | **Gelişmiş İşlem Geçmişi (Timeline)** — Scroll desteği, ayrıntılı bildirimler, `.txt` dışa aktarma, localStorage kalıcılığı |

---

## v1.9.4 — 2026-07-04

| Tarih | Özellik |
|-------|---------|
| 2026-07-04 | **Minör Güncelleme** — Küçük UI iyileştirmeleri ve performans optimizasyonları |

---

## v1.9.3 — 2026-06-30

| Tarih | Özellik |
|-------|---------|
| 2026-06-30 | **PNG 300 DPI Export** — Topolojiye sadık yüksek çözünürlüklü dışa aktarma; cihaz görselleri, kablo renkleri, port etiketleri, notlar |
| 2026-06-30 | **Kablo Kes/Onar** — Unplug/PlugZap ikonları; cihazlarda güç durumu simgeleri |
| 2026-06-30 | **Protokol Durum Paneli** — OSPF/STP/HSRP/EIGRP durumu "Özet" sekmesine entegre edildi; ayrı yüzen panel kaldırıldı |
| 2026-06-30 | **Ağ Durum Paneli** — Header üzerinde sabit z-index, taşma kaydırma, mobilde sabit, ekran dışı güvenli konumlandırma |
| 2026-06-30 | **Sürükleme Düzeltmesi** — Cihaz taşırken kablo bağlantı noktaları artık kaymıyor; port pozisyonları normalize edildi |
| 2026-06-30 | **UI Temizliği** — Mobil cihaz ekle butonu kaldırıldı; mobil ağ durum paneli sürüklenemez |
| 2026-06-30 | **FTP Servisleri** — FTP istemci/sunucu yapılandırması, dosya yükleme ve cihazlar arası aktarım simülasyonu |
| 2026-06-30 | **NTP Zaman Senkronizasyonu** — Ağ genelinde zaman senkronizasyonu için NTP sunucu/istemci |
| 2026-06-30 | **Mail Servisleri** — Topoloji içi e-posta gönderme, alma ve posta kutusu simülasyonu |
| 2026-06-30 | **Güvenlik Duvarı Servis Entegrasyonu** — Trafik filtreleme için entegre servis seçimli güvenlik duvarı kuralları |
| 2026-06-30 | **Kablosuz Gösterge Paneli** — SSID ve güvenlik yönetimi ile özel kablosuz cihaz ana sayfası |
| 2026-06-30 | **IoT Panel Sekmeleri** — Sensörler, aktüatörler ve cihaz ayarları için sekmeli IoT paneli |
| 2026-06-30 | **Sensör Geliştirmeleri** — Hareket sensörü yarıçap görselleştirmesi, fare ayarlanabilir ses sensörü menzili, lamba ikonu |
| 2026-06-30 | **Pencere Notları** — Daraltılabilir bölümler ve not alma özelliği ile yeniden boyutlandırılabilir pencereler |
| 2026-06-30 | **API Hız Sınırlama** — İletişim formu API hız sınırlaması; kötüye kullanım önleme |
| 2026-06-30 | **Tarayıcı Penceresi ESC Kapatma** — Web tarayıcı penceresi ESC ile kapanır, PC paneli etkilenmez |
| 2026-06-30 | **Pencere Snap Kaldırma** — PC/Switch/Router/Firewall pencereleri ekran kenarlarına snap olmaz |
| 2026-06-30 | **PC Geçmiş Temizliği** — Yeni ve açılan projelerde önceki cmd/CLI geçmişi sıfırlanır |

---

## v1.9.2 — 2026-06-28

| Tarih | Özellik |
|-------|---------|
| 2026-06-28 | **Minör Güncelleme** — Geri bildirimler doğrultusunda stabilite güncellemeleri |

---

## v1.9.1 — 2026-06-25

| Tarih | Özellik |
|-------|---------|
| 2026-06-25 | **Minör Güncelleme** — Yayın sonrası ilk hata düzeltmeleri ve minör optimizasyonlar |

---

## v1.9.0 — 2026-06-21

| Tarih | Özellik |
|-------|---------|
| 2026-06-21 | **Başarım Sistemi** — Projeler, rehberli dersler ve sınavlar için aktivite takibi; oturum süresi günlüğü |
| 2026-06-21 | **Sınav Modu** — Öğretmen sınav düzenleyicisi, projeden sınava dönüşüm, mobil uyumlu düzen, güvenli öğrenci dağıtımı |
| 2026-06-21 | **Rehberli Mod & Eğitim Sihirbazı** — Puan, ilerleme takibi ve ipucu sistemi ile adım adım rehberli dersler |
| 2026-06-21 | **Akıllı CLI Asistanı** — Fuzzy-matched komut önerileri; CLI hata mesajlarının altında alt komut ipuçları |
| 2026-06-21 | **Sınav İçe Aktarma İyileştirmeleri** — `.json` / `.exam` içe aktarma; akıllı PC IP çıkarma, bağlantı ayrıştırma, ağırlıklı puanlama |
| 2026-06-21 | **PC Servis Kalıcılığı** — DHCP, DNS, HTTP servis yapılandırmaları ağ yenilemelerinde korunur |
| 2026-06-21 | **WLC & AP Yönetimi** — Lightweight AP desteği, dot11 WLAN yapılandırması, AP katılımı, auth-mac filtreleme |
| 2026-06-21 | **Seri / WAN Arayüzleri** — HDLC ve PPP kapsülleme, clock rate, PAP/CHAP kimlik doğrulama, DCE/DTE tespiti |
| 2026-06-21 | **Gelişmiş Yönlendirme** — EIGRP (named/config), BGP (temel), OSPFv3 (IPv6), RIPng (IPv6), rota yeniden dağıtımı |
| 2026-06-21 | **IoT & Güvenlik Duvarı CLI** — IoT sensör/aktüatör yönetimi ve güvenlik duvarı kural/politika yapılandırması CLI komutları |
| 2026-06-21 | **Yardım Sistemi Revizyonu** — Kapsamlı CLI komutları; iki dilli yardım paneli; cihaz bağlamına göre düzenli |
| 2026-06-21 | **Kanvas Sürükleme Pürüzsüzlüğü** — Frame başına taze DOM rect; SVG geçişleri hareket sırasında devre dışı |
| 2026-06-21 | **Türkçe Eğitim Kitapçığı** — Ağ temelleri, CLI, yönlendirme, WAN, kablosuz ve güvenlik konularını kapsayan kapsamlı kitapçık |
| 2026-06-21 | **Seri Kapsülleme** — Bağlantı kontrollerinde HDLC/PPP uyumsuzluğu tespiti |
| 2026-06-21 | **No Hostname Komutu** — `no hostname` ile cihaz hostname'i varsayılana sıfırlama |
| 2026-06-21 | **Oda Takip Sistemi** — Oda kodları ve Vercel KV (Redis) ile gerçek zamanlı öğretmen-öğrenci ilerleme takibi |
| 2026-06-21 | **ACL Standard & Extended** — Trafik filtreleme ve güvenlik politikaları için standart ve genişletilmiş ACL |
| 2026-06-21 | **NAT (Static/Dynamic/PAT)** — Statik birebir, dinamik havuz ve PAT overload desteği |
| 2026-06-21 | **HSRP Yedeklilik** — Varsayılan ağ geçidi yedekliliği ve arıza geçişi için HSRP |
| 2026-06-21 | **OSPF Multi-Area** — Area 0, Area 10, Area 20 ve stub alan yapılandırması |
| 2026-06-21 | **EIGRP Dinamik Yönlendirme** — Named/config modu ile EIGRP |
| 2026-06-21 | **IPv6 Gelişmiş Lab** — IPv6 adresleme, DHCPv6 havuzları, OSPFv3 |
| 2026-06-21 | **Tüm Servisler Laboratuvarı** — DNS, HTTP, DHCP, FTP, MAIL ve NTP servislerini içeren kapsamlı lab |
| 2026-06-21 | **Google Sheets Entegrasyonu** — Apps Script API ile iletişim formu verilerinin Google Sheets'e aktarımı |
| 2026-06-21 | **Redis / KV Depolama** — Upstash Redis ile oda takibi oturum kalıcılığı ve gerçek zamanlı senkronizasyon |

---

## Temel Özellikler (İlk Sürüm)

| Özellik |
|---------|
| **Ağ Tuvali** — Sürükle-bırak topoloji oluşturucu; Router, Switch, PC, Laptop, Server, IoT, Wireless cihaz paleti |
| **CLI Motoru** — enable modu, configure terminal, interface config; kapsamlı komut desteği |
| **Switching** — VLAN, STP, trunk/access portları, MAC öğrenmesi, switchport güvenliği |
| **Yönlendirme** — Statik rotalar, OSPF, RIP; VLAN'lar arası yönlendirme; L3 anahtarlama |
| **DHCP / DNS** — DHCP sunucu-istemci, adres havuzları; DNS ad çözümleme |
| **ARP** — ARP tablosu yönetimi, MAC-IP çözümleme |
| **Link-Local** — Otomatik link-yerel adresleme (169.254.x.x) |
| **Bağlantı Testi** — Ping, traceroute, genişletilmiş ping |
| **JSON Serileştirme** — Ağ topolojilerini JSON olarak kaydet/yükle |
| **CLI Geçmişi** — Yukarı/aşağı ok ile komut geçmişi navigasyonu |
| **Fuzzy Matching** — Yazım hatası toleranslı akıllı komut eşleştirme |
| **Pipe Desteği** — Komut çıktısı yönlendirme ve filtreleme |
| **Context-Aware Yardım** — Cihaz bağlamına göre alt komut önerileri ve sözdizimi ipuçları |
| **Türkçe / İngilizce** — Tam iki dilli arayüz desteği |
| **Sürüklenebilir Pencereler** — Yeniden boyutlandırılabilir ve sürüklenebilir diyalog pencereleri |
| **Toast Bildirimleri** — Rahatsız etmeyen bildirim sistemi |
| **Klavye Kısayolları** — Tüm işlemler için tam klavye desteği |
| **ARIA / Erişilebilirlik** — ARIA etiketleri, ekran okuyucu desteği, yüksek kontrast modu |
| **Responsive Tasarım** — Mobil uyumlu düzen, adaptif kırılım noktaları |
| **Örnek Projeler** — Kılavuzlarla birlikte 46 önceden oluşturulmuş örnek proje |
| **Geri Alma / İleri Alma** — Tuval geçmişi takibi ile undo/redo |
| **Proje Kalıcılığı** — Tarayıcı depolama ile kaydet/yükle |

---

## İstatistikler (arşivlenmiş v2.0.0 özeti)

> Aşağıdaki değerler v2.0.0 dönemine aittir; güncel proje sayıları için README ve kaynak ağacını esas alın.

| Metrik | Değer |
|--------|-------|
| Toplam Kaynak Satırı (src/) | 103.245 |
| Kaynak Dosya | 286 |
| Dokümantasyon Dosyası | 16 |
| Örnek Proje | 46 |
| Rehberli Ders | 19 |
| Sınav | 6 |
| CLI Komutu | 450+ |
| Test Dosyası | 45 |
| Geçen Test | 517 |

---

*Bu dosya [doc/history.md](history.md) — Network Simulator proje değişiklik günlüğü.*
