import type { AppState, AppTheme } from "@/lib/types";
import { mockAlternatives } from "@/mock/data";
import { DEFAULT_PREFERENCES, DEFAULT_THEME } from "@/lib/constants";

export const STORAGE_KEY = "travelrescue-train-state-v4";

interface PersistedData {
  selectedTripId?: string;
  recoveryStage?: AppState["recoveryStage"];
  selectedAlternativeId?: string;
  preferences?: AppState["preferences"];
  theme?: AppTheme;
  recoveredTripUpdates?: { tripId: string; altId: string }[];
  readNotificationIds?: string[];
}

export function loadPersistedState(initialState: AppState): Partial<AppState> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed: PersistedData = JSON.parse(stored);

    let updatedTrips = [...initialState.trips];
    if (Array.isArray(parsed.recoveredTripUpdates)) {
      parsed.recoveredTripUpdates.forEach((up) => {
        const alt = mockAlternatives.find((a) => a.id === up.altId);
        if (alt) {
          updatedTrips = updatedTrips.map((t) =>
            t.id === up.tripId
              ? {
                  ...t,
                  status: "recovered" as const,
                  recoveredAlternativeId: up.altId,
                  travelClass: alt.travelClass,
                  fare: alt.fare,
                  coach: "B4",
                  berth: "23 · Lower",
                  segments: [
                    {
                      trainName: alt.trainName,
                      trainNumber: alt.trainNumber,
                      departureStation: alt.fromStation,
                      arrivalStation: alt.toStation,
                      departureTime: alt.departureTime,
                      arrivalTime: alt.arrivalTime,
                      dayOffset: alt.dayOffset,
                      status: "recovered" as const,
                      coach: "B4",
                      berth: "23 · Lower",
                      platform: "Platform 1",
                    },
                  ],
                }
              : t
          );
        }
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
      selectedAlternativeId: parsed.selectedAlternativeId ?? initialState.selectedAlternativeId,
      preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences ?? {}) },
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
      .filter((t) => t.status === "recovered" && t.recoveredAlternativeId)
      .map((t) => ({ tripId: t.id, altId: t.recoveredAlternativeId! }));

    const readIds = state.notifications.filter((n) => n.read).map((n) => n.id);

    const dataToSave: PersistedData = {
      selectedTripId: state.selectedTripId ?? undefined,
      recoveryStage: state.recoveryStage,
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
