/**
 * lib/sim/types.ts
 * Pure domain types for railway simulation, movement physics, obstacles, and AI planner.
 */

export type TrainRunState =
  | "scheduled"
  | "running"
  | "dwelling"
  | "braking"
  | "blocked"
  | "completed";

export interface SimScheduleStop {
  seq: number;
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  arrivalMin: number;      // Absolute simulation minutes
  departureMin: number;    // Absolute simulation minutes
  haltMin: number;
  distanceKm: number;
  dayOffset: number;
  timeSource: "official" | "derived";
}

export interface SimPosition {
  currentMinute: number;
  state: TrainRunState;
  latitude: number;
  longitude: number;
  distanceKm: number;
  currentSpeedKmph: number;
  maxSpeedKmph: number;
  currentStopIndex: number;
  nextStopIndex: number;
  currentStationCode: string | null;
  nextStationCode: string | null;
  delayMinutes: number;
  activeObstacleId: string | null;
  statusMessage: string;
}

export type ObstacleType =
  | "track_blockage"      // Landslide, flood, boulder on track
  | "signal_failure"      // Automatic signalling failure
  | "ohe_failure"         // Overhead electric cable snap
  | "disabled_train"      // Freight / rake breakdown ahead
  | "fog_restriction"     // Extreme fog, speed capped at 30 km/h
  | "bridge_inspection"   // Precautionary river bridge speed test
  | "medical_emergency";  // Unscheduled halt for passenger medical aid

export type ObstacleEffect = "full_block" | "speed_restriction" | "station_dwell";

export interface Obstacle {
  id: string;
  type: ObstacleType;
  title: string;
  description: string;
  locationType: "station" | "segment";
  stationCode?: string;
  fromStationCode?: string;
  toStationCode?: string;
  startMinute: number;
  durationMinutes: number;
  uncertaintyMinutes: number; // Range (+/- mins)
  effect: ObstacleEffect;
  speedCapKmph?: number;      // Applied when effect is speed_restriction
}

export type PlanActionType = "wait" | "divert" | "hold" | "terminate_transfer";

export interface CandidatePlan {
  id: string;
  actionType: PlanActionType;
  title: string;
  headline: string;
  description: string;
  recommended: boolean;
  score: number;
  newArrivalMin: number;
  delayMinutes: number;
  extraDistanceKm: number;
  transfers: number;
  riskScore: number;          // 0-100 (lower is safer)
  confidence: number;         // 0-100%
  detourStationCodes: string[];
  connectingTrainNumber?: string;
  connectingTrainName?: string;
  transferStationCode?: string;
  reasoning: string[];
  tradeoffs: string[];
}
