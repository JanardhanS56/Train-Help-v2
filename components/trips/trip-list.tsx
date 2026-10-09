"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, AlertCircle, RefreshCw, Inbox, ArrowRight } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { TripCard } from "@/components/trips/trip-card";
import { BookingModal } from "@/components/trips/booking-modal";
import type { Trip } from "@/lib/types";

export function TripList() {
  const { state } = useApp();
  const dispatch = useAppDispatch();
  const [selectedBookingTrip, setSelectedBookingTrip] = useState<Trip | null>(null);

  // Filter out any past trips (except recovered/active) and sort: cancelled, then delayed, then others by date
  const sortedTrips = useMemo(() => {
    const list = [...state.trips];
    return list.sort((a, b) => {
      // 1. Cancelled first
      if (a.status === "cancelled" && b.status !== "cancelled") return -1;
      if (b.status === "cancelled" && a.status !== "cancelled") return 1;
      // 2. Delayed second
      if (a.status === "delayed" && b.status !== "delayed") return -1;
      if (b.status === "delayed" && a.status !== "delayed") return 1;
      // 3. Others by departure date
      const depA = a.segments[0]?.departureTime.getTime() ?? 0;
      const depB = b.segments[0]?.departureTime.getTime() ?? 0;
      return depA - depB;
    });
  }, [state.trips]);

  const cancelledTrip = useMemo(
    () => state.trips.find((t) => t.status === "cancelled"),
    [state.trips]
  );

  // 1. Loading State (Skeleton loaders, no spinners per design system)
  if (state.demoState === "loading") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading trips">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface rounded-xl border border-border p-5 shadow-card animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-5 w-24 bg-muted rounded-full" />
              </div>
              <div className="h-6 w-44 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-16 bg-muted rounded-lg" />
              <div className="h-9 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (state.demoState === "error") {
    return (
      <div className="bg-surface rounded-xl border border-disruption/30 p-8 text-center max-w-md mx-auto my-8 shadow-card">
        <div className="w-12 h-12 rounded-full bg-disruption/10 text-disruption flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          Something went wrong while loading your trips
        </h3>
        <p className="text-xs text-muted-foreground mb-5">
          Something interrupted the connection. Your booking records are safe.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_DEMO_STATE", demoState: "normal" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (state.demoState === "empty" || state.trips.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 text-center max-w-md mx-auto my-8 shadow-card">
        <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No upcoming trips</h3>
        <p className="text-xs text-muted-foreground mb-5">
          When you have an upcoming train journey, it will appear here with automated disruption monitoring.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_DEMO_STATE", demoState: "normal" })}
          className="text-xs font-semibold text-primary hover:underline touch-target"
        >
          Restore demo trips
        </button>
      </div>
    );
  }

  // 4. Normal State
  return (
    <div className="space-y-6">
      {/* Top banner when a trip is cancelled: "1 trip needs your attention" with Find Alternatives */}
      {cancelledTrip && (
        <section
          className="p-4 sm:p-5 rounded-xl border border-disruption/40 bg-disruption/10 text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card animate-in fade-in-50 duration-200"
          aria-label="Disruption alert banner"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-disruption text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                1 trip needs your attention
              </h2>
              <p className="text-xs text-foreground/80 mt-0.5">
                {cancelledTrip.segments[0]?.trainName} ({cancelledTrip.segments[0]?.trainNumber}) was cancelled due to track maintenance.
              </p>
            </div>
          </div>

          <Link
            href={`/recovery/${cancelledTrip.id}`}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-disruption text-white text-xs font-bold hover:opacity-90 transition-opacity touch-target shadow-card whitespace-nowrap"
          >
            <span>Find Alternatives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      )}

      {/* Grid of trips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onViewBooking={(t) => setSelectedBookingTrip(t)}
          />
        ))}
      </div>

      {/* Footer disclaimer required by Hard Constraints */}
      <footer className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
        <p>TravelRescue · Indian Railways Disruption Recovery System</p>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-success" />
          <span>Sample data · Simulated railway reservation manifest</span>
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
