/**
 * lib/data/train-repository.ts
 * Unified Railway Data Repository with Supabase primary and verified offline snapshot fallback.
 */

import { getSupabaseClient } from "./supabase-client";
import {
  getAllStations as fetchAllStations,
  getStationByCode as fetchStationByCode,
  searchStations as fetchSearchStations,
} from "./stations";
import {
  getTrainByNumber as fetchTrainByNumber,
  searchTrains as fetchSearchTrains,
  getRailLinks as fetchRailLinks,
  getTrainsBetween as fetchTrainsBetween,
} from "./trains";
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
    if (supabase && !this.fallbackActive) {
      try {
        const results = await fetchSearchTrains(query, limit);
        if (results && results.length > 0) {
          return results;
        }
      } catch (err) {
        console.warn("Supabase searchTrains failed, activating fallback:", err);
        this.fallbackActive = true;
      }
    }

    const q = query.trim().toUpperCase();
    const allFallback = fallbackSnapshot.trains as DbTrain[];
    const filtered = allFallback.filter((t) => {
      if (!q) return true;
      return (
        t.train_number.includes(q) ||
        t.train_name.toUpperCase().includes(q) ||
        t.origin_station_code.toUpperCase().includes(q) ||
        t.destination_station_code.toUpperCase().includes(q) ||
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
    const tno = trainNumber.trim();
    if (!tno) return null;

    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const train = await fetchTrainByNumber(tno);
        if (train && train.stops && train.stops.length > 0) {
          return train;
        }
      } catch (err) {
        console.warn(`Supabase getTrainWithStops(${tno}) error, activating fallback:`, err);
        this.fallbackActive = true;
      }
    }

    const normalized = tno.replace(/^0+/, "");
    const allTrains = fallbackSnapshot.trains as DbTrain[];
    const train = allTrains.find(
      (t) => t.train_number === tno || t.train_number.replace(/^0+/, "") === normalized
    );

    if (!train) return null;

    const trainNum = train.train_number;
    const allStops = fallbackSnapshot.stops as unknown as DbTrainStop[];
    const stops = allStops
      .filter((s) => s.train_number === trainNum)
      .sort((a, b) => a.seq - b.seq);

    const enrichedStops: DbTrainStop[] = stops.map((stop) => {
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
        const st = await fetchStationByCode(c);
        if (st) {
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
    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const stations = await fetchAllStations(1000);
        if (stations && stations.length > 0) {
          for (const s of stations) {
            this.stationsCache.set(s.code, s);
          }
          return stations;
        }
      } catch {
        this.fallbackActive = true;
      }
    }

    return Array.from(this.stationsCache.values());
  }

  async searchStations(query: string, limit = 20): Promise<DbStation[]> {
    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const stations = await fetchSearchStations(query, limit);
        if (stations && stations.length > 0) return stations;
      } catch {
        this.fallbackActive = true;
      }
    }

    const q = query.trim().toUpperCase();
    const allStations = Array.from(this.stationsCache.values());
    const filtered = allStations.filter((s) => {
      if (!q) return true;
      return (
        s.code.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.state.toUpperCase().includes(q)
      );
    });

    return filtered.slice(0, limit);
  }

  async getRailLinks(): Promise<DbRailLink[]> {
    if (this.railLinksCache) {
      return this.railLinksCache;
    }

    const supabase = getSupabaseClient();
    if (supabase && !this.fallbackActive) {
      try {
        const links = await fetchRailLinks();
        if (links && links.length > 0) {
          this.railLinksCache = links;
          return links;
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
        const results = await fetchTrainsBetween(f, t);
        if (results && results.length > 0) {
          return results;
        }
      } catch {
        this.fallbackActive = true;
      }
    }

    const results: TrainsBetweenResult[] = [];
    const allTrains = fallbackSnapshot.trains as DbTrain[];
    const allStops = fallbackSnapshot.stops as unknown as DbTrainStop[];

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
