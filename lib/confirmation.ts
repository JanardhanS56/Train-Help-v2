/**
 * Fixed rules for Waitlist and RAC ticket confirmation chances in Indian Railways.
 * Same wording everywhere across the product per design specifications.
 */

export type ConfirmationChance = "likely" | "uncertain" | "unlikely";

export interface WaitlistAssessment {
  chance: ConfirmationChance;
  headline: string;
  explanation: string;
  badgeLabel: string;
}

export interface RacAssessment {
  headline: string;
  explanation: string;
  badgeLabel: string;
}

export function getWaitlistAssessment(wlNumber: number): WaitlistAssessment {
  if (wlNumber <= 5) {
    return {
      chance: "likely",
      headline: "Likely to confirm",
      explanation:
        "Waitlist 1–5 has a high historical chance of confirmation as cancellations occur before chart preparation.",
      badgeLabel: `WL ${wlNumber} · Likely to confirm`,
    };
  }
  if (wlNumber <= 15) {
    return {
      chance: "uncertain",
      headline: "Uncertain",
      explanation:
        "Waitlist 6–15 depends heavily on tatkal cancellations and quota releases. Confirmation is not guaranteed.",
      badgeLabel: `WL ${wlNumber} · Uncertain`,
    };
  }
  return {
    chance: "unlikely",
    headline: "Unlikely",
    explanation:
      "Waitlist 16+ is unlikely to confirm on this busy corridor. You will not be permitted to board reserved coaches if it remains waitlisted.",
    badgeLabel: `WL ${wlNumber} · Unlikely`,
  };
}

export function getRacAssessment(): RacAssessment {
  return {
    headline: "You'll get a seat, shared berth at first",
    explanation:
      "RAC tickets guarantee boarding rights. You are assigned a side lower berth shared with one co-passenger, which upgrades to a full berth if other passengers cancel.",
    badgeLabel: "RAC · Guaranteed boarding (shared berth)",
  };
}
