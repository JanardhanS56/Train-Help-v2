<div align="center">

# 🚆 TravelRescue AI
### Indian Train Disruption Recovery & Autonomous Rail Re-routing Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4_Tokens-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WCAG AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-2E7D32?style=for-the-badge&logo=w3c&logoColor=white)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>"Something went wrong with your train. We've got this."</b><br/>
  An intelligent railway disruption recovery assistant answering the 3 critical questions in Indian Railways crises:<br/>
  <b>1. What happened?</b> &nbsp;•&nbsp; <b>2. What can I do?</b> &nbsp;•&nbsp; <b>3. What happens next?</b>
</p>

[Quick Start](#-quick-start--how-to-open-localhost) • [Live App Routes](#-live-application-routes) • [Core Features](#-features--capabilities) • [Preferences Engine](#-deterministic-preferences--matching-engine) • [Tech Stack](#-technical-architecture)

</div>

---

## ⚡ Quick Start / How to Open Localhost

> [!IMPORTANT]
> **Why `http://localhost:3000` might not open right away:**  
> A `localhost` address runs **on your computer**. If your terminal is not currently running `npm run dev`, your browser will say *"This site can't be reached"*.  
> **Follow the 3 quick steps below to run it anytime (today, in 10 days, or on any new machine):**

### 1-Line Quick Launch

Open your terminal or command prompt inside the `travel-rescue` folder and run:

```bash
npm install && npm run dev
```

### Step-by-Step Instructions

```bash
# 1. Clone this repository
git clone https://github.com/dkayush7373/Train-Help.git

# 2. Enter project folder
cd Train-Help/travel-rescue
# (or cd Train-Help depending on where your package.json is located)

# 3. Install packages (only needed on first run)
npm install

# 4. Configure local environment
cp .env.example .env.local
# Fill in your project credentials in .env.local (never commit .env.local!)

# 5. Start the local server
npm run dev
```

Once you see:
```text
▲ Next.js 16.3 (Turbopack)
- Local: http://localhost:3000
✓ Ready in 1.2s
```

You can click any of the links below in your browser:

### 🔐 Environment Configuration

To connect to Supabase, AI services, and Redis, configure your local environment:

1. Copy the example configuration template into an untracked `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your actual credentials.
3. **Strict Security Guidelines**:
   - **Never commit `.env.local` or any `.env*` file with real credentials.**
   - The repository tracks `.env.example` with safe placeholder values only (`https://YOUR-PROJECT-REF.supabase.co`, empty keys). No real credentials are included in this repository.
   - Never prefix server-only variables (`AI_API_KEY`, `REDIS_URL`, `SUPABASE_SERVICE_ROLE_KEY`) with `NEXT_PUBLIC_`.
   - `SUPABASE_SERVICE_ROLE_KEY` is for local developer scripts only (`npm run db:seed`); never input it into Vercel or public hosting dashboards.
   - Review [`SECURITY.md`](./SECURITY.md) for full secret categorization, reporting policies, and key rotation procedures.

### Shared API Rate Limits

For production, set `REDIS_URL` to a private `redis://` or `rediss://` connection URL. Chat, simulation, and database health API limits are stored atomically in Redis and shared across app instances. Production API requests fail closed with HTTP 503 if Redis is unavailable or not configured. Local development can omit `REDIS_URL`; its in-memory fallback only protects that one server process.

Add the setting to your local environment from `.env.example` and configure the same variable in your deployment provider. Do not expose the Redis URL through a `NEXT_PUBLIC_` variable. Since limits use the request IP, configure the trusted reverse proxy to overwrite client-supplied `X-Forwarded-For` and `X-Real-IP` headers.

### 🔗 Direct Page Links

| Destination | Localhost Link | Description |
| :--- | :--- | :--- |
| **🏠 Home Landing** | [http://localhost:3000](http://localhost:3000) | Product overview, live crisis simulation & feature tour |
| **⚙️ Preferences** | [http://localhost:3000/preferences](http://localhost:3000/preferences) | **New:** 4 presets, budget slider, class matrix, arrival deadlines & live match counter |
| **🚨 Recovery Centre** | [http://localhost:3000/recovery](http://localhost:3000/recovery) | Disruption tracker with automatic 100% refund progress & verified alternatives |
| **🎫 Disrupted Trip #4** | [http://localhost:3000/recovery/trip-4](http://localhost:3000/recovery/trip-4) | Pivotal Karnataka Express recovery workflow, timeline halts & confirmation review |
| **📊 Dashboard** | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | Active PNR monitoring, boarding card, quick disruption actions |
| **🧳 All Trips** | [http://localhost:3000/trips](http://localhost:3000/trips) | Categorized tickets (Needs Attention, Upcoming, Recovered, Past) |
| **🔔 Notifications** | [http://localhost:3000/notifications](http://localhost:3000/notifications) | High-priority railway disruption advisories & platform changes |
| **❓ Help & Support** | [http://localhost:3000/help](http://localhost:3000/help) | Plain-English railway FAQs, TDR filing guides & emergency contacts |

---

## 🌐 Deploy to Permanent Cloud URL (Works 24/7 Forever)

Want a permanent link that opens anywhere without keeping your laptop terminal running? Deploy free in 60 seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dkayush7373/Train-Help)

Or run via CLI:
```bash
npx vercel
```
This generates a permanent URL like `https://train-help.vercel.app` accessible from any phone or browser 24/7!

---

## ✨ Features & Capabilities

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       TRAVELRESCUE AI PLATFORM                             │
 ├───────────────────────┬───────────────────────────┬─────────────────────────┤
 │  🚨 CRISIS DETECTION  │   🧠 DETERMINISTIC MATCH  │   🛡️ COMPLETE RELIEF    │
 │  • Real-time alerts   │   • 5-factor scoring      │   • 100% auto refund    │
 │  • Plain-English text │   • Hard/Soft constraints │   • Instant manifest    │
 │  • Root-cause context │   • Relaxation suggestion │   • Offline print sheet │
 └───────────────────────┴───────────────────────────┴─────────────────────────┘
```

### 1. 🎛️ Dynamic Travel Preferences Engine (`/preferences`)
* **4 Smart Presets:**
  * 🏷️ **Best Value:** Budget ₹2,500 max · SL, 3A · Confirmed or RAC · Direct or 1 change · ±3h flex
  * ⚡ **Fastest:** Direct journeys only · ₹6,000 max · Confirmed or RAC · ±1h flex
  * 👑 **Most Comfortable:** 1A, 2A, EC · Confirmed only · ₹6,000 max · Up to 1 change · ±3h flex
  * 🛡️ **Confirmed Seats Only:** Guaranteed berth before boarding · Balanced ranking
* **Linked Dual-Mode Budget Control:** Mono text box linked to range slider with real-fare tick markers and Indian Rupee formatting (`₹500` to `₹10,000`).
* **Multi-Select Class Matrix:** 6 class tiles (3A, 2A, 1A, SL, CC, EC) with comfort hints, zero-selection guard, and strict vs soft filtering toggle.
* **Precise Arrival Timers:** Day selector (*Same day*, *Next day*, *In 2 days*) + styled hour/minute/AM-PM selectors and 1-click sync with active trip's meeting deadline.
* **Alternate Metropolitan Hubs:** Seamless detection of neighboring terminal stations (e.g. Yesvantpur Junction `YPR` +25 min for Bengaluru, Nizamuddin `NZM` for Delhi).
* **Zero-Result Relaxation Advisor:** When choices eliminate all options, automatically identifies the single most optimal relaxation (e.g. *"Raise budget to ₹2,500 to see 2 trains"*) with 1-click apply.
* **Instant Undo Snapshot:** Safe 6-second toast with full snapshot restoration on reset.

### 2. 🚆 Disruption Recovery Workflow (`/recovery/[id]`)
* **Original vs Alternative Comparison:** Direct split-view comparing original cancelled train against candidate trains.
* **Vertical Halt Timelines:** Exact intermediate stops, layover timings, and platform allocations.
* **Railway Charting Heuristics:** Plain-English explanations of RAC rights and waitlist confirmation chances (`GNWL`, `RLWL`).
* **Dynamic Preference Fit Summary:** Itemized breakdown on the confirmation page indicating which user criteria are satisfied (*Within budget*, *Direct journey*, *Arrives before deadline*).

### 3. 💰 100% Automatic Refund Monitor
* Visual 3-stage progress monitor (`Requested` → `Processing` → `Refunded`) guaranteeing zero clerkage charge deductions for railway-cancelled services.

### 4. 🌗 Human-Centric Design & Accessibility
* **Theme Support:** Polished light mode and true dark mode with semantic CSS variable tokens.
* **Zero Visual Clutter:** No distracting neon glows or glassmorphic blur; clean typography, 44px touch targets, and full keyboard navigability.
* **Print Optimized:** Native print stylesheet (`window.print()`) outputting high-contrast offline journey manifests.

---

## 🔬 Deterministic Preferences & Matching Engine

All filtering and ranking logic is governed by a pure, deterministic function located in [`lib/matching.ts`](lib/matching.ts):

$$\text{Overall Score} = w_{\text{budget}} \cdot S_{\text{budget}} + w_{\text{arrival}} \cdot S_{\text{arrival}} + w_{\text{changes}} \cdot S_{\text{changes}} + w_{\text{duration}} \cdot S_{\text{duration}} + w_{\text{pref}} \cdot S_{\text{pref}}$$

### Profile Weight Distributions (Sum = 100):

| Profile | Budget | Arrival | Changes | Duration | Comfort/Pref |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Balanced** | 30% | 30% | 15% | 15% | 10% |
| **Lowest Fare** | 45% | 20% | 10% | 10% | 15% |
| **Fastest** | 15% | 30% | 15% | 35% | 5% |
| **Comfort** | 10% | 20% | 15% | 10% | 45% |

### Departure Half-Open Interval Standard:
* **Early Morning:** `[04:00, 08:00)`
* **Morning:** `[08:00, 12:00)` *(8:00 AM strictly belongs to Morning)*
* **Afternoon:** `[12:00, 16:00)`
* **Evening:** `[16:00, 21:00)`
* **Night:** `[21:00, 04:00)` *(wraps cleanly across midnight)*

---

## 🛠️ Technical Architecture

| Layer | Technologies | Role & Highlights |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16.3** | Turbopack compilation, React Server Components & App Router |
| **UI Primitives** | **React 19.2** | Concurrent rendering, typed state reducers, accessible dialogs & sheets |
| **Language** | **TypeScript 5 (Strict)** | End-to-end type safety with zero `any` declarations |
| **Styling & Theme** | **Tailwind CSS v4** | CSS Variables design system (`--surface`, `--border`, `--primary`) |
| **State Management** | **React Context + Reducer** | Unified state with versioned `localStorage` migration (`v5`) |
| **Icons** | **Lucide React** | Lightweight, accessible vector iconography |

---

## 📁 Repository Structure

```text
travel-rescue/
├── app/
│   ├── (app)/
│   │   ├── dashboard/          # Recovery overview, featured ticket & trip list
│   │   ├── preferences/        # Dynamic preferences page with live matching panel
│   │   ├── recovery/           # Active recovery hub & refund tracking
│   │   ├── recovery/[id]/      # 4-stage recovery flow (Select, Review, Confirm, Success)
│   │   ├── trips/              # Categorized trip stub cards (Attention, Upcoming, Past)
│   │   ├── notifications/      # Critical alert feed with read synchronization
│   │   └── help/               # FAQs, emergency contacts & TDR guidance
│   ├── globals.css             # Design tokens, theme variables, print media rules
│   └── layout.tsx              # Root HTML layout with theme hydration & AppShell
├── components/
│   ├── preferences/            # Modular preference controls:
│   │   ├── presets-section.tsx         # 4 preset cards & priority segmented bar
│   │   ├── budget-section.tsx          # Dual input & slider with real fare ticks
│   │   ├── class-section.tsx           # 6 class tiles with strict/soft mode toggle
│   │   ├── seats-section.tsx           # Confirmed / RAC / Waitlist radio group
│   │   ├── changes-section.tsx         # Direct / 1 change / 2 changes options
│   │   ├── timing-section.tsx          # Departure chips & styled arrival selects
│   │   ├── nearby-stations-section.tsx # Alternate terminal station chips
│   │   ├── berth-section.tsx           # Berth preferences with requested disclaimer
│   │   ├── results-panel.tsx           # Sticky matching panel & mobile bottom sheet
│   │   └── preferences-form.tsx        # Master coordinator with Undo snapshot toast
│   ├── recovery/               # Alternative cards, halt timelines & comparison grids
│   ├── trips/                  # Ticket stubs & cancellation refund trackers
│   └── ui/                     # Accessible switch, sheet, dialog, badge & button primitives
├── context/
│   ├── app-context.tsx         # AppProvider coordinating evaluation engine & trips
│   └── state-storage.ts        # Versioned localStorage storage with schema v5 migration
├── lib/
│   ├── matching.ts             # Deterministic matching & ranking engine (evaluateAlternatives)
│   ├── constants.ts            # Canonical defaults, presets config & station database
│   ├── format.ts               # Indian Rupee Intl currency, dates & durations
│   └── types.ts                # TypeScript interfaces and domain models
└── mock/
    ├── mock-alternatives.ts    # Realistic alternative trains with fare spread ₹980–₹5,200
    └── mock-trips.ts           # 7 diverse mock journeys spanning Indian rail corridors
```

---

## 🧪 Testing & Verification

Run the test suite and validation scripts locally:

```bash
# 1. Run all unit and security test suites
npm test -- --run

# 2. Scan tracked repository files for hardcoded secrets
npm run check:secrets

# 3. Typecheck TypeScript across all files
npx tsc --noEmit

# 4. Run ESLint checks
npm run lint

# 5. Create production build bundle
npm run build
```

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!
1. Fork this repository.
2. Create your branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to your branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. Built with care for Indian railway passengers.
