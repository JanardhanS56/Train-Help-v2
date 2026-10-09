// Sample mock alternatives for Bengaluru → Delhi rail corridor.
// Varied trains, classes, fares, durations, changes, and timeline stops.

import type { Alternative } from "@/lib/types";
import { STATIONS, NEARBY_STATIONS } from "@/lib/constants";
import { relativeDate, durationBetween } from "@/lib/format";

const sbc = STATIONS.SBC;
const ypr = STATIONS.YPR;
const ndls = STATIONS.NDLS;
const nzm = STATIONS.NZM;

export const mockAlternatives: Alternative[] = [
  // 1. Rajdhani Express (Direct, Confirmed 18, arrives 05:55 before 09:00 meeting)
  {
    id: "alt-1",
    tripId: "trip-4",
    trainName: "Bengaluru Rajdhani Express",
    trainNumber: "22691",
    fromStation: sbc,
    toStation: nzm,
    departureTime: relativeDate(0, 20, 0),
    arrivalTime: relativeDate(2, 5, 55),
    dayOffset: "+2 days",
    duration: durationBetween(relativeDate(0, 20, 0), relativeDate(2, 5, 55)),
    changes: 0,
    changeStations: [],
    travelClass: "3A",
    coachBerth: "B3 · Berth 41 (Lower)",
    fare: 2840,
    originalFare: 2450,
    fareDifference: 390,
    availability: { type: "available", count: 18, label: "Available 18" },
    timelineStops: [
      { station: "KSR Bengaluru City", code: "SBC", time: "20:00", platform: "Platform 1", type: "origin" },
      { station: "Secunderabad Junction", code: "SC", time: "07:15 (+1d)", platform: "Platform 10", type: "halt" },
      { station: "Nagpur Junction", code: "NGP", time: "15:20 (+1d)", platform: "Platform 2", type: "halt" },
      { station: "Bhopal Junction", code: "BPL", time: "21:05 (+1d)", platform: "Platform 3", type: "halt" },
      { station: "Hazrat Nizamuddin", code: "NZM", time: "05:55 (+2d)", platform: "Platform 4", type: "destination", dayOffset: "+2 days" },
    ],
  },
  // 2. Karnataka Sampark Kranti (From Yesvantpur nearby, 2A, Confirmed 6)
  {
    id: "alt-2",
    tripId: "trip-4",
    trainName: "Karnataka Sampark Kranti Express",
    trainNumber: "12629",
    fromStation: ypr,
    toStation: nzm,
    departureTime: relativeDate(0, 14, 30),
    arrivalTime: relativeDate(2, 5, 45),
    dayOffset: "+2 days",
    duration: durationBetween(relativeDate(0, 14, 30), relativeDate(2, 5, 45)),
    changes: 0,
    changeStations: [],
    travelClass: "2A",
    coachBerth: "A2 · Berth 18 (Upper)",
    fare: 3410,
    originalFare: 2450,
    fareDifference: 960,
    availability: { type: "available", count: 6, label: "Available 6" },
    nearbyStationSuggestion: NEARBY_STATIONS.Bengaluru[0], // Yesvantpur (25 min from SBC)
    timelineStops: [
      { station: "Yesvantpur Junction", code: "YPR", time: "14:30", platform: "Platform 6", type: "origin" },
      { station: "Dharwad", code: "DWR", time: "22:10", platform: "Platform 1", type: "halt" },
      { station: "Pune Junction", code: "PUNE", time: "09:00 (+1d)", platform: "Platform 3", type: "halt" },
      { station: "Bhopal Junction", code: "BPL", time: "21:40 (+1d)", platform: "Platform 1", type: "halt" },
      { station: "Hazrat Nizamuddin", code: "NZM", time: "05:45 (+2d)", platform: "Platform 6", type: "destination", dayOffset: "+2 days" },
    ],
  },
  // 3. Connecting via Bhopal (1 change, Sleeper, RAC 14)
  {
    id: "alt-3",
    tripId: "trip-4",
    trainName: "Sampark Kranti Connecting",
    trainNumber: "12649",
    fromStation: ypr,
    toStation: ndls,
    departureTime: relativeDate(0, 11, 30),
    arrivalTime: relativeDate(2, 8, 30),
    dayOffset: "+2 days",
    duration: durationBetween(relativeDate(0, 11, 30), relativeDate(2, 8, 30)),
    changes: 1,
    changeStations: ["Bhopal Junction"],
    travelClass: "SL",
    coachBerth: "S4 · RAC 14 (Side Lower)",
    fare: 980,
    originalFare: 2450,
    fareDifference: -1470,
    availability: { type: "rac", count: 14, racNumber: 14, label: "RAC 14" },
    nearbyStationSuggestion: NEARBY_STATIONS.Bengaluru[0],
    timelineStops: [
      { station: "Yesvantpur Junction", code: "YPR", time: "11:30", platform: "Platform 2", type: "origin" },
      { station: "Kacheguda", code: "KCG", time: "23:45", platform: "Platform 1", type: "halt" },
      { station: "Bhopal Junction (Change)", code: "BPL", time: "18:20 (+1d)", platform: "Platform 2", type: "halt" },
      { station: "New Delhi Railway Station", code: "NDLS", time: "08:30 (+2d)", platform: "Platform 3", type: "destination", dayOffset: "+2 days" },
    ],
  },
  // 4. Connecting via Chennai (1 change, 3A, Waitlist 8)
  {
    id: "alt-4",
    tripId: "trip-4",
    trainName: "Tamil Nadu Express Connecting",
    trainNumber: "12621",
    fromStation: sbc,
    toStation: ndls,
    departureTime: relativeDate(0, 15, 0),
    arrivalTime: relativeDate(2, 7, 40),
    dayOffset: "+2 days",
    duration: durationBetween(relativeDate(0, 15, 0), relativeDate(2, 7, 40)),
    changes: 1,
    changeStations: ["Chennai Central"],
    travelClass: "3A",
    coachBerth: "WL 8",
    fare: 2620,
    originalFare: 2450,
    fareDifference: 170,
    availability: { type: "waitlist", count: 8, wlNumber: 8, label: "Waitlist 8" },
    timelineStops: [
      { station: "KSR Bengaluru City", code: "SBC", time: "15:00", platform: "Platform 4", type: "origin" },
      { station: "Puratchi Thalaivar Dr. MGR Central", code: "MAS", time: "21:15", platform: "Platform 7", type: "halt" },
      { station: "Vijayawada Junction", code: "BZA", time: "03:50 (+1d)", platform: "Platform 1", type: "halt" },
      { station: "New Delhi Railway Station", code: "NDLS", time: "07:40 (+2d)", platform: "Platform 8", type: "destination", dayOffset: "+2 days" },
    ],
  },
  // 5. Hazrat Nizamuddin Superfast (Direct, Confirmed 4)
  {
    id: "alt-5",
    tripId: "trip-4",
    trainName: "Hazrat Nizamuddin Superfast",
    trainNumber: "22693",
    fromStation: sbc,
    toStation: nzm,
    departureTime: relativeDate(0, 21, 0),
    arrivalTime: relativeDate(2, 8, 15),
    dayOffset: "+2 days",
    duration: durationBetween(relativeDate(0, 21, 0), relativeDate(2, 8, 15)),
    changes: 0,
    changeStations: [],
    travelClass: "3A",
    coachBerth: "B1 · Berth 29 (Middle)",
    fare: 3150,
    originalFare: 2450,
    fareDifference: 700,
    availability: { type: "available", count: 4, label: "Available 4" },
    timelineStops: [
      { station: "KSR Bengaluru City", code: "SBC", time: "21:00", platform: "Platform 2", type: "origin" },
      { station: "Guntakal Junction", code: "GTL", time: "02:40 (+1d)", platform: "Platform 3", type: "halt" },
      { station: "Nagpur Junction", code: "NGP", time: "16:45 (+1d)", platform: "Platform 1", type: "halt" },
      { station: "Hazrat Nizamuddin", code: "NZM", time: "08:15 (+2d)", platform: "Platform 2", type: "destination", dayOffset: "+2 days" },
    ],
  },
];
