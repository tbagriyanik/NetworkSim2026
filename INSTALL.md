# Kurulum Talimatları - Network Simulator

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm install
```

veya

```bash
bun install
```

### 2. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

veya

```bash
bun run dev
```

Tarayıcıda açın: [http://localhost:3000](http://localhost:3000)

## 📋 Sistem Gereksinimleri

- **Node.js**: 18.0 veya üzeri
- **npm**: 9.0 veya üzeri (veya bun)
- **Tarayıcı**: Modern tarayıcı (Chrome, Firefox, Safari, Edge)

## 📦 Yüklü Paketler

### Core Dependencies
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### UI Components
- **shadcn/ui** - Component library
- **Radix UI** - Headless UI components
- **Lucide React** - Icons

### State Management
- **Zustand** - State management
- **React Context** - Global context

### Utilities
- **clsx** - Conditional classnames
- **class-variance-authority** - CSS class variants

## 🔧 Yapılandırma

### TypeScript
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

### Test
```bash
npm run test
npm run test:watch
```

## 🐛 Sorun Giderme

### PowerShell Execution Policy Hatası

Eğer şu hatayı alırsanız:
```
cannot be loaded because running scripts is disabled on this system
```

**Çözüm 1:** CMD kullanın
```cmd
npm install
```

**Çözüm 2:** PowerShell'de bypass yapın
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
```

### Bağımlılık Hatası

Eğer modül bulunamadı hatası alırsanız:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 Zaten Kullanılıyorsa

```bash
npm run dev -- -p 3001
```

## 📚 Proje Yapısı

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   └── network/      # Network simulator components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── lib/              # Utility functions
│   └── network/      # Network logic
└── styles/           # Global styles

public/              # Static files
doc/                 # Project documentation
```

## 🎯 Özellikler

### Network Simulator
- ✅ Cihaz yönetimi (PC, Switch, Router, Firewall, IoT)
- ✅ Bağlantı yönetimi (Straight, Crossover, Console, WiFi)
- ✅ VLAN konfigürasyonu
- ✅ IP routing (IPv4/IPv6) — RIP, OSPF, OSPFv3, static
- ✅ Ping ve connectivity kontrol
- ✅ Akıllı CLI Terminal Öneri Sistemi (typo algılaması + komut önerileri)
- ✅ Firewall/Dynamic Access Control Lists
- ✅ DHCP havuz yönetimi

### Sınav Modu (Exam Mode)
- ✅ Öğretmen tarafı sınav oluşturma ve düzenleme editörü
- ✅ Proje → Sınav dönüştürme
- ✅ Öğrenci sınav dağıtımı (.json / .exam dosya formatı)
- ✅ Zamanlayıcı, puanlama ve sınav bittiğinde dondurulan sonuç ekranı
- ✅ Mobil uyumlu sınav yönetimi ve görev yeniden sıralama

### Rehberli Ders Modu (Guided Mode) & Tutorial Wizard
- ✅ Adım adım rehberli dersler (otomatik doğrulama, puan, ilerleme)
- ✅ Tutorial Wizard oyunlaştırma (points, progress, gamification)
- ✅ CLI + Yapılandırma + Bağlantı + Ping adım doğrulamaları

### IoT & Çevre İzleme
- ✅ WiFi bağlantısı ile IoT cihazları (sensör, aktüatör)
- ✅ Router AP modunda WiFi ağı (open / WPA2)
- ✅ DHCP ile otomatik IP atama (IoT + WiFi istemcileri)
- ✅ IoT Panel (sensor/actuator yönetimi, kurallar)

### Not Sistemi
- ✅ Not ekleme/silme
- ✅ Not sürükleme ve yeniden boyutlandırma
- ✅ Not stil özelleştirmesi
- ✅ Undo/Redo desteği

### Gelişmiş Özellikler
- ✅ Zoom ve pan (fare tekerleği / klavye)
- ✅ Multi-select (Shift + tık)
- ✅ Tuval seçimi (orta tık + sürükle)
- ✅ Pürüzsüz pencere sürükleme (edge snapping kaldırıldı)
- ✅ Dark/Light mode
- ✅ Turkish/English support
- ✅ Offline storage
- ✅ Canlı uygulama: network2026.vercel.app

## 📖 Belgelendirme

Detaylı belgelendirme `doc/` klasöründe bulunur:

- **README.md** - Dokümantasyon giriş sayfası
- **USAGE.md** - Kullanım kılavuzu ve klavye kısayolları (TR/EN)
- **CLI_COMMANDS.md** - CLI komut referansı
- **L3_SWITCH_CONFIGURATION.md** - L3 Switch yapılandırma rehberi
- **QUICK_REFERENCE.md** - Hızlı referans ve kod parçacıkları
- **GOOGLE_SHEETS_SETUP.md** - Google Sheets entegrasyonu kurulumu
- **DOCUMENTATION_INDEX.md** - Dokümantasyon haritası

## 🚀 Deployment

### Vercel'e Deploy

```bash
npm run build
vercel deploy
```

### Docker ile Deploy

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📞 Destek

Sorunlar için `doc/` klasöründeki belgelendirmeyi kontrol edin.

## 📝 Lisans

FOSS License

## ✅ Kontrol Listesi

Kurulum sonrası kontrol edin:

- [ ] npm install başarılı
- [ ] npm run dev çalışıyor
- [ ] http://localhost:3000 açılıyor
- [ ] Network simulator yükleniyor
- [ ] Cihaz ekleyebiliyorsunuz
- [ ] Bağlantı oluşturabiliyorsunuz
- [ ] Ping atabiliyorsunuz
- [ ] Not ekleyebiliyorsunuz
