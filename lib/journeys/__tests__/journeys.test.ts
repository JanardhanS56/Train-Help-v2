import { describe, it, expect } from "vitest";
import {
  runsOnBoardingDate,
  resolveStopTimes,
  expandNearby,
  estimateFare,
  estimateAvailability,
  classesOffered,
  findDirectJourneys,
  searchJourneys,
} from "../index";
import type { DbTrainStop, TrainWithStops } from "@/lib/data/types";

describe("Journeys Engine - Pure Unit Tests", () => {
  describe("Calendar & Day-Offset Logic", () => {
    it("correctly shifts origin departure date by stop day_offset", () => {
      // Train runs only on Sundays from origin
      const train = { days_running: ["Sun"] };

      // Stop 1 has day_offset 0 (departs origin on Sun)
      const stop0 = { day_offset: 0 };
      // Stop 15 has day_offset 1 (arrives/departs on Mon)
      const stop1 = { day_offset: 1 };

      // 2026-10-18 is Sunday in IST
      const sunday = "2026-10-18";
      // 2026-10-19 is Monday in IST
      const monday = "2026-10-19";

      // Origin departure on Sunday -> passenger boarding at Stop 0 on Sunday: should run!
      expect(runsOnBoardingDate(train, stop0, sunday)).toBe(true);
      // Origin departure on Sunday -> passenger boarding at Stop 0 on Monday: should NOT run!
      expect(runsOnBoardingDate(train, stop0, monday)).toBe(false);

      // Stop 1 is on Day 1 (+1 day). Passenger boarding on Monday: origin was Sunday! So it SHOULD run!
      expect(runsOnBoardingDate(train, stop1, monday)).toBe(true);
      // Passenger at Stop 1 looking on Sunday: origin would have been Saturday! So it should NOT run!
      expect(runsOnBoardingDate(train, stop1, sunday)).toBe(false);
    });

    it("resolves stop times to IST Dates and formats properly", () => {
      const stops: DbTrainStop[] = [
        {
          train_number: "22691",
          seq: 1,
          station_code: "SBC",
          station_name: "BANGALORE CITY JN",
          arrival_min: null,
          departure_min: 360, // 06:00
          arrival_formatted: null,
          departure_formatted: "06:00",
          day_offset: 0,
          distance_km: 0,
          halt_min: 0,
          time_source: "official",
        },
        {
          train_number: "22691",
          seq: 2,
          station_code: "NZM",
          station_name: "DELHI H NIZAMUDDIN",
          arrival_min: 1585, // 02:25 (+1d)
          departure_min: null,
          arrival_formatted: "02:25 (+1d)",
          departure_formatted: null,
          day_offset: 1,
          distance_km: 2371,
          halt_min: 0,
          time_source: "official",
        },
      ];

      const resolved = resolveStopTimes(stops, "2026-10-20");
      expect(resolved).toHaveLength(2);
      expect(resolved[0].departureFormatted).toBe("06:00");
      expect(resolved[0].dayLabel).toBe("");
      expect(resolved[1].arrivalFormatted).toBe("02:25");
      expect(resolved[1].dayLabel).toBe("+1 day");
    });
  });

  describe("Station Expansion & Clusters", () => {
    it("expands primary station to include city hub terminals", () => {
      const sbcCluster = expandNearby("SBC");
      expect(sbcCluster[0]).toBe("SBC");
      expect(sbcCluster).toContain("YPR");
      expect(sbcCluster).toContain("BNC");

      const ndlsCluster = expandNearby("NDLS");
      expect(ndlsCluster[0]).toBe("NDLS");
      expect(ndlsCluster).toContain("NZM");
      expect(ndlsCluster).toContain("DLI");
    });

    it("returns single-element array for non-clustered stations", () => {
      const gtl = expandNearby("GTL");
      expect(gtl).toEqual(["GTL"]);
    });
  });

  describe("Fare & Availability Models", () => {
    it("estimates fare with distance slabs, superfast charge, and GST for AC classes", () => {
      // 3A for 1000 km
      const fare3A = estimateFare(1000, "3A", "Superfast");
      expect(fare3A).toBeGreaterThan(1200);
      expect(fare3A % 5).toBe(0); // IR rule: rounded to nearest 5

      // Sleeper for 1000 km (no GST)
      const fareSL = estimateFare(1000, "SL", "Superfast");
      expect(fareSL).toBeLessThan(fare3A);
      expect(fareSL % 5).toBe(0);

      // Rajdhani catering surcharge included
      const rajdhaniFare = estimateFare(2371, "3A", "Rajdhani");
      const expressFare = estimateFare(2371, "3A", "Express");
      expect(rajdhaniFare).toBeGreaterThan(expressFare);
    });

    it("produces deterministic seat availability with realistic variation", () => {
      const av1 = estimateAvailability("22691", "2026-10-25", "3A");
      const av2 = estimateAvailability("22691", "2026-10-25", "3A");
      expect(av1).toEqual(av2);
      expect(["AVAILABLE", "RAC", "WL"]).toContain(av1.status);
      expect(av1.count).toBeGreaterThan(0);
      expect(av1.source).toBe("Estimated");
    });

    it("derives correct classes offered by train type", () => {
      expect(classesOffered({ train_type: "Rajdhani" }).classes).toEqual(["1A", "2A", "3A", "3E"]);
      expect(classesOffered({ train_type: "Vande Bharat" }).classes).toEqual(["EC", "CC"]);
      expect(classesOffered({ train_type: "Express" }).classes).toContain("SL");
    });
  });

  describe("Route Search Logic & Directionality", () => {
    const mockTrain: TrainWithStops = {
      train_number: "22691",
      train_name: "Bengaluru Rajdhani",
      train_type: "Rajdhani",
      railway_zone: "SWR",
      origin_station_code: "SBC",
      destination_station_code: "NZM",
      origin_name: "Bangalore City",
      destination_name: "Hazrat Nizamuddin",
      days_running: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      total_distance_km: 2371,
      total_duration_min: 2025,
      stops_count: 3,
      has_official_timing: true,
      stops: [
        {
          train_number: "22691",
          seq: 1,
          station_code: "SBC",
          station_name: "BANGALORE CITY JN",
          arrival_min: null,
          departure_min: 360, // 06:00
          arrival_formatted: null,
          departure_formatted: "06:00",
          day_offset: 0,
          distance_km: 0,
          halt_min: 0,
          time_source: "official",
        },
        {
          train_number: "22691",
          seq: 2,
          station_code: "GTL",
          station_name: "GUNTAKAL JN",
          arrival_min: 526, // 08:46
          departure_min: 536,
          arrival_formatted: "08:46",
          departure_formatted: "08:56",
          day_offset: 0,
          distance_km: 316,
          halt_min: 10,
          time_source: "official",
        },
        {
          train_number: "22691",
          seq: 3,
          station_code: "NZM",
          station_name: "DELHI H NIZAMUDDIN",
          arrival_min: 1585,
          departure_min: null,
          arrival_formatted: "02:25 (+1d)",
          departure_formatted: null,
          day_offset: 1,
          distance_km: 2371,
          halt_min: 0,
          time_source: "official",
        },
      ],
    };

    const mockDataset = new Map<string, TrainWithStops>([["22691", mockTrain]]);

    it("returns direct journey when from.seq < to.seq", async () => {
      const results = await findDirectJourneys(
        {
          fromCodes: ["SBC"],
          toCodes: ["NZM"],
          date: "2026-10-25",
        },
        mockDataset
      );

      expect(results).toHaveLength(1);
      expect(results[0].legs[0].trainNumber).toBe("22691");
      expect(results[0].totalDistanceKm).toBe(2371);
      expect(results[0].arrivalDayLabel).toBe("+1 day");
    });

    it("rejects reverse direction where from.seq > to.seq", async () => {
      // NZM -> SBC is reverse direction for train 22691
      const results = await findDirectJourneys(
        {
          fromCodes: ["NZM"],
          toCodes: ["SBC"],
          date: "2026-10-25",
        },
        mockDataset
      );

      expect(results).toHaveLength(0);
    });

    it("rejects stations not served by this train (e.g. NDLS -> LKO)", async () => {
      const results = await findDirectJourneys(
        {
          fromCodes: ["NDLS"],
          toCodes: ["LKO"],
          date: "2026-10-25",
        },
        mockDataset
      );

      expect(results).toHaveLength(0);
    });

    it("filters out past departures when searching for today", async () => {
      // Train departs at 06:00 AM IST (which is before 12:00 PM)
      const results = await findDirectJourneys(
        {
          fromCodes: ["SBC"],
          toCodes: ["NZM"],
          date: "2026-10-25",
          now: new Date("2026-10-25T12:00:00+05:30"),
          bufferMinutes: 15,
        },
        mockDataset
      );

      // In IST, 06:00 is past 12:00
      expect(results).toHaveLength(0);
    });
  });

  describe("Real Clean Data Integration Fixture", () => {
    it("finds real trains for SBC -> MAS in clean dataset", async () => {
      const result = await searchJourneys({
        fromCode: "SBC",
        toCode: "MAS",
        date: "2026-10-28",
        includeNearby: false,
      });

      expect(result.direct.length).toBeGreaterThan(0);
      const train = result.direct[0];
      expect(train.fromStationCode).toBe("SBC");
      expect(train.toStationCode).toBe("MAS");
    });

    it("never returns a Bengaluru train for Delhi -> Lucknow search", async () => {
      const result = await searchJourneys({
        fromCode: "NDLS",
        toCode: "LKO",
        date: "2026-10-28",
        includeNearby: false,
      });

      for (const journey of result.direct) {
        expect(journey.legs[0].trainNumber).not.toBe("22691");
        expect(journey.legs[0].trainNumber).not.toBe("12028"); // Shatabdi SBC->MAS
      }
    });
  });
});
