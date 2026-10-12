"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import type { UserPreferences, TravelClass } from "@/lib/types";

const travelClasses: { code: TravelClass; label: string; desc: string }[] = [
  { code: "3A", label: "3A", desc: "AC 3-Tier" },
  { code: "2A", label: "2A", desc: "AC 2-Tier" },
  { code: "1A", label: "1A", desc: "AC 1st Class" },
  { code: "SL", label: "SL", desc: "Sleeper Class" },
  { code: "CC", label: "CC", desc: "AC Chair Car" },
  { code: "EC", label: "EC", desc: "Exec Chair Car" },
];

export function PreferencesForm() {
  const { state, alternatives } = useApp();
  const dispatch = useAppDispatch();
  const prefs = state.preferences;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function updateField<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    try {
      dispatch({
        type: "UPDATE_PREFERENCES",
        preferences: { [key]: value },
      });

      if (key === "maxBudget") {
        const count = alternatives.filter((a) => a.fare <= (value as number)).length;
        showToast(`${count} options fit your budget`);
      } else {
        showToast("Preferences saved.");
      }
    } catch {
      // Local error handling
    }
  }

  function handleReset() {
    try {
      dispatch({
        type: "UPDATE_PREFERENCES",
        preferences: DEFAULT_PREFERENCES,
      });
      showToast("Preferences reset to default values");
    } catch {
      // Local error handling
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header in Display Font */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-[28px] font-display text-foreground tracking-tight leading-tight">
            Travel Preferences
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Recovery ranking algorithm automatically re-evaluates alternatives based on your criteria.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border bg-surface text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset defaults</span>
        </button>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="p-3 rounded-lg bg-success-tint border border-success/30 text-xs text-success font-medium flex items-center gap-2 animate-in fade-in-50 duration-150"
        >
          <Check className="w-4 h-4 stroke-[2] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grouped Preferences Container with Hairline Dividers (not a card per setting) */}
      <div className="bg-surface rounded-xl border border-border p-6 divide-y divide-hairline">
        {/* 1. Maximum Budget */}
        <section className="pb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Maximum Fare Budget per Passenger
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Trains within this threshold receive budget scoring priority.
              </p>
            </div>
            <span className="text-sm font-mono font-semibold text-foreground px-2.5 py-1 rounded bg-background border border-border">
              {formatCurrency(prefs.maxBudget)}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min={1000}
              max={6000}
              step={250}
              value={prefs.maxBudget}
              onChange={(e) => updateField("maxBudget", Number(e.target.value))}
              aria-label="Maximum fare budget per passenger"
              className="w-full accent-primary h-1.5 bg-muted rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>₹1,000</span>
              <span>₹3,500</span>
              <span>₹6,000</span>
            </div>
          </div>
        </section>

        {/* 2. Preferred Class */}
        <section className="py-6 space-y-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Preferred Travel Class
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Alternatives with confirmed seats in your preferred tier rank higher.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {travelClasses.map((tc) => {
              const isSelected = prefs.preferredClass === tc.code;
              return (
                <button
                  key={tc.code}
                  type="button"
                  onClick={() => updateField("preferredClass", tc.code)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border bg-background text-foreground hover:bg-surface"
                  }`}
                >
                  <p className="text-xs font-medium">{tc.label}</p>
                  <p className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{tc.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Changes & Timings */}
        <section className="py-6 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Train Changes & Schedule Boundaries
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set maximum acceptable transfers and target arrival limits.
            </p>
          </div>

          <div>
            <label className="micro-label block mb-2">MAXIMUM TRANSFERS</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "direct", label: "Direct trains only" },
                { id: "max-1", label: "Up to 1 change" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-center p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    prefs.maxChangesPreference === opt.id
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border bg-background text-foreground hover:bg-surface"
                  }`}
                >
                  <input
                    type="radio"
                    name="maxChangesPreference"
                    value={opt.id}
                    checked={prefs.maxChangesPreference === opt.id}
                    onChange={() => updateField("maxChangesPreference", opt.id as UserPreferences["maxChangesPreference"])}
                    className="sr-only"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="micro-label block mb-1">DEPARTURE WINDOW</label>
              <select
                value={prefs.departureWindow}
                onChange={(e) => updateField("departureWindow", e.target.value as UserPreferences["departureWindow"])}
                className="w-full text-xs rounded border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="any">Any time</option>
                <option value="morning">Morning (06:00 – 12:00)</option>
                <option value="afternoon">Afternoon (12:00 – 18:00)</option>
                <option value="evening">Evening (18:00 – 24:00)</option>
              </select>
            </div>

            <div>
              <label className="micro-label block mb-1">LATEST ARRIVAL DEADLINE</label>
              <input
                type="time"
                value={prefs.latestArrival}
                onChange={(e) => updateField("latestArrival", e.target.value)}
                className="w-full text-xs rounded border border-border bg-background p-2 font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </section>

        {/* 4. Flexibility & Nearby Stations */}
        <section className="pt-6 space-y-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Flexibility & Alternate Terminals
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow broader search radii for emergency rail recovery.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer py-1.5 select-none">
            <input
              type="checkbox"
              checked={prefs.flexibleSchedule}
              onChange={(e) => updateField("flexibleSchedule", e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            <div>
              <p className="text-xs font-medium text-foreground">Flexible Schedule (±3 hours)</p>
              <p className="text-[11px] text-muted-foreground">
                Ranks trains outside primary window if arrival deadline or seat confirmation is superior.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer py-1.5 select-none">
            <input
              type="checkbox"
              checked={prefs.includeNearbyStations}
              onChange={(e) => updateField("includeNearbyStations", e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            <div>
              <p className="text-xs font-medium text-foreground">Include Nearby Station Terminals</p>
              <p className="text-[11px] text-muted-foreground">
                Scan adjacent metropolitan hubs (e.g. Yesvantpur YPR for Bengaluru, Nizamuddin NZM for Delhi).
              </p>
            </div>
          </label>
        </section>
      </div>
    </div>
  );
}
