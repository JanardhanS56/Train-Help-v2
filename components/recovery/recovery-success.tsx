"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Calendar, Share2 } from "lucide-react";
import type { Trip, Alternative } from "@/lib/types";
import { formatTime, formatDate, formatTimeWithDay } from "@/lib/format";

interface RecoverySuccessProps {
  trip: Trip;
  alternative: Alternative;
}

export function RecoverySuccess({ trip, alternative }: RecoverySuccessProps) {
  const [copiedShare, setCopiedShare] = useState(false);

  // Deterministic refund reference
  const refundRef = `REF-IRCTC-${trip.pnr.slice(0, 6)}`;
  const hasRefund = (trip.refund?.refundAmount ?? 0) > 0 || (trip.fare > alternative.fare);
  const refundAmount = trip.refund?.refundAmount ?? (trip.fare > alternative.fare ? trip.fare - alternative.fare : 0);

  function handleAddToCalendar() {
    const title = `Train: ${alternative.trainName} (#${alternative.trainNumber})`;
    const description = `Recovery Train from ${alternative.fromStation.name} (${alternative.fromStation.code}) to ${alternative.toStation.name} (${alternative.toStation.code}). PNR: ${trip.pnr}. Class: ${alternative.travelClass}.`;
    const location = `${alternative.fromStation.name} Railway Station`;

    const start = new Date(alternative.departureTime)
      .toISOString()
      .replace(/-|:|\.\d+/g, "");
    const end = new Date(alternative.arrivalTime)
      .toISOString()
      .replace(/-|:|\.\d+/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TravelRescue//Train Recovery//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `train-${alternative.trainNumber}-recovery.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    const shareText = `My train journey has been recovered! New Train: ${alternative.trainName} (#${alternative.trainNumber}) from ${alternative.fromStation.code} to ${alternative.toStation.code}. PNR: ${trip.pnr}.`;

    if (navigator.share) {
      navigator.share({
        title: "Train Recovery Details",
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6 text-center animate-in fade-in-50 duration-200">
      {/* Success Headline & One success-coloured check icon (no confetti) */}
      <div className="space-y-3">
        <div className="w-12 h-12 rounded-full bg-success-tint border border-success/30 text-success flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 stroke-[2]" aria-hidden="true" />
        </div>
        <h1 className="text-[32px] font-display text-foreground tracking-tight leading-tight">
          You&rsquo;re back on track
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your replacement train has been confirmed. Your updated railway ticket details are below.
        </p>
      </div>

      {/* Signature Element: Confirmed Railway Ticket-Stub Card */}
      <article
        className="w-full bg-surface border border-border rounded-xl p-6 text-left space-y-4 relative overflow-hidden"
        aria-label="Confirmed replacement railway ticket"
      >
        {/* Top Ticket Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hairline text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="micro-label text-success font-semibold tracking-wider">
              CONFIRMED RAILWAY MANIFEST
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasRefund && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                Refund Ref: {refundRef}
              </span>
            )}
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-background border border-border text-foreground">
              PNR {trip.pnr}
            </span>
          </div>
        </div>

        {/* Train & Route in Display Font */}
        <div>
          <h2 className="text-xl font-display font-medium text-foreground">
            {alternative.trainName}
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
            <span>#{alternative.trainNumber}</span>
            <span>•</span>
            <span>Class {alternative.travelClass} ({alternative.coachBerth ?? "Coach B4 · Berth 23"})</span>
            <span>•</span>
            <span>{alternative.changes === 0 ? "Direct" : "1 change"}</span>
          </div>
        </div>

        {/* Dotted Route Line with Station Codes & Train Icon */}
        <div className="ticket-route-line my-3">
          <div className="w-full flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{alternative.fromStation.name} ({alternative.fromStation.code})</span>
            <span>{alternative.toStation.name} ({alternative.toStation.code})</span>
          </div>
        </div>

        {/* Departure & Arrival: Label-over-value separated by hairline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-hairline text-xs">
          <div>
            <span className="micro-label block">BOARDING</span>
            <p className="font-mono text-base font-semibold text-foreground mt-0.5">
              {formatTime(alternative.departureTime)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {alternative.fromStation.code} · {formatDate(alternative.departureTime)}
            </p>
          </div>

          <div>
            <span className="micro-label block">ARRIVAL</span>
            <p className="font-mono text-base font-semibold text-success mt-0.5">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {alternative.toStation.code} · {formatDate(alternative.arrivalTime)}
            </p>
          </div>

          <div>
            <span className="micro-label block">PASSENGER</span>
            <p className="text-sm font-medium text-foreground mt-1">
              {trip.passengerName}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">Adult (Confirm)</p>
          </div>

          <div>
            <span className="micro-label block">PLATFORM</span>
            <p className="font-mono text-sm font-semibold text-foreground mt-1">
              Platform 1 ({alternative.fromStation.code})
            </p>
            <p className="text-[11px] text-muted-foreground">Standard gate access</p>
          </div>
        </div>

        {/* Signature Element: Dashed Stub Divider with Notch Cutouts */}
        <div className="relative flex items-center my-4 -mx-6" aria-hidden="true">
          <div className="w-3.5 h-6 bg-background border-y border-r border-border rounded-r-full -ml-px flex-shrink-0" />
          <div className="flex-1 border-t border-dashed border-border mx-2" />
          <div className="w-3.5 h-6 bg-background border-y border-l border-border rounded-l-full -mr-px flex-shrink-0" />
        </div>

        {/* Counterfoil Metadata */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground font-mono pt-1">
          <span>Fare: ₹{alternative.fare} (Confirmed)</span>
          {hasRefund ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Refund ₹{refundAmount} processing to original payment method
            </span>
          ) : (
            <span>Original ticket refund: 100% full refund active</span>
          )}
        </div>
      </article>

      {/* Secondary Quick Share / Calendar Actions */}
      <div className="flex items-center justify-center gap-3 no-print">
        <button
          type="button"
          onClick={handleAddToCalendar}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors shadow-sm"
        >
          <Calendar className="w-3.5 h-3.5 stroke-[1.5] text-primary" />
          <span>Add to Calendar</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors shadow-sm"
        >
          {copiedShare ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2] text-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 stroke-[1.5] text-primary" />
              <span>Share Itinerary</span>
            </>
          )}
        </button>
      </div>

      {/* Action Buttons: Exactly ONE primary, ONE secondary */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href={`/trips/${trip.id}`}
          className="w-full sm:w-auto h-10 px-5 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span>View Trip Details</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto h-10 px-5 rounded-[8px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors flex items-center justify-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
