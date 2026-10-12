"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatTimeWithDay, formatDate, formatCurrency } from "@/lib/format";
import { STATUS_CONFIG } from "@/lib/constants";

interface TripRowProps {
  trip: Trip;
  onViewBooking: (trip: Trip) => void;
  isEarlier?: boolean;
}

const STATUS_ICONS = {
  "on-time": CheckCircle,
  delayed: Clock,
  cancelled: XCircle,
  recovered: RefreshCw,
};

export function TripRow({ trip, onViewBooking, isEarlier = false }: TripRowProps) {
  const segment = trip.segments[0];
  const statusCfg = STATUS_CONFIG[trip.status];
  const StatusIcon = STATUS_ICONS[trip.status] ?? CheckCircle;

  return (
    <article
      className={`border rounded-lg bg-surface interactive-row transition-all duration-150 ${
        isEarlier
          ? "border-hairline bg-surface/80 p-3.5 text-xs text-muted-foreground"
          : "border-border p-4 text-foreground"
      }`}
      aria-label={`${segment.trainName} from ${segment.departureStation.city} to ${segment.arrivalStation.city}`}
    >
      {/* Desktop Horizontal Row */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* 1. Date Block */}
        <div className="w-20 shrink-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {formatDate(segment.departureTime).split(" ").slice(1, 3).join(" ")}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            PNR {trip.pnr}
          </p>
        </div>

        {/* 2. Train and Route */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-baseline gap-2">
            <h3 className="font-medium text-foreground text-sm truncate">
              {segment.departureStation.city} → {segment.arrivalStation.city}
            </h3>
            <span className="text-xs text-muted-foreground truncate">
              {segment.trainName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
            <span>#{segment.trainNumber}</span>
            <span>•</span>
            <span>Class {trip.travelClass}</span>
            {trip.coach && (
              <>
                <span>•</span>
                <span>{trip.coach} · {trip.berth}</span>
              </>
            )}
          </div>
        </div>

        {/* 3. Mono Times */}
        <div className="w-44 shrink-0 text-left">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTimeWithDay(segment.departureTime)}
            </span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
            </span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {segment.departureStation.code} to {segment.arrivalStation.code}
          </p>
        </div>

        {/* 4. Status Badge */}
        <div className="w-32 shrink-0 flex items-center justify-start">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bgClass} ${statusCfg.colorClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5 stroke-[1.5] shrink-0" aria-hidden="true" />
            <span>{statusCfg.label}</span>
          </span>
        </div>

        {/* 5. Quiet Action */}
        <div className="w-32 shrink-0 flex items-center justify-end gap-2">
          {trip.status === "cancelled" ? (
            <Link
              href={`/recovery/${trip.id}`}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>Recover</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : trip.status === "recovered" ? (
            <Link
              href={`/trips/${trip.id}`}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View New Ticket</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onViewBooking(trip)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              View booking
            </button>
          )}
        </div>
      </div>

      {/* Mobile Stacked Card (< 768px) */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {formatDate(segment.departureTime)}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              · PNR {trip.pnr}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bgClass} ${statusCfg.colorClass}`}
          >
            <StatusIcon className="w-3 h-3 stroke-[1.5] shrink-0" aria-hidden="true" />
            <span>{statusCfg.label}</span>
          </span>
        </div>

        <div>
          <h3 className="font-medium text-foreground text-sm">
            {segment.departureStation.city} → {segment.arrivalStation.city}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {segment.trainName} · #{segment.trainNumber} · Class {trip.travelClass}
          </p>
        </div>

        {/* Departure & Arrival separated by hairline */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-hairline text-xs">
          <div>
            <span className="micro-label block">DEPARTURE</span>
            <span className="font-mono font-medium text-foreground">
              {formatTimeWithDay(segment.departureTime)}
            </span>
            <span className="text-muted-foreground font-mono block text-[11px]">
              {segment.departureStation.code}
            </span>
          </div>
          <div>
            <span className="micro-label block">ARRIVAL</span>
            <span className="font-mono font-medium text-foreground">
              {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
            </span>
            <span className="text-muted-foreground font-mono block text-[11px]">
              {segment.arrivalStation.code}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-hairline">
          <span className="font-mono text-xs text-muted-foreground">
            {formatCurrency(trip.fare)}
          </span>
          <button
            type="button"
            onClick={() => onViewBooking(trip)}
            className="text-xs font-medium text-primary hover:underline touch-target flex items-center"
          >
            View booking details →
          </button>
        </div>
      </div>
    </article>
  );
}
