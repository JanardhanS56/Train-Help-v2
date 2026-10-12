"use client";

import { Check } from "lucide-react";
import type { RefundInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface RefundTrackerCardProps {
  refund: RefundInfo;
}

export function RefundTrackerCard({ refund }: RefundTrackerCardProps) {
  return (
    <div className="p-4 rounded-lg bg-surface border border-border text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <span className="font-medium text-foreground">
          100% Full Refund in Progress
        </span>
        <span className="font-mono font-semibold text-foreground">
          {formatCurrency(refund.refundAmount)} (Zero deductions)
        </span>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        {(["Requested", "Processing", "Refunded"] as const).map((step, idx) => {
          const isCompleted =
            refund.status === "Refunded" ||
            (refund.status === "Processing" && idx <= 1) ||
            (refund.status === "Requested" && idx === 0);

          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-medium mb-1 ${
                  isCompleted
                    ? "bg-success text-white"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2]" /> : idx + 1}
              </div>
              <span className={`text-[11px] ${isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-hairline flex flex-wrap justify-between text-[11px] text-muted-foreground">
        <span>Method: {refund.refundMethod}</span>
        <span>Credited within: {refund.expectedDays} business days</span>
      </div>
    </div>
  );
}
