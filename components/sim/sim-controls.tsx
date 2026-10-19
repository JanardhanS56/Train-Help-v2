"use client";

import { useState, useEffect } from "react";
import type { SpeedMultiplier } from "@/lib/sim/clock";
import type { TrainSummary } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Clock,
  Sparkles,
  Search,
  Train,
  SlidersHorizontal,
  Save,
  History,
  LogOut,
  Keyboard,
  X,
} from "lucide-react";

interface SimControlsProps {
  trains: TrainSummary[];
  selectedTrainNumber: string;
  onSelectTrain: (trainNumber: string) => void;
  currentMinute: number;
  startMinute: number;
  endMinute: number;
  isPlaying: boolean;
  speedMultiplier: SpeedMultiplier;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: SpeedMultiplier) => void;
  onScrub: (minute: number) => void;
  onSelectPresetScenario: (scenarioId: string) => void;
  onOpenObstacleDialog: () => void;
  hasActiveObstacle: boolean;
  onSaveRun?: () => void;
  onLoadReplay?: () => void;
  isReplayMode?: boolean;
  onExitReplay?: () => void;
  replayScenarioName?: string;
  className?: string;
}

export function SimControls({
  trains,
  selectedTrainNumber,
  onSelectTrain,
  currentMinute,
  startMinute,
  endMinute,
  isPlaying,
  speedMultiplier,
  onTogglePlay,
  onStepForward,
  onReset,
  onChangeSpeed,
  onScrub,
  onSelectPresetScenario,
  onOpenObstacleDialog,
  hasActiveObstacle,
  onSaveRun,
  onLoadReplay,
  isReplayMode,
  onExitReplay,
  replayScenarioName,
  className,
}: SimControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [remoteTrains, setRemoteTrains] = useState<TrainSummary[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);

  // Keyboard navigation and playback hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === "ArrowRight" || e.key === "]") {
        e.preventDefault();
        onStepForward();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        onReset();
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        onSelectPresetScenario("demo");
      } else if (e.key === "1") {
        onChangeSpeed(1);
      } else if (e.key === "2") {
        onChangeSpeed(2);
      } else if (e.key === "3") {
        onChangeSpeed(5);
      } else if (e.key === "4") {
        onChangeSpeed(10);
      } else if (e.key === "5") {
        onChangeSpeed(60);
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsHotkeysOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, onStepForward, onReset, onSelectPresetScenario, onChangeSpeed]);

  // Debounced live train search suggestion query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setIsSearchingRemote(true);
        const res = await fetch(`/api/sim/trains?q=${encodeURIComponent(trimmed)}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.trains) {
            setRemoteTrains(data.trains);
          }
        }
      } catch (err) {
        console.warn("Live train search error:", err);
      } finally {
        if (active) setIsSearchingRemote(false);
      }
    }, 160);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const localFilteredTrains = trains.filter(
    (t) =>
      t.train_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.train_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.origin_station_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination_station_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayTrains = searchQuery.trim() && remoteTrains.length > 0 ? remoteTrains : localFilteredTrains;

  const selectedTrain =
    trains.find((t) => t.train_number === selectedTrainNumber) ||
    remoteTrains.find((t) => t.train_number === selectedTrainNumber);

  // Time formatting
  const formatTime = (mins: number) => {
    const d = Math.floor(mins / 1440);
    const rem = mins % 1440;
    const h = Math.floor(rem / 60);
    const m = rem % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return d > 0 ? `${timeStr} (+${d}d)` : timeStr;
  };

  const totalMinutes = Math.max(1, endMinute - startMinute);
  const elapsedMinutes = Math.max(0, currentMinute - startMinute);
  const progressRatio = Math.min(1, Math.max(0, elapsedMinutes / totalMinutes));

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1E3A5F]/15 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-900/90 shadow-sm p-4 md:p-5 backdrop-blur-sm space-y-4",
        className
      )}
      aria-label="Simulation Playback and Configuration Controls"
    >
      {/* Top Section: Train Selector & Instant Scenarios */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Train Combobox */}
        <div className="relative flex-1 max-w-xl">
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer hover:border-[#1E3A5F]/40 transition-all"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Train className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400 shrink-0" />
            <div className="flex-1 truncate">
              {selectedTrain ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1E3A5F] dark:text-blue-300">
                    {selectedTrain.train_number}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedTrain.train_name}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    ({selectedTrain.origin_station_code} → {selectedTrain.destination_station_code})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Select a train to simulate...</span>
              )}
            </div>
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-72 flex flex-col">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <input
                    type="text"
                    placeholder="Search 250 curated trains by name, number, station..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {isSearchingRemote && (
                    <div className="p-3 text-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Searching trains...
                    </div>
                  )}
                  {displayTrains.slice(0, 50).map((t) => (
                    <div
                      key={t.train_number}
                      className={cn(
                        "px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors",
                        t.train_number === selectedTrainNumber && "bg-primary/10 text-primary"
                      )}
                      onClick={() => {
                        onSelectTrain(t.train_number);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-foreground w-14">
                          {t.train_number}
                        </span>
                        <span className="font-medium text-foreground truncate">
                          {t.train_name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0 ml-2">
                        {t.origin_station_code} → {t.destination_station_code}
                      </span>
                    </div>
                  ))}
                  {!isSearchingRemote && displayTrains.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No trains found matching &quot;{searchQuery}&quot;. Try searching &quot;raj-&quot; or &quot;exp&quot;.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Replay Mode Header or 1-Click Preset Scenario Buttons */}
        {isReplayMode ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary">
              Replay Mode: {replayScenarioName || "Archived Scenario Run"}
            </span>
            {onExitReplay && (
              <button
                type="button"
                onClick={onExitReplay}
                className="ml-2 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-surface border border-border text-foreground hover:bg-muted flex items-center gap-1 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Exit Replay
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectPresetScenario("demo")}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98] mr-1"
              title="Launch instant 1-Click Disruption Simulation Showcase"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-200" />
              <span>1-Click Demo</span>
            </button>
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => onSelectPresetScenario("konkan")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 transition-colors"
              title="Mao Jan Shatabdi 12051 with Chiplun-Ratnagiri Landslide"
            >
              Konkan (12051)
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetScenario("fog")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              title="Karnataka Express 12627 with Agra-Mathura Fog Restriction"
            >
              Fog (12627)
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetScenario("ohe")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
              title="Bengaluru Rajdhani 22691 with Bhopal OHE Cable Snap"
            >
              OHE Snap (22691)
            </button>

            {onLoadReplay && (
              <button
                type="button"
                onClick={onLoadReplay}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800 flex items-center gap-1 transition-colors"
                title="Browse and load past simulation runs from Supabase"
              >
                <History className="h-3 w-3" />
                Replays
              </button>
            )}

            {onSaveRun && (
              <button
                type="button"
                onClick={onSaveRun}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1 transition-colors"
                title="Save current run telemetry & events to Supabase"
              >
                <Save className="h-3 w-3" />
                Save Run
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsHotkeysOpen(true)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 flex items-center gap-1 transition-colors"
              title="Keyboard shortcuts & hotkeys (?)"
            >
              <Keyboard className="h-3 w-3" />
              Hotkeys
            </button>
          </div>
        )}
      </div>

      {/* Middle Section: Scrub Bar Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Dep: {formatTime(startMinute)}
          </span>
          <span className="font-bold text-[#1E3A5F] dark:text-blue-300 text-sm">
            Sim Clock: {formatTime(currentMinute)} ({Math.round(progressRatio * 100)}%)
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Term: {formatTime(endMinute)}
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={startMinute}
            max={endMinute}
            value={currentMinute}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1E3A5F] dark:accent-blue-500"
            aria-label="Simulation timeline scrubber"
          />
        </div>
      </div>

      {/* Bottom Bar: Playback Controls & Speed Acceleration */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border">
        {/* Play/Pause/Step/Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={cn(
              "px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95",
              isPlaying
                ? "bg-warning hover:bg-warning/80 text-primary-foreground"
                : "bg-primary hover:bg-primary-hover text-primary-foreground"
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Play Simulation
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepForward}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-muted shadow-2xs transition-colors"
            title="Step to next station"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-xl bg-surface border border-border text-foreground hover:bg-muted shadow-2xs transition-colors"
            title="Reset simulation to origin"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Multiplier Toggles */}
        <div className="flex items-center gap-1.5 bg-surface/70 p-1 rounded-xl border border-border text-xs font-mono">
          <span className="text-[10px] text-muted-foreground font-sans px-1 hidden sm:inline">Speed:</span>
          {([1, 2, 5, 10, 60] as SpeedMultiplier[]).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              className={cn(
                "px-2 py-1 rounded-lg font-bold transition-all",
                speedMultiplier === spd
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Inject Obstacle Trigger */}
        <div>
          <button
            type="button"
            onClick={onOpenObstacleDialog}
            className={cn(
              "px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border transition-all active:scale-95 shadow-2xs",
              hasActiveObstacle
                ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 ring-2 ring-rose-400/20"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {hasActiveObstacle ? "Manage Active Obstacle" : "+ Inject Track Obstacle"}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      {isHotkeysOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotkeys-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsHotkeysOpen(false)}
        >
          <div
            className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="hotkeys-modal-title" className="font-bold text-sm">Simulation Keyboard Shortcuts</h3>
                  <p className="text-xs text-muted-foreground">Quick keyboard navigation & playback controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHotkeysOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close keyboard shortcuts dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40">
                <span className="text-foreground">Play / Pause simulation</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">Space</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40">
                <span className="text-foreground">Step to next station halt</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">→</kbd>
                  <span className="text-muted-foreground">or</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">]</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40">
                <span className="text-foreground">Reset simulation to origin</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">R</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40">
                <span className="text-foreground">Launch 1-Click Demo scenario</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">D</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40">
                <span className="text-foreground">Speed multiplier (1x, 2x, 5x, 10x, 60x)</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">1</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">2</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">3</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">4</kbd>
                  <kbd className="px-1.5 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">5</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/40">
                <span className="text-foreground">Toggle hotkeys cheat sheet</span>
                <kbd className="px-2 py-0.5 rounded-md bg-surface border border-border font-mono font-semibold shadow-2xs">?</kbd>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsHotkeysOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
