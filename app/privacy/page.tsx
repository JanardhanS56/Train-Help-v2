import type { Metadata } from "next";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Shield, Lock, FileText, CheckCircle2, ArrowLeft, Cookie, Server, HelpCircle } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy & Passenger Charter — TravelRescue",
  description:
    "How TravelRescue protects your Indian Railways PNR details, ensures zero payment credential storage, and guarantees 100% refund dispute compliance.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <LandingNavbar />

      <main className="flex-1 max-w-[860px] mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Passenger Data Protection Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Privacy Policy & Passenger Notice
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Effective Date: October 2026 · Compliant with the Indian Railways Passenger Charter and Digital Personal Data Protection (DPDP) Act.
          </p>
        </header>

        {/* Quick Highlights Box */}
        <div className="p-5 rounded-xl border border-border bg-surface space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
            Key Guarantees At A Glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>We never store credit card, debit card, or UPI PIN credentials.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>10-digit PNR queries are encrypted and purged after journey resolution.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>Sliding-window rate limiters prevent API abuse and automated scraping.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>Zero third-party tracking pixels or commercial ad retargeting.</span>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              1. Passenger Data We Process
            </h2>
            <p>
              When your train suffers an unexpected cancellation, diversion, or critical rake delay, TravelRescue processes the following data to compute viable alternative rail itineraries:
            </p>
            <ul className="list-disc pl-5 space-y-1 pt-1">
              <li><strong>10-digit Passenger Name Record (PNR):</strong> Used exclusively to retrieve current booking status, coach allocation, and berth numbers from official reservation manifests.</li>
              <li><strong>Travel Preference Parameters:</strong> Class preferences (1A, 2A, 3A, SL), maximum budget ceiling, and acceptable intermediate changeovers.</li>
              <li><strong>Session Authentication:</strong> Ephemeral login tokens verifying your passenger identity and active booking rights.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              2. Rate Limiting & Remote Protection
            </h2>
            <p>
              To maintain 100% operational reliability, avoid overwhelming railway reservation mirrors, and preserve compute quotas for all passengers, TravelRescue enforces automated sliding-window rate limiting:
            </p>
            <ul className="list-disc pl-5 space-y-1 pt-1">
              <li><strong>AI Assistant Queries:</strong> Capped at 10 requests per 60-second window per passenger client.</li>
              <li><strong>Simulation & Advice API:</strong> Capped at 15 requests per minute with automatic cooling periods.</li>
              <li><strong>Database Queries:</strong> Capped at 30 requests per minute with offline local snapshot fallback.</li>
            </ul>
            <p className="pt-1">
              Violations trigger temporary 429 status responses with standardized <code>Retry-After</code> headers. Frantic or automated repeated clicks are mitigated on the client side via anti-spam locks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
              <Cookie className="w-4 h-4 text-primary" />
              3. Cookies and Local Storage Policy
            </h2>
            <p>
              TravelRescue adheres to a strict minimalism principle regarding client-side storage:
            </p>
            <div className="p-4 rounded-lg bg-surface border border-hairline space-y-2 text-xs">
              <div>
                <strong>Essential Functional Cookies / LocalStorage:</strong>
                <p>Stores theme preference (Dark/Light), active recovery step progress, and cookie consent state.</p>
              </div>
              <div className="pt-2 border-t border-hairline">
                <strong>Third-Party Advertising Cookies:</strong>
                <p>None. We do not load external marketing pixels, data broker scripts, or behavioural surveillance trackers.</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              4. Indian Railways Passenger Charter Compliance
            </h2>
            <p>
              Under Indian Railways Ministry guidelines, when a train is cancelled or delayed by more than 3 hours, passengers are entitled to a full refund without deduction of clerkage charges. TravelRescue automates:
            </p>
            <ul className="list-disc pl-5 space-y-1 pt-1">
              <li>TDR (Ticket Deposit Receipt) claim filing reminders within 72 hours of scheduled departure.</li>
              <li>Verification of alternative berths before booking confirmation.</li>
              <li>Zero hidden markup on Indian Railways base fares and GST tariffs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              5. Grievance Officer & Contact
            </h2>
            <p>
              If you have inquiries regarding your passenger data, wish to request immediate erasure of your trip records, or report suspicious connection behavior, contact our privacy officer:
            </p>
            <div className="p-4 rounded-lg bg-surface border border-hairline text-xs space-y-1">
              <p className="font-semibold text-foreground">Passenger Data Protection Officer</p>
              <p>Email: <span className="font-mono text-primary">privacy@travelrescue.railmail.in</span></p>
              <p>Address: Rail Bhavan, New Delhi, India 110001</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-8 px-4 bg-surface/50">
        <div className="max-w-[860px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary stroke-[1.5]" />
            <span className="font-medium text-foreground">{APP_NAME}</span>
            <span>—</span>
            <span>{APP_TAGLINE}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/help" className="hover:text-foreground transition-colors">
              Help & FAQs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
