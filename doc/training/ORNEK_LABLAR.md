# 🧪 Örnek Laboratuvarlar (Example Labs)

Bu belge, Network Simulator'daki başlıca özelliklerin **çalışan, uçtan uca örneklerini** içerir.
Her örnek kopyalanıp yapıştırılabilir komut zincirleri ve beklenen çıktılarıyla verilir.
Kitapçık (`NETWORK_SIMULATOR_KITAPCIK.md`) ve özellik envanteri (`ProjeOzellikleri.md`) ile birlikte kullanılır.

> Komut sözdiziminin kanonik kaynağı [CLI_COMMANDS.md](../cli/CLI_COMMANDS.md), genel kullanımın kanonik kaynağı [USAGE.md](../getting-started/USAGE.md)'dir. Bu dosya yalnızca laboratuvar akışlarını ve beklenen sonuçları içerir.

> Tüm örnekler gerçek simülasyon motoruyla uyumludur (CCNA 200-301 müfredatı).

---

## 1. SSH Tam Akışı (Güvenli Yönetim)

**Topoloji:** `R1` + `PC-1`, `PC-1 Eth0 → R1 Gi0/0` (düz kablo).

```
R1> enable
R1# configure terminal
R1(config)# hostname R1
R1(config)# ip domain-name lab.local
R1(config)# crypto key generate rsa modulus 2048
R1(config)# ip ssh version 2
R1(config)# username admin privilege 15 secret 1234
R1(config)# enable secret 123
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh
R1(config-line)# exit
R1(config)# interface gi0/0
R1(config-if)# ip address 192.168.1.150 255.255.255.0
R1(config-if)# no shutdown
```

**PC-1:** IP `192.168.1.10/24`, Gateway `192.168.1.150`.

```
C:\> ssh admin@192.168.1.150
Password: 1234
R1>
```

**Doğrulama (R1):**
```
R1# show ssh
Active SSH Sessions: 1
Session   User       Source
1         admin      vty0

R1# show ip ssh
SSH Version: 2
SSH Status: enabled
VTY Transport Input: ssh
```

> Not: `username <kullanıcı> privilege 15 secret <parola>` hem ayrıcalık hem parolayı birlikte saklar;
> `login local` ile SSH parola doğrulaması bu yerel kullanıcı veritabanına karşı yapılır.

---

## 2. Subnetting Yardımcısı (Etkileşimli Panel)

**Nerede:** PC → Ayarlar (Settings) sekmesi → **Subnetting Yardımcısı**.

**Girdi:** IP `192.168.1.10`, Mask `255.255.255.0` (veya `/24`).

| Alan | Değer |
|------|-------|
| Ağ (Network) | `192.168.1.0/24` |
| Broadcast | `192.168.1.255` |
| İlk host | `192.168.1.1` |
| Son host | `192.168.1.254` |
| Kullanılabilir host | `254` |
| Toplam adres | `256` |
| Wildcard mask | `0.0.0.255` |
| Subnet mask | `255.255.255.0` |

**CLI karşılığı — `show ip interface brief`:**
```
Interface              IP-Address      OK? Method Status                Protocol
Gi0/0                  192.168.1.150   YES manual up                    up
  Subnet: 192.168.1.0/24  Broadcast: 192.168.1.255  Hosts: 192.168.1.1-192.168.1.254 (254)
```

---

## 3. VLAN ve Trunk

```
Switch> enable
Switch# configure terminal
Switch(config)# vlan 10
Switch(config-vlan)# name VLAN10
Switch(config-vlan)# exit
Switch(config)# vlan 20
Switch(config-vlan)# name VLAN20
Switch(config-vlan)# exit
Switch(config)# interface fa0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config-if)# exit
Switch(config)# interface gi0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20
```

**Doğrulama:** `show vlan brief`, `show interfaces trunk`.

---

## 4. OSPF (Multi-Area)

```
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
R1(config-router)# passive-interface fa0/2
R1(config-router)# default-information originate
```

**Doğrulama:** `show ip ospf neighbor`, `show ip route`, `show ip protocols`.

---

## 5. DHCP Sunucu

```
R1(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.10
R1(config)# ip dhcp pool LAN
R1(dhcp-config)# network 192.168.1.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.1.1
R1(dhcp-config)# dns-server 8.8.8.8
R1(dhcp-config)# exit
```

İstemci PC'de IP yapılandırmasını "DHCP" moduna alıp `ipconfig /renew` (PC CMD) çalıştırın.

---

## 6. NAT / PAT (Overload)

```
R1(config)# interface gi0/0
R1(config-if)# ip nat inside
R1(config-if)# interface gi0/1
R1(config-if)# ip nat outside
R1(config-if)# exit
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface gi0/1 overload
```

**Doğrulama:** `show ip nat translations`, `show ip nat statistics`.

---

## 7. Standart / Genişletilmiş ACL

```
R1(config)# access-list 10 deny 192.168.1.0 0.0.0.255
R1(config)# access-list 10 permit any
R1(config)# interface gi0/0
R1(config-if)# ip access-group 10 in
```

---

## 8. EtherChannel (LACP)

```
Switch(config)# interface range gi0/1 - 2
Switch(config-if-range)# channel-group 1 mode active
Switch(config-if-range)# exit
Switch(config)# show etherchannel summary
```

---

## 9. HSRP (Yedeklilik)

```
R1(config)# interface gi0/0
R1(config-if)# standby 1 ip 192.168.1.1
R1(config-if)# standby 1 priority 110
R1(config-if)# standby 1 preempt
```

**Doğrulama:** `show standby`.

---

## 10. Kablosuz (WLC + AP + WPA2)

- WLC üzerinde SSID oluşturun, `WPA2-PSK` kimlik doğrulaması ve parola belirleyin.
- AP'yi CAPWAP ile WLC'ye kaydedin.
- PC/Wireless sekmesinden SSID'ye bağlanıp WPA2 parolasını girin.

**Doğrulama:** `show wireless summary`, `show ap summary`.

---

## 11. Sık Kullanılan Gösterim (Show) Komutları

| Komut | Açıklama |
|-------|----------|
| `show ip interface brief` | Arayüz IP özeti + subnet bilgisi |
| `show ip ssh` | SSH yapılandırma/statü |
| `show ssh` | Aktif SSH oturumları |
| `show vlan brief` | VLAN listesi |
| `show interfaces trunk` | Trunk portları |
| `show ip ospf neighbor` | OSPF komşuları |
| `show ip route` | Yönlendirme tablosu |
| `show etherchannel summary` | EtherChannel özeti |
| `show standby` | HSRP durumu |
| `show ip nat translations` | NAT çevirileri |

---

*Bu örnekler, `doc/training/NETWORK_SIMULATOR_KITAPCIK.md` (Ders 1-30) ve
`doc/training/ProjeOzellikleri.md` (özellik envanteri) ile bütünlenir.*
