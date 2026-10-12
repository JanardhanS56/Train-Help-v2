"use client";

import { useApp, useAppDispatch } from "@/context/app-context";
import type { SortKey, TravelClass } from "@/lib/types";
import { RotateCcw } from "lucide-react";

export function AlternativesFilters() {
  const { state, rankedAlternatives } = useApp();
  const dispatch = useAppDispatch();
  const { filters } = state;

  const hasActiveFilters =
    filters.maxFare !== null ||
    filters.maxChanges !== null ||
    filters.classFilter !== "any" ||
    filters.availableOnly ||
    filters.sortBy !== "best-match";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-lg border border-border bg-surface text-xs">
      <div className="flex flex-wrap items-center gap-4">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="micro-label">SORT</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              dispatch({
                type: "SET_FILTERS",
                filters: { sortBy: e.target.value as SortKey, sortDirection: "asc" },
              })
            }
            className="h-8 px-2.5 rounded border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="best-match">Best Match</option>
            <option value="arrival">Earliest Arrival</option>
            <option value="duration">Fastest Duration</option>
            <option value="price">Lowest Fare</option>
          </select>
        </div>

        {/* Changes */}
        <div className="flex items-center gap-2">
          <span className="micro-label">CHANGES</span>
          <select
            value={filters.maxChanges === null ? "any" : filters.maxChanges.toString()}
            onChange={(e) => {
              const val = e.target.value === "any" ? null : Number(e.target.value);
              dispatch({ type: "SET_FILTERS", filters: { maxChanges: val } });
            }}
            className="h-8 px-2.5 rounded border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="any">Any changes</option>
            <option value="0">Direct only</option>
            <option value="1">Max 1 change</option>
          </select>
        </div>

        {/* Class */}
        <div className="flex items-center gap-2">
          <span className="micro-label">CLASS</span>
          <select
            value={filters.classFilter}
            onChange={(e) =>
              dispatch({
                type: "SET_FILTERS",
                filters: { classFilter: e.target.value as TravelClass | "any" },
              })
            }
            className="h-8 px-2.5 rounded border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="any">All classes</option>
            <option value="3A">3A (AC 3-Tier)</option>
            <option value="2A">2A (AC 2-Tier)</option>
            <option value="1A">1A (First AC)</option>
            <option value="SL">SL (Sleeper)</option>
            <option value="CC">CC (Chair Car)</option>
          </select>
        </div>

        {/* Available only checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) =>
              dispatch({
                type: "SET_FILTERS",
                filters: { availableOnly: e.target.checked },
              })
            }
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs">Confirmed berths only</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          {rankedAlternatives.length} option{rankedAlternatives.length === 1 ? "" : "s"}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => dispatch({ type: "RESET_FILTERS" })}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
