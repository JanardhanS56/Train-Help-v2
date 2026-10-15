/**
 * lib/data/scenarios.ts
 * Supabase Data Access for Simulation Scenarios and Presets.
 */

import { getSupabaseClient } from "./supabase-client";
import type { DbSimScenario } from "./types";

export async function getAllScenarios(limit = 50): Promise<DbSimScenario[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sim_scenarios")
    .select("id, name, created_by, route_id, train_number, initial_state, obstacles, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch sim scenarios:", error.message);
    return [];
  }

  return (data || []) as DbSimScenario[];
}

export async function getScenarioById(id: string): Promise<DbSimScenario | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sim_scenarios")
    .select("id, name, created_by, route_id, train_number, initial_state, obstacles, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Failed to fetch scenario ${id}:`, error.message);
    return null;
  }

  return (data as DbSimScenario) || null;
}

export async function createScenario(
  scenario: Omit<DbSimScenario, "id" | "created_at">
): Promise<DbSimScenario | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sim_scenarios")
    .insert([scenario])
    .select()
    .single();

  if (error) {
    console.error("Failed to create sim scenario:", error.message);
    return null;
  }

  return data as DbSimScenario;
}

export async function updateScenario(
  id: string,
  updates: Partial<Omit<DbSimScenario, "id" | "created_at">>
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("sim_scenarios")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error(`Failed to update scenario ${id}:`, error.message);
    return false;
  }

  return true;
}

export async function deleteScenario(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("sim_scenarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Failed to delete scenario ${id}:`, error.message);
    return false;
  }

  return true;
}

export async function recordSimEvent(
  event: Omit<import("./types").DbSimEvent, "id" | "created_at">
): Promise<import("./types").DbSimEvent | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sim_events")
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error("Failed to record sim event:", error.message);
    return null;
  }

  return data as import("./types").DbSimEvent;
}

export async function recordSimEvents(
  events: Array<Omit<import("./types").DbSimEvent, "id" | "created_at">>
): Promise<number> {
  if (events.length === 0) return 0;
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from("sim_events")
    .insert(events)
    .select("id");

  if (error) {
    console.error("Failed to batch record sim events:", error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function getSimEvents(
  scenarioId: string
): Promise<import("./types").DbSimEvent[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sim_events")
    .select("id, scenario_id, t_offset_ms, kind, payload, created_at")
    .eq("scenario_id", scenarioId)
    .order("t_offset_ms", { ascending: true });

  if (error) {
    console.error(`Failed to fetch sim events for scenario ${scenarioId}:`, error.message);
    return [];
  }

  return (data || []) as import("./types").DbSimEvent[];
}

