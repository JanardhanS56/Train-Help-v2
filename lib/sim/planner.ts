/**
 * lib/sim/planner.ts
 * Deterministic AI Decision Engine: graph rerouting (Dijkstra), delay estimation, and multi-factor ranking.
 */

import type { TrainWithStops, DbRailLink } from "@/lib/data/types";
import type { SimPosition, Obstacle, CandidatePlan } from "./types";

/**
 * Finds shortest detour path between start and end avoiding blocked edges using Dijkstra.
 */
export function findDetourPath(
  startCode: string,
  endCode: string,
  links: DbRailLink[],
  blockedA: string,
  blockedB: string
): { path: string[]; extraKm: number; addedMins: number } | null {
  const s = startCode.toUpperCase();
  const e = endCode.toUpperCase();
  if (s === e) return { path: [s], extraKm: 0, addedMins: 0 };

  const bA = blockedA.toUpperCase();
  const bB = blockedB.toUpperCase();

  // Build adjacency list excluding the blocked edge
  const adj = new Map<string, { to: string; dist: number; time: number }[]>();
  for (const l of links) {
    const a = l.station_a.toUpperCase();
    const b = l.station_b.toUpperCase();

    // Skip the blocked track segment in both directions
    if ((a === bA && b === bB) || (a === bB && b === bA)) {
      continue;
    }

    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push({ to: b, dist: l.distance_km, time: l.typical_duration_min });
    adj.get(b)!.push({ to: a, dist: l.distance_km, time: l.typical_duration_min });
  }

  // Dijkstra search
  const distances = new Map<string, number>();
  const times = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const node of adj.keys()) {
    distances.set(node, Infinity);
    times.set(node, Infinity);
    previous.set(node, null);
    unvisited.add(node);
  }

  if (!distances.has(s) || !distances.has(e)) {
    return null;
  }

  distances.set(s, 0);
  times.set(s, 0);

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current: string | null = null;
    let minDist = Infinity;
    for (const node of unvisited) {
      const d = distances.get(node) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        current = node;
      }
    }

    if (!current || minDist === Infinity || current === e) {
      break;
    }

    unvisited.delete(current);

    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.to)) continue;
      const altDist = minDist + edge.dist;
      const altTime = (times.get(current) || 0) + edge.time;
      if (altDist < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, altDist);
        times.set(edge.to, altTime);
        previous.set(edge.to, current);
      }
    }
  }

  if (distances.get(e) === Infinity) {
    return null;
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = e;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) || null;
  }

  return {
    path,
    extraKm: Math.round(distances.get(e) || 0),
    addedMins: Math.round(times.get(e) || 0),
  };
}

/**
 * Generates and ranks 4 candidate responses for the simulation.
 */
export function generateCandidatePlans(
  train: TrainWithStops,
  pos: SimPosition,
  obstacle: Obstacle,
  railLinks: DbRailLink[]
): CandidatePlan[] {
  const currentStops = train.stops;
  const destination = currentStops[currentStops.length - 1];
  const nominalArrival = destination.arrival_min ?? (destination.departure_min || 0);

  const blockedFrom = obstacle.fromStationCode || obstacle.stationCode || "";
  const blockedTo = obstacle.toStationCode || blockedFrom;

  // Plan 1: Wait and Resume
  const waitDuration = obstacle.durationMinutes;
  const waitDelay = waitDuration + 10; // Clearance buffer
  const waitEta = nominalArrival + waitDelay;
  const waitRisk = Math.min(95, 30 + obstacle.uncertaintyMinutes * 2);

  const planWait: CandidatePlan = {
    id: "plan-wait-resume",
    actionType: "wait",
    title: "Wait and Resume",
    headline: `Hold track position; resume full speed once clearing teams report track fit`,
    description: `Train stays parked at safe distance before ${blockedFrom}. Engineering crew clears track in ~${obstacle.durationMinutes} min. Train resumes scheduled route.`,
    recommended: false,
    score: 0,
    newArrivalMin: waitEta,
    delayMinutes: waitDelay,
    extraDistanceKm: 0,
    transfers: 0,
    riskScore: waitRisk,
    confidence: Math.max(50, 95 - obstacle.uncertaintyMinutes),
    detourStationCodes: [],
    reasoning: [
      `Obstacle duration expected at ~${obstacle.durationMinutes} minutes with ${obstacle.uncertaintyMinutes}m uncertainty.`,
      `Zero additional mileage or passenger transfer friction.`,
      `Optimal if track clearing operations conclude without secondary complications.`,
    ],
    tradeoffs: [
      `Passengers stay in rake during halt.`,
      `Risk of clearance extension if rain or boulder removal delays crew.`,
    ],
  };

  // Plan 2: Divert Route (Dijkstra)
  let planDivert: CandidatePlan;
  const detour = findDetourPath(
    pos.currentStationCode || train.stops[pos.currentStopIndex]?.station_code || train.origin_station_code,
    destination.station_code,
    railLinks,
    blockedFrom,
    blockedTo
  );

  if (detour && detour.path.length >= 2) {
    const divertExtraKm = Math.max(15, detour.extraKm);
    const divertDelay = Math.round(detour.addedMins * 0.7);
    const divertEta = nominalArrival + divertDelay;

    planDivert = {
      id: "plan-divert-loop",
      actionType: "divert",
      title: "Tactical Route Diversion",
      headline: `Divert via alternate chord line avoiding ${blockedFrom}—${blockedTo}`,
      description: `Reroute train across ${detour.path.slice(0, 4).join(" → ")} loop line. Keeps wheels rolling; bypasses obstructed section completely.`,
      recommended: false,
      score: 0,
      newArrivalMin: divertEta,
      delayMinutes: divertDelay,
      extraDistanceKm: divertExtraKm,
      transfers: 0,
      riskScore: 20, // Low operational risk
      confidence: 88,
      detourStationCodes: detour.path,
      reasoning: [
        `Completely avoids blocked section (${blockedFrom}—${blockedTo}).`,
        `Maintains active motion, avoiding passenger restlessness.`,
        `Adds ${divertExtraKm} km but guarantees arrival with estimated ${divertDelay}m delay.`,
      ],
      tradeoffs: [
        `Adds ${divertExtraKm} km extra travel distance.`,
        `Requires Section Controller line-clear clearance at crossover junctions.`,
      ],
    };
  } else {
    // Fallback diversion estimate if graph is disconnected
    planDivert = {
      id: "plan-divert-loop",
      actionType: "divert",
      title: "Tactical Route Diversion",
      headline: `Divert via parallel trunk corridor`,
      description: `Reroute through adjacent division trunk route bypassing ${blockedFrom}.`,
      recommended: false,
      score: 0,
      newArrivalMin: nominalArrival + 75,
      delayMinutes: 75,
      extraDistanceKm: 65,
      transfers: 0,
      riskScore: 35,
      confidence: 80,
      detourStationCodes: [blockedFrom, destination.station_code],
      reasoning: [
        `Alternate track clears train movement without waiting for track repair.`,
        `Reliable arrival trajectory with predictable delay.`,
      ],
      tradeoffs: [`Increased run time by ~75 mins.`],
    };
  }

  // Plan 3: Hold at Nearest Junction
  const junctionStop =
    [...train.stops]
      .slice(0, pos.currentStopIndex + 1)
      .reverse()
      .find((s) => s.station_code !== blockedFrom) || train.stops[0];

  const planHold: CandidatePlan = {
    id: "plan-hold-junction",
    actionType: "hold",
    title: "Platform Hold at Major Junction",
    headline: `Regulate rake at ${junctionStop.station_name} platform with passenger catering`,
    description: `Instead of stopping in open block section, step back to ${junctionStop.station_name}. Passengers get platform access, water refills, and hot meals while section controller assesses line fit.`,
    recommended: false,
    score: 0,
    newArrivalMin: waitEta + 20,
    delayMinutes: waitDelay + 20,
    extraDistanceKm: 5,
    transfers: 0,
    riskScore: 25,
    confidence: 85,
    detourStationCodes: [junctionStop.station_code],
    reasoning: [
      `Guarantees passenger welfare (food stalls, sanitisation, medical aid) during halt.`,
      `Prevents blocking single-line track behind the obstruction.`,
    ],
    tradeoffs: [
      `Adds turnaround time to dock at junction platform.`,
      `Slightly higher total delay than waiting on mainline.`,
    ],
  };

  // Plan 4: Terminate Short & Transfer
  const planTransfer: CandidatePlan = {
    id: "plan-terminate-transfer",
    actionType: "terminate_transfer",
    title: "Short-Terminate & Express Transfer",
    headline: `Terminate at ${junctionStop.station_code}; cross-platform transfer to onward Superfast`,
    description: `Disembark passengers at ${junctionStop.station_name} into pre-arranged onward rake running via chord line. Highest operational recovery speed for urgent travelers.`,
    recommended: false,
    score: 0,
    newArrivalMin: nominalArrival + 45,
    delayMinutes: 45,
    extraDistanceKm: 10,
    transfers: 1,
    riskScore: 40,
    confidence: 82,
    detourStationCodes: [junctionStop.station_code, destination.station_code],
    connectingTrainNumber: "12629",
    connectingTrainName: "Karnataka Sampark Kranti Express",
    transferStationCode: junctionStop.station_code,
    reasoning: [
      `Fastest arrival to destination for passengers with urgent deadlines.`,
      `Leaves empty rake available for immediate division maintenance.`,
    ],
    tradeoffs: [
      `Requires physical coach transfer with luggage.`,
      `Operational overhead of coordinating onward seat allotments.`,
    ],
  };

  const plans = [planDivert, planWait, planHold, planTransfer];

  // Multi-factor Scoring (lower is better, then inverted to 0-100)
  // Factors: Delay minutes (40%), Risk (25%), Transfers (20%), Distance (15%)
  for (const p of plans) {
    const delayPenalty = (p.delayMinutes / 180) * 40;
    const riskPenalty = (p.riskScore / 100) * 25;
    const transferPenalty = p.transfers * 20;
    const distPenalty = (p.extraDistanceKm / 150) * 15;

    const penalty = delayPenalty + riskPenalty + transferPenalty + distPenalty;
    p.score = Math.max(10, Math.round(100 - penalty));
  }

  // Rank plans by score descending
  plans.sort((a, b) => b.score - a.score);

  // Mark best as recommended
  plans[0].recommended = true;

  return plans;
}
