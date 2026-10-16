"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { RotateCcw, Undo2, Check } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import type { UserPreferences } from "@/lib/types";
import { evaluateAlternatives, getActiveTrip } from "@/lib/matching";

import { PresetsSection } from "@/components/preferences/presets-section";
import { BudgetSection } from "@/components/preferences/budget-section";
import { ClassSection } from "@/components/preferences/class-section";
import { SeatsSection } from "@/components/preferences/seats-section";
import { ChangesSection } from "@/components/preferences/changes-section";
import { TimingSection } from "@/components/preferences/timing-section";
import { NearbyStationsSection } from "@/components/preferences/nearby-stations-section";
import { BerthSection } from "@/components/preferences/berth-section";
import { QuotaEligibilityAssistant } from "@/components/quota/quota-eligibility-assistant";
import { ResultsPanel } from "@/components/preferences/results-panel";

export function PreferencesForm() {
  const { state, candidateAlternatives, activeTrip: ctxActiveTrip } = useApp();
  const dispatch = useAppDispatch();
  const preferences = state.preferences;

  // Active disrupted unrecovered trip resolution (or selected trip)
  const activeTrip = useMemo(() => {
    return ctxActiveTrip || getActiveTrip(state.trips, state.selectedTripId, state.recoveryByTripId);
  }, [ctxActiveTrip, state.trips, state.selectedTripId, state.recoveryByTripId]);

  // Alternatives pool for active trip: full candidate pool before preference exclusion
  const allAlternatives = candidateAlternatives;

  // Deterministic evaluation using THE ONE SHARED FUNCTION
  const evaluation = useMemo(() => {
    return evaluateAlternatives(allAlternatives, preferences, activeTrip);
  }, [allAlternatives, preferences, activeTrip]);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Undo snapshot state
  const [undoSnapshot, setUndoSnapshot] = useState<UserPreferences | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update preferences with auto-save indicator
  const handleUpdate = useCallback(
    (patch: Partial<UserPreferences>) => {
      setSaveStatus("saving");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      try {
        dispatch({
          type: "UPDATE_PREFERENCES",
          preferences: patch,
        });

        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus("saved");
        }, 300);
      } catch {
        setSaveStatus("error");
      }
    },
    [dispatch]
  );

  // Reset field helper
  const handleResetField = useCallback(
    <K extends keyof UserPreferences>(key: K, defaultValue: UserPreferences[K]) => {
      handleUpdate({ [key]: defaultValue });
    },
    [handleUpdate]
  );

  // Reset all to canonical defaults with 6s Undo toast
  function handleResetToDefaults() {
    // Snapshot current preferences for Undo
    const snapshot = { ...preferences };
    setUndoSnapshot(snapshot);

    handleUpdate(DEFAULT_PREFERENCES);
    setToastMessage("Preferences reset to defaults.");

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      setUndoSnapshot(null);
    }, 6000);
  }

  // Restore snapshot on Undo
  function handleUndoReset() {
    if (undoSnapshot) {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      handleUpdate(undoSnapshot);
      setUndoSnapshot(null);
      setToastMessage("Preferences restored.");
      setTimeout(() => setToastMessage(null), 2500);
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-[28px] font-display text-foreground tracking-tight leading-tight">
            Travel Preferences
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Tell us how you like to travel. We&apos;ll rank your options to match.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border bg-surface text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to defaults</span>
        </button>
      </header>

      {/* Accessible Undo Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-lg bg-surface border border-border text-xs text-foreground flex items-center justify-between gap-3 shadow-md animate-in fade-in-50 duration-150"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success stroke-[2] shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>

          {undoSnapshot && (
            <button
              type="button"
              onClick={handleUndoReset}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[4px] bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* 2-Column Responsive Layout (65% controls, 35% sticky results) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Controls Container with Hairline Dividers (not a card per section) */}
        <main
          className="bg-surface rounded-2xl border border-border p-6 sm:p-7 divide-y divide-hairline space-y-6"
          aria-label="Travel preferences form"
        >
          {/* a. Presets & Priority */}
          <PresetsSection preferences={preferences} onChange={handleUpdate} />

          {/* b. Maximum Budget */}
          <BudgetSection
            preferences={preferences}
            allAlternatives={allAlternatives}
            onChange={handleUpdate}
          />

          {/* c. Travel Classes */}
          <ClassSection preferences={preferences} onChange={handleUpdate} />

          {/* d. Seats & Confirmation */}
          <SeatsSection preferences={preferences} onChange={handleUpdate} />

          {/* e. Changes & Transfers */}
          <ChangesSection preferences={preferences} onChange={handleUpdate} />

          {/* f. Timing & Deadlines */}
          <TimingSection
            preferences={preferences}
            activeTrip={activeTrip}
            onChange={handleUpdate}
          />

          {/* g. Nearby Stations */}
          <NearbyStationsSection
            preferences={preferences}
            activeTrip={activeTrip}
            onChange={handleUpdate}
          />

          {/* h. Berth Location */}
          <BerthSection preferences={preferences} onChange={handleUpdate} />

          {/* i. Quota & Multi-Persona Eligibility Assistant */}
          <QuotaEligibilityAssistant
            initialClass={preferences.classes[0] || "3A"}
          />
        </main>

        {/* Results Panel: Sticky on Desktop, Bottom Sheet on Mobile */}
        <ResultsPanel
          evaluation={evaluation}
          allAlternatives={allAlternatives}
          preferences={preferences}
          activeTrip={activeTrip}
          saveStatus={saveStatus}
          onApplyPatch={handleUpdate}
          onResetField={handleResetField}
        />
      </div>
    </div>
  );
}
