# UpscaleAI Project Tracker

> AI Infrastructure Project Tracker — Plan, Track, and Ship Silicon, Systems, and Software

A production-grade project management application purpose-built for AI networking infrastructure companies developing switch trays, custom ASICs, network operating systems (SONiC), and AI network fabrics.

Built with **React 18**, **TypeScript**, **Tailwind CSS 3**, **Framer Motion**, **Recharts**, and a deep navy + gold design system.

![UpscaleAI Project Tracker](public/logo.svg)

---

## Features

### Dashboard
- Executive overview with animated stat counters
- Progress vs Budget bar chart (Recharts)
- Status breakdown pie chart
- Program cards with sparkline trend charts
- Recent activity feed and upcoming milestones

### Programs
- Filterable program list (ASIC / Hardware / Software)
- Live search filtering
- Detailed program view with phase timeline visualization
- Full collaboration thread (comments, replies, likes)

### Plan Mode
- Read-only planning view for DRAFT programs
- Phase timeline with animated blocks
- Plan activation with confirmation flow
- Gantt-style timeline for active programs (plan-vs-actual)

### Gate Reviews
- Phase gate verification checklists per program
- Status tracking: Passed / Failed / Waived / In Progress
- Animated scorecard with progress bar
- Blocking logic — gate approval only when all items resolved
- All-phases overview with completion status

### Collaboration Layer
- Threaded comments on any program
- Nested replies with collapsible threads
- Like/react to comments and replies
- @mention highlighting
- Thread resolution (resolve/unresolve)
- Comment count badges

### Implementation TODO
- 6-phase implementation plan (45 tasks)
- Per-task status toggles (Pending / In Progress / Done / Blocked)
- Expandable phase gate verification checklists
- Overall progress tracking with animated counter

### UX Features
- **Command Palette** (⌘K / Ctrl+K) — search programs, tasks, quick actions
- **Notification Drawer** — slide-in panel with @mentions, replies, gate updates
- **Ambient Design** — gold radial glow, fractal noise grain, grid overlay
- **Glassmorphism** — frosted glass sidebar and topbar
- **Micro-interactions** — Framer Motion throughout (hover, tap, stagger, spring physics)
- **Custom Scrollbar** — navy-themed thin scrollbar
- **Official UpscaleAI Logo** — SVG components with gold shimmer gradient

---

## Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Framework   | React 18 + TypeScript                |
| Build       | Vite 6                               |
| Styling     | Tailwind CSS 3 + custom theme        |
| Animation   | Framer Motion 11                     |
| Charts      | Recharts 2                           |
| Typography  | Outfit + JetBrains Mono (Google Fonts) |
| Icons       | Custom SVG icon system (20+ icons)   |

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+ or **yarn** 1.22+ or **pnpm** 8+

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# → http://localhost:3000
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

The production build outputs to `dist/` and can be deployed to any static host (Vercel, Netlify, Firebase Hosting, Google Cloud Storage, etc.).

---

## Project Structure

```
upscale-tracker/
├── index.html              # Entry HTML with Google Fonts
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind with navy/gold theme
├── postcss.config.js       # PostCSS (Tailwind + Autoprefixer)
├── public/
│   └── logo.svg            # Favicon (UpscaleAI logomark)
└── src/
    ├── main.tsx            # React entry point
    ├── index.css           # Global CSS + Tailwind directives
    ├── App.tsx             # Main application (all views)
    ├── theme.ts            # Design tokens (navy, gold, semantic)
    ├── data.ts             # Sample data + TypeScript types
    ├── vite-env.d.ts       # Vite type declarations
    └── components/
        ├── Logo.tsx        # UpscaleLogo + UpscaleLogoMark SVGs
        └── Icons.tsx       # SVG icon system (20+ icons)
```

---

## Design System

### Colors

| Token       | Value     | Usage                    |
|------------|-----------|--------------------------|
| navy-900   | `#050A15` | Primary background       |
| navy-700   | `#0F1B38` | Card backgrounds         |
| navy-500   | `#1A2D54` | Borders                  |
| gold-shimmer | `#FFE19D` | Logo, primary accent   |
| gold-500   | `#D4A843` | Buttons, progress bars   |
| gold-200   | `#F5D98A` | Body text                |
| gold-700   | `#A6893A` | Muted text               |

### Status Colors
- **On Track** → `#34D399` (green)
- **At Risk** → `#FBBF24` (amber)
- **Delayed** → `#F87171` (red)
- **Completed** → `#60A5FA` (blue)
- **Planning** → `#A78BFA` (purple)

---

## Keyboard Shortcuts

| Shortcut     | Action              |
|-------------|----------------------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `Escape`    | Close overlays       |

---

## Google Workspace Integration (Planned)

The PRD specifies full integration with Google Workspace:
- **Google SSO** — OAuth 2.0 authentication
- **Google Drive** — Auto-create project folders, link docs to tasks
- **Google Calendar** — Sync milestones to team calendars
- **Gmail** — Task assignment and @mention notifications
- **Google Sheets** — BOM data sync and report export
- **Google Chat** — Bot notifications for status changes

See the PRD document (`AI_Infra_Project_Tracker_PRD_v2.docx`) for full requirements.

---

## License

Proprietary — UpscaleAI, Inc. All rights reserved.
