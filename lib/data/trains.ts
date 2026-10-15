/**
 * lib/data/trains.ts
 * Supabase Data Access for Trains, Stops, Rail Links and Routes.
 */

import { getSupabaseClient } from "./supabase-client";
import type {
  DbTrain,
  DbTrainStop,
  DbRailLink,
  TrainWithStops,
  TrainSearchResult,
  TrainsBetweenResult,
} from "./types";

export async function getAllTrains(limit = 100): Promise<DbTrain[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("trains")
    .select("*")
    .order("train_number", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch trains:", error.message);
    return [];
  }

  return (data || []) as DbTrain[];
}

export async function getTrainByNumber(trainNumber: string): Promise<TrainWithStops | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: train, error: trainErr } = await supabase
    .from("trains")
    .select("*")
    .eq("train_number", trainNumber.trim())
    .maybeSingle();

  if (trainErr || !train) {
    return null;
  }

  const { data: stops, error: stopsErr } = await supabase
    .from("train_stops")
    .select("train_number, seq, station_code, station_name, arrival_min, departure_min, arrival_formatted, departure_formatted, day_offset, distance_km, halt_min, time_source, stations(latitude, longitude)")
    .eq("train_number", trainNumber.trim())
    .order("seq", { ascending: true });

  if (stopsErr) {
    console.error(`Failed to fetch stops for train ${trainNumber}:`, stopsErr.message);
    return {
      ...(train as DbTrain),
      stops: [],
    };
  }

  interface RawStopWithCoords {
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
    stations?: { latitude: number; longitude: number } | null;
  }

  const enrichedStops: DbTrainStop[] = (stops as unknown as RawStopWithCoords[] || []).map((s) => ({
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
    latitude: s.stations?.latitude,
    longitude: s.stations?.longitude,
  }));

  return {
    ...(train as DbTrain),
    stops: enrichedStops,
  };
}

export async function searchTrains(query: string, limit = 20): Promise<TrainSearchResult[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const q = query.trim().toUpperCase();
  if (!q) return [];

  const { data, error } = await supabase
    .from("trains")
    .select("train_number, train_name, train_type, origin_station_code, destination_station_code, origin_name, destination_name, days_running, total_distance_km, total_duration_min, stops_count")
    .or(`train_number.ilike.%${q}%,train_name.ilike.%${q}%,origin_station_code.ilike.%${q}%,destination_station_code.ilike.%${q}%`)
    .order("train_name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to search trains:", error.message);
    return [];
  }

  return (data || []) as TrainSearchResult[];
}

export async function getRailLinks(): Promise<DbRailLink[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("rail_links")
    .select("station_a, station_b, distance_km, typical_duration_min, traversals")
    .order("traversals", { ascending: false });

  if (error) {
    console.error("Failed to fetch rail links:", error.message);
    return [];
  }

  return (data || []) as DbRailLink[];
}

export async function getTrainsBetween(fromCode: string, toCode: string): Promise<TrainsBetweenResult[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("trains_between", {
    p_from: fromCode.toUpperCase(),
    p_to: toCode.toUpperCase(),
  });

  if (error) {
    console.error(`Failed to find trains between ${fromCode} and ${toCode}:`, error.message);
    return [];
  }

  return (data || []) as TrainsBetweenResult[];
}
