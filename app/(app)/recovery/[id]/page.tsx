import type { Metadata } from "next";
import { RecoveryView } from "@/components/recovery/recovery-view";

export const metadata: Metadata = {
  title: "Recovery — TravelRescue",
  description: "Review alternative trains and recover from your travel disruption.",
};

interface RecoveryPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecoveryPage({ params }: RecoveryPageProps) {
  const { id } = await params;
  return <RecoveryView tripId={id} />;
}
