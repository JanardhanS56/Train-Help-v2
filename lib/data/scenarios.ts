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
