/**
 * lib/data/train-repository.ts
 * Unified Railway Data Repository with Supabase primary and verified offline snapshot fallback.
 */

import { getSupabaseClient } from "./supabase-client";
import type {
  DbStation,
  DbTrain,
  DbTrainStop,
  DbRailLink,
  TrainWithStops,
  TrainSearchResult,
  TrainsBetweenResult,
  TrainRepository,
} from "./types";
import fallbackSnapshot from "@/data/clean/sim-snapshot.json";

class HybridTrainRepository implements TrainRepository {
  private fallbackActive = false;
  private stationsCache: Map<string, DbStation> = new Map();
  private railLinksCache: DbRailLink[] | null = null;

  constructor() {
    // Populate fallback stations cache
    interface RawSnapshotStation {
      code: string;
      name: string;
      state: string;
      zone: string;
      lat: number;
      lng: number;
      is_junction: boolean;
      route_count: number;
    }

    const rawStations = fallbackSnapshot.stations as unknown as RawSnapshotStation[];
    for (const s of rawStations) {
      const station: DbStation = {
        code: s.code,
        name: s.name,
        state: s.state,
        zone: s.zone,
        latitude: s.lat,
        longitude: s.lng,
        is_junction: s.is_junction,
        route_count: s.route_count,
      };
      this.stationsCache.set(s.code, station);
    }
  }

  isOffline(): boolean {
    return this.fallbackActive || !getSupabaseClient();
  }

  async searchTrains(query: string, limit = 20): Promise<TrainSearchResult[]> {
    const supabase = getSupabaseClient();
    const q = query.trim().toUpperCase();

    if (supabase && !this.fallbackActive) {
      try {
        let dbQuery = supabase
          .from("trains")
          .select(
            "train_number, train_name, train_type, origin_station_code, destination_station_code, origin_name, destination_name, days_running, total_distance_km, total_duration_min, stops_count"
          )
          .limit(limit);

        if (/^\d+$/.test(q)) {
          dbQuery = dbQuery.like("train_number", `${q}%`);
        } else if (q.length > 0) {
          dbQuery = dbQuery.ilike("train_name", `%${q}%`);
        }

        const { data, error } = await dbQuery;
        if (!error && data) {
          return data as TrainSearchResult[];
        }
        console.warn("Supabase searchTrains failed, using fallback snapshot:", error?.message);
        this.fallbackActive = true;
      } catch (err) {
        console.warn("Supabase network error, activating fallback:", err);
        this.fallbackActive = true;
      }
    }

    // Fallback search
    const allFallback = fallbackSnapshot.trains as DbTrain[];
    const filtered = allFallback.filter((t) => {
      if (!q) return true;
      return (
        t.train_number.includes(q) ||
        t.train_name.toUpperCase().includes(q) ||
        t.origin_name.toUpperCase().includes(q) ||
        t.destination_name.toUpperCase().includes(q)
      );
    });

    return filtered.slice(0, limit).map((t) => ({
      train_number: t.train_number,
      train_name: t.train_name,
      train_type: t.train_type,
      origin_station_code: t.origin_station_code,
      destination_station_code: t.destination_station_code,
      origin_name: t.origin_name,
      destination_name: t.destination_name,
      days_running: t.days_running,
      total_distance_km: t.total_distance_km,
      total_duration_min: t.total_duration_min,
      stops_count: t.stops_count,
    }));
  }

  async getTrainWithStops(trainNumber: string): Promise<TrainWithStops | null> {
    const supabase = getSupabaseClient();
    const tno = trainNumber.trim().padStart(5, "0");

    if (supabase && !this.fallbackActive) {
      try {
        // Fetch train
        const { data: train, error: tErr } = await supabase
          .from("trains")
          .select("*")
          .eq("train_number", tno)
          .single();

        if (tErr || !train) {
          console.warn(`Train ${tno} not found in Supabase or error:`, tErr?.message);
        } else {
          // Fetch stops
          const { data: stops, error: sErr } = await supabase
            .from("train_stops")
            .select("*")
            .eq("train_number", tno)
            .order("seq", { ascending: true });

          if (!sErr && stops) {
            // Attach station coordinates
            const allStations = await this.getAllStations();
            const stationMap = new Map(allStations.map((s) => [s.code, s]));

            const enrichedStops: DbTrainStop[] = (stops as DbTrainStop[]).map((stop) => {
              const st = stationMap.get(stop.station_code);
              return {
                ...stop,
                latitude: st?.latitude ?? 0,
                longitude: st?.longitude ?? 0,
              };
            });

            return {
              ...(train as DbTrain),
              stops: enrichedStops,
            };
          }
        }
      } catch (err) {
        console.warn("Supabase query error in getTrainWithStops:", err);
        this.fallbackActive = true;
      }
    }

    // Fallback logic
    const train = (fallbackSnapshot.trains as DbTrain[]).find((t) => t.train_number === tno);
    if (!train) return null;

    const stops = (fallbackSnapshot.stops as DbTrainStop[])
      .filter((s) => s.train_number === tno)
      .sort((a, b) => a.seq - b.seq);

    const enrichedStops = stops.map((stop) => {
      const st = this.stationsCache.get(stop.station_code);
      return {
        ...stop,
        latitude: st?.latitude ?? 0,
        longitude: st?.longitude ?? 0,
      };
    });

    return {
      ...train,
      stops: enrichedStops,
    };
  }

  async getStation(code: string): Promise<DbStation | null> {
    const c = code.trim().toUpperCase();
    if (this.stationsCache.has(c)) {
      return this.stationsCache.get(c)!;
    }

    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const { data, error } = await supabase.from("stations").select("*").eq("code", c).single();
        if (!error && data) {
          const st = data as DbStation;
          this.stationsCache.set(c, st);
          return st;
        }
      } catch {
        this.fallbackActive = true;
      }
    }

    return null;
  }

  async getAllStations(): Promise<DbStation[]> {
    if (this.stationsCache.size >= 100) {
      return Array.from(this.stationsCache.values());
    }

    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const { data, error } = await supabase
          .from("stations")
          .select("*")
          .order("route_count", { ascending: false });

        if (!error && data) {
          for (const s of data as DbStation[]) {
            this.stationsCache.set(s.code, s);
          }
          return data as DbStation[];
        }
      } catch {
        this.fallbackActive = true;
      }
    }

    return Array.from(this.stationsCache.values());
  }

  async getRailLinks(): Promise<DbRailLink[]> {
    if (this.railLinksCache) {
      return this.railLinksCache;
    }

    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const { data, error } = await supabase.from("rail_links").select("*");
        if (!error && data) {
          this.railLinksCache = data as DbRailLink[];
          return this.railLinksCache;
        }
      } catch {
        this.fallbackActive = true;
      }
    }

    this.railLinksCache = fallbackSnapshot.rail_links as DbRailLink[];
    return this.railLinksCache;
  }

  async getTrainsBetween(fromCode: string, toCode: string): Promise<TrainsBetweenResult[]> {
    const supabase = getSupabaseClient();
    const f = fromCode.trim().toUpperCase();
    const t = toCode.trim().toUpperCase();

    if (supabase && !this.fallbackActive) {
      try {
        const { data, error } = await supabase.rpc("trains_between", {
          p_from: f,
          p_to: t,
        });
        if (!error && data) {
          return data as TrainsBetweenResult[];
        }
      } catch {
        this.fallbackActive = true;
      }
    }

    // Fallback in-memory search over snapshot
    const results: TrainsBetweenResult[] = [];
    const allTrains = fallbackSnapshot.trains as DbTrain[];
    const allStops = fallbackSnapshot.stops as DbTrainStop[];

    for (const train of allTrains) {
      const trainStops = allStops
        .filter((s) => s.train_number === train.train_number)
        .sort((a, b) => a.seq - b.seq);

      const fromStop = trainStops.find((s) => s.station_code === f);
      const toStop = trainStops.find((s) => s.station_code === t);

      if (fromStop && toStop && fromStop.seq < toStop.seq) {
        const dep = fromStop.departure_min ?? fromStop.arrival_min ?? 0;
        const arr = toStop.arrival_min ?? toStop.departure_min ?? dep;
        results.push({
          train_number: train.train_number,
          train_name: train.train_name,
          train_type: train.train_type,
          from_seq: fromStop.seq,
          to_seq: toStop.seq,
          departure_min: dep,
          arrival_min: arr,
          departure_formatted: fromStop.departure_formatted ?? "",
          arrival_formatted: toStop.arrival_formatted ?? "",
          duration_min: arr - dep,
        });
      }
    }

    return results.sort((a, b) => a.departure_min - b.departure_min);
  }
}

export const trainRepository = new HybridTrainRepository();
