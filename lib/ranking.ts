import type { Alternative, RankedAlternative, Trip, UserPreferences } from "./types";
import { formatTime } from "./format";

/**
 * Deterministic ranking weights for Indian Railways:
 * - Budget fit: 30%
 * - Arrival fit: 30%
 * - Changes (Direct vs Connecting): 15%
 * - Duration: 15%
 * - Preference fit (Seat confirmation & Class): 10%
 */
export const RANKING_WEIGHTS = {
  budgetFit: 30,
  arrivalFit: 30,
  changes: 15,
  duration: 15,
  preferenceFit: 10,
} as const;

export function rankAlternatives(
  alternatives: Alternative[],
  trip: Trip,
  preferences?: UserPreferences
): RankedAlternative[] {
  if (alternatives.length === 0) return [];

  const neededBy = trip.neededByTime ?? trip.segments[0]?.arrivalTime;
  const neededByMs = neededBy ? neededBy.getTime() : 0;

  const durations = alternatives.map((a) => a.duration);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const durRange = maxDur - minDur || 1;

  const maxBudget = preferences?.maxBudget ?? 3500;

  const ranked: RankedAlternative[] = alternatives.map((alt) => {
    // 1. Budget Fit Score (weight 30)
    let budgetFitScore: number;
    if (alt.fare <= maxBudget) {
      const savingRatio = (maxBudget - alt.fare) / (maxBudget || 1);
      budgetFitScore = Math.min(100, Math.max(70, 70 + savingRatio * 30));
    } else {
      const overBy = alt.fare - maxBudget;
      budgetFitScore = Math.max(0, 70 - (overBy / 250) * 15);
    }

    // 2. Arrival Fit Score (weight 30)
    let arrivalFitScore: number;
    if (neededByMs > 0) {
      const diffMins = (neededByMs - alt.arrivalTime.getTime()) / 60000;
      if (diffMins >= 0) {
        if (diffMins >= 30 && diffMins <= 300) {
          arrivalFitScore = 100;
        } else if (diffMins < 30) {
          arrivalFitScore = Math.max(40, 100 - (30 - diffMins) * 2);
        } else {
          arrivalFitScore = Math.max(60, 100 - (diffMins - 300) * 0.05);
        }
      } else {
        arrivalFitScore = Math.max(0, 50 + diffMins * 1.5);
      }
    } else {
      arrivalFitScore = 75;
    }

    // 3. Changes Score (weight 15, Direct vs Connecting)
    const changesScore = alt.changes === 0 ? 100 : alt.changes === 1 ? 60 : 25;

    // 4. Duration Score (weight 15)
    const durationScore = Math.round(100 - ((alt.duration - minDur) / durRange) * 50);

    // 5. Preference Fit Score (weight 10)
    // Rewards confirmed seats, penalises RAC & Waitlist; checks preferred class
    let preferenceFitScore = 50;

    if (alt.availability.type === "available") {
      preferenceFitScore += 30; // Confirmed seats reward
    } else if (alt.availability.type === "rac") {
      preferenceFitScore -= 15; // RAC penalty
    } else if (alt.availability.type === "waitlist") {
      preferenceFitScore -= 35; // Waitlist penalty
    }

    if (preferences) {
      if (
        preferences.preferredClass &&
        preferences.preferredClass !== "any" &&
        preferences.preferredClass === alt.travelClass
      ) {
        preferenceFitScore += 20;
      }
      if (
        preferences.preferredTrains.length > 0 &&
        preferences.preferredTrains.includes(alt.trainNumber)
      ) {
        preferenceFitScore += 10;
      }
    }
    preferenceFitScore = Math.min(100, Math.max(0, preferenceFitScore));

    // Overall Weighted Score
    const overallScore = Math.round(
      (budgetFitScore * RANKING_WEIGHTS.budgetFit +
        arrivalFitScore * RANKING_WEIGHTS.arrivalFit +
        changesScore * RANKING_WEIGHTS.changes +
        durationScore * RANKING_WEIGHTS.duration +
        preferenceFitScore * RANKING_WEIGHTS.preferenceFit) /
        100
    );

    const tags = generateTags(alt, alternatives, arrivalFitScore);

    return {
      ...alt,
      rank: 0,
      budgetFitScore: Math.round(budgetFitScore),
      arrivalFitScore: Math.round(arrivalFitScore),
      changesScore,
      durationScore,
      preferenceFitScore,
      overallScore,
      tags,
    };
  });

  ranked.sort((a, b) => b.overallScore - a.overallScore);

  ranked.forEach((item, index) => {
    item.rank = index + 1;
    if (index === 0) {
      item.matchReason = generateBestMatchReason(item, trip);
    }
  });

  return ranked;
}

function generateBestMatchReason(alt: RankedAlternative, trip: Trip): string {
  const parts: string[] = [];

  if (alt.availability.type === "available") {
    parts.push("it has confirmed seats");
  } else if (alt.availability.type === "rac") {
    parts.push("it has RAC availability");
  }

  parts.push("stays within your budget");

  if (trip.neededByTime) {
    parts.push(`arrives before your ${formatTime(trip.neededByTime)} deadline`);
  } else {
    parts.push("arrives on time");
  }

  if (alt.changes === 0) {
    parts.push("needs no change of train");
  } else {
    parts.push(`requires ${alt.changes} change`);
  }

  return `Best match because ${parts.join(", ")}.`;
}

function generateTags(
  alt: Alternative,
  all: Alternative[],
  arrivalFitScore: number
): string[] {
  const tags: string[] = [];

  if (alt.availability.type === "available") {
    tags.push(alt.availability.label);
  } else if (alt.availability.type === "rac") {
    tags.push(alt.availability.label);
  } else {
    tags.push("Waitlist");
  }

  if (arrivalFitScore >= 90) {
    tags.push("Best arrival fit");
  }

  const minFare = Math.min(...all.map((a) => a.fare));
  if (alt.fare === minFare) {
    tags.push("Lowest fare");
  }

  if (alt.changes === 0) {
    tags.push("Direct");
  }

  return tags;
}
