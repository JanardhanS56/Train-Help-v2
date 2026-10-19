/**
 * lib/data/snapshot-fallback.ts
 * Zero-network resilient fallback data provider powered by data/clean/sim-snapshot.json.
 * Guarantees that simulation and 1-click demos work seamlessly even after deployment,
 * when Supabase is unconfigured, paused, unreachable, or in zero-connectivity environments.
 */

import snapshotRaw from "@/data/clean/sim-snapshot.json";
import type {
  DbTrain,
  DbTrainStop,
  DbStation,
  DbRailLink,
  TrainWithStops,
  TrainSearchResult,
} from "./types";
import type { SimScenarioRun, TelemetrySnapshot } from "@/lib/sim/persistence";

interface RawSnapshotStation {
  code: string;
  name: string;
  state: string;
  zone: string;
  lat: number;
  lng: number;
  is_junction: boolean;
  route_count: number;
}

interface RawSnapshotData {
  version: string;
  generated_at: string;
  disclaimer: string;
  trains: DbTrain[];
  stops: Array<{
    train_number: string;
    seq: number;
    station_code: string;
    station_name: string;
    arrival_min: number | null;
    departure_min: number | null;
    arrival_formatted: string | null;
    departure_formatted: string | null;
    day_offset: number;
    distance_km: number;
    halt_min: number;
    time_source: "official" | "derived";
  }>;
  stations: RawSnapshotStation[];
  rail_links: DbRailLink[];
}

const snapshot = snapshotRaw as unknown as RawSnapshotData;

// Pre-index stations by uppercase code for fast O(1) coordinate lookup
const stationsByCode = new Map<string, RawSnapshotStation>(
  snapshot.stations.map((s) => [s.code.toUpperCase(), s])
);

/**
 * Search trains from snapshot fallback
 */
export function getSnapshotTrains(query = "", limit = 50): TrainSearchResult[] {
  const q = query.trim().toUpperCase();
  let results = snapshot.trains;

  if (q) {
    results = results.filter(
      (t) =>
        t.train_number.toUpperCase().includes(q) ||
        t.train_name.toUpperCase().includes(q) ||
        t.origin_station_code.toUpperCase().includes(q) ||
        t.destination_station_code.toUpperCase().includes(q) ||
        t.origin_name.toUpperCase().includes(q) ||
        t.destination_name.toUpperCase().includes(q)
    );
  }

  return results.slice(0, limit).map((t) => ({
    train_number: t.train_number,
    train_name: t.train_name,
    train_type: t.train_type,
    origin_station_code: t.origin_station_code,
    destination_station_code: t.destination_station_code,
    origin_name: t.origin_name,
    destination_name: t.destination_name,
    days_running: t.days_running,
    total_distance_km: t.total_distance_km,
    total_duration_min: t.total_duration_min,
    stops_count: t.stops_count,
  }));
}

/**
 * Retrieve a train with full stop sequence and geographic coordinates from snapshot fallback
 */
export function getSnapshotTrainByNumber(trainNumber: string): TrainWithStops | null {
  const num = trainNumber.trim();
  const train = snapshot.trains.find((t) => t.train_number === num);
  if (!train) return null;

  const rawStops = snapshot.stops
    .filter((s) => s.train_number === num)
    .sort((a, b) => a.seq - b.seq);

  const enrichedStops: DbTrainStop[] = rawStops.map((s) => {
    const station = stationsByCode.get(s.station_code.toUpperCase());
    return {
      train_number: s.train_number,
      seq: s.seq,
      station_code: s.station_code,
      station_name: s.station_name,
      arrival_min: s.arrival_min,
      departure_min: s.departure_min,
      arrival_formatted: s.arrival_formatted,
      departure_formatted: s.departure_formatted,
      day_offset: s.day_offset,
      distance_km: s.distance_km,
      halt_min: s.halt_min,
      time_source: s.time_source,
      latitude: station?.lat ?? 20.5937,
      longitude: station?.lng ?? 78.9629,
    };
  });

  return {
    ...train,
    stops: enrichedStops,
  };
}

/**
 * Search stations or list all stations from snapshot fallback
 */
export function getSnapshotStations(query = "", limit = 50): DbStation[] {
  const q = query.trim().toUpperCase();
  let results = snapshot.stations;

  if (q) {
    results = results.filter(
      (s) =>
        s.code.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.state.toUpperCase().includes(q)
    );
  }

  return results.slice(0, limit).map((s) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    zone: s.zone,
    latitude: s.lat,
    longitude: s.lng,
    is_junction: s.is_junction,
    route_count: s.route_count,
  }));
}

/**
 * Get station by code from snapshot fallback
 */
export function getSnapshotStation(code: string): DbStation | null {
  const station = stationsByCode.get(code.trim().toUpperCase());
  if (!station) return null;
  return {
    code: station.code,
    name: station.name,
    state: station.state,
    zone: station.zone,
    latitude: station.lat,
    longitude: station.lng,
    is_junction: station.is_junction,
    route_count: station.route_count,
  };
}

/**
 * Get network rail links from snapshot fallback
 */
export function getSnapshotRailLinks(): DbRailLink[] {
  return (snapshot.rail_links || []).map((l) => ({
    station_a: l.station_a,
    station_b: l.station_b,
    distance_km: l.distance_km,
    typical_duration_min: l.typical_duration_min,
    traversals: l.traversals,
  }));
}

/**
 * Built-in archived replay scenario runs for zero-network playback
 */
export function getSnapshotPresetScenarios(): SimScenarioRun[] {
  return [
    {
      id: "preset-run-ohe-bhopal",
      name: "Bengaluru Rajdhani OHE Breakdown (BPL—ET)",
      createdBy: "Chief Controller",
      trainNumber: "22691",
      trainName: "Rajdhani Exp",
      startMinute: 1180,
      endMinute: 1585,
      seed: 42,
      metadata: {
        description: "25kV Traction OHE line snapped between Itarsi and Bhopal. Tactical detour via Bina.",
        trainType: "Rajdhani",
        savedAt: "2026-10-15T12:00:00Z",
      },
      obstacles: [
        {
          id: "obs-ohe-bpl-et",
          type: "ohe_failure",
          title: "High-Tension Traction Wire De-energized",
          description: "Panto entanglement severed 25kV traction line between ET and BPL.",
          locationType: "segment",
          fromStationCode: "ET",
          toStationCode: "BPL",
          startMinute: 1215,
          durationMinutes: 60,
          uncertaintyMinutes: 15,
          effect: "full_block",
        },
      ],
      events: [
        {
          tOffsetMs: 0,
          kind: "departure",
          payload: {
            title: "Departed Itarsi (ET)",
            detail: "Train departed platform 2 on mainline block section.",
            minute: 1190,
          },
        },
        {
          tOffsetMs: 12000,
          kind: "disruption",
          payload: {
            title: "OHE Power Loss Alarm",
            detail: "Overhead electric power lost. Rake coasting to safe halt.",
            minute: 1215,
          },
        },
        {
          tOffsetMs: 24000,
          kind: "reroute",
          payload: {
            title: "AI Advisor Detour Dispatched",
            detail: "Tactical bypass via Khandwa Loop approved by railway board.",
            minute: 1225,
          },
        },
      ],
      telemetrySnapshots: [
        {
          minute: 1180,
          tOffsetMs: 0,
          distanceKm: 1094,
          speedKmph: 110,
          latitude: 22.6144,
          longitude: 77.7618,
          state: "running",
          delayMinutes: 0,
          currentStopIndex: 10,
          nextStopIndex: 11,
          currentStationCode: "ET",
          nextStationCode: "BPL",
          statusMessage: "Cruising at 110 km/h towards Bhopal.",
        },
        {
          minute: 1215,
          tOffsetMs: 15000,
          distanceKm: 1180,
          speedKmph: 0,
          latitude: 22.95,
          longitude: 77.6,
          state: "blocked",
          delayMinutes: 25,
          currentStopIndex: 10,
          nextStopIndex: 11,
          currentStationCode: null,
          nextStationCode: "BPL",
          statusMessage: "BLOCKED: High-Tension Traction Wire De-energized.",
        },
      ],
      createdAt: "2026-10-15T12:00:00Z",
    },
    {
      id: "preset-run-konkan-landslide",
      name: "Mao Jan Shatabdi Monsoon Landslide (CHI—RN)",
      createdBy: "Regional Controller",
      trainNumber: "12051",
      trainName: "Mao Janshatabdi",
      startMinute: 550,
      endMinute: 850,
      seed: 88,
      metadata: {
        description: "Monsoon mudslide in Chiplun—Ratnagiri ghat cutting.",
        trainType: "Shatabdi",
        savedAt: "2026-10-15T12:00:00Z",
      },
      obstacles: [
        {
          id: "obs-landslide-chi-rn",
          type: "track_blockage",
          title: "Monsoon Landslide & Boulder Fall",
          description: "Mudslide across Konkan ghat section track.",
          locationType: "segment",
          fromStationCode: "CHI",
          toStationCode: "RN",
          startMinute: 600,
          durationMinutes: 90,
          uncertaintyMinutes: 20,
          effect: "full_block",
        },
      ],
      events: [
        {
          tOffsetMs: 0,
          kind: "departure",
          payload: {
            title: "Departed Chiplun (CHI)",
            detail: "Commencing descent into Ratnagiri ghat cutting.",
            minute: 568,
          },
        },
        {
          tOffsetMs: 15000,
          kind: "disruption",
          payload: {
            title: "Track Circuit Disruption",
            detail: "Debris detected on track. Signal automated red drop.",
            minute: 600,
          },
        },
      ],
      telemetrySnapshots: [
        {
          minute: 550,
          tOffsetMs: 0,
          distanceKm: 240,
          speedKmph: 90,
          latitude: 17.53,
          longitude: 73.51,
          state: "running",
          delayMinutes: 0,
          currentStopIndex: 3,
          nextStopIndex: 4,
          currentStationCode: "CHI",
          nextStationCode: "RN",
          statusMessage: "En route to Ratnagiri.",
        },
        {
          minute: 600,
          tOffsetMs: 20000,
          distanceKm: 285,
          speedKmph: 0,
          latitude: 17.25,
          longitude: 73.4,
          state: "blocked",
          delayMinutes: 45,
          currentStopIndex: 3,
          nextStopIndex: 4,
          currentStationCode: null,
          nextStationCode: "RN",
          statusMessage: "BLOCKED: Monsoon Landslide & Boulder Fall.",
        },
      ],
      createdAt: "2026-10-15T12:00:00Z",
    },
    {
      id: "preset-run-fog-karnataka",
      name: "Karnataka Express Dense Fog Restriction (AGC—MTJ)",
      createdBy: "North Central Controller",
      trainNumber: "12627",
      trainName: "Karnataka Exp",
      startMinute: 3270,
      endMinute: 3515,
      seed: 99,
      metadata: {
        description: "Dense winter fog between Agra Cantt and Mathura Jn. Speed capped at 30 km/h.",
        trainType: "Express",
        savedAt: "2026-10-15T12:00:00Z",
      },
      obstacles: [
        {
          id: "obs-fog-agc-mtj",
          type: "fog_restriction",
          title: "Dense Northern Fog Advisory",
          description: "Visibility under 50m. IR safety protocol enforces 30 km/h speed limit.",
          locationType: "segment",
          fromStationCode: "AGC",
          toStationCode: "MTJ",
          startMinute: 3300,
          durationMinutes: 90,
          uncertaintyMinutes: 30,
          effect: "speed_restriction",
          speedCapKmph: 30,
        },
      ],
      events: [
        {
          tOffsetMs: 0,
          kind: "departure",
          payload: {
            title: "Departed Agra Cantt (AGC)",
            detail: "Entering Northern Railway fog caution corridor.",
            minute: 3285,
          },
        },
        {
          tOffsetMs: 10000,
          kind: "speed_change",
          payload: {
            title: "Speed Restricted: 30 km/h",
            detail: "Fog pilot signals active. Cruise speed capped.",
            minute: 3300,
          },
        },
      ],
      telemetrySnapshots: [
        {
          minute: 3285,
          tOffsetMs: 0,
          distanceKm: 2177,
          speedKmph: 80,
          latitude: 27.15,
          longitude: 77.99,
          state: "running",
          delayMinutes: 0,
          currentStopIndex: 30,
          nextStopIndex: 31,
          currentStationCode: "AGC",
          nextStationCode: "MTJ",
          statusMessage: "Departed Agra Cantt towards Mathura.",
        },
        {
          minute: 3310,
          tOffsetMs: 15000,
          distanceKm: 2200,
          speedKmph: 30,
          latitude: 27.35,
          longitude: 77.85,
          state: "braking",
          delayMinutes: 35,
          currentStopIndex: 30,
          nextStopIndex: 31,
          currentStationCode: null,
          nextStationCode: "MTJ",
          statusMessage: "Braking / Caution: Fog restriction active (30 km/h cap).",
        },
      ],
      createdAt: "2026-10-15T12:00:00Z",
    },
  ];
}

/**
 * Retrieve a specific scenario run by ID from snapshot presets
 */
export function getSnapshotScenarioById(id: string): SimScenarioRun | null {
  const presets = getSnapshotPresetScenarios();
  return presets.find((p) => p.id === id) || null;
}
