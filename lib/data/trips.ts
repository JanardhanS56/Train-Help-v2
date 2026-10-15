/**
 * lib/data/trips.ts
 * Supabase Data Access for Passenger Trips and Bookings.
 */

import { getSupabaseClient } from "./supabase-client";
import type { DbTrip } from "./types";

export async function getAllTrips(passengerId?: string): Promise<DbTrip[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("trips")
    .select("id, schedule_id, passenger_id, passenger_name, train_number, from_station_code, to_station_code, status, pnr, seat_info, departure_time, arrival_time, disruption_id, booked_at, created_at")
    .order("departure_time", { ascending: true });

  if (passengerId) {
    query = query.eq("passenger_id", passengerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch trips:", error.message);
    return [];
  }

  return (data || []) as DbTrip[];
}

export async function getTripById(id: string): Promise<DbTrip | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("trips")
    .select("id, schedule_id, passenger_id, passenger_name, train_number, from_station_code, to_station_code, status, pnr, seat_info, departure_time, arrival_time, disruption_id, booked_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Failed to fetch trip ${id}:`, error.message);
    return null;
  }

  return (data as DbTrip) || null;
}

export async function createTrip(
  trip: Omit<DbTrip, "id" | "created_at">
): Promise<DbTrip | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("trips")
    .insert([trip])
    .select()
    .single();

  if (error) {
    console.error("Failed to create trip:", error.message);
    return null;
  }

  return data as DbTrip;
}

export async function updateTripStatus(
  id: string,
  status: DbTrip["status"],
  disruptionId?: string | null
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const updates: Record<string, unknown> = { status };
  if (disruptionId !== undefined) {
    updates.disruption_id = disruptionId;
  }

  const { error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error(`Failed to update trip ${id} status:`, error.message);
    return false;
  }

  return true;
}
