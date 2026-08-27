# Network Simulator — Dokümantasyon

Bu klasör, Network Simulator projesi için hiyerarşik olarak düzenlenmiş tüm dokümantasyon dosyalarını içerir.

## Kanonik içerik düzeni

Benzer içerikler için tek birincil kaynak kullanılır; diğer belgeler aynı konunun kullanım senaryosu veya kısa özeti olarak değerlendirilir:

| Konu | Birincil kaynak | Tamamlayıcı kaynak |
|---|---|---|
| Uygulama kullanımı ve kısayollar | [USAGE.md](getting-started/USAGE.md) | [QUICK_REFERENCE.md](getting-started/QUICK_REFERENCE.md) |
| CLI komutları | [CLI_COMMANDS.md](cli/CLI_COMMANDS.md) | [CLI_GUIDED_TUTORIAL.md](cli/CLI_GUIDED_TUTORIAL.md) |
| Ağ yapılandırma rehberleri | `network/` altındaki konu dosyaları | [examples.md](reference/examples.md) |
| Tümleşik eğitim ve güncel özellikler | [NETWORK_SIMULATOR_KITAPCIK.md](training/NETWORK_SIMULATOR_KITAPCIK.md) | [ORNEK_LABLAR.md](training/ORNEK_LABLAR.md) |
| Özellik envanteri | [ProjeOzellikleri.md](training/ProjeOzellikleri.md) | [details.md](reference/details.md) |
| Geliştirici belgeleri | `development/` altındaki rehberler | [CONTRIBUTING.md](development/CONTRIBUTING.md) |

Yeni bilgi eklerken önce birincil kaynağa ekleyin; tamamlayıcı dosyada aynı metni kopyalamak yerine bağlantı ve kısa bağlam kullanın. Böylece komut, özellik ve örnek açıklamaları zamanla birbirinden ayrışmaz.

```
doc/
├── README.md                  ← Bu dosya (giriş ve harita)
├── DOCUMENTATION_INDEX.md     ← Master indeks (tüm dosyalar)
├── history.md                 ← Değişiklik geçmişi
│
├── getting-started/           ← Başlangıç seviyesi
│   ├── USAGE.md
│   └── QUICK_REFERENCE.md
│
├── cli/                       ← CLI komutları
│   ├── CLI_COMMANDS.md
│   └── CLI_GUIDED_TUTORIAL.md
│
├── network/                   ← Ağ yapılandırma
│   ├── WIRELESS_CONFIGURATION_GUIDE.md
│   ├── L3_SWITCH_CONFIGURATION.md
│   ├── ROOM_TRACKING_SETUP.md
│   └── GOOGLE_SHEETS_SETUP.md
│
├── development/               ← Geliştirme & entegrasyon
│   ├── ERROR_HANDLING_GUIDE.md
│   ├── INTEGRATION_GUIDE.md
│   └── CONTRIBUTING.md
│
├── training/                  ← Eğitim & referans
│   ├── NETWORK_SIMULATOR_KITAPCIK.md
│   └── ProjeOzellikleri.md
│
└── reference/                 ← Teknik referans
    ├── applicationProperties.md
    ├── examples.md
    └── details.md
```

---

## 📖 Kategoriler

### 🟢 Başlangıç (getting-started/)

| Dosya | Açıklama | Süre |
|-------|----------|------|
| [USAGE.md](getting-started/USAGE.md) | Kullanım kılavuzu, klavye kısayolları | 10 dk |
| [QUICK_REFERENCE.md](getting-started/QUICK_REFERENCE.md) | Hızlı referans ve kod parçacıkları | 5 dk |

### 🎓 CLI (cli/)

| Dosya | Açıklama | Süre |
|-------|----------|------|
| [CLI_COMMANDS.md](cli/CLI_COMMANDS.md) | CLI komut referansı | 15 dk |
| [CLI_GUIDED_TUTORIAL.md](cli/CLI_GUIDED_TUTORIAL.md) | 30 pratik rehberli ders | 2-3 saat |

### 📡 Ağ Yapılandırma (network/)

| Dosya | Açıklama | Süre |
|-------|----------|------|
| [WIRELESS_CONFIGURATION_GUIDE.md](network/WIRELESS_CONFIGURATION_GUIDE.md) | Kablosuz ağ yapılandırma (SSID, WPA, MAC filtreleme) | 20 dk |
| [L3_SWITCH_CONFIGURATION.md](network/L3_SWITCH_CONFIGURATION.md) | Layer 3 anahtarlama (no switchport, ip routing, SVI) | 15 dk |
| [ROOM_TRACKING_SETUP.md](network/ROOM_TRACKING_SETUP.md) | Oda takip sistemi kurulumu (Redis) | 10 dk |
| [GOOGLE_SHEETS_SETUP.md](network/GOOGLE_SHEETS_SETUP.md) | Google Sheets entegrasyonu | 15 dk |

### 🔧 Geliştirme (development/)

| Dosya | Açıklama | Süre |
|-------|----------|------|
| [ERROR_HANDLING_GUIDE.md](development/ERROR_HANDLING_GUIDE.md) | Detaylı hata kontrolü rehberi | 30 dk |
| [INTEGRATION_GUIDE.md](development/INTEGRATION_GUIDE.md) | Entegrasyon rehberi ve örnekleri | 20 dk |
| [CONTRIBUTING.md](development/CONTRIBUTING.md) | Katkı rehberi + agent konvansiyonları | 5 dk |

### 📘 Eğitim (training/)

| Dosya | Açıklama | Süre |
|-------|----------|------|
| [NETWORK_SIMULATOR_KITAPCIK.md](training/NETWORK_SIMULATOR_KITAPCIK.md) | Kapsamlı Türkçe eğitim kitapçığı | 60 dk |
| [ProjeOzellikleri.md](training/ProjeOzellikleri.md) | Tam özellik envanteri (TR/EN) | 10 dk |

### 📚 Teknik Referans (reference/)

| Dosya | Açıklama | Süre |
|-------|----------|------|
| [applicationProperties.md](reference/applicationProperties.md) | Kapsamlı özellik analizi (Tracer karşılaştırması) | 30 dk |
| [examples.md](reference/examples.md) | Örnek projeler (temel, orta, ileri, sorun giderme) | 45 dk |
| [details.md](reference/details.md) | Sürüm detayları ve değişiklik günlüğü | 10 dk |

---

## 🎯 Okuma Haritası

### 🟢 Başlangıç (Yeni Kullanıcılar)
```
getting-started/USAGE.md (10 min)
   ↓
cli/CLI_GUIDED_TUTORIAL.md - Ders 1-5 (30 min)
   ↓
Pratik yapın
```

### 🟡 Orta Seviye (CLI Komutları)
```
cli/CLI_GUIDED_TUTORIAL.md - Ders 6-15 (1 saat)
   ↓
cli/CLI_COMMANDS.md (15 min)
   ↓
Ağ konfigürasyonu yapın
```

### 🟠 İleri Seviye (Yönlendirme & Güvenlik)
```
cli/CLI_GUIDED_TUTORIAL.md - Ders 16-30 (1 saat)
   ↓
network/WIRELESS_CONFIGURATION_GUIDE.md (20 min)
   ↓
network/L3_SWITCH_CONFIGURATION.md (15 min)
```

### 🔴 Uzman Seviye (Derinlemesine)
```
development/ERROR_HANDLING_GUIDE.md (30 min)
   ↓
development/INTEGRATION_GUIDE.md (20 min)
   ↓
Kaynak kodları inceleyin
```

---

## 📞 Yardım

| Soru | Cevap |
|------|-------|
| Nereden başlamalıyım? | `getting-started/USAGE.md` okuyun |
| Hızlı cevap istiyorum | `getting-started/QUICK_REFERENCE.md`'ye bakın |
| Kod örneği istiyorum | `development/INTEGRATION_GUIDE.md`'de var |
| Detaylı bilgi istiyorum | `development/ERROR_HANDLING_GUIDE.md` okuyun |
| Dokümantasyon haritası | `DOCUMENTATION_INDEX.md` okuyun |
| Komutları öğrenmek istiyorum | `cli/CLI_COMMANDS.md` okuyun |
| Kablosuz ağ yapılandırması | `network/WIRELESS_CONFIGURATION_GUIDE.md` okuyun |
| L3 anahtarlama | `network/L3_SWITCH_CONFIGURATION.md` okuyun |
| Google Sheets kurulumu | `network/GOOGLE_SHEETS_SETUP.md` okuyun |
| Eğitim kitapçığı | `training/NETWORK_SIMULATOR_KITAPCIK.md` okuyun |
| Proje özellikleri | `training/ProjeOzellikleri.md` okuyun |

---

## 📊 Proje Özeti

| Metrik | Değer |
|--------|-------|
| **Dokümantasyon Sayfaları** | 19 (6 kategoride) |
| **Toplam Okuma Süresi** | ~350 dakika |
| **Toplam Kaynak Satırı** | 111.140 |
| **Testler** | Vitest ile unit, integration, accessibility, performance ve E2E senaryoları |

---

## ✨ Tamamlanan Özellikler (v2.0.0)

**Sektörel & Eğitim**
✅ Sektörel Senaryolar (SOHO, Hastane, Okul, E-Ticaret)
✅ Sesli Anlatım / TTS (Rehberli Mod)
✅ PDF Başarı Sertifikaları
✅ IPv6 Master Lab (OSPFv3 + ACL dual-stack)
✅ Gelişmiş Arıza Giderme (Trunk / OSPF)
✅ Rehberli Mod & Eğitim Sihirbazı
✅ CLI Rehberli Dersler
✅ "Bana Öğret" Rehberli Dersleri (Temel / Orta / İleri)
✅ PC Tabanlı Arıza Giderme & Otomatik Komut Yazdırma
✅ Akıllı CLI Asistanı
✅ Kapsamlı Türkçe Eğitim Kitapçığı
✅ Sınav Modu & Sınav İçe Aktarma
✅ Başarım Sistemi (Rozetler)

**Ağ & Protokol (CCNA 200-301 Destekli)**
✅ ACL Standard (1-99) & Extended (100-199), IPv6 ACLs
✅ NAT Static/Dynamic/PAT (port kolonlu `show ip nat translations`)
✅ SLAAC IPv6 Otomatik Adresleme (`no ipv6 nd suppress-ra` & EUI-64)
✅ AAA New Model, RADIUS & TACACS+ Sunucu Yönetimi
✅ OSPF Multi-Area (Area 0/10/20, ABR, NSSA/Stub)
✅ EIGRP Dinamik Yönlendirme (DUAL Motoru & Feasibility Condition)
✅ BGP Dinamik Komşuluk Durumu (`Established` / `Idle` Eşleşmesi)
✅ Rota Yeniden Dağıtımı (Redistribute OSPF/RIP/EIGRP/BGP/Static/Connected)
✅ HSRP & VRRP Birinci Hop Yedeklilik Protocols
✅ IPv6 Adresleme, DHCPv6, RIPng & OSPFv3
✅ Seri / WAN (HDLC, PPP, PAP/CHAP, DCE/DTE)
✅ WLC & AP Yönetimi (dot11, WLAN, auth-mac, WPA2/WPA3)
✅ L3 Anahtarlama, STP / PVST+ & MSTP (Multiple Spanning Tree)
✅ Port Security (Sticky MAC), DHCP Snooping, DAI, IP Source Guard

**Servisler**
✅ PC Servisler (FTP, Mail, NTP, DNS, HTTP, DHCP)
✅ Güvenlik Duvarı Servis Entegrasyonu
✅ Oda Takip Sistemi (Room Tracking + Redis)
✅ Google Sheets Entegrasyonu

**UI & UX**
✅ PNG 300 DPI Export (kablo renkleri, port etiketleri, notlar)
✅ Mobil PNG Paylaşımı (Web Share API)
✅ Gelişmiş İşlem Geçmişi (Timeline + localStorage)
✅ Kablo Kes/Onar (Unplug/PlugZap)
✅ Protokol Durum Paneli (Özet sekmesine entegre)
✅ Kablosuz Gösterge Paneli
✅ IoT Panel Sekmeleri & Sensör Geliştirmeleri
✅ Pencere Notları & Drag-Resize
✅ API Hız Sınırlama
✅ Kapsamlı CLI Komut Referansı

---

## 🔐 Güvenlik

✅ Giriş validasyonu
✅ Zaman aşımı işleme
✅ Hata detaylarının sınırlandırılması
✅ XSS koruması
✅ CSRF koruması

---

## 🌍 Dil Desteği

✅ Türkçe (tr)
✅ İngilizce (en)

---

*Tüm dokümantasyon dosyaları `doc/` klasörü altında kategorilere ayrılmıştır.*
