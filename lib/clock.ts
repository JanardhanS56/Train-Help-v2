/**
 * /lib/clock.ts
 *
 * Deterministic clock source for TravelRescue AI.
 * Exports getNow(), ensuring all date logic and mock schedules
 * classify deterministically across timezones and test runs.
 */

// Fixed reference timestamp (noon UTC on 2026-10-12)
const REFERENCE_NOW = new Date("2026-10-12T12:00:00.000Z");

export function getNow(): Date {
  // Always return a fresh Date clone so callers cannot mutate the reference
  return new Date(REFERENCE_NOW.getTime());
}
