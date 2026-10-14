"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Star,
  Droplets,
  Zap,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";
import {
  VibeSubmission,
  canSubmitVibeRating,
  recordVibeSubmission,
} from "@/lib/vibe/vibe-engine";
import { useAppDispatch } from "@/context/app-context";

interface VibeFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainNumber: string;
  trainName: string;
  onSubmitted?: () => void;
}

export function VibeFeedbackModal({
  open,
  onOpenChange,
  trainNumber,
  trainName,
  onSubmitted,
}: VibeFeedbackModalProps) {
  const dispatch = useAppDispatch();

  // Micro-feedback states
  const [water, setWater] = useState<"yes" | "low" | "none">("yes");
  const [sockets, setSockets] = useState<"all" | "some" | "broken">("all");
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<"on-time" | "moderate-crawl" | "heavy-delay">("on-time");
  const [isSuccess, setIsSuccess] = useState(false);
  const [blockedSec, setBlockedSec] = useState<number | null>(null);

  const cooldownCheck = open ? canSubmitVibeRating(trainNumber) : { allowed: true, remainingSec: 0 };
  const cooldownSec = blockedSec ?? (cooldownCheck.allowed ? 0 : cooldownCheck.remainingSec);

  function handleSubmit() {
    const check = canSubmitVibeRating(trainNumber);
    if (!check.allowed) {
      setBlockedSec(check.remainingSec);
      return;
    }

    const submission: VibeSubmission = {
      trainNumber,
      water,
      sockets,
      cleanliness,
      punctuality,
      submittedAt: Date.now(),
    };

    // Save to storage and dispatch to global state
    recordVibeSubmission(submission);
    dispatch({ type: "SUBMIT_VIBE_FEEDBACK", feedback: submission });

    setIsSuccess(true);
    if (onSubmitted) {
      onSubmitted();
    }

    setTimeout(() => {
      onOpenChange(false);
      setIsSuccess(false);
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-surface p-6 rounded-2xl border border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-hairline">
          <div className="flex items-center justify-between">
            <span className="micro-label text-primary font-semibold tracking-wider">
              COMMUNITY CROWDSOURCING
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              #{trainNumber}
            </span>
          </div>
          <DialogTitle className="text-lg font-display font-medium text-foreground">
            Coach Vibe & Hygiene Check
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {trainName} · Help fellow passengers with 1-tap live coach feedback
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-in zoom-in-75 duration-200" />
            <h3 className="text-sm font-semibold text-foreground">Rating Submitted!</h3>
            <p className="text-xs text-muted-foreground">
              Thank you! The live coach health meter has been updated for this train.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Cooldown notice if recent rating already submitted */}
            {cooldownSec > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  You submitted feedback recently. Cooldown active for {Math.ceil(cooldownSec / 60)} more minutes to prevent spam.
                </span>
              </div>
            )}

            {/* 1. Toilet Water Availability */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Water in Coach Toilets</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "yes", label: "Full / Available" },
                  { id: "low", label: "Low Flow" },
                  { id: "none", label: "Empty / None" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWater(item.id as "yes" | "low" | "none")}
                    className={`h-8 rounded-lg border text-xs font-medium transition-colors ${
                      water === item.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Charging Sockets Functional */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Mobile Charging Sockets</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All Working" },
                  { id: "some", label: "Some Faulty" },
                  { id: "broken", label: "None / Dead" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSockets(item.id as "all" | "some" | "broken")}
                    className={`h-8 rounded-lg border text-xs font-medium transition-colors ${
                      sockets === item.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Overall Coach Cleanliness Score */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Coach Cleanliness ({cleanliness} of 5 Stars)</span>
              </label>
              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCleanliness(star)}
                    className="p-1 rounded hover:scale-110 transition-transform"
                    aria-label={`${star} star rating`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= cleanliness
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Punctuality Vibe */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Punctuality Vibe</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "on-time", label: "On Time" },
                  { id: "moderate-crawl", label: "Moderate Crawl" },
                  { id: "heavy-delay", label: "Heavy Delay" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPunctuality(item.id as "on-time" | "moderate-crawl" | "heavy-delay")}
                    className={`h-8 rounded-lg border text-xs font-medium transition-colors ${
                      punctuality === item.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-hairline flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Anonymous & verified via GPS
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={cooldownSec > 0}
                className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Submit Vibe</span>
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
