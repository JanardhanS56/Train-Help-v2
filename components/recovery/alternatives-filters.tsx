"use client";

import { useApp, useAppDispatch } from "@/context/app-context";
import type { SortKey, TravelClass } from "@/lib/types";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export function AlternativesFilters() {
  const { state, rankedAlternatives } = useApp();
  const dispatch = useAppDispatch();
  const { filters } = state;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "best-match", label: "Best Match" },
    { key: "price", label: "Lowest Price" },
    { key: "duration", label: "Fastest" },
    { key: "arrival", label: "Earliest Arrival" },
  ];

  const travelClasses: { code: TravelClass | "any"; label: string }[] = [
    { code: "any", label: "All" },
    { code: "3A", label: "3A" },
    { code: "2A", label: "2A" },
    { code: "1A", label: "1A" },
    { code: "SL", label: "SL" },
    { code: "CC", label: "CC" },
  ];

  const hasActiveFilters =
    filters.maxFare !== null ||
    filters.maxChanges !== null ||
    filters.classFilter !== "any" ||
    filters.availableOnly ||
    filters.sortBy !== "best-match";

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">
            Sort & Filter Trains
          </h2>
          <span className="text-xs text-muted-foreground ml-1">
            ({rankedAlternatives.length} available)
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => dispatch({ type: "RESET_FILTERS" })}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline touch-target"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Sort Buttons Bar */}
      <div>
        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block mb-2">
          Sort by
        </label>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((opt) => {
            const isSelected = filters.sortBy === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_FILTERS",
                    filters: { sortBy: opt.key, sortDirection: "asc" },
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-target ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-card"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
        {/* Max changes filter */}
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">
            Max changes
          </label>
          <div className="flex rounded-lg border border-border overflow-hidden p-0.5 bg-background text-xs">
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_FILTERS", filters: { maxChanges: null } })}
              className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                filters.maxChanges === null
                  ? "bg-surface text-foreground shadow-card font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Any
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_FILTERS", filters: { maxChanges: 0 } })}
              className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                filters.maxChanges === 0
                  ? "bg-surface text-foreground shadow-card font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Direct only
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_FILTERS", filters: { maxChanges: 1 } })}
              className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                filters.maxChanges === 1
                  ? "bg-surface text-foreground shadow-card font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Max 1
            </button>
          </div>
        </div>

        {/* Max Fare filter */}
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">
            Max fare
          </label>
          <div className="flex rounded-lg border border-border overflow-hidden p-0.5 bg-background text-xs">
            {[
              { label: "Any", val: null },
              { label: "₹3,500", val: 3500 },
              { label: "₹5,000", val: 5000 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => dispatch({ type: "SET_FILTERS", filters: { maxFare: p.val } })}
                className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                  filters.maxFare === p.val
                    ? "bg-surface text-foreground shadow-card font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Class Filter */}
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">
            Travel Class
          </label>
          <div className="flex rounded-lg border border-border overflow-hidden p-0.5 bg-background text-xs">
            {travelClasses.slice(0, 4).map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => dispatch({ type: "SET_FILTERS", filters: { classFilter: c.code } })}
                className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                  filters.classFilter === c.code
                    ? "bg-surface text-foreground shadow-card font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Available seats only toggle */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-surface transition-colors touch-target">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTERS",
                  filters: { availableOnly: e.target.checked },
                })
              }
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            <span className="text-xs font-medium text-foreground">
              Available seats only
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
