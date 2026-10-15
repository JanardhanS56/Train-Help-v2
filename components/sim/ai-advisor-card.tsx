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
          "rounded-2xl border border-dashed border-[#1E3A5F]/20 dark:border-slate-800 bg-[#FAF7F2]/60 dark:bg-slate-900/40 p-6 text-center space-y-2",
          className
        )}
      >
        <div className="h-10 w-10 mx-auto rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          AI Dispatch Advisor Monitoring Corridor
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
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
        "rounded-2xl border border-[#1E3A5F]/20 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-900/95 shadow-md p-4 md:p-5 backdrop-blur-sm space-y-4",
        className
      )}
      aria-label="TravelRescue AI Rail Dispatch Advisor"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E3A5F]/10 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1E3A5F] to-blue-700 text-white flex items-center justify-center shadow-xs">
            <BrainCircuit className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                AI Railway Dispatch Advisor
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                  Llama-3.3-70B
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-criteria optimization: minimizing passenger delay, transfer friction, and section risk.
            </p>
          </div>
        </div>

        {recommendedPlan && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {recommendedPlan.confidence}% AI Confidence
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="animate-spin h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
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
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                    : isRec
                    ? "bg-white/80 dark:bg-slate-800/80 border-amber-300 dark:border-amber-700/80 shadow-2xs"
                    : "bg-white/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300"
                )}
              >
                {/* Recommended Badge */}
                {isRec && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center gap-1 shadow-xs tracking-wider">
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
                <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onPreviewPlan(isSelected ? null : plan)}
                    className={cn(
                      "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isSelected ? "Hide Preview" : "Preview Detour"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onAcceptPlan(plan)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-[#1E3A5F] hover:bg-[#152a45] text-[#FAF7F2] dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
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
