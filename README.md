# Network Simulator

![Version](https://img.shields.io/badge/version-2.9.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&logoColor=white)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Total Lines](https://img.shields.io/badge/total--lines-128,337-lightgrey)

A browser-based network simulator for learning switching, routing, wireless, IoT, CLI, and exam workflows.

**Live app:** [network2026.vercel.app](https://network2026.vercel.app) · **Alternatif Adres:** [tuzlanet.vercel.app](https://tuzlanet.vercel.app)

### Demo & Videos / Tanıtım Videoları
- 📺 **Tanıtım 1:** [https://www.youtube.com/watch?v=2Xo-ZP5qgXI](https://www.youtube.com/watch?v=2Xo-ZP5qgXI)
- 📺 **Tanıtım 2:** [https://www.youtube.com/watch?v=rSW3LiQa290](https://www.youtube.com/watch?v=rSW3LiQa290)

---

## Quick Start

```bash
npm install && npm run dev
```

## Recent Updates / Son Güncellemeler

- **Version 2.8.0 Sürümü:** 18 eksik özellik tam dokümante edildi. Topoloji Üretici, Paket Yakalama filtreleri, VRRP, BGP, SPAN, IP Source Guard ve çift tıklama daraltma özellikleri ağ kitapçığı ve kılavuzlara eklendi. Örnek uygulama projeleri sayısı 46'ya çıkarıldı.
- **Gelişmiş Paket Yakalama & Analizi (Packet Capture):** Paket yakalama paneline canlı IP/protokol/içerik arama, sayfalama (pagination) ve virgül/boşluk ile çoklu dışlama filtresi (`cdp, stp, arp` vb.) eklendi.
- **Arka Plan Ağ Hareketliliği Kaydı:** DHCP DORA akışı (`Discover`, `Offer`, `Request`, `ACK`), `STP BPDU`, `CDP`, `OSPF Hello`, `RIP`, `EIGRP` güncellemeleri ve `WLAN Beacon` paketleri canlı paket yakalama tablosuna otomatik olarak entegre edildi.


## Stats / İstatistikler

| Metric / Metrik | Value / Değer |
| --- | ---: |
| Version / Sürüm | 2.9.0 |
| Total Lines / Toplam Satır (src/) | 128,337 |
| Source Files / Kaynak Dosya | 537 |
| Documentation Files / Dokümantasyon Dosya | 22 |
| Example Projects / Örnek Proje | 46 |
| Guided Lessons / Rehberli Ders | 19 |
| Exams / Sınavlar | Sınav modu desteği |
| CLI Commands / CLI Komutları | CLI referansında listelenen komutlar |

## Documentation / Dokümantasyon

| Document / Doküman | Description / Açıklama |
| --- | --- |
| [INSTALL.md](INSTALL.md) | Kurulum & derleme / Installation & build |
| [USAGE.md](doc/getting-started/USAGE.md) | Kullanım kılavuzu & klavye kısayolları / Usage guide & shortcuts |
| [PC_CMD_REFERENCE.md](doc/getting-started/PC_CMD_REFERENCE.md) | PC CMD komut parametreleri / PC CMD command parameters |
| [TOPOLOGY_GENERATOR.md](doc/getting-started/TOPOLOGY_GENERATOR.md) | Topoloji üretici sihirbazı / Topology generator guide |
| [CLI_COMMANDS.md](doc/cli/CLI_COMMANDS.md) | CLI komut referansı / CLI command reference |
| [CLI_GUIDED_TUTORIAL.md](doc/cli/CLI_GUIDED_TUTORIAL.md) | Rehberli CLI dersleri / Guided CLI lessons |
| [WIRELESS_CONFIGURATION_GUIDE.md](doc/network/WIRELESS_CONFIGURATION_GUIDE.md) | Kablosuz ağ yapılandırma / Wireless configuration |
| [L3_SWITCH_CONFIGURATION.md](doc/network/L3_SWITCH_CONFIGURATION.md) | L3 switch yapılandırma / L3 switch configuration |
| [PACKET_CAPTURE_GUIDE.md](doc/network/PACKET_CAPTURE_GUIDE.md) | Paket yakalama paneli / Packet capture guide |
| [ProjeOzellikleri.md](doc/training/ProjeOzellikleri.md) | Tüm özellikler envanteri / Full features inventory (TR/EN) |
| [NETWORK_SIMULATOR_KITAPCIK.md](doc/training/NETWORK_SIMULATOR_KITAPCIK.md) | Türkçe eğitim kitapçığı / Turkish training booklet |
| [history.md](doc/history.md) | Sürüm geçmişi / Full changelog |
| [DOCUMENTATION_INDEX.md](doc/DOCUMENTATION_INDEX.md) | Tüm belgeler için indeks / Full documentation index |
| [CONTRIBUTING.md](doc/development/CONTRIBUTING.md) | Katkı rehberi & agent konvansiyonları / Contribution guide |

## Keyboard Shortcuts / Klavye Kısayolları

For a quick reference of simulator controls, expand the list below. For more details, see [USAGE.md](doc/getting-started/USAGE.md).
Simülatör kontrollerine hızlıca göz atmak için aşağıdaki listeyi genişletin. Daha fazla detay için [USAGE.md](doc/getting-started/USAGE.md) dosyasına bakın.

<details>
<summary><b>⌨️ Click to expand Keyboard Shortcuts / Klavye Kısayollarını görmek için tıklayın</b></summary>

### Canvas / Tuval

| Shortcut / Kısayol | Action (EN) | İşlem (TR) |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo | Geri al |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo | Yeniden yap |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> | Copy selected device | Seçili cihazı kopyala |
| <kbd>Ctrl</kbd> + <kbd>X</kbd> | Cut selected device | Seçili cihazı kes |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | Paste | Yapıştır |
| <kbd>Ctrl</kbd> + <kbd>A</kbd> | Select all | Tümünü seç |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save project | Projeyi kaydet |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | Open project file | Proje dosyasını aç |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> / <kbd>Alt</kbd> + <kbd>N</kbd> | New project | Yeni proje |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | Print topology | Topolojiyi yazdır |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | Toggle fullscreen | Tam ekrana geç / çık |
| <kbd>Alt</kbd> + <kbd>R</kbd> | Reset zoom/pan view | Görünümü sıfırla |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Delete selected | Seçili öğeyi sil |
| <kbd>Escape</kbd> | Cancel selection / Close mode | Seçimi iptal et / Modu kapat |
| <kbd>Ctrl</kbd> + <kbd>Scroll</kbd> | Zoom in / out | Yakınlaştır / Uzaklaştır |
| <kbd>Space</kbd> + <kbd>Drag</kbd> | Pan canvas | Canvas'ı kaydır |
| <kbd>Arrow Keys</kbd> | Move selected device(s) | Seçili cihaz(lar)ı taşı |
| <kbd>Shift</kbd> + <kbd>Arrow Keys</kbd> | Move selected device(s) faster | Seçili cihaz(lar)ı daha hızlı taşı |
| <kbd>F1</kbd> | Open / close help panel | Yardım panelini aç / kapat |
| <kbd>F5</kbd> | Refresh network topology | Ağ topolojisini yenile |
| <kbd>Home</kbd> | Reset topology view | Topoloji görünümünü sıfırla |
| <kbd>End</kbd> | Focus last element | Son öğeye odaklan |
| <kbd>Page Up</kbd> | Scroll canvas up | Canvas'ı yukarı kaydır |
| <kbd>Page Down</kbd> | Scroll canvas down | Canvas'ı aşağı kaydır |
| <kbd>Double-click (Empty Space)</kbd> | Reset topology view | Topoloji görünümünü sıfırla |
| <kbd>Double-click (Device)</kbd> | Open collapsible device panel | Daraltılabilir cihaz panelini aç |

### Ping Packet Analysis / Ping Paket Analizi

| Shortcut / Kısayol | Action (EN) | İşlem (TR) |
| :--- | :--- | :--- |
| <kbd>P</kbd> | Play / Pause packet analysis | Paket analizi: Oynat / Duraklat |
| <kbd>N</kbd> | Next hop (when paused) | Sonraki Hop (duraklatıldığında) |

### CLI / CMD

| Shortcut / Kısayol | Action (EN) | İşlem (TR) |
| :--- | :--- | :--- |
| <kbd>Tab</kbd> | Auto-complete command | Komut tamamlama |
| <kbd>Arrow Up</kbd> / <kbd>Down</kbd> | Command history | Komut geçmişi |
| <kbd>Enter</kbd> | Execute command | Komutu çalıştır |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Clear terminal | Terminali temizle |
| <kbd>?</kbd> | Show available commands | Kullanılabilir komutları göster |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> | Cancel command (CLI) | Komutu iptal et |

</details>


## Tech Stack / Teknoloji

Next.js 16.3, React 19, TypeScript 7.0, Tailwind CSS 4, Radix UI, Zustand 5.0

## License / Lisans

Free and open source. See [LICENSE](LICENSE).

Özgür ve açık kaynak. [LICENSE](LICENSE) dosyasına bakın.
