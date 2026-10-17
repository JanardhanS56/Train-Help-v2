/**
 * components/sim/obstacle-dialog.tsx
 * Dialog for injecting realistic, position-aware Indian Railways disruptions.
 */

"use client";

import { useState, useMemo } from "react";
import type { Obstacle, ObstacleType, ObstacleEffect, SimScheduleStop } from "@/lib/sim/types";
import { createObstacle } from "@/lib/sim/obstacles";
import {
  getPlausibleHazardsForRoute,
  suggestRealisticObstacle,
  PlausibleHazardDefinition,
} from "@/lib/sim/hazards";
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
  Sparkles,
  Compass,
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

  // Determine current position / next upcoming segment along stops
  const currentStopIndex = useMemo(() => {
    if (stops.length === 0) return 0;
    const idx = stops.findIndex((s) => s.departureMin > currentMinute);
    return idx > 0 ? idx - 1 : 0;
  }, [stops, currentMinute]);

  const upcomingSegment = useMemo(() => {
    const s1 = stops[currentStopIndex] || stops[0];
    const s2 = stops[currentStopIndex + 1] || stops[1] || s1;
    return { s1, s2 };
  }, [stops, currentStopIndex]);

  // Geographically and seasonally plausible hazards for this specific train route
  const plausibleHazards = useMemo(() => {
    return getPlausibleHazardsForRoute(stops);
  }, [stops]);

  // Custom obstacle form state with fallback to upcoming segment
  const [customType, setCustomType] = useState<ObstacleType>("track_blockage");
  const [customTitle, setCustomTitle] = useState("Landslide & Debris Obstruction");
  const [customDesc, setCustomDesc] = useState("Unscheduled track blockage reported by divisional engineering staff.");
  const [userFromStn, setUserFromStn] = useState<string | null>(null);
  const [userToStn, setUserToStn] = useState<string | null>(null);
  const customFromStn = userFromStn ?? upcomingSegment.s1?.stationCode ?? "";
  const customToStn = userToStn ?? upcomingSegment.s2?.stationCode ?? "";
  const [customDuration, setCustomDuration] = useState(60);
  const [customUncertainty, setCustomUncertainty] = useState(15);
  const [customEffect, setCustomEffect] = useState<ObstacleEffect>("full_block");
  const [customSpeedCap, setCustomSpeedCap] = useState(30);

  const handleApplyPlausibleHazard = (hazard: PlausibleHazardDefinition) => {
    const fStn = upcomingSegment.s1?.stationCode || "STN1";
    const tStn = upcomingSegment.s2?.stationCode || "STN2";

    const newObstacle = createObstacle({
      type: hazard.type,
      title: hazard.title,
      description: hazard.descriptionTemplate(fStn, tStn),
      locationType: hazard.effect === "station_dwell" ? "station" : "segment",
      fromStationCode: fStn,
      toStationCode: tStn,
      stationCode: hazard.effect === "station_dwell" ? tStn : undefined,
      startMinute: Math.max(currentMinute + 2, upcomingSegment.s1?.departureMin || currentMinute),
      durationMinutes: hazard.defaultDurationMinutes,
      uncertaintyMinutes: hazard.uncertaintyMinutes,
      effect: hazard.effect,
      speedCapKmph: hazard.speedCapKmph,
    });

    onApplyObstacle(newObstacle);
    onClose();
  };

  const handleAutoSuggestRealistic = () => {
    const suggested = suggestRealisticObstacle(stops, currentMinute, currentStopIndex);
    if (suggested) {
      onApplyObstacle(suggested);
      onClose();
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const newObstacle = createObstacle({
      type: customType,
      title: customTitle,
      description: customDesc,
      locationType: customEffect === "station_dwell" ? "station" : "segment",
      fromStationCode: customFromStn,
      toStationCode: customToStn,
      stationCode: customEffect === "station_dwell" ? customToStn : undefined,
      startMinute: currentMinute + 2,
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
            Simulate realistic, geographically and seasonally plausible Indian Railways operational hazards.
            Kinematics braking and cascading delays apply strictly when the train arrives at the obstruction.
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

        {/* 1-Click Realistic Disruption Generator */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Route & Season Hazard Engine
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
              Injects an authentic disruption on the train&apos;s upcoming segment (
              <span className="font-mono font-medium">
                {upcomingSegment.s1?.stationCode} → {upcomingSegment.s2?.stationCode}
              </span>
              ).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoSuggestRealistic}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
          >
            Suggest Realistic Hazard
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            className={cn(
              "flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === "presets"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
            onClick={() => setActiveTab("presets")}
          >
            <Compass className="h-3.5 w-3.5" />
            Corridor-Plausible Hazards ({plausibleHazards.length})
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
            {plausibleHazards.map((hazard) => {
              return (
                <div
                  key={hazard.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {hazard.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {hazard.effect.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {hazard.descriptionTemplate(
                          upcomingSegment.s1?.stationCode || "Origin",
                          upcomingSegment.s2?.stationCode || "Next"
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyPlausibleHazard(hazard)}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shrink-0 shadow-2xs transition-colors"
                    >
                      Inject Ahead
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                    <span className="italic">{hazard.plausibilityNote}</span>
                    <span>Duration: ~{hazard.defaultDurationMinutes} min</span>
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
                    setCustomTitle("Dense Fog Visibility Speed Limit");
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
                  onChange={(e) => setUserFromStn(e.target.value)}
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
                  onChange={(e) => setUserToStn(e.target.value)}
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
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-xs"
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
