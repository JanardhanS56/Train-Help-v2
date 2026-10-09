"use client";

import Link from "next/link";
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  Train,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { Trip, TripStatus } from "@/lib/types";
import { formatTimeWithDay, formatDate } from "@/lib/format";
import { STATUS_CONFIG } from "@/lib/constants";

interface TripCardProps {
  trip: Trip;
  onViewBooking: (trip: Trip) => void;
}

const STATUS_ICONS: Record<TripStatus, typeof CheckCircle> = {
  "on-time": CheckCircle,
  delayed: Clock,
  cancelled: XCircle,
  recovered: RefreshCw,
};

export function TripCard({ trip, onViewBooking }: TripCardProps) {
  const segment = trip.segments[0];
  const statusCfg = STATUS_CONFIG[trip.status];
  const StatusIcon = STATUS_ICONS[trip.status];

  // Button hierarchy: Solid primary ONLY for the key action on disrupted trip
  const isCancelled = trip.status === "cancelled";
  const isDelayed = trip.status === "delayed";

  const primaryAction = (() => {
    switch (trip.status) {
      case "cancelled":
        return {
          label: "Find Alternatives",
          href: `/recovery/${trip.id}`,
          isSolidPrimary: true,
        };
      case "delayed":
        return {
          label: "View Status",
          href: `/trips/${trip.id}`,
          isSolidPrimary: true,
        };
      case "recovered":
        return {
          label: "View New Itinerary",
          href: `/trips/${trip.id}`,
          isSolidPrimary: false,
        };
      case "on-time":
      default:
        return {
          label: "View Trip",
          href: `/trips/${trip.id}`,
          isSolidPrimary: false,
        };
    }
  })();

  const borderClass = isCancelled
    ? "border-l-4 border-l-disruption border-y border-r border-border"
    : isDelayed
    ? "border-l-4 border-l-warning border-y border-r border-border"
    : "border border-border";

  return (
    <article
      className={`bg-surface rounded-xl p-5 shadow-card transition-all hover:border-muted-foreground/30 flex flex-col justify-between gap-4 ${borderClass}`}
      aria-labelledby={`trip-heading-${trip.id}`}
    >
      <div>
        {/* Header: PNR & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-background border border-border text-foreground">
              PNR: {trip.pnr}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(segment.departureTime)}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bgClass} ${statusCfg.colorClass}`}
            role="status"
          >
            <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{statusCfg.label}</span>
          </div>
        </div>

        {/* Route City and Codes */}
        <h2
          id={`trip-heading-${trip.id}`}
          className="text-lg font-semibold text-foreground flex items-center gap-2"
        >
          <span>{segment.departureStation.city}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span>{segment.arrivalStation.city}</span>
        </h2>

        {/* Train Name, Number & Class */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 mb-4">
          <Train className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span className="font-medium text-foreground">{segment.trainName}</span>
          <span>•</span>
          <span className="font-mono">{segment.trainNumber}</span>
          <span>•</span>
          <span className="font-semibold text-primary">{trip.travelClass}</span>
        </div>

        {/* Departure & Arrival Times Grid */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-background border border-border text-xs">
          <div>
            <p className="text-muted-foreground uppercase text-[10px] tracking-wider font-medium">Departure</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {formatTimeWithDay(segment.departureTime)}
            </p>
            <p className="text-muted-foreground">{segment.departureStation.code} · {segment.departureStation.city}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-[10px] tracking-wider font-medium">Arrival</p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
            </p>
            <p className="text-muted-foreground">{segment.arrivalStation.code} · {segment.arrivalStation.city}</p>
          </div>
        </div>

        {/* Cancelled Disruption Alert Strip */}
        {isCancelled && (
          <div className="mt-3 p-3 rounded-lg bg-disruption/10 border border-disruption/20 text-xs text-disruption space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Train Cancelled</span>
            </div>
            <p className="text-[11px] text-foreground/85 leading-relaxed">
              {trip.disruptionReason ?? "Emergency track maintenance and interlocking works."}
            </p>
            <p className="text-[11px] font-semibold text-primary pt-0.5">
              Full refund of ₹{trip.fare} is being processed.
            </p>
          </div>
        )}

        {/* Delayed Disruption Alert Strip */}
        {isDelayed && (
          <div className="mt-3 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning flex items-start gap-2">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Train Delayed</p>
              <p className="text-[11px] text-foreground/80 mt-0.5">
                {trip.disruptionReason ?? "Late running of inbound rake from car shed."}
              </p>
            </div>
          </div>
        )}

        {/* On-Time Useful Line */}
        {trip.status === "on-time" && (
          <div className="mt-3 p-2.5 rounded-lg bg-background border border-border text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-medium text-foreground">
              {trip.onTimeNote ?? "Check-in opens at 05:15 at Platform 1"}
            </span>
          </div>
        )}

        {/* Recovered Note */}
        {trip.status === "recovered" && (
          <div className="mt-3 p-2.5 rounded-lg bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-medium">
              Recovered onto {segment.trainName} ({segment.coach ?? "B4"}, {segment.berth ?? "Berth 23"})
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons: Solid primary only for key action on disrupted trip */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Link
          href={primaryAction.href}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-semibold transition-opacity duration-150 touch-target flex items-center justify-center gap-1.5 ${
            primaryAction.isSolidPrimary
              ? isCancelled
                ? "bg-disruption text-white hover:opacity-90 shadow-card"
                : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-card"
              : "border border-border bg-surface text-foreground hover:bg-background"
          }`}
        >
          <span>{primaryAction.label}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={() => onViewBooking(trip)}
          className="py-2 px-3 rounded-lg text-xs font-medium border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-background transition-colors touch-target"
        >
          View Ticket
        </button>
      </div>
    </article>
  );
}
