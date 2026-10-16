/**
 * lib/sim/movement.ts
 * Kinematics and position interpolation engine with station dwell,
 * position-aware obstacle braking, and cascading delay propagation.
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
 * Position-aware: obstacles on future segments do NOT retard the train early.
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

  // 1. Before departure at origin
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

  // 2. Cascade through route segment by segment
  let accumulatedDelay = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];

    const s1Arrival = s1.arrivalMin + accumulatedDelay;
    let s1Departure = s1.departureMin + accumulatedDelay;

    // Check station dwell obstacle at station s1 (for intermediate halts)
    if (i > 0) {
      const stationObstacle = obstacles.find(
        (o) =>
          o.locationType === "station" &&
          (o.stationCode === s1.stationCode || o.toStationCode === s1.stationCode) &&
          o.effect === "station_dwell"
      );

      if (stationObstacle) {
        const obsStart = stationObstacle.startMinute;
        const obsEnd = stationObstacle.startMinute + stationObstacle.durationMinutes;

        // If obstacle overlaps with arrival/departure window
        if (s1Arrival < obsEnd && obsStart <= s1Departure + stationObstacle.durationMinutes) {
          const dwellExtension = stationObstacle.durationMinutes;

          if (currentMinute >= s1Arrival && currentMinute < s1Departure + dwellExtension) {
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
              delayMinutes: Math.max(0, currentMinute - s1.departureMin),
              activeObstacleId: stationObstacle.id,
              statusMessage: `Extended halt at ${s1.stationName}: ${stationObstacle.title}.`,
            };
          }
          accumulatedDelay += dwellExtension;
          s1Departure += dwellExtension;
        }
      }

      // Normal scheduled dwell at station s1
      if (currentMinute >= s1Arrival && currentMinute <= s1Departure) {
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
          statusMessage: `Halt at ${s1.stationName} (departs ${formatMin(s1Departure)}).`,
        };
      }
    }

    // Evaluate transit between s1 and s2
    const nominalTransit = Math.max(1, s2.arrivalMin - s1.departureMin);
    const segObstacle = obstacles.find(
      (o) =>
        (o.fromStationCode === s1.stationCode && o.toStationCode === s2.stationCode) ||
        (o.fromStationCode === s2.stationCode && o.toStationCode === s1.stationCode) ||
        (o.locationType === "segment" && o.toStationCode === s2.stationCode)
    );

    let effectiveTransit = nominalTransit;

    if (segObstacle) {
      const obsStart = segObstacle.startMinute;
      const obsEnd = segObstacle.startMinute + segObstacle.durationMinutes;

      if (segObstacle.effect === "full_block") {
        // If obstacle is active during this segment run
        if (currentMinute >= obsStart && currentMinute < obsEnd) {
          // If train has departed s1 or is due to transit
          if (currentMinute >= s1Departure) {
            const rawProgress = Math.max(0, (currentMinute - s1Departure) / nominalTransit);
            const blockedProgress = Math.min(rawProgress, 0.45);
            const currentDelay = accumulatedDelay + (currentMinute - obsStart);

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
              currentStationCode: null,
              nextStationCode: s2.stationCode,
              delayMinutes: Math.max(0, currentDelay),
              activeObstacleId: segObstacle.id,
              statusMessage: `BLOCKED: ${segObstacle.title} on ${s1.stationCode}—${s2.stationCode}.`,
            };
          }
        } else if (currentMinute >= obsEnd && s1Departure < obsEnd) {
          // Past obstacle on this segment: add duration to accumulated delay
          accumulatedDelay += segObstacle.durationMinutes;
        }
      } else if (segObstacle.effect === "speed_restriction") {
        const cap = segObstacle.speedCapKmph || 30;
        const slowdownRatio = Math.max(1.2, cruiseSpeed / cap);
        const extraTransit = Math.round(nominalTransit * (slowdownRatio - 1));

        if (currentMinute >= s1Departure && currentMinute < s1Departure + nominalTransit + extraTransit) {
          const elapsed = currentMinute - s1Departure;
          const prog = Math.min(0.98, elapsed / (nominalTransit + extraTransit));
          return {
            currentMinute,
            state: "braking",
            latitude: lerp(s1.latitude, s2.latitude, prog),
            longitude: lerp(s1.longitude, s2.longitude, prog),
            distanceKm: lerp(s1.distanceKm, s2.distanceKm, prog),
            currentSpeedKmph: cap,
            maxSpeedKmph: cruiseSpeed,
            currentStopIndex: i,
            nextStopIndex: i + 1,
            currentStationCode: null,
            nextStationCode: s2.stationCode,
            delayMinutes: accumulatedDelay + Math.round(elapsed * (1 - 1 / slowdownRatio)),
            activeObstacleId: segObstacle.id,
            statusMessage: `Speed restricted to ${cap} km/h: ${segObstacle.title}.`,
          };
        }

        if (currentMinute >= s1Departure + nominalTransit + extraTransit) {
          accumulatedDelay += extraTransit;
          effectiveTransit += extraTransit;
        }
      }
    }

    // Normal running in segment
    const segEnd = s1Departure + effectiveTransit;
    if (currentMinute >= s1Departure && currentMinute < segEnd) {
      const elapsed = currentMinute - s1Departure;
      const progress = elapsed / effectiveTransit;

      // Smooth acceleration / deceleration
      let speedFactor = 1.0;
      if (progress < 0.15) {
        speedFactor = progress / 0.15;
      } else if (progress > 0.85) {
        speedFactor = (1 - progress) / 0.15;
      }
      speedFactor = Math.max(0.25, Math.min(1.0, speedFactor));
      const currentSpeed = Math.round(cruiseSpeed * speedFactor);

      return {
        currentMinute,
        state: "running",
        latitude: lerp(s1.latitude, s2.latitude, progress),
        longitude: lerp(s1.longitude, s2.longitude, progress),
        distanceKm: lerp(s1.distanceKm, s2.distanceKm, progress),
        currentSpeedKmph: currentSpeed,
        maxSpeedKmph: cruiseSpeed,
        currentStopIndex: i,
        nextStopIndex: i + 1,
        currentStationCode: null,
        nextStationCode: s2.stationCode,
        delayMinutes: accumulatedDelay,
        activeObstacleId: null,
        statusMessage: `Cruising between ${s1.stationName} and ${s2.stationName} (${currentSpeed} km/h).`,
      };
    }
  }

  // 3. After destination reached
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

function formatMin(mins: number): string {
  const d = Math.floor(mins / 1440);
  const rem = mins % 1440;
  const h = Math.floor(rem / 60);
  const m = rem % 60;
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return d > 0 ? `${time} (+${d}d)` : time;
}
