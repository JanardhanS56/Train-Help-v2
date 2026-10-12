"use client";

import Link from "next/link";
import { FilterX, Sliders, Check, MapPin, ArrowRight } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { AlternativeCard } from "@/components/recovery/alternative-card";

export function AlternativesList() {
  const { state, rankedAlternatives } = useApp();
  const dispatch = useAppDispatch();

  const selectedAltId = state.selectedAlternativeId;
  const includeNearby = state.preferences.includeNearbyStations;

  const nearbyAlt = rankedAlternatives.find((a) => a.nearbyStationSuggestion);

  // Empty state if filters eliminate all options
  if (rankedAlternatives.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center max-w-md mx-auto my-6 space-y-4">
        <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <FilterX className="w-5 h-5 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">
            No trains match current filters
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Try loosening budget or max changes to see all verified Indian Railways options.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "RESET_FILTERS" })}
            className="h-9 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
          >
            Reset filters
          </button>
          <Link
            href="/preferences"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust preferences</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="feed" aria-label="Available alternative trains">
      {/* Nearby station suggestion banner if enabled */}
      {includeNearby && nearbyAlt && nearbyAlt.nearbyStationSuggestion && (
        <aside
          className="p-3.5 rounded-lg border border-border bg-neutral-tint text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          aria-label="Nearby station recommendation"
        >
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                Board at {nearbyAlt.nearbyStationSuggestion.name} ({nearbyAlt.nearbyStationSuggestion.code}) instead
              </p>
              <p className="text-muted-foreground">
                {nearbyAlt.nearbyStationSuggestion.travelTime} ({nearbyAlt.nearbyStationSuggestion.distance}) from KSR Bengaluru City · {nearbyAlt.trainName} has confirmed berths
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              dispatch({ type: "SELECT_ALTERNATIVE", alternativeId: nearbyAlt.id });
              dispatch({ type: "SET_RECOVERY_STAGE", stage: "itinerary" });
            }}
            className="self-start sm:self-center inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors whitespace-nowrap"
          >
            <span>Select this terminal</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </aside>
      )}

      {selectedAltId && (
        <div className="p-3 rounded-lg bg-success-tint border border-success/30 text-xs text-success flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[2] shrink-0" />
            <span className="font-medium">
              Train selected. You can review itinerary before confirming.
            </span>
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: "SET_RECOVERY_STAGE", stage: "itinerary" })}
            className="h-8 px-3 rounded-[6px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center gap-1"
          >
            <span>Review Itinerary</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {rankedAlternatives.map((alt) => (
        <AlternativeCard
          key={alt.id}
          alternative={alt}
          isSelected={selectedAltId === alt.id}
          onSelect={(id) => dispatch({ type: "SELECT_ALTERNATIVE", alternativeId: id })}
          onReview={() => dispatch({ type: "SET_RECOVERY_STAGE", stage: "itinerary" })}
        />
      ))}
    </div>
  );
}
