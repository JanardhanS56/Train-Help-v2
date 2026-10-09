"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { formatCurrency } from "@/lib/format";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import type { UserPreferences } from "@/lib/types";
import { TransportPreferences } from "@/components/preferences/transport-preferences";
import { ClassPreferences } from "@/components/preferences/class-preferences";

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
        showToast(`${count} options now fit your new budget`);
      } else if (key === "includeNearbyStations") {
        showToast(
          value
            ? "Nearby stations included in recovery search"
            : "Nearby stations excluded"
        );
      } else if (key === "preferredClass") {
        showToast(`Preferred class updated to ${value}`);
      } else {
        showToast("Preferences saved. Live rankings recalculated.");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Travel Preferences
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rankings and recovery train suggestions adapt automatically to your choices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors touch-target shadow-card"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset defaults</span>
        </button>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-medium flex items-center gap-2 animate-in fade-in-50 duration-150 shadow-card"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Maximum Budget Slider */}
      <section className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Maximum Fare Budget per Passenger
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Alternative rankings re-evaluate instantly as you adjust.
            </p>
          </div>
          <span className="text-base font-bold text-primary font-mono px-3 py-1 rounded-lg bg-background border border-border">
            {formatCurrency(prefs.maxBudget)}
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={1000}
            max={6000}
            step={250}
            value={prefs.maxBudget}
            onChange={(e) => updateField("maxBudget", Number(e.target.value))}
            aria-label="Maximum fare budget per passenger"
            className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
            <span>₹1,000</span>
            <span>₹3,500</span>
            <span>₹6,000</span>
          </div>
        </div>
      </section>

      {/* 2. Preferred Transport Modes */}
      <TransportPreferences prefs={prefs} onUpdate={updateField} />

      {/* 3. Preferred Class */}
      <ClassPreferences
        preferredClass={prefs.preferredClass}
        onUpdate={(tc) => updateField("preferredClass", tc)}
      />

      {/* 4. Max Changes & Timings */}
      <section className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-4">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Changes & Schedule Boundaries
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure acceptable train changes and arrival deadlines.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-2">
            Maximum Allowed Train Changes
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "direct", label: "Direct only" },
              { id: "max-1", label: "Up to 1 change" },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors touch-target ${
                  prefs.maxChangesPreference === opt.id
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Preferred Departure Window
            </label>
            <select
              value={prefs.departureWindow}
              onChange={(e) => updateField("departureWindow", e.target.value as UserPreferences["departureWindow"])}
              className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="any">Any time</option>
              <option value="morning">Morning (06:00 – 12:00)</option>
              <option value="afternoon">Afternoon (12:00 – 18:00)</option>
              <option value="evening">Evening (18:00 – 24:00)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Latest Acceptable Arrival
            </label>
            <input
              type="time"
              value={prefs.latestArrival}
              onChange={(e) => updateField("latestArrival", e.target.value)}
              className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </section>

      {/* 5. Flexibility & Stations */}
      <section className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-3">
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-background transition-colors">
          <input
            type="checkbox"
            checked={prefs.flexibleSchedule}
            onChange={(e) => updateField("flexibleSchedule", e.target.checked)}
            className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">Flexible Schedule (±3 hours)</p>
            <p className="text-[11px] text-muted-foreground">
              Allows ranking trains slightly outside window if fare or speed is significantly better.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-background transition-colors">
          <input
            type="checkbox"
            checked={prefs.includeNearbyStations}
            onChange={(e) => updateField("includeNearbyStations", e.target.checked)}
            className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">Include Nearby Stations</p>
            <p className="text-[11px] text-muted-foreground">
              Scan alternate city terminals (e.g. Yesvantpur YPR for Bengaluru, Hazrat Nizamuddin NZM for Delhi).
            </p>
          </div>
        </label>
      </section>
    </div>
  );
}
