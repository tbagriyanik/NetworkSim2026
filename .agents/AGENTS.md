# Workspace Guidelines

- Tüm `src/` klasörü altındaki kaynak kodlarda, bir dosyanın boyutunun 2500 satırı geçmemesine özen gösterilmelidir. Eğer dosya bu sınırı aşıyorsa, sorumlulukları ayrıştırarak kodu küçük, modüler bileşenlere (component) veya yardımcı araçlara (util) bölmeliyiz.
- Yapılan değişiklikler ve eklemeler sonrasında derleme (build) işlemlerinde hiçbir **error (hata)** veya **warning (uyarı)** kalmamasına kesinlikle dikkat edilmelidir. Mümkün olan en temiz ve hatasız kod hedeflenmelidir.
- Do NOT run `$env:Path = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs;" + $env:Path; npx oxlint; npx tsc --noEmit` automatically in prompts.
