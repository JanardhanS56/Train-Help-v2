"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Save, X, Loader2 } from "lucide-react";

interface SaveScenarioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  eventCount: number;
  obstacleCount: number;
  onSave: (name: string, description: string) => Promise<void>;
}

export function SaveScenarioDialog({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  eventCount,
  obstacleCount,
  onSave,
}: SaveScenarioDialogProps) {
  const [name, setName] = useState(`Run: ${trainNumber} - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      setError(null);
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save scenario to Supabase.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#FAF7F2] dark:bg-slate-900 border border-[#1E3A5F]/20 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]/10 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Save Simulation Run
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Train:</strong> {trainName} ({trainNumber})
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Session Snapshot:</strong> {eventCount} recorded events • {obstacleCount} obstacle(s)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scenario Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] text-slate-900 dark:text-slate-100"
              placeholder="e.g., Landslide Divert Test"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F] text-slate-900 dark:text-slate-100 resize-none"
              placeholder="Operational notes, weather conditions, or dispatch outcome..."
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A5F]/10 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#152a45] dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-all",
                isSaving && "opacity-75 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving to Supabase...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Scenario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
