"use client";

import { useState, useMemo } from "react";
import { Star, Zap, Droplets, Clock, ThumbsUp } from "lucide-react";
import { getAggregatedTrainVibe, TrainVibeMetrics } from "@/lib/vibe/vibe-engine";
import { VibeFeedbackModal } from "@/components/vibe/vibe-feedback-modal";
import { useApp } from "@/context/app-context";

interface TrainVibeMeterProps {
  trainNumber: string;
  trainName: string;
  className?: string;
  compact?: boolean;
}

export function TrainVibeMeter({
  trainNumber,
  trainName,
  className = "",
  compact = false,
}: TrainVibeMeterProps) {
  const { state } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Compute aggregated live metrics
  const metrics: TrainVibeMetrics = useMemo(() => {
    const submissions = state.vibeRatings?.[trainNumber] || [];
    return getAggregatedTrainVibe(trainNumber, submissions);
  }, [trainNumber, state.vibeRatings]);

  if (compact) {
    return (
      <>
        <div
          className={`flex items-center gap-3 text-[11px] text-muted-foreground font-mono ${className}`}
        >
          <span className="flex items-center gap-1 font-semibold text-amber-500 dark:text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{metrics.cleanlinessStarCount}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-foreground">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{metrics.workingSocketsPercent}% Sockets</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Droplets className="w-3 h-3" />
            <span>{metrics.waterLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-[10px] text-primary hover:underline font-sans ml-1"
          >
            Rate
          </button>
        </div>

        <VibeFeedbackModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          trainNumber={trainNumber}
          trainName={trainName}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`p-3.5 rounded-xl border border-border bg-neutral-tint/30 space-y-2.5 ${className}`}
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-hairline">
          <div className="flex items-center gap-1.5">
            <span className="micro-label font-semibold text-primary">
              CROWDSOURCED VIBE & CLEANLINESS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="h-6 px-2 rounded-md border border-border bg-surface hover:bg-muted text-[11px] font-medium text-foreground flex items-center gap-1 transition-colors"
          >
            <ThumbsUp className="w-3 h-3 text-primary" />
            <span>Rate Coach Vibe</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Cleanliness */}
          <div className="p-2 rounded-lg bg-surface border border-border/60">
            <span className="text-[10px] text-muted-foreground block">CLEANLINESS</span>
            <div className="flex items-center gap-1 mt-0.5 font-semibold text-foreground">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{metrics.cleanlinessStarCount}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                ({metrics.totalRatingsCount})
              </span>
            </div>
          </div>

          {/* 2. Sockets */}
          <div className="p-2 rounded-lg bg-surface border border-border/60">
            <span className="text-[10px] text-muted-foreground block">CHARGING PORTS</span>
            <div className="flex items-center gap-1 mt-0.5 font-semibold text-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono">{metrics.workingSocketsPercent}%</span>
              <span className="text-[10px] text-muted-foreground font-normal">working</span>
            </div>
          </div>

          {/* 3. Water supply */}
          <div className="p-2 rounded-lg bg-surface border border-border/60">
            <span className="text-[10px] text-muted-foreground block">TOILET WATER</span>
            <div className="flex items-center gap-1 mt-0.5 font-medium text-foreground text-[11px] truncate">
              <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate" title={metrics.waterLabel}>
                {metrics.waterLabel}
              </span>
            </div>
          </div>

          {/* 4. Punctuality */}
          <div className="p-2 rounded-lg bg-surface border border-border/60">
            <span className="text-[10px] text-muted-foreground block">PUNCTUALITY VIBE</span>
            <div className="flex items-center gap-1 mt-0.5 font-medium text-foreground text-[11px] truncate">
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{metrics.punctualityLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <VibeFeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        trainNumber={trainNumber}
        trainName={trainName}
      />
    </>
  );
}
