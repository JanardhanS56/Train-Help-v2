/**
 * lib/data/stations.ts
 * Supabase Data Access for Railway Stations.
 */

import { getSupabaseClient } from "./supabase-client";
import type { DbStation } from "./types";

export async function getAllStations(limit = 1000): Promise<DbStation[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stations")
    .select("code, name, state, zone, latitude, longitude, is_junction, route_count, facilities, platforms, accessibility")
    .order("route_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch stations from Supabase:", error.message);
    return [];
  }

  return (data || []) as DbStation[];
}

export async function getStationByCode(code: string): Promise<DbStation | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("stations")
    .select("code, name, state, zone, latitude, longitude, is_junction, route_count, facilities, platforms, accessibility")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error(`Failed to fetch station ${code}:`, error.message);
    return null;
  }

  return (data as DbStation) || null;
}

export async function searchStations(query: string, limit = 20): Promise<DbStation[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const q = query.trim().toUpperCase();
  if (!q) return [];

  const { data, error } = await supabase
    .from("stations")
    .select("code, name, state, zone, latitude, longitude, is_junction, route_count, facilities, platforms, accessibility")
    .or(`code.ilike.%${q}%,name.ilike.%${q}%`)
    .order("route_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Failed to search stations with query "${query}":`, error.message);
    return [];
  }

  return (data || []) as DbStation[];
}
