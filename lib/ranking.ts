import type { Alternative, RankedAlternative, Trip } from "./types";

/**
 * Ranks alternatives for a given trip based on:
 * - Arrival fit: how close the arrival is to the neededByTime (40% weight)
 * - Price: lower is better (35% weight)
 * - Duration/stops: fewer stops and shorter duration (25% weight)
 *
 * All scores normalised 0-100 (100 = best).
 */
export function rankAlternatives(
  alternatives: Alternative[],
  trip: Trip
): RankedAlternative[] {
  if (alternatives.length === 0) return [];

  const neededBy = trip.neededByTime ?? trip.segments[0]?.arrivalTime;
  if (!neededBy) return alternatives.map((a, i) => toRanked(a, i + 1, 50, 50, 50));

  // Pre-compute ranges for normalisation
  const prices = alternatives.map((a) => a.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const durations = alternatives.map((a) => a.duration);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const durRange = maxDur - minDur || 1;

  const neededByMs = neededBy.getTime();

  const ranked = alternatives.map((alt) => {
    // Arrival fit: minutes before neededBy is ideal; after is penalised heavily
    const diffMins =
      (neededByMs - alt.arrivalTime.getTime()) / 60000;
    let arrivalFitScore: number;
    if (diffMins >= 0) {
      // Arrives before needed — ideal if 30-120 min early
      const idealBuffer = 60; // minutes
      const deviation = Math.abs(diffMins - idealBuffer);
      arrivalFitScore = Math.max(0, 100 - deviation * 0.5);
    } else {
      // Arrives after needed — penalise sharply
      arrivalFitScore = Math.max(0, 100 + diffMins * 2);
    }

    // Price score: lower is better
    const priceScore = 100 - ((alt.price - minPrice) / priceRange) * 100;

    // Duration + stops score
    const durScore = 100 - ((alt.duration - minDur) / durRange) * 100;
    const stopsScore = alt.stops === 0 ? 100 : alt.stops === 1 ? 60 : 20;
    const convenienceScore = durScore * 0.6 + stopsScore * 0.4;

    const overallScore =
      arrivalFitScore * 0.4 + priceScore * 0.35 + convenienceScore * 0.25;

    const tags = generateTags(alt, alternatives, arrivalFitScore);

    return {
      ...alt,
      rank: 0,
      arrivalFitScore: Math.round(arrivalFitScore),
      priceScore: Math.round(priceScore),
      overallScore: Math.round(overallScore),
      tags,
    };
  });

  // Sort by overall score descending and assign rank
  ranked.sort((a, b) => b.overallScore - a.overallScore);
  ranked.forEach((r, i) => {
    r.rank = i + 1;
  });

  return ranked;
}

function toRanked(
  alt: Alternative,
  rank: number,
  arrivalFit: number,
  price: number,
  overall: number
): RankedAlternative {
  return {
    ...alt,
    rank,
    arrivalFitScore: arrivalFit,
    priceScore: price,
    overallScore: overall,
    tags: [],
  };
}

function generateTags(
  alt: Alternative,
  all: Alternative[],
  arrivalFitScore: number
): string[] {
  const tags: string[] = [];

  // Best arrival fit
  if (arrivalFitScore >= 80) {
    tags.push("Best arrival fit");
  }

  // Cheapest
  const minPrice = Math.min(...all.map((a) => a.price));
  if (alt.price === minPrice) {
    tags.push("Lowest price");
  }

  // Non-stop
  if (alt.stops === 0) {
    tags.push("Non-stop");
  }

  // Low seats
  if (alt.seatsLeft <= 3) {
    tags.push("Few seats left");
  }

  // Baggage included
  if (alt.baggageIncluded) {
    tags.push("Baggage included");
  }

  return tags;
}
