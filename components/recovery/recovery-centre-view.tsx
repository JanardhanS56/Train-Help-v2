"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Train,
  Ticket,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { useTripGroups } from "@/lib/tripGroups";
import { RefundTrackerCard } from "@/components/trips/refund-tracker-card";
import { formatTimeWithDay, formatDate, formatCurrency } from "@/lib/format";

type RecoveryTab = "active" | "refunds" | "history";

const VALID_TABS: RecoveryTab[] = ["active", "refunds", "history"];

const TAB_LABELS: Record<RecoveryTab, string> = {
  active: "Active recovery",
  refunds: "Refunds",
  history: "History",
};

export function RecoveryCentreView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useApp();
  const tripGroups = useTripGroups();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Set document.title
  useEffect(() => {
    document.title = "Recovery Centre · TravelRescue";
  }, []);

  // Move focus to main heading on route change
  useEffect(() => {
    headingRef.current?.focus();
  }, [pathname]);

  // Read tab from URL searchParams
  const rawTab = searchParams.get("tab");
  const currentTab: RecoveryTab = useMemo(() => {
    if (rawTab && VALID_TABS.includes(rawTab as RecoveryTab)) {
      return rawTab as RecoveryTab;
    }
    return "active";
  }, [rawTab]);

  // Fallback correction if invalid param without loop
  useEffect(() => {
    if (rawTab && !VALID_TABS.includes(rawTab as RecoveryTab)) {
      router.replace("/recovery?tab=active");
    }
  }, [rawTab, router]);

  function handleTabClick(tab: RecoveryTab) {
    router.push(`/recovery?tab=${tab}`);
  }

  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % VALID_TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + VALID_TABS.length) % VALID_TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = VALID_TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = VALID_TABS[nextIndex];
    router.push(`/recovery?tab=${nextTab}`);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("button[role='tab']");
    buttons?.[nextIndex]?.focus();
  }

  // Active recovery: attention trips only
  const attentionTrips = tripGroups.attention;

  // Refunds list: trips that have refund info
  const refundTrips = useMemo(() => {
    return state.trips.filter((t) => t.refund !== undefined);
  }, [state.trips]);

  // History list: recovered trips only
  const historyTrips = tripGroups.recovered;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl md:text-3xl font-display font-medium text-foreground tracking-tight outline-none"
        >
          Recovery Centre
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Resolve train disruptions, track compensation claims, and review verified journey replacements.
        </p>
      </div>

      {/* Tabs */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Recovery Centre sections"
        className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-hairline no-scrollbar"
      >
        {VALID_TABS.map((tabKey, idx) => {
          const isSelected = currentTab === tabKey;
          let count = 0;
          if (tabKey === "active") count = tripGroups.counts.activeRecovery;
          if (tabKey === "refunds") count = tripGroups.counts.refunds;
          if (tabKey === "history") count = tripGroups.counts.history;

          const isDisruptionTint =
            tabKey === "active" && tripGroups.hasUnrecoveredCancelled && count > 0;

          return (
            <button
              key={tabKey}
              role="tab"
              type="button"
              id={`tab-${tabKey}`}
              aria-selected={isSelected}
              aria-controls="recovery-panel"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleTabClick(tabKey)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all -mb-[1px] min-h-[40px] ${
                isSelected
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>{TAB_LABELS[tabKey]}</span>
              {count > 0 && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    isDisruptionTint
                      ? "bg-disruption-tint text-disruption border border-disruption/30 font-semibold"
                      : isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                  <span className="sr-only">({count} items)</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panel */}
      <section
        id="recovery-panel"
        role="tabpanel"
        aria-labelledby={`tab-${currentTab}`}
        className="space-y-4"
      >
        {/* TAB 1: ACTIVE RECOVERY */}
        {currentTab === "active" && (
          <div className="space-y-4">
            {attentionTrips.length === 0 ? (
              <div className="p-10 rounded-xl border border-border bg-surface text-center space-y-3 max-w-md mx-auto">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto stroke-[1.5]" aria-hidden="true" />
                <h2 className="text-sm font-medium text-foreground">
                  Nothing needs recovery right now.
                </h2>
                <p className="text-xs text-muted-foreground">
                  All active railway bookings are either on schedule or have been successfully recovered.
                </p>
                <div className="pt-2">
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
                  >
                    <span>View all trips</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  </Link>
                </div>
              </div>
            ) : (
              attentionTrips.map((trip) => {
                const seg = trip.segments[0];
                const stageRaw =
                  state.recoveryByTripId?.[trip.id] ??
                  (trip.id === state.selectedTripId ? state.recoveryStage : "progress");

                const isChoosingOption =
                  stageRaw === "alternatives" || stageRaw === "itinerary";
                const stageLabel = isChoosingOption
                  ? "Choosing an option"
                  : "Needs action";

                return (
                  <article
                    key={trip.id}
                    className="border border-border rounded-xl bg-surface p-5 space-y-4 text-foreground transition-all duration-150"
                    aria-label={`Active recovery for ${seg?.trainName}`}
                  >
                    {/* Header line: Route, Date, Stage Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="micro-label font-semibold text-disruption">
                            {trip.status === "cancelled" ? "CANCELLED TRAIN" : "DELAYED TRAIN"}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            • PNR {trip.pnr}
                          </span>
                        </div>
                        <h2 className="text-base font-semibold text-foreground mt-0.5">
                          {seg?.departureStation.city} ({seg?.departureStation.code}) →{" "}
                          {seg?.arrivalStation.city} ({seg?.arrivalStation.code})
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isChoosingOption
                              ? "bg-warning-tint text-foreground border border-warning/30"
                              : "bg-disruption-tint text-disruption border border-disruption/30"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
                          <span>Stage: {stageLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Disruption reason & Train details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="micro-label">ORIGINAL SCHEDULE</span>
                        <p className="font-mono text-foreground font-medium">
                          {seg?.trainName} #{seg?.trainNumber} · Class {trip.travelClass}
                        </p>
                        <p className="text-muted-foreground font-mono">
                          Dep: {formatDate(seg.departureTime)} at {formatTimeWithDay(seg.departureTime)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="micro-label">DISRUPTION CAUSE</span>
                        <p className="text-foreground">
                          {trip.disruptionReason || "Emergency operational maintenance and safety halt."}
                        </p>
                        {trip.neededByTime && (
                          <p className="text-muted-foreground font-mono">
                            Target arrival deadline: {formatTimeWithDay(trip.neededByTime)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-hairline">
                      <span className="text-xs font-mono text-muted-foreground">
                        Fare: {formatCurrency(trip.fare)}
                      </span>
                      <Link
                        href={`/recovery/${trip.id}`}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span>{isChoosingOption ? "Resume Selection" : "Find Alternative Trains"}</span>
                        <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: REFUNDS */}
        {currentTab === "refunds" && (
          <div className="space-y-4">
            {refundTrips.length === 0 ? (
              <div className="p-10 rounded-xl border border-border bg-surface text-center space-y-3 max-w-md mx-auto">
                <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto stroke-[1.5]" aria-hidden="true" />
                <h2 className="text-sm font-medium text-foreground">
                  No refund claims active.
                </h2>
                <p className="text-xs text-muted-foreground">
                  When Indian Railways cancels a ticket, full 100% refund tracking will automatically appear here.
                </p>
              </div>
            ) : (
              refundTrips.map((trip) => {
                const seg = trip.segments[0];
                return (
                  <article
                    key={trip.id}
                    className="border border-border rounded-xl bg-surface p-5 space-y-4 text-foreground"
                    aria-label={`Refund for ${seg?.trainName}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            PNR {trip.pnr}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs font-medium text-foreground">
                            Passenger: {trip.passengerName}
                          </span>
                        </div>
                        <h2 className="text-sm font-semibold text-foreground mt-0.5">
                          {seg?.trainName} ({seg?.trainNumber}) · {seg?.departureStation.city} → {seg?.arrivalStation.city}
                        </h2>
                      </div>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatCurrency(trip.refund?.refundAmount ?? trip.fare)}
                      </span>
                    </div>

                    {trip.refund && <RefundTrackerCard refund={trip.refund} />}
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {currentTab === "history" && (
          <div className="space-y-4">
            {historyTrips.length === 0 ? (
              <div className="p-10 rounded-xl border border-border bg-surface text-center space-y-3 max-w-md mx-auto">
                <Train className="w-10 h-10 text-muted-foreground mx-auto stroke-[1.5]" aria-hidden="true" />
                <h2 className="text-sm font-medium text-foreground">
                  No recovered journeys yet.
                </h2>
                <p className="text-xs text-muted-foreground">
                  Journeys resolved via TravelRescue replacement booking will appear here with ticket comparison.
                </p>
              </div>
            ) : (
              historyTrips.map((trip) => {
                const seg = trip.segments[0];

                return (
                  <article
                    key={trip.id}
                    className="border border-border rounded-xl bg-surface p-5 space-y-4 text-foreground"
                    aria-label={`Recovered trip ${seg?.trainName}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            RECOVERED JOURNEY
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            • Original PNR {trip.pnr}
                          </span>
                        </div>
                        <h2 className="text-base font-semibold text-foreground mt-0.5">
                          {seg?.departureStation.city} → {seg?.arrivalStation.city}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>View Ticket</span>
                        </Link>
                      </div>
                    </div>

                    {/* Original vs Replacement Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original cancelled/disrupted train */}
                      <div className="p-3.5 rounded-lg bg-background/60 border border-hairline space-y-1.5 text-xs">
                        <span className="micro-label text-muted-foreground">ORIGINAL DISRUPTED TRAIN</span>
                        <p className="font-medium text-muted-foreground line-through">
                          {trip.disruptionReason ? "Cancelled train" : "Original journey"}
                        </p>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Reason: {trip.disruptionReason || "Operational track maintenance"}
                        </p>
                      </div>

                      {/* Confirmed replacement */}
                      <div className="p-3.5 rounded-lg bg-success-tint/40 border border-success/30 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="micro-label text-success font-semibold">REPLACEMENT CONFIRMED</span>
                          <span className="font-mono text-[11px] font-semibold text-foreground">
                            Coach {trip.coach || "B4"} · {trip.berth || "23 · Lower"}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">
                          {seg?.trainName} #{seg?.trainNumber} · Class {trip.travelClass}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Dep: {formatTimeWithDay(seg.departureTime)} → Arr: {formatTimeWithDay(seg.arrivalTime, seg.dayOffset)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}
