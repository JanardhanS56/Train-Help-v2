import type { TripStatus, TravelClass, NearbyStation, AppTheme } from "./types";

// ─── Routes ────────────────────────────────────────────────────────

export const ROUTES = {
  landing: "/",
  dashboard: "/dashboard",
  trip: (id: string) => `/trips/${id}`,
  recovery: (id: string) => `/recovery/${id}`,
  preferences: "/preferences",
  notifications: "/notifications",
  help: "/help",
} as const;

// ─── Navigation Items ──────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  iconName: "layout-dashboard" | "train" | "settings" | "bell" | "help-circle";
  matchPattern: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    iconName: "layout-dashboard",
    matchPattern: "/dashboard",
  },
  {
    label: "Preferences",
    href: ROUTES.preferences,
    iconName: "settings",
    matchPattern: "/preferences",
  },
  {
    label: "Notifications",
    href: ROUTES.notifications,
    iconName: "bell",
    matchPattern: "/notifications",
  },
  {
    label: "Help",
    href: ROUTES.help,
    iconName: "help-circle",
    matchPattern: "/help",
  },
];

// ─── Status Config ─────────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  iconName: "check-circle" | "clock" | "x-circle" | "refresh-cw";
  colorClass: string;
  bgClass: string;
}

export const STATUS_CONFIG: Record<TripStatus, StatusConfig> = {
  "on-time": {
    label: "On time",
    iconName: "check-circle",
    colorClass: "text-success",
    bgClass: "bg-success/10",
  },
  delayed: {
    label: "Delayed",
    iconName: "clock",
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
  },
  cancelled: {
    label: "Cancelled",
    iconName: "x-circle",
    colorClass: "text-disruption",
    bgClass: "bg-disruption/10",
  },
  recovered: {
    label: "Recovered",
    iconName: "refresh-cw",
    colorClass: "text-success",
    bgClass: "bg-success/10",
  },
} as const;

// ─── Stations ──────────────────────────────────────────────────────

export const STATIONS = {
  SBC: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru City" },
  YPR: { code: "YPR", city: "Bengaluru", name: "Yesvantpur Junction" },
  BNC: { code: "BNC", city: "Bengaluru", name: "Bengaluru Cantonment" },
  NDLS: { code: "NDLS", city: "Delhi", name: "New Delhi Railway Station" },
  NZM: { code: "NZM", city: "Delhi", name: "Hazrat Nizamuddin" },
  ANVT: { code: "ANVT", city: "Delhi", name: "Anand Vihar Terminal" },
  CSMT: { code: "CSMT", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Terminus" },
  MMCT: { code: "MMCT", city: "Mumbai", name: "Mumbai Central" },
  DR: { code: "DR", city: "Mumbai", name: "Dadar Central" },
  MAS: { code: "MAS", city: "Chennai", name: "Puratchi Thalaivar Dr. MGR Central" },
  HYB: { code: "HYB", city: "Hyderabad", name: "Hyderabad Deccan" },
  SC: { code: "SC", city: "Secunderabad", name: "Secunderabad Junction" },
  HWH: { code: "HWH", city: "Kolkata", name: "Howrah Junction" },
  MAO: { code: "MAO", city: "Goa", name: "Madgaon Junction" },
  BPL: { code: "BPL", city: "Bhopal", name: "Bhopal Junction" },
  NGP: { code: "NGP", city: "Nagpur", name: "Nagpur Junction" },
} as const;

// 2 nearby stations per major city (name, code, travel time & distance from main station)
export const NEARBY_STATIONS: Record<string, NearbyStation[]> = {
  Bengaluru: [
    {
      name: "Yesvantpur Junction",
      code: "YPR",
      travelTime: "25 min",
      distance: "8 km",
      city: "Bengaluru",
      mainStationCode: "SBC",
    },
    {
      name: "Bengaluru Cantonment",
      code: "BNC",
      travelTime: "15 min",
      distance: "4 km",
      city: "Bengaluru",
      mainStationCode: "SBC",
    },
  ],
  Delhi: [
    {
      name: "Hazrat Nizamuddin",
      code: "NZM",
      travelTime: "20 min",
      distance: "7 km",
      city: "Delhi",
      mainStationCode: "NDLS",
    },
    {
      name: "Anand Vihar Terminal",
      code: "ANVT",
      travelTime: "35 min",
      distance: "14 km",
      city: "Delhi",
      mainStationCode: "NDLS",
    },
  ],
};

export const TRAVEL_CLASSES: { code: TravelClass; name: string }[] = [
  { code: "SL", name: "Sleeper Class (SL)" },
  { code: "3A", name: "AC 3-Tier (3A)" },
  { code: "2A", name: "AC 2-Tier (2A)" },
  { code: "1A", name: "AC First Class (1A)" },
  { code: "CC", name: "AC Chair Car (CC)" },
  { code: "EC", name: "Exec Chair Car (EC)" },
];

// ─── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
  preferredTrains: [] as string[],
  maxBudget: 3500,
  prioritiseArrivalTime: true,
  preferredClass: "3A" as TravelClass,
  seatPreference: "lower" as const,
  autoRecover: false,
  preferredTransport: "train" as const,
  maxChangesPreference: "any" as const,
  departureWindow: "any" as const,
  latestArrival: "09:00",
  flexibleSchedule: true,
  includeNearbyStations: false,
};

export const DEFAULT_FILTERS = {
  maxFare: null,
  maxChanges: null,
  classFilter: "any" as TravelClass | "any",
  availableOnly: false,
  trainsOnly: [] as string[],
  sortBy: "best-match" as const,
  sortDirection: "asc" as const,
};

export const DEFAULT_THEME: AppTheme = "system";

// ─── Breakpoints ───────────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

// ─── App Meta ──────────────────────────────────────────────────────

export const APP_NAME = "TravelRescue";
export const APP_TAGLINE = "Your train was disrupted. We\u2019ve got this.";
