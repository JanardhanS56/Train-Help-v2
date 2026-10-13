"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Alternative, UserPreferences } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "cn";

interface BudgetSectionProps {
  preferences: UserPreferences;
  allAlternatives: Alternative[];
  onChange: (patch: Partial<UserPreferences>) => void;
}

const MIN_BUDGET = 500;
const MAX_BUDGET = 10000;
const STEP = 100;

export function BudgetSection({
  preferences,
  allAlternatives,
  onChange,
}: BudgetSectionProps) {
  const currentBudget = preferences.maxBudget;
  const [inputValue, setInputValue] = useState(currentBudget.toString());
  const [prevBudget, setPrevBudget] = useState(currentBudget);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value when preferences.maxBudget changes externally (e.g. preset selection or undo)
  if (prevBudget !== currentBudget) {
    setPrevBudget(currentBudget);
    setInputValue(currentBudget.toString());
    setErrorMsg(null);
  }

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Compute alternative fare ticks (deduplicated and merged if within 400 of each other)
  const fareTicks = useMemo(() => {
    const rawFares = Array.from(new Set(allAlternatives.map((a) => a.fare))).sort(
      (a, b) => a - b
    );
    const merged: number[] = [];
    for (const fare of rawFares) {
      if (merged.length === 0 || fare - merged[merged.length - 1] >= 400) {
        merged.push(fare);
      }
    }
    return merged;
  }, [allAlternatives]);

  const withinBudgetCount = useMemo(() => {
    return allAlternatives.filter((a) => a.fare <= currentBudget).length;
  }, [allAlternatives, currentBudget]);

  function commitBudget(numVal: number) {
    if (isNaN(numVal)) {
      setErrorMsg("Please enter a valid amount between ₹500 and ₹10,000.");
      return;
    }
    const clamped = Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, Math.round(numVal / STEP) * STEP));
    setErrorMsg(null);
    setInputValue(clamped.toString());
    onChange({ maxBudget: clamped });
  }

  function handleSliderChange(val: number) {
    setInputValue(val.toString());
    setErrorMsg(null);

    // Debounce 150ms while dragging slider
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onChange({ maxBudget: val });
    }, 150);
  }

  function handleInputBlur() {
    const num = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
    commitBudget(num);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const num = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
      commitBudget(num);
    }
  }

  return (
    <section className="space-y-4 pt-6" aria-labelledby="budget-heading">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h2 id="budget-heading" className="text-base font-semibold text-foreground">
            Maximum Travel Budget
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set your per-passenger fare ceiling. Any train exceeding this limit is excluded.
          </p>
        </div>

        {/* Large Mono Value Display & Editable Input */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-semibold text-foreground font-mono" aria-hidden="true">
            ₹
          </span>
          <div className="relative">
            <label htmlFor="budget-input" className="sr-only">
              Maximum travel budget in rupees
            </label>
            <input
              id="budget-input"
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setErrorMsg(null);
              }}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              aria-invalid={Boolean(errorMsg)}
              aria-describedby={errorMsg ? "budget-error" : "budget-caption"}
              className="w-28 h-9 px-2.5 rounded-[6px] border border-border bg-background text-foreground font-mono text-base font-semibold text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <p id="budget-error" role="alert" className="text-xs text-disruption font-medium">
          {errorMsg}
        </p>
      )}

      {/* Linked Range Slider */}
      <div className="space-y-1.5 pt-2">
        <label htmlFor="budget-slider" className="sr-only">
          Adjust maximum budget slider
        </label>
        <input
          id="budget-slider"
          type="range"
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={STEP}
          value={inputValue}
          aria-valuemin={MIN_BUDGET}
          aria-valuemax={MAX_BUDGET}
          aria-valuenow={currentBudget}
          aria-valuetext={formatCurrency(currentBudget)}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />

        {/* Real Train Fare Ticks Bar */}
        <div className="relative w-full h-4 text-[10px] text-muted-foreground select-none" aria-hidden="true">
          <span className="absolute left-0">₹500</span>
          {fareTicks.map((fare) => {
            const pct = Math.max(0, Math.min(100, ((fare - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100));
            return (
              <span
                key={fare}
                className="absolute transform -translate-x-1/2 opacity-75 font-mono hidden sm:inline"
                style={{ left: `${pct}%` }}
                title={`Alternative fare: ${formatCurrency(fare)}`}
              >
                ·
              </span>
            );
          })}
          <span className="absolute right-0">₹10,000</span>
        </div>
      </div>

      {/* Quick Chips & Train count caption */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2" role="group" aria-label="Preset budget amounts">
          <span className="text-xs text-muted-foreground">Quick:</span>
          {[2000, 3500, 5000].map((amt) => {
            const isCurrent = currentBudget === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => commitBudget(amt)}
                className={cn(
                  "h-7 px-2.5 rounded-[6px] text-xs font-mono font-medium border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:bg-background"
                )}
              >
                {formatCurrency(amt)}
              </button>
            );
          })}
        </div>

        <p id="budget-caption" className="text-xs font-medium text-muted-foreground">
          <span className="text-foreground font-semibold font-mono">{withinBudgetCount}</span> of{" "}
          <span className="font-mono">{allAlternatives.length}</span> trains are within your budget
        </p>
      </div>
    </section>
  );
}
