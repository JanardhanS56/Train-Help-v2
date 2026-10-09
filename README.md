# TravelRescue AI 🚆

> *"Something went wrong. We've got this."*

**TravelRescue AI** is a portfolio-grade, human-centered web application built to help Indian train travellers recover from sudden cancellations and severe delays. It eliminates the chaos of overcrowded station counters by instantly answering three critical questions: **What happened? What can I do? What happens next?**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG_AA-success?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

## 🎯 Key Features

- **🚨 Disruption Alert & Plain-English Explanations:**
  Immediate status indicators with reasons (e.g., *track maintenance*, *late inbound rake*) and target arrival fit reminders.
- **💰 100% Automatic Refund Tracker:**
  Visual 3-stage refund tracker (`Requested` → `Processing` → `Refunded`) showing full fare credit with zero clerkage deductions.
- **📊 Deterministic Alternative Ranking Engine:**
  Mathematically weighted scoring algorithm balancing Budget (30%), Arrival Deadline (30%), Direct vs Connecting (15%), Duration (15%), and Preference Fit (10%).
- **💺 RAC & Waitlist Confirmation Intelligence:**
  Embedded railway heuristic popovers explaining real-world confirmation chances (`WL 1–5 = Likely`, `WL 6–15 = Uncertain`, `WL 16+ = Unlikely`, `RAC = Shared lower berth`).
- **📍 Alternate Metropolitan Terminal Routing:**
  Nearby station detection (e.g., boarding at *Yesvantpur Junction (YPR)* instead of *KSR Bengaluru (SBC)* with exact transit times).
- **🗺️ Vertical Journey Halts Timeline:**
  Complete stop-by-stop route comparison with scheduled halt times, station codes, and assigned platform tracking.
- **📄 Print & Clipboard Export:**
  One-click clipboard summary and zero-dependency, print-optimized stylesheet (`window.print()`).
- **💬 Canned Recovery Assistant:**
  Floating side panel (mobile bottom sheet) with calculated disruption counts and actionable UI triggers (*Show fastest*, *Change budget*, *Help me decide*).
- **🌓 Accessible Light & Dark Mode:**
  Strict WCAG AA contrast ratios with system preference detection and localStorage persistence.
- **🧪 Interactive Demo State Matrix:**
  Discreet demo menu to simulate Loading skeletons, Empty states, Connection errors, and 1-click state resets.

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server-side rendering, instant client routing, Turbopack bundling |
| **Language** | TypeScript (Strict mode) | 100% typed domain models, zero `any` types |
| **UI Library** | React 19 | Standard React primitives, `useSyncExternalStore` hydration |
| **Styling** | Tailwind CSS v4 & Vanilla CSS | Curated HSL tokens, 8px grid, accessible dark mode, print media |
| **Icons** | Lucide React | Lightweight, accessible semantic iconography |
| **State** | React Context + `useReducer` | Single source of truth, versioned localStorage persistence (`v4`) |

---

## 📁 Folder Structure

```
travel-rescue/
├── app/
│   ├── (app)/
│   │   ├── dashboard/          # Trips overview, disruption banner, demo controls
│   │   ├── trips/[id]/         # Trip details & cancellation refund tracker
│   │   ├── recovery/[id]/      # 4-stage recovery flow (progress, alts, itinerary, success)
│   │   ├── preferences/        # Budget slider, class options, nearby stations
│   │   ├── notifications/      # Notification feed with read status sync
│   │   └── help/               # FAQs & emergency support modal
│   ├── globals.css             # Design tokens, WCAG AA dark mode, print CSS
│   ├── layout.tsx              # Root HTML wrapper with Inter font & AppProvider
│   └── page.tsx                # Landing page with static transformation preview
├── components/
│   ├── chat/                   # Assistant side panel & quick action chips
│   ├── help/                   # Accordion FAQ & support request modal
│   ├── landing/                # Hero navbar & before/after preview
│   ├── layout/                 # AppShell, Desktop Sidebar, Mobile BottomNav
│   ├── preferences/            # Transport modes, class selector, budget slider
│   ├── recovery/               # Progress bar, alternative cards, timeline, itinerary
│   └── trips/                  # Trip cards, dashboard header, booking modal
├── context/
│   ├── app-context.tsx         # Unified state provider with derived rankings
│   └── state-storage.ts        # Versioned localStorage hydration & sync
├── hooks/
│   ├── use-hydrated.ts         # Cascading render-safe client hydration detector
│   └── use-media-query.ts      # Reactive media query listener via useSyncExternalStore
├── lib/
│   ├── confirmation.ts         # Fixed RAC / Waitlist probability rules
│   ├── constants.ts            # Station database, route codes, design tokens
│   ├── format.ts               # Indian Rupee (en-IN), date offsets, durations
│   ├── ranking.ts              # 5-factor weighted train ranking algorithm
│   └── types.ts                # Strict TypeScript contracts & domain entities
└── mock/
    ├── data.ts                 # Central mock exports
    ├── mock-alternatives.ts    # 5 verified corridor trains with timeline halts
    ├── mock-messages.ts        # 6 notifications & 8 decision tree responses
    └── mock-trips.ts           # 5 diverse real-world Indian train itineraries
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or later
- **npm**: v9.0.0 or later

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/travel-rescue.git
cd travel-rescue

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⚙️ Environment Variables

The frontend MVP operates entirely client-side with mock data and zero external dependencies. For planned backend integrations (Supabase & LLM reasoning), copy the template below:

```bash
cp .env.example .env.local
```

### `.env.example` Reference

```env
# ── Application Configuration ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# ── Supabase (Database & Auth) ──
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret

# ── LLM Inference (Groq / OpenRouter / NVIDIA NIM) ──
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
NVIDIA_NIM_API_KEY=nvapi-...

# ── Notifications & SMS Gateway ──
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
RESEND_API_KEY=re_...
```

---

## 🧪 Quality & Validation Scripts

```bash
# Run linting with zero warnings or errors
npm run lint

# Generate production build bundle
npm run build

# Start production server
npm run start
```

---

## 📜 License

MIT License. Designed and built as a human-centered railway disruption assistant.
