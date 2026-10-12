"use client";

import { useState, useMemo } from "react";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { FeaturedTicketCard } from "@/components/trips/featured-ticket-card";
import { TripRow } from "@/components/trips/trip-row";
import { BookingModal } from "@/components/trips/booking-modal";
import type { Trip } from "@/lib/types";

import { useTripGroups } from "@/lib/tripGroups";

export function TripList() {
  const { state } = useApp();
  const dispatch = useAppDispatch();
  const tripGroups = useTripGroups();
  const [selectedBookingTrip, setSelectedBookingTrip] = useState<Trip | null>(null);

  // 1. Identify "Needs attention" trip from centralized classification: Cancelled trip first, then delayed
  const attentionTrip = useMemo(() => {
    const cancelled = tripGroups.attention.find((t) => t.status === "cancelled");
    if (cancelled) return cancelled;
    return tripGroups.attention[0] ?? null;
  }, [tripGroups.attention]);

  // 2. Upcoming trips: remaining upcoming trips
  const upcomingTrips = useMemo(() => {
    return tripGroups.upcoming.filter((t) => {
      if (attentionTrip && t.id === attentionTrip.id) return false;
      return true;
    });
  }, [tripGroups.upcoming, attentionTrip]);

  // 3. Earlier trips: recovered and past trips
  const earlierTrips = useMemo(() => {
    const combined = [...tripGroups.recovered, ...tripGroups.past];
    return combined.filter((t) => {
      if (attentionTrip && t.id === attentionTrip.id) return false;
      return true;
    });
  }, [tripGroups.recovered, tripGroups.past, attentionTrip]);

  // Loading State: Skeleton loaders in the exact layout shapes (no spinners)
  if (state.demoState === "loading") {
    return (
      <div className="space-y-10 animate-pulse" aria-busy="true" aria-label="Loading trips">
        {/* Featured card skeleton */}
        <div className="w-full h-64 bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-12 w-full bg-muted/60 rounded" />
          <div className="h-10 w-48 bg-muted rounded ml-auto mt-4" />
        </div>

        {/* Rows skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-surface border border-border rounded-lg p-4" />
          ))}
        </div>
      </div>
    );
  }

  // Error State: Calm copy + "Try again"
  if (state.demoState === "error") {
    return (
      <div className="bg-surface rounded-xl border border-disruption/30 p-8 text-center max-w-md mx-auto my-12">
        <div className="w-10 h-10 rounded-full bg-disruption-tint text-disruption flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5 stroke-[1.5]" />
        </div>
        <h2 className="text-base font-medium text-foreground mb-1">
          Unable to load railway bookings
        </h2>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
          The booking manifest could not be retrieved. Your railway records are intact.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_DEMO_STATE", demoState: "normal" })}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  // Empty State: Plain text + one action
  if (state.demoState === "empty" || state.trips.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 text-center max-w-md mx-auto my-12">
        <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-5 h-5 stroke-[1.5]" />
        </div>
        <h2 className="text-base font-medium text-foreground mb-1">
          No scheduled journeys
        </h2>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
          When you have an active train booking, it will appear here with automated disruption alerts.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_DEMO_STATE", demoState: "normal" })}
          className="h-10 px-4 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors"
        >
          Restore demo journeys
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. "Needs attention" Featured Card */}
      {attentionTrip && (
        <section aria-label="Featured disruption">
          <FeaturedTicketCard
            trip={attentionTrip}
            onViewBooking={(t) => setSelectedBookingTrip(t)}
          />
        </section>
      )}

      {/* 2. "Upcoming" Section: Compact horizontal rows on desktop, stacked on mobile */}
      {upcomingTrips.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2
              id="upcoming-heading"
              className="micro-label text-muted-foreground font-semibold"
            >
              UPCOMING JOURNEYS ({upcomingTrips.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {upcomingTrips.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                onViewBooking={(t) => setSelectedBookingTrip(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. "Earlier" Section: Smaller and quieter for recovered or past trips */}
      {earlierTrips.length > 0 && (
        <section aria-labelledby="earlier-heading" className="space-y-3 pt-2 border-t border-hairline">
          <div className="flex items-center justify-between pb-1">
            <h2
              id="earlier-heading"
              className="micro-label text-muted-foreground font-medium"
            >
              EARLIER & RECOVERED ({earlierTrips.length})
            </h2>
          </div>

          <div className="space-y-2">
            {earlierTrips.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                onViewBooking={(t) => setSelectedBookingTrip(t)}
                isEarlier={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer Disclaimer */}
      <footer className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
        <p>TravelRescue · Indian Railways Disruption Recovery System</p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="font-mono text-[11px]">Simulated Indian Railways reservation manifest</span>
        </div>
      </footer>

      {/* Accessible booking modal */}
      <BookingModal
        trip={selectedBookingTrip}
        open={Boolean(selectedBookingTrip)}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingTrip(null);
        }}
      />
    </div>
  );
}
