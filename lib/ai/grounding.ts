/**
 * lib/ai/grounding.ts
 * Context Grounding Engine for Multi-Turn AI Assistant.
 * Builds system prompts with active trip, disruption, top alternatives, and preferences.
 * Enforces strict anti-hallucination constraints and structured action tags.
 */

import type { Trip, Alternative, RankedAlternative, UserPreferences } from "@/lib/types";

export interface GroundingContext {
  activeTrip?: Trip | null;
  disruption?: {
    type?: string;
    description?: string;
    severity?: string;
    delayMinutes?: number;
  } | null;
  topAlternatives?: (Alternative | RankedAlternative)[];
  preferences?: UserPreferences;
  currentTime?: Date | string;
}

export function buildGroundedSystemPrompt(context: GroundingContext): string {
  const now = context.currentTime
    ? new Date(context.currentTime).toISOString()
    : new Date().toISOString();

  const sections: string[] = [
    `You are the TravelRescue AI Train Assistant, an expert railway travel advisor for Indian Railways (IRCTC/NTES).`,
    `CURRENT TIME: ${now}`,
    `STRICT ANTI-HALLUCINATION RULES:`,
    `- ONLY recommend trains, schedules, classes, and fares that are explicitly provided in the context below.`,
    `- DO NOT invent fictitious train numbers, phantom departures, or unverified station codes.`,
    `- If the user asks for a train or schedule not in the provided context, state clearly that you do not have that schedule in the verified active data layer and advise checking IRCTC/NTES directly.`,
  ];

  // 1. Active Trip Context
  if (context.activeTrip) {
    const t = context.activeTrip;
    const seg = t.segments[0];
    sections.push(
      `ACTIVE PASSENGER TRIP:`,
      `- PNR: ${t.pnr}`,
      `- Passenger: ${t.passengerName}`,
      `- Train: ${seg?.trainName ?? "Unknown"} (#${seg?.trainNumber ?? "Unknown"})`,
      `- Route: ${seg?.departureStation?.name ?? ""} (${seg?.departureStation?.code ?? ""}) -> ${seg?.arrivalStation?.name ?? ""} (${seg?.arrivalStation?.code ?? ""})`,
      `- Departure: ${seg?.departureTime ? new Date(seg.departureTime).toISOString() : "TBD"}`,
      `- Arrival: ${seg?.arrivalTime ? new Date(seg.arrivalTime).toISOString() : "TBD"}`,
      `- Class & Coach: ${t.travelClass} (Coach ${t.coach ?? "TBA"} / Berth ${t.berth ?? "TBA"})`,
      `- Status: ${t.status.toUpperCase()}`,
      t.disruptionReason ? `- Disruption Reason: ${t.disruptionReason}` : ""
    );
  } else {
    sections.push(`ACTIVE PASSENGER TRIP: None selected.`);
  }

  // 2. Disruption Context
  if (context.disruption) {
    const d = context.disruption;
    sections.push(
      `CURRENT TRACK / SERVICE DISRUPTION:`,
      `- Disruption Type: ${d.type ?? "General Disruption"}`,
      `- Severity: ${d.severity ?? "Moderate"}`,
      `- Delay: ${d.delayMinutes ? `${d.delayMinutes} mins` : "Unknown / Cancelled"}`,
      `- Details: ${d.description ?? "Service disrupted along route."}`
    );
  }

  // 3. Top Ranked Alternatives
  if (context.topAlternatives && context.topAlternatives.length > 0) {
    const alts = context.topAlternatives.slice(0, 3);
    const altDescriptions = alts.map((a, i) => {
      const ranked = a as RankedAlternative;
      return [
        `Option ${i + 1} [ID: ${a.id}]:`,
        `  * Train: ${a.trainName} (#${a.trainNumber})`,
        `  * Route: ${a.fromStation.code} (${new Date(a.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}) -> ${a.toStation.code} (${new Date(a.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
        `  * Class & Berth: ${a.travelClass} (${a.coachBerth ?? "Confirmed"})`,
        `  * Fare: ₹${a.fare} (Fare Difference: ${a.fareDifference >= 0 ? `+₹${a.fareDifference}` : `-₹${Math.abs(a.fareDifference)}`})`,
        `  * Availability: ${a.availability.label} (${a.availability.type})`,
        ranked.overallScore ? `  * Overall Match Score: ${ranked.overallScore}/100` : "",
        ranked.matchReason ? `  * Match Rationale: ${ranked.matchReason}` : "",
      ].filter(Boolean).join("\n");
    });

    sections.push(
      `TOP VERIFIED ALTERNATIVES:`,
      altDescriptions.join("\n\n")
    );
  } else {
    sections.push(`TOP VERIFIED ALTERNATIVES: None currently loaded.`);
  }

  // 4. User Travel Preferences
  if (context.preferences) {
    const p = context.preferences;
    sections.push(
      `USER PREFERENCES:`,
      `- Max Budget: ₹${p.maxBudget}`,
      `- Preferred Classes: ${p.classes.join(", ")}`,
      `- Berth Preference: ${p.berthPreference}`,
      `- Seat Availability Requirement: ${p.seatPreference}`,
      `- Max Changes: ${p.maxChanges}`,
      `- Priority Profile: ${p.priorityProfile}`
    );
  }

  // 5. Action Execution Tag Protocol
  sections.push(
    `STRUCTURED ACTION PROTOCOL:`,
    `When appropriate to assist the user, you may include inline structured action tags at the end of your response:`,
    `- To recommend choosing an alternative: ACTION:SELECT_ALTERNATIVE:{alternative_id}`,
    `- To suggest adjusting a preference: ACTION:ADJUST_PREFERENCE:{maxBudget|berthPreference|seatPreference}:{value}`,
    `- To test or trigger simulation event: ACTION:TRIGGER_SIMULATION:{SIGNAL_FAILURE|TRACK_OBSTACLE|WEATHER_DELAY}`,
    `Keep answers crisp, polite, structured with markdown, and focused on Indian Railways recovery.`
  );

  return sections.filter(Boolean).join("\n\n");
}
