import { TravelClass, BookingQuota } from "@/lib/types";

export type TravelerPersona =
  | "general"
  | "senior"
  | "female-solo"
  | "female-group"
  | "defense"
  | "divyangjan";

export interface PassengerProfileInput {
  age: number;
  gender: "M" | "F" | "O";
  persona: TravelerPersona;
  isSolo: boolean;
  companionCount: number;
  travelClass: TravelClass;
  hasDisabilityCertificate?: boolean;
  hasDefenseID?: boolean;
}

export interface QuotaEligibilityItem {
  quotaCode: BookingQuota | "DF";
  quotaName: string;
  isEligible: boolean;
  reason: string;
  badgeLabel: string;
  badgeVariant: "eligible" | "ineligible" | "conditional";
  benefitSummary: string;
  lowerBerthProbability?: {
    probabilityPercent: number;
    rating: "High (85%+)" | "Moderate (60%)" | "Standard (30%)" | "Low";
    rationale: string;
  };
}

export interface TatkalWindowStatus {
  targetClass: TravelClass;
  windowType: "AC" | "Non-AC";
  openingTimeStr: string; // "10:00 AM IST" or "11:00 AM IST"
  isOpenNow: boolean;
  secondsRemaining: number;
  formattedCountdown: string; // e.g. "02h 14m 32s"
  openingDate: Date;
  ruleExplanation: string;
}

/**
 * Evaluates passenger attributes against Indian Railways quota reservation policies:
 * - Senior Citizen Lower Berth Quota (SS): Men 60+, Women 45+/58+ traveling solo or in eligible senior pairs.
 * - Ladies Quota (LD): Solo females or women traveling together or with children < 12 yrs.
 * - Divyangjan Quota (HP): Concession certificate holders.
 * - Defense Quota (DF): Armed forces personnel with warrant/identity.
 * - Tatkal Quota (TQ): Emergency urgent quota opening at 10 AM (AC) / 11 AM (Non-AC).
 * - General Quota (GN): Universal quota open to all passengers.
 */
export function evaluateQuotaEligibility(
  profile: PassengerProfileInput
): QuotaEligibilityItem[] {
  const isSeniorMale = profile.gender === "M" && profile.age >= 60;
  const isSeniorFemale = profile.gender === "F" && profile.age >= 45;
  const isSeniorAge = isSeniorMale || isSeniorFemale;
  const isSeniorGroupEligible = isSeniorAge && profile.companionCount <= 1;

  // 1. Senior Citizen Lower Berth Quota (SS)
  let ssEligible = false;
  let ssReason = "";
  if (isSeniorGroupEligible) {
    ssEligible = true;
    ssReason = profile.gender === "F"
      ? `Eligible: Female travelers aged 45+ qualifies for dedicated Lower Berth quota.`
      : `Eligible: Male travelers aged 60+ qualifies for dedicated Senior Lower Berth quota.`;
  } else if (isSeniorAge && profile.companionCount > 1) {
    ssReason = "Ineligible: Senior Citizen lower berth quota requires traveling solo or in a pair of seniors only.";
  } else {
    ssReason = "Ineligible: Requires age 60+ (male) or age 45+ (female).";
  }

  const ssProbability = calculateLowerBerthProbability(profile);

  // 2. Ladies Quota (LD)
  let ldEligible = false;
  let ldReason = "";
  if (profile.gender === "F" && (profile.isSolo || profile.persona === "female-group")) {
    ldEligible = true;
    ldReason = "Eligible: Reserved exclusively for women traveling alone or women in an all-female group.";
  } else if (profile.gender === "F") {
    ldReason = "Conditional: Permitted if co-passengers are all female or children below 12.";
  } else {
    ldReason = "Ineligible: Ladies quota is earmarked strictly for female passengers.";
  }

  // 3. Divyangjan / Concession Quota (HP)
  const hpEligible = profile.persona === "divyangjan" || Boolean(profile.hasDisabilityCertificate);
  const hpReason = hpEligible
    ? "Eligible: Valid concession certificate entitles earmarked lower/middle berths and escort quota."
    : "Ineligible: Requires registered railway Divyangjan concession ID / photo certificate.";

  // 4. Defense Quota (DF)
  const dfEligible = profile.persona === "defense" || Boolean(profile.hasDefenseID);
  const dfReason = dfEligible
    ? "Eligible: Defense personnel traveling on duty or leave with defense identity warrant."
    : "Ineligible: Requires valid armed forces warrant or service identity number.";

  // 5. Tatkal Quota (TQ)
  const tqEligible = true;
  const tqReason = "Available to all travelers. Opens at 10:00 AM (AC) and 11:00 AM (Non-AC) daily.";

  // 6. General Quota (GN)
  const gnEligible = true;
  const gnReason = "Standard reservation pool available to all passengers 120 days in advance.";

  return [
    {
      quotaCode: "SS",
      quotaName: "Senior Citizen Lower Berth (SS)",
      isEligible: ssEligible,
      reason: ssReason,
      badgeLabel: ssEligible ? "ELIGIBLE" : "INELIGIBLE",
      badgeVariant: ssEligible ? "eligible" : "ineligible",
      benefitSummary: "Priority allocation of 2–6 lower berths per coach without extra surcharge.",
      lowerBerthProbability: ssProbability,
    },
    {
      quotaCode: "LD",
      quotaName: "Ladies Quota (LD)",
      isEligible: ldEligible,
      reason: ldReason,
      badgeLabel: ldEligible ? "ELIGIBLE" : "INELIGIBLE",
      badgeVariant: ldEligible ? "eligible" : "ineligible",
      benefitSummary: "6 berths per Sleeper/3A coach reserved for women for enhanced privacy & safety.",
    },
    {
      quotaCode: "HP",
      quotaName: "Divyangjan / Differently Abled (HP)",
      isEligible: hpEligible,
      reason: hpReason,
      badgeLabel: hpEligible ? "ELIGIBLE" : "REQUIRES CERT",
      badgeVariant: hpEligible ? "eligible" : "conditional",
      benefitSummary: "Earmarked wide-entry lower berths with companion/escort reservation concession.",
    },
    {
      quotaCode: "DF",
      quotaName: "Defense Forces Quota (DF)",
      isEligible: dfEligible,
      reason: dfReason,
      badgeLabel: dfEligible ? "ELIGIBLE" : "REQUIRES ID",
      badgeVariant: dfEligible ? "eligible" : "conditional",
      benefitSummary: "Earmarked defense emergency berths released 24h before train departure.",
    },
    {
      quotaCode: "TQ",
      quotaName: "Tatkal / Premium Tatkal (TQ)",
      isEligible: tqEligible,
      reason: tqReason,
      badgeLabel: "OPEN DAILY",
      badgeVariant: "eligible",
      benefitSummary: "Last-minute booking pool opening 24 hours prior to journey departure.",
    },
    {
      quotaCode: "GN",
      quotaName: "General Quota (GN)",
      isEligible: gnEligible,
      reason: gnReason,
      badgeLabel: "DEFAULT",
      badgeVariant: "eligible",
      benefitSummary: "Primary booking quota with maximum seat inventory across all classes.",
    },
  ];
}

/**
 * Calculates probability of receiving a lower berth based on passenger profile & selected class
 */
export function calculateLowerBerthProbability(
  profile: PassengerProfileInput
): {
  probabilityPercent: number;
  rating: "High (85%+)" | "Moderate (60%)" | "Standard (30%)" | "Low";
  rationale: string;
} {
  const isSenior = (profile.gender === "M" && profile.age >= 60) || (profile.gender === "F" && profile.age >= 45);

  if (isSenior && profile.isSolo) {
    return {
      probabilityPercent: 92,
      rating: "High (85%+)",
      rationale:
        "Senior solo traveler: Indian Railways auto-allocates earmarked SS quota lower berths (6 in SL, 4 in 3A/2A) as first priority.",
    };
  }

  if (isSenior && profile.companionCount === 1) {
    return {
      probabilityPercent: 78,
      rating: "Moderate (60%)",
      rationale:
        "Senior traveling in pair: High chance of at least 1 lower berth allotted if co-passenger is also eligible.",
    };
  }

  if (profile.gender === "F" && profile.isSolo) {
    return {
      probabilityPercent: 65,
      rating: "Moderate (60%)",
      rationale: "Solo female traveler: System prioritizes lower or side-lower berths when available in Ladies or General quota.",
    };
  }

  return {
    probabilityPercent: 32,
    rating: "Standard (30%)",
    rationale:
      "General quota booking: Lower berths are allocated on first-come basis after accommodating senior quota reservations.",
  };
}

/**
 * Computes exact countdown timer to the next Tatkal booking window:
 * - AC Classes (1A, 2A, 3A, CC, EC): Opens at 10:00:00 AM IST
 * - Non-AC Classes (SL): Opens at 11:00:00 AM IST
 */
export function getTatkalWindowStatus(
  targetClass: TravelClass = "3A",
  referenceTime: Date = new Date()
): TatkalWindowStatus {
  const isAcClass = targetClass !== "SL";
  const targetHour = isAcClass ? 10 : 11;
  const windowType: "AC" | "Non-AC" = isAcClass ? "AC" : "Non-AC";
  const openingTimeStr = isAcClass ? "10:00 AM IST" : "11:00 AM IST";

  // Build target opening date for today
  const targetDate = new Date(referenceTime);
  targetDate.setHours(targetHour, 0, 0, 0);

  // If current time is after today's window, the next window is tomorrow
  let diffMs = targetDate.getTime() - referenceTime.getTime();
  let openingDate = targetDate;

  if (diffMs < 0) {
    const tomorrow = new Date(referenceTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(targetHour, 0, 0, 0);
    openingDate = tomorrow;
    diffMs = tomorrow.getTime() - referenceTime.getTime();
  }

  const secondsRemaining = Math.max(0, Math.floor(diffMs / 1000));
  const hrs = Math.floor(secondsRemaining / 3600);
  const mins = Math.floor((secondsRemaining % 3600) / 60);
  const secs = secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formattedCountdown = `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;

  // Window is considered "Active / Open" for 60 minutes after opening hour on the same day
  const windowElapsedSinceOpening = referenceTime.getTime() - targetDate.getTime();
  const isOpenNow = windowElapsedSinceOpening >= 0 && windowElapsedSinceOpening <= 3600 * 1000;

  return {
    targetClass,
    windowType,
    openingTimeStr,
    isOpenNow,
    secondsRemaining,
    formattedCountdown,
    openingDate,
    ruleExplanation: isAcClass
      ? "AC Tatkal booking opens daily at 10:00 AM. Only 2 tickets per user allowed in opening window."
      : "Non-AC (Sleeper) Tatkal booking opens daily at 11:00 AM. Fast booking recommended.",
  };
}
