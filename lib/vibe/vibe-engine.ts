export interface VibeSubmission {
  trainNumber: string;
  water: "yes" | "low" | "none";
  sockets: "all" | "some" | "broken";
  cleanliness: number; // 1 to 5
  punctuality: "on-time" | "moderate-crawl" | "heavy-delay";
  submittedAt: number;
}

export interface TrainVibeMetrics {
  trainNumber: string;
  cleanlinessScore: number; // e.g. 4.4
  cleanlinessStarCount: string; // e.g. "4.4★"
  workingSocketsPercent: number; // e.g. 92
  waterLabel: string; // e.g. "Fresh Water Verified 2h ago"
  waterStatus: "good" | "warning" | "critical";
  punctualityLabel: string; // e.g. "Mostly On-Time"
  totalRatingsCount: number;
}

const BASE_TRAIN_VIBE: Record<string, { cleanliness: number; sockets: number; water: string; reviews: number; punctuality: string }> = {
  "22691": { cleanliness: 4.6, sockets: 94, water: "Fresh Water Verified 1h ago", reviews: 428, punctuality: "95% On-Time Record" },
  "12627": { cleanliness: 4.2, sockets: 88, water: "Fresh Water Verified 2h ago", reviews: 312, punctuality: "Minor 15m Crawl" },
  "12650": { cleanliness: 3.9, sockets: 76, water: "Water Low in Coach B3", reviews: 184, punctuality: "Heavy Delays Common" },
  "12952": { cleanliness: 4.8, sockets: 98, water: "Fresh Water Verified 30m ago", reviews: 610, punctuality: "Superfast On-Time" },
  "default": { cleanliness: 4.1, sockets: 84, water: "Fresh Water Verified 2h ago", reviews: 140, punctuality: "On-Time" },
};

const COOLDOWN_KEY_PREFIX = "tr_vibe_cooldown_";
const SUBMISSIONS_STORAGE_KEY = "tr_vibe_submissions_v1";
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minute spam protection cooldown

export function getAggregatedTrainVibe(
  trainNumber: string,
  userSubmissions: VibeSubmission[] = []
): TrainVibeMetrics {
  const base = BASE_TRAIN_VIBE[trainNumber] || BASE_TRAIN_VIBE["default"];
  const matchingSubmissions = userSubmissions.filter((s) => s.trainNumber === trainNumber);

  if (matchingSubmissions.length === 0) {
    return {
      trainNumber,
      cleanlinessScore: base.cleanliness,
      cleanlinessStarCount: `${base.cleanliness.toFixed(1)}★`,
      workingSocketsPercent: base.sockets,
      waterLabel: base.water,
      waterStatus: base.cleanliness >= 4.0 ? "good" : "warning",
      punctualityLabel: base.punctuality,
      totalRatingsCount: base.reviews,
    };
  }

  // Aggregate user feedback on top of base
  let totalCleanliness = base.cleanliness * 10;
  let socketPoints = base.sockets * 10;
  let count = 10;

  let lastWater = base.water;
  let waterStatus: "good" | "warning" | "critical" = "good";

  matchingSubmissions.forEach((sub) => {
    totalCleanliness += sub.cleanliness;
    socketPoints += sub.sockets === "all" ? 100 : sub.sockets === "some" ? 60 : 10;
    count += 1;

    if (sub.water === "yes") {
      lastWater = "Fresh Water Verified just now";
      waterStatus = "good";
    } else if (sub.water === "low") {
      lastWater = "Low Water reported just now";
      waterStatus = "warning";
    } else {
      lastWater = "No Water reported in coach";
      waterStatus = "critical";
    }
  });

  const avgCleanliness = Math.round((totalCleanliness / count) * 10) / 10;
  const avgSockets = Math.round(socketPoints / count);

  return {
    trainNumber,
    cleanlinessScore: avgCleanliness,
    cleanlinessStarCount: `${avgCleanliness.toFixed(1)}★`,
    workingSocketsPercent: avgSockets,
    waterLabel: lastWater,
    waterStatus,
    punctualityLabel: base.punctuality,
    totalRatingsCount: base.reviews + matchingSubmissions.length,
  };
}

export function canSubmitVibeRating(trainNumber: string): { allowed: boolean; remainingSec: number } {
  if (typeof window === "undefined") return { allowed: true, remainingSec: 0 };
  try {
    const raw = localStorage.getItem(`${COOLDOWN_KEY_PREFIX}${trainNumber}`);
    if (!raw) return { allowed: true, remainingSec: 0 };
    const lastTime = parseInt(raw, 10);
    const now = Date.now();
    const elapsed = now - lastTime;
    if (elapsed < COOLDOWN_MS) {
      return { allowed: false, remainingSec: Math.ceil((COOLDOWN_MS - elapsed) / 1000) };
    }
    return { allowed: true, remainingSec: 0 };
  } catch {
    return { allowed: true, remainingSec: 0 };
  }
}

export function recordVibeSubmission(submission: VibeSubmission): void {
  if (typeof window === "undefined") return;
  try {
    // Record cooldown timestamp
    localStorage.setItem(`${COOLDOWN_KEY_PREFIX}${submission.trainNumber}`, Date.now().toString());

    // Record submission list
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const list: VibeSubmission[] = raw ? JSON.parse(raw) : [];
    list.unshift(submission);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to store vibe submission", err);
  }
}

export function loadStoredVibeSubmissions(): VibeSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
