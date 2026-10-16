"use client";

import React, { useEffect, useRef } from "react";

export function AmbientScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parallaxLayerRef = useRef<SVGGElement | null>(null);
  const trainRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check fine pointer and hover support
    const isFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let isVisible = true;
    let isDocumentVisible = !document.hidden;

    // Handle visibility changes
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      updateAnimationState();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pause when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : true;
        updateAnimationState();
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    function updateAnimationState() {
      if (!trainRef.current) return;
      if (prefersReducedMotion || !isVisible || !isDocumentVisible) {
        trainRef.current.style.animationPlayState = "paused";
      } else {
        trainRef.current.style.animationPlayState = "running";
      }
    }

    updateAnimationState();

    // Parallax on fine pointer only (<= 12px shift, no React state)
    let rafId: number | null = null;
    const handlePointerMove = (e: MouseEvent) => {
      if (!isFinePointer || prefersReducedMotion || !parallaxLayerRef.current) {
        return;
      }
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const xRel = (e.clientX - rect.left) / rect.width - 0.5;
        const yRel = (e.clientY - rect.top) / rect.height - 0.5;
        const shiftX = Math.max(-12, Math.min(12, xRel * 24));
        const shiftY = Math.max(-12, Math.min(12, yRel * 16));
        if (parallaxLayerRef.current) {
          parallaxLayerRef.current.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0)`;
        }
      });
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
      window.removeEventListener("mousemove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none opacity-40 dark:opacity-25"
      style={{ aspectRatio: "16 / 9", minHeight: "100%", width: "100%" }}
    >
      <svg
        viewBox="0 0 1200 675"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>{`
            @keyframes slowTrainRun {
              0% { transform: translateX(-160px); opacity: 0; }
              10% { opacity: 0.7; }
              85% { opacity: 0.7; }
              100% { transform: translateX(1280px); opacity: 0; }
            }
            .ambient-train-loop {
              animation: slowTrainRun 28s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              will-change: transform;
            }
          `}</style>
        </defs>

        {/* Layer 1: Distant Subtle Hills */}
        <g ref={parallaxLayerRef} className="transition-transform duration-150 ease-out">
          <path
            d="M0 430 Q 220 380 440 420 T 880 410 T 1200 425 V 675 H 0 Z"
            fill="currentColor"
            className="text-muted/40"
          />
          <path
            d="M0 450 Q 300 410 600 440 T 1200 435 V 675 H 0 Z"
            fill="currentColor"
            className="text-border/40"
          />
        </g>

        {/* Layer 2: Faint Station Silhouettes & Signal Posts */}
        <g className="text-muted-foreground/30">
          {/* Signal post 1 */}
          <line x1="280" y1="390" x2="280" y2="470" stroke="currentColor" strokeWidth="2" />
          <circle cx="280" cy="392" r="3" fill="currentColor" />
          <circle cx="280" cy="402" r="3" fill="currentColor" />

          {/* Signal post 2 */}
          <line x1="860" y1="385" x2="860" y2="475" stroke="currentColor" strokeWidth="2" />
          <circle cx="860" cy="387" r="3" fill="currentColor" />
          <circle cx="860" cy="397" r="3" fill="currentColor" />

          {/* Distant Platform Canopy lines */}
          <path
            d="M360 440 L 460 435 L 500 437 L 400 443 Z"
            fill="currentColor"
            opacity="0.5"
          />
        </g>

        {/* Layer 3: Converging Rails & Subtle Sleepers */}
        <g className="text-border">
          {/* Left Rail */}
          <line
            x1="520"
            y1="450"
            x2="100"
            y2="675"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="none"
          />
          {/* Right Rail */}
          <line
            x1="580"
            y1="450"
            x2="1050"
            y2="675"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="none"
          />

          {/* Sleepers */}
          <line x1="518" y1="460" x2="582" y2="460" stroke="currentColor" strokeWidth="1.5" />
          <line x1="500" y1="480" x2="610" y2="480" stroke="currentColor" strokeWidth="2" />
          <line x1="475" y1="505" x2="645" y2="505" stroke="currentColor" strokeWidth="2.2" />
          <line x1="440" y1="535" x2="695" y2="535" stroke="currentColor" strokeWidth="2.5" />
          <line x1="395" y1="570" x2="760" y2="570" stroke="currentColor" strokeWidth="3" />
          <line x1="340" y1="610" x2="840" y2="610" stroke="currentColor" strokeWidth="3.5" />
          <line x1="260" y1="655" x2="945" y2="655" stroke="currentColor" strokeWidth="4" />
        </g>

        {/* Layer 4: Distant Slow Train Silhouette loop (only continuous loop) */}
        <g ref={trainRef} className="ambient-train-loop text-muted-foreground/40">
          {/* Locomotive */}
          <rect x="0" y="432" width="48" height="12" rx="2" fill="currentColor" />
          {/* Cab */}
          <rect x="36" y="428" width="10" height="4" rx="1" fill="currentColor" />
          {/* Coaches */}
          <rect x="52" y="433" width="36" height="11" rx="1" fill="currentColor" />
          <rect x="91" y="433" width="36" height="11" rx="1" fill="currentColor" />
          <rect x="130" y="433" width="36" height="11" rx="1" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
