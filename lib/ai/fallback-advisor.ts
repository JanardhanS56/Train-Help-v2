/**
 * lib/ai/fallback-advisor.ts
 * Deterministic Railway Travel Advisor & Offline Fallback Engine.
 *
 * Provides instant, zero-latency, offline rule-based responses when
 * external LLM API keys are missing or upstream AI providers rate-limit/fail (429/503).
 *
 * Covers 4 core Indian Railways intent categories:
 * 1. Full refund eligibility & TDR filing rules (delay > 3 hours, cancellation)
 * 2. Alternative train recommendations for active trip (matching origin/destination)
 * 3. RAC & Tatkal cancellation rules (charges, timelines, exemptions)
 * 4. General railway safety & emergency assistance contacts (139, RailMadad, medical)
 */

import type { GroundingContext } from "@/lib/ai/grounding";
import type { Alternative, RankedAlternative } from "@/lib/types";

export type FallbackIntent =
  | "refund_tdr"
  | "alternative_recommendations"
  | "cancellation_rules"
  | "safety_emergency"
  | "general";

/**
 * Classify user intent using deterministic keyword and pattern matching.
 */
export function classifyIntent(query: string): FallbackIntent {
  const q = query.toLowerCase().trim();

  // 1. Safety & Emergency Assistance
  const safetyPatterns = [
    /\b(emergency|sos|safety|police|rpf|medical|doctor|hospital|theft|harassment|crime|accident|helpline|rail\s*madad|139|112|women\s*safety|meri\s*saheli)\b/i,
  ];
  if (safetyPatterns.some((pattern) => pattern.test(q))) {
    return "safety_emergency";
  }

  // 2. RAC & Tatkal Cancellation Rules
  const cancellationPatterns = [
    /\b(rac|tatkal)\b/i,
    /\b(cancellation\s*rule|cancellation\s*charge|cancel\s*ticket|how\s*to\s*cancel|cancel\s*policy|clerkage|waitlist\s*cancel|wl\s*cancel)\b/i,
  ];
  if (cancellationPatterns.some((pattern) => pattern.test(q))) {
    return "cancellation_rules";
  }

  // 3. Full Refund & TDR Filing
  const refundPatterns = [
    /\b(refund|tdr|ticket\s*deposit\s*receipt|file\s*tdr|money\s*back|fare\s*refund)\b/i,
    /\b(delay\s*refund|delayed\s*by\s*3\s*hours?|late\s*train\s*refund|delay\s*claim|full\s*refund)\b/i,
  ];
  if (refundPatterns.some((pattern) => pattern.test(q))) {
    return "refund_tdr";
  }

  // 4. Alternative Train Recommendations
  const alternativePatterns = [
    /\b(alternative|other\s*train|next\s*train|another\s*train|different\s*train|switch\s*train)\b/i,
    /\b(options?|reschedule|rebook|find\s*train|recommend\s*train|suggest\s*train|available\s*train)\b/i,
  ];
  if (alternativePatterns.some((pattern) => pattern.test(q))) {
    return "alternative_recommendations";
  }

  return "general";
}

/**
 * Format hours and minutes from total minutes
 */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Advice Handler: Full Refund Eligibility & TDR Filing Rules
 */
function adviceRefundTDR(context: GroundingContext): string {
  const delayMinutes = context.disruption?.delayMinutes ?? 0;
  const isCancelled = context.activeTrip?.status === "cancelled";
  const activeTrip = context.activeTrip;
  const trainName = activeTrip?.segments[0]?.trainName ?? "your train";
  const trainNumber = activeTrip?.segments[0]?.trainNumber ?? "";
  const pnr = activeTrip?.pnr ?? "your PNR";

  const lines: string[] = [];

  lines.push(`### 📋 IRCTC Full Refund & TDR Filing Guidelines`);

  if (isCancelled) {
    lines.push(
      `Your train **${trainName}${trainNumber ? ` (#${trainNumber})` : ""}** has been officially **CANCELLED** by Indian Railways.`
    );
    lines.push(
      `- **Automatic Refund**: For e-tickets booked on IRCTC, **no TDR is required**. Indian Railways will automatically refund the full fare directly to your original payment method within 3 to 7 working days.`
      + `\n- **Counter Tickets (PRS)**: Must be surrendered at any PRS counter within 72 hours of scheduled departure for an instant cash refund.`
    );
  } else if (delayMinutes >= 180) {
    const delayFormatted = formatMinutes(delayMinutes);
    lines.push(
      `Your train **${trainName}${trainNumber ? ` (#${trainNumber})` : ""}** is currently running **${delayFormatted} late** (exceeding the Indian Railways 3-hour threshold).`
    );
    lines.push(
      `✅ **100% Full Refund Eligible**: Under IRCTC / Indian Railways rules, if a train is delayed by **more than 3 hours** at your boarding station and you do not undertake the journey, you are entitled to a full refund with **zero cancellation charges**.`
    );
    lines.push(
      `#### 📝 How to File an Online TDR for Delayed Trains:\n` +
      `1. Log in to your [IRCTC Portal](https://www.irctc.co.in).\n` +
      `2. Navigate to **My Account** > **My Transactions** > **File TDR**.\n` +
      `3. Select PNR **${pnr}**.\n` +
      `4. Choose reason: *"Train Late More Than Three Hours and Passenger Not Travelled"*.\n` +
      `5. Submit the claim **before the actual departure of the train** from your boarding station.`
    );
  } else {
    lines.push(
      `Under Indian Railways refund rules:\n` +
      `- **Train Delayed > 3 Hours**: You are entitled to a **100% full refund** with zero deductions if you do not travel. You must file an online TDR before the actual departure of the train from your boarding station.` +
      `\n- **Train Cancelled by Railways**: 100% refund is automatically processed to your booking account without filing a TDR.` +
      `\n- **Voluntary Cancellation (Delay < 3 Hours)**: Standard cancellation fees apply based on how many hours prior to scheduled departure or chart preparation the cancellation is made.`
    );
    if (activeTrip) {
      lines.push(
        `\n*Current Status for PNR ${pnr}*: Status is **${activeTrip.status.toUpperCase()}**${delayMinutes ? ` with ${formatMinutes(delayMinutes)} delay` : ""}.`
      );
    }
  }

  lines.push(
    `\n> 💡 *Note: IRCTC verifies all TDR claims against official NTES train running records before credit disbursement.*`
  );

  return lines.join("\n\n");
}

/**
 * Advice Handler: Alternative Train Recommendations
 */
function adviceAlternatives(context: GroundingContext): string {
  const activeTrip = context.activeTrip;
  const seg = activeTrip?.segments[0];
  const origin = seg?.departureStation?.code ?? "Origin";
  const destination = seg?.arrivalStation?.code ?? "Destination";
  const originName = seg?.departureStation?.name ?? origin;
  const destName = seg?.arrivalStation?.name ?? destination;

  const lines: string[] = [];
  lines.push(`### 🚆 Verified Alternative Train Recommendations`);

  if (activeTrip) {
    lines.push(
      `Route: **${originName} (${origin})** ➔ **${destName} (${destination})**\nActive PNR: \`${activeTrip.pnr}\` (Current Class: ${activeTrip.travelClass})`
    );
  }

  const alts = context.topAlternatives || [];

  if (alts.length > 0) {
    lines.push(`Here are the top ranked, verified options matching your journey:`);

    alts.slice(0, 3).forEach((a: Alternative | RankedAlternative, idx: number) => {
      const ranked = a as RankedAlternative;
      const depTime = new Date(a.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const arrTime = new Date(a.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const fareDiff = a.fareDifference >= 0 ? `+₹${a.fareDifference}` : `-₹${Math.abs(a.fareDifference)}`;

      lines.push(
        `**${idx + 1}. ${a.trainName} (#${a.trainNumber})**\n` +
        `- Departure: **${depTime}** (${a.fromStation.code}) ➔ Arrival: **${arrTime}** (${a.toStation.code})\n` +
        `- Class & Seat: **${a.travelClass}** (${a.coachBerth ?? "Confirmed"})\n` +
        `- Availability: **${a.availability.label}** (${a.availability.type.toUpperCase()})\n` +
        `- Fare: **₹${a.fare}** (Diff: ${fareDiff})` +
        (ranked.overallScore ? ` · *Match Score: ${ranked.overallScore}/100*` : "") +
        (ranked.matchReason ? `\n- *Rationale*: ${ranked.matchReason}` : "")
      );
    });

    const firstAlt = alts[0];
    lines.push(
      `To switch to the top alternative immediately, you can proceed with one-click rebooking.\nACTION:SELECT_ALTERNATIVE:${firstAlt.id}`
    );
  } else {
    lines.push(
      `No pre-computed alternatives are currently cached for this route in the active session.\n` +
      `- Use the **Journey Search** tab to explore all operating trains between **${origin}** and **${destination}**.\n` +
      `- Or adjust your budget and class preferences to broaden seat availability.`
    );
  }

  return lines.join("\n\n");
}

/**
 * Advice Handler: RAC & Tatkal Cancellation Rules
 */
function adviceCancellationRules(): string {
  return [
    `### 🎫 IRCTC Cancellation Rules: RAC, Tatkal & Confirmed Tickets`,
    `#### 1. Tatkal Ticket Cancellation Rules:`,
    `- **Confirmed Tatkal**: **No refund** (0%) is granted upon cancellation of confirmed Tatkal tickets under any standard circumstances.` +
    `\n- **Waitlisted / RAC Tatkal**: Refund is granted after deducting clerkage charges (₹60 + GST) if cancelled up to 30 minutes before scheduled train departure.` +
    `\n- **Exceptions for Full Refund on Tatkal**:` +
    `\n  - If the train is delayed by > 3 hours at boarding station and passenger does not travel (file TDR).` +
    `\n  - If the train is cancelled or diverted and passenger refuses to travel.`,
    `#### 2. RAC (Reservation Against Cancellation) Rules:`,
    `- RAC passengers are allotted sitting berths (shared lower berth for night journeys).` +
    `\n- **Cancellation Window**: Must be cancelled at least **30 minutes** before scheduled train departure.` +
    `\n- **Clerkage Charge**: Flat **₹60 + GST** per passenger will be deducted, and the remaining fare will be refunded.` +
    `\n- If chart is prepared and RAC ticket is not cancelled before the 30-minute cutoff, no refund is granted.`,
    `#### 3. Standard Confirmed Ticket Cancellation Charges (IRCTC):`,
    `- **> 48 hours before departure**: Flat deduction (₹240 for 1A/EC, ₹200 for 2A, ₹180 for 3A/CC, ₹120 for Sleeper, ₹60 for 2S).` +
    `\n- **Between 48 hours and 12 hours**: 25% of fare (subject to minimum flat rate).` +
    `\n- **Between 12 hours and 4 hours (or chart preparation)**: 50% of fare.` +
    `\n- **Less than 4 hours / post chart preparation**: No refund permitted.`,
  ].join("\n\n");
}

/**
 * Advice Handler: General Railway Safety & Emergency Assistance
 */
function adviceSafetyEmergency(): string {
  return [
    `### 🚨 Railway Emergency Assistance & Safety Helplines`,
    `If you are experiencing an emergency or safety concern, assistance is available 24x7:`,
    `#### 📞 Primary Railway Helplines:`,
    `- **139 (RailMadad All-in-One Helpline)**:` +
    `\n  - Available 24x7 in 12 languages across India.` +
    `\n  - Press **1** for Security & RPF assistance.` +
    `\n  - Press **2** for Medical emergency.` +
    `\n  - Press **3** for Accident & train accident inquiries.` +
    `\n  - Press **4** for General complaints and grievances.`,
    `#### 🛡️ Passenger Security & Police:`,
    `- **RPF Helpline**: Dial **139** or **112** (National Emergency Support System).` +
    `\n- **Operation "Meri Saheli"**: Dedicated RPF women security squads present on major express routes for female solo travelers.`,
    `#### 🩺 Medical Emergency Onboard:`,
    `- Immediately notify your coach **TTE (Train Ticket Examiner)** or **Coach Attendant**.` +
    `\n- Call **139** to request **Doctor on Call** at the next upcoming railway station halt.` +
    `\n- Basic first aid kits are available with the Train Superintendent / Guard in all passenger trains.`,
    `#### 🌐 Digital Grievance Portal:`,
    `- Visit **[RailMadad Portal](https://railmadad.indianrailways.gov.in)** or use the RailMadad mobile app to file complaints with live status tracking.`,
  ].join("\n\n");
}

/**
 * Advice Handler: General Fallback
 */
function adviceGeneral(context: GroundingContext): string {
  const activeTrip = context.activeTrip;
  const pnr = activeTrip?.pnr;
  const trainName = activeTrip?.segments[0]?.trainName;
  const status = activeTrip?.status;

  const lines = [
    `### 🚉 TravelRescue AI Assistant (Offline Mode)`,
    `I am operating in verified offline deterministic mode. I can immediately help you with:`,
    `1. **Full Refund & TDR Filing**: Check if your delay qualifies for 100% refund without cancellation penalties.`,
    `2. **Alternative Train Recommendations**: View top-ranked alternative trains for your disrupted journey.`,
    `3. **RAC & Tatkal Rules**: Clear breakdown of cancellation fees, time windows, and clerkage charges.`,
    `4. **Safety & Emergency Support**: Immediate access to Indian Railways helpline (139), medical on-call, and RPF assistance.`,
  ];

  if (activeTrip) {
    lines.push(
      `\n*Active Journey*: PNR **${pnr}** (${trainName ?? "Express"} · Status: **${status?.toUpperCase()}**). Ask me about alternative trains or filing a refund claim.`
    );
  }

  return lines.join("\n\n");
}

/**
 * Generate deterministic railway advice based on query intent and session context.
 *
 * @param query The user's input message
 * @param context Session grounding context (activeTrip, disruption, alternatives, preferences)
 * @returns Fully formatted markdown response adhering to Indian Railways rules
 */
export function generateDeterministicAdvice(
  query: string,
  context: GroundingContext = {}
): string {
  const intent = classifyIntent(query);

  switch (intent) {
    case "refund_tdr":
      return adviceRefundTDR(context);
    case "alternative_recommendations":
      return adviceAlternatives(context);
    case "cancellation_rules":
      return adviceCancellationRules();
    case "safety_emergency":
      return adviceSafetyEmergency();
    case "general":
    default:
      return adviceGeneral(context);
  }
}
