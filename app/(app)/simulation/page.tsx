"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { TrainSummary, TrainWithStops, DbRailLink } from "@/lib/data/types";
import type {
  SimScheduleStop,
  SimPosition,
  Obstacle,
  CandidatePlan,
} from "@/lib/sim/types";
import { expandSchedule } from "@/lib/sim/schedule";
import { calculatePosition } from "@/lib/sim/movement";
import { SpeedMultiplier } from "@/lib/sim/clock";
import { generateCandidatePlans } from "@/lib/sim/planner";
import { OBSTACLE_PRESETS } from "@/lib/sim/obstacles";
import {
  type SimScenarioRun,
  type TelemetrySnapshot,
  type SimEventRecord,
  createTelemetrySnapshot,
} from "@/lib/sim/persistence";
import { interpolateReplayPosition } from "@/lib/sim/replay";
import { publishSimDisruption, clearSimDisruption } from "@/lib/sim/disruption-bridge";
import { SimMap } from "@/components/sim/sim-map";
import { SimHud } from "@/components/sim/sim-hud";
import { SimTimeline } from "@/components/sim/sim-timeline";
import { SimControls } from "@/components/sim/sim-controls";
import { ObstacleDialog } from "@/components/sim/obstacle-dialog";
import { SaveScenarioDialog } from "@/components/sim/save-scenario-dialog";
import { LoadScenarioDialog } from "@/components/sim/load-scenario-dialog";
import { AiAdvisorCard } from "@/components/sim/ai-advisor-card";
import { SimEventLog, SimEventItem } from "@/components/sim/sim-event-log";
import {
  Train,
  Info,
  RefreshCw,
} from "lucide-react";

function formatSimTime(mins: number): string {
  const d = Math.floor(mins / 1440);
  const rem = mins % 1440;
  const h = Math.floor(rem / 60);
  const m = rem % 60;
  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return d > 0 ? `${timeStr} (+${d}d)` : timeStr;
}

export default function SimulationPage() {
  // 1. Data state
  const [trainsList, setTrainsList] = useState<TrainSummary[]>([]);
  const [currentTrain, setCurrentTrain] = useState<TrainWithStops | null>(null);
  const [railLinks, setRailLinks] = useState<DbRailLink[]>([]);
  const [, setIsLoading] = useState(true);

  // 2. Simulation dynamic state
  const [stops, setStops] = useState<SimScheduleStop[]>([]);
  const [simMinute, setSimMinute] = useState<number>(360);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(10);
  const [activeObstacle, setActiveObstacle] = useState<Obstacle | null>(null);
  const [isObstacleDialogOpen, setIsObstacleDialogOpen] = useState<boolean>(false);

  // 3. AI Advisor & Plan preview state
  const [candidatePlans, setCandidatePlans] = useState<CandidatePlan[]>([]);
  const [previewPlan, setPreviewPlan] = useState<CandidatePlan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // 4. Telemetry occurrence log & Persistence history
  const [events, setEvents] = useState<SimEventItem[]>([]);
  const simEventsHistoryRef = useRef<SimEventRecord[]>([]);
  const telemetrySnapshotsRef = useRef<TelemetrySnapshot[]>([]);

  // 5. Replay & Persistence dialog state
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [replayScenarioRun, setReplayScenarioRun] = useState<SimScenarioRun | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState<boolean>(false);
  const activeDisruptionIdRef = useRef<string | null>(null);

  // 6. Animation loop references
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastLoggedStopIndexRef = useRef<number>(-1);
  const simMinuteRef = useRef<number>(simMinute);

  useEffect(() => {
    simMinuteRef.current = simMinute;
  }, [simMinute]);

  // Add event helper
  const addEvent = useCallback(
    (type: SimEventItem["type"], title: string, detail: string, minute?: number) => {
      const min = minute ?? simMinuteRef.current;
      setEvents((prev) => [
        {
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          minute: min,
          type,
          title,
          detail,
        },
        ...prev.slice(0, 49),
      ]);

      simEventsHistoryRef.current.push({
        tOffsetMs: Date.now(),
        kind: type === "obstacle" ? "disruption" : type === "reroute" ? "reroute" : type === "departure" ? "departure" : type === "arrival" ? "arrival" : type === "halt" ? "halt" : "info",
        payload: { title, detail, minute: min },
      });
    },
    []
  );

  // Fetch full details of selected train
  const loadTrain = useCallback(async (trainNumber: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sim/trains/${trainNumber}`);
      if (!res.ok) throw new Error("Train not found");
      const data = await res.json();
      const train: TrainWithStops = data.train;

      setCurrentTrain(train);
      const expanded = expandSchedule(train);
      setStops(expanded);

      const startMin = expanded[0]?.departureMin ?? 360;
      setSimMinute(startMin);
      setIsPlaying(false);
      setActiveObstacle(null);
      setCandidatePlans([]);
      setPreviewPlan(null);
      setSelectedPlanId(null);
      lastLoggedStopIndexRef.current = -1;

      setEvents([
        {
          id: `init-${Date.now()}`,
          minute: startMin,
          type: "info",
          title: `Loaded ${train.train_name} (${train.train_number})`,
          detail: `Schedule expanded across ${expanded.length} stops from ${expanded[0]?.stationName} to ${expanded[expanded.length - 1]?.stationName}.`,
        },
      ]);
    } catch (err) {
      console.error("Error loading train details:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial train list and links
  useEffect(() => {
    async function initData() {
      try {
        setIsLoading(true);
        const [trainsRes, linksRes] = await Promise.all([
          fetch("/api/sim/trains"),
          fetch("/api/sim/links"),
        ]);

        const trainsData = await trainsRes.json();
        const linksData = await linksRes.json();

        setTrainsList(trainsData.trains || []);
        setRailLinks(linksData.links || []);

        // Default to 22691 (Bengaluru Rajdhani) or first train
        const defaultTrainNumber = "22691";
        await loadTrain(defaultTrainNumber);
      } catch (err) {
        console.error("Failed to load simulation data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, [loadTrain]);

  // Compute instantaneous position using deterministic kinematics (or replay interpolation)
  const position: SimPosition = useMemo(() => {
    if (isReplayMode && replayScenarioRun && replayScenarioRun.telemetrySnapshots.length > 0) {
      return interpolateReplayPosition(
        replayScenarioRun.telemetrySnapshots,
        simMinute,
        activeObstacle
      );
    }

    if (stops.length === 0) {
      return {
        currentMinute: simMinute,
        state: "scheduled",
        latitude: 20.5937,
        longitude: 78.9629,
        distanceKm: 0,
        currentSpeedKmph: 0,
        maxSpeedKmph: 110,
        currentStopIndex: 0,
        nextStopIndex: 1,
        currentStationCode: null,
        nextStationCode: null,
        delayMinutes: 0,
        activeObstacleId: null,
        statusMessage: "Initializing simulation engine...",
      };
    }
    return calculatePosition(
      stops,
      simMinute,
      activeObstacle ? [activeObstacle] : [],
      currentTrain?.train_type || "Superfast Express"
    );
  }, [isReplayMode, replayScenarioRun, stops, simMinute, activeObstacle, currentTrain?.train_type]);

  // Periodic telemetry snapshot accumulation during live simulation
  useEffect(() => {
    if (isReplayMode || stops.length === 0) return;
    const snaps = telemetrySnapshotsRef.current;
    const lastSnap = snaps[snaps.length - 1];
    if (!lastSnap || Math.abs(position.currentMinute - lastSnap.minute) >= 2) {
      const snap = createTelemetrySnapshot(position, Date.now());
      snaps.push(snap);
      if (snaps.length > 800) {
        snaps.shift();
      }
    }
  }, [position, isReplayMode, stops.length]);

  // Telemetry stop logger
  useEffect(() => {
    if (stops.length === 0) return;
    if (
      position.currentStopIndex !== lastLoggedStopIndexRef.current &&
      position.currentStopIndex >= 0
    ) {
      const stop = stops[position.currentStopIndex];
      if (stop) {
        if (position.currentStopIndex === 0) {
          addEvent(
            "departure",
            `Departed Origin: ${stop.stationName} (${stop.stationCode})`,
            `Commenced scheduled run on track section at ${formatSimTime(simMinute)}.`,
            simMinute
          );
        } else {
          addEvent(
            position.state === "dwelling" ? "halt" : "arrival",
            `At Station: ${stop.stationName} (${stop.stationCode})`,
            `Distance: ${stop.distanceKm} km. Halt window: ${stop.haltMin}m.`,
            simMinute
          );
        }
      }
      lastLoggedStopIndexRef.current = position.currentStopIndex;
    }
  }, [position.currentStopIndex, position.state, stops, simMinute, addEvent]);

  // Speed change handler with event logging
  const handleSpeedChange = (spd: SpeedMultiplier) => {
    setSpeedMultiplier(spd);
    simEventsHistoryRef.current.push({
      tOffsetMs: Date.now(),
      kind: "speed_change",
      payload: { speedMultiplier: spd, minute: simMinuteRef.current },
    });
  };

  // Evaluate AI dispatch plans when obstacle changes
  const evaluateObstaclePlans = useCallback(
    async (obs: Obstacle) => {
      if (!currentTrain) return;

      setIsAiLoading(true);
      try {
        // First try calling API route with AI model
        const res = await fetch("/api/sim/advise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            train: currentTrain,
            position,
            obstacle: obs,
            railLinks,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.plans && data.plans.length > 0) {
            setCandidatePlans(data.plans);
            const rec = data.plans.find((p: CandidatePlan) => p.recommended) || data.plans[0];
            setSelectedPlanId(rec?.id || null);
            return;
          }
        }
      } catch (err) {
        console.warn("AI advise API route fallback to local graph planner:", err);
      } finally {
        setIsAiLoading(false);
      }

      // Fallback: deterministic Dijkstra planner
      const localPlans = generateCandidatePlans(currentTrain, position, obs, railLinks);
      setCandidatePlans(localPlans);
      const rec = localPlans.find((p) => p.recommended) || localPlans[0];
      setSelectedPlanId(rec?.id || null);
      setIsAiLoading(false);
    },
    [currentTrain, position, railLinks]
  );

  // Apply obstacle (and sync to Supabase disruptions table)
  const handleApplyObstacle = async (obs: Obstacle) => {
    setActiveObstacle(obs);
    addEvent(
      "obstacle",
      `Disruption Injected: ${obs.title}`,
      `Location: ${obs.fromStationCode || obs.stationCode} • Duration: ~${obs.durationMinutes}m (${obs.effect.replace("_", " ")}).`,
      simMinute
    );

    // Sync to Supabase disruptions table so TravelRescue reflects in real-time
    try {
      const disruptionId = await publishSimDisruption(obs, currentTrain?.train_number);
      activeDisruptionIdRef.current = disruptionId;
    } catch (err) {
      console.warn("Disruption bridge note:", err);
    }

    evaluateObstaclePlans(obs);
  };

  // Clear obstacle (and resolve in Supabase disruptions table)
  const handleClearObstacle = async () => {
    setActiveObstacle(null);
    setCandidatePlans([]);
    setPreviewPlan(null);
    setSelectedPlanId(null);
    addEvent(
      "info",
      "Disruption Cleared",
      "Section tracks cleared by engineering control. Normal movement rules resumed.",
      simMinute
    );

    if (activeDisruptionIdRef.current) {
      try {
        await clearSimDisruption(activeDisruptionIdRef.current);
      } catch (err) {
        console.warn("Disruption clear bridge note:", err);
      }
      activeDisruptionIdRef.current = null;
    }
  };

  // Accept candidate plan
  const handleAcceptPlan = (plan: CandidatePlan) => {
    setSelectedPlanId(plan.id);
    setPreviewPlan(null);

    addEvent(
      "reroute",
      `Plan Adopted: ${plan.title}`,
      `${plan.headline} Detour via [${plan.detourStationCodes.join(" → ")}]. Estimated delay: +${plan.delayMinutes}m.`,
      simMinute
    );

    // If plan has detour stations, inject virtual stops into simulation schedule
    if (plan.detourStationCodes.length > 0 && stops.length > 0) {
      const updatedStops = [...stops];
      const insertIdx = Math.max(1, position.currentStopIndex + 1);

      // Create synthetic detour stops
      const detourStops: SimScheduleStop[] = plan.detourStationCodes.map((code, idx) => ({
        seq: insertIdx + idx,
        stationCode: code,
        stationName: `${code} Junction (Detour Loop)`,
        latitude: position.latitude + (idx + 1) * 0.25,
        longitude: position.longitude + (idx + 1) * 0.35,
        arrivalMin: simMinute + 25 * (idx + 1),
        departureMin: simMinute + 25 * (idx + 1) + 2,
        haltMin: 2,
        distanceKm: Math.round(position.distanceKm + 30 * (idx + 1)),
        dayOffset: 0,
        timeSource: "derived",
      }));

      updatedStops.splice(insertIdx, 0, ...detourStops);
      setStops(updatedStops);
    }
  };

  // 1-Click Preset Scenario Loader
  const handleSelectPresetScenario = async (scenarioKey: string) => {
    if (scenarioKey === "konkan") {
      // Train 16595 Panchaganga Express with Konkan Landslide
      await loadTrain("16595");
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-konkan-landslide");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
    } else if (scenarioKey === "fog") {
      // Train 12627 Karnataka Express with Kanpur-Prayagraj Fog
      await loadTrain("12627");
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-fog-kanpur");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
    } else if (scenarioKey === "ohe") {
      // Train 22691 Bengaluru Rajdhani with Bhopal OHE Cable Snap
      await loadTrain("22691");
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-ohe-bhopal");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
    }
    setIsPlaying(true);
  };

  // Animation Loop using requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;

    const animate = (time: number) => {
      if (lastFrameTimeRef.current !== null && isPlaying) {
        const deltaSeconds = (time - lastFrameTimeRef.current) / 1000;
        // speedMultiplier: 1x => 1s = 1s (1/60 min); 60x => 1s = 60s (1 min)
        const simDeltaMinutes = (deltaSeconds * speedMultiplier) / 60;

        setSimMinute((prev) => {
          const maxMin = stops[stops.length - 1]?.arrivalMin ?? prev + 1000;
          if (prev >= maxMin) {
            setIsPlaying(false);
            return maxMin;
          }
          return prev + simDeltaMinutes;
        });
      }
      lastFrameTimeRef.current = time;
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastFrameTimeRef.current = null;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, speedMultiplier, stops]);

  const originStop = stops[0];
  const destStop = stops[stops.length - 1];
  const startMinute = originStop?.departureMin ?? 360;
  const endMinute = destStop?.arrivalMin ?? startMinute + 1200;

  // Step forward helper
  const handleStepForward = () => {
    const nextStop = stops.find((s) => s.arrivalMin > simMinute);
    if (nextStop) {
      setSimMinute(nextStop.arrivalMin);
    } else {
      setSimMinute(endMinute);
      setIsPlaying(false);
    }
  };

  // Reset helper
  const handleReset = () => {
    setSimMinute(startMinute);
    setIsPlaying(false);
    lastLoggedStopIndexRef.current = -1;
    addEvent(
      "info",
      "Simulation Reset",
      `Repositioned rake to origin terminal ${originStop?.stationName || "Origin"}.`,
      startMinute
    );
  };

  // Save scenario run to Supabase
  const handleSaveScenarioRun = async (name: string, description: string) => {
    if (!currentTrain) return;

    const runPayload: SimScenarioRun = {
      name,
      createdBy: "dispatcher",
      trainNumber: currentTrain.train_number,
      trainName: currentTrain.train_name,
      startMinute,
      endMinute,
      seed: 42,
      metadata: {
        description,
        trainType: currentTrain.train_type,
        stopsCount: stops.length,
        savedAt: new Date().toISOString(),
      },
      obstacles: activeObstacle ? [activeObstacle] : [],
      events: simEventsHistoryRef.current,
      telemetrySnapshots: telemetrySnapshotsRef.current,
    };

    const res = await fetch("/api/sim/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runPayload),
    });

    if (!res.ok) {
      throw new Error("Failed to save scenario run");
    }

    addEvent(
      "info",
      "Scenario Saved to Supabase",
      `Archived "${name}" with ${telemetrySnapshotsRef.current.length} telemetry points and ${simEventsHistoryRef.current.length} events.`,
      simMinute
    );
  };

  // Load past scenario run from Supabase for deterministic replay
  const handleLoadScenarioRun = async (scenarioId: string) => {
    const res = await fetch(`/api/sim/scenarios/${scenarioId}`);
    if (!res.ok) throw new Error("Failed to load scenario run");
    const data = await res.json();
    const run: SimScenarioRun = data.scenario;

    await loadTrain(run.trainNumber);

    setReplayScenarioRun(run);
    setIsReplayMode(true);
    setIsPlaying(false);
    setSimMinute(run.startMinute);

    if (run.obstacles && run.obstacles.length > 0) {
      setActiveObstacle(run.obstacles[0]);
    } else {
      setActiveObstacle(null);
    }

    setEvents(
      run.events.map((e, idx) => ({
        id: `replay-ev-${idx}`,
        minute: typeof e.payload.minute === "number" ? (e.payload.minute as number) : run.startMinute,
        type: e.kind === "disruption" ? "obstacle" : e.kind === "reroute" ? "reroute" : "info",
        title: (e.payload.title as string) || `Event (${e.kind})`,
        detail: (e.payload.detail as string) || "",
      }))
    );

    addEvent(
      "info",
      `Replay Session Loaded: ${run.name}`,
      `Loaded ${run.telemetrySnapshots.length} telemetry snapshots for deterministic replay.`,
      run.startMinute
    );
  };

  // Exit replay mode back to live simulation
  const handleExitReplay = () => {
    setIsReplayMode(false);
    setReplayScenarioRun(null);
    setIsPlaying(false);
    if (currentTrain) {
      loadTrain(currentTrain.train_number);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Prominent Data Honesty Disclaimer */}
      <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-900/60 p-3 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span className="font-medium">
            <strong>Notice:</strong> Simulation based on published schedules. Not live operational
            data.
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 shrink-0 hidden sm:inline">
          Supabase Rail Engine v1.0
        </span>
      </div>

      {/* Page Title & Corridor Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E3A5F]/10 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interactive Railway Dispatch Simulator
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1E3A5F] dark:text-slate-100 mt-1">
            Corridor Movement & AI Recovery Lab
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Step through real Indian Railways timetables, inject track disruptions, and witness
            dynamic kinematic movement and AI-assisted graph rerouting in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => currentTrain && loadTrain(currentTrain.train_number)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Train
          </button>
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="space-y-5">
        {/* Row 1: Heads Up Display (HUD) */}
        {currentTrain && stops.length > 0 && (
          <SimHud
            position={position}
            stops={stops}
            trainNumber={currentTrain.train_number}
            trainName={currentTrain.train_name}
            trainType={currentTrain.train_type}
          />
        )}

        {/* Row 2: Controls & Playback Scrubber */}
        <SimControls
          trains={trainsList}
          selectedTrainNumber={currentTrain?.train_number || "22691"}
          onSelectTrain={(num) => loadTrain(num)}
          currentMinute={simMinute}
          startMinute={startMinute}
          endMinute={endMinute}
          isPlaying={isPlaying}
          speedMultiplier={speedMultiplier}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStepForward={handleStepForward}
          onReset={handleReset}
          onChangeSpeed={handleSpeedChange}
          onScrub={(targetMin) => setSimMinute(targetMin)}
          onSelectPresetScenario={handleSelectPresetScenario}
          onOpenObstacleDialog={() => setIsObstacleDialogOpen(true)}
          hasActiveObstacle={activeObstacle !== null}
          onSaveRun={() => setIsSaveDialogOpen(true)}
          onLoadReplay={() => setIsLoadDialogOpen(true)}
          isReplayMode={isReplayMode}
          onExitReplay={handleExitReplay}
          replayScenarioName={replayScenarioRun?.name}
        />

        {/* Row 3: Interactive SVG Map Canvas */}
        <div className="rounded-2xl border border-[#1E3A5F]/15 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-900/90 shadow-sm p-4 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E3A5F]/10 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Train className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
              <h3 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
                Corridor Track Vector Projection (Pure SVG)
              </h3>
            </div>
            {previewPlan && (
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 animate-pulse">
                Previewing Detour Path ({previewPlan.detourStationCodes.join(" → ")})
              </span>
            )}
          </div>

          <SimMap
            stops={stops}
            position={position}
            activeObstacle={activeObstacle}
            previewPlan={previewPlan}
            className="w-full h-[380px] md:h-[480px]"
          />
        </div>

        {/* Row 4: Stop-by-Stop Schedule Timeline Strip */}
        {stops.length > 0 && (
          <SimTimeline
            stops={stops}
            position={position}
            activeObstacle={activeObstacle}
            onSelectStation={(stn) => {
              const matched = stops.find((s) => s.stationCode === stn);
              if (matched) setSimMinute(matched.arrivalMin);
            }}
            onScrubMinute={(min) => setSimMinute(min)}
          />
        )}

        {/* Row 5: AI Advisor & Occurrence Telemetry Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2">
            <AiAdvisorCard
              plans={candidatePlans}
              activeObstacle={activeObstacle}
              selectedPlanId={selectedPlanId}
              onPreviewPlan={(p) => setPreviewPlan(p)}
              onAcceptPlan={handleAcceptPlan}
              isLoading={isAiLoading}
            />
          </div>

          <div className="lg:col-span-1">
            <SimEventLog events={events} />
          </div>
        </div>
      </div>

      {/* Obstacle Injection Modal */}
      <ObstacleDialog
        isOpen={isObstacleDialogOpen}
        onClose={() => setIsObstacleDialogOpen(false)}
        stops={stops}
        currentMinute={simMinute}
        activeObstacle={activeObstacle}
        onApplyObstacle={handleApplyObstacle}
        onClearObstacle={handleClearObstacle}
      />

      {/* Save Scenario Run Modal */}
      <SaveScenarioDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        trainNumber={currentTrain?.train_number || "22691"}
        trainName={currentTrain?.train_name || "Express"}
        eventCount={events.length}
        obstacleCount={activeObstacle ? 1 : 0}
        onSave={handleSaveScenarioRun}
      />

      {/* Load Scenario Replay Modal */}
      <LoadScenarioDialog
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onSelectScenario={handleLoadScenarioRun}
      />
    </div>
  );
}
