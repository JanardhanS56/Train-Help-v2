/**
 * lib/data/supabase-client.ts
 * Supabase client factory for server-side and API route queries.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }

  return clientInstance;
}
