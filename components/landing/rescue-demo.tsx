"use client";

import React, { useReducer, useEffect, useRef, useTransition } from "react";
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrainFront,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  SAMPLE_TRAINS,
  SampleTrain,
  rankTrains,
  formatSeatLabel,
} from "./sampleData";
import { demoReducer, INITIAL_DEMO_STATE } from "./demo-reducer";

const STEP_MESSAGES = [
  "Checked your booking.",
  "Compared 5 trains.",
  "Ranked by your budget.",
];

interface RescueDemoProps {
  onStateChange?: (state: "idle" | "cancelled" | "recovered") => void;
}

export function RescueDemo({ onStateChange }: RescueDemoProps = {}) {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO_STATE);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  // Notify parent of demo state change
  useEffect(() => {
    if (state.phase === "recovered") {
      onStateChange?.("recovered");
    } else if (state.runId > 0 || state.phase === "cancelled") {
      onStateChange?.("cancelled");
    } else {
      onStateChange?.("idle");
    }
  }, [state.phase, state.runId, onStateChange]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    if (state.phase !== "cancelled") return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    dispatch({ type: "START" });
    const currentRunId = state.runId + 1;

    if (prefersReducedMotion) {
      // Instantly advance to alternatives without timers
      dispatch({ type: "STEP", runId: currentRunId });
      dispatch({ type: "STEP", runId: currentRunId });
      dispatch({ type: "STEP", runId: currentRunId });
      return;
    }

    // Single timer schedule chaining via runId
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        dispatch({ type: "STEP", runId: currentRunId });
      });

      timerRef.current = setTimeout(() => {
        startTransition(() => {
          dispatch({ type: "STEP", runId: currentRunId });
        });

        timerRef.current = setTimeout(() => {
          startTransition(() => {
            dispatch({ type: "STEP", runId: currentRunId });
          });
        }, 900);
      }, 800);
    }, 800);
  };

  const handleReplay = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    dispatch({ type: "REPLAY" });
  };

  const handleChoose = (id: string) => {
    dispatch({ type: "CHOOSE", id });
  };

  const rankResult = rankTrains(SAMPLE_TRAINS, 3500);
  const chosenTrain: SampleTrain | undefined = SAMPLE_TRAINS.find(
    (t) => t.id === state.chosenId
  );

  return (
    <section
      id="rescue-demo"
      aria-label="Interactive train disruption rescue demonstration"
      className="relative w-full max-w-[500px] mx-auto"
    >
      {/* Outer Paper Railway Ticket with notches */}
      <div className="relative rounded-2xl border border-border bg-surface text-foreground shadow-sm transition-all duration-200">
        {/* Ticket Header Stub */}
        <div className="p-5 sm:p-6 border-b border-dashed border-border/80 flex items-center justify-between gap-3 bg-muted/20 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrainFront className="w-4 h-4 stroke-[1.6]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">
                Journey Disruption Simulation
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">
                TR-DEMO-2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
              Sample data
            </span>
            {(state.phase === "alternatives" || state.phase === "recovered") && (
              <button
                type="button"
                onClick={handleReplay}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border bg-surface transition-colors"
                title="Restart demonstration"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replay</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content Area based on state */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* STATE 1: CANCELLED */}
          {state.phase === "cancelled" && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                role="status"
                className="p-3.5 rounded-xl border border-disruption/30 bg-disruption-tint text-disruption flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-disruption stroke-[2]" />
                  <div className="text-xs">
                    <span className="font-semibold uppercase tracking-wide">
                      Service Cancelled
                    </span>
                    <p className="text-[11px] opacity-90">
                      Rake issue reported at originating yard.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-background/80 border border-disruption/20">
                  12627
                </span>
              </div>

              {/* Station Route Layout with independent tracks to prevent overlap */}
              <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      From Station
                    </span>
                    <span className="text-sm font-semibold text-foreground block">
                      Bengaluru City
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      SBC · 19:20
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      To Station
                    </span>
                    <span className="text-sm font-semibold text-foreground block">
                      New Delhi
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      NDLS · 06:10 (+2d)
                    </span>
                  </div>
                </div>

                {/* Dotted Route Line with Centered Glyph Track */}
                <div className="relative py-2 flex items-center justify-between">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-disruption bg-background z-10" />
                  <div className="flex-1 mx-2 border-t-2 border-dashed border-border flex items-center justify-center relative">
                    <span className="px-2 py-0.5 bg-background rounded-full border border-border text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                      <TrainFront className="w-3.5 h-3.5 text-disruption" />
                      <span className="font-mono text-[10px]">Karnataka Exp</span>
                    </span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-muted-foreground bg-background z-10" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-hairline pt-2">
                  <span>Class: 3A · PNR 4820193756</span>
                  <span className="font-mono">Fare: ₹2,180</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                id="btn-rescue-start"
                onClick={handleStart}
                className="w-full h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span>Rescue this journey</span>
                <ArrowRight className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>
          )}

          {/* STATE 2: ANALYSING */}
          {state.phase === "analysing" && (
            <div
              className="space-y-4 py-2"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  Evaluating alternative schedules...
                </span>
                <span className="font-mono text-xs text-primary font-semibold">
                  Step {state.step} of 3
                </span>
              </div>

              <div className="space-y-2.5">
                {STEP_MESSAGES.map((msg, index) => {
                  const isDone = state.step > index;
                  const isCurrent = state.step === index;
                  return (
                    <div
                      key={msg}
                      className={`p-3 rounded-lg border text-xs flex items-center gap-3 transition-all duration-300 ${
                        isDone
                          ? "border-success/30 bg-success-tint text-success"
                          : isCurrent
                          ? "border-primary/40 bg-primary/5 text-foreground font-medium"
                          : "border-border/60 bg-muted/20 text-muted-foreground opacity-50"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                      )}
                      <span>{msg}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Deterministic comparison using sample timetables.
              </p>
            </div>
          )}

          {/* STATE 3: ALTERNATIVES */}
          {state.phase === "alternatives" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Ranked Alternatives
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Sorted by confirmed berths, arrival time, and budget.
                  </p>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  Budget ₹3,500
                </span>
              </div>

              <div className="space-y-2.5">
                {rankResult.all.map((item, idx) => {
                  const { train, isEligible, durationString, explanation } = item;
                  const isBest = idx === 0 && isEligible;

                  return (
                    <div
                      key={train.id}
                      className={`p-3.5 rounded-xl border text-xs transition-colors ${
                        isBest
                          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {train.name}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              #{train.number}
                            </span>
                            {isBest && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold tracking-wide">
                                <Sparkles className="w-2.5 h-2.5" />
                                Best Match
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {explanation}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold text-foreground">
                            ₹{train.fare.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`block font-mono text-[10px] font-medium ${
                              train.seat.type === "CNF"
                                ? "text-success font-semibold"
                                : train.seat.type === "RAC"
                                ? "text-warning font-semibold"
                                : "text-disruption"
                            }`}
                          >
                            {formatSeatLabel(train.seat)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-hairline flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3 font-mono">
                          <span>
                            {train.dep} → {train.arr} (+{train.arrDayOffset}d)
                          </span>
                          <span>•</span>
                          <span>{durationString}</span>
                        </div>

                        <button
                          type="button"
                          id={`btn-choose-${train.id}`}
                          onClick={() => handleChoose(train.id)}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Choose</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STATE 4: RECOVERED */}
          {state.phase === "recovered" && chosenTrain && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-success/30 bg-success-tint text-success flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
                <div className="text-xs">
                  <span className="font-semibold uppercase tracking-wide block">
                    Journey Recovered
                  </span>
                  <span>Replacement schedule confirmed with updated PNR.</span>
                </div>
              </div>

              {/* Recovery Ticket Details */}
              <div className="p-4 rounded-xl border border-border bg-background space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Confirmed Replacement Train
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {chosenTrain.name} (#{chosenTrain.number})
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-success-tint text-success border border-success/30">
                    {formatSeatLabel(chosenTrain.seat)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-hairline font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Departs
                    </span>
                    <span className="font-semibold text-foreground">
                      {chosenTrain.dep} · SBC
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">
                      Arrives
                    </span>
                    <span className="font-semibold text-foreground">
                      {chosenTrain.arr} (+{chosenTrain.arrDayOffset}d) · NDLS
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-foreground">
                      PNR 4820193756 (sample)
                    </span>
                    <span className="font-mono">
                      Fare: ₹{chosenTrain.fare.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-success">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Refund status: Requested (sample)</span>
                  </div>
                </div>
              </div>

              {/* Explicit Disclaimer */}
              <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-hairline text-center">
                Demonstration only. No ticket was booked and no refund was processed.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
