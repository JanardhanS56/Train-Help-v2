"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { RescueDemo } from "./rescue-demo";
import { Hero3DScene } from "./scene/hero-3d-scene";
import type { DemoSceneState } from "./scene/scene-tokens";

export function LandingHero() {
  const [demoSceneState, setDemoSceneState] = useState<DemoSceneState>("idle");

  const handleTryDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const demoEl = document.getElementById("rescue-demo");
    if (!demoEl) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    demoEl.scrollIntoView({
      behavior: prefersReducedMotion ? "instant" : "smooth",
      block: "center",
    });

    // Move focus to first actionable control
    setTimeout(() => {
      const firstActionable = demoEl.querySelector<HTMLElement>(
        "button, a[href], input"
      );
      firstActionable?.focus();
    }, prefersReducedMotion ? 50 : 400);
  };

  return (
    <section
      id="top"
      aria-label="Travel disruption recovery introduction"
      className="relative overflow-hidden pt-12 pb-20 md:py-24 px-4 md:px-6"
    >
      {/* 3D WebGL Rails Scene with Automatic Capability Detection & SVG Fallback */}
      <Hero3DScene demoState={demoSceneState} />

      {/* Hero Content Grid: Two columns on desktop, stacked on mobile */}
      <div className="relative z-10 max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Copy & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Made for Indian train journeys</span>
          </div>

          {/* Exactly one H1 on the page */}
          <h1 className="text-4xl sm:text-5xl md:text-[56px] font-display font-medium text-foreground tracking-tight leading-[1.12]">
            <span>Your journey.</span>
            <br />
            <span className="text-primary italic font-serif">Back on track.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            When your train is cancelled or delayed, we help you compare
            alternatives, protect your budget, and know your next step.
          </p>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary Action */}
            <Link
              href="/dashboard"
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[1.8]" />
            </Link>

            {/* Secondary Action: Try the demo */}
            <a
              href="#rescue-demo"
              onClick={handleTryDemo}
              className="h-11 px-5 rounded-xl border border-primary/30 bg-surface/90 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span>Try the demo</span>
              <ChevronDown className="w-4 h-4" />
            </a>

            {/* Text link */}
            <a
              href="#how-it-works"
              className="h-11 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center underline-offset-4 hover:underline"
            >
              See how it works →
            </a>
          </div>
        </div>

        {/* Right Column: Hero Ticket Demo (5 cols) */}
        <div className="lg:col-span-5 w-full">
          <RescueDemo onStateChange={setDemoSceneState} />
        </div>
      </div>
    </section>
  );
}
