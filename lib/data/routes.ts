/**
 * lib/data/routes.ts
 * Supabase Data Access for Railway Routes.
 */

import { getSupabaseClient, isTableMissing } from "./supabase-client";
import type { DbRoute } from "./types";

export async function getAllRoutes(): Promise<DbRoute[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("routes")
    .select("id, name, from_station, to_station, distance_km, avg_duration_min, created_at")
    .order("name", { ascending: true });

  if (error) {
    if (!isTableMissing(error)) {
      console.error("Failed to fetch routes:", error.message);
    }
    return [];
  }

  return (data || []) as DbRoute[];
}

export async function getRouteById(id: string): Promise<DbRoute | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("routes")
    .select("id, name, from_station, to_station, distance_km, avg_duration_min, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (!isTableMissing(error)) {
      console.error(`Failed to fetch route ${id}:`, error.message);
    }
    return null;
  }

  return (data as DbRoute) || null;
}

export async function createRoute(
  route: Omit<DbRoute, "id" | "created_at">
): Promise<DbRoute | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("routes")
    .insert([route])
    .select()
    .single();

  if (error) {
    if (!isTableMissing(error)) {
      console.error("Failed to create route:", error.message);
    }
    return null;
  }

  return data as DbRoute;
}
