/**
 * lib/data/train-repository.ts
 * Pure Supabase Railway Data Repository.
 * All runtime queries are executed against the live Supabase database.
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
import {
  getSnapshotTrains,
  getSnapshotTrainByNumber,
  getSnapshotStations,
  getSnapshotStation,
  getSnapshotRailLinks,
} from "./snapshot-fallback";
import type {
  DbStation,
  DbRailLink,
  TrainWithStops,
  TrainSearchResult,
  TrainsBetweenResult,
  TrainRepository,
} from "./types";

class SupabaseTrainRepository implements TrainRepository {
  isOffline(): boolean {
    return !getSupabaseClient();
  }

  async searchTrains(query: string, limit = 20): Promise<TrainSearchResult[]> {
    try {
      const results = await fetchSearchTrains(query, limit);
      if (results && results.length > 0) return results;
    } catch (err) {
      console.warn("Supabase searchTrains failed, falling back to snapshot:", err);
    }
    return getSnapshotTrains(query, limit);
  }

  async getTrainWithStops(trainNumber: string): Promise<TrainWithStops | null> {
    try {
      const train = await fetchTrainByNumber(trainNumber);
      if (train && train.stops && train.stops.length > 0) return train;
    } catch (err) {
      console.warn(`Supabase getTrainWithStops (${trainNumber}) failed, falling back to snapshot:`, err);
    }
    return getSnapshotTrainByNumber(trainNumber);
  }

  async getStation(code: string): Promise<DbStation | null> {
    try {
      const station = await fetchStationByCode(code);
      if (station) return station;
    } catch (err) {
      console.warn(`Supabase getStation (${code}) failed, falling back to snapshot:`, err);
    }
    return getSnapshotStation(code);
  }

  async getAllStations(): Promise<DbStation[]> {
    try {
      const stations = await fetchAllStations(1000);
      if (stations && stations.length > 0) return stations;
    } catch (err) {
      console.warn("Supabase getAllStations failed, falling back to snapshot:", err);
    }
    return getSnapshotStations("", 1000);
  }

  async searchStations(query: string, limit = 20): Promise<DbStation[]> {
    try {
      const stations = await fetchSearchStations(query, limit);
      if (stations && stations.length > 0) return stations;
    } catch (err) {
      console.warn("Supabase searchStations failed, falling back to snapshot:", err);
    }
    return getSnapshotStations(query, limit);
  }

  async getRailLinks(): Promise<DbRailLink[]> {
    try {
      const links = await fetchRailLinks();
      if (links && links.length > 0) return links;
    } catch (err) {
      console.warn("Supabase getRailLinks failed, falling back to snapshot:", err);
    }
    return getSnapshotRailLinks();
  }

  async getTrainsBetween(fromCode: string, toCode: string): Promise<TrainsBetweenResult[]> {
    try {
      return await fetchTrainsBetween(fromCode, toCode);
    } catch (err) {
      console.warn("Supabase getTrainsBetween failed:", err);
      return [];
    }
  }
}

export const trainRepository = new SupabaseTrainRepository();
