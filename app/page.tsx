import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { TrustProblemSection } from "@/components/landing/trust-problem-section";
import { FeaturesBento } from "@/components/landing/features-bento";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SimulationBand } from "@/components/landing/simulation-band";
import { HelpAccordion } from "@/components/landing/help-accordion";
import { PrivacySection } from "@/components/landing/privacy-section";
import { FinalCtaFooter } from "@/components/landing/final-cta-footer";

export const metadata: Metadata = {
  title: "TravelRescue — Indian Railways disruption recovery",
  description:
    "When your train is cancelled or delayed, TravelRescue helps you compare alternative rail journeys, protect your budget, and get your next steps clear.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* 1. Header & Navigation */}
      <LandingNavbar enableScrollHide />

      {/* 2. Main Content Outline */}
      <main id="main-content" className="flex-1 pt-16">
        {/* Hero Section (#top) with Ambient Rails Scene & Interactive Rescue Demo */}
        <LandingHero />

        {/* Trust Reassurance Strip & Problem/Promise Contrast */}
        <TrustProblemSection />

        {/* Features Bento Grid (#features) */}
        <FeaturesBento />

        {/* Three-Step Recovery Sequence (#how-it-works) */}
        <HowItWorksSection />

        {/* Interactive Simulation Callout Band (#simulation) */}
        <SimulationBand />

        {/* Frequently Asked Questions (#help) */}
        <HelpAccordion />

        {/* Data Privacy & Charter Governance Notice (#privacy) */}
        <PrivacySection />
      </main>

      {/* 3. Final Call to Action & Semantic Footer */}
      <FinalCtaFooter />
    </div>
  );
}
