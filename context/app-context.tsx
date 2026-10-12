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
} from "@/lib/types";
import { DEFAULT_FILTERS, DEFAULT_PREFERENCES, DEFAULT_THEME } from "@/lib/constants";
import { rankAlternatives } from "@/lib/ranking";
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

  const alternatives: Alternative[] = useMemo(() => {
    const targetTripId = state.selectedTripId || "trip-4";
    let alts = mockAlternatives.filter((a) => a.tripId === targetTripId);
    const f = state.filters;
    if (f.maxFare !== null) alts = alts.filter((a) => a.fare <= f.maxFare!);
    if (f.maxChanges !== null) alts = alts.filter((a) => a.changes <= f.maxChanges!);
    if (f.classFilter !== "any") alts = alts.filter((a) => a.travelClass === f.classFilter);
    if (f.availableOnly) alts = alts.filter((a) => a.availability.type === "available");
    if (f.trainsOnly.length > 0) alts = alts.filter((a) => f.trainsOnly.includes(a.trainNumber));
    return alts;
  }, [state.selectedTripId, state.filters]);

  const rankedAlternatives: RankedAlternative[] = useMemo(() => {
    if (!selectedTrip) return [];
    const ranked = rankAlternatives(alternatives, selectedTrip, state.preferences);
    const { sortBy, sortDirection } = state.filters;
    const dir = sortDirection === "asc" ? 1 : -1;
    ranked.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.fare - b.fare) * dir;
        case "duration":
          return (a.duration - b.duration) * dir;
        case "arrival":
          return (a.arrivalTime.getTime() - b.arrivalTime.getTime()) * dir;
        case "best-match":
        default:
          return (b.overallScore - a.overallScore) * dir;
      }
    });
    return ranked;
  }, [alternatives, selectedTrip, state.preferences, state.filters]);

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
    }),
    [state, alternatives, rankedAlternatives, unreadCount, selectedTrip]
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
