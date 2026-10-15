/**
 * lib/sim/replay.ts
 * Deterministic replay engine for past simulation scenario runs.
 * Supports scrubbing, play/pause, and playback at 1x, 2x, 5x, 10x speed.
 */

import type { SimScenarioRun, TelemetrySnapshot, SimEventRecord } from "./persistence";
import type { SimPosition, Obstacle, TrainRunState } from "./types";
import type { SpeedMultiplier } from "./clock";

export interface ReplayState {
  currentMinute: number;
  isPlaying: boolean;
  speedMultiplier: SpeedMultiplier;
  position: SimPosition;
  activeObstacle: Obstacle | null;
  eventsUpToNow: SimEventRecord[];
  isComplete: boolean;
}

/**
 * Finds the nearest telemetry snapshot for a given minute or linearly interpolates between
 * surrounding snapshots for smooth coordinate tracking.
 */
export function interpolateReplayPosition(
  snapshots: TelemetrySnapshot[],
  minute: number,
  fallbackObstacle?: Obstacle | null
): SimPosition {
  if (snapshots.length === 0) {
    return {
      currentMinute: minute,
      state: "scheduled",
      latitude: 20.5937,
      longitude: 78.9629,
      distanceKm: 0,
      currentSpeedKmph: 0,
      maxSpeedKmph: 110,
      currentStopIndex: 0,
      nextStopIndex: 1,
      currentStationCode: null,
      nextStationCode: null,
      delayMinutes: 0,
      activeObstacleId: fallbackObstacle?.id || null,
      statusMessage: "Replay telemetry snapshot unavailable.",
    };
  }

  // Exact match or before first snapshot
  if (minute <= snapshots[0].minute) {
    const s = snapshots[0];
    return {
      currentMinute: minute,
      state: s.state as TrainRunState,
      latitude: s.latitude,
      longitude: s.longitude,
      distanceKm: s.distanceKm,
      currentSpeedKmph: s.speedKmph,
      maxSpeedKmph: 110,
      currentStopIndex: s.currentStopIndex,
      nextStopIndex: s.nextStopIndex,
      currentStationCode: s.currentStationCode,
      nextStationCode: s.nextStationCode,
      delayMinutes: s.delayMinutes,
      activeObstacleId: fallbackObstacle?.id || null,
      statusMessage: s.statusMessage,
    };
  }

  // Exact match with last snapshot
  const last = snapshots[snapshots.length - 1];
  if (minute === last.minute) {
    return {
      currentMinute: minute,
      state: last.state as TrainRunState,
      latitude: last.latitude,
      longitude: last.longitude,
      distanceKm: last.distanceKm,
      currentSpeedKmph: last.speedKmph,
      maxSpeedKmph: 110,
      currentStopIndex: last.currentStopIndex,
      nextStopIndex: last.nextStopIndex,
      currentStationCode: last.currentStationCode,
      nextStationCode: last.nextStationCode,
      delayMinutes: last.delayMinutes,
      activeObstacleId: fallbackObstacle?.id || null,
      statusMessage: last.statusMessage,
    };
  }

  // After last snapshot
  if (minute > last.minute) {
    return {
      currentMinute: minute,
      state: "completed",
      latitude: last.latitude,
      longitude: last.longitude,
      distanceKm: last.distanceKm,
      currentSpeedKmph: 0,
      maxSpeedKmph: 110,
      currentStopIndex: last.currentStopIndex,
      nextStopIndex: last.nextStopIndex,
      currentStationCode: last.currentStationCode,
      nextStationCode: null,
      delayMinutes: last.delayMinutes,
      activeObstacleId: null,
      statusMessage: "Journey complete (Replay finished).",
    };
  }

  // Find bounding snapshots
  let prevIdx = 0;
  for (let i = 0; i < snapshots.length - 1; i++) {
    if (snapshots[i].minute <= minute && snapshots[i + 1].minute >= minute) {
      prevIdx = i;
      break;
    }
  }

  const p0 = snapshots[prevIdx];
  const p1 = snapshots[prevIdx + 1];
  const span = Math.max(0.001, p1.minute - p0.minute);
  const ratio = Math.min(1, Math.max(0, (minute - p0.minute) / span));

  const lat = p0.latitude + (p1.latitude - p0.latitude) * ratio;
  const lon = p0.longitude + (p1.longitude - p0.longitude) * ratio;
  const dist = p0.distanceKm + (p1.distanceKm - p0.distanceKm) * ratio;
  const speed = Math.round(p0.speedKmph + (p1.speedKmph - p0.speedKmph) * ratio);
  const delay = Math.round(p0.delayMinutes + (p1.delayMinutes - p0.delayMinutes) * ratio);

  return {
    currentMinute: minute,
    state: p0.state as TrainRunState,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    distanceKm: Number(dist.toFixed(1)),
    currentSpeedKmph: speed,
    maxSpeedKmph: 110,
    currentStopIndex: p0.currentStopIndex,
    nextStopIndex: p0.nextStopIndex,
    currentStationCode: p0.currentStationCode,
    nextStationCode: p0.nextStationCode,
    delayMinutes: delay,
    activeObstacleId: fallbackObstacle?.id || null,
    statusMessage: p0.statusMessage,
  };
}

/**
 * Returns any obstacle that was active during the specified minute in the scenario.
 */
export function getActiveObstacleAtMinute(
  obstacles: Obstacle[],
  minute: number
): Obstacle | null {
  for (const obs of obstacles) {
    const end = obs.startMinute + obs.durationMinutes;
    if (minute >= obs.startMinute && minute <= end) {
      return obs;
    }
  }
  return null;
}

/**
 * Filters events that occurred on or before the replay minute.
 */
export function getReplayEventsUpToMinute(
  events: SimEventRecord[],
  startMinute: number,
  currentMinute: number
): SimEventRecord[] {
  return events.filter((e) => {
    const evMin = typeof e.payload.minute === "number"
      ? (e.payload.minute as number)
      : startMinute + Math.floor(e.tOffsetMs / 60000);
    return evMin <= currentMinute;
  });
}

/**
 * Deterministic Replay Controller for a loaded past scenario run.
 */
export class SimReplaySession {
  private run: SimScenarioRun;
  private currentMinute: number;
  private isPlaying: boolean = false;
  private speedMultiplier: SpeedMultiplier = 1;

  constructor(run: SimScenarioRun) {
    this.run = run;
    this.currentMinute = run.startMinute;
  }

  public getRun(): SimScenarioRun {
    return this.run;
  }

  public getCurrentMinute(): number {
    return this.currentMinute;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSpeed(): SpeedMultiplier {
    return this.speedMultiplier;
  }

  public setSpeed(multiplier: SpeedMultiplier): void {
    this.speedMultiplier = multiplier;
  }

  public play(): void {
    if (this.currentMinute >= this.run.endMinute) {
      this.currentMinute = this.run.startMinute;
    }
    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  public scrub(minute: number): void {
    this.currentMinute = Math.max(this.run.startMinute, Math.min(this.run.endMinute, minute));
    if (this.currentMinute >= this.run.endMinute) {
      this.isPlaying = false;
    }
  }

  public step(deltaSeconds: number): ReplayState {
    if (this.isPlaying) {
      const deltaMinutes = (deltaSeconds * this.speedMultiplier) / 60;
      this.currentMinute = Math.min(this.run.endMinute, this.currentMinute + deltaMinutes);
      if (this.currentMinute >= this.run.endMinute) {
        this.isPlaying = false;
      }
    }

    return this.getState();
  }

  public getState(): ReplayState {
    const activeObs = getActiveObstacleAtMinute(this.run.obstacles, this.currentMinute);
    const pos = interpolateReplayPosition(this.run.telemetrySnapshots, this.currentMinute, activeObs);
    const evs = getReplayEventsUpToMinute(this.run.events, this.run.startMinute, this.currentMinute);

    return {
      currentMinute: this.currentMinute,
      isPlaying: this.isPlaying,
      speedMultiplier: this.speedMultiplier,
      position: pos,
      activeObstacle: activeObs,
      eventsUpToNow: evs,
      isComplete: this.currentMinute >= this.run.endMinute,
    };
  }
}
