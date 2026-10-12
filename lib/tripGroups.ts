/**
 * /lib/tripGroups.ts
 *
 * Single deterministic source of truth for categorizing trips in TravelRescue AI.
 * Exposed through the memoized hook `useTripGroups()`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUTUALLY EXCLUSIVE CLASSIFICATION RULES:
 * 1. recovered: status recovered (even if the date has passed).
 * 2. attention: status cancelled or delayed, not recovered, and (for delayed)
 *    arrival time not yet passed. A cancelled trip not yet recovered always stays here.
 * 3. past: any remaining trip (on-time or delayed) whose arrival time has passed.
 * 4. upcoming: any remaining trip whose arrival time hasn't passed.
 * 5. all: every trip.
 *
 * These 4 primary categories (recovered, attention, past, upcoming) form a complete,
 * disjoint partition of 'all' and must always sum to all.length.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import type { Trip } from "@/lib/types";
import { useApp } from "@/context/app-context";
import { getNow } from "@/lib/clock";

export type TripCategory = "all" | "upcoming" | "attention" | "recovered" | "past";

export interface TripGroupsResult {
  all: Trip[];
  upcoming: Trip[];
  attention: Trip[];
  recovered: Trip[];
  past: Trip[];
  counts: {
    all: number;
    upcoming: number;
    attention: number;
    recovered: number;
    past: number;
    activeRecovery: number; // attention trips
    refunds: number;        // refunds not yet "Refunded"
    history: number;        // recovered trips
  };
  hasUnrecoveredCancelled: boolean;
}

/**
 * Classifies an array of trips deterministically against the provided timestamp.
 */
export function classifyTrips(trips: Trip[], now: Date = getNow()): TripGroupsResult {
  const nowMs = now.getTime();

  const recovered: Trip[] = [];
  const attention: Trip[] = [];
  const past: Trip[] = [];
  const upcoming: Trip[] = [];

  for (const trip of trips) {
    // Arrival time evaluated from the trip's final journey segment
    const lastSegment = trip.segments[trip.segments.length - 1];
    const arrivalMs = lastSegment?.arrivalTime
      ? new Date(lastSegment.arrivalTime).getTime()
      : 0;
    const arrivalPassed = arrivalMs < nowMs;

    // RULE 1: recovered — status recovered (even if the date has passed)
    if (trip.status === "recovered") {
      recovered.push(trip);
      continue;
    }

    // RULE 2: attention — status cancelled or delayed, not recovered, and
    // (for delayed) arrival time not yet passed. A cancelled trip not yet recovered always stays here.
    if (trip.status === "cancelled" || (trip.status === "delayed" && !arrivalPassed)) {
      attention.push(trip);
      continue;
    }

    // RULE 3: past — any remaining trip (on-time or delayed) whose arrival time has passed
    if (arrivalPassed) {
      past.push(trip);
      continue;
    }

    // RULE 4: upcoming — any remaining trip whose arrival time hasn't passed
    upcoming.push(trip);
  }

  // Development sanity assertion: categories must partition all trips exactly
  if (process.env.NODE_ENV !== "production") {
    const sum = recovered.length + attention.length + past.length + upcoming.length;
    if (sum !== trips.length) {
      console.error(
        `[useTripGroups] Classification error: sum of mutually exclusive categories (${sum}) does not equal all trips (${trips.length})`
      );
    }
  }

  // Check if at least one unrecovered cancelled trip exists to determine disruption tint
  const hasUnrecoveredCancelled = attention.some((t) => t.status === "cancelled");

  // Refunds count: active refunds that are not yet "Refunded"
  const refundsCount = trips.filter(
    (t) => t.refund && t.refund.status !== "Refunded"
  ).length;

  return {
    all: trips,
    upcoming,
    attention,
    recovered,
    past,
    counts: {
      all: trips.length,
      upcoming: upcoming.length,
      attention: attention.length,
      recovered: recovered.length,
      past: past.length,
      activeRecovery: attention.length,
      refunds: refundsCount,
      history: recovered.length,
    },
    hasUnrecoveredCancelled,
  };
}

/**
 * Hook providing memoized classified trip groups from AppContext.
 */
export function useTripGroups(): TripGroupsResult {
  const { state } = useApp();
  return useMemo(() => classifyTrips(state.trips), [state.trips]);
}
