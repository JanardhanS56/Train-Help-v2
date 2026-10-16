import React from "react";
import Link from "next/link";
import { TrainFront, ArrowRight, Shield } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function FinalCtaFooter() {
  return (
    <>
      {/* Final Action Callout */}
      <section
        aria-labelledby="heading-final-cta"
        className="py-20 px-4 md:px-6 bg-surface border-t border-hairline text-center"
      >
        <div className="max-w-[700px] mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto">
            <TrainFront className="w-6 h-6 stroke-[1.5]" />
          </div>

          <h2
            id="heading-final-cta"
            className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-foreground tracking-tight"
          >
            Your train was disrupted. We&apos;ve got this.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Stop waiting in line at platform counters. Compare confirmed
            alternatives, track your refunds, and protect your travel schedule.
          </p>

          <div className="pt-2 flex justify-center">
            <Link
              href="/dashboard"
              className="h-11 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors inline-flex items-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[1.8]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Semantic Footer */}
      <footer className="border-t border-hairline py-10 px-4 md:px-6 bg-background text-xs text-muted-foreground">
        <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-primary shrink-0 stroke-[1.6]" />
            <span className="font-semibold text-foreground">{APP_NAME}</span>
            <span>—</span>
            <span>{APP_TAGLINE}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-surface">
              Sample data
            </span>
          </div>

          <nav
            aria-label="Footer navigation links"
            className="flex flex-wrap items-center gap-6 font-medium"
          >
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/preferences"
              className="hover:text-foreground transition-colors"
            >
              Preferences
            </Link>
            <Link
              href="/help"
              className="hover:text-foreground transition-colors"
            >
              Help & FAQs
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy & Cookies
            </Link>
          </nav>
        </div>

        <div className="max-w-[1120px] mx-auto pt-6 mt-6 border-t border-hairline text-center text-[11px] text-muted-foreground/80">
          <p>
            TravelRescue is an independent passenger disruption response prototype.
            Timetables, PNRs, and refund trackers shown on this landing page are
            for demonstration purposes only.
          </p>
        </div>
      </footer>
    </>
  );
}
