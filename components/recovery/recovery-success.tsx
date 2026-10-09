"use client";

import Link from "next/link";
import { CheckCircle2, Train, ArrowRight, ShieldCheck, User } from "lucide-react";
import type { Trip, Alternative } from "@/lib/types";
import { formatTime, formatDate, formatTimeWithDay } from "@/lib/format";

interface RecoverySuccessProps {
  trip: Trip;
  alternative: Alternative;
}

export function RecoverySuccess({ trip, alternative }: RecoverySuccessProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 text-center animate-in fade-in-50 zoom-in-95 duration-200">
      {/* Success Badge & Headline */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto shadow-card">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          You&rsquo;re back on track
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your replacement train has been confirmed. We have updated your itinerary and issued your new ticket details.
        </p>
      </div>

      {/* Confirmed Itinerary Card */}
      <div className="bg-surface rounded-xl border border-success/30 p-6 shadow-card text-left space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-success">
              Confirmed Train Manifest
            </span>
          </div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-background border border-border">
            PNR: {trip.pnr}
          </span>
        </div>

        {/* Train & Route */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Train className="w-4 h-4 text-primary" />
            <span className="font-bold text-base text-foreground">
              {alternative.trainName} (#{alternative.trainNumber})
            </span>
            <span className="text-xs text-muted-foreground">
              ({alternative.changes === 0 ? "Direct" : "1 Change"})
            </span>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              Class {alternative.travelClass} · {alternative.coachBerth ?? "Coach B4 · Berth 23 (Lower)"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {alternative.fromStation.city} ({alternative.fromStation.code}) to {alternative.toStation.city} ({alternative.toStation.code})
          </p>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-background border border-border text-xs">
          <div>
            <p className="text-muted-foreground uppercase text-[10px] font-semibold">Boarding Time</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{formatTime(alternative.departureTime)}</p>
            <p className="text-muted-foreground">{alternative.fromStation.code} · {formatDate(alternative.departureTime)}</p>
          </div>
          <div>
            <p className="text-muted-foreground uppercase text-[10px] font-semibold">Arrival Time</p>
            <p className="text-lg font-bold text-success mt-0.5">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </p>
            <p className="text-muted-foreground">{alternative.toStation.code} · {formatDate(alternative.arrivalTime)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 gap-2">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Passenger: {trip.passengerName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Boarding Platform 1 (SBC)</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href={`/trips/${trip.id}`}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card flex items-center justify-center gap-1.5"
        >
          <span>View Trip Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-xs font-semibold hover:bg-background transition-colors touch-target"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
