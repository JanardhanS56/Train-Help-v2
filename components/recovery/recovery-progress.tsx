"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface RecoveryProgressProps {
  onComplete: () => void;
}

const STEPS = [
  "Checked your booking",
  "Reviewed your preferences",
  "Compared alternatives",
  "Ranked suitable options",
];

export function RecoveryProgress({ onComplete }: RecoveryProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 800);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete, prefersReducedMotion]);

  // Static version under reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 text-center max-w-md mx-auto shadow-card space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Alternatives Ready
        </h2>
        <div className="space-y-2 text-left text-xs">
          {STEPS.map((step) => (
            <div key={step} className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card"
        >
          View Suitable Trains
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-surface rounded-xl border border-border p-8 text-center max-w-md mx-auto shadow-card my-6 space-y-6"
      role="region"
      aria-label="Recovery progress"
      aria-live="polite"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Finding your best recovery trains
        </h2>
        <p className="text-xs text-muted-foreground">
          Scanning verified schedules, quotas, and arrival deadlines...
        </p>
      </div>

      {/* Progress Bar (No spinners) */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Progress Steps List */}
      <div className="space-y-3 text-left max-w-xs mx-auto py-2">
        {STEPS.map((step, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm transition-all duration-200 ${
                isDone
                  ? "text-foreground font-medium"
                  : isCurrent
                  ? "text-primary font-bold"
                  : "text-muted-foreground/60"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
              ) : isCurrent ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                </div>
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      {/* Skip button */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline touch-target"
        >
          <span>Skip and view alternatives</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
