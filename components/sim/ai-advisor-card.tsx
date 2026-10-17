"use client";

import type { CandidatePlan, Obstacle } from "@/lib/sim/types";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Eye,
  CheckCircle,
  ArrowRight,
  GitFork,
} from "lucide-react";

interface AiAdvisorCardProps {
  plans: CandidatePlan[];
  activeObstacle: Obstacle | null;
  selectedPlanId: string | null;
  onPreviewPlan: (plan: CandidatePlan | null) => void;
  onAcceptPlan: (plan: CandidatePlan) => void;
  isLoading?: boolean;
  className?: string;
}

export function AiAdvisorCard({
  plans,
  activeObstacle,
  selectedPlanId,
  onPreviewPlan,
  onAcceptPlan,
  isLoading = false,
  className,
}: AiAdvisorCardProps) {
  if (!activeObstacle && plans.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-surface/60 p-6 text-center space-y-2",
          className
        )}
      >
        <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-sm text-foreground">
          AI Dispatch Advisor Monitoring Corridor
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          No active track disruptions detected on the running schedule. Inject an obstacle above or
          select a preset scenario to see the AI agent compute multi-objective rerouting plans.
        </p>
      </div>
    );
  }

  const recommendedPlan = plans.find((p) => p.recommended) || plans[0];

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-md p-4 md:p-5 backdrop-blur-sm space-y-4",
        className
      )}
      aria-label="TravelRescue AI Rail Dispatch Advisor"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <BrainCircuit className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-1.5">
                AI Railway Dispatch Advisor
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Llama-3.3-70B
                </span>
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-criteria optimization: minimizing passenger delay, transfer friction, and section risk.
            </p>
          </div>
        </div>

        {recommendedPlan && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-success-tint text-success border border-success/30 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {recommendedPlan.confidence}% AI Confidence
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">
            Evaluating alternate track topology, loop lines, and connecting rakes...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isRec = plan.recommended;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl p-4 border transition-all flex flex-col justify-between relative",
                  isSelected
                    ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm"
                    : isRec
                    ? "bg-surface border-warning/50 shadow-2xs"
                    : "bg-surface border-border hover:border-muted-foreground/40"
                )}
              >
                {/* Recommended Badge */}
                {isRec && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-warning text-primary-foreground font-mono text-[10px] font-bold flex items-center gap-1 shadow-xs tracking-wider">
                    <Sparkles className="h-2.5 w-2.5" />
                    RECOMMENDED
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 dark:text-slate-500">
                        Option {plan.id.toUpperCase()} • {plan.actionType.replace("_", " ")}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight mt-0.5">
                        {plan.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {plan.headline}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Detour Stations route */}
                  {plan.detourStationCodes.length > 0 && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                      <GitFork className="h-3 w-3 text-blue-600 shrink-0" />
                      <span className="font-sans text-[10px] text-slate-400">Via:</span>
                      {plan.detourStationCodes.map((code, idx) => (
                        <span key={code} className="flex items-center gap-1">
                          <span className="font-bold">{code}</span>
                          {idx < plan.detourStationCodes.length - 1 && (
                            <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Impact Stats */}
                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-slate-100 dark:border-slate-800 text-center font-mono">
                    <div className="p-1 rounded bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">Delay</span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        +{plan.delayMinutes}m
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">Distance</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        +{plan.extraDistanceKm} km
                      </span>
                    </div>
                    <div className="p-1 rounded bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">Risk</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {plan.riskScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Bullet Reasoning */}
                  {plan.reasoning && plan.reasoning.length > 0 && (
                    <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1 list-disc list-inside">
                      {plan.reasoning.slice(0, 2).map((r, i) => (
                        <li key={i} className="truncate" title={r}>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions: Preview & Accept */}
                <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => onPreviewPlan(isSelected ? null : plan)}
                    className={cn(
                      "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isSelected ? "Hide Preview" : "Preview Detour"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onAcceptPlan(plan)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Accept Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
