"use client";

import { Receipt, CheckCircle2 } from "lucide-react";
import type { RefundInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface RefundTrackerCardProps {
  refund: RefundInfo;
}

export function RefundTrackerCard({ refund }: RefundTrackerCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-primary" />
          Automatic Refund Status
        </span>
        <span className="font-bold text-success font-mono">
          {formatCurrency(refund.refundAmount)} (100% full fare)
        </span>
      </div>

      {/* Visual Refund Tracker */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {(["Requested", "Processing", "Refunded"] as const).map((step, idx) => {
          const isCurrent = refund.status === step;
          const isCompleted =
            refund.status === "Refunded" ||
            (refund.status === "Processing" && idx <= 1) ||
            (refund.status === "Requested" && idx === 0);

          return (
            <div key={step} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                  isCompleted
                    ? "bg-success text-white"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  isCurrent ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border flex flex-wrap justify-between text-[11px] text-muted-foreground">
        <span>Method: {refund.refundMethod}</span>
        <span>Expected within: {refund.expectedDays} business days</span>
      </div>
    </div>
  );
}
