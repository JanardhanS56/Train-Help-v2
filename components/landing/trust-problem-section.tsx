import React from "react";
import { TrainFront, Shield, RefreshCw, XCircle, CheckCircle2 } from "lucide-react";

export function TrustProblemSection() {
  return (
    <div className="space-y-20">
      {/* 1. Reassurance Trust Strip with Hairline Dividers */}
      <section
        aria-label="Platform assurances"
        className="border-y border-hairline bg-surface py-4 px-4 md:px-6"
      >
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-hairline text-xs text-muted-foreground">
          <div className="py-2.5 md:py-0 md:px-6 flex items-center gap-3 first:pl-0">
            <TrainFront className="w-4 h-4 text-primary shrink-0 stroke-[1.6]" />
            <span>Built around Indian train journeys</span>
          </div>

          <div className="py-2.5 md:py-0 md:px-6 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-success shrink-0 stroke-[1.8]" />
            <span>Refund tracking, step by step</span>
          </div>

          <div className="py-2.5 md:py-0 md:px-6 flex items-center gap-3 last:pr-0">
            <Shield className="w-4 h-4 text-primary shrink-0 stroke-[1.6]" />
            <span>Independent prototype · Preferences stored locally</span>
          </div>
        </div>
      </section>

      {/* 2. Problem / Promise Contrast Section */}
      <section
        aria-labelledby="heading-problem"
        className="max-w-[1120px] mx-auto px-4 md:px-6 space-y-10"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-primary block">
            THE REALITY OF CANCELLATIONS
          </span>
          <h2
            id="heading-problem"
            className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-foreground tracking-tight leading-[1.2]"
          >
            When a train is cancelled, you&apos;re left with 5 tabs and no plan.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unplanned rake cancellations create instant confusion. Here is how
            TravelRescue restores calm.
          </p>
        </div>

        {/* 2-Column Comparison with Hairline Divider (No nested cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-4 border-t border-hairline">
          {/* Without TravelRescue */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-disruption" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Without TravelRescue
              </h3>
            </div>

            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-disruption shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">
                    Call the helpline.
                  </strong>
                  <span className="text-xs">
                    Station inquiry counters get overcrowded within minutes of
                    announcements.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-disruption shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">
                    Refresh multiple websites.
                  </strong>
                  <span className="text-xs">
                    Manually switching between booking apps and live train status
                    trackers.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-disruption shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">
                    Guess what a waitlist means.
                  </strong>
                  <span className="text-xs">
                    Booking WL tickets without knowing if RAC or confirmed
                    coaches exist elsewhere.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* With TravelRescue */}
          <div className="space-y-5 md:border-l md:border-hairline md:pl-12">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                With TravelRescue
              </h3>
            </div>

            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">
                    One ranked list of alternatives.
                  </strong>
                  <span className="text-xs">
                    Confirmed berths shown first, filtered by your budget and
                    arrival deadline.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">
                    Refund progress in one place.
                  </strong>
                  <span className="text-xs">
                    Clear guidance on TDR automatic refund steps with zero
                    guesswork.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block font-medium">
                    A clearer recovery itinerary.
                  </strong>
                  <span className="text-xs">
                    Unified replacement journey details ready for platform
                    boarding.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
