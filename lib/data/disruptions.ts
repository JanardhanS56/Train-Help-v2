/**
 * lib/data/disruptions.ts
 * Supabase Data Access for Network Disruptions and Alerts.
 */

import { getSupabaseClient, isTableMissing } from "./supabase-client";
import type { DbDisruption } from "./types";

export async function getAllDisruptions(activeOnly = false): Promise<DbDisruption[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("disruptions")
    .select("id, trip_id, route_id, station_code, type, severity, description, started_at, resolved_at, source, created_at")
    .order("started_at", { ascending: false });

  if (activeOnly) {
    query = query.is("resolved_at", null);
  }

  const { data, error } = await query;

  if (error) {
    if (!isTableMissing(error)) {
      console.error("Failed to fetch disruptions:", error.message);
    }
    return [];
  }

  return (data || []) as DbDisruption[];
}

export async function getDisruptionById(id: string): Promise<DbDisruption | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("disruptions")
    .select("id, trip_id, route_id, station_code, type, severity, description, started_at, resolved_at, source, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (!isTableMissing(error)) {
      console.error(`Failed to fetch disruption ${id}:`, error.message);
    }
    return null;
  }

  return (data as DbDisruption) || null;
}

export async function createDisruption(
  disruption: Omit<DbDisruption, "id" | "created_at">
): Promise<DbDisruption | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("disruptions")
    .insert([disruption])
    .select()
    .single();

  if (error) {
    if (!isTableMissing(error)) {
      console.error("Failed to create disruption:", error.message);
    }
    return null;
  }

  return data as DbDisruption;
}

export async function resolveDisruption(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("disruptions")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (!isTableMissing(error)) {
      console.error(`Failed to resolve disruption ${id}:`, error.message);
    }
    return false;
  }

  return true;
}
