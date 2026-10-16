"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import dynamic from "next/dynamic";
import { Pause, Play } from "lucide-react";
import { AmbientScene } from "../ambient-scene";
import { SceneErrorBoundary } from "./scene-error-boundary";
import type { DemoSceneState } from "./scene-tokens";

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
  const pauseButtonId = useId();

  const handleContextLost = useCallback(() => {
    setUseFallback(true);
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

    // 3. Viewport check (<768px)
    const isMobileViewport = window.innerWidth < 768;

    // 4. Low-end device checks (hardwareConcurrency, deviceMemory, saveData)
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };

    const isLowConcurrency =
      typeof nav.hardwareConcurrency === "number" &&
      nav.hardwareConcurrency <= 4;
    const isLowMemory =
      typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
    const isSaveData = Boolean(nav.connection?.saveData);

    // If ANY condition triggers, keep the default SVG/CSS fallback scene
    if (
      !isWebGLAvailable() ||
      prefersReducedMotion ||
      isMobileViewport ||
      isLowConcurrency ||
      isLowMemory ||
      isSaveData
    ) {
      return;
    }

    // Otherwise, delay loading until main content is settled (requestIdleCallback or short timeout)
    let idleId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const startScene = () => {
      setUseFallback(false);
      // Fade in over 300ms
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 100);
    };

    if ("requestIdleCallback" in window) {
      idleId = (window as Window).requestIdleCallback(startScene, {
        timeout: 600,
      });
    } else {
      timeoutId = setTimeout(startScene, 200);
    }

    return () => {
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
            onContextLost={handleContextLost}
          />
        </SceneErrorBoundary>
      </div>

      {/* Quiet "Pause animation" control at bottom-right of hero */}
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
