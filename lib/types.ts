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

export type SortKey = "best-match" | "price" | "duration" | "arrival";
export type SortDirection = "asc" | "desc";

export type DemoState = "normal" | "loading" | "empty" | "error";

export type TravelClass = "SL" | "3A" | "2A" | "1A" | "CC" | "EC";

export type AvailabilityStatus = "available" | "rac" | "waitlist";

export type AppTheme = "light" | "dark" | "system";

export interface AvailabilityInfo {
  type: AvailabilityStatus;
  status?: AvailabilityStatus;
  count?: number;
  racNumber?: number;
  wlNumber?: number;
  label: string;
}

export interface RefundInfo {
  originalFare: number;
  refundAmount: number;
  status: "Requested" | "Processing" | "Refunded";
  expectedDays: string; // e.g. "5-7"
  refundMethod: string; // "original payment method"
}

export interface NearbyStation {
  name: string;
  code: string;
  travelTime: string; // e.g. "25 min"
  distance: string;   // e.g. "8 km"
  city: string;
  mainStationCode: string;
}

export interface TimelineStop {
  station: string;
  code: string;
  time: string;
  platform: string;
  type: "origin" | "halt" | "destination";
  dayOffset?: string;
}

// ─── Core Models ───────────────────────────────────────────────────

export interface Station {
  code: string;
  city: string;
  name: string;
  platform?: string;
}

export interface TrainSegment {
  trainName: string;
  trainNumber: string;
  departureStation: Station;
  arrivalStation: Station;
  fromStation?: Station;
  toStation?: Station;
  departureTime: Date;
  arrivalTime: Date;
  dayOffset?: string; // e.g. "+1 day" or "+2 days"
  status: TripStatus;
  travelClass?: TravelClass;
  coachBerth?: string;
  coach?: string;
  berth?: string;
  platform?: string;
}

export interface Trip {
  id: string;
  pnr: string; // 10-digit PNR
  passengerName: string;
  travelClass: TravelClass;
  fare: number;
  coach?: string;
  berth?: string;
  segments: TrainSegment[];
  status: TripStatus;
  neededByTime?: Date;
  disruptionReason?: string;
  recoveredAlternativeId?: string;
  refund?: RefundInfo;
  onTimeNote?: string;
}

export interface Alternative {
  id: string;
  tripId: string;
  trainName: string;
  trainNumber: string;
  fromStation: Station;
  toStation: Station;
  departureTime: Date;
  arrivalTime: Date;
  dayOffset?: string;
  duration: number; // minutes
  changes: number; // 0 = Direct
  changeStations: string[];
  travelClass: TravelClass;
  coachBerth?: string;
  fare: number;
  originalFare: number;
  fareDifference: number;
  availability: AvailabilityInfo;
  timelineStops?: TimelineStop[];
  nearbyStationSuggestion?: NearbyStation;
}

export interface RankedAlternative extends Alternative {
  rank: number;
  budgetFitScore: number;    // 0-100 (weight 30)
  arrivalFitScore: number;   // 0-100 (weight 30)
  changesScore: number;      // 0-100 (weight 15)
  durationScore: number;     // 0-100 (weight 15)
  preferenceFitScore: number;// 0-100 (weight 10)
  overallScore: number;      // 0-100
  tags: string[];
  matchReason?: string;      // One plain-language reason sentence for Best Match
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
  preferredTrains: string[];
  maxBudget: number;
  prioritiseArrivalTime: boolean;
  preferredClass: TravelClass | "any";
  seatPreference: "lower" | "middle" | "upper" | "side-lower" | "none";
  autoRecover: boolean;
  preferredTransport: "train" | "flight" | "bus";
  maxChangesPreference: "any" | "direct" | "max-1";
  departureWindow: "any" | "morning" | "afternoon" | "evening";
  latestArrival: string;
  flexibleSchedule: boolean;
  includeNearbyStations: boolean;
}

// ─── Filter State ──────────────────────────────────────────────────

export interface AlternativeFilters {
  maxFare: number | null;
  maxChanges: number | null;
  classFilter: TravelClass | "any";
  availableOnly: boolean;
  trainsOnly: string[];
  sortBy: SortKey;
  sortDirection: SortDirection;
}

// ─── App State ─────────────────────────────────────────────────────

export interface AppState {
  trips: Trip[];
  selectedTripId: string | null;
  recoveryStage: RecoveryStage;
  recoveryByTripId?: Record<string, RecoveryStage>;
  filters: AlternativeFilters;
  preferences: UserPreferences;
  selectedAlternativeId: string | null;
  notifications: Notification[];
  chatMessages: ChatMessage[];
  chatInputDraft: string;
  demoState: DemoState;
  theme: AppTheme;
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
  | { type: "SET_DEMO_STATE"; demoState: DemoState }
  | { type: "SET_THEME"; theme: AppTheme }
  | { type: "RESET_DEMO" }
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
