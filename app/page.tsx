import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PreviewTransformation } from "@/components/landing/preview-transformation";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "TravelRescue — Something went wrong. We've got this.",
  description:
    "When your train gets delayed or cancelled, TravelRescue ranks the best alternative railway schedules and gets you back on track in minutes.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* 1. Navbar */}
      <LandingNavbar />

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="px-4 py-16 md:py-24 text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
            Something went wrong.
            <br />
            <span className="text-primary">We&rsquo;ve got this.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            When your train gets cancelled or delayed, TravelRescue scans available railway schedules, ranks the best alternatives, and gets you rebooked in minutes.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-7 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors touch-target shadow-card flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/help"
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-border bg-surface text-foreground font-medium text-sm hover:bg-background transition-colors touch-target"
            >
              How Train Refunds Work
            </Link>
          </div>

          {/* Static Transformation Preview */}
          <PreviewTransformation />
        </section>

        {/* 3. Reassurance Strip (No Fake Stats) */}
        <section className="border-y border-border bg-surface py-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-around gap-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Direct Indian Railways schedule coordination</span>
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Transparent fares with automatic refund tracking</span>
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Full compliance with Railway Passenger Charter rules</span>
            </span>
          </div>
        </section>

        {/* 4. 3 Features */}
        <section id="features" className="py-16 px-4 max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Built for stressful travel moments
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Every detail is designed to answer three questions: What happened? What can I do? What happens next?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-surface shadow-card space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Instant Disruption Detection
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatic PNR tracking catches train cancellations and rake delays before station counters get overwhelmed.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface shadow-card space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Berth-First Intelligent Ranking
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our deterministic algorithm prioritises confirmed seats over Waitlist/RAC, your travel class, and arrival fit.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-surface shadow-card space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                1-Click Journey Recovery
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clear side-by-side comparison of cancelled vs replacement trains, transparent fare differences, and new PNR generation.
              </p>
            </div>
          </div>
        </section>

        {/* 5. 3-Step "How it works" */}
        <section id="how-it-works" className="py-16 px-4 bg-surface border-t border-border">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                How it works
              </h2>
              <p className="text-sm text-muted-foreground">
                Three simple steps to regain control of your train journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Disruption Alert
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We monitor your 10-digit PNR and detect delays or cancellations immediately with plain-language explanations.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Review Ranked Options
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compare verified alternative trains automatically scored by arrival fit, budget threshold, and confirmed berth status.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Confirm & Board
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Confirm your replacement journey, receive your new PNR and coach/berth details ready for platform boarding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-border py-8 px-4 bg-background">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{APP_NAME}</span>
            <span>—</span>
            <span>{APP_TAGLINE}</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted-foreground">
              Sample data
            </span>
            <Link href="/dashboard" className="hover:text-foreground transition-colors touch-target">
              Dashboard
            </Link>
            <Link href="/preferences" className="hover:text-foreground transition-colors touch-target">
              Preferences
            </Link>
            <Link href="/help" className="hover:text-foreground transition-colors touch-target">
              Help & FAQs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
