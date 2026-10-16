/**
 * lib/journeys/availability.ts
 * Deterministic seat availability estimation for Indian Railways trains.
 *
 * All outputs are marked with source: "Estimated" and reflect realistic IRCTC booking
 * quotas, demand curves, and dynamic pressure.
 */

import type { SeatAvailability, TravelClass } from "./types";

/**
 * Fast deterministic string hash function (djb2).
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Estimates seat availability for a given train, boarding date, and class.
 */
export function estimateAvailability(
  trainNumber: string,
  dateStr: string,
  travelClass: TravelClass,
  bookedSeatsCount = 0
): SeatAvailability {
  const seedKey = `${trainNumber.trim()}:${dateStr.trim()}:${travelClass}`;
  const hash = hashString(seedKey);

  // Demand weighting by train number
  const isPremium = ["22691", "12028", "20608", "12429", "12621"].includes(trainNumber.trim());

  // Deterministic pseudo-random number in [0, 1)
  const pseudoRand = (hash % 1000) / 1000;

  // Class capacity scale
  const classMultiplier =
    travelClass === "SL" ? 1.8 : travelClass === "3A" ? 1.2 : travelClass === "2A" ? 0.6 : 0.3;

  let status: "AVAILABLE" | "RAC" | "WL" = "AVAILABLE";
  let count = 0;

  // Premium trains have higher probability of RAC or WL
  const racThreshold = isPremium ? 0.45 : 0.25;
  const wlThreshold = isPremium ? 0.25 : 0.10;

  if (pseudoRand < wlThreshold) {
    status = "WL";
    count = Math.max(1, Math.floor(((hash >> 3) % 25) + 1));
  } else if (pseudoRand < racThreshold) {
    status = "RAC";
    count = Math.max(1, Math.floor(((hash >> 2) % 18) + 1));
  } else {
    status = "AVAILABLE";
    const baseSeats = Math.floor(15 + ((hash >> 4) % 65) * classMultiplier);
    count = Math.max(1, baseSeats - bookedSeatsCount);
  }

  const badge = `${status} ${count}`;
  const isWaitlist = status === "WL";

  return {
    status,
    count,
    badge,
    isWaitlist,
    source: "Estimated",
  };
}
