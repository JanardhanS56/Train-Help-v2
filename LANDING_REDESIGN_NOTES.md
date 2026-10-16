# TravelRescue AI — Landing Page Redesign Notes (Master v5)

## Phase 0: Reconnaissance & Capability Matrix

### a) Landing Entry Point & Architecture
- **Entry point**: `app/page.tsx`
- **Framework**: Next.js 16.3.8 (App Router with Turbopack) & React 19.2.8.
- **SSR**: Server Component for `app/page.tsx` (fetches `getAllTrips()`), delegating client interactivity to dedicated `"use client"` components.

### b) Real Destinations & Auth Behavior
- **Dashboard**: `/dashboard`
- **Simulation**: `/simulation`
- **Help & FAQs**: `/help`
- **Privacy & Cookies**: `/privacy`
- **Preferences**: `/preferences`
- **Sign Out**: `signOut()` from `useAuth()` in `@/context/auth-context`.
- **Nav Auth Behavior**: When `isAuthenticated` is true, shows avatar initials (`user.name.slice(0, 2).toUpperCase()`) and a Sign Out button (`#btn-landing-signout`). When false, avatar and Sign Out are omitted; "Open Dashboard" remains prominently displayed.

### c) Theme Mechanism, Tokens, Fonts, Breakpoints
- **Theme Mechanism**: Class-based `.dark` on `html`, styled via Tailwind CSS v4 `@theme inline`.
- **Token Names & Hex References**:
  - Paper Background: `var(--background)` (`#FAF7F2` light, `#14171A` dark)
  - Surface: `var(--surface)` (`#FFFFFF` light, `#1C2024` dark)
  - Border: `var(--border)` (`#E8E2D9` light, `#2C3238` dark)
  - Hairline: `var(--hairline)` (`#EFEAE2` light, `#24282D` dark)
  - Navy Primary: `var(--primary)` (`#1E3A5F` light, `#6E9BD1` dark)
  - Primary Hover: `var(--primary-hover)` (`#16304F` light, `#5A87BD` dark)
  - Foreground: `var(--foreground)` (`#1F2328` light, `#ECEDEE` dark)
  - Muted Foreground: `var(--muted-foreground)` (`#5F6670` light, `#9AA2AB` dark)
  - Muted / Neutral Tint: `var(--muted)` / `var(--neutral-tint)` (`#F0ECE5` light, `#24292E` dark)
  - Success: `var(--success)` (`#2F7D6B` light, `#5DB89F` dark)
  - Success Tint: `var(--success-tint)` (`#E6F2EE` light, `#162620` dark)
  - Warning: `var(--warning)` (`#B7791F` light, `#D9A441` dark)
  - Warning Tint: `var(--warning-tint)` (`#FAF1DE` light, `#2B2313` dark)
  - Disruption: `var(--disruption)` (`#C2574A` light, `#E07A6C` dark)
  - Disruption Tint: `var(--disruption-tint)` (`#FBEDEA` light, `#2A1B19` dark)
- **Typography**:
  - `font-sans`: Inter
  - `font-display`: Newsreader (Fraunces/Georgia fallback)
  - `font-mono`: JetBrains Mono
- **Breakpoints**: Tailwind standard: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

### d) Storage & Network Usage Across the App
- **localStorage**: Used only for `travelrescue_cookie_consent_v1` (cookie consent level: essential vs all) and optional soundscape mute toggle in simulation.
- **Cookies**: Functional session tokens and consent tracking.
- **Network / API**: Client calls use internal `/api/*` routes (e.g. `/api/chat`, `/api/rebook`, `/api/sim/*`) with sliding-window rate limiters. Zero third-party tracker scripts.
- **Privacy Copy Mandate**: State explicitly that this is an independent prototype using sample data, storing only functional preferences locally without third-party tracking or remote credential retention.

### e) package.json Scripts & Git Status
- **Scripts**: `npm run dev` (Next dev), `npm run build` (Next build), `npm run lint` (ESLint), `npm run test` (Vitest).
- **Git Status**: Working tree on branch `main` with untracked workspace metadata and preserved uncommitted `.env.example` / `package-lock.json`. Per instructions: no branch switching with destructive actions; stay on current branch `main` and make local-only changes without remote push.

### f) Train-Icon / New Delhi Overlap Root Cause
- In `components/landing/railway-hero-visual.tsx`, the animated `<motion.div>` containing the `TrainFront` glyph was placed with `absolute left-6 top-1/2 -translate-y-1/2`, which shared the exact same coordinate track as the New Delhi origin pin and label (`left-6`). When `x: 0`, the glyph rendered directly over the `NEW DELHI` text.
- **Fix in redesign**: Station labels, train glyph, and departure times are separated into independent, dedicated CSS grid/flex tracks with `min-width: 0` and non-overlapping positioning.

### g) Capability Matrix
| Tool / Capability | Status | Notes |
|---|---|---|
| `npm run build` | AVAILABLE | Next.js 16 Turbopack build passed |
| `npm run lint` | AVAILABLE | ESLint 9 passed with 0 errors |
| `npx tsc --noEmit` | AVAILABLE | TypeScript 5.9 compiler check passed |
| `npm run test` | AVAILABLE | Vitest passed (11 suites, 64 tests) |
| Dev Server | AVAILABLE | Runs on `http://localhost:3000` |
| Headless Browser / Screenshots | AVAILABLE | Antigravity `browser_subagent` and `read_url_content` tools available |

---

## Requirement IDs (R1 – R40)
- **R1**: Skip-to-content accessible link (`#top` / `#main-content`)
- **R2**: Semantic HTML outline (header, nav, main, footer, section)
- **R3**: Exactly one H1 on the page with logical heading hierarchy
- **R4**: Nav link order: Logo, Features, How it works, Simulation, Help & FAQs, Privacy, user chip, Open Dashboard, Sign out
- **R5**: Sticky header with height compaction and hairline border after 24px scroll
- **R6**: Scroll-spy using IntersectionObserver setting `aria-current="true"` on active section link
- **R7**: Mobile (<768px) hamburger button with `aria-expanded`, `aria-controls`, accessible name
- **R8**: Mobile menu keyboard management: Escape closes, focus trap inside menu, focus restored to button, menu closes on navigation
- **R9**: Mobile menu body scroll locking on open and restoration on close/unmount
- **R10**: "Open Dashboard" button remains visible outside the mobile menu
- **R11**: Auth and Sign out reuse existing `useAuth()` hook without reimplementation
- **R12**: Hero badge "Made for Indian train journeys"
- **R13**: Hero H1 line 1 "Your journey." line 2 "Back on track." (display font italic, navy emphasis)
- **R14**: Hero description copy exact match to spec
- **R15**: Hero primary action "Open Dashboard" linking to `/dashboard`
- **R16**: Hero secondary action "Try the demo" smooth-scrolling to `#rescue-demo`, focusing first control, instant on reduced motion
- **R17**: Hero text link "See how it works" linking to `#how-it-works`
- **R18**: Hero layout: 2 columns on desktop (copy left, ticket right), stacked on mobile with zero text overlap; station labels, glyph and times on independent tracks
- **R19**: Single authoritative useReducer state shape `{ phase, step, runId, chosenId }`
- **R20**: Strict transition reducer ignoring invalid actions, stale runId, and double choose
- **R21**: Single timer ref with ~800ms/1600ms/2500ms steps tagged by runId; cleaned on replay/unmount; start button disabled once clicked; reduced motion skips timers straight to alternatives
- **R22**: Cancelled state: Bengaluru -> New Delhi sample journey, mono times, dotted route line with train glyph separate from station text, "Cancelled" with icon+text in disruption colour, "Rescue this journey" button, visible "Sample data" label
- **R23**: Analysing state: 3 sequential steps ("Checked your booking.", "Compared 5 trains.", "Ranked by your budget.") in `aria-live="polite"` region without implying real IRCTC booking queries
- **R24**: Alternatives state: 3 trains rendered from shared `SAMPLE_TRAINS` array showing name, number, dep/arr, derived duration, ₹ fare, seat status, Choose button
- **R25**: Best Match badge on rank #1 under shared comparator; dynamically generated explanation text from train fields
- **R26**: Recovered state: chosen train, updated dep/arr, fixed fake PNR, sample refund-status line, and explicit disclaimer "Demonstration only. No ticket was booked and no refund was processed."
- **R27**: Replay button in alternatives and recovered states resetting to cancelled
- **R28**: Pure derived duration and shared `rankTrains(trains, budget)` comparator in `/components/landing/sampleData.ts`
- **R29**: Unit tests for reducer (transitions, stale runId, double choose) and rankTrains/duration
- **R30**: Inline SVG + CSS scene (<60KB, no external assets) with converging rails, subtle sleepers, faint station, distant hills, optional slow train silhouette
- **R31**: Reserved aspect-ratio container (CLS < 0.05), pointer-events:none, aria-hidden, text-safe contrast via flat token tint behind text (>=4.5:1)
- **R32**: Parallax via refs + pointer events (<=12px) only on fine pointers (`hover:hover` and `pointer:fine`), never on text; pause animation when off-screen (IntersectionObserver) or `document.hidden`; prefers-reduced-motion fallback
- **R33**: Trust strip with hairline dividers: (1) "Built around Indian train journeys" (2) "Refund tracking, step by step" (3) privacy/sample-data notice derived strictly from Phase 0(d); no unsupported claims
- **R34**: Problem/Promise section: H2 "When a train is cancelled, you're left with 5 tabs and no plan." Two-column comparison (Without vs With TravelRescue) using hairline dividers, typography, and no nested cards
- **R35**: Four differently sized bento tiles (~12px radius, 24px padding, 1px border token)
- **R36**: Bento Tile A (Ranked for you): range slider (1000-4000, step 50, default 3500, aria-valuetext "₹N") re-ranking `SAMPLE_TRAINS` via `rankTrains`, showing "N of 3 within budget", current best match, and zero-match neutral fallback
- **R37**: Bento Tile B (Confirmed seats first): illustrative "WL 4" with accessible disclosure button (`aria-expanded`) explaining RAC and waitlist without false confirmation guarantees
- **R38**: Bento Tile C (Refunds, tracked): "Requested -> Processing -> Refunded" tracker animating once on viewport entry, reduced motion fallback, labelled "Illustrative sample"
- **R39**: Bento Tile D (Nearby stations): "Yesvantpur · 25 min", labelled "Sample data"
- **R40**: How it works (#how-it-works, 3-step progress with dotted line), Simulation band (#simulation, solid navy, high contrast, non-interactive tags, real link), Help accordion (#help, 5 native button accordions, aria-expanded/aria-controls, verified content, link to /help), Privacy (#privacy, verified Phase 0d copy, link to /privacy), Final CTA ("Your train was disrupted. We've got this.", Open Dashboard), and semantic Footer (real links, sample data note).

---

## Decisions Log
- **D1 (Git Branch)**: Maintained existing working tree on `main` to preserve uncommitted local configs as instructed.
- **D2 (Shared Data Location)**: Defined single source of truth for demo and features in `components/landing/sampleData.ts`.
- **D3 (Tokens)**: Exclusively reused existing Tailwind design tokens (`var(--background)`, `var(--surface)`, `var(--border)`, `var(--hairline)`, `var(--primary)`, `var(--disruption)`, `var(--success)`, `var(--warning)`).
