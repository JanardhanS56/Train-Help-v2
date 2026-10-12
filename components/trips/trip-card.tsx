"use client";

import { TripRow } from "@/components/trips/trip-row";
import type { Trip } from "@/lib/types";

interface TripCardProps {
  trip: Trip;
  onViewBooking: (trip: Trip) => void;
}

export function TripCard({ trip, onViewBooking }: TripCardProps) {
  return <TripRow trip={trip} onViewBooking={onViewBooking} />;
}
