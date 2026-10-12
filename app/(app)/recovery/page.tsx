import { Suspense } from "react";
import type { Metadata } from "next";
import { RecoveryCentreView } from "@/components/recovery/recovery-centre-view";

export const metadata: Metadata = {
  title: "Recovery Centre · TravelRescue",
  description: "Track active train disruptions, automatic ticket refunds, and recovery alternatives.",
};

export default function RecoveryCentrePage() {
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
      <RecoveryCentreView />
    </Suspense>
  );
}
