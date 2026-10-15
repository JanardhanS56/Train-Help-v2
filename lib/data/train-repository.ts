/**
 * lib/data/train-repository.ts
 * Pure Supabase Railway Data Repository.
 * All runtime queries are executed against the live Supabase database.
 */

import { getSupabaseClient } from "./supabase-client";
import {
  getAllStations as fetchAllStations,
  getStationByCode as fetchStationByCode,
} from "./stations";
import {
  getTrainByNumber as fetchTrainByNumber,
  searchTrains as fetchSearchTrains,
  getRailLinks as fetchRailLinks,
  getTrainsBetween as fetchTrainsBetween,
} from "./trains";
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
    return fetchSearchTrains(query, limit);
  }

  async getTrainWithStops(trainNumber: string): Promise<TrainWithStops | null> {
    return fetchTrainByNumber(trainNumber);
  }

  async getStation(code: string): Promise<DbStation | null> {
    return fetchStationByCode(code);
  }

  async getAllStations(): Promise<DbStation[]> {
    return fetchAllStations(1000);
  }

  async getRailLinks(): Promise<DbRailLink[]> {
    return fetchRailLinks();
  }

  async getTrainsBetween(fromCode: string, toCode: string): Promise<TrainsBetweenResult[]> {
    return fetchTrainsBetween(fromCode, toCode);
  }
}

export const trainRepository = new SupabaseTrainRepository();
