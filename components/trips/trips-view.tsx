"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import { useTripGroups, type TripCategory } from "@/lib/tripGroups";
import { TripRow } from "@/components/trips/trip-row";
import { BookingModal } from "@/components/trips/booking-modal";
import type { Trip } from "@/lib/types";

const VALID_STATUSES: TripCategory[] = [
  "all",
  "upcoming",
  "attention",
  "recovered",
  "past",
];

const STATUS_LABELS: Record<TripCategory, string> = {
  all: "All trips",
  upcoming: "Upcoming",
  attention: "Needs attention",
  recovered: "Recovered",
  past: "Past",
};

const STATUS_SORT_WEIGHT: Record<TripCategory, number> = {
  attention: 0,
  upcoming: 1,
  recovered: 2,
  past: 3,
  all: 4,
};

export function TripsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tripGroups = useTripGroups();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [selectedBookingTrip, setSelectedBookingTrip] = useState<Trip | null>(null);

  // Set document.title
  useEffect(() => {
    document.title = "My Trips · TravelRescue";
  }, []);

  // Move focus to main heading on route change
  useEffect(() => {
    headingRef.current?.focus();
  }, [pathname]);

  // Read status from URL searchParams
  const rawStatus = searchParams.get("status");
  const currentStatus: TripCategory = useMemo(() => {
    if (rawStatus && VALID_STATUSES.includes(rawStatus as TripCategory)) {
      return rawStatus as TripCategory;
    }
    return "all";
  }, [rawStatus]);

  // Fallback correction if invalid param without loop
  useEffect(() => {
    if (rawStatus && !VALID_STATUSES.includes(rawStatus as TripCategory)) {
      router.replace("/trips?status=all");
    }
  }, [rawStatus, router]);

  // Select list based on status
  const baseList = useMemo(() => {
    switch (currentStatus) {
      case "upcoming":
        return tripGroups.upcoming;
      case "attention":
        return tripGroups.attention;
      case "recovered":
        return tripGroups.recovered;
      case "past":
        return tripGroups.past;
      case "all":
      default:
        return tripGroups.all;
    }
  }, [currentStatus, tripGroups]);

  // Map each trip to its category for sorting
  const tripCategoryMap = useMemo(() => {
    const map = new Map<string, TripCategory>();
    tripGroups.attention.forEach((t) => map.set(t.id, "attention"));
    tripGroups.upcoming.forEach((t) => map.set(t.id, "upcoming"));
    tripGroups.recovered.forEach((t) => map.set(t.id, "recovered"));
    tripGroups.past.forEach((t) => map.set(t.id, "past"));
    return map;
  }, [tripGroups]);

  // Filter by search query (route, train name, PNR; case-insensitive; trimmed)
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter((trip) => {
      const seg = trip.segments[0];
      const pnrMatch = trip.pnr.toLowerCase().includes(q);
      const passengerMatch = trip.passengerName.toLowerCase().includes(q);
      const trainNameMatch = seg?.trainName.toLowerCase().includes(q);
      const trainNumMatch = seg?.trainNumber.toLowerCase().includes(q);
      const fromCityMatch = seg?.departureStation.city.toLowerCase().includes(q);
      const toCityMatch = seg?.arrivalStation.city.toLowerCase().includes(q);
      const fromCodeMatch = seg?.departureStation.code.toLowerCase().includes(q);
      const toCodeMatch = seg?.arrivalStation.code.toLowerCase().includes(q);

      return (
        pnrMatch ||
        passengerMatch ||
        trainNameMatch ||
        trainNumMatch ||
        fromCityMatch ||
        toCityMatch ||
        fromCodeMatch ||
        toCodeMatch
      );
    });
  }, [baseList, searchQuery]);

  // Sort trips
  const sortedTrips = useMemo(() => {
    const list = [...filteredList];

    list.sort((a, b) => {
      const aSeg = a.segments[0];
      const bSeg = b.segments[0];
      const aTime = aSeg ? new Date(aSeg.departureTime).getTime() : 0;
      const bTime = bSeg ? new Date(bSeg.departureTime).getTime() : 0;

      if (sortBy === "status") {
        const aCat = tripCategoryMap.get(a.id) ?? "upcoming";
        const bCat = tripCategoryMap.get(b.id) ?? "upcoming";
        const weightDiff = STATUS_SORT_WEIGHT[aCat] - STATUS_SORT_WEIGHT[bCat];
        if (weightDiff !== 0) return weightDiff;
        // Same category, tie-break by date soonest first
        if (aTime !== bTime) return aTime - bTime;
        return a.id.localeCompare(b.id);
      }

      // Default: Date (soonest first), deterministic tie-break by trip id
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });

    return list;
  }, [filteredList, sortBy, tripCategoryMap]);

  function handleTabClick(status: TripCategory) {
    router.push(`/trips?status=${status}`);
  }

  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % VALID_STATUSES.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + VALID_STATUSES.length) % VALID_STATUSES.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = VALID_STATUSES.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextStatus = VALID_STATUSES[nextIndex];
    router.push(`/trips?status=${nextStatus}`);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
    buttons?.[nextIndex]?.focus();
  }

  function handleClearFilters() {
    setSearchQuery("");
    setSortBy("date");
    router.push("/trips?status=all");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl md:text-3xl font-display font-medium text-foreground tracking-tight outline-none"
        >
          My Trips
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Manage all confirmed journeys, live train disruption alerts, and recovered tickets.
        </p>
      </div>

      {/* Toolbar: Search, Status Tabs, Sort */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, train name, number, or PNR..."
              className="w-full text-xs rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
              aria-label="Search trips"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "status")}
              className="text-xs rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
              aria-label="Sort trips"
            >
              <option value="date">Date (soonest first)</option>
              <option value="status">Status (attention first)</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Filter trips by status"
          className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-hairline no-scrollbar"
        >
          {VALID_STATUSES.map((statusKey, idx) => {
            const isSelected = currentStatus === statusKey;
            const count = tripGroups.counts[statusKey];

            return (
              <button
                key={statusKey}
                role="tab"
                type="button"
                id={`tab-${statusKey}`}
                aria-selected={isSelected}
                aria-controls="trips-panel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleTabClick(statusKey)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all -mb-[1px] min-h-[40px] ${
                  isSelected
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <span>{STATUS_LABELS[statusKey]}</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                  <span className="sr-only">({count} trips)</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <section
        id="trips-panel"
        role="tabpanel"
        aria-labelledby={`tab-${currentStatus}`}
        className="space-y-3"
      >
        {/* Error State */}
        {sortedTrips.length === 0 ? (
          /* Empty State */
          <div className="p-10 rounded-xl border border-border bg-surface text-center space-y-3 max-w-md mx-auto">
            <Filter className="w-8 h-8 text-muted-foreground mx-auto stroke-[1.5]" aria-hidden="true" />
            <h2 className="text-sm font-medium text-foreground">
              No trips match this view
            </h2>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No trips found matching "${searchQuery}". Try clearing search or status filters.`
                : "No journeys found under this status filter."}
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear filters</span>
            </button>
          </div>
        ) : (
          /* List of Trips */
          <div className="space-y-3" role="feed" aria-label="Trips list">
            {sortedTrips.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                onViewBooking={(t) => setSelectedBookingTrip(t)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Accessible Booking Modal */}
      {selectedBookingTrip && (
        <BookingModal
          trip={selectedBookingTrip}
          open={Boolean(selectedBookingTrip)}
          onOpenChange={(open) => !open && setSelectedBookingTrip(null)}
        />
      )}
    </div>
  );
}
