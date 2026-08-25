# 📦 Paket Yakalama Kılavuzu / Packet Capture Guide

Network Simulator'ın **Paket Yakalama Paneli**, ağ trafiğini gelişmiş bir analizör arayüzünde gerçek zamanlı izlemenizi sağlar.

---

## 🖥️ Paneli Açma

- Üst araç çubuğundaki **Paket Yakalama** (Packet Capture) butonuna tıklayın.
- Ya da bir kablo üzerine sağ tıklayıp "Paket Yakalama" seçeneğini seçin.

---

## 📋 Panel Sütunları

| Sütun | Açıklama |
|---|---|
| **#** | Paket sıra numarası |
| **Zaman (Time)** | Paketin yakalandığı zaman damgası |
| **Kaynak (Source)** | Kaynak IP adresi |
| **Hedef (Destination)** | Hedef IP adresi |
| **Protokol** | Protokol adı ve numarası (ör. `ICMP (1)`, `STP (0x4242)`) |
| **Uzunluk (Length)** | Paket boyutu (byte) |
| **Bilgi (Info)** | Paketle ilgili özet bilgi |

---

## 🔢 Protokol Numaraları

Protokol sütununda protokol adının yanında standart numara parantez içinde gösterilir:

| Protokol | Gösterim | Açıklama |
|---|---|---|
| ICMP | `ICMP (1)` | IPv4 kontrol mesajları |
| TCP | `TCP (6)` | İletim kontrolü |
| UDP | `UDP (17)` | Kullanıcı datagram |
| HTTP | `HTTP (80)` | Web tarayıcı / HTTP istek ve yanıtları |
| FTP | `FTP (21)` | Dosya transfer istemci/sunucu istekleri |
| SMTP | `SMTP (25)` | E-posta gönderme istekleri |
| POP3 | `POP3 (110)` | E-posta alma/görüntüleme istekleri |
| DNS | `DNS (53)` | Domain isim sorgusu (A, AAAA, MX, PTR) |
| DHCP | `DHCP (67)` | Otomatik IP kiralama (Discover, Offer, Request, ACK) |
| SSH | `SSH (22)` | Güvenli kabuk erişimi |
| TELNET | `TELNET (23)` | Uzaktan komut satırı erişimi |
| OSPF | `OSPF (89)` | OSPF yönlendirme |
| EIGRP | `EIGRP (88)` | EIGRP yönlendirme |
| GRE | `GRE (47)` | Tünel kapsülleme |
| ICMPv6 | `ICMPv6 (58)` | IPv6 kontrol mesajları |
| ARP | `ARP (0x0806)` | Adres çözümleme |
| RARP | `RARP (0x8035)` | Ters adres çözümleme |
| STP | `STP (0x4242)` | Spanning Tree |

---

## 🔍 Arama ve Filtreleme

### Arama Çubuğu (Include Filter)
Paket listesini IP, protokol adı veya bilgi alanına göre filtrele:
```
192.168.1.1        → Bu IP'yi içeren paketler
ICMP               → Yalnızca ICMP paketleri
ARP Request        → ARP istek paketleri
```

### Dışlama Filtresi (Exclude Filter)
İstemediğiniz paket türlerini gizlemek için virgül veya boşlukla ayrılmış terimler girin:
```
cdp, stp           → CDP ve STP paketlerini gizle
arp stp cdp        → ARP, STP ve CDP paketlerini gizle
OSPF, EIGRP, RIP   → Routing protokol paketlerini gizle
```
> **İpucu:** Dışlama filtresi büyük/küçük harf duyarsızdır.

---

## 📄 Sayfalama (Pagination)

- Panel sayfa başına **10 paket** gösterir.
- Alttaki `◀ Önceki / Sonraki ▶` butonlarıyla gezin.
- Sağ üstte toplam paket sayısı ve mevcut sayfa gösterilir.

---

## 🌐 Arka Plan Ağ Trafiği (Background Network Activity)

Simülatör, gerçek ağlarda otomatik olarak oluşan aşağıdaki paketleri **otomatik yakalar**:

| Paket Türü | Tetikleyici | Periyot |
|---|---|---|
| **DHCP Discover** | PC DHCP modundayken | Başlangıçta |
| **DHCP Offer** | DHCP sunucu yanıtı | Başlangıçta |
| **DHCP Request** | PC IP alırken | Başlangıçta |
| **DHCP ACK** | Sunucu onayı | Başlangıçta |
| **STP BPDU** | Switch'ler arası STP | Periyodik |
| **CDP** | Cihazlar arası keşif | Periyodik |
| **OSPF Hello** | OSPF komşu bulma | Periyodik |
| **RIP Update** | RIP yönlendirme güncellemesi | Periyodik |
| **EIGRP Update** | EIGRP yönlendirme güncellemesi | Periyodik |
| **WLAN Beacon** | Access Point yayını | Periyodik |
| **ARP Request** | Ping öncesi MAC çözümleme | Ping başında |
| **ARP Reply** | MAC adresi yanıtı | Ping başında |

> Bu paketler gerçek ağ simülasyonunu olabildiğince gerçekçi kılar. Bunları görmek istemiyorsanız dışlama filtresini kullanın.

---

## 🏃 Canlı Yakalama Senaryosu

**Örnek: Ping Trafiğini İzleme**

1. Paket Yakalama panelini açın
2. Arama kutusuna `ICMP` yazın
3. Bir PC'den başka bir PC'ye ping gönderin (sağ tık → Ping)
4. ARP Request, ARP Reply, ICMP Echo Request ve ICMP Echo Reply paketlerinin sırayla göründüğünü izleyin

**Örnek: OSPF Komşuluğunu İzleme**

1. Dışlama filtresine `cdp, stp, arp` yazın
2. Arama kutusuna `OSPF` yazın
3. Router'lara OSPF konfigürasyonu uygulayın
4. OSPF Hello paketlerinin periyodik olarak göründüğünü izleyin

---

## 💡 İpuçları

- Paket yakalamayı belirli bir kablo/bağlantıya özel başlatmak için o kabloya sağ tıklayın.
- Yüksek trafik senaryolarında dışlama filtresi arama performansını artırır.
- Ping animasyonu sırasında **N** tuşuna basarak hop-hop ilerleme yapabilirsiniz; her hop PDU Analiz panelinde detaylandırılır.

---

## 📘 İlgili Dokümanlar

- [USAGE.md](USAGE.md) — Genel kullanım kılavuzu
- [CLI_COMMANDS.md](../cli/CLI_COMMANDS.md) — CLI komut referansı
