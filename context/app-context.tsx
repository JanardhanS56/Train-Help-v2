"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  AppState,
  AppAction,
  AppContextValue,
  Alternative,
  RankedAlternative,
  Trip,
  UserPreferences,
} from "@/lib/types";
import { DEFAULT_FILTERS, DEFAULT_PREFERENCES, DEFAULT_THEME } from "@/lib/constants";
import { evaluateAlternatives, getActiveTrip } from "@/lib/matching";
import { mockTrips, mockAlternatives, mockNotifications, initialChatMessages } from "@/mock/data";
import { loadPersistedState, savePersistedState, clearPersistedState } from "@/context/state-storage";

const initialState: AppState = {
  trips: mockTrips,
  selectedTripId: "trip-4",
  recoveryStage: "alternatives",
  recoveryByTripId: {
    "trip-4": "alternatives",
  },
  filters: DEFAULT_FILTERS,
  preferences: DEFAULT_PREFERENCES,
  selectedAlternativeId: "alt-1",
  notifications: mockNotifications,
  chatMessages: initialChatMessages,
  chatInputDraft: "",
  demoState: "normal",
  theme: DEFAULT_THEME,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SELECT_TRIP":
      return { ...state, selectedTripId: action.tripId };
    case "SET_RECOVERY_STAGE": {
      const tripId = state.selectedTripId || "trip-4";
      return {
        ...state,
        recoveryStage: action.stage,
        recoveryByTripId: {
          ...state.recoveryByTripId,
          [tripId]: action.stage,
        },
      };
    }
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case "RESET_FILTERS":
      return { ...state, filters: DEFAULT_FILTERS };
    case "SELECT_ALTERNATIVE":
      return { ...state, selectedAlternativeId: action.alternativeId };
    case "CONFIRM_RECOVERY": {
      const alt = mockAlternatives.find((a) => a.id === action.alternativeId);
      if (!alt) return state;
      const updatedTrips = state.trips.map((trip) =>
        trip.id === action.tripId
          ? {
              ...trip,
              status: "recovered" as const,
              recoveredAlternativeId: action.alternativeId,
              fare: alt.fare,
              travelClass: alt.travelClass,
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
          : trip
      );
      return {
        ...state,
        trips: updatedTrips,
        selectedAlternativeId: action.alternativeId,
        recoveryStage: "success",
        recoveryByTripId: {
          ...state.recoveryByTripId,
          [action.tripId]: "success",
        },
      };
    }
    case "UPDATE_PREFERENCES":
      return { ...state, preferences: { ...state.preferences, ...action.preferences } };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notificationId ? { ...n, read: true } : n
        ),
      };
    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "ADD_CHAT_MESSAGE":
      return { ...state, chatMessages: [...state.chatMessages, action.message] };
    case "CLEAR_CHAT_MESSAGES":
      return { ...state, chatMessages: [] };
    case "ADD_TRIP":
      return { ...state, trips: [action.trip, ...state.trips] };
    case "SUBMIT_VIBE_FEEDBACK": {
      const trainNum = action.feedback.trainNumber;
      const existing = state.vibeRatings?.[trainNum] || [];
      return {
        ...state,
        vibeRatings: {
          ...state.vibeRatings,
          [trainNum]: [action.feedback, ...existing],
        },
      };
    }
    case "SET_CHAT_INPUT":
      return { ...state, chatInputDraft: action.value };
    case "SET_DEMO_STATE":
      return { ...state, demoState: action.demoState };
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "RESET_DEMO":
      clearPersistedState();
      return {
        ...initialState,
        theme: state.theme,
      };
    case "HYDRATE_STATE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate state from localStorage after mount
  useEffect(() => {
    const hydrated = loadPersistedState(initialState);
    if (Object.keys(hydrated).length > 0) {
      dispatch({ type: "HYDRATE_STATE", state: hydrated });
    }
  }, []);

  // Save state to localStorage on state changes
  useEffect(() => {
    const timer = setTimeout(() => savePersistedState(state), 250);
    return () => clearTimeout(timer);
  }, [state]);

  // Synchronize theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      state.theme === "dark" ||
      (state.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [state.theme]);

  const selectedTrip: Trip | null = useMemo(
    () => state.trips.find((t) => t.id === state.selectedTripId) ?? state.trips[3] ?? null,
    [state.trips, state.selectedTripId]
  );

  const activeTrip: Trip | null = useMemo(
    () => getActiveTrip(state.trips, state.selectedTripId, state.recoveryByTripId),
    [state.trips, state.selectedTripId, state.recoveryByTripId]
  );

  const rawAlternatives = useMemo(() => {
    const targetTripId = activeTrip?.id || state.selectedTripId || "trip-4";
    return mockAlternatives.filter((a) => a.tripId === targetTripId);
  }, [activeTrip?.id, state.selectedTripId]);

  const effectivePreferences: UserPreferences = useMemo(() => {
    const p = { ...state.preferences };
    const f = state.filters;
    if (f.maxFare !== null) p.maxBudget = f.maxFare;
    if (f.maxChanges !== null) p.maxChanges = f.maxChanges;
    if (f.classFilter !== "any") {
      p.classes = [f.classFilter];
      p.onlyTheseClasses = true;
    }
    if (f.availableOnly) {
      p.seatPreference = "confirmed-only";
    }
    return p;
  }, [state.preferences, state.filters]);

  const evaluationResult = useMemo(() => {
    return evaluateAlternatives(rawAlternatives, effectivePreferences, activeTrip ?? selectedTrip);
  }, [rawAlternatives, effectivePreferences, activeTrip, selectedTrip]);

  const rankedAlternatives: RankedAlternative[] = useMemo(() => {
    const ranked = [...evaluationResult.ranked];
    const { sortBy, sortDirection } = state.filters;
    if (sortBy !== "best-match") {
      const dir = sortDirection === "asc" ? 1 : -1;
      ranked.sort((a, b) => {
        switch (sortBy) {
          case "price":
            return (a.fare - b.fare) * dir;
          case "duration":
            return (a.duration - b.duration) * dir;
          case "arrival":
            return (a.arrivalTime.getTime() - b.arrivalTime.getTime()) * dir;
          default:
            return 0;
        }
      });
    }
    return ranked;
  }, [evaluationResult.ranked, state.filters]);

  const alternatives: Alternative[] = useMemo(() => {
    return evaluationResult.eligible;
  }, [evaluationResult.eligible]);

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const contextValue: AppContextValue = useMemo(
    () => ({
      state,
      dispatch,
      alternatives,
      rankedAlternatives,
      unreadCount,
      selectedTrip,
      activeTrip,
    }),
    [state, alternatives, rankedAlternatives, unreadCount, selectedTrip, activeTrip]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

export function useAppDispatch() {
  const { dispatch } = useApp();
  return useCallback((action: AppAction) => dispatch(action), [dispatch]);
}
