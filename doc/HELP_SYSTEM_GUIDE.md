# Komut Yardım Sistemi Rehberi

## Genel Bakış

Network Simulator'da `?` karakteri girildiğinde, mevcut komut moduna göre kullanılabilir komutlar ve parametreler hakkında detaylı yardım gösterilir.

## Yardım Sisteminin Özellikleri

### 1. **Komut Kategorilendirmesi**
Yardım çıktısı iki ana kategoriye ayrılır:

- **Komutlar (Commands)**: Çalıştırılabilir komutlar
- **Parametreler (Parameters)**: Komutlara geçilecek argümanlar (açı parantez içinde gösterilir)

### 2. **Komut Açıklamaları**
Her komut, Türkçe ve İngilizce açıklamalarla birlikte gösterilir:

```
  Komutlar:
    enable               - Ayrıcalıklı moda geç (Enable privileged mode)
    exit                 - Oturumu kapat (Exit session)
    show                 - Cihaz bilgilerini göster (Display device information)
```

### 3. **Mod Bazlı Yardım**
Farklı modlarda farklı komutlar kullanılabilir:

- **User Mode** (`>` prompt): Temel komutlar
- **Privileged Mode** (`#` prompt): Yapılandırma ve yönetim komutları
- **Config Mode** (`(config)#` prompt): Cihaz yapılandırması
- **Interface Mode** (`(config-if)#` prompt): Arayüz yapılandırması
- **VLAN Mode** (`(config-vlan)#` prompt): VLAN yapılandırması
- **Line Mode** (`(config-line)#` prompt): Hat yapılandırması
- **Router Config Mode** (`(config-router)#` prompt): Router yapılandırması
- **DHCP Config Mode** (`(dhcp-config)#` prompt): DHCP yapılandırması

## Kullanım Örnekleri

### Örnek 1: Temel Yardım
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

### Örnek 2: Kısmi Komut Yardımı
```
Switch> sh?
  Komutlar:
    show                 - Cihaz bilgilerini göster (Display device information)
    ssh                  - SSH ile uzak cihaza bağlan (Connect to remote device via SSH)
```

### Örnek 3: Alt Komut Yardımı
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

### Örnek 4: Parametreli Komut Yardımı
```
Switch# ping ?
  Parametreler:
    <ip-address>         - Hedef IP adresi
    <hostname>           - Hedef cihaz adı
```

### Örnek 5: Yapılandırma Modunda Yardım
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

### Örnek 6: Arayüz Modunda Yardım
```
Switch(config-if)# ?
  Komutlar:
    shutdown             - Arayüzü kapat (Disable interface)
    no                   - Komutu iptal et (Negate command)
    speed                - Bağlantı hızını ayarla (Set connection speed)
    duplex               - Duplex modunu ayarla (Set duplex mode)
    description          - Arayüz açıklaması ekle (Add interface description)
    switchport           - Switch portu ayarları (Switchport settings)
    cdp                  - CDP ayarları (CDP settings)
    spanning-tree        - Spanning Tree ayarları (Spanning Tree settings)
    channel-group        - EtherChannel grubu ayarla (Set EtherChannel group)
    ip                   - IP protokolü ayarları (IP protocol settings)
    exit                 - Arayüz yapılandırmasından çık (Exit interface configuration)
    end                  - Yapılandırma modundan çık (Exit configuration mode)
    do                   - Ayrıcalıklı komut çalıştır (Execute privileged command)
```

## Yardım Sistemi Mimarisi

### Komut Ağacı (Command Tree)
Sistem, her mod için bir komut ağacı tutar:

```typescript
const commandHelp: Record<string, Record<string, string[]>> = {
  user: { /* user mode commands */ },
  privileged: { /* privileged mode commands */ },
  config: { /* config mode commands */ },
  interface: { /* interface mode commands */ },
  // ... diğer modlar
};
```

### Komut Açıklamaları (Command Descriptions)
Her komut için Türkçe ve İngilizce açıklamalar:

```typescript
const commandDescriptions: Record<string, Record<string, string>> = {
  user: {
    'enable': 'Ayrıcalıklı moda geç (Enable privileged mode)',
    'exit': 'Oturumu kapat (Exit session)',
    // ...
  },
  // ... diğer modlar
};
```

### Yardım Fonksiyonu
`getInlineHelp()` fonksiyonu:

1. Mevcut modu belirler
2. Kısmi giriş ile eşleşen komutları bulur
3. Komutları kategorilere ayırır (komutlar vs parametreler)
4. Her komut için açıklamayı ekler
5. Biçimlendirilmiş çıktı döndürür

## Desteklenen Modlar ve Komutları

### User Mode
- `enable` - Ayrıcalıklı moda geç
- `exit` - Oturumu kapat
- `show` - Cihaz bilgilerini göster
- `ping` - Ağ bağlantısını test et
- `telnet` - Telnet bağlantısı
- `ssh` - SSH bağlantısı
- `traceroute` - Rota izleme

### Privileged Mode
- `configure` - Yapılandırma moduna gir
- `disable` - Ayrıcalıklı moddan çık
- `show` - Cihaz bilgilerini göster
- `clear` - Önbelleği temizle
- `debug` - Hata ayıklama
- `write` - Yapılandırmayı kaydet
- `reload` - Cihazı yeniden başlat
- `copy` - Dosya kopyala
- `erase` - Dosya sil
- `delete` - Dosya sil

### Config Mode
- `hostname` - Cihaz adı
- `interface` - Arayüz yapılandırması
- `vlan` - VLAN yapılandırması
- `enable` - Enable şifresi
- `username` - Kullanıcı adı
- `line` - Hat yapılandırması
- `banner` - Başlık mesajı
- `ip` - IP ayarları
- `ipv6` - IPv6 ayarları
- `spanning-tree` - Spanning Tree
- `vtp` - VLAN Trunking Protocol
- `cdp` - CDP ayarları

### Interface Mode
- `shutdown` - Arayüzü kapat
- `speed` - Bağlantı hızı
- `duplex` - Duplex modu
- `description` - Açıklama
- `switchport` - Switch portu ayarları
- `ip` - IP ayarları
- `spanning-tree` - Spanning Tree
- `channel-group` - EtherChannel

### VLAN Mode
- `name` - VLAN adı
- `state` - VLAN durumu

### Line Mode
- `password` - Hat şifresi
- `login` - Giriş etkinleştir
- `transport` - Taşıma protokolü
- `exec-timeout` - Oturum zaman aşımı

### Router Config Mode
- `network` - Ağ tanımı
- `router-id` - Router kimliği
- `passive-interface` - Pasif arayüz

### DHCP Config Mode
- `network` - DHCP ağı
- `address` - IP adresi aralığı
- `default-router` - Varsayılan ağ geçidi
- `dns-server` - DNS sunucusu
- `lease` - Kira süresi

## Geliştirme Notları

### Yeni Komut Ekleme
Yeni bir komut eklemek için:

1. `commandHelp` ağacına komut ekleyin
2. `commandDescriptions` haritasına açıklama ekleyin
3. Komut işleyicisini uygulayın

### Yeni Mod Ekleme
Yeni bir mod eklemek için:

1. `CommandMode` türüne yeni mod ekleyin
2. `commandHelp` haritasına yeni mod ekleyin
3. `commandDescriptions` haritasına yeni mod ekleyin
4. Mod işleyicisini uygulayın

## Performans Notları

- Yardım sistemi, komut ağacını önbelleğe alır
- Açıklamalar statik olarak tanımlanır
- Yardım çıktısı gerçek zamanlı olarak oluşturulur

## Gelecek İyileştirmeler

- [ ] Komut örnekleri ekleme
- [ ] Komut sözdizimi gösterme
- [ ] Komut kategorilendirmesi
- [ ] Arama işlevi
- [ ] Komut geçmişi
- [ ] Komut tamamlama
