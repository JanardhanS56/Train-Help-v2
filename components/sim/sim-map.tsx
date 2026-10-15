"use client";

import { useMemo, useState } from "react";
import type { SimScheduleStop, SimPosition, Obstacle, CandidatePlan } from "@/lib/sim/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface SimMapProps {
  stops: SimScheduleStop[];
  position: SimPosition;
  activeObstacle: Obstacle | null;
  previewPlan: CandidatePlan | null;
  onStationClick?: (stationCode: string) => void;
  className?: string;
}

export function SimMap({
  stops,
  position,
  activeObstacle,
  previewPlan,
  onStationClick,
  className,
}: SimMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  // Geographic bounds & SVG coordinate projection
  const { project, routePoints, detourPoints, obstacleCoords } = useMemo(() => {
    if (stops.length === 0) {
      return {
        project: () => ({ x: 500, y: 300 }),
        routePoints: [],
        detourPoints: [],
        obstacleCoords: null,
      };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const s of stops) {
      if (s.latitude && s.longitude) {
        if (s.latitude < minLat) minLat = s.latitude;
        if (s.latitude > maxLat) maxLat = s.latitude;
        if (s.longitude < minLng) minLng = s.longitude;
        if (s.longitude > maxLng) maxLng = s.longitude;
      }
    }

    // Add padding around bounds
    const latSpan = Math.max(0.8, maxLat - minLat);
    const lngSpan = Math.max(0.8, maxLng - minLng);
    const padLat = latSpan * 0.12;
    const padLng = lngSpan * 0.12;

    const bMinLat = minLat - padLat;
    const bMaxLat = maxLat + padLat;
    const bMinLng = minLng - padLng;
    const bMaxLng = maxLng + padLng;

    const bSpanLat = bMaxLat - bMinLat;
    const bSpanLng = bMaxLng - bMinLng;

    const SVG_WIDTH = 1000;
    const SVG_HEIGHT = 560;

    const proj = (lat: number, lng: number) => {
      const x = ((lng - bMinLng) / bSpanLng) * SVG_WIDTH;
      // Invert Y because latitude goes North (+) and SVG Y goes Down (+)
      const y = SVG_HEIGHT - ((lat - bMinLat) / bSpanLat) * SVG_HEIGHT;
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    };

    const rPoints = stops.map((s) => ({
      ...s,
      ...proj(s.latitude, s.longitude),
    }));

    // Obstacle projection
    let obsPoint = null;
    if (activeObstacle) {
      if (activeObstacle.fromStationCode && activeObstacle.toStationCode) {
        const s1 = stops.find((s) => s.stationCode === activeObstacle.fromStationCode);
        const s2 = stops.find((s) => s.stationCode === activeObstacle.toStationCode);
        if (s1 && s2) {
          const p1 = proj(s1.latitude, s1.longitude);
          const p2 = proj(s2.latitude, s2.longitude);
          obsPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
      } else if (activeObstacle.stationCode) {
        const st = stops.find((s) => s.stationCode === activeObstacle.stationCode);
        if (st) {
          obsPoint = proj(st.latitude, st.longitude);
        }
      }
    }

    // Detour points if preview plan has alternate path
    let dPoints: { x: number; y: number }[] = [];
    if (previewPlan && previewPlan.detourStationCodes.length >= 2) {
      // Find matching stops or mock offset path
      const matched = previewPlan.detourStationCodes
        .map((code) => stops.find((s) => s.stationCode === code))
        .filter(Boolean) as SimScheduleStop[];

      if (matched.length >= 2) {
        dPoints = matched.map((s) => proj(s.latitude, s.longitude));
      } else if (rPoints.length >= 2) {
        // Construct visual chord detour around the route
        const midIdx = Math.floor(rPoints.length / 2);
        const p1 = rPoints[Math.max(0, midIdx - 1)];
        const p2 = rPoints[Math.min(rPoints.length - 1, midIdx + 1)];
        const offset = 40;
        dPoints = [
          { x: p1.x, y: p1.y },
          { x: (p1.x + p2.x) / 2 + offset, y: (p1.y + p2.y) / 2 - offset },
          { x: p2.x, y: p2.y },
        ];
      }
    }

    return {
      project: proj,
      routePoints: rPoints,
      detourPoints: dPoints,
      obstacleCoords: obsPoint,
    };
  }, [stops, activeObstacle, previewPlan]);

  // Train position coordinates
  const trainCoords = useMemo(() => {
    return project(position.latitude, position.longitude);
  }, [project, position.latitude, position.longitude]);

  // Build SVG path string for route
  const pathD = useMemo(() => {
    if (routePoints.length < 2) return "";
    return routePoints.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      ""
    );
  }, [routePoints]);


  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-border bg-surface overflow-hidden shadow-xs select-none",
        className
      )}
    >
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-background/90 text-foreground border border-border/60 backdrop-blur-xs shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Interactive Route Projection
        </span>
        {activeObstacle && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-disruption/15 text-disruption border border-disruption/30 backdrop-blur-xs animate-in fade-in">
            <AlertTriangle className="w-3.5 h-3.5" />
            Track Obstacle Active
          </span>
        )}
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-background/90 border border-border/80 rounded-lg p-1 backdrop-blur-xs shadow-xs">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.25))}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted touch-target transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted touch-target transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel(1)}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted touch-target transition-colors"
          aria-label="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main SVG Canvas */}
      <div className="w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[520px] flex items-center justify-center p-2 sm:p-4">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Train route map showing station markers, train location, and active disruptions"
        >
          <defs>
            {/* Linear track gradient */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="100%" stopColor="#2F7D6B" />
            </linearGradient>

            {/* Ghost Detour Gradient */}
            <linearGradient id="detourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2F7D6B" />
              <stop offset="100%" stopColor="#B7791F" />
            </linearGradient>

            {/* Train Glow Filter */}
            <filter id="trainGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1E3A5F" floodOpacity="0.3" />
            </filter>

            {/* Obstacle Glow Filter */}
            <filter id="obstacleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#C2574A" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Grid Background Lines (Stylized Track Geometry) */}
          <g stroke="currentColor" strokeOpacity="0.04" strokeWidth="1">
            <line x1="100" y1="0" x2="100" y2="560" />
            <line x1="300" y1="0" x2="300" y2="560" />
            <line x1="500" y1="0" x2="500" y2="560" />
            <line x1="700" y1="0" x2="700" y2="560" />
            <line x1="900" y1="0" x2="900" y2="560" />
            <line x1="0" y1="140" x2="1000" y2="140" />
            <line x1="0" y1="280" x2="1000" y2="280" />
            <line x1="0" y1="420" x2="1000" y2="420" />
          </g>

          {/* 1. Base Track Line (Casing / Border) */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#E8E2D9"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-neutral-800"
            />
          )}

          {/* 2. Scheduled Track Line (Solid) */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 3. Preview Detour Track Line (Dashed Green/Amber) */}
          {previewPlan && detourPoints.length >= 2 && (
            <g className="animate-in fade-in duration-300">
              <path
                d={
                  detourPoints.length === 2
                    ? `M ${detourPoints[0].x} ${detourPoints[0].y} L ${detourPoints[1].x} ${detourPoints[1].y}`
                    : `M ${detourPoints[0].x} ${detourPoints[0].y} Q ${detourPoints[1].x} ${detourPoints[1].y} ${detourPoints[2]?.x ?? detourPoints[1].x} ${detourPoints[2]?.y ?? detourPoints[1].y}`
                }
                fill="none"
                stroke="url(#detourGradient)"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <text
                x={detourPoints[1]?.x || 500}
                y={(detourPoints[1]?.y || 300) - 12}
                textAnchor="middle"
                className="text-[11px] font-mono font-medium fill-emerald-600 dark:fill-emerald-400"
              >
                Proposed Chord Reroute (+{previewPlan.extraDistanceKm} km)
              </text>
            </g>
          )}

          {/* 4. Station Markers & Labels */}
          {routePoints.map((s, idx) => {
            const isOrigin = idx === 0;
            const isDestination = idx === routePoints.length - 1;
            const isJunction = s.haltMin >= 8 || isOrigin || isDestination;
            const isHovered = hoveredStation === s.stationCode;

            // Display station labels for origin, destination, major junctions, or on hover
            const showLabel = isOrigin || isDestination || isJunction || isHovered || zoomLevel >= 1.5;

            return (
              <g
                key={`${s.stationCode}-${idx}`}
                className="cursor-pointer transition-transform"
                onClick={() => onStationClick?.(s.stationCode)}
                onMouseEnter={() => setHoveredStation(s.stationCode)}
                onMouseLeave={() => setHoveredStation(null)}
                tabIndex={0}
                role="button"
                aria-label={`Station ${s.stationName} (${s.stationCode})`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onStationClick?.(s.stationCode);
                  }
                }}
              >
                {/* Station Node Outer Ring */}
                {isJunction && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={isOrigin || isDestination ? 9 : 7}
                    fill="none"
                    stroke="#1E3A5F"
                    strokeWidth="1.5"
                    className="opacity-70 dark:stroke-emerald-400"
                  />
                )}

                {/* Station Node Core */}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isOrigin || isDestination ? 6 : isJunction ? 4.5 : 3}
                  fill={isOrigin ? "#1E3A5F" : isDestination ? "#2F7D6B" : "#FFFFFF"}
                  stroke="#1E3A5F"
                  strokeWidth={isOrigin || isDestination ? "2" : "1.5"}
                  className={cn(
                    "transition-all",
                    isHovered && "r-8 stroke-emerald-600 dark:stroke-emerald-300"
                  )}
                />

                {/* Station Name Label */}
                {showLabel && (
                  <g className="pointer-events-none">
                    <rect
                      x={s.x - (s.stationCode.length * 4 + 8)}
                      y={idx % 2 === 0 ? s.y - 24 : s.y + 10}
                      width={s.stationCode.length * 8 + 16}
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      fillOpacity="0.85"
                      stroke="#E8E2D9"
                      strokeWidth="0.8"
                      className="dark:fill-neutral-900 dark:stroke-neutral-700"
                    />
                    <text
                      x={s.x}
                      y={idx % 2 === 0 ? s.y - 12 : s.y + 22}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-semibold fill-foreground"
                    >
                      {s.stationCode}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 5. Obstacle Marker (if active) */}
          {obstacleCoords && activeObstacle && (
            <g className="animate-in fade-in zoom-in duration-300">
              {/* Pulsing hazard halo */}
              <circle
                cx={obstacleCoords.x}
                cy={obstacleCoords.y}
                r="18"
                fill="#C2574A"
                fillOpacity="0.2"
                className="animate-ping"
              />
              <circle
                cx={obstacleCoords.x}
                cy={obstacleCoords.y}
                r="10"
                fill="#C2574A"
                filter="url(#obstacleGlow)"
              />
              <polygon
                points={`${obstacleCoords.x},${obstacleCoords.y - 5} ${obstacleCoords.x - 4},${obstacleCoords.y + 3} ${obstacleCoords.x + 4},${obstacleCoords.y + 3}`}
                fill="#FFFFFF"
              />
              {/* Obstacle Tooltip Callout */}
              <g className="pointer-events-none">
                <rect
                  x={obstacleCoords.x - 70}
                  y={obstacleCoords.y - 38}
                  width="140"
                  height="22"
                  rx="6"
                  fill="#C2574A"
                  className="shadow-sm"
                />
                <text
                  x={obstacleCoords.x}
                  y={obstacleCoords.y - 24}
                  textAnchor="middle"
                  className="text-[10px] font-sans font-semibold fill-white"
                >
                  ⚠ {activeObstacle.title.slice(0, 18)}...
                </text>
              </g>
            </g>
          )}

          {/* 6. Active Train Marker (High-priority 60fps moving element) */}
          <g
            transform={`translate(${trainCoords.x}, ${trainCoords.y})`}
            className="transition-transform duration-75"
            filter="url(#trainGlow)"
          >
            {/* Outer Train Radar Pulse */}
            <circle
              r="14"
              fill={position.state === "blocked" ? "#C2574A" : "#1E3A5F"}
              fillOpacity="0.2"
              className={position.state === "blocked" ? "animate-ping" : "animate-pulse"}
            />

            {/* Train Base Disk */}
            <circle
              r="8"
              fill={position.state === "blocked" ? "#C2574A" : "#1E3A5F"}
              stroke="#FFFFFF"
              strokeWidth="2"
            />

            {/* Inner Train Indicator Light */}
            <circle
              r="3.5"
              fill={
                position.state === "blocked"
                  ? "#FFFFFF"
                  : position.state === "dwelling"
                  ? "#B7791F"
                  : "#2F7D6B"
              }
            />

            {/* Live Speed / State Chip above Train */}
            <g className="pointer-events-none" transform="translate(0, -18)">
              <rect
                x="-36"
                y="-12"
                width="72"
                height="16"
                rx="8"
                fill="#1E3A5F"
                className="shadow-xs"
              />
              <text
                x="0"
                y="-1"
                textAnchor="middle"
                className="text-[9px] font-mono font-bold fill-white"
              >
                {position.state === "blocked" ? "BLOCKED" : `${position.currentSpeedKmph} km/h`}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Map Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-hairline bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A5F]" />
            <span>Scheduled Track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-[#1E3A5F] bg-surface" />
            <span>Junction / Halt</span>
          </div>
          {previewPlan && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500" />
              <span>Diverted Chord</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>
            {stops[0]?.stationCode} → {stops[stops.length - 1]?.stationCode} (
            {stops[stops.length - 1]?.distanceKm ?? 0} km)
          </span>
        </div>
      </div>
    </div>
  );
}
