import type { Metadata } from "next";
import { DashboardHeader } from "@/components/trips/dashboard-header";
import { TripList } from "@/components/trips/trip-list";

export const metadata: Metadata = {
  title: "Dashboard — TravelRescue",
  description: "View your upcoming trips and any active disruptions.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <section aria-labelledby="trips-section-title">
        <div className="flex items-center justify-between mb-4">
          <h2 id="trips-section-title" className="text-lg font-bold text-foreground">
            Your Trips
          </h2>
          <span className="text-xs text-muted-foreground">
            Live status monitored automatically
          </span>
        </div>
        <TripList />
      </section>
    </div>
  );
}
