import type { Metadata } from "next";
import { DashboardHeader } from "@/components/trips/dashboard-header";
import { TripList } from "@/components/trips/trip-list";

export const metadata: Metadata = {
  title: "Dashboard — TravelRescue",
  description: "View your upcoming trips and any active disruptions.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader />
      <TripList />
    </div>
  );
}
