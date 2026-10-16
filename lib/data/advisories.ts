/**
 * lib/data/advisories.ts
 * Supabase Data Access for Simulation Events and Dispatcher Advisories.
 */

import { getSupabaseClient } from "./supabase-client";
import type { DbAdvisory } from "./types";

export async function getAdvisories(scenarioId: string): Promise<DbAdvisory[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("advisories")
    .select("id, scenario_id, recommended_action, rationale, created_at")
    .eq("scenario_id", scenarioId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to fetch advisories for scenario ${scenarioId}:`, error.message);
    return [];
  }

  return (data || []) as DbAdvisory[];
}

export async function createAdvisory(
  advisory: Omit<DbAdvisory, "id" | "created_at">
): Promise<DbAdvisory | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("advisories")
    .insert([advisory])
    .select()
    .single();

  if (error) {
    console.error("Failed to create advisory:", error.message);
    return null;
  }

  return data as DbAdvisory;
}
