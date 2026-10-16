"use client";

import { useState } from "react";
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

  // Debounced live train search suggestion query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setRemoteTrains([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingRemote(true);
        const res = await fetch(`/api/sim/trains?q=${encodeURIComponent(searchQuery)}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (data.trains) {
            setRemoteTrains(data.trains);
          }
        }
      } catch (err) {
        console.warn("Live train search error:", err);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 160);

    return () => clearTimeout(timer);
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
                        t.train_number === selectedTrainNumber && "bg-blue-50/70 dark:bg-blue-950/40"
                      )}
                      onClick={() => {
                        onSelectTrain(t.train_number);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-14">
                          {t.train_number}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {t.train_name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                        {t.origin_station_code} → {t.destination_station_code}
                      </span>
                    </div>
                  ))}
                  {!isSearchingRemote && displayTrains.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
            <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-semibold text-purple-900 dark:text-purple-200">
              Replay Mode: {replayScenarioName || "Archived Scenario Run"}
            </span>
            {onExitReplay && (
              <button
                type="button"
                onClick={onExitReplay}
                className="ml-2 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center gap-1 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Exit Replay
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Presets:
            </span>
            <button
              type="button"
              onClick={() => onSelectPresetScenario("konkan")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800 transition-colors"
              title="Panchaganga Express 16595 with Chiplun-Ratnagiri Landslide"
            >
              Konkan (16595)
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetScenario("fog")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Karnataka Express 12627 with Kanpur-Prayagraj Fog Restriction"
            >
              Fog (12627)
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetScenario("ohe")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800 transition-colors"
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
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#1E3A5F]/10 dark:border-slate-800">
        {/* Play/Pause/Step/Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={cn(
              "px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95",
              isPlaying
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-[#1E3A5F] hover:bg-[#152a45] text-[#FAF7F2] dark:bg-blue-600 dark:hover:bg-blue-700"
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
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
            title="Step to next station"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
            title="Reset simulation to origin"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Multiplier Toggles */}
        <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono">
          <span className="text-[10px] text-slate-400 font-sans px-1 hidden sm:inline">Speed:</span>
          {([1, 2, 5, 10, 60] as SpeedMultiplier[]).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              className={cn(
                "px-2 py-1 rounded-lg font-bold transition-all",
                speedMultiplier === spd
                  ? "bg-[#1E3A5F] text-[#FAF7F2] dark:bg-blue-600 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
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
    </div>
  );
}
