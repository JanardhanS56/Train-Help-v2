/**
 * lib/data/schedules.ts
 * Supabase Data Access for Train Schedules.
 */

import { getSupabaseClient } from "./supabase-client";
import type { DbSchedule } from "./types";

export async function getAllSchedules(routeId?: string): Promise<DbSchedule[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("schedules")
    .select("id, route_id, train_number, departure_time, arrival_time, days_of_week, platform, created_at")
    .order("departure_time", { ascending: true });

  if (routeId) {
    query = query.eq("route_id", routeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch schedules:", error.message);
    return [];
  }

  return (data || []) as DbSchedule[];
}

export async function getScheduleByTrainNumber(trainNumber: string): Promise<DbSchedule | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("schedules")
    .select("id, route_id, train_number, departure_time, arrival_time, days_of_week, platform, created_at")
    .eq("train_number", trainNumber)
    .maybeSingle();

  if (error) {
    console.error(`Failed to fetch schedule for train ${trainNumber}:`, error.message);
    return null;
  }

  return (data as DbSchedule) || null;
}

export async function createSchedule(
  schedule: Omit<DbSchedule, "id" | "created_at">
): Promise<DbSchedule | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("schedules")
    .insert([schedule])
    .select()
    .single();

  if (error) {
    console.error("Failed to create schedule:", error.message);
    return null;
  }

  return data as DbSchedule;
}
