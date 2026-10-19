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
import {
  getSnapshotTrains,
  getSnapshotTrainByNumber,
  getSnapshotRailLinks,
} from "@/lib/data/snapshot-fallback";
import { interpolateReplayPosition } from "@/lib/sim/replay";
import { publishSimDisruption, clearSimDisruption } from "@/lib/sim/disruption-bridge";
import dynamic from "next/dynamic";

const SimMap = dynamic(
  () => import("@/components/sim/sim-map").then((mod) => mod.SimMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs text-muted-foreground font-mono">
        Loading simulation canvas...
      </div>
    ),
  }
);
import { SimHud } from "@/components/sim/sim-hud";
import { SimTimeline } from "@/components/sim/sim-timeline";
import { SimControls } from "@/components/sim/sim-controls";
import { ObstacleDialog } from "@/components/sim/obstacle-dialog";
import { SaveScenarioDialog } from "@/components/sim/save-scenario-dialog";
import { LoadScenarioDialog } from "@/components/sim/load-scenario-dialog";
import { AiAdvisorCard } from "@/components/sim/ai-advisor-card";
import { SimEventLog, SimEventItem } from "@/components/sim/sim-event-log";
import Link from "next/link";
import {
  Train,
  Info,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { simSoundscape } from "@/lib/sim/soundscape";

function formatSimTime(mins: number): string {
  const totalMins = Math.round(mins);
  const d = Math.floor(totalMins / 1440);
  const rem = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(rem / 60);
  const m = Math.floor(rem % 60);
  const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return d > 0 ? `${timeStr} (+${d}d)` : timeStr;
}

export default function SimulationPage() {
  // 1. Data state
  const [trainsList, setTrainsList] = useState<TrainSummary[]>([]);
  const [currentTrain, setCurrentTrain] = useState<TrainWithStops | null>(null);
  const [railLinks, setRailLinks] = useState<DbRailLink[]>([]);
  const [, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [trainLoadError, setTrainLoadError] = useState<{
    message: string;
    trainNumber: string;
    isNotFound: boolean;
  } | null>(null);
  const activeLoadRequestIdRef = useRef<number>(0);

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

  // 6. Soundscape audio state (defaults to MUTED per autoplay policy & accessibility)
  const [isMuted, setIsMuted] = useState<boolean>(() => simSoundscape.getMuted());

  const toggleAudioMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    simSoundscape.setMuted(next);
    if (!next && isPlaying) {
      simSoundscape.startWheelRoll(speedMultiplier);
    }
  }, [isMuted, isPlaying, speedMultiplier]);

  // Sync wheel roll loop with simulation playback state
  useEffect(() => {
    if (isPlaying && !isMuted) {
      simSoundscape.startWheelRoll(speedMultiplier);
    } else {
      simSoundscape.stopWheelRoll();
    }
    return () => {
      simSoundscape.stopWheelRoll();
    };
  }, [isPlaying, speedMultiplier, isMuted]);

  // 7. Animation loop references
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

  // Fetch full details of selected train (with resilient snapshot fallback)
  const loadTrain = useCallback(async (trainNumber: string) => {
    const trimmedNumber = trainNumber?.trim();
    if (!trimmedNumber) return;

    const requestId = ++activeLoadRequestIdRef.current;

    try {
      setIsLoading(true);
      let train: TrainWithStops | null = null;

      try {
        const res = await fetch(`/api/sim/trains/${encodeURIComponent(trimmedNumber)}`);
        if (requestId !== activeLoadRequestIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data && data.train && Array.isArray(data.train.stops)) {
            train = data.train;
            setIsOfflineMode(Boolean(data.isOffline));
          }
        }
      } catch (e) {
        console.warn("API train fetch note, engaging fallback snapshot:", e);
      }

      if (requestId !== activeLoadRequestIdRef.current) return;

      if (!train) {
        train = getSnapshotTrainByNumber(trimmedNumber) || getSnapshotTrainByNumber("22691");
        setIsOfflineMode(true);
      }

      if (!train) {
        setTrainLoadError({
          message: `Train ${trimmedNumber} was not found in the timetable records.`,
          trainNumber: trimmedNumber,
          isNotFound: true,
        });
        return;
      }

      // Successful fetch: clear previous error and update simulation models
      setTrainLoadError(null);
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
    } catch (err: unknown) {
      if (requestId !== activeLoadRequestIdRef.current) return;
      const isNetwork = err instanceof TypeError;
      const detail = isNetwork
        ? "Network connection issue while communicating with simulation server."
        : err instanceof Error
        ? err.message
        : "Failed to load train details";

      setTrainLoadError({
        message: detail,
        trainNumber: trimmedNumber,
        isNotFound: false,
      });
    } finally {
      if (requestId === activeLoadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load initial train list and links (with zero-network snapshot fallback and URL demo auto-trigger)
  useEffect(() => {
    async function initData() {
      try {
        setIsLoading(true);
        let trains: TrainSummary[] = [];
        let links: DbRailLink[] = [];

        try {
          const [trainsRes, linksRes] = await Promise.all([
            fetch("/api/sim/trains"),
            fetch("/api/sim/links"),
          ]);

          if (trainsRes.ok) {
            const trainsData = await trainsRes.json();
            trains = Array.isArray(trainsData.trains) ? trainsData.trains : [];
          }
          if (linksRes.ok) {
            const linksData = await linksRes.json();
            links = Array.isArray(linksData.links) ? linksData.links : [];
          }
        } catch (e) {
          console.warn("Initial API fetch note, using local snapshot fallback:", e);
        }

        if (trains.length === 0) {
          trains = getSnapshotTrains("", 100);
        }
        if (links.length === 0) {
          links = getSnapshotRailLinks();
        }

        setTrainsList(trains);
        setRailLinks(links);

        // Default to configured 22691 (Bengaluru Rajdhani) if present, or first train in list
        const defaultTrainNumber =
          trains.find((t) => t.train_number === "22691")?.train_number ||
          trains[0]?.train_number ||
          "22691";

        await loadTrain(defaultTrainNumber);

        // Check if auto-demo was requested via URL query params (?demo=1 or ?preset=...)
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("demo") === "1" || params.get("demo") === "true") {
            setTimeout(() => {
              handleSelectPresetScenario("demo");
            }, 300);
          } else if (params.get("preset")) {
            const pKey = params.get("preset")!;
            setTimeout(() => {
              handleSelectPresetScenario(pKey);
            }, 300);
          }
        }
      } catch (err) {
        console.warn("Failed to load initial simulation data:", err);
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
          simSoundscape.playDepartureChime();
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

      // 1. Instantly compute deterministic Dijkstra plans so UI is never stalled
      const localPlans = generateCandidatePlans(currentTrain, position, obs, railLinks);
      setCandidatePlans(localPlans);
      const rec = localPlans.find((p) => p.recommended) || localPlans[0];
      setSelectedPlanId(rec?.id || null);
      simSoundscape.playAdvisorDing();

      // 2. Call AI advisor in background to enrich plans with LLM intelligence
      setIsAiLoading(true);
      try {
        const res = await fetch("/api/sim/advise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            train: currentTrain,
            position,
            obstacle: obs,
            candidatePlans: localPlans,
            railLinks,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.recommendedPlanId) {
            setCandidatePlans((prev) =>
              prev.map((p) =>
                p.id === data.recommendedPlanId
                  ? {
                      ...p,
                      headline: data.headline || p.headline,
                      reasoning: data.reasoning?.length ? data.reasoning : p.reasoning,
                      tradeoffs: data.tradeoffs?.length ? data.tradeoffs : p.tradeoffs,
                      confidence: data.confidence || p.confidence,
                    }
                  : p
              )
            );
            setSelectedPlanId(data.recommendedPlanId);
          } else if (data.plans && data.plans.length > 0) {
            setCandidatePlans(data.plans);
          }
        }
      } catch (err) {
        console.warn("AI advise background note (deterministic plans active):", err);
      } finally {
        setIsAiLoading(false);
      }
    },
    [currentTrain, position, railLinks]
  );

  // Apply obstacle (and sync to Supabase disruptions table)
  const handleApplyObstacle = async (obs: Obstacle) => {
    setActiveObstacle(obs);
    simSoundscape.playObstacleSiren();
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

      // Filter out detour station codes that are already at or next to insertion point
      const existingCodes = new Set([
        updatedStops[insertIdx - 1]?.stationCode,
        updatedStops[insertIdx]?.stationCode,
      ]);
      const validDetourCodes = plan.detourStationCodes.filter((c) => !existingCodes.has(c));

      if (validDetourCodes.length > 0) {
        const baseMin = Math.round(simMinute);
        const baseKm = Math.round(position.distanceKm);

        // Create synthetic detour stops with rounded integer minutes and kms
        const detourStops: SimScheduleStop[] = validDetourCodes.map((code, idx) => {
          const arr = baseMin + 25 * (idx + 1);
          return {
            seq: insertIdx + idx,
            stationCode: code,
            stationName: `${code} Junction (Detour Loop)`,
            latitude: position.latitude + (idx + 1) * 0.25,
            longitude: position.longitude + (idx + 1) * 0.35,
            arrivalMin: arr,
            departureMin: arr + 2,
            haltMin: 2,
            distanceKm: baseKm + 30 * (idx + 1),
            dayOffset: 0,
            timeSource: "derived",
          };
        });

        updatedStops.splice(insertIdx, 0, ...detourStops);
        // Re-number sequence indices
        updatedStops.forEach((s, i) => {
          s.seq = i + 1;
        });
        setStops(updatedStops);
      }
    }
  };

  // 1-Click Preset Scenario Loader
  const handleSelectPresetScenario = async (scenarioKey: string) => {
    if (scenarioKey === "demo" || scenarioKey === "flagship" || scenarioKey === "1click") {
      // Flagship 1-Click Demo: Bengaluru Rajdhani 22691 approaching Itarsi-Bhopal OHE break
      await loadTrain("22691");
      setSimMinute(1195);
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-1click-demo" || p.id === "preset-ohe-bhopal");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
      setSpeedMultiplier(10);
      setIsPlaying(true);
    } else if (scenarioKey === "konkan") {
      // Train 12051 Mao Jan Shatabdi approaching Chiplun-Ratnagiri landslide
      await loadTrain("12051");
      setSimMinute(570);
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-konkan-landslide");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
      setSpeedMultiplier(10);
      setIsPlaying(true);
    } else if (scenarioKey === "fog") {
      // Train 12627 Karnataka Express approaching Agra-Mathura Fog
      await loadTrain("12627");
      setSimMinute(3285);
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-fog-kanpur");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
      setSpeedMultiplier(10);
      setIsPlaying(true);
    } else if (scenarioKey === "ohe") {
      // Train 22691 Bengaluru Rajdhani with Bhopal OHE Cable Snap
      await loadTrain("22691");
      setSimMinute(1195);
      const preset = OBSTACLE_PRESETS.find((p) => p.id === "preset-ohe-bhopal");
      if (preset) {
        handleApplyObstacle(preset.obstacle);
      }
      setSpeedMultiplier(10);
      setIsPlaying(true);
    }
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
          {/* T6.3 Accessible Mute / Unmute Soundscape Toggle */}
          <button
            type="button"
            onClick={toggleAudioMute}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 shadow-2xs transition-colors ${
              isMuted
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
                : "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold"
            }`}
            aria-label={isMuted ? "Unmute simulation soundscape" : "Mute simulation soundscape"}
            title={isMuted ? "Audio Muted (Click to enable)" : "Audio Active (Click to mute)"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-slate-400" /> : <Volume2 className="h-3.5 w-3.5 text-blue-500 animate-pulse" />}
            <span>{isMuted ? "Muted" : "Sound ON"}</span>
          </button>

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
        {/* Error notification banner if a train selection fails while another train is already loaded */}
        {trainLoadError && currentTrain && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-900/80 bg-amber-50/90 dark:bg-amber-950/40 p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Could not load train {trainLoadError.trainNumber}:</strong> {trainLoadError.message}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadTrain(trainLoadError.trainNumber)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-200/90 hover:bg-amber-300 dark:bg-amber-900/70 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => setTrainLoadError(null)}
                className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 p-1 cursor-pointer"
                aria-label="Dismiss error notification"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Primary error card if no train is currently loaded */}
        {trainLoadError && !currentTrain && (
          <div className="rounded-2xl border border-rose-300 dark:border-rose-900/80 bg-rose-50/90 dark:bg-rose-950/40 p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
                  {trainLoadError.isNotFound ? "Train Not Found" : "Unable to Load Train Schedule"}
                </h3>
                <p className="text-xs sm:text-sm text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                  {trainLoadError.message}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => loadTrain(trainLoadError.trainNumber)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Loading {trainLoadError.trainNumber}
              </button>
              {trainsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => loadTrain(trainsList[0].train_number)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Train className="h-3.5 w-3.5" />
                  Load Alternative: {trainsList[0].train_name} ({trainsList[0].train_number})
                </button>
              )}
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Row 1: Heads Up Display (HUD) */}
        {currentTrain && stops.length > 0 && (
          <SimHud
            position={position}
            stops={stops}
            trainNumber={currentTrain.train_number}
            trainName={currentTrain.train_name}
            trainType={currentTrain.train_type}
            isOfflineFallback={isOfflineMode}
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
