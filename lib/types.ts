// ─── Status & Enums ────────────────────────────────────────────────

export type TripStatus = "on-time" | "delayed" | "cancelled" | "recovered";

export type RecoveryStage =
  | "progress"
  | "alternatives"
  | "itinerary"
  | "success";

export type NotificationType =
  | "disruption"
  | "recovery"
  | "update"
  | "reminder";

export type SortKey = "arrival" | "price" | "duration" | "stops";
export type SortDirection = "asc" | "desc";

// ─── Core Models ───────────────────────────────────────────────────

export interface Airport {
  code: string;
  city: string;
  name: string;
}

export interface FlightSegment {
  carrier: string;
  flightNumber: string;
  departure: Airport;
  arrival: Airport;
  departureTime: Date;
  arrivalTime: Date;
  status: TripStatus;
}

export interface Trip {
  id: string;
  bookingRef: string;
  passengerName: string;
  segments: FlightSegment[];
  status: TripStatus;
  neededByTime?: Date;
  disruptionReason?: string;
  recoveredAlternativeId?: string;
}

export interface Alternative {
  id: string;
  tripId: string;
  carrier: string;
  flightNumber: string;
  departure: Airport;
  arrival: Airport;
  departureTime: Date;
  arrivalTime: Date;
  stops: number;
  stopCities: string[];
  price: number;
  originalPrice: number;
  priceDifference: number;
  seatsLeft: number;
  baggageIncluded: boolean;
  duration: number; // minutes
}

export interface RankedAlternative extends Alternative {
  rank: number;
  arrivalFitScore: number;  // 0-100
  priceScore: number;       // 0-100
  overallScore: number;     // 0-100
  tags: string[];
}

export interface Notification {
  id: string;
  tripId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  options?: ChatOption[];
}

export interface ChatOption {
  label: string;
  value: string;
}

export interface UserPreferences {
  preferredCarriers: string[];
  maxBudget: number;
  prioritiseArrivalTime: boolean;
  baggageRequired: boolean;
  seatPreference: "window" | "aisle" | "none";
  autoRecover: boolean;
}

// ─── Filter State ──────────────────────────────────────────────────

export interface AlternativeFilters {
  maxPrice: number | null;
  maxStops: number | null;
  carriersOnly: string[];
  baggageOnly: boolean;
  sortBy: SortKey;
  sortDirection: SortDirection;
}

// ─── App State ─────────────────────────────────────────────────────

export interface AppState {
  trips: Trip[];
  selectedTripId: string | null;
  recoveryStage: RecoveryStage;
  filters: AlternativeFilters;
  preferences: UserPreferences;
  selectedAlternativeId: string | null;
  notifications: Notification[];
  chatMessages: ChatMessage[];
  chatInputDraft: string;
}

// ─── Actions ───────────────────────────────────────────────────────

export type AppAction =
  | { type: "SELECT_TRIP"; tripId: string }
  | { type: "SET_RECOVERY_STAGE"; stage: RecoveryStage }
  | { type: "SET_FILTERS"; filters: Partial<AlternativeFilters> }
  | { type: "RESET_FILTERS" }
  | { type: "SELECT_ALTERNATIVE"; alternativeId: string }
  | { type: "CONFIRM_RECOVERY"; tripId: string; alternativeId: string }
  | { type: "UPDATE_PREFERENCES"; preferences: Partial<UserPreferences> }
  | { type: "MARK_NOTIFICATION_READ"; notificationId: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "ADD_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "SET_CHAT_INPUT"; value: string }
  | { type: "HYDRATE_STATE"; state: Partial<AppState> };

// ─── Context ───────────────────────────────────────────────────────

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  alternatives: Alternative[];
  rankedAlternatives: RankedAlternative[];
  unreadCount: number;
  selectedTrip: Trip | null;
}
