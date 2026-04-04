# Reload Komutu - Doğrudan Yürütme

## Özet

`reload` komutu artık onay diyaloğu göstermeden doğrudan çalışıyor. Kullanıcılar privileged modda `reload` yazdığında, cihaz onay istemeden hemen yeniden başlıyor.

## Kullanıcı Deneyimi

### Önce
```
Switch#reload
Proceed with reload? [confirm]
[Kullanıcı Enter'a basmalı veya 'confirm' yazmalı]
Reloading...
```

### Sonra
```
Switch#reload
Reloading...
```

## Yapılan Değişiklikler

### 1. Privileged Commands Handler
- `requiresReloadConfirm: true` kaldırıldı
- Artık sadece `reloadDevice: true` döndürüyor

### 2. useDeviceManager Hook
- Reload onay işleme bloğu tamamen kaldırıldı
- Confirm dialog gösterme mantığı silindi

### 3. Terminal Component
- `isReloadConfirmationPending` değişkeni kaldırıldı
- Inline reload onay işleme kaldırıldı
- ESC tuşu reload onay mantığı temizlendi
- UI elementleri sadeleştirildi

## Avantajlar

1. **Daha Hızlı İş Akışı**: İki kez Enter basmaya gerek yok
2. **Daha Gerçekçi**: Bazı gerçek cihazlarının simülasyon moduyla eşleşiyor
3. **Daha Temiz UI**: Gereksiz diyalog kesintisi kaldırıldı
4. **Tutarlı**: Diğer yıkıcı komutlar hala uygun yerlerde onay gerektiriyor

## Hala Onay Gerektiren Komutlar

- ✅ `erase startup-config`
- ✅ `write memory` (belirli bağlamlarda)
- ✅ Şifre istemleri
- ✅ Diğer komutlardan genel onay diyalogları

## ESC Tuşu Davranışı

ESC tuşu hala çalışıyor:
- ✅ Şifre istemlerini iptal eder
- ✅ Uzun süren komutları iptal eder
- ❌ Reload artık onay istemediği için bu durum geçerli değil

## Test Kontrol Listesi

- [x] `reload` komutu anında çalışıyor
- [x] Onay diyaloğu görünmüyor
- [x] Cihaz gerçekten yeniden başlıyor (state sıfırlanıyor)
- [x] "Reloading..." mesajı gösteriliyor
- [x] ESC tuşu şifre iptali için hala çalışıyor
- [x] ESC tuşu uzun süren komutları iptal etmek için hala çalışıyor
- [x] Diğer onay diyalogları normal çalışıyor
- [x] TypeScript derleme hatası yok

## Teknik Notlar

### State Akışı
```
Kullanıcı "reload" yazar
    ↓
executeCommand() cmdReload()'u çağırır
    ↓
cmdReload { reloadDevice: true } döndürür
    ↓
useDeviceManager reloadDevice flag'ini işler
    ↓
Cihaz state'i sıfırlanır
    ↓
"Reloading..." mesajı gösterilir
    ↓
Terminal yeni komut için hazır olur
```

### Kullanılan Özel Token'lar
- `__CANCEL__` - Uzun süren komutları iptal et ✅
- `__PASSWORD_CANCELLED__` - Şifre istemini iptal et ✅
- `__RELOAD_CONFIRM__` - Artık kullanılmıyor ❌
- `__RELOAD_CANCEL__` - Artık kullanılmıyor ❌

## Kullanım Önerileri

Onay diyaloğuna alışkın kullanıcılar için:

1. **Daha dikkatli olun**: Komut artık anında çalışıyor
2. **ESC kullanın**: Reload animasyonu sırasında hala iptal edebilirsiniz
3. **Önce kaydedin**: Değişiklikleri saklamak için `write memory` yapın

## Gelecek Özellikler

Olası iyileştirmeler:

1. Ayarlardan isteğe bağlı onay toggle'ı ekleme
2. Gerçekten önce geri sayım zamanlayıcısı ("3 saniye içinde yeniden başlatılıyor...")
3. Reload zamanlama özelliği (`reload in 5`, `reload at 10:00`)
4. Reload iptal penceresi (gerçek cihazları gibi: "Ctrl+C ile iptal edin")
