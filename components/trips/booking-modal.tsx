"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Trip } from "@/lib/types";
import { formatTimeWithDay, formatDate, formatCurrency } from "@/lib/format";

interface BookingModalProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ trip, open, onOpenChange }: BookingModalProps) {
  if (!trip) return null;
  const segment = trip.segments[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-surface p-6 rounded-xl border border-border">
        <DialogHeader className="gap-1 pb-2 border-b border-hairline">
          <div className="flex items-center justify-between">
            <span className="micro-label">
              RESERVATION MANIFEST
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-background border border-border text-foreground">
              PNR {trip.pnr}
            </span>
          </div>
          <DialogTitle className="text-xl font-display font-medium text-foreground">
            {segment ? `${segment.departureStation.city} to ${segment.arrivalStation.city}` : "Trip Details"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Indian Railways reservation manifest & passenger itinerary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Passenger & Train info */}
          <div className="grid grid-cols-2 gap-4 pb-3 border-b border-hairline">
            <div>
              <span className="micro-label block">PASSENGER</span>
              <p className="font-medium text-foreground text-sm mt-0.5">{trip.passengerName}</p>
            </div>
            <div>
              <span className="micro-label block">TRAIN</span>
              <p className="font-medium text-foreground text-sm mt-0.5">
                {segment.trainName}
                <span className="font-mono text-xs text-muted-foreground ml-1">#{segment.trainNumber}</span>
              </p>
            </div>
          </div>

          {/* Dotted Route Line with train icon */}
          <div className="ticket-route-line my-2">
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{segment.departureStation.name}</span>
              <span>{segment.arrivalStation.name}</span>
            </div>
          </div>

          {/* Times: Departure & Arrival */}
          <div className="grid grid-cols-2 gap-4 py-3 border-y border-hairline">
            <div>
              <span className="micro-label block">DEPARTURE</span>
              <p className="font-mono text-base font-semibold text-foreground mt-0.5">
                {formatTimeWithDay(segment.departureTime)}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {segment.departureStation.code} · {formatDate(segment.departureTime)}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                {segment.platform ?? "Platform 1"}
              </p>
            </div>

            <div>
              <span className="micro-label block">ARRIVAL</span>
              <p className="font-mono text-base font-semibold text-foreground mt-0.5">
                {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {segment.arrivalStation.code} · {formatDate(segment.arrivalTime)}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                Platform TBA
              </p>
            </div>
          </div>

          {/* Coach, Berth & Fare */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="micro-label block">COACH & BERTH</span>
              <p className="font-mono text-xs font-medium text-foreground mt-0.5">
                {trip.coach ? `Coach ${trip.coach} · ${trip.berth}` : "Berth pending chart"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Class {trip.travelClass}
              </p>
            </div>

            <div>
              <span className="micro-label block">TOTAL FARE</span>
              <p className="font-mono text-xs font-semibold text-foreground mt-0.5">
                {formatCurrency(trip.fare)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Confirmed Manifest
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
