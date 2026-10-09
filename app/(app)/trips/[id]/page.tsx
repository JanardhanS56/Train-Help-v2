import type { Metadata } from "next";
import { TripDetailView } from "@/components/trips/trip-detail-view";

export const metadata: Metadata = {
  title: "Trip Details — TravelRescue",
  description: "View train details, PNR ticket manifest, and journey status.",
};

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  return <TripDetailView tripId={id} />;
}
