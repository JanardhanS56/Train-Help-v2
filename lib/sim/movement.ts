/**
 * lib/sim/movement.ts
 * Kinematics and position interpolation engine with station dwell and obstacle braking.
 */

import type { SimScheduleStop, SimPosition, Obstacle } from "./types";

/**
 * Linearly interpolates between two numbers.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Calculates max cruise speed for train category.
 */
export function getCruiseSpeed(trainType: string): number {
  const t = trainType.toLowerCase();
  if (t.includes("vande")) return 130;
  if (t.includes("rajdhani") || t.includes("shatabdi")) return 120;
  if (t.includes("duronto") || t.includes("tejas")) return 110;
  if (t.includes("superfast")) return 95;
  return 80;
}

/**
 * Pure function: calculates train state, position, speed, and accumulated delay at minute t.
 */
export function calculatePosition(
  stops: SimScheduleStop[],
  currentMinute: number,
  obstacles: Obstacle[] = [],
  trainType = "Superfast Express"
): SimPosition {
  if (stops.length === 0) {
    throw new Error("Cannot calculate movement without stops.");
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const cruiseSpeed = getCruiseSpeed(trainType);

  // 1. Before departure
  if (currentMinute < origin.departureMin) {
    return {
      currentMinute,
      state: "scheduled",
      latitude: origin.latitude,
      longitude: origin.longitude,
      distanceKm: 0,
      currentSpeedKmph: 0,
      maxSpeedKmph: cruiseSpeed,
      currentStopIndex: 0,
      nextStopIndex: 1,
      currentStationCode: origin.stationCode,
      nextStationCode: stops[1]?.stationCode ?? null,
      delayMinutes: 0,
      activeObstacleId: null,
      statusMessage: `At origin ${origin.stationName}. Scheduled departure at ${formatMin(origin.departureMin)}.`,
    };
  }

  // 2. Active run through stops
  let accumulatedDelay = 0;
  let activeObstacle: Obstacle | null = null;

  // Check obstacle impacts up to current minute
  for (const obs of obstacles) {
    if (currentMinute >= obs.startMinute && currentMinute < obs.startMinute + obs.durationMinutes) {
      activeObstacle = obs;
      if (obs.effect === "full_block") {
        accumulatedDelay += Math.min(
          obs.durationMinutes,
          currentMinute - obs.startMinute
        );
      } else if (obs.effect === "speed_restriction") {
        accumulatedDelay += Math.round((currentMinute - obs.startMinute) * 0.4);
      }
    } else if (currentMinute >= obs.startMinute + obs.durationMinutes) {
      // Past obstacle: residual delay remains
      accumulatedDelay += obs.durationMinutes;
    }
  }

  const effectiveMinute = currentMinute - accumulatedDelay;

  // After destination reached
  if (effectiveMinute >= destination.arrivalMin) {
    return {
      currentMinute,
      state: "completed",
      latitude: destination.latitude,
      longitude: destination.longitude,
      distanceKm: destination.distanceKm,
      currentSpeedKmph: 0,
      maxSpeedKmph: cruiseSpeed,
      currentStopIndex: stops.length - 1,
      nextStopIndex: stops.length - 1,
      currentStationCode: destination.stationCode,
      nextStationCode: null,
      delayMinutes: accumulatedDelay,
      activeObstacleId: null,
      statusMessage: `Journey completed at ${destination.stationName}. Delay: ${accumulatedDelay} mins.`,
    };
  }

  // Find active stop/segment
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];

    // Check if train is dwelling at station s1 (for intermediate halts)
    if (i > 0 && effectiveMinute >= s1.arrivalMin && effectiveMinute <= s1.departureMin) {
      return {
        currentMinute,
        state: "dwelling",
        latitude: s1.latitude,
        longitude: s1.longitude,
        distanceKm: s1.distanceKm,
        currentSpeedKmph: 0,
        maxSpeedKmph: cruiseSpeed,
        currentStopIndex: i,
        nextStopIndex: i + 1,
        currentStationCode: s1.stationCode,
        nextStationCode: s2.stationCode,
        delayMinutes: accumulatedDelay,
        activeObstacleId: null,
        statusMessage: `Halt at ${s1.stationName} (departs ${formatMin(s1.departureMin + accumulatedDelay)}).`,
      };
    }

    // Check if train is traveling between s1 and s2
    if (effectiveMinute >= s1.departureMin && effectiveMinute < s2.arrivalMin) {
      const segDuration = Math.max(1, s2.arrivalMin - s1.departureMin);
      const elapsed = effectiveMinute - s1.departureMin;
      const progress = elapsed / segDuration;

      // Check if current segment is blocked by an active obstacle
      const isSegmentBlocked =
        activeObstacle &&
        ((activeObstacle.fromStationCode === s1.stationCode && activeObstacle.toStationCode === s2.stationCode) ||
          (activeObstacle.fromStationCode === s2.stationCode && activeObstacle.toStationCode === s1.stationCode) ||
          activeObstacle.stationCode === s2.stationCode);

      if (isSegmentBlocked && activeObstacle?.effect === "full_block") {
        // Stop before the obstruction
        const blockedProgress = Math.min(progress, 0.45);
        return {
          currentMinute,
          state: "blocked",
          latitude: lerp(s1.latitude, s2.latitude, blockedProgress),
          longitude: lerp(s1.longitude, s2.longitude, blockedProgress),
          distanceKm: lerp(s1.distanceKm, s2.distanceKm, blockedProgress),
          currentSpeedKmph: 0,
          maxSpeedKmph: cruiseSpeed,
          currentStopIndex: i,
          nextStopIndex: i + 1,
          currentStationCode: s1.stationCode,
          nextStationCode: s2.stationCode,
          delayMinutes: accumulatedDelay,
          activeObstacleId: activeObstacle.id,
          statusMessage: `BLOCKED: ${activeObstacle.title} on ${s1.stationCode}—${s2.stationCode}.`,
        };
      }

      // Smooth acceleration / deceleration profile
      let speedFactor = 1.0;
      if (progress < 0.15) {
        speedFactor = progress / 0.15; // Accel
      } else if (progress > 0.85) {
        speedFactor = (1 - progress) / 0.15; // Decel
      }
      speedFactor = Math.max(0.2, Math.min(1.0, speedFactor));

      let currentSpeed = cruiseSpeed * speedFactor;
      if (isSegmentBlocked && activeObstacle?.effect === "speed_restriction") {
        currentSpeed = Math.min(currentSpeed, activeObstacle.speedCapKmph || 30);
      }

      return {
        currentMinute,
        state: isSegmentBlocked ? "braking" : "running",
        latitude: lerp(s1.latitude, s2.latitude, progress),
        longitude: lerp(s1.longitude, s2.longitude, progress),
        distanceKm: lerp(s1.distanceKm, s2.distanceKm, progress),
        currentSpeedKmph: Math.round(currentSpeed),
        maxSpeedKmph: cruiseSpeed,
        currentStopIndex: i,
        nextStopIndex: i + 1,
        currentStationCode: null,
        nextStationCode: s2.stationCode,
        delayMinutes: accumulatedDelay,
        activeObstacleId: isSegmentBlocked && activeObstacle ? activeObstacle.id : null,
        statusMessage: `Cruising between ${s1.stationName} and ${s2.stationName} (${Math.round(currentSpeed)} km/h).`,
      };
    }
  }

  // Fallback to origin
  return {
    currentMinute,
    state: "running",
    latitude: origin.latitude,
    longitude: origin.longitude,
    distanceKm: 0,
    currentSpeedKmph: 0,
    maxSpeedKmph: cruiseSpeed,
    currentStopIndex: 0,
    nextStopIndex: 1,
    currentStationCode: origin.stationCode,
    nextStationCode: stops[1]?.stationCode ?? null,
    delayMinutes: 0,
    activeObstacleId: null,
    statusMessage: "Running schedule.",
  };
}

function formatMin(mins: number): string {
  const d = Math.floor(mins / 1440);
  const rem = mins % 1440;
  const h = Math.floor(rem / 60);
  const m = rem % 60;
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return d > 0 ? `${time} (+${d}d)` : time;
}
