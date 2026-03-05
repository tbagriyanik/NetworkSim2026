# 🚀 Cisco Simulator Pro

A modern, production-ready, and highly interactive web-based Cisco IOS simulator designed for students and network enthusiasts to practice Cisco configuration in a safe environment.

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![Tech Stack](https://img.shields.io/badge/stack-Next.js%2016%20|%20TS%20|%20Tailwind%204-green)

## ✨ Key Features

### 🌐 Interactive Network Topology
- **Device Palette**: Drag and drop PC, Switch, and Router devices onto the canvas.
- **Canvas Control**: Smooth zoom and pan functionality with mouse wheel and drag interactions.
- **Cabling System**: Support for Straight-through, Crossover, and Console cables with compatibility checks.
- **Visual Feedback**: Animated data flows, port labels, and device status indicators.
- **Minimap**: Quick navigation for complex network layouts.

### 💻 Realistic CLI & PC Terminal
- **Cisco IOS Simulation**: Authentic CLI experience with support for `user`, `privileged`, `config`, `interface`, and `line` modes.
- **Smart Suggestions**: Ghost text (inline suggestions) for command completion and tab-completion support.
- **Multi-Device Support**: Independent CLI states and command history for every device in the topology.
- **PC Command Prompt**: Dedicated terminal for PCs with network commands like `ping`, `ipconfig`, and `help`.

### 🔌 Physical Device Visualization
- **Port Panel**: Realistic Cisco 2960-style port density view.
- **Live LEDs**: Status LEDs (Green/Orange/Gray) reflecting real-time port states (Connected/Blocked/Shutdown).
- **Trunk Indicators**: Visual badges for ports configured in trunk mode.

### 🛠️ Configuration Capabilities
- **VLAN Management**: Create, name, and assign ports to VLANs with a dedicated status panel.
- **Security Features**: Configure `enable secret`, console/VTY security, `service password-encryption`, and SSH access.
- **Port Configuration**: Manage `description`, `speed`, `duplex`, and `shutdown` states.
- **Running-Config**: Real-time generation and viewing of the current device configuration.

### 🏆 Task & Achievement System
- **Interactive Labs**: Pre-defined task groups for Topology, Ports, VLANs, and Security.
- **Real-time Tracking**: Progress bars and animated task cards that update as you configure.
- **Educational Tips**: Integrated hints and tips for each task to guide the learning process.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) for end-to-end type safety
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with custom animations and glassmorphism
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI) & [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & CSS keyframes
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand) & [TanStack Query](https://tanstack.com/query)
- **Database**: [Prisma ORM](https://www.prisma.io/) with SQLite support
- **Drag & Drop**: [@dnd-kit](https://dnd-kit.com/) for interactive device palette

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router (Pages & API)
├── components/           # UI Components
│   ├── cisco/            # Specialized Simulator Components
│   │   ├── NetworkTopology.tsx  # SVG-based network canvas
│   │   ├── Terminal.tsx         # Cisco CLI implementation
│   │   ├── PortPanel.tsx       # Physical device visualization
│   │   └── ...
│   └── ui/               # shadcn/ui base components
├── lib/                  # Core Logic
│   └── cisco/            # Simulator Engine
│       ├── parser.ts     # IOS Command Parser
│       ├── executor.ts   # IOS Command Executor
│       ├── types.ts      # State and Type definitions
│       └── taskDefinitions.ts # Lab task engine
├── contexts/             # Theme and Language (TR/EN) contexts
└── hooks/                # Custom React hooks
```

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to start your simulation.

## 🌍 Internationalization

The simulator fully supports both **Turkish (TR)** and **English (EN)** languages, including UI elements, task descriptions, and helpful tips.

---

Built for the next generation of network engineers. 🚀
