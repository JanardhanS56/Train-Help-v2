"use client";

import Link from "next/link";
import { FilterX, Sliders, CheckCircle2, MapPin, ArrowRight } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { AlternativeCard } from "@/components/recovery/alternative-card";

export function AlternativesList() {
  const { state, rankedAlternatives } = useApp();
  const dispatch = useAppDispatch();

  const selectedAltId = state.selectedAlternativeId;
  const includeNearby = state.preferences.includeNearbyStations;

  // Find if an alternative has a nearby station suggestion (e.g. Yesvantpur YPR, 25 min from SBC)
  const nearbyAlt = rankedAlternatives.find((a) => a.nearbyStationSuggestion);

  // Empty state if filters eliminate all options
  if (rankedAlternatives.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center max-w-md mx-auto my-6 shadow-card space-y-4">
        <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <FilterX className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            No alternative trains match your current filters
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Try loosening your budget, max changes, or travel class to see available trains.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "RESET_FILTERS" })}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card"
          >
            Reset filters
          </button>
          <Link
            href="/preferences"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-semibold hover:bg-background transition-colors touch-target shadow-card"
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
      {/* Nearby station suggestion card if enabled */}
      {includeNearby && nearbyAlt && nearbyAlt.nearbyStationSuggestion && (
        <aside
          className="p-3.5 rounded-xl border border-primary/30 bg-primary/10 text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card"
          aria-label="Nearby station recommendation"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-foreground">
                Board at {nearbyAlt.nearbyStationSuggestion.name} ({nearbyAlt.nearbyStationSuggestion.code}) instead
              </p>
              <p className="text-muted-foreground">
                Only {nearbyAlt.nearbyStationSuggestion.travelTime} ({nearbyAlt.nearbyStationSuggestion.distance}) from KSR Bengaluru City · {nearbyAlt.trainName} has confirmed seats
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              dispatch({ type: "SELECT_ALTERNATIVE", alternativeId: nearbyAlt.id });
              dispatch({ type: "SET_RECOVERY_STAGE", stage: "itinerary" });
            }}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target whitespace-nowrap shadow-card"
          >
            <span>Select this station</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {selectedAltId && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Train selected. Tap &ldquo;Review Itinerary&rdquo; to compare timelines and confirm.
          </span>
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
