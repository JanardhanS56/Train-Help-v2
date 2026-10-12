import { Suspense } from "react";
import type { Metadata } from "next";
import { TripsView } from "@/components/trips/trips-view";

export const metadata: Metadata = {
  title: "My Trips · TravelRescue",
  description: "View all booked Indian Railways journeys, disruptions, and recovered tickets.",
};

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-96" />
          <div className="h-12 bg-muted rounded w-full mt-6" />
        </div>
      }
    >
      <TripsView />
    </Suspense>
  );
}
