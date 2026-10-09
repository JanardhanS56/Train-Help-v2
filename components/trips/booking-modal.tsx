"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Trip } from "@/lib/types";
import { formatTimeWithDay, formatDate, formatCurrency } from "@/lib/format";
import { Train, User, Ticket, Building2, MapPin } from "lucide-react";

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
      <DialogContent className="max-w-lg bg-surface p-6 rounded-xl border border-border shadow-card">
        <DialogHeader className="gap-1 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
              Railway Booking Details
            </span>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5">
              PNR: {trip.pnr}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {segment ? `${segment.departureStation.city} to ${segment.arrivalStation.city}` : "Trip Details"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Indian Railways reservation manifest & passenger itinerary
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-4 py-2 text-sm">
          {/* Passenger & PNR info */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-medium">Passenger</p>
                <p className="font-semibold text-foreground">{trip.passengerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ticket className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase font-medium">10-Digit PNR</p>
                <p className="font-mono text-xs text-foreground font-bold">
                  {trip.pnr}
                </p>
              </div>
            </div>
          </div>

          {/* Train Details */}
          {segment && (
            <div className="p-4 rounded-lg bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{segment.trainName}</span>
                  <span className="text-xs text-muted-foreground font-mono">({segment.trainNumber})</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDate(segment.departureTime)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {formatTimeWithDay(segment.departureTime)}
                  </p>
                  <p className="text-xs font-semibold text-primary">{segment.departureStation.code}</p>
                  <p className="text-[11px] text-muted-foreground">{segment.departureStation.name}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {segment.platform ?? "Platform 1"}
                  </p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[11px] text-muted-foreground">Direct</span>
                  <div className="w-20 h-px bg-border my-1 relative">
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-primary -top-[2px] left-1/2 -translate-x-1/2" />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
                  </p>
                  <p className="text-xs font-semibold text-primary">{segment.arrivalStation.code}</p>
                  <p className="text-[11px] text-muted-foreground">{segment.arrivalStation.name}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Platform TBA
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Class, Coach & Berth */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] uppercase font-medium">Travel Class</span>
              </div>
              <p className="font-semibold text-xs text-foreground">
                Class {trip.travelClass}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Fare: {formatCurrency(trip.fare)}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] uppercase font-medium">Coach & Berth</span>
              </div>
              <p className="font-semibold text-xs text-foreground">
                {trip.coach ? `Coach ${trip.coach} · ${trip.berth}` : "Berth to be allotted"}
              </p>
              <p className="text-[11px] text-success font-medium mt-0.5">
                Confirmed Reservation
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
