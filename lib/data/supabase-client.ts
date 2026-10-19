/**
 * lib/data/supabase-client.ts
 * Supabase client factory for server-side and API route queries.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

const PLACEHOLDER_PATTERNS = [
  /YOUR[-_]PROJECT[-_]REF/i,
  /YOUR[-_]PASSWORD/i,
  /YOUR[-_]ANON[-_]KEY/i,
  /YOUR[-_]SERVICE[-_]ROLE[-_]KEY/i,
  /YOUR[-_]API[-_]KEY/i,
  /your[-_]project/i,
  /your[-_]anon/i,
  /your[-_]service/i,
  /<[^>]+>/,
  /\[[^\]]+\]/,
  /placeholder/i,
  /changeme/i,
  /dummy/i,
  /example/i,
];

export function isPlaceholder(val: string | undefined | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (trimmed === "") return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey || isPlaceholder(url) || isPlaceholder(anonKey)) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }

  return clientInstance;
}

export function isTableMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string };
  const msg = err.message || "";
  const code = err.code || "";
  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("schema cache") ||
    msg.includes("Could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}
