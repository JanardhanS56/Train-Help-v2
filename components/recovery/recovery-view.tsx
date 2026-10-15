"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { RecoveryHeader } from "@/components/recovery/recovery-header";
import { RecoveryProgress } from "@/components/recovery/recovery-progress";
import { AlternativesFilters } from "@/components/recovery/alternatives-filters";
import { AlternativesList } from "@/components/recovery/alternatives-list";
import { ItineraryComparison } from "@/components/recovery/itinerary-comparison";
import { RecoverySuccess } from "@/components/recovery/recovery-success";
import { BookingModal } from "@/components/trips/booking-modal";

interface RecoveryViewProps {
  tripId: string;
}

export function RecoveryView({ tripId }: RecoveryViewProps) {
  const { state, alternatives } = useApp();
  const dispatch = useAppDispatch();
  const [bookingOpen, setBookingOpen] = useState(false);

  // Sync selected trip ID into context
  useEffect(() => {
    if (state.selectedTripId !== tripId) {
      dispatch({ type: "SELECT_TRIP", tripId });
    }
  }, [tripId, state.selectedTripId, dispatch]);

  const trip = state.trips.find((t) => t.id === tripId) ?? state.trips[3];

  if (!trip) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">Trip not found.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-primary underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Selected alternative (or default to top alternative)
  const selectedAlt =
    alternatives.find((a) => a.id === state.selectedAlternativeId) ??
    alternatives[0];

  const stage = state.recoveryStage;

  // If already recovered and stage is not explicitly itinerary/success
  if (trip.status === "recovered" && stage !== "success" && stage !== "itinerary") {
    return (
      <div className="max-w-2xl mx-auto py-10 space-y-6">
        <div className="p-6 rounded-xl border border-success/30 bg-success/10 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
          <h1 className="text-xl font-bold text-foreground">
            This disruption has already been recovered
          </h1>
          <p className="text-sm text-foreground/80 max-w-md mx-auto">
            Your alternative train has been confirmed and updated in your itinerary.
          </p>
          <div className="pt-2">
            <Link
              href={`/trips/${trip.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target"
            >
              View Updated Trip
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top breadcrumb */}
      {stage !== "success" && (
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {stage === "alternatives" && selectedAlt && (
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_RECOVERY_STAGE", stage: "itinerary" })}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
            >
              <span>Review selected ({selectedAlt.trainName})</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>
      )}

      {/* Disruption Header (hidden on success) */}
      {stage !== "success" && (
        <RecoveryHeader trip={trip} onViewBooking={() => setBookingOpen(true)} />
      )}

      {/* Stage Router */}
      {stage === "progress" && (
        <RecoveryProgress
          onComplete={() => dispatch({ type: "SET_RECOVERY_STAGE", stage: "alternatives" })}
        />
      )}

      {stage === "alternatives" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <AlternativesFilters />
          <AlternativesList />
        </div>
      )}

      {stage === "itinerary" && selectedAlt && (
        <ItineraryComparison
          trip={trip}
          alternative={selectedAlt}
          onConfirm={(result) =>
            dispatch({
              type: "CONFIRM_RECOVERY",
              tripId: trip.id,
              alternativeId: selectedAlt.id,
              newTrip: result?.newTrip,
              refundAmount: result?.refundAmount,
              newPnr: result?.pnr,
            })
          }
          onBack={() => dispatch({ type: "SET_RECOVERY_STAGE", stage: "alternatives" })}
        />
      )}

      {stage === "success" && selectedAlt && (
        <RecoverySuccess trip={trip} alternative={selectedAlt} />
      )}

      {/* Accessible Booking Modal */}
      <BookingModal
        trip={trip}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </div>
  );
}
