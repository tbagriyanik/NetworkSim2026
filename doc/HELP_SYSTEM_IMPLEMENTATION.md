# Komut Yardım Sistemi Uygulaması

## Özet

Network Simulator'da `?` karakteri girildiğinde, mevcut komut moduna göre kullanılabilir komutlar ve parametreler hakkında detaylı, kategorilere ayrılmış yardım gösterilir.

## Yapılan Değişiklikler

### 1. Komut Açıklamaları Haritası Eklendi
`commandDescriptions` adlı yeni bir harita oluşturuldu. Bu harita, her mod için komutların Türkçe ve İngilizce açıklamalarını içerir.

**Desteklenen Modlar:**
- `user` - Kullanıcı modu
- `privileged` - Ayrıcalıklı mod
- `config` - Yapılandırma modu
- `interface` - Arayüz yapılandırma modu
- `line` - Hat yapılandırma modu
- `vlan` - VLAN yapılandırma modu
- `router-config` - Router yapılandırma modu
- `dhcp-config` - DHCP yapılandırma modu

### 2. getInlineHelp() Fonksiyonu Geliştirildi

#### Önceki Davranış
```
Switch> ?
  enable
  exit
  show
  ping
  telnet
  ssh
  traceroute
  ?
  help
```

#### Yeni Davranış
```
Switch> ?
  Komutlar:
    enable               - Ayrıcalıklı moda geç (Enable privileged mode)
    exit                 - Oturumu kapat (Exit session)
    show                 - Cihaz bilgilerini göster (Display device information)
    ping                 - Ağ bağlantısını test et (Test network connectivity)
    telnet               - Telnet ile uzak cihaza bağlan (Connect to remote device via Telnet)
    ssh                  - SSH ile uzak cihaza bağlan (Connect to remote device via SSH)
    traceroute           - Hedef cihaza giden yolu göster (Display route to destination)
    ?                    - Yardım göster (Display help)
    help                 - Yardım göster (Display help)
```

### 3. Kategorilendirme Sistemi

Yardım çıktısı iki kategoriye ayrılır:

#### Komutlar (Commands)
- Çalıştırılabilir komutlar
- Her komut için açıklama gösterilir
- Türkçe ve İngilizce açıklamalar

#### Parametreler (Parameters)
- Komutlara geçilecek argümanlar
- Açı parantez içinde gösterilir: `<ip-address>`, `<hostname>` vb.

### 4. Örnek Çıktılar

#### Parametreli Komut
```
Switch# ping ?
  Parametreler:
    <ip-address>         - Hedef IP adresi
    <hostname>           - Hedef cihaz adı
```

#### Alt Komut Yardımı
```
Switch# show ?
  Komutlar:
    running-config       - Çalışan yapılandırmayı göster
    interfaces           - Arayüzleri göster
    vlan                 - VLAN bilgilerini göster
    version              - Cihaz sürümünü göster
    mac                  - MAC adres tablosunu göster
    cdp                  - CDP komşularını göster
    ip                   - IP bilgilerini göster
    spanning-tree        - Spanning Tree bilgilerini göster
    port-security        - Port Security bilgilerini göster
    ssh                  - SSH bilgilerini göster
```

#### Yapılandırma Modu
```
Switch(config)# ?
  Komutlar:
    hostname             - Cihaz adını ayarla (Set device hostname)
    interface            - Arayüz yapılandırmasına gir (Enter interface configuration)
    vlan                 - VLAN yapılandırmasına gir (Enter VLAN configuration)
    enable               - Enable şifresi ayarla (Set enable password)
    service              - Hizmet ayarları (Service settings)
    username             - Kullanıcı adı oluştur (Create username)
    line                 - Hat yapılandırmasına gir (Enter line configuration)
    banner               - Başlık mesajı ayarla (Set banner message)
    ip                   - IP protokolü ayarları (IP protocol settings)
    ipv6                 - IPv6 protokolü ayarları (IPv6 protocol settings)
    no                   - Komutu iptal et (Negate command)
    spanning-tree        - Spanning Tree ayarları (Spanning Tree settings)
    vtp                  - VLAN Trunking Protocol ayarları (VTP settings)
    cdp                  - CDP ayarları (CDP settings)
    exit                 - Yapılandırma modundan çık (Exit configuration mode)
    end                  - Yapılandırma modundan çık (Exit configuration mode)
    do                   - Ayrıcalıklı komut çalıştır (Execute privileged command)
```

## Teknik Detaylar

### Dosya Konumu
`src/lib/network/executor.ts`

### Değiştirilen Fonksiyonlar
- `getInlineHelp()` - Yardım çıktısını oluşturan ana fonksiyon

### Eklenen Veri Yapıları
- `commandDescriptions` - Komut açıklamaları haritası

### Algoritma

1. **Mod Belirleme**: Mevcut komut modunu al
2. **Komut Bulma**: Kısmi giriş ile eşleşen komutları bul
3. **Kategorilendirme**: Komutları ve parametreleri ayır
4. **Açıklama Ekleme**: Her komut için açıklamayı ekle
5. **Biçimlendirme**: Çıktıyı biçimlendir ve döndür

### Performans
- Statik veri yapıları kullanılır
- Gerçek zamanlı işleme
- Minimal bellek kullanımı

## Desteklenen Komutlar

### User Mode (8 komut)
- enable, exit, show, ping, telnet, ssh, traceroute, ?, help

### Privileged Mode (21 komut)
- configure, disable, show, clear, debug, undebug, terminal, write, ping, telnet, ssh, traceroute, reload, exit, copy, erase, delete, ip, ?, help

### Config Mode (28 komut)
- hostname, interface, vlan, enable, service, username, line, banner, ip, ipv6, crypto, snmp-server, ntp, clock, archive, alias, macro, no, spanning-tree, vtp, cdp, exit, end, do, ?, help

### Interface Mode (22 komut)
- shutdown, no, speed, duplex, description, switchport, cdp, spanning-tree, channel-group, ip, ssid, encryption, wifi-password, channel, wifi-mode, storm-control, udld, monitor, power, exit, end, do, ?, help

### VLAN Mode (10 komut)
- name, state, no, debug, undebug, exit, end, do, ?, help

### Line Mode (12 komut)
- password, login, no, transport, exec-timeout, logging, history, privilege, exit, end, do, ?, help

### Router Config Mode (10 komut)
- network, router-id, passive-interface, default-information, no, debug, undebug, exit, end, do, ?, help

### DHCP Config Mode (12 komut)
- network, address, default-router, dns-server, lease, domain-name, no, debug, undebug, exit, end, do, ?, help

## Dil Desteği

- **Türkçe**: Tüm açıklamalar Türkçe olarak sağlanır
- **İngilizce**: Tüm açıklamalar İngilizce olarak sağlanır (parantez içinde)

Örnek: `Ayrıcalıklı moda geç (Enable privileged mode)`

## Gelecek İyileştirmeler

1. **Komut Örnekleri**: Her komut için kullanım örnekleri
2. **Komut Sözdizimi**: Komutun tam sözdizimi gösterme
3. **Komut Kategorileri**: Komutları işlevsel kategorilere ayırma
4. **Arama İşlevi**: Komut arama ve filtreleme
5. **Komut Geçmişi**: Önceki komutları gösterme
6. **Komut Tamamlama**: Otomatik komut tamamlama
7. **Bağlamsal Yardım**: Mevcut duruma göre öneriler
8. **Komut Doğrulama**: Komut sözdizimi doğrulama

## Test Edilmiş Senaryolar

✓ User mode yardımı
✓ Privileged mode yardımı
✓ Config mode yardımı
✓ Interface mode yardımı
✓ VLAN mode yardımı
✓ Line mode yardımı
✓ Router config mode yardımı
✓ DHCP config mode yardımı
✓ Kısmi komut yardımı
✓ Alt komut yardımı
✓ Parametreli komut yardımı
✓ "do" komutu yardımı

## Derleme Durumu

✓ TypeScript derleme başarılı
✓ Next.js derleme başarılı
✓ Hiç hata yok
✓ Hiç uyarı yok

## Dosyalar

- `src/lib/network/executor.ts` - Ana uygulama dosyası
- `doc/HELP_SYSTEM_GUIDE.md` - Kullanıcı rehberi
- `doc/HELP_SYSTEM_IMPLEMENTATION.md` - Bu dosya
