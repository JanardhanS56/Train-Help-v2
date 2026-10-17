<div align="center">

# 🚆 TravelRescue AI
### Autonomous Indian Rail Disruption Recovery & Offline-First Re-routing Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3_App_Router_(Turbopack)-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4_Tokens-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-175_Tests_Passed_(22_Suites)-729B1B?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Security: Clean](https://img.shields.io/badge/AppSec-Zero_Secrets_Tracked-10B981?style=for-the-badge&logo=shield&logoColor=white)](SECURITY.md)
[![Accessibility: WCAG AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-2E7D32?style=for-the-badge&logo=w3c&logoColor=white)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>"Something went wrong with your train. We've got this."</b><br/>
  An autonomous railway disruption recovery assistant answering the 3 critical questions in Indian Railways crises:<br/>
  <b>1. What happened?</b> &nbsp;•&nbsp; <b>2. What can I do?</b> &nbsp;•&nbsp; <b>3. What happens next?</b>
</p>

[Quick Start](#-quick-start--local-development) • [System Architecture](#-system-architecture) • [Core Innovations](#-core-innovations--capabilities) • [Live App Routes](#-live-application-routes-all-22-routes) • [Vercel Deployment](#-production-deployment-on-vercel) • [Verification & Testing](#-testing--quality-assurance)

</div>

---

## ⚡ Quick Start / Local Development

### 1-Line Launch
```bash
npm install && npm run dev
```

### Step-by-Step Instructions
```bash
# 1. Clone repository
git clone https://github.com/dkayush7373/Train-Help.git

# 2. Enter project directory
cd Train-Help

# 3. Install dependencies
npm install

# 4. Configure local environment (untracked)
cp .env.example .env.local
# Populate credentials in .env.local (never commit .env.local)

# 5. Start development server with Next.js Turbopack
npm run dev
```

Once initialized, navigate to `http://localhost:3000` to launch the application.

---

## 🏗️ System Architecture

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                TRAVELRESCUE AI ARCHITECTURE                            │
 ├─────────────────────────┬────────────────────────────┬─────────────────────────────────┤
 │     CLIENT INTERFACE    │    BUSINESS LOGIC & SYNC   │       INTELLIGENCE & DATA       │
 │  • Next.js 16 App Router │  • Deterministic Scorer   │  • Primary: Groq / DeepSeek LLM │
 │  • React 19 Concurrent  │  • Offline Sync Queue (v5) │  • Fallback: Local Advisor RAG  │
 │  • Tailwind v4 Semantic │  • Sliding Rate Limiter    │  • Supabase (PostgreSQL + RLS)  │
 │  • WCAG 2.1 AA Tokens   │  • Optimistic UI Updates   │  • Upstash Redis Cache & Locks  │
 └─────────────────────────┴────────────────────────────┴─────────────────────────────────┘
```

| Layer | Technology | Architecture Highlights |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16.3 (Turbopack)** | React Server Components, App Router, static page pre-rendering & dynamic edge rendering |
| **UI Primitives** | **React 19.2 + Radix / Base UI** | Concurrent rendering, typed state reducers, accessible dialogs & mobile sheets |
| **Language** | **TypeScript 5 (Strict Mode)** | End-to-end type safety with zero `any` declarations across all models and APIs |
| **Styling & Theming** | **Tailwind CSS v4** | Semantic CSS variable tokens (`--surface`, `--border`, `--primary`), high-contrast dark mode |
| **Offline Sync Queue** | **Web Storage + FIFO Queue** | Optimistic local trip mutations replayed via `/api/trips/sync` on network restoration |
| **Autonomous AI** | **Hybrid LLM + Deterministic RAG** | Live Groq/DeepSeek chat with zero-dependency offline fallback engine (`fallback-advisor.ts`) |
| **State Persistence** | **Schema v5 State Storage** | Versioned `localStorage` migration engine with automated schema hydration |
| **Distributed Rate Limiting**| **Upstash Redis** | Sliding-window atomic rate limiter that fails closed in production against abusive traffic |

---

## 🚀 Core Innovations & Capabilities

### 1. 🎛️ Multi-Objective Preferences & Deterministic Matching Engine (`/preferences`)
Unlike black-box aggregators, TravelRescue uses a pure, deterministic scoring algorithm located in [`lib/matching.ts`](lib/matching.ts):

$$\text{Overall Score} = w_{\text{budget}} \cdot S_{\text{budget}} + w_{\text{arrival}} \cdot S_{\text{arrival}} + w_{\text{changes}} \cdot S_{\text{changes}} + w_{\text{duration}} \cdot S_{\text{duration}} + w_{\text{comfort}} \cdot S_{\text{comfort}}$$

* **4 Intelligent Presets:**
  * 🏷️ **Best Value:** Budget ₹2,500 max · SL, 3A · Confirmed or RAC · Direct or 1 change · ±3h flex
  * ⚡ **Fastest:** Direct journeys only · ₹6,000 max · Confirmed or RAC · ±1h flex
  * 👑 **Most Comfortable:** 1A, 2A, EC · Confirmed only · ₹6,000 max · Up to 1 change · ±3h flex
  * 🛡️ **Confirmed Seats Only:** Guaranteed berth before boarding · Balanced ranking
* **Dual-Mode Linked Budget Control:** Mono text box linked to range slider with real Indian Rail fare tick markers (`₹500` to `₹10,000`).
* **Multi-Select Class Matrix:** 6 class tiles (3A, 2A, 1A, SL, CC, EC) with comfort hints, zero-selection guard, and strict vs soft filtering.
* **Alternate Metropolitan Hubs:** Automatic detection of neighboring terminal stations (e.g. Yesvantpur Junction `YPR` +25 min for Bengaluru, Nizamuddin `NZM` for Delhi).
* **Zero-Result Relaxation Advisor:** Automatically identifies the single most optimal relaxation (e.g. *"Raise budget to ₹2,500 to see 2 trains"*) with 1-click apply.
* **Instant Undo Snapshot:** Non-destructive 6-second toast with full state restoration on reset.

### 2. 🚆 4-Stage Disruption Recovery Workflow (`/recovery/[id]`)
* **Live Crisis Detection:** Instant root-cause explanation for train cancellations, major delays, and route diversions.
* **Direct Split-View Comparison:** Compares disrupted train against candidate alternatives (fares, timings, intermediate halts, platform allocations).
* **Railway Charting Heuristics:** Plain-English explanations of RAC rights and waitlist confirmation chances (`GNWL`, `RLWL`, `PQWL`).
* **Dynamic Preference Fit Breakdown:** Itemized verification on confirmation (*Within budget*, *Direct journey*, *Arrives before deadline*).
* **High-Contrast Journey Manifest:** Native print stylesheet (`window.print()`) producing offline-ready physical boarding sheets.

### 3. 🤖 Offline-Ready AI Railway Travel Advisor
* **Hybrid Intelligence Architecture**: Powered by Groq/DeepSeek with instant fallback to [`lib/ai/fallback-advisor.ts`](lib/ai/fallback-advisor.ts).
* **Zero-Failure Resilience**: If the user is offline, network drops, or LLM API rate limits occur (429/503), the local deterministic advisor takes over seamlessly.
* **Indian Railway Domain Expertise**: Understands PNR status, TDR filing windows, RAC seat-sharing rules, tatkal quotas, cancellation refund charts, and station layouts.

### 4. 🔄 Offline-First Mutation Queue (`/api/trips/sync`)
* **Local Transaction Journal**: All user actions (trip rebooking, cancellations, preference saves) persist immediately to a local FIFO queue.
* **Optimistic UI Updates**: The interface reflects changes instantly with zero loading spinners or network lag.
* **Reconnection Replay**: Automatically drains and synchronizes queued mutations against the server upon network restoration via atomic batches.

### 5. 💰 100% Automatic Refund Tracking
* Real-time 3-stage progress monitor (`Requested` → `Processing` → `Refunded`).
* Guarantees zero clerkage deductions for railway-cancelled services under Indian Railways TDR rules.

---

## 🗺️ Live Application Routes (All 22 Routes)

| Type | Route | Description | Highlights |
| :---: | :--- | :--- | :--- |
| `○ Static` | [`/`](http://localhost:3000) | Landing Page | Interactive disruption simulation, feature showcase & live demo |
| `○ Static` | [`/dashboard`](http://localhost:3000/dashboard) | Passenger Dashboard | Active PNR card, boarding status, upcoming trips & quick recovery |
| `○ Static` | [`/preferences`](http://localhost:3000/preferences) | Travel Preferences | 4 smart presets, class matrix, dual budget slider & live match panel |
| `○ Static` | [`/recovery`](http://localhost:3000/recovery) | Recovery Hub | Disruption tracker with automatic 100% refund monitor |
| `ƒ Dynamic`| [`/recovery/[id]`](http://localhost:3000/recovery/trip-4) | Disruption Recovery Flow | 4-stage recovery workflow (Karnataka Express rescue scenario) |
| `○ Static` | [`/trips`](http://localhost:3000/trips) | Trip Management | Categorized journeys (Needs Attention, Upcoming, Recovered, Past) |
| `ƒ Dynamic`| [`/trips/[id]`](http://localhost:3000/trips) | Individual Trip Detail | Full itinerary, intermediate stops, ticket status & refund ledger |
| `○ Static` | [`/notifications`](http://localhost:3000/notifications) | Advisory Center | Real-time railway alerts, platform shifts & weather advisories |
| `○ Static` | [`/help`](http://localhost:3000/help) | Support & FAQs | Plain-English refund rules, TDR procedures & emergency helpline |
| `○ Static` | [`/simulation`](http://localhost:3000/simulation) | Disruption Simulator | Interactive rail network simulation with live telemetry |
| `○ Static` | [`/offline`](http://localhost:3000/offline) | Offline Fallback | Cached recovery state and offline travel advisor |
| `○ Static` | [`/privacy`](http://localhost:3000/privacy) | Privacy Policy | Passenger data retention policies and zero third-party tracking |
| `ƒ Dynamic`| `/api/chat` | AI Advisor API | Streaming conversational assistant with deterministic fallback |
| `ƒ Dynamic`| `/api/trips/sync` | Offline Sync Queue | Transactional endpoint for replaying queued client-side mutations |
| `ƒ Dynamic`| `/api/journeys` | Journey Planner | Alternative train discovery and multi-modal routing |
| `ƒ Dynamic`| `/api/rebook` | Autonomous Rebooking | Disruption alternative confirmation and seat allocation |
| `ƒ Dynamic`| `/api/health/db` | Database Health Check | Supabase connection monitor and schema cache verification |
| `ƒ Dynamic`| `/api/sim/advise` | Simulation Advisor | AI disruption mitigation recommendations |
| `ƒ Dynamic`| `/api/sim/scenarios`| Simulation Scenarios | Pre-configured Indian Rail network crisis scenarios |
| `ƒ Dynamic`| `/api/sim/scenarios/[id]` | Scenario Execution | Dynamic scenario playback with train telemetry |
| `ƒ Dynamic`| `/api/sim/stations` | Station Registry | Coordinates, platform capacities, and congestion data |
| `ƒ Dynamic`| `/api/sim/trains` | Train Telemetry | Live speed, delay metrics, and coordinates across zones |

---

## ☁️ Production Deployment on Vercel

### 1-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dkayush7373/Train-Help)

### Required Environment Variables Table
Configure these variables in **Vercel Dashboard > Project Settings > Environment Variables**:

| Variable Name | Scope | Production Required? | Recommended Value / Notes |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | **Yes** | `https://YOUR-PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | **Yes** | Public Supabase anon key (protected by RLS) |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | **Yes** | Canonical Vercel URL (e.g. `https://travel-rescue.vercel.app`) |
| `AI_API_KEY` | Server-Only (Secret) | **Yes** | Groq (`gsk_...`) or DeepSeek API key |
| `AI_PROVIDER` | Server-Only (Config) | **Yes** | `groq` (default) or `deepseek` |
| `REDIS_URL` | Server-Only (Secret) | **Yes** | Upstash Redis connection string (`rediss://...`) |

> [!CAUTION]
> **CRITICAL SECURITY REQUIREMENT**:  
> `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` must **NEVER** be entered into the Vercel Dashboard. They bypass Row Level Security and are strictly restricted to local seed scripts. Production application code accesses database tables exclusively via the anonymous client protected by PostgreSQL RLS policies.

---

## 🧪 Testing & Quality Assurance

The codebase maintains a 100% test pass rate with 175 automated tests across 22 test suites.

```bash
# 1. Run complete unit and integration test suite
npm test -- --run

# 2. Verify zero committed secrets exist in git-tracked files
npm run check:secrets

# 3. Typecheck codebase with strict TypeScript compiler
npx tsc --noEmit

# 4. Run ESLint across all components and libraries
npm run lint

# 5. Generate Next.js Turbopack production bundle
npm run build
```

### Test Suite Coverage Highlights
* **Matching Engine (`matching.test.ts`)**: 5-factor scoring verification, boundary conditions, tie-breaking, and preset weight distributions.
* **Deterministic Fallback (`fallback-advisor.test.ts`)**: 28 automated tests verifying railway intent parsing, TDR advice, and offline responses.
* **Offline Sync Queue (`sync-queue.test.ts`)**: Optimistic local queue mutations, idempotency, retry backoff, and replay order.
* **AppSec Prefix Guard (`env-public-prefix.test.ts`)**: AST verification ensuring no sensitive keys carry the `NEXT_PUBLIC_` prefix.
* **Secret Leak Prevention (`check-secrets.test.ts`)**: Regex scanning of all committed files against JWT tokens, private keys, and API credentials.
* **Rate Limiting (`rate-limit.test.ts`)**: Distributed sliding-window enforcement and fail-closed security behavior under load.

---

## 📁 Clean Repository Layout

```text
Train-Help/
├── app/                        # Next.js 16 App Router pages & API routes
│   ├── (app)/                  # Authenticated application shell routes
│   │   ├── dashboard/          # Passenger dashboard with featured PNR
│   │   ├── preferences/        # Preferences engine with live scoring panel
│   │   ├── recovery/           # Active recovery hub & refund tracking
│   │   ├── recovery/[id]/      # 4-stage recovery workflow
│   │   ├── trips/              # Categorized passenger trip cards
│   │   ├── notifications/      # Real-time railway advisory feed
│   │   └── help/               # FAQs, emergency contacts & TDR guide
│   ├── api/                    # Dynamic serverless API endpoints
│   │   ├── chat/               # Conversational railway AI advisor
│   │   ├── trips/sync/         # Offline mutation queue sync endpoint
│   │   ├── journeys/           # Multi-modal alternative journey planner
│   │   ├── rebook/             # Autonomous alternative seat rebooking
│   │   ├── health/db/          # Database health and schema cache verification
│   │   └── sim/                # Rail network simulation telemetry APIs
│   ├── globals.css             # Design tokens, theme variables & print stylesheet
│   └── layout.tsx              # Root HTML layout with theme hydration
├── components/                 # Reusable UI and domain components
│   ├── booking/                # 4-stage booking and confirmation flow
│   ├── chat/                   # AI travel advisor chat interface
│   ├── landing/                # Interactive landing page and demo widgets
│   ├── preferences/            # Modular preference controls & live results
│   ├── recovery/               # Split-view comparisons & vertical halt timelines
│   ├── trips/                  # Ticket stubs & cancellation refund monitors
│   └── ui/                     # Accessible primitives (Button, Dialog, Sheet, Switch)
├── context/                    # React Context providers & state stores
│   ├── app-context.tsx         # Unified AppProvider coordinating trips & engine
│   └── state-storage.ts        # Schema v5 versioned localStorage migration
├── lib/                        # Core business logic and utilities
│   ├── ai/                     # Hybrid LLM client & deterministic fallback advisor
│   ├── data/                   # Supabase data adapters & offline sync queue
│   ├── sim/                    # Train simulation engine and network state
│   ├── matching.ts             # Pure deterministic matching & ranking engine
│   ├── constants.ts            # Indian Railways constants, presets & stations
│   ├── format.ts               # Indian Rupee Intl currency & date formatting
│   ├── rate-limit.ts           # Distributed sliding-window Redis rate limiter
│   └── types.ts                # TypeScript domain models and interfaces
├── mock/                       # Deterministic mock data for Indian rail network
├── scripts/                    # Verified development and security utilities
│   ├── db/                     # Database seed, check, and verification scripts
│   └── security/               # Pre-commit secret scanning & prefix guard scripts
├── .env.example                # Safe environment template with dummy placeholders
├── LICENSE                     # MIT License
├── README.md                   # Complete system documentation
└── SECURITY.md                 # Security policy, secret categorization & rotation
```

---

## 🔒 Security & Responsible Disclosure

TravelRescue AI adheres to strict application security standards:
- All database mutations run through Supabase with Row Level Security (RLS) enabled.
- API endpoints enforce sliding-window rate limits via Upstash Redis.
- Zero secrets exist in tracked git files (verified by `npm run check:secrets` and CI).
- For vulnerability reports and key rotation workflows, consult [`SECURITY.md`](SECURITY.md).

---

## 📜 License

Distributed under the **MIT License**. Built with care for Indian Railways passengers.
