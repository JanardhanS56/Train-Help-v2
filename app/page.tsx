import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Check, Shield, Activity, Sparkles } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { RailwayHeroVisual } from "@/components/landing/railway-hero-visual";
import { FeaturedTicketCard } from "@/components/trips/featured-ticket-card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { mockTrips } from "@/mock/data";

export const metadata: Metadata = {
  title: "TravelRescue — Indian Railways disruption recovery",
  description:
    "When your train gets delayed or cancelled, TravelRescue ranks the best alternative railway schedules and gets you back on track in minutes.",
};

export default function LandingPage() {
  // Real product preview: the cancelled trip (trip-4)
  const sampleTrip = mockTrips[3];

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* 1. Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 2. Indian Railways recovery hero */}
        <section className="max-w-[1120px] mx-auto px-4 md:px-6 pt-16 pb-20 space-y-12">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:gap-12">
            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>MADE FOR INDIAN RAILWAYS JOURNEYS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-[56px] font-display font-medium text-foreground tracking-tight leading-[1.12]">
                Something went wrong.
                <br />
                <span className="text-primary italic">We&rsquo;ve got this.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                When your train is cancelled or delayed, TravelRescue helps you
                compare alternative rail journeys, protect your budget, and get
                your next steps clear.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/dashboard"
                  className="h-10 px-6 rounded-[8px] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Open Passenger Dashboard</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </Link>
                <Link
                  href="/simulation"
                  className="h-10 px-5 rounded-[8px] border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 stroke-[1.5]" />
                  <span>Explore Rail Simulation</span>
                </Link>
                <Link
                  href="/help"
                  className="h-10 px-5 rounded-[8px] border border-border bg-surface text-foreground text-sm font-medium hover:bg-background transition-colors flex items-center justify-center"
                >
                  How refunds work
                </Link>
              </div>
            </div>

            <RailwayHeroVisual />
          </div>

          {/* Real Product Preview: The Featured Ticket Card */}
          <div className="space-y-2 pt-4">
            <span className="micro-label block">LIVE PRODUCT PREVIEW</span>
            <div className="max-w-4xl">
              <FeaturedTicketCard trip={sampleTrip} />
            </div>
          </div>
        </section>

        {/* 3. Reassurance Strip with hairlines */}
        <section className="border-y border-hairline bg-surface py-5 px-4">
          <div className="max-w-[1120px] mx-auto flex flex-wrap items-center justify-between gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary stroke-[1.5]" />
              <span>Direct Indian Railways reservation manifest matching</span>
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success stroke-[2]" />
              <span>Automatic 100% refund tracking with zero clerkage fee</span>
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary stroke-[1.5]" />
              <span>Railway Passenger Charter compliance</span>
            </span>
          </div>
        </section>

        {/* 4. Left-Aligned 3 Features */}
        <section id="features" className="py-20 px-4 max-w-[1120px] mx-auto space-y-10">
          <div className="space-y-1">
            <span className="micro-label">CORE CAPABILITIES</span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-foreground tracking-tight">
              Engineered for stressful railway moments
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Every interaction is built to answer three simple questions: What happened? What can I do? What happens next?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-surface space-y-2">
              <h3 className="text-base font-medium text-foreground">
                Disruption Detection
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatic 10-digit PNR monitoring identifies train cancellations and severe rake delays before station counters get overwhelmed.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface space-y-2">
              <h3 className="text-base font-medium text-foreground">
                Berth-First Ranking
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deterministic scoring engine prioritises confirmed berths over Waitlist and RAC, respecting your maximum budget and arrival deadline.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface space-y-2">
              <h3 className="text-base font-medium text-foreground">
                1-Click Manifest Rebooking
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clear side-by-side comparison of cancelled vs replacement trains, transparent fare differences, and new PNR ticket generation.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Left-Aligned How It Works */}
        <section id="how-it-works" className="py-20 px-4 bg-surface border-t border-hairline">
          <div className="max-w-[1120px] mx-auto space-y-10">
            <div className="space-y-1">
              <span className="micro-label">THREE-STEP RECOVERY</span>
              <h2 className="text-2xl md:text-3xl font-display font-medium text-foreground tracking-tight">
                How TravelRescue works
              </h2>
              <p className="text-sm text-muted-foreground">
                A simple, predictable sequence from disruption notification to platform boarding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="font-mono text-xs font-semibold text-primary">01</span>
                <h3 className="text-sm font-medium text-foreground">
                  Disruption Alert
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We monitor your active booking and report train status immediately with plain explanations and automatic refund trackers.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-semibold text-primary">02</span>
                <h3 className="text-sm font-medium text-foreground">
                  Review Ranked Options
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compare verified alternative trains scored by arrival fit, budget threshold, and confirmed berth status in a clean table view.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-semibold text-primary">03</span>
                <h3 className="text-sm font-medium text-foreground">
                  Confirm & Board
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Confirm your replacement journey, receive your new PNR and coach/berth details ready for railway platform check-in.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-hairline py-8 px-4 bg-background">
        <div className="max-w-[1120px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary stroke-[1.5]" />
            <span className="font-medium text-foreground">{APP_NAME}</span>
            <span>—</span>
            <span>{APP_TAGLINE}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/preferences" className="hover:text-foreground transition-colors">
              Preferences
            </Link>
            <Link href="/help" className="hover:text-foreground transition-colors">
              Help & FAQs
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy & Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
