import type { AppState, AppTheme, UserPreferences, TravelClass, BerthPreference, FlexibilityTolerance, Trip, TrainSegment } from "@/lib/types";
import { DEFAULT_PREFERENCES, DEFAULT_THEME, detectActivePreset } from "@/lib/constants";

export const STORAGE_KEY = "travelrescue-train-state-v5";

interface PersistedData {
  selectedTripId?: string;
  recoveryStage?: AppState["recoveryStage"];
  recoveryByTripId?: Record<string, AppState["recoveryStage"]>;
  selectedAlternativeId?: string;
  preferences?: Partial<UserPreferences>;
  theme?: AppTheme;
  recoveredTripUpdates?: { tripId: string; altId: string }[];
  readNotificationIds?: string[];
}

const VALID_CLASSES: TravelClass[] = ["SL", "3A", "2A", "1A", "CC", "EC"];

export function migratePreferences(stored: Partial<UserPreferences> | undefined): UserPreferences {
  if (!stored || typeof stored !== "object") return { ...DEFAULT_PREFERENCES };

  // Validate or migrate classes
  let classes: TravelClass[] = Array.isArray(stored.classes)
    ? (stored.classes.filter((c) => VALID_CLASSES.includes(c)) as TravelClass[])
    : [];
  if (classes.length === 0) {
    if (stored.preferredClass && VALID_CLASSES.includes(stored.preferredClass as TravelClass)) {
      classes = [stored.preferredClass as TravelClass];
    } else {
      classes = [...DEFAULT_PREFERENCES.classes];
    }
  }

  // Validate or migrate maxChanges
  let maxChanges = typeof stored.maxChanges === "number" ? stored.maxChanges : undefined;
  if (maxChanges === undefined) {
    if (stored.maxChangesPreference === "direct") maxChanges = 0;
    else if (stored.maxChangesPreference === "max-1") maxChanges = 1;
    else maxChanges = 2;
  }
  maxChanges = Math.min(2, Math.max(0, maxChanges));

  // Validate seatPreference
  let seatPreference = stored.seatPreference;
  if (seatPreference !== "confirmed-only" && seatPreference !== "confirmed-or-rac" && seatPreference !== "any") {
    seatPreference = DEFAULT_PREFERENCES.seatPreference;
  }

  // Validate berthPreference
  let berthPreference = stored.berthPreference;
  if (!berthPreference || !["no-preference", "lower", "middle", "upper", "side-lower", "side-upper"].includes(berthPreference)) {
    const legacySeat = (stored as Record<string, unknown>).seatPreference;
    if (typeof legacySeat === "string" && ["lower", "middle", "upper", "side-lower", "side-upper"].includes(legacySeat)) {
      berthPreference = legacySeat as BerthPreference;
    } else {
      berthPreference = "no-preference";
    }
  }

  // Validate deadline
  const deadlineDay = ["same-day", "next-day", "in-2-days", "none"].includes(stored.deadlineDay as string)
    ? stored.deadlineDay!
    : (stored.latestArrival ? "next-day" : DEFAULT_PREFERENCES.deadlineDay);

  const deadlineTime = typeof stored.deadlineTime === "string" || stored.deadlineTime === null
    ? stored.deadlineTime
    : (stored.latestArrival || null);

  const priorityProfile = ["balanced", "lowest-fare", "fastest", "comfort"].includes(stored.priorityProfile as string)
    ? stored.priorityProfile!
    : DEFAULT_PREFERENCES.priorityProfile;

  const departureWindow = ["any", "early-morning", "morning", "afternoon", "evening", "night"].includes(stored.departureWindow as string)
    ? stored.departureWindow!
    : (stored.departureWindow === "morning" || stored.departureWindow === "afternoon" || stored.departureWindow === "evening"
      ? stored.departureWindow
      : DEFAULT_PREFERENCES.departureWindow);

  const flexibilityHours = [1, 3, 6].includes(stored.flexibilityHours as number)
    ? (stored.flexibilityHours as FlexibilityTolerance)
    : DEFAULT_PREFERENCES.flexibilityHours;

  const maxBudget = typeof stored.maxBudget === "number" && !isNaN(stored.maxBudget)
    ? Math.min(10000, Math.max(500, Math.round(stored.maxBudget)))
    : DEFAULT_PREFERENCES.maxBudget;

  const migrated: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...stored,
    maxBudget,
    classes,
    onlyTheseClasses: Boolean(stored.onlyTheseClasses),
    seatPreference,
    maxChanges,
    departureWindow,
    deadlineDay,
    deadlineTime,
    flexibleSchedule: stored.flexibleSchedule !== undefined ? Boolean(stored.flexibleSchedule) : DEFAULT_PREFERENCES.flexibleSchedule,
    flexibilityHours,
    includeNearbyStations: Boolean(stored.includeNearbyStations),
    selectedNearbyStationCodes: Array.isArray(stored.selectedNearbyStationCodes) ? stored.selectedNearbyStationCodes : [],
    berthPreference,
    priorityProfile,
    preset: stored.preset && ["best-value", "fastest", "comfort", "confirmed-only", "custom"].includes(stored.preset) ? stored.preset : "custom",
  };

  migrated.preset = detectActivePreset(migrated);
  return migrated;
}

export function loadPersistedState(initialState: AppState): Partial<AppState> {
  if (typeof window === "undefined") return {};
  try {
    // Try current v5 storage key first, fallback to v4 if upgrading
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("travelrescue-train-state-v4");
    if (!stored) return {};
    const parsed: PersistedData = JSON.parse(stored);

    // Load any custom bookings saved in storage
    const customStoredBookings = typeof window !== "undefined" ? (() => {
      try {
        const raw = localStorage.getItem("tr_custom_bookings_v1");
        if (!raw) return [];
        interface StoredSegment { departureTime: string; arrivalTime: string }
        interface StoredTrip extends Omit<Trip, "segments"> { segments: (Omit<TrainSegment, "departureTime" | "arrivalTime"> & StoredSegment)[] }
        const parsedBookings = JSON.parse(raw) as StoredTrip[];
        return parsedBookings.map((t) => ({
          ...t,
          neededByTime: t.neededByTime ? new Date(t.neededByTime) : undefined,
          segments: (t.segments || []).map((s) => ({
            ...s,
            departureTime: new Date(s.departureTime),
            arrivalTime: new Date(s.arrivalTime),
          })),
        })) as Trip[];
      } catch {
        return [];
      }
    })() : [];

    let updatedTrips = [...customStoredBookings, ...initialState.trips];
    if (Array.isArray(parsed.recoveredTripUpdates)) {
      parsed.recoveredTripUpdates.forEach((up) => {
        updatedTrips = updatedTrips.map((t) =>
          t.id === up.tripId
            ? {
                ...t,
                status: "recovered" as const,
                recoveredAlternativeId: up.altId,
              }
            : t
        );
      });
    }

    const readSet = new Set(parsed.readNotificationIds ?? []);
    const updatedNotifs = initialState.notifications.map((n) => ({
      ...n,
      read: readSet.has(n.id) || n.read,
    }));

    return {
      trips: updatedTrips,
      selectedTripId: parsed.selectedTripId ?? initialState.selectedTripId,
      recoveryStage: parsed.recoveryStage ?? initialState.recoveryStage,
      recoveryByTripId: parsed.recoveryByTripId ?? initialState.recoveryByTripId,
      selectedAlternativeId: parsed.selectedAlternativeId ?? initialState.selectedAlternativeId,
      preferences: migratePreferences(parsed.preferences),
      notifications: updatedNotifs,
      theme: parsed.theme ?? DEFAULT_THEME,
    };
  } catch {
    return {};
  }
}

export function savePersistedState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    const recoveredUpdates = state.trips
      .filter((t) => (t.status === "recovered" || t.status === "rebooked") && t.recoveredAlternativeId)
      .map((t) => ({ tripId: t.id, altId: t.recoveredAlternativeId! }));

    const readIds = state.notifications.filter((n) => n.read).map((n) => n.id);

    const dataToSave: PersistedData = {
      selectedTripId: state.selectedTripId ?? undefined,
      recoveryStage: state.recoveryStage,
      recoveryByTripId: state.recoveryByTripId,
      selectedAlternativeId: state.selectedAlternativeId ?? undefined,
      preferences: state.preferences,
      theme: state.theme,
      recoveredTripUpdates: recoveredUpdates,
      readNotificationIds: readIds,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch {
    // Storage unavailable
  }
}

export function clearPersistedState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
