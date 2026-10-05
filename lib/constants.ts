import type { TripStatus } from "./types";

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
  iconName: "layout-dashboard" | "plane" | "settings" | "bell" | "help-circle";
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

// ─── Carriers ──────────────────────────────────────────────────────

export const CARRIERS = [
  "IndiGo",
  "Air India",
  "Air India Express",
  "Akasa Air",
  "SpiceJet",
] as const;

export type Carrier = (typeof CARRIERS)[number];

// ─── Airports ──────────────────────────────────────────────────────

export const AIRPORTS = {
  BLR: { code: "BLR", city: "Bengaluru", name: "Kempegowda International" },
  DEL: { code: "DEL", city: "Delhi", name: "Indira Gandhi International" },
  BOM: { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj" },
  MAA: { code: "MAA", city: "Chennai", name: "Chennai International" },
  HYD: { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International" },
  CCU: { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose" },
  GOI: { code: "GOI", city: "Goa", name: "Manohar International" },
} as const;

// ─── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
  preferredCarriers: [] as string[],
  maxBudget: 15000,
  prioritiseArrivalTime: true,
  baggageRequired: true,
  seatPreference: "none" as const,
  autoRecover: false,
};

export const DEFAULT_FILTERS = {
  maxPrice: null,
  maxStops: null,
  carriersOnly: [] as string[],
  baggageOnly: false,
  sortBy: "arrival" as const,
  sortDirection: "asc" as const,
};

// ─── Breakpoints ───────────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

// ─── App Meta ──────────────────────────────────────────────────────

export const APP_NAME = "TravelRescue";
export const APP_TAGLINE = "Something went wrong. We\u2019ve got this.";
