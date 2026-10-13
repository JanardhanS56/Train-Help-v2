import type {
  Alternative,
  RankedAlternative,
  Trip,
  UserPreferences,
  PriorityProfile,
  FlexibilityTolerance,
} from "./types";
import { formatCurrency } from "./format";

/**
 * Weights per priority profile (total 100):
 * - Budget Fit
 * - Arrival Fit
 * - Changes (Direct vs Connecting)
 * - Duration (Speed)
 * - Preference Fit (Seats, Classes, Habits)
 */
export const PROFILE_WEIGHTS: Record<
  PriorityProfile,
  { budget: number; arrival: number; changes: number; duration: number; preference: number }
> = {
  balanced: { budget: 30, arrival: 30, changes: 15, duration: 15, preference: 10 },
  "lowest-fare": { budget: 45, arrival: 20, changes: 10, duration: 10, preference: 15 },
  fastest: { budget: 15, arrival: 30, changes: 15, duration: 35, preference: 5 },
  comfort: { budget: 10, arrival: 20, changes: 15, duration: 10, preference: 45 },
};

export interface RelaxationSuggestion {
  message: string;
  applyText: string;
  newCount: number;
  patch: Partial<UserPreferences>;
}

export interface MatchingResult {
  eligible: RankedAlternative[];
  ranked: RankedAlternative[];
  excludedByReason: Record<string, Alternative[]>;
  cantVerifyCount: number;
  suggestions: RelaxationSuggestion | null;
}

/**
 * Checks whether an alternative departs within a specific half-open window:
 * - early-morning: [04:00, 08:00)
 * - morning:       [08:00, 12:00) (8:00 AM belongs to morning)
 * - afternoon:     [12:00, 16:00)
 * - evening:       [16:00, 21:00)
 * - night:         [21:00, 04:00) (across midnight)
 * - any:           [00:00, 24:00)
 */
export function isInDepartureWindow(
  departureTime: Date,
  windowType: UserPreferences["departureWindow"]
): boolean {
  if (windowType === "any") return true;

  const hours = departureTime.getHours();
  const minutes = departureTime.getMinutes();
  const timeVal = hours + minutes / 60;

  switch (windowType) {
    case "early-morning":
      return timeVal >= 4 && timeVal < 8;
    case "morning":
      return timeVal >= 8 && timeVal < 12;
    case "afternoon":
      return timeVal >= 12 && timeVal < 16;
    case "evening":
      return timeVal >= 16 && timeVal < 21;
    case "night":
      return timeVal >= 21 || timeVal < 4;
    default:
      return true;
  }
}

/**
 * Checks if departure is within flexibility hours from the chosen window
 */
export function isWithinDepartureFlexibility(
  departureTime: Date,
  windowType: UserPreferences["departureWindow"],
  flexHours: FlexibilityTolerance
): boolean {
  if (windowType === "any") return true;
  if (isInDepartureWindow(departureTime, windowType)) return true;

  const hours = departureTime.getHours();
  const minutes = departureTime.getMinutes();
  const timeVal = hours + minutes / 60;

  // Window bounds
  let start = 0;
  let end = 24;
  if (windowType === "early-morning") { start = 4; end = 8; }
  else if (windowType === "morning") { start = 8; end = 12; }
  else if (windowType === "afternoon") { start = 12; end = 16; }
  else if (windowType === "evening") { start = 16; end = 21; }
  else if (windowType === "night") { start = 21; end = 28; /* 4am next day */ }

  const effectiveTime = windowType === "night" && timeVal < 4 ? timeVal + 24 : timeVal;
  return effectiveTime >= start - flexHours && effectiveTime <= end + flexHours;
}

/**
 * Computes the absolute target deadline date anchored to the trip's travel date.
 */
export function computeAnchorDeadline(
  trip: Trip | null,
  deadlineDay: UserPreferences["deadlineDay"],
  deadlineTime: string | null
): Date | null {
  if (deadlineDay === "none" || !deadlineTime) return null;

  // Anchor to trip's neededByTime or first segment departure date
  const baseDate = trip?.segments[0]?.departureTime
    ? new Date(trip.segments[0].departureTime)
    : trip?.neededByTime
    ? new Date(trip.neededByTime)
    : new Date();

  // Parse HH:mm
  const [hhStr, mmStr] = deadlineTime.split(":");
  const hours = parseInt(hhStr, 10);
  const minutes = parseInt(mmStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const deadline = new Date(baseDate);
  deadline.setHours(hours, minutes, 0, 0);

  if (deadlineDay === "next-day") {
    deadline.setDate(deadline.getDate() + 1);
  } else if (deadlineDay === "in-2-days") {
    deadline.setDate(deadline.getDate() + 2);
  }

  return deadline;
}

/**
 * Evaluates whether an alternative satisfies hard constraints.
 */
function testHardConstraints(
  alt: Alternative,
  preferences: UserPreferences,
  trip: Trip | null
): { passed: boolean; reason?: string; isCantVerify?: boolean } {
  // 1. Budget hard constraint
  if (alt.fare > preferences.maxBudget) {
    return { passed: false, reason: "Budget limit exceeded" };
  }

  // 2. Seats hard constraint
  if (preferences.seatPreference === "confirmed-only") {
    if (alt.availability.type !== "available") {
      return { passed: false, reason: "Confirmed seats required" };
    }
  } else if (preferences.seatPreference === "confirmed-or-rac") {
    if (alt.availability.type === "waitlist") {
      return { passed: false, reason: "Waitlist excluded" };
    }
  }

  // 3. Changes hard constraint
  if (alt.changes > preferences.maxChanges) {
    return { passed: false, reason: `Exceeds max ${preferences.maxChanges} change${preferences.maxChanges === 1 ? "" : "s"}` };
  }

  // 4. Class constraint (only when "Only show these classes" is toggled ON)
  if (preferences.onlyTheseClasses) {
    if (!preferences.classes.includes(alt.travelClass)) {
      return { passed: false, reason: "Class not in selected list" };
    }
  }

  // 5. Nearby stations constraint
  const tripOriginCode = trip?.segments[0]?.departureStation?.code;
  if (!preferences.includeNearbyStations && tripOriginCode) {
    if (alt.fromStation.code !== tripOriginCode) {
      return { passed: false, reason: "Nearby station excluded" };
    }
  } else if (preferences.includeNearbyStations && tripOriginCode && preferences.selectedNearbyStationCodes.length > 0) {
    // Only allow original station or selected nearby station codes
    const isOriginal = alt.fromStation.code === tripOriginCode;
    const isSelectedNearby = preferences.selectedNearbyStationCodes.includes(alt.fromStation.code);
    if (!isOriginal && !isSelectedNearby) {
      return { passed: false, reason: "Terminal not selected" };
    }
  }

  // 6. Arrival deadline constraint
  if (preferences.deadlineDay !== "none" && preferences.deadlineTime) {
    if (!alt.arrivalTime || isNaN(alt.arrivalTime.getTime())) {
      return { passed: false, reason: "Can't verify arrival time", isCantVerify: true };
    }

    const anchorDeadline = computeAnchorDeadline(trip, preferences.deadlineDay, preferences.deadlineTime);
    if (anchorDeadline) {
      const toleranceMs = preferences.flexibleSchedule
        ? preferences.flexibilityHours * 60 * 60 * 1000
        : 0;
      const maxAllowedTime = anchorDeadline.getTime() + toleranceMs;

      if (alt.arrivalTime.getTime() > maxAllowedTime) {
        return { passed: false, reason: "Arrives after deadline" };
      }
    }
  }

  return { passed: true };
}

/**
 * Deterministic scoring function for an eligible alternative
 */
function scoreAlternative(
  alt: Alternative,
  allEligible: Alternative[],
  preferences: UserPreferences,
  trip: Trip | null
): RankedAlternative {
  const weights = PROFILE_WEIGHTS[preferences.priorityProfile] || PROFILE_WEIGHTS.balanced;

  // 1. Budget Fit Score (0-100)
  let budgetFitScore: number;
  if (alt.fare <= preferences.maxBudget) {
    const savingsRatio = (preferences.maxBudget - alt.fare) / (preferences.maxBudget || 1);
    budgetFitScore = Math.min(100, Math.max(70, 70 + savingsRatio * 30));
  } else {
    const overBy = alt.fare - preferences.maxBudget;
    budgetFitScore = Math.max(0, 70 - (overBy / 250) * 15);
  }

  // 2. Arrival Fit Score (0-100)
  let arrivalFitScore = 75;
  const targetDeadline = computeAnchorDeadline(trip, preferences.deadlineDay, preferences.deadlineTime)
    || (trip?.neededByTime ?? trip?.segments[0]?.arrivalTime ?? null);

  if (targetDeadline && alt.arrivalTime) {
    const diffMins = (targetDeadline.getTime() - alt.arrivalTime.getTime()) / 60000;
    if (diffMins >= 0) {
      if (diffMins >= 30 && diffMins <= 300) {
        arrivalFitScore = 100;
      } else if (diffMins < 30) {
        arrivalFitScore = Math.max(40, 100 - (30 - diffMins) * 2);
      } else {
        arrivalFitScore = Math.max(60, 100 - (diffMins - 300) * 0.05);
      }
    } else {
      // Arrives past deadline within flexibility
      arrivalFitScore = Math.max(10, 50 + diffMins * 0.5);
    }
  }

  // 3. Changes Score (Direct = 100, 1 change = 60, 2 changes = 25)
  const changesScore = alt.changes === 0 ? 100 : alt.changes === 1 ? 60 : 25;

  // 4. Duration Score (0-100)
  const durations = allEligible.map((a) => a.duration);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const durRange = maxDur - minDur || 1;
  const durationScore = Math.round(100 - ((alt.duration - minDur) / durRange) * 50);

  // 5. Preference Fit Score (0-100)
  let preferenceFitScore = 50;

  // Seat availability weight
  if (alt.availability.type === "available") {
    preferenceFitScore += 30;
  } else if (alt.availability.type === "rac") {
    preferenceFitScore -= 10;
  } else if (alt.availability.type === "waitlist") {
    preferenceFitScore -= 30;
  }

  // Preferred class match boost
  if (preferences.classes.includes(alt.travelClass)) {
    preferenceFitScore += 20;
  }

  // Departure window bonus / penalty
  const inWindow = isInDepartureWindow(alt.departureTime, preferences.departureWindow);
  const inFlex = isWithinDepartureFlexibility(alt.departureTime, preferences.departureWindow, preferences.flexibilityHours);
  if (inWindow) {
    preferenceFitScore += 10;
  } else if (inFlex && preferences.flexibleSchedule) {
    preferenceFitScore -= 5;
  } else if (!inWindow && preferences.departureWindow !== "any") {
    preferenceFitScore -= 15;
  }

  preferenceFitScore = Math.min(100, Math.max(0, preferenceFitScore));

  // Overall Weighted Score
  const overallScore = Math.round(
    (budgetFitScore * weights.budget +
      arrivalFitScore * weights.arrival +
      changesScore * weights.changes +
      durationScore * weights.duration +
      preferenceFitScore * weights.preference) /
      100
  );

  // Tags
  const tags: string[] = [];
  if (alt.availability.type === "available") {
    tags.push(alt.availability.label);
  } else if (alt.availability.type === "rac") {
    tags.push(alt.availability.label);
  } else {
    tags.push("Waitlist");
  }

  if (arrivalFitScore >= 90) tags.push("Best arrival fit");

  const minFare = Math.min(...allEligible.map((a) => a.fare));
  if (alt.fare === minFare) tags.push("Lowest fare");

  if (alt.changes === 0) tags.push("Direct");

  if (!inWindow && inFlex && preferences.flexibleSchedule && preferences.departureWindow !== "any") {
    tags.push("Outside window, within flexibility");
  }

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
}

/**
 * Checks berth tie-breaker (only used if overall scores are identical)
 */
function compareBerth(
  a: RankedAlternative,
  b: RankedAlternative,
  berthPref: UserPreferences["berthPreference"]
): number {
  if (berthPref === "no-preference") return 0;

  const target = berthPref.toLowerCase().replace("-", " ");
  const aMatches = (a.coachBerth ?? "").toLowerCase().includes(target);
  const bMatches = (b.coachBerth ?? "").toLowerCase().includes(target);

  if (aMatches && !bMatches) return -1;
  if (!aMatches && bMatches) return 1;
  return 0;
}

/**
 * Generates an informative Best Match reason
 */
function generateBestMatchReason(
  alt: RankedAlternative,
  trip: Trip | null,
  preferences: UserPreferences
): string {
  const reasons: string[] = [];

  if (alt.availability.type === "available") {
    reasons.push("confirmed berths");
  } else if (alt.availability.type === "rac") {
    reasons.push("RAC boarding rights");
  }

  if (alt.fare <= preferences.maxBudget) {
    reasons.push(`stays within your ${formatCurrency(preferences.maxBudget)} budget`);
  }

  if (alt.changes === 0) {
    reasons.push("direct route");
  } else {
    reasons.push(`only ${alt.changes} change`);
  }

  if (preferences.classes.includes(alt.travelClass)) {
    reasons.push(`matches ${alt.travelClass} class preference`);
  }

  if (reasons.length === 0) {
    return "Best balanced option across schedule, fare, and comfort criteria.";
  }

  return `Best match because it has ${reasons.join(", ")}.`;
}

/**
 * Tests single relaxations to produce the zero-result suggestion.
 */
function findBestRelaxation(
  alternatives: Alternative[],
  preferences: UserPreferences,
  trip: Trip | null
): RelaxationSuggestion | null {
  const tests: {
    name: string;
    patch: Partial<UserPreferences>;
    message: (count: number) => string;
    applyText: string;
    deltaSize: number;
  }[] = [];

  // 1. Raise budget to the smallest fare that actually adds a train (max ₹10,000)
  const candidatesPassingOtherConstraints = alternatives
    .filter((a) => {
      if (a.fare <= preferences.maxBudget || a.fare > 10000) return false;
      const testPrefs = { ...preferences, maxBudget: 10000 };
      return testHardConstraints(a, testPrefs, trip).passed;
    })
    .sort((a, b) => a.fare - b.fare);

  if (candidatesPassingOtherConstraints.length > 0) {
    const targetFare = candidatesPassingOtherConstraints[0].fare;
    const nextBudget = Math.ceil(targetFare / 100) * 100;
    tests.push({
      name: "budget",
      patch: { maxBudget: nextBudget },
      message: (count) =>
        `Raise your budget to ${formatCurrency(nextBudget)} to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: `Raise budget to ${formatCurrency(nextBudget)}`,
      deltaSize: nextBudget - preferences.maxBudget,
    });
  }

  // 2. Allow RAC
  if (preferences.seatPreference === "confirmed-only") {
    tests.push({
      name: "allow-rac",
      patch: { seatPreference: "confirmed-or-rac" },
      message: (count) => `Allow RAC seat availability to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: "Allow RAC seats",
      deltaSize: 10,
    });
  }

  // 3. Allow Any seats
  if (preferences.seatPreference !== "any") {
    tests.push({
      name: "allow-any",
      patch: { seatPreference: "any" },
      message: (count) => `Allow all seat statuses (including waitlist) to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: "Allow all seat statuses",
      deltaSize: 20,
    });
  }

  // 4. Allow one more change
  if (preferences.maxChanges < 2) {
    const nextChanges = preferences.maxChanges + 1;
    tests.push({
      name: "allow-changes",
      patch: { maxChanges: nextChanges },
      message: (count) => `Allow up to ${nextChanges} train change${nextChanges === 1 ? "" : "s"} to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: `Allow up to ${nextChanges} change${nextChanges === 1 ? "" : "s"}`,
      deltaSize: 15,
    });
  }

  // 5. Widen flexibility
  if (!preferences.flexibleSchedule) {
    tests.push({
      name: "enable-flexible",
      patch: { flexibleSchedule: true, flexibilityHours: 3 },
      message: (count) => `Enable flexible scheduling (±3 hours) to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: "Enable ±3h flexibility",
      deltaSize: 12,
    });
  } else if (preferences.flexibilityHours < 6) {
    const nextHours: FlexibilityTolerance = preferences.flexibilityHours === 1 ? 3 : 6;
    tests.push({
      name: "widen-flexibility",
      patch: { flexibilityHours: nextHours },
      message: (count) => `Widen flexibility to ±${nextHours} hours to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: `Widen to ±${nextHours}h`,
      deltaSize: nextHours - preferences.flexibilityHours,
    });
  }

  // 6. Turn off "Only show these classes"
  if (preferences.onlyTheseClasses) {
    tests.push({
      name: "disable-only-classes",
      patch: { onlyTheseClasses: false },
      message: (count) => `Show all classes instead of restricting to selected to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: "Show all classes",
      deltaSize: 5,
    });
  }

  // 7. Include nearby stations
  if (!preferences.includeNearbyStations) {
    tests.push({
      name: "include-nearby",
      patch: { includeNearbyStations: true, selectedNearbyStationCodes: [] },
      message: (count) => `Include nearby station terminals to see ${count} train${count === 1 ? "" : "s"}.`,
      applyText: "Include nearby stations",
      deltaSize: 8,
    });
  }

  // Test each relaxation
  let bestCandidate: RelaxationSuggestion | null = null;
  let bestCount = 0;
  let smallestDelta = Infinity;

  for (const t of tests) {
    const relaxedPrefs: UserPreferences = { ...preferences, ...t.patch };
    const count = alternatives.filter(
      (a) => testHardConstraints(a, relaxedPrefs, trip).passed
    ).length;

    if (count > 0) {
      if (count > bestCount || (count === bestCount && t.deltaSize < smallestDelta)) {
        bestCount = count;
        smallestDelta = t.deltaSize;
        bestCandidate = {
          message: t.message(count),
          applyText: t.applyText,
          newCount: count,
          patch: t.patch,
        };
      }
    }
  }

  return bestCandidate;
}

/**
 * Pure, deterministic evaluation of all alternatives against preferences and trip.
 * The entire application (Preferences results, Alternatives page, Filters, Itinerary)
 * uses ONLY this function.
 */
export function evaluateAlternatives(
  alternatives: Alternative[],
  preferences: UserPreferences,
  trip: Trip | null,
  _now?: Date
): MatchingResult {
  const excludedByReason: Record<string, Alternative[]> = {};
  const eligibleRaw: Alternative[] = [];
  let cantVerifyCount = 0;

  for (const alt of alternatives) {
    const check = testHardConstraints(alt, preferences, trip);
    if (check.passed) {
      eligibleRaw.push(alt);
    } else {
      if (check.isCantVerify) {
        cantVerifyCount++;
      }
      const reasonKey = check.reason || "Other constraint";
      if (!excludedByReason[reasonKey]) {
        excludedByReason[reasonKey] = [];
      }
      excludedByReason[reasonKey].push(alt);
    }
  }

  // Score eligible
  const ranked: RankedAlternative[] = eligibleRaw.map((alt) =>
    scoreAlternative(alt, eligibleRaw, preferences, trip)
  );

  // Deterministic sorting: overallScore DESC, then berth tie-breaker, then fare ASC
  ranked.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    const berthTie = compareBerth(a, b, preferences.berthPreference);
    if (berthTie !== 0) return berthTie;
    return a.fare - b.fare;
  });

  // Assign ranks & best match reason
  ranked.forEach((item, index) => {
    item.rank = index + 1;
    if (index === 0) {
      item.matchReason = generateBestMatchReason(item, trip, preferences);
    }
  });

  const suggestions = ranked.length === 0 ? findBestRelaxation(alternatives, preferences, trip) : null;

  return {
    eligible: ranked,
    ranked,
    excludedByReason,
    cantVerifyCount,
    suggestions,
  };
}

/**
 * Resolves the active unrecovered disrupted trip context:
 * - Selected trip if it is cancelled and unrecovered;
 * - Otherwise first unrecovered cancelled trip;
 * - Otherwise null.
 */
export function getActiveTrip(
  trips: Trip[],
  selectedTripId: string | null | undefined,
  recoveryByTripId: Record<string, string> = {}
): Trip | null {
  if (selectedTripId) {
    const selected = trips.find((t) => t.id === selectedTripId);
    if (selected && selected.status === "cancelled" && recoveryByTripId[selected.id] !== "success") {
      return selected;
    }
  }

  const firstUnrecovered = trips.find(
    (t) => t.status === "cancelled" && recoveryByTripId[t.id] !== "success"
  );
  return firstUnrecovered ?? null;
}

export interface PreferenceFitItem {
  key: string;
  label: string;
  met: boolean;
  note?: string;
}

/**
 * Derives preference fit indicators for an alternative against preferences.
 * Used for the Itinerary Summary preference match block.
 */
export function getPreferenceFitItems(
  alt: Alternative,
  preferences: UserPreferences,
  trip: Trip | null
): PreferenceFitItem[] {
  const items: PreferenceFitItem[] = [];

  // 1. Budget
  const withinBudget = alt.fare <= preferences.maxBudget;
  items.push({
    key: "budget",
    label: withinBudget
      ? `Within budget (${formatCurrency(alt.fare)})`
      : `Exceeds budget by ${formatCurrency(alt.fare - preferences.maxBudget)}`,
    met: withinBudget,
  });

  // 2. Class
  const classMatches = preferences.classes.includes(alt.travelClass);
  items.push({
    key: "class",
    label: `Class: ${alt.travelClass}`,
    met: classMatches,
    note: classMatches ? "Selected class" : "Outside selected classes",
  });

  // 3. Changes
  const changesOk = alt.changes <= preferences.maxChanges;
  items.push({
    key: "changes",
    label: alt.changes === 0 ? "Direct journey" : `${alt.changes} change${alt.changes === 1 ? "" : "s"}`,
    met: changesOk,
  });

  // 4. Seats
  const availType = alt.availability.type || alt.availability.status;
  const isConfirmed = availType === "available";
  const isRac = availType === "rac";
  let seatMet = true;
  let seatLabel = "Confirmed seat";
  if (preferences.seatPreference === "confirmed-only") {
    seatMet = isConfirmed;
    seatLabel = isConfirmed ? "Confirmed seat" : (isRac ? "RAC (excludes confirmed-only)" : "Waitlisted (excludes confirmed-only)");
  } else if (preferences.seatPreference === "confirmed-or-rac") {
    seatMet = isConfirmed || isRac;
    seatLabel = isConfirmed ? "Confirmed seat" : (isRac ? "RAC seat" : "Waitlisted (excludes waitlist)");
  } else {
    seatMet = true;
    seatLabel = isConfirmed ? "Confirmed seat" : (isRac ? "RAC seat" : "Waitlisted");
  }
  items.push({
    key: "seats",
    label: seatLabel,
    met: seatMet,
  });

  // 5. Arrival deadline
  const deadline = computeAnchorDeadline(trip, preferences.deadlineDay, preferences.deadlineTime);
  if (deadline) {
    const diffMinutes = Math.round((alt.arrivalTime.getTime() - deadline.getTime()) / 60000);
    if (diffMinutes <= 0) {
      items.push({
        key: "deadline",
        label: "Arrives before your deadline",
        met: true,
      });
    } else {
      const flexMin = (preferences.flexibilityHours ?? 3) * 60;
      const withinFlex = preferences.flexibleSchedule && diffMinutes <= flexMin;
      items.push({
        key: "deadline",
        label: `Arrives ${diffMinutes} min after your deadline${withinFlex ? " (within flexibility)" : ""}`,
        met: withinFlex,
      });
    }
  }

  // 6. Berth (if requested and sleeper class)
  if (preferences.berthPreference && preferences.berthPreference !== "no-preference") {
    const formattedBerth = preferences.berthPreference.replace("-", " ");
    items.push({
      key: "berth",
      label: `${formattedBerth.charAt(0).toUpperCase() + formattedBerth.slice(1)} berth requested`,
      met: true,
      note: "Requested · Subject to railway charting",
    });
  }

  return items;
}

