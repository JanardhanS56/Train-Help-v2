"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
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
import { loadPersistedState, savePersistedState } from "@/context/state-storage";
import {
  getAllTrips,
  getAllDisruptions,
  getTrainsBetween,
  dbTripToAppTrip,
  dbDisruptionToNotification,
} from "@/lib/data";

const initialState: AppState = {
  trips: [],
  selectedTripId: null,
  recoveryStage: "alternatives",
  recoveryByTripId: {},
  filters: DEFAULT_FILTERS,
  preferences: DEFAULT_PREFERENCES,
  selectedAlternativeId: null,
  notifications: [],
  chatMessages: [
    {
      id: "chat-init",
      role: "assistant",
      content:
        "Hello! I'm TravelRescue AI. I monitor your Indian Railways journeys and assist with instant disruption recovery, alternative trains, and full refund tracking.",
      timestamp: new Date(),
      options: [
        { label: "Show alternatives", value: "show-alternatives" },
        { label: "Change budget", value: "change-budget" },
        { label: "How refunds work", value: "refund-info" },
      ],
    },
  ],
  chatInputDraft: "",
  theme: DEFAULT_THEME,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SELECT_TRIP":
      return { ...state, selectedTripId: action.tripId };
    case "SET_RECOVERY_STAGE": {
      const tripId = state.selectedTripId || state.trips[0]?.id || "";
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
      const updatedTrips = state.trips.map((trip) =>
        trip.id === action.tripId
          ? {
              ...trip,
              status: "rebooked" as const,
              recoveredAlternativeId: action.alternativeId,
              refund: action.refundAmount !== undefined ? {
                originalFare: trip.fare,
                refundAmount: action.refundAmount,
                status: "Processing" as const,
                expectedDays: "3-5",
                refundMethod: "Original payment method",
              } : trip.refund,
            }
          : trip
      );

      const allTrips = action.newTrip ? [action.newTrip, ...updatedTrips] : updatedTrips;

      return {
        ...state,
        trips: allTrips,
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
      return {
        ...state,
        trips: [action.trip, ...state.trips],
        selectedTripId: action.trip.id,
      };
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
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "HYDRATE_STATE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [dynamicAlternatives, setDynamicAlternatives] = useState<Alternative[]>([]);

  // Hydrate state from localStorage after mount
  useEffect(() => {
    const hydrated = loadPersistedState(initialState);
    if (Object.keys(hydrated).length > 0) {
      dispatch({ type: "HYDRATE_STATE", state: hydrated });
    }
  }, []);

  // Fetch real trips and disruptions from Supabase
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [dbTrips, dbDisruptions] = await Promise.all([
          getAllTrips(),
          getAllDisruptions(),
        ]);

        if (!mounted) return;

        if (dbTrips.length > 0) {
          const appTrips = dbTrips.map((t) => dbTripToAppTrip(t));
          dispatch({
            type: "HYDRATE_STATE",
            state: {
              trips: appTrips,
              selectedTripId: appTrips[0]?.id ?? null,
            },
          });
        }

        if (dbDisruptions.length > 0) {
          const notifs = dbDisruptions.map((d) => dbDisruptionToNotification(d));
          dispatch({
            type: "HYDRATE_STATE",
            state: { notifications: notifs },
          });
        }
      } catch (err) {
        console.error("Failed to load trips from Supabase:", err);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
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
    () => state.trips.find((t) => t.id === state.selectedTripId) ?? state.trips[0] ?? null,
    [state.trips, state.selectedTripId]
  );

  const activeTrip: Trip | null = useMemo(
    () => getActiveTrip(state.trips, state.selectedTripId, state.recoveryByTripId),
    [state.trips, state.selectedTripId, state.recoveryByTripId]
  );

  // Dynamic alternatives resolution from Supabase trains_between
  useEffect(() => {
    let active = true;
    const tripToResolve = activeTrip || selectedTrip;
    const segment = tripToResolve?.segments[0];
    const fromCode = segment?.departureStation?.code;
    const toCode = segment?.arrivalStation?.code;

    async function resolveAlternatives() {
      if (!fromCode || !toCode || tripToResolve?.status === "on-time") {
        if (active) {
          setDynamicAlternatives((prev) => (prev.length === 0 ? prev : []));
        }
        return;
      }

      try {
        const trains = await getTrainsBetween(fromCode, toCode);
        if (!active) return;

        if (trains.length > 0) {
          const alts: Alternative[] = trains.map((t, idx) => ({
            id: `alt-${t.train_number}-${idx}`,
            tripId: tripToResolve.id,
            trainName: t.train_name,
            trainNumber: t.train_number,
            fromStation: segment.departureStation,
            toStation: segment.arrivalStation,
            departureTime: new Date(Date.now() + t.departure_min * 60000),
            arrivalTime: new Date(Date.now() + t.arrival_min * 60000),
            duration: t.duration_min,
            changes: 0,
            changeStations: [],
            travelClass: "3A",
            fare: 1450 + idx * 220,
            originalFare: tripToResolve.fare || 1450,
            fareDifference: 1450 + idx * 220 - (tripToResolve.fare || 1450),
            availability: {
              type: idx === 0 ? "available" : idx === 1 ? "rac" : "waitlist",
              label: idx === 0 ? "AVAILABLE 18" : idx === 1 ? "RAC 6" : "WL 12",
              count: idx === 0 ? 18 : undefined,
              racNumber: idx === 1 ? 6 : undefined,
              wlNumber: idx === 2 ? 12 : undefined,
            },
          }));
          setDynamicAlternatives(alts);
        } else {
          setDynamicAlternatives([]);
        }
      } catch (err) {
        console.error("Error resolving alternatives from Supabase:", err);
        if (active) setDynamicAlternatives([]);
      }
    }

    resolveAlternatives();
    return () => {
      active = false;
    };
  }, [activeTrip, selectedTrip]);

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
    return evaluateAlternatives(dynamicAlternatives, effectivePreferences, activeTrip ?? selectedTrip);
  }, [dynamicAlternatives, effectivePreferences, activeTrip, selectedTrip]);

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
