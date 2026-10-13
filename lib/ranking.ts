import type { Alternative, RankedAlternative, Trip, UserPreferences } from "./types";
import { evaluateAlternatives, PROFILE_WEIGHTS } from "./matching";
import { DEFAULT_PREFERENCES } from "./constants";

export const RANKING_WEIGHTS = PROFILE_WEIGHTS.balanced;

/**
 * Deterministic ranking delegates directly to evaluateAlternatives in /lib/matching.ts.
 * Single source of truth across the entire application.
 */
export function rankAlternatives(
  alternatives: Alternative[],
  trip: Trip,
  preferences?: UserPreferences
): RankedAlternative[] {
  const prefs = preferences || DEFAULT_PREFERENCES;
  const result = evaluateAlternatives(alternatives, prefs, trip);
  return result.ranked;
}

