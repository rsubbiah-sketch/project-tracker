# UpscaleAI Project Tracker — Implementation Log

> **Project**: UpscaleAI Project Tracker
> **Repo**: `upscale-tracker/` (frontend) · `upscale-tracker-backend/` (backend)
> **Production**: https://upscaleai-intranet.web.app
> **API**: https://upscale-tracker-api-309497722154.us-central1.run.app
> **Started**: March 2026

---

## Theme & Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FFFFFF` | Page background |
| `--foreground` | `#05192F` | Primary text (rgb 5,25,47) |
| `--primary` | `#2563EB` | Blue-600 — selected labels, focus rings, active nav icons |
| `--accent` | `#93C5FD` | Blue-300 — selected button backgrounds |
| `--accent-foreground` | `#2563EB` | Blue-600 — selected button text |
| `--card` | `#F0F2F5` | Card/input backgrounds |
| `--muted` | `#F7F8FA` | Sidebar, subtle backgrounds |
| `--border` | `#E2E6EC` | All borders |
| `--destructive` | `#EF4444` | Error/danger |
| `--success` | `#34D399` | On Track, completed |
| `--warning` | `#FBBF24` | At Risk, waiting |
| `--info` | `#60A5FA` | Info badges |

### Phase Colors (Program lifecycle)
| Phase | Color | Hex |
|-------|-------|-----|
| New | Blue | `#60A5FA` |
| Active | Blue | `#3B82F6` |
| Waiting | Yellow | `#FBBF24` |
| Blocked | Red | `#F87171` |
| Complete | Green | `#34D399` |

### Typography
- **Font**: Poppins (Google Fonts) — 300–900 weights
- **Mono**: JetBrains Mono

### Avatar
- Light gray circle (`--border`) with dark text (`--foreground`)
- Initials derived from name

---

## Implementation Timeline

### Phase 1: Initial Setup & Dark Theme
- Single-page React app with all code in monolithic `App.tsx` (~997 lines)
- Dark navy & gold theme (aerospace command center aesthetic)
- Hardcoded sample data: 6 programs, 12 tasks, 7 comments, 5 replies, 5 notifications
- Views: Dashboard, Programs, Tasks, Plan Mode, Gate Reviews, Implementation TODO
- Framer Motion animations, Recharts charts
- Tailwind CSS 3, Vite 6, TypeScript

### Phase 2: Light Theme Migration
- Background changed to white (`#FFFFFF`)
- Text primary color changed to `rgb(5,25,47)`
- Font changed from Outfit to **Poppins**
- Gold avatar circles replaced with light gray
- Card shadows softened for light background
- Ambient background grain/grid overlays removed

### Phase 3: Mobile-First Responsive
- Root layout: `flex-col` on mobile, `flex-row` on desktop
- Desktop sidebar hidden on mobile → **bottom tab bar** (Home, Programs, Tasks, Gates, More)
- "More" opens slide-out drawer with full navigation
- Notifications: bottom sheet on mobile, right panel on desktop
- All grids responsive (1-2 cols mobile, full on desktop)
- Phase timelines horizontally scrollable on mobile
- Task cards stack vertically with wrapping status buttons
- Command palette full-width on mobile

### Phase 4: Create Program & Tasks
- **New Program** button moved to top-right header
- Create form: name, description, type, phase, owner, team, dates, budget
- Auto-assigned gate reviews based on program type
- Gate review info preview in create form
- **New Task** button moved to top-right of Tasks section
- Standalone task creation with program selector dropdown
- Tasks visible in both Tasks view and program detail

### Phase 5: Gate Review Enhancements
- Custom gate checklist items per program/phase
- Add/remove custom items with inline input
- Custom items tracked per `programId-phase` key
- Full pass/fail/waive/in-progress workflow preserved

### Phase 6: Button & Accent Color Updates
- Selected button background: gold → **blue-300** (`#93C5FD`)
- Selected button label text: dark → **blue-600** (`#2563EB`)
- Sidebar active nav: gold → blue (icon, text, left border, tint background)
- Bottom nav active: gold → blue
- All filter tabs, CTA buttons, toggles updated
- Status filter tabs: gold → blue
- Sort buttons: gold → blue
- Google Workspace indicator removed (placeholder, not implemented)

### Phase 7: Modular Architecture Refactoring
**From**: 1 monolithic file (997 lines)
**To**: 22 source files

| Layer | Files |
|-------|-------|
| Foundation | `types.ts`, `tokens.ts`, `utils.tsx` |
| Hooks | `hooks/useIsMobile.ts`, `hooks/useCurrentUser.tsx`, `hooks/useApi.ts` |
| Data | `data/index.ts`, `data/gates.ts` |
| Components | `components/ui.tsx`, `components/Icons.tsx`, `components/Logo.tsx` |
| Layout | `layout/Sidebar.tsx`, `layout/TopBar.tsx`, `layout/BottomNav.tsx`, `layout/NotificationDrawer.tsx`, `layout/CommandPalette.tsx` |
| Views | `views/Dashboard.tsx`, `views/ProgramList.tsx`, `views/ProgramDetail.tsx`, `views/Comments.tsx`, `views/PlanView.tsx`, `views/GateReview.tsx`, `views/TodoView.tsx`, `views/TasksView.tsx` |
| Services | `services/api.ts`, `services/mappers.ts` |
| App | `App.tsx` (119 lines) |

### Phase 8: Tailwind CSS 4 + shadcn/ui Migration
- **Tailwind 3 → 4**: Removed `tailwind.config.js`, PostCSS config; CSS-first `@theme` block
- **shadcn/ui**: Installed Button, Card, Badge, Progress, Input, Textarea, Select, Tabs, Sheet, Command, Dialog, Label, Separator
- **CSS Variables**: `:root` theme with 25+ variables matching UpscaleAI blue palette
- **Custom resets moved to `@layer base`** — fixed specificity issue where `* { margin:0; padding:0 }` was overriding Tailwind utilities
- **Breakpoints**: Added to `@theme` block (sm 640px, md 768px, lg 1024px, xl 1280px)
- **PostCSS plugin**: Switched from `@tailwindcss/vite` to `@tailwindcss/postcss` for reliable dev server
- **Inline styles reduced**: 245 → 105 (remaining are data-driven dynamic colors)
- Imports cleaned: removed `n`/`g` token imports from 14 files, replaced with CSS variables

### Phase 9: Gold → Blue Theme Completion
- All remaining gold (`g[500]`, `g.sh`, `rgba(255,225,157,...)`) replaced with blue
- Phase timeline: current phase uses blue-300 border, blue-600 text
- BETA badge: blue tint
- Task count badges: blue
- Bell icon, search icon: blue-600
- Gate overview: blue highlight for current phase
- Todo phase IDs: blue circle
- Gate verification button: blue
- Notification unread dot: blue
- Command palette hover: blue tint

### Phase 10: Backend Development (Cloud Run + Firestore)
**Stack**: Express.js, Firestore, Google Workspace APIs, Cloud Run

#### Existing Routes (pre-built)
- `POST /auth/google` — Google OAuth 2.0 login
- `GET /auth/me` — Current user
- `GET/POST/PATCH/DELETE /api/programs` — Program CRUD
- `GET/POST/PATCH/DELETE /api/tasks` — Task CRUD + reassign + Gmail notifications
- `GET/PATCH/POST /api/notifications` — Notifications + mark read + mention/gate alerts
- `GET/POST /api/drive` — Drive folder creation, file listing

#### New Routes Added
- `GET/POST/PATCH/DELETE /api/comments` — Comments with likes + resolve
- `GET/POST/PATCH/DELETE /api/replies` — Threaded replies with likes
- `GET/POST/PATCH/DELETE /api/impl-phases` — Implementation phase tracking
- `GET/POST/PATCH/DELETE /api/gate-items` — Gate checklist items + custom items + status
- `GET /api/users` — User listing for dropdowns

#### In-Memory Store
- Drop-in replacement for Firestore in dev mode (`USE_MEMORY=true`)
- Pre-seeded with all sample data
- Supports: CRUD, query filters, array union/remove, audit logging
- Dev auth bypass: auto-authenticates as admin user

#### Firestore Database
- Project: `upscaleai-intranet`
- Database: `project-tracker-db` (nam5 region)
- Collections: users, programs, tasks, comments, replies, notifications, gate_items, gate_statuses, impl_phases, audit_log
- Seeded via Firebase MCP plugin

### Phase 11: Frontend ↔ Backend Integration
- **API client** (`services/api.ts`): 32 typed functions, JWT auth, error handling
- **Data mappers** (`services/mappers.ts`): converts backend flat fields → frontend nested objects
- **App.tsx data loading**: fetches from API on startup, falls back to hardcoded data
- **Optimistic mutations**: all create/update operations update local state immediately, fire API call in background
- **Current user**: `useCurrentUser()` hook with React context, derives name from email
- **Auth-aware**: skips API calls gracefully when no JWT token

### Phase 12: Production Deployment
- **Cloud Run**: `upscale-tracker-api` deployed to `us-central1`
- **IAM**: `--no-invoker-iam-check` (app handles auth via JWT)
- **Firebase Hosting**: `upscaleai-intranet.web.app`
- **Environment**: Production env vars set via Cloud Run
- **OAuth redirect**: configured for Cloud Run URL

### Phase 13: New Program Data Model
**New fields added to Program:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | `HW \| SW \| Customer \| NPI` | Program type (was ASIC/Hardware/Software) |
| `subType` | `string` | CRD, MRD, PRD, DOC, Project, or custom |
| `currentPhase` | `New \| Active \| Waiting \| Blocked \| Complete` | Lifecycle phase with color coding |
| `assignedBy` | `User` | Who assigned the program |
| `assignedDate` | `string` | When it was assigned |
| `lastUpdate` | `string` | ISO timestamp of last change (sort key) |
| `deliveryAsk` | `string` | Requested delivery date |
| `deliveryCommit` | `string` | Committed delivery date |
| `milestones` | `Milestone[]` | Array of {name, date, status} |

**Updated across:**
- Frontend: `types.ts`, `tokens.ts`, `data/index.ts`, `components/ui.tsx` (PB badge), `services/mappers.ts`, `services/api.ts`, `ProgramList.tsx`, `ProgramDetail.tsx`
- Backend: `routes/programs.js` (POST + PATCH), `memory-store.js`
- Firestore: 6 programs re-seeded with new model

**Create form includes:** Type/subtype dropdowns, phase selector, owner, assigned by, assigned date, delivery dates, team, budget, milestones editor with add/remove

**Program cards show:** Type badge, subType tag, phase badge (color-coded), milestone dots, progress bar colored by phase, description preview, last update date

---

## Architecture

```
Browser → Firebase Hosting (upscaleai-intranet.web.app)
              ↓ VITE_API_URL
         Cloud Run (upscale-tracker-api)
              ↓
         Firestore (project-tracker-db)
              ↓
         Google Workspace APIs (Drive, Gmail, Calendar)
```

### Frontend Stack
- React 18 + TypeScript
- Vite 6 + Tailwind CSS 4 + shadcn/ui
- Framer Motion 11 (animations)
- Recharts 2 (charts)
- Poppins + JetBrains Mono fonts

### Backend Stack
- Node.js 20 + Express 4
- @google-cloud/firestore 7
- googleapis (Drive, Gmail, Calendar)
- JWT authentication
- Helmet + CORS + rate limiting

### Deploy Commands
```bash
# Backend → Cloud Run
cd upscale-tracker-backend
gcloud run deploy upscale-tracker-api --source . --region us-central1 --project upscaleai-intranet --memory=512Mi --no-invoker-iam-check

# Frontend → Firebase Hosting
cd upscale-tracker
npm run build && firebase deploy --only hosting
```

---

## File Structure

```
upscale-tracker/                    # Frontend
├── src/
│   ├── App.tsx                     # Lean orchestrator (~120 lines)
│   ├── types.ts                    # TypeScript interfaces
│   ├── tokens.ts                   # Design tokens + phase colors
│   ├── index.css                   # Tailwind 4 + shadcn theme
│   ├── components/
│   │   ├── ui.tsx                  # Av, SB, TB, PB, GB, Counter, Spark, Cd
│   │   ├── ui/                     # shadcn components (button, card, badge, etc.)
│   │   ├── Icons.tsx               # 25+ SVG icons
│   │   └── Logo.tsx                # UpscaleLogo + UpscaleLogoMark
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── NotificationDrawer.tsx
│   │   └── CommandPalette.tsx
│   ├── views/
│   │   ├── Dashboard.tsx
│   │   ├── ProgramList.tsx
│   │   ├── ProgramDetail.tsx
│   │   ├── Comments.tsx
│   │   ├── PlanView.tsx
│   │   ├── GateReview.tsx
│   │   ├── TodoView.tsx
│   │   └── TasksView.tsx
│   ├── services/
│   │   ├── api.ts                  # 32 typed API functions
│   │   └── mappers.ts              # Backend → frontend data mappers
│   ├── hooks/
│   │   ├── useIsMobile.ts
│   │   ├── useCurrentUser.tsx
│   │   └── useApi.ts
│   ├── data/
│   │   ├── index.ts                # Sample data (fallback)
│   │   └── gates.ts                # Gate checklists
│   └── lib/
│       └── utils.ts                # cn() utility
├── .env.development                # VITE_API_URL=http://localhost:8080/api
├── .env.production                 # VITE_API_URL=https://...run.app/api
└── firebase.json                   # Hosting config

upscale-tracker-backend/            # Backend
├── src/
│   ├── server.js                   # Express app
│   ├── config/index.js             # Environment config
│   ├── middleware/auth.js           # JWT + role-based + dev bypass
│   ├── routes/
│   │   ├── auth.js                 # Google OAuth 2.0
│   │   ├── programs.js             # Program CRUD
│   │   ├── tasks.js                # Task CRUD + reassign
│   │   ├── comments.js             # Comments + likes + resolve
│   │   ├── replies.js              # Threaded replies + likes
│   │   ├── notifications.js        # In-app notifications
│   │   ├── impl-phases.js          # Implementation tracking
│   │   ├── gate-items.js           # Gate checklists + status
│   │   ├── users.js                # User listing
│   │   └── drive.js                # Google Drive integration
│   └── services/
│       ├── firestore.js            # DB layer (auto-fallback to memory)
│       ├── memory-store.js         # In-memory store for dev
│       ├── google-auth.js          # OAuth helpers
│       ├── drive.js                # Drive folder management
│       └── gmail.js                # Email notifications
├── scripts/
│   └── seed.js                     # Firestore seeder
├── Dockerfile                      # Cloud Run container
└── .env                            # Local config
```
