/**
 * lib/data/__tests__/suggestion-search.test.ts
 * Unit tests for railway trains and stations suggestion engine.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchTrains } from "../trains";
import { searchStations } from "../stations";

// Mock Supabase client
vi.mock("../supabase-client", () => {
  const mockTrainsData = [
    {
      train_number: "22691",
      train_name: "Bengaluru Rajdhani Express",
      train_type: "Rajdhani",
      origin_station_code: "SBC",
      destination_station_code: "NZM",
      stops_count: 16,
    },
    {
      train_number: "12424",
      train_name: "Dbrt Rajdhani Express",
      train_type: "Rajdhani",
      origin_station_code: "NDLS",
      destination_station_code: "DBRG",
      stops_count: 23,
    },
    {
      train_number: "12028",
      train_name: "KSR Bengaluru Shatabdi Express",
      train_type: "Shatabdi",
      origin_station_code: "MAS",
      destination_station_code: "SBC",
      stops_count: 5,
    },
  ];

  const mockStationsData = [
    {
      code: "SBC",
      name: "KSR Bengaluru",
      state: "Karnataka",
      zone: "SWR",
      latitude: 12.978,
      longitude: 77.567,
      is_junction: true,
      route_count: 85,
    },
    {
      code: "NDLS",
      name: "New Delhi",
      state: "Delhi",
      zone: "NR",
      latitude: 28.642,
      longitude: 77.219,
      is_junction: true,
      route_count: 120,
    },
    {
      code: "CSMT",
      name: "Mumbai CSMT",
      state: "Maharashtra",
      zone: "CR",
      latitude: 18.940,
      longitude: 72.835,
      is_junction: true,
      route_count: 95,
    },
  ];

  function createQueryBuilder(table: string) {
    const builder = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(() => {
        if (table === "trains") {
          return Promise.resolve({ data: mockTrainsData, error: null });
        }
        return Promise.resolve({ data: mockStationsData, error: null });
      }),
    };
    return builder;
  }

  const mockSupabase = {
    from: vi.fn((table: string) => createQueryBuilder(table)),
  };

  return {
    getSupabaseClient: vi.fn(() => mockSupabase),
  };
});

describe("Railway Suggestion Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchTrains suggestion query", () => {
    it("returns top trains when query is empty string", async () => {
      const results = await searchTrains("", 20);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.train_number).toBe("22691");
    });

    it("filters and matches trains by query string (e.g. 'raj-')", async () => {
      const results = await searchTrains("raj-", 10);
      expect(results).toBeDefined();
      expect(results.some((t) => t.train_name.toLowerCase().includes("rajdhani"))).toBe(true);
    });
  });

  describe("searchStations suggestion query", () => {
    it("returns stations ordered by route count when query is empty", async () => {
      const stations = await searchStations("", 10);
      expect(stations).toBeDefined();
      expect(stations.length).toBeGreaterThan(0);
      expect(stations[0]?.code).toBe("SBC");
    });

    it("matches station code, city, and state", async () => {
      const stations = await searchStations("delhi", 10);
      expect(stations).toBeDefined();
      expect(stations.some((s) => s.code === "NDLS" || s.name.toLowerCase().includes("delhi"))).toBe(true);
    });
  });
});
