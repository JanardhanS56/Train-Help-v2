"use client";

import { useState } from "react";
import type { Obstacle, ObstacleType, ObstacleEffect, SimScheduleStop } from "@/lib/sim/types";
import { OBSTACLE_PRESETS, createObstacle } from "@/lib/sim/obstacles";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface ObstacleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stops: SimScheduleStop[];
  currentMinute: number;
  activeObstacle: Obstacle | null;
  onApplyObstacle: (obstacle: Obstacle) => void;
  onClearObstacle: () => void;
}

export function ObstacleDialog({
  isOpen,
  onClose,
  stops,
  currentMinute,
  activeObstacle,
  onApplyObstacle,
  onClearObstacle,
}: ObstacleDialogProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");

  // Custom obstacle form state
  const [customType, setCustomType] = useState<ObstacleType>("track_blockage");
  const [customTitle, setCustomTitle] = useState("Landslide & Debris Obstruction");
  const [customDesc, setCustomDesc] = useState("Unscheduled track blockage reported by divisional engineering staff.");
  const [customFromStn, setCustomFromStn] = useState(stops[0]?.stationCode || "");
  const [customToStn, setCustomToStn] = useState(stops[1]?.stationCode || "");
  const [customDuration, setCustomDuration] = useState(60);
  const [customUncertainty, setCustomUncertainty] = useState(15);
  const [customEffect, setCustomEffect] = useState<ObstacleEffect>("full_block");
  const [customSpeedCap, setCustomSpeedCap] = useState(30);

  const handleApplyPreset = (presetObstacle: Obstacle) => {
    // Adapt preset timing relative to current train run
    const obstacleWithRunTiming: Obstacle = {
      ...presetObstacle,
      startMinute: Math.max(currentMinute, presetObstacle.startMinute),
    };
    onApplyObstacle(obstacleWithRunTiming);
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const newObstacle = createObstacle({
      type: customType,
      title: customTitle,
      description: customDesc,
      locationType: "segment",
      fromStationCode: customFromStn,
      toStationCode: customToStn,
      startMinute: currentMinute + 5,
      durationMinutes: customDuration,
      uncertaintyMinutes: customUncertainty,
      effect: customEffect,
      speedCapKmph: customEffect === "speed_restriction" ? customSpeedCap : undefined,
    });
    onApplyObstacle(newObstacle);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-[#FAF7F2] dark:bg-slate-900 border border-[#1E3A5F]/20 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Inject Track Obstacle / Disruption
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Introduce real-world Indian Railways disruptions to test dynamic kinematics braking,
            accumulated delay propagation, and AI reroute recommendation.
          </DialogDescription>
        </DialogHeader>

        {/* Active Obstacle Notice if exists */}
        {activeObstacle && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Active Disruption: {activeObstacle.title}
              </div>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                Location: {activeObstacle.fromStationCode || activeObstacle.stationCode}
                {activeObstacle.toStationCode ? ` → ${activeObstacle.toStationCode}` : ""} •{" "}
                {activeObstacle.durationMinutes} mins ({activeObstacle.effect.replace("_", " ")})
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClearObstacle();
                onClose();
              }}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-xs transition-colors shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Disruption
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            className={cn(
              "flex-1 py-1.5 rounded-lg transition-all",
              activeTab === "presets"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab("presets")}
          >
            Curated Real-World Presets
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-1.5 rounded-lg transition-all",
              activeTab === "custom"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab("custom")}
          >
            Custom Segment Disruption
          </button>
        </div>

        {/* Presets List */}
        {activeTab === "presets" && (
          <div className="space-y-2.5 pt-1">
            {OBSTACLE_PRESETS.map((preset) => {
              const obs = preset.obstacle;
              return (
                <div
                  key={preset.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {obs.effect.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {obs.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(obs)}
                      className="px-3 py-1.5 rounded-lg bg-[#1E3A5F] hover:bg-[#152a45] text-[#FAF7F2] dark:bg-blue-600 dark:hover:bg-blue-700 text-xs font-semibold shrink-0 shadow-2xs transition-colors"
                    >
                      Inject Scenario
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                    <span>Corridor: {preset.corridor}</span>
                    <span>•</span>
                    <span>Duration: ~{obs.durationMinutes} min (±{obs.uncertaintyMinutes}m)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Disruption Form */}
        {activeTab === "custom" && (
          <form onSubmit={handleApplyCustom} className="space-y-3 pt-1 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Disruption Type
              </label>
              <select
                value={customType}
                onChange={(e) => {
                  const val = e.target.value as ObstacleType;
                  setCustomType(val);
                  if (val === "fog_restriction") {
                    setCustomEffect("speed_restriction");
                    setCustomTitle("Dense Fog Visual Speed Limit");
                  } else if (val === "signal_failure") {
                    setCustomEffect("station_dwell");
                    setCustomTitle("RRI Signal Failure & Manual Clamping");
                  } else {
                    setCustomEffect("full_block");
                    setCustomTitle("Track Obstruction / Rail Fracture");
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="track_blockage">Track Blockage (Landslide, Boulder, Waterlogging)</option>
                <option value="ohe_failure">Overhead Electrification (OHE) Wire Snap</option>
                <option value="disabled_train">Disabled Freight / Preceding Train Breakdown</option>
                <option value="signal_failure">Automatic Signalling / Interlocking Failure</option>
                <option value="fog_restriction">Dense Fog Safety Restriction</option>
                <option value="bridge_inspection">Major Bridge Precautionary Speed Restriction</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  From Station
                </label>
                <select
                  value={customFromStn}
                  onChange={(e) => setCustomFromStn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                >
                  {stops.map((s) => (
                    <option key={s.stationCode} value={s.stationCode}>
                      {s.stationCode} - {s.stationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  To Station
                </label>
                <select
                  value={customToStn}
                  onChange={(e) => setCustomToStn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                >
                  {stops.map((s) => (
                    <option key={s.stationCode} value={s.stationCode}>
                      {s.stationCode} - {s.stationName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={10}
                  max={480}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Uncertainty (±m)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={customUncertainty}
                  onChange={(e) => setCustomUncertainty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Effect
                </label>
                <select
                  value={customEffect}
                  onChange={(e) => setCustomEffect(e.target.value as ObstacleEffect)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="full_block">Full Block</option>
                  <option value="speed_restriction">Speed Restriction</option>
                  <option value="station_dwell">Station Dwell</option>
                </select>
              </div>
            </div>

            {customEffect === "speed_restriction" && (
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Speed Restriction Cap (km/h)
                </label>
                <input
                  type="number"
                  min={10}
                  max={60}
                  value={customSpeedCap}
                  onChange={(e) => setCustomSpeedCap(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Disruption Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description & Impact Context
              </label>
              <textarea
                rows={2}
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#152a45] text-[#FAF7F2] dark:bg-blue-600 dark:hover:bg-blue-700 font-semibold shadow-xs"
              >
                Inject Disruption
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
