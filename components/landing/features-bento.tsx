"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  Sparkles,
  ChevronDown,
  MapPin,
} from "lucide-react";
import {
  SAMPLE_TRAINS,
  rankTrains,
  formatSeatLabel,
} from "./sampleData";

export function FeaturesBento() {
  // Tile A state: Budget range slider (local state only)
  const [budget, setBudget] = useState(3500);
  const rankResult = rankTrains(SAMPLE_TRAINS, budget);

  // Tile B state: Disclosure for Waitlist / RAC
  const [isWlExpanded, setIsWlExpanded] = useState(false);

  // Tile C state: Animated refund tracker (animates once on viewport entry)
  const [refundStep, setRefundStep] = useState(0); // 0=Requested, 1=Processing, 2=Refunded
  const refundContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = refundContainerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setRefundStep(2);
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          // Animate sequence once
          setTimeout(() => setRefundStep(1), 600);
          setTimeout(() => setRefundStep(2), 1500);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      className="py-20 px-4 md:px-6 max-w-[1120px] mx-auto space-y-12 scroll-mt-20"
      aria-labelledby="heading-features"
    >
      <div className="space-y-2 max-w-2xl">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-primary block">
          CORE CAPABILITIES
        </span>
        <h2
          id="heading-features"
          className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-foreground tracking-tight"
        >
          Engineered for stressful railway moments
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Four practical tools designed to replace station counter chaos with
          deterministic, berth-first clarity.
        </p>
      </div>

      {/* Bento Grid: 4 differently sized tiles */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* TILE A: Ranked for you (Largest tile: 8 cols on desktop) */}
        <div className="md:col-span-8 p-6 rounded-xl border border-border bg-surface space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Ranked for your budget
                </h3>
                <span className="text-xs text-muted-foreground">
                  Confirmed berths prioritised over waitlist
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground">
                {rankResult.eligible.length} of 3 within budget
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2.5 bg-background p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="input-budget-slider"
                className="font-medium text-foreground cursor-pointer"
              >
                Maximum Fare Threshold
              </label>
              <span className="font-mono text-sm font-bold text-primary">
                ₹{budget.toLocaleString("en-IN")}
              </span>
            </div>

            <input
              id="input-budget-slider"
              type="range"
              min="1000"
              max="4000"
              step="50"
              value={budget}
              aria-valuemin={1000}
              aria-valuemax={4000}
              aria-valuenow={budget}
              aria-valuetext={`₹${budget}`}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>₹1,000</span>
              <span>₹2,500</span>
              <span>₹4,000</span>
            </div>
          </div>

          {/* Dynamic Re-ranking Output */}
          <div className="space-y-3">
            {rankResult.all.length === 0 || rankResult.eligible.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-background text-center py-6 space-y-1">
                <p className="text-xs font-medium text-foreground">
                  No sample trains fit this budget. Raise it to see options.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Try adjusting the slider above ₹1,420 to include Sample Express.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankResult.all.map((item, idx) => {
                  const { train, isEligible, durationString, explanation } = item;
                  const isBest = idx === 0 && isEligible;

                  return (
                    <div
                      key={train.id}
                      className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        !isEligible
                          ? "opacity-50 border-border bg-muted/20"
                          : isBest
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {train.name}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{train.number}
                          </span>
                          {isBest && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                              <Sparkles className="w-2.5 h-2.5" />
                              Best Match
                            </span>
                          )}
                          {!isEligible && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-muted text-muted-foreground border border-border">
                              Over budget
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {explanation}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono text-xs">
                        <span className="text-muted-foreground">
                          {train.dep} ({durationString})
                        </span>
                        <span
                          className={`font-semibold ${
                            train.seat.type === "CNF"
                              ? "text-success"
                              : train.seat.type === "RAC"
                              ? "text-warning"
                              : "text-disruption"
                          }`}
                        >
                          {formatSeatLabel(train.seat)}
                        </span>
                        <span className="font-bold text-foreground">
                          ₹{train.fare.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Stack: Tiles B, C, D (4 cols on desktop) */}
        <div className="md:col-span-4 space-y-6">
          {/* TILE B: Confirmed Seats First (with Accessible Disclosure) */}
          <div className="p-6 rounded-xl border border-border bg-surface space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Seat Allocation
              </span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-warning-tint text-warning border border-warning/30">
                WL 4 Sample
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                Confirmed seats first
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We always surface guaranteed berths before RAC and Waitlist to
                avoid last-minute platform uncertainty.
              </p>
            </div>

            {/* Accessible Disclosure Button */}
            <div className="border-t border-hairline pt-3">
              <button
                type="button"
                id="btn-disclosure-waitlist"
                aria-expanded={isWlExpanded}
                aria-controls="disclosure-waitlist-content"
                onClick={() => setIsWlExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                <span>What do RAC & Waitlist mean?</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isWlExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isWlExpanded && (
                <div
                  id="disclosure-waitlist-content"
                  className="mt-2.5 p-3 rounded-lg border border-border bg-background text-[11px] text-muted-foreground space-y-2 leading-relaxed"
                >
                  <p>
                    <strong className="text-foreground">RAC (Reservation Against Cancellation):</strong> You are guaranteed travel on the train and share a side-lower berth.
                  </p>
                  <p>
                    <strong className="text-foreground">Waitlist (WL):</strong> No berth is allocated. You cannot board reserved coaches unless confirmed prior to chart preparation.
                  </p>
                  <p className="text-[10px] italic border-t border-hairline pt-1 text-muted-foreground">
                    Notice: Confirmation depends on railway cancellations; TravelRescue never guarantees waitlist progression.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TILE C: Refunds, Tracked (Viewport Animating Sequence) */}
          <div
            ref={refundContainerRef}
            className="p-6 rounded-xl border border-border bg-surface space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Automatic Reconciliation
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
                Illustrative sample
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Refunds, tracked step by step
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time clarity on TDR filing and railway refund processing.
              </p>
            </div>

            {/* Step Tracker */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px]">
              <div
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  refundStep >= 0
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span>1. Requested</span>
              </div>
              <div
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  refundStep >= 1
                    ? "border-warning/40 bg-warning-tint text-warning font-semibold"
                    : "border-border text-muted-foreground opacity-60"
                }`}
              >
                <span>2. Processing</span>
              </div>
              <div
                className={`p-2 rounded-lg border transition-all duration-300 ${
                  refundStep >= 2
                    ? "border-success/40 bg-success-tint text-success font-semibold"
                    : "border-border text-muted-foreground opacity-60"
                }`}
              >
                <span>3. Refunded</span>
              </div>
            </div>
          </div>

          {/* TILE D: Nearby Stations */}
          <div className="p-6 rounded-xl border border-border bg-surface space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Multi-Terminal Hubs
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
                Sample data
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Yesvantpur (YPR)
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  25 min transit from SBC hub
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
