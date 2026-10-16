"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, ListFilter, CheckCircle2 } from "lucide-react";
import { SAMPLE_TRAINS, formatSeatLabel } from "./sampleData";

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      aria-labelledby="heading-how-it-works"
      className="py-20 px-4 md:px-6 bg-surface border-t border-hairline scroll-mt-20"
    >
      <div className="max-w-[1120px] mx-auto space-y-12">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-primary block">
            THREE-STEP RECOVERY
          </span>
          <h2
            id="heading-how-it-works"
            className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-foreground tracking-tight"
          >
            Three steps to get moving again.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A simple, predictable sequence from disruption notification to
            platform boarding.
          </p>
        </div>

        {/* 3 Steps with Dotted Railway Track */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Track Line behind steps (Horizontal desktop / Vertical mobile) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-7 left-12 right-12 h-0.5 border-t-2 border-dashed border-border"
          >
            <div
              className={`h-full bg-primary transition-all duration-1000 ease-out ${
                inView ? "w-full" : "w-0"
              }`}
            />
          </div>

          {/* STEP 1: Disruption alert */}
          <div className="relative p-6 rounded-xl border border-border bg-background space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full border-2 border-primary bg-surface flex items-center justify-center font-mono text-xs font-bold text-primary z-10">
                01
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-disruption-tint text-disruption border border-disruption/20">
                <AlertTriangle className="w-3 h-3" />
                Cancelled Badge
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground">
                Disruption Alert
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clear notification indicating what changed, why the service was
                affected, and which journey needs immediate attention.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-hairline bg-surface text-[11px] text-muted-foreground space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-foreground font-medium">Tr #12627</span>
                <span className="text-disruption font-semibold">Cancelled</span>
              </div>
              <p className="text-[10px]">TDR auto-filed with zero clerkage fee.</p>
            </div>
          </div>

          {/* STEP 2: Review ranked options */}
          <div className="relative p-6 rounded-xl border border-border bg-background space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full border-2 border-primary bg-surface flex items-center justify-center font-mono text-xs font-bold text-primary z-10">
                02
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                <ListFilter className="w-3 h-3" />
                Ranked Options
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground">
                Review Ranked Options
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compare verified alternative trains scored by confirmed berths,
                arrival time, fare differences, and travel class.
              </p>
            </div>

            {/* Compact list from SAMPLE_TRAINS */}
            <div className="space-y-1.5 pt-1">
              {SAMPLE_TRAINS.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg border border-hairline bg-surface flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-semibold text-foreground block">
                      {t.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {t.dep} → {t.arr}
                    </span>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <span className="font-bold text-foreground block">
                      ₹{t.fare}
                    </span>
                    <span
                      className={
                        t.seat.type === "CNF"
                          ? "text-success font-semibold"
                          : "text-warning font-semibold"
                      }
                    >
                      {formatSeatLabel(t.seat)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: Confirm & board */}
          <div className="relative p-6 rounded-xl border border-border bg-background space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full border-2 border-primary bg-surface flex items-center justify-center font-mono text-xs font-bold text-primary z-10">
                03
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-success-tint text-success border border-success/30">
                <CheckCircle2 className="w-3 h-3" />
                Confirmed Recovery
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-foreground">
                Confirm & Board
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirm your replacement journey, receive your new sample PNR,
                and follow clear boarding directions to your platform.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-hairline bg-surface text-[11px] text-muted-foreground space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-mono font-semibold text-foreground">
                  PNR 4820193756
                </span>
                <span className="text-[10px] text-success font-medium">
                  Ready to board
                </span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Coach B4 · Berth 28 (Side Lower). Timetable updated on live dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
