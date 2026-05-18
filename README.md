# Network Simulator 2026

![Version](https://img.shields.io/badge/version-1.6.4-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016.2%20|%20React%2019%20|%20TypeScript%206.0%20|%20Tailwind%204-green)
![FOSS](https://img.shields.io/badge/FOSS-Free%20Open%20Source-brightgreen)
![Total Lines](https://img.shields.io/badge/total--lines-104000-lightgrey)

A browser-based network simulator for learning switching, routing, wireless, IoT, CLI, and exam workflows. TR/EN interface support.

**Live app:** [network2026.vercel.app](https://network2026.vercel.app)

Latest Updates (2026-05-17):
- **Exam Mode**: Teacher exam editor with `.json` / `.exam` dual-extension file import, mobile-responsive layout, and secure student distribution.
- **Project → Exam Conversion**: Convert any existing network project into a timed exam with scoring, task extraction, and reorderable steps.
- **Guided Mode & Tutorial Wizard**: Step-by-step guided lessons with gamification points, progress tracking, and hint system.
- **Intelligent CLI Non-AI Assistant**: Fuzzy-matched command suggestions and device-aware subcommand hints shown below CLI error messages.
- **Smooth Window Dragging**: Edge snapping fully disabled across all draggable modals and popovers (PC terminals, exam panels, configs, ping diagnostics).
- **Canvas Layout Rendering**: Network canvas renders perfectly within bounded areas without bleeding under header and toolbars on all resolutions.

---

## Quick Start

```bash
npm install && npm run dev
```

## Stats

| Metric | Value |
| --- | ---: |
| Total Lines | 104,000+ |
| Source Files | 267 |
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

Next.js 16.2, React 19, TypeScript 6.0, Tailwind CSS 4, Radix UI, Zustand 5.0

## License

Free and open source. See [LICENSE](LICENSE).
