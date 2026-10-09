"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Train,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  MapPin,
  Building2,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatTimeWithDay, formatCurrency } from "@/lib/format";
import { STATUS_CONFIG } from "@/lib/constants";
import { BookingModal } from "@/components/trips/booking-modal";
import { RefundTrackerCard } from "@/components/trips/refund-tracker-card";

interface TripDetailViewProps {
  tripId: string;
}

export function TripDetailView({ tripId }: TripDetailViewProps) {
  const { state } = useApp();
  const [bookingOpen, setBookingOpen] = useState(false);

  const trip = state.trips.find((t) => t.id === tripId) ?? state.trips[3];

  if (!trip) {
    return (
      <div className="py-12 text-center max-w-md mx-auto space-y-3">
        <h2 className="text-base font-bold text-foreground">
          Trip record not found
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          We could not locate railway booking records for this journey.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const segment = trip.segments[0];
  const statusCfg = STATUS_CONFIG[trip.status];
  const refund = trip.refund;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Trips</span>
        </Link>

        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-background transition-colors touch-target shadow-card"
        >
          View Ticket Details
        </button>
      </div>

      {/* Disruption Panel with Refund Tracker if Cancelled */}
      {trip.status === "cancelled" && (
        <section
          className="p-5 rounded-xl border border-disruption/30 bg-disruption/10 text-foreground space-y-4 shadow-card"
          aria-labelledby="disruption-heading"
        >
          <div className="flex items-center gap-2 text-disruption">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 id="disruption-heading" className="text-base font-bold">
              Your train has been cancelled
            </h2>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {segment.trainName} ({segment.trainNumber}) from {segment.departureStation.name} to {segment.arrivalStation.name} was cancelled.
            {trip.disruptionReason && ` Reason: ${trip.disruptionReason}.`}
            {trip.neededByTime && ` Target arrival by ${formatTimeWithDay(trip.neededByTime, segment.dayOffset)}.`}
          </p>

          {/* Refund Card with Tracker */}
          {refund && <RefundTrackerCard refund={refund} />}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/recovery/${trip.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-disruption text-white text-xs font-bold hover:opacity-90 transition-opacity touch-target shadow-card"
            >
              <span>Find Alternative Trains</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="px-4 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors touch-target"
            >
              View Ticket Details
            </button>
          </div>
        </section>
      )}

      {trip.status === "delayed" && (
        <section className="p-5 rounded-xl border border-warning/30 bg-warning/10 text-foreground space-y-2 shadow-card">
          <div className="flex items-center gap-2 text-warning">
            <Clock className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-bold">Train Delayed</h2>
          </div>
          <p className="text-sm text-foreground/90">
            {segment.trainName} ({segment.trainNumber}) is running behind schedule.
            {trip.disruptionReason && ` Reason: ${trip.disruptionReason}.`}
          </p>
        </section>
      )}

      {/* Main Train Journey Card */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground font-mono">
              PNR: {trip.pnr}
            </span>
            <h1 className="text-xl font-bold text-foreground mt-0.5">
              {segment.departureStation.city} to {segment.arrivalStation.city}
            </h1>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bgClass} ${statusCfg.colorClass}`}>
            <span>{statusCfg.label}</span>
          </div>
        </div>

        {/* Route Station Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 rounded-xl bg-background border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Departure</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatTimeWithDay(segment.departureTime)}
            </p>
            <p className="text-sm font-semibold text-primary">{segment.departureStation.code}</p>
            <p className="text-xs text-muted-foreground">{segment.departureStation.name}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {segment.platform ?? "Platform 1"}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center px-2 py-3 border-y md:border-y-0 md:border-x border-border">
            <Train className="w-5 h-5 text-primary mb-1" />
            <span className="text-xs font-semibold text-foreground">{segment.trainName}</span>
            <span className="text-xs text-muted-foreground font-mono">{segment.trainNumber}</span>
            <span className="text-[11px] text-muted-foreground mt-1">Direct (0 changes)</span>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-muted-foreground uppercase font-medium">Arrival</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
            </p>
            <p className="text-sm font-semibold text-primary">{segment.arrivalStation.code}</p>
            <p className="text-xs text-muted-foreground">{segment.arrivalStation.name}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Platform TBA
            </p>
          </div>
        </div>

        {/* Passenger, Class & Berth Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase">Passenger</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{trip.passengerName}</p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase">Class & Fare</span>
            </div>
            <p className="text-xs font-semibold text-foreground">
              Class {trip.travelClass} · {formatCurrency(trip.fare)}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium uppercase">Coach & Berth</span>
            </div>
            <p className="text-xs font-medium text-foreground">
              {trip.coach ? `Coach ${trip.coach} · ${trip.berth}` : "Berth TBA"}
            </p>
          </div>
        </div>
      </div>

      <BookingModal
        trip={trip}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </div>
  );
}
