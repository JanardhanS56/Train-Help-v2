"use client";

import React, { useState, useEffect, useCallback, useId, useRef } from "react";
import dynamic from "next/dynamic";
import { Pause, Play } from "lucide-react";
import { AmbientScene } from "../ambient-scene";
import { SceneErrorBoundary } from "./scene-error-boundary";
import type { DemoSceneState, QualityTier } from "./scene-tokens";

// Lazy dynamic import of RailwayScene with SSR disabled
const DynamicRailwayScene = dynamic(
  () =>
    import("./railway-scene").then((mod) => ({ default: mod.RailwayScene })),
  {
    ssr: false,
    loading: () => <AmbientScene />,
  }
);

interface Hero3DSceneProps {
  demoState: DemoSceneState;
}

export function Hero3DScene({ demoState }: Hero3DSceneProps) {
  const [useFallback, setUseFallback] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [qualityTier, setQualityTier] = useState<QualityTier>(() => {
    if (typeof navigator !== "undefined") {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const isLowConcurrency =
        typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
      const isLowMemory =
        typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
      if (isLowConcurrency || isLowMemory) return "medium";
    }
    return "high";
  });
  const pauseButtonId = useId();
  const downgradedRef = useRef<{ highToMedium: boolean; mediumToFallback: boolean }>({
    highToMedium: false,
    mediumToFallback: false,
  });

  const handleContextLost = useCallback(() => {
    setUseFallback(true);
  }, []);

  const handleAdaptiveDowngrade = useCallback(() => {
    setQualityTier((prev) => {
      if (prev === "high" && !downgradedRef.current.highToMedium) {
        downgradedRef.current.highToMedium = true;
        return "medium";
      }
      if (prev === "medium" && !downgradedRef.current.mediumToFallback) {
        downgradedRef.current.mediumToFallback = true;
        setUseFallback(true);
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    // 1. Check WebGL availability
    function isWebGLAvailable(): boolean {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(
          window.WebGLRenderingContext &&
            (canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    }

    // 2. Check Reduced Motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 3. Viewport check (<768px uses SVG fallback)
    const isMobileViewport = window.innerWidth < 768;

    // 4. Low-end device checks (hardwareConcurrency, deviceMemory, saveData)
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };

    const isSaveData = Boolean(nav.connection?.saveData);

    // If ANY condition triggers, keep the default SVG fallback scene (useFallback is already true)
    if (
      !isWebGLAvailable() ||
      prefersReducedMotion ||
      isMobileViewport ||
      isSaveData
    ) {
      return;
    }

    // Viewport resize guard to switch to fallback on screen shrink < 768px
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setUseFallback(true);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Delay 3D mount until hero text and layout have settled (requestIdleCallback / short delay)
    let idleId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const startScene = () => {
      setUseFallback(false);
      // Smooth 300ms fade-in
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 100);
    };

    if ("requestIdleCallback" in window) {
      idleId = (window as Window).requestIdleCallback(startScene, {
        timeout: 500,
      });
    } else {
      timeoutId = setTimeout(startScene, 150);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as Window).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (useFallback) {
    return <AmbientScene />;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
      {/* 300ms smooth fade-in container */}
      <div
        className={`w-full h-full transition-opacity duration-300 ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <SceneErrorBoundary>
          <DynamicRailwayScene
            demoState={demoState}
            isPaused={isPaused}
            qualityTier={qualityTier}
            onContextLost={handleContextLost}
            onAdaptiveDowngrade={handleAdaptiveDowngrade}
          />
        </SceneErrorBoundary>
      </div>

      {/* Accessible "Pause animation" control at bottom-right of hero */}
      <div className="absolute bottom-3 right-4 sm:right-6 pointer-events-auto z-20">
        <button
          id={pauseButtonId}
          type="button"
          aria-pressed={isPaused}
          aria-label={isPaused ? "Resume 3D railway animation" : "Pause 3D railway animation"}
          onClick={() => setIsPaused((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/80 bg-surface/90 text-muted-foreground hover:text-foreground backdrop-blur-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 stroke-[2]" />
              <span>Resume scene</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 stroke-[2]" />
              <span>Pause animation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
