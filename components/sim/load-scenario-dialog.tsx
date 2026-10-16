"use client";

import { useState, useEffect } from "react";
import { History, X, Play, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface ScenarioSummary {
  id: string;
  name: string;
  trainNumber: string;
  createdAt: string;
  obstacleCount: number;
}

interface LoadScenarioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string) => Promise<void>;
}

export function LoadScenarioDialog({
  isOpen,
  onClose,
  onSelectScenario,
}: LoadScenarioDialogProps) {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = () => {
    setIsLoading(true);
    setError(null);
    fetch("/api/sim/scenarios")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch scenarios");
        return res.json();
      })
      .then((data) => {
        setScenarios(data.scenarios || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load scenarios from database.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    if (isOpen) {
      fetch("/api/sim/scenarios")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch scenarios");
          return res.json();
        })
        .then((data) => {
          if (active) {
            setScenarios(data.scenarios || []);
          }
        })
        .catch((err) => {
          if (active) {
            console.error(err);
            setError("Unable to load scenarios from database.");
          }
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  async function handleLoad(id: string) {
    try {
      setLoadingId(id);
      await onSelectScenario(id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to load scenario details.");
    } finally {
      setLoadingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#FAF7F2] dark:bg-slate-900 border border-[#1E3A5F]/20 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]/10 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Load Scenario Replay
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchScenarios}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refresh scenario list"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 shrink-0">
          Select any past scenario recorded in Supabase to inspect and replay telemetry at 1x, 2x, 5x, or 10x speeds.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading && scenarios.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E3A5F]" />
              Loading scenarios from Supabase...
            </div>
          ) : scenarios.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No saved scenarios found. Run a simulation and click &quot;Save Run&quot; to archive a replay session.
            </div>
          ) : (
            scenarios.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-[#1E3A5F]/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Train {s.trainNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>{new Date(s.createdAt).toLocaleDateString()} at {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>•</span>
                    <span>{s.obstacleCount} obstacle(s)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLoad(s.id)}
                  disabled={loadingId === s.id}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#152a45] dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
                >
                  {loadingId === s.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  Replay
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-[#1E3A5F]/10 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
