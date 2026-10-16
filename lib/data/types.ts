/**
 * lib/data/types.ts
 * Type definitions for railway data models and Supabase data layer.
 */

export interface DbStation {
  code: string;
  name: string;
  state: string;
  zone: string;
  latitude: number;
  longitude: number;
  is_junction: boolean;
  route_count: number;
  facilities?: string[];
  platforms?: number;
  accessibility?: Record<string, boolean>;
}

export interface DbTrain {
  train_number: string;
  train_name: string;
  train_type: string;
  railway_zone: string;
  origin_station_code: string;
  destination_station_code: string;
  origin_name: string;
  destination_name: string;
  days_running: string[];
  total_distance_km: number;
  total_duration_min: number;
  stops_count: number;
  has_official_timing: boolean;
  capacity?: number;
  amenities?: Record<string, boolean>;
}

export interface DbTrainStop {
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
  latitude?: number;
  longitude?: number;
}

export interface DbRailLink {
  station_a: string;
  station_b: string;
  distance_km: number;
  typical_duration_min: number;
  traversals: number;
}

export interface TrainWithStops extends DbTrain {
  stops: DbTrainStop[];
}

export interface TrainSearchResult {
  train_number: string;
  train_name: string;
  train_type: string;
  origin_station_code: string;
  destination_station_code: string;
  origin_name: string;
  destination_name: string;
  days_running: string[];
  total_distance_km: number;
  total_duration_min: number;
  stops_count: number;
}

export type TrainSummary = TrainSearchResult;

export interface TrainsBetweenResult {
  train_number: string;
  train_name: string;
  train_type: string;
  from_seq: number;
  to_seq: number;
  departure_min: number;
  arrival_min: number;
  departure_formatted: string;
  arrival_formatted: string;
  duration_min: number;
}

export interface DbRoute {
  id: string;
  name: string;
  from_station: string;
  to_station: string;
  distance_km: number;
  avg_duration_min: number;
  created_at?: string;
}

export interface DbSchedule {
  id: string;
  route_id?: string | null;
  train_number: string;
  departure_time: string;
  arrival_time: string;
  days_of_week: number[];
  platform: string;
  created_at?: string;
}

export interface DbDisruption {
  id: string;
  trip_id?: string | null;
  route_id?: string | null;
  station_code?: string | null;
  type: string;
  severity: "LOW" | "MODERATE" | "CRITICAL" | "FATAL";
  description: string;
  started_at: string;
  resolved_at?: string | null;
  source: "sim" | "manual" | "external";
  created_at?: string;
}

export interface DbTrip {
  id: string;
  schedule_id?: string | null;
  passenger_id: string;
  passenger_name: string;
  train_number: string;
  from_station_code: string;
  to_station_code: string;
  status: "CONFIRMED" | "DELAYED" | "CANCELLED" | "REBOOKED" | "COMPLETED";
  pnr?: string | null;
  seat_info: {
    coach: string;
    berth: string;
    class: string;
  };
  departure_time: string;
  arrival_time: string;
  disruption_id?: string | null;
  booked_at?: string;
  created_at?: string;
}

export interface DbSimScenario {
  id: string;
  name: string;
  created_by: string;
  route_id?: string | null;
  train_number?: string | null;
  initial_state: Record<string, unknown>;
  obstacles: unknown[];
  created_at?: string;
}

export interface DbSimEvent {
  id: string;
  scenario_id: string;
  t_offset_ms: number;
  kind: string;
  payload: Record<string, unknown>;
  created_at?: string;
}

export interface DbAdvisory {
  id: string;
  scenario_id: string;
  recommended_action: Record<string, unknown>;
  rationale: string;
  created_at?: string;
}

export interface TrainRepository {
  searchTrains(query: string, limit?: number): Promise<TrainSearchResult[]>;
  getTrainWithStops(trainNumber: string): Promise<TrainWithStops | null>;
  getStation(code: string): Promise<DbStation | null>;
  getAllStations(): Promise<DbStation[]>;
  searchStations(query: string, limit?: number): Promise<DbStation[]>;
  getRailLinks(): Promise<DbRailLink[]>;
  getTrainsBetween(fromCode: string, toCode: string): Promise<TrainsBetweenResult[]>;
  isOffline(): boolean;
}
