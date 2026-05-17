# Network Simulator 2026

![Version](https://img.shields.io/badge/version-1.6.4-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016.2%20|%20React%2019%20|%20TypeScript%205.9%20|%20Tailwind%204-green)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Total Lines](https://img.shields.io/badge/total--lines-124325-lightgrey)

A browser-based network simulator for learning switching, routing, wireless, IoT, CLI, and exam workflows. TR/EN interface support.

**Live app:** [network2026.vercel.app](https://network2026.vercel.app)

Latest Updates (2026-05-17):
- **Canvas Layout Rendering**: Resolved stacking and overlapping issues to ensure the network canvas renders perfectly within bounded areas without bleeding underneath the header and toolbars on both mobile and wide-screen resolutions.
- **CLI Smart Terminal Suggestions**: Intelligent command typo estimation system that suggests valid available commands and subcommands directly below CLI error messages.
- **Smooth Window Dragging**: Completely disabled edge snapping across all draggable modals and mini popovers (PC terminals, unified switch/router configurations, exam panels, ping diagnostics) to ensure a premium, non-snapping dragging experience.
- **Exam Editor & File Open**: Full mobile responsive layout for the Exam Editor, frozen timer state upon exam completion, and dual extension `.json` / `.exam` file import capabilities.

---

## Quick Start

```bash
npm install && npm run dev
```

## Stats

| Metric | Value |
| --- | ---: |
| Code | 117,853 |
| Source Files | 278 |
| Example Projects | 39 |
| Guided Lessons | 8 |
| Exams | 3 |
| CLI Command Families | 180+ |

## Documentation

| Document | Description |
| --- | --- |
| [examples.md](examples.md) | 39 example projects with step-by-step guides |
| [INSTALL.md](INSTALL.md) | Installation & build instructions |
| [doc/USAGE.md](doc/USAGE.md) | Usage guide & keyboard shortcuts (TR/EN) |
| [doc/CLI_COMMANDS.md](doc/CLI_COMMANDS.md) | CLI commands reference |
| [doc/QUICK_REFERENCE.md](doc/QUICK_REFERENCE.md) | Quick reference & code snippets |
| [doc/GOOGLE_SHEETS_SETUP.md](doc/GOOGLE_SHEETS_SETUP.md) | Google Sheets integration |

## Tech Stack

Next.js 16.2, React 19, TypeScript 5.9, Tailwind CSS 4, Radix UI, Zustand

## License

Free and open source. See [LICENSE](LICENSE).
