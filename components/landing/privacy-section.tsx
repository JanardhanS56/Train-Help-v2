import React from "react";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export function PrivacySection() {
  return (
    <section
      id="privacy"
      aria-labelledby="heading-privacy"
      className="py-16 px-4 md:px-6 bg-surface border-t border-hairline scroll-mt-20"
    >
      <div className="max-w-[860px] mx-auto p-6 md:p-8 rounded-2xl border border-border bg-background space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-primary">
            PRIVACY & DATA GOVERNANCE
          </span>
        </div>

        <div className="space-y-2">
          <h2
            id="heading-privacy"
            className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight"
          >
            Your journey details deserve care.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This prototype uses sample journeys to demonstrate how recovery could
            work. Session preferences are kept locally on your device; no
            passenger payment cards, UPI PINs, or travel identities are
            transmitted or stored remotely.
          </p>
        </div>

        <div className="pt-2 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Zero third-party telemetry or ad tracking cookies.
          </span>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <span>Read full Privacy Notice & Charter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
