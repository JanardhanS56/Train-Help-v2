import dns from "node:dns/promises";
import postgres from "postgres";
import type { DbStation } from "./types";

let sqlPromise: Promise<ReturnType<typeof postgres> | null> | null = null;

async function getSql() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) return null;
  sqlPromise ??= (async () => {
    const parsed = new URL(url);
    const servername = parsed.hostname;
    const { address } = await dns.lookup(servername, { family: 4 });
    parsed.hostname = address;
    return postgres(parsed.toString(), {
      max: 2,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: { rejectUnauthorized: false, servername },
    });
  })();
  return sqlPromise;
}

export async function searchStationsDirect(query: string, limit: number): Promise<DbStation[]> {
  const client = await getSql();
  if (!client) return [];
  const q = query.trim();
  const rows = q
    ? await client<DbStation[]>`
        select code, name, state, zone, latitude, longitude, is_junction, route_count
        from public.stations
        where code ilike ${"%" + q + "%"}
           or name ilike ${"%" + q + "%"}
           or state ilike ${"%" + q + "%"}
        order by route_count desc nulls last
        limit ${limit}
      `
    : await client<DbStation[]>`
        select code, name, state, zone, latitude, longitude, is_junction, route_count
        from public.stations
        order by route_count desc nulls last
        limit ${limit}
      `;
  return rows;
}
