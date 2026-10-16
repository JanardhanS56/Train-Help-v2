/**
 * lib/sim/hazards.ts
 * Declarative Hazard Plausibility Engine for Indian Railways corridors.
 * 
 * Maps geographic coordinates, zones, and seasonality to authentic operational disruptions.
 * Prevents absurd combinations (e.g. Tsunami warning on Konkan railway, dense fog in Bangalore summer,
 * or mountain landslides across the flat Gangetic plains).
 */

import type { Obstacle, ObstacleType, ObstacleEffect, SimScheduleStop } from "./types";

export type GeographicRegion =
  | "konkan_ghats"       // Western Ghats, Konkan line, Nilgiris (rugged terrain, high monsoon rainfall)
  | "northern_plains"   // Punjab, Haryana, UP, Bihar (flat Gangetic basin, severe winter inversion fog)
  | "eastern_coast"     // Odisha, AP, TN, Bengal coastline (Bay of Bengal tropical cyclones)
  | "central_deccan"    // MP, Maharashtra, Telangana, Karnataka plateau (arid/semi-arid, extreme summer heat)
  | "southern_peninsula"// Tamil Nadu, Kerala, Karnataka plains
  | "general_corridor";

export interface PlausibleHazardDefinition {
  id: string;
  type: ObstacleType;
  title: string;
  descriptionTemplate: (fromStn: string, toStn: string) => string;
  effect: ObstacleEffect;
  defaultDurationMinutes: number;
  uncertaintyMinutes: number;
  speedCapKmph?: number;
  validRegions: GeographicRegion[];
  /** Allowed months (1 = Jan, 12 = Dec). Empty array means all year round. */
  validMonths: number[];
  plausibilityNote: string;
}

/**
 * Curated catalog of authentic Indian Railways hazards with regional and seasonal guardrails.
 */
export const HAZARD_CATALOG: PlausibleHazardDefinition[] = [
  // 1. Monsoon Landslide & Boulder Fall (Ghats / Konkan only, June to October)
  {
    id: "hz-landslide-ghat",
    type: "track_blockage",
    title: "Monsoon Landslide & Boulder Fall",
    descriptionTemplate: (from, to) =>
      `Torrents loosened mud and boulder debris onto the track between ${from} and ${to}. ARME (Accident Relief Medical Equipment) and earthmovers deployed.`,
    effect: "full_block",
    defaultDurationMinutes: 120,
    uncertaintyMinutes: 30,
    validRegions: ["konkan_ghats"],
    validMonths: [6, 7, 8, 9, 10],
    plausibilityNote: "Strictly confined to Western Ghats & Konkan cuttings during southwest monsoon.",
  },

  // 2. Dense Winter Fog Visibility Restriction (Northern Plains only, Nov to Feb)
  {
    id: "hz-dense-fog-winter",
    type: "fog_restriction",
    title: "Dense Radiation Fog Caution (Visibility <50m)",
    descriptionTemplate: (from, to) =>
      `Severe winter radiation fog over the ${from}—${to} section. Safety protocol mandates 30 km/h speed cap with detonator warning placement.`,
    effect: "speed_restriction",
    defaultDurationMinutes: 90,
    uncertaintyMinutes: 20,
    speedCapKmph: 30,
    validRegions: ["northern_plains"],
    validMonths: [11, 12, 1, 2],
    plausibilityNote: "Authentic to Indo-Gangetic plains during winter temperature inversion.",
  },

  // 3. Severe Cyclonic Track Washout & Coastal Gale (Eastern Coastal Belt, Oct-Dec & Apr-May)
  {
    id: "hz-cyclone-coast",
    type: "track_blockage",
    title: "Coastal Cyclone Warning & Ballast Washout",
    descriptionTemplate: (from, to) =>
      `Bay of Bengal cyclonic depression brings 90 km/h squalls and ballast erosion between ${from} and ${to}. Overhead power de-energized as precautionary measure.`,
    effect: "full_block",
    defaultDurationMinutes: 180,
    uncertaintyMinutes: 45,
    validRegions: ["eastern_coast"],
    validMonths: [4, 5, 10, 11, 12],
    plausibilityNote: "Realistic for coastal Odisha, Andhra Pradesh, and Tamil Nadu cyclone corridors.",
  },

  // 4. Rail Fracture under Extreme Temperature Differential (Northern / Central plains, Dec-Jan or May-June)
  {
    id: "hz-rail-fracture",
    type: "track_blockage",
    title: "Continuous Welded Rail (CWR) Thermal Fracture",
    descriptionTemplate: (from, to) =>
      `Track circuit drop indicated rail fracture near ${from}—${to} block section. Gangmen carrying out emergency fishplate clamping.`,
    effect: "full_block",
    defaultDurationMinutes: 60,
    uncertaintyMinutes: 15,
    validRegions: ["northern_plains", "central_deccan"],
    validMonths: [12, 1, 5, 6],
    plausibilityNote: "Triggered by extreme rail temperature differentials (winter contraction / summer buckling).",
  },

  // 5. Overhead 25kV Traction (OHE) Wire Snap (All electrified corridors, year-round)
  {
    id: "hz-ohe-wire-snap",
    type: "ohe_failure",
    title: "25kV AC Traction OHE Wire Parting",
    descriptionTemplate: (from, to) =>
      `Pantograph entanglement severed contact wire between ${from} and ${to}. Tower wagon dispatched from nearest traction sub-station.`,
    effect: "full_block",
    defaultDurationMinutes: 75,
    uncertaintyMinutes: 20,
    validRegions: ["konkan_ghats", "northern_plains", "eastern_coast", "central_deccan", "southern_peninsula", "general_corridor"],
    validMonths: [],
    plausibilityNote: "Plausible on any electrified broad-gauge trunk line across India.",
  },

  // 6. Route Relay Interlocking / Signal Point Failure (Station dwell / clamping, year-round)
  {
    id: "hz-signal-rri-failure",
    type: "signal_failure",
    title: "Point Machine & Interlocking Failure",
    descriptionTemplate: (from, to) =>
      `Electronic interlocking point clamped manually at ${to} outer home signal. Pilot paper authority (T/369-3b) issued for speed-restricted entry.`,
    effect: "station_dwell",
    defaultDurationMinutes: 45,
    uncertaintyMinutes: 10,
    validRegions: ["konkan_ghats", "northern_plains", "eastern_coast", "central_deccan", "southern_peninsula", "general_corridor"],
    validMonths: [],
    plausibilityNote: "Universal signalling failure scenario with standard Indian Railways paper pilot authority.",
  },

  // 7. Preceding Freight Train Coupler Parting (High-traffic freight trunk, year-round)
  {
    id: "hz-freight-coupler-part",
    type: "disabled_train",
    title: "Freight Rake Brake Binding & Coupler Parting",
    descriptionTemplate: (from, to) =>
      `A loaded BOXN coal rake stalled across the up-line section between ${from} and ${to}. Assisting banker engine coupled to clear section.`,
    effect: "full_block",
    defaultDurationMinutes: 80,
    uncertaintyMinutes: 25,
    validRegions: ["northern_plains", "eastern_coast", "central_deccan", "southern_peninsula", "general_corridor"],
    validMonths: [],
    plausibilityNote: "Common operational disruption on shared freight/passenger trunk corridors.",
  },

  // 8. Precautionary River Bridge Speed Restriction (Monsoon river swelling)
  {
    id: "hz-bridge-water-level",
    type: "bridge_inspection",
    title: "River Danger Water Level Caution (Bridge Restriction)",
    descriptionTemplate: (from, to) =>
      `River gauge reading approaching danger mark between ${from} and ${to}. Section engineer imposes 20 km/h dead-slow restriction for sounding.`,
    effect: "speed_restriction",
    defaultDurationMinutes: 60,
    uncertaintyMinutes: 15,
    speedCapKmph: 20,
    validRegions: ["konkan_ghats", "northern_plains", "eastern_coast"],
    validMonths: [7, 8, 9],
    plausibilityNote: "Bridge safety protocol when river level crosses danger mark on pier gauges.",
  },
];

/**
 * Classifies a stop or segment into a geographic railway region using coordinates and station codes.
 */
export function classifyRailwayRegion(lat: number, lon: number, stationCode?: string): GeographicRegion {
  const code = (stationCode || "").toUpperCase();

  // Known Konkan / Western Ghats stations
  const konkanCodes = new Set(["CHI", "RN", "MAO", "UD", "KAWR", "MAJN", "ROHA", "PNVL", "KUDL", "SWV", "BYNR", "SL", "KUDA"]);
  if (konkanCodes.has(code)) return "konkan_ghats";

  // Western Ghats boundary box (roughly lat 12.0 to 19.5, lon 73.0 to 75.5)
  if (lat >= 12.0 && lat <= 19.5 && lon >= 72.8 && lon <= 75.3) {
    return "konkan_ghats";
  }

  // Northern Gangetic Plains (lat 25.0 to 31.5, lon 75.0 to 86.0)
  if (lat >= 24.5 && lat <= 31.5 && lon >= 75.0 && lon <= 86.5) {
    return "northern_plains";
  }

  // Eastern Coast (Odisha, Coastal AP, Coastal Bengal)
  if (lat >= 13.0 && lat <= 22.5 && lon >= 80.0 && lon <= 88.5) {
    return "eastern_coast";
  }

  // Central / Deccan Plateau
  if (lat >= 15.0 && lat <= 24.5 && lon >= 75.0 && lon <= 81.0) {
    return "central_deccan";
  }

  // Southern Peninsula
  if (lat < 15.0) {
    return "southern_peninsula";
  }

  return "general_corridor";
}

/**
 * Returns plausible hazards for a given railway corridor stops and month.
 */
export function getPlausibleHazardsForRoute(
  stops: SimScheduleStop[],
  month = new Date().getMonth() + 1
): PlausibleHazardDefinition[] {
  if (stops.length === 0) return HAZARD_CATALOG.filter((h) => h.validRegions.includes("general_corridor"));

  // Collect regions traversed by the train
  const regionsInRoute = new Set<GeographicRegion>();
  for (const s of stops) {
    regionsInRoute.add(classifyRailwayRegion(s.latitude, s.longitude, s.stationCode));
  }

  return HAZARD_CATALOG.filter((hazard) => {
    // Check region compatibility
    const matchesRegion = hazard.validRegions.some((r) => regionsInRoute.has(r));
    if (!matchesRegion) return false;

    // Check month/season compatibility (empty means year-round)
    if (hazard.validMonths.length > 0 && !hazard.validMonths.includes(month)) {
      return false;
    }

    return true;
  });
}

/**
 * Autonomously selects a highly realistic upcoming obstacle ahead of the train.
 */
export function suggestRealisticObstacle(
  stops: SimScheduleStop[],
  currentMinute: number,
  currentStopIndex: number,
  month = new Date().getMonth() + 1
): Obstacle | null {
  if (stops.length < 2) return null;

  // Find the next upcoming segment
  const upcomingIdx = Math.max(0, Math.min(stops.length - 2, currentStopIndex));
  const s1 = stops[upcomingIdx];
  const s2 = stops[upcomingIdx + 1];

  const region = classifyRailwayRegion(s1.latitude, s1.longitude, s1.stationCode);
  const plausibleHazards = HAZARD_CATALOG.filter((h) => {
    const regionOk = h.validRegions.includes(region) || h.validRegions.includes("general_corridor");
    const monthOk = h.validMonths.length === 0 || h.validMonths.includes(month);
    return regionOk && monthOk;
  });

  const hazard = plausibleHazards[0] || HAZARD_CATALOG.find((h) => h.id === "hz-signal-rri-failure")!;

  return {
    id: `obs-plausible-${Date.now()}`,
    type: hazard.type,
    title: hazard.title,
    description: hazard.descriptionTemplate(s1.stationCode, s2.stationCode),
    locationType: hazard.effect === "station_dwell" ? "station" : "segment",
    fromStationCode: s1.stationCode,
    toStationCode: s2.stationCode,
    stationCode: hazard.effect === "station_dwell" ? s2.stationCode : undefined,
    startMinute: Math.max(currentMinute + 2, s1.departureMin),
    durationMinutes: hazard.defaultDurationMinutes,
    uncertaintyMinutes: hazard.uncertaintyMinutes,
    effect: hazard.effect,
    speedCapKmph: hazard.speedCapKmph,
  };
}
