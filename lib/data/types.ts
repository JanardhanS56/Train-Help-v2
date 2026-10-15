/**
 * lib/data/types.ts
 * Type definitions for railway data models and repository interface.
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

export interface TrainRepository {
  searchTrains(query: string, limit?: number): Promise<TrainSearchResult[]>;
  getTrainWithStops(trainNumber: string): Promise<TrainWithStops | null>;
  getStation(code: string): Promise<DbStation | null>;
  getAllStations(): Promise<DbStation[]>;
  getRailLinks(): Promise<DbRailLink[]>;
  getTrainsBetween(fromCode: string, toCode: string): Promise<TrainsBetweenResult[]>;
  isOffline(): boolean;
}
