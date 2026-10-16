"use client";

import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface RecoveryProgressProps {
  onComplete: () => void;
}

const STEPS = [
  "Checked your original booking",
  "Reviewed your travel preferences",
  "Scanned Indian Railways schedules",
  "Ranked confirmed alternative trains",
];

export function RecoveryProgress({ onComplete }: RecoveryProgressProps) {
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setCompletedSteps((prev) => {
        if (prev < STEPS.length) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(timer);
  }, [onComplete, prefersReducedMotion]);

  // Static under reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center max-w-sm mx-auto my-10 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            Alternatives ready
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Confirmed trains matching your journey
          </p>
        </div>

        <div className="space-y-2.5 text-left text-xs max-w-xs mx-auto">
          {STEPS.map((step) => (
            <div key={step} className="flex items-center gap-2 text-foreground">
              <Check className="w-4 h-4 text-success stroke-[2] shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="w-full h-10 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
        >
          View Suitable Trains
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-surface rounded-xl border border-border p-8 text-center max-w-sm mx-auto my-10 space-y-6"
      role="status"
      aria-label="Recovery progress"
      aria-live="polite"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-foreground font-display text-[22px]">
          Finding suitable alternatives
        </h2>
        <p className="text-xs text-muted-foreground">
          Evaluating quotas and arrival times for your route
        </p>
      </div>

      {/* Steps as vertical list with check icons that fade in */}
      <div className="space-y-3 text-left max-w-xs mx-auto py-2">
        {STEPS.map((step, index) => {
          const isDone = index < completedSteps;
          const isCurrent = index === completedSteps;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-xs transition-opacity duration-200 ${
                isDone
                  ? "opacity-100 text-foreground font-medium"
                  : isCurrent
                  ? "opacity-80 text-foreground font-normal"
                  : "opacity-30 text-muted-foreground"
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {isDone ? (
                  <Check className="w-4 h-4 text-success stroke-[2]" aria-hidden="true" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                )}
              </div>
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      {/* Skip button */}
      <div className="pt-3 border-t border-hairline">
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <span>Skip waiting</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
