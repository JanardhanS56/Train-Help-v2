/**
 * lib/sim/obstacles.ts
 * Real-world Indian Railways obstacle scenarios and obstacle factory.
 */

import type { Obstacle, ObstacleType } from "./types";

export interface ObstaclePreset {
  id: string;
  name: string;
  corridor: string;
  obstacle: Obstacle;
}

export const OBSTACLE_PRESETS: ObstaclePreset[] = [
  {
    id: "preset-1click-demo",
    name: "Flagship 1-Click Demo: Rajdhani OHE Breakdown",
    corridor: "Itarsi—Bhopal Mainline Corridor (ET—BPL)",
    obstacle: {
      id: "obs-1click-ohe-bpl-et",
      type: "ohe_failure",
      title: "High-Tension Traction Wire De-energized",
      description: "Panto entanglement severed 25kV traction line between Itarsi and Bhopal. Electric rakes held; diesel relief locomotive dispatched.",
      locationType: "segment",
      fromStationCode: "ET",
      toStationCode: "BPL",
      startMinute: 1215, // 20:15
      durationMinutes: 60,
      uncertaintyMinutes: 15,
      effect: "full_block",
    },
  },
  {
    id: "preset-konkan-landslide",
    name: "Konkan Ghat Landslide",
    corridor: "Konkan Railway (CHI—RN)",
    obstacle: {
      id: "obs-landslide-chi-rn",
      type: "track_blockage",
      title: "Monsoon Landslide & Boulder Fall",
      description: "Mudslide and heavy debris on track between Chiplun and Ratnagiri ghat section. Track clearing team dispatched.",
      locationType: "segment",
      fromStationCode: "CHI",
      toStationCode: "RN",
      startMinute: 600, // 10:00 AM
      durationMinutes: 90,
      uncertaintyMinutes: 20,
      effect: "full_block",
    },
  },
  {
    id: "preset-fog-kanpur",
    name: "Dense Northern Fog Restriction",
    corridor: "Northern Trunk Corridor (AGC—MTJ)",
    obstacle: {
      id: "obs-fog-agc-mtj",
      type: "fog_restriction",
      title: "Severe Winter Fog Advisory",
      description: "Visibility under 50m. IR safety protocol enforces 30 km/h speed limit and detonator fuse warnings.",
      locationType: "segment",
      fromStationCode: "AGC",
      toStationCode: "MTJ",
      startMinute: 3300,
      durationMinutes: 90,
      uncertaintyMinutes: 30,
      effect: "speed_restriction",
      speedCapKmph: 30,
    },
  },
  {
    id: "preset-ohe-bhopal",
    name: "Overhead OHE Cable Snap",
    corridor: "Bhopal—Itarsi Mainline (ET—BPL)",
    obstacle: {
      id: "obs-ohe-bpl-et",
      type: "ohe_failure",
      title: "High-Tension Traction Wire De-energized",
      description: "Panto entanglement severed 25kV traction line. Electric rakes held; diesel breakdown locomotive en route.",
      locationType: "segment",
      fromStationCode: "ET",
      toStationCode: "BPL",
      startMinute: 1215, // 20:15
      durationMinutes: 60,
      uncertaintyMinutes: 15,
      effect: "full_block",
    },
  },
  {
    id: "preset-goods-train-nagpur",
    name: "Disabled Goods Rake Ahead",
    corridor: "Nagpur—Balharshah (NGP—BPQ)",
    obstacle: {
      id: "obs-goods-ngp-bpq",
      type: "disabled_train",
      title: "Freight Wagon Coupler Parting",
      description: "Loaded coal rake stalled across down-line block section. Relief engine attached from Majri Jn.",
      locationType: "segment",
      fromStationCode: "NGP",
      toStationCode: "BPQ",
      startMinute: 900, // 15:00 PM
      durationMinutes: 75,
      uncertaintyMinutes: 25,
      effect: "full_block",
    },
  },
  {
    id: "preset-signal-guntakal",
    name: "Route Relay Interlocking Failure",
    corridor: "Guntakal Junction (GTL)",
    obstacle: {
      id: "obs-signal-gtl",
      type: "signal_failure",
      title: "RRI Point Defect at Guntakal Outer",
      description: "Signal points clamped manually by station master. All departing trains restricted to 15 km/h pilot paper authority.",
      locationType: "station",
      stationCode: "GTL",
      startMinute: 480, // 08:00 AM
      durationMinutes: 45,
      uncertaintyMinutes: 10,
      effect: "station_dwell",
    },
  },
];

export function createObstacle(params: {
  type: ObstacleType;
  title: string;
  description: string;
  locationType: "station" | "segment";
  stationCode?: string;
  fromStationCode?: string;
  toStationCode?: string;
  startMinute: number;
  durationMinutes: number;
  uncertaintyMinutes?: number;
  effect?: "full_block" | "speed_restriction" | "station_dwell";
  speedCapKmph?: number;
}): Obstacle {
  return {
    id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: params.type,
    title: params.title,
    description: params.description,
    locationType: params.locationType,
    stationCode: params.stationCode,
    fromStationCode: params.fromStationCode,
    toStationCode: params.toStationCode,
    startMinute: params.startMinute,
    durationMinutes: params.durationMinutes,
    uncertaintyMinutes: params.uncertaintyMinutes ?? 15,
    effect: params.effect ?? (params.type === "fog_restriction" ? "speed_restriction" : "full_block"),
    speedCapKmph: params.speedCapKmph ?? (params.type === "fog_restriction" ? 30 : undefined),
  };
}
