"use client";

import { useState } from "react";
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
  Copy,
  Check,
  Columns,
  FileText,
  X,
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
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const generateDispatchReport = () => {
    const active = activeObstacle
      ? `${activeObstacle.title} (${activeObstacle.type})`
      : "Standard Schedule Optimization";

    const lines = [
      "# TravelRescue AI Railway Dispatch Incident Report",
      `Generated: ${new Date().toUTCString()}`,
      `Disruption: ${active}`,
      "",
      "## Candidate Recovery Strategies",
      ...plans.map((p) => {
        const isRec = p.recommended ? " [RECOMMENDED]" : "";
        const isSel = p.id === selectedPlanId ? " [ACTIVE]" : "";
        return [
          `### Option ${p.id.toUpperCase()}: ${p.title}${isRec}${isSel}`,
          `- Headline: ${p.headline}`,
          `- Est. Delay: +${p.delayMinutes} mins`,
          `- Extra Mileage: +${p.extraDistanceKm} km`,
          `- Section Risk Score: ${p.riskScore}/100 (Confidence: ${p.confidence}%)`,
          `- Detour Stations: ${p.detourStationCodes.length > 0 ? p.detourStationCodes.join(" -> ") : "Direct line"}`,
          `- Dispatch Rationale: ${p.description}`,
        ].join("\n");
      }),
      "",
      "---",
      "Confidential - Indian Railways AI Operations Resiliency Layer",
    ];

    const reportText = lines.join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(reportText).then(() => {
        setCopiedReport(true);
        setTimeout(() => setCopiedReport(false), 2500);
      });
    }
  };
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

        <div className="flex flex-wrap items-center gap-2">
          {plans.length > 1 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-muted flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Compare candidate recovery plans side-by-side"
            >
              <Columns className="h-3.5 w-3.5 text-primary" />
              <span>Compare Matrix</span>
            </button>
          )}

          {plans.length > 0 && (
            <button
              type="button"
              onClick={generateDispatchReport}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-muted flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Copy structured dispatch incident report to clipboard"
            >
              {copiedReport ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Export Report</span>
                </>
              )}
            </button>
          )}

          {recommendedPlan && (
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-success-tint text-success border border-success/30 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {recommendedPlan.confidence}% AI Confidence
            </span>
          )}
        </div>
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

      {/* Side-by-side Candidate Plan Comparison Matrix Modal */}
      {isCompareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsCompareOpen(false)}
        >
          <div
            className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Columns className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="compare-modal-title" className="font-bold text-sm md:text-base">
                    Candidate Recovery Plan Comparison Matrix
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Evaluate operational trade-offs across delay, distance, safety, and confidence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close comparison dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1 py-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Option</th>
                    <th className="py-2.5 px-3">Strategy Title</th>
                    <th className="py-2.5 px-3 font-mono">Delay</th>
                    <th className="py-2.5 px-3 font-mono">Distance</th>
                    <th className="py-2.5 px-3 font-mono">Risk Index</th>
                    <th className="py-2.5 px-3 font-mono">Confidence</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    const isRec = p.recommended;

                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          isSelected ? "bg-primary/5 font-semibold" : ""
                        )}
                      >
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold">{p.id.toUpperCase()}</span>
                          {isRec && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-warning/20 text-warning font-bold">
                              REC
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">{p.title}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{p.headline}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400 font-bold">
                          +{p.delayMinutes}m
                        </td>
                        <td className="py-3 px-3 font-mono text-muted-foreground">
                          +{p.extraDistanceKm} km
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {p.riskScore}/100
                        </td>
                        <td className="py-3 px-3 font-mono text-primary font-bold">
                          {p.confidence}%
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              onPreviewPlan(isSelected ? null : p);
                              setIsCompareOpen(false);
                            }}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                          >
                            {isSelected ? "Hide" : "Preview"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onAcceptPlan(p);
                              setIsCompareOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs transition-colors"
                          >
                            Adopt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Showing {plans.length} computed recovery alternatives
              </span>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover shadow-2xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
