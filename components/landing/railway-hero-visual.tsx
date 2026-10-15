"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, MapPin, TrainFront } from "lucide-react";

export function RailwayHeroVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="img"
      aria-label="A train traveling on a railway route between New Delhi and Mumbai"
      className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-primary/5 sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="micro-label">THE JOURNEY CONTINUES</span>
          <h2 className="font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            India, back on track.
          </h2>
        </div>
        <div
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/5 text-primary"
        >
          <TrainFront className="size-5" strokeWidth={1.6} />
        </div>
      </div>

      <div className="relative mt-10 rounded-xl border border-border/70 bg-background/80 px-4 pb-4 pt-8 sm:mt-12 sm:px-6">
        <div
          aria-hidden="true"
          className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted sm:left-8 sm:right-8"
        />
        <div
          aria-hidden="true"
          className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-muted-foreground/40 sm:left-8 sm:right-8"
        />

        <motion.div
          aria-hidden="true"
          className="absolute left-6 top-1/2 z-10 -translate-y-1/2 text-primary drop-shadow-md sm:left-8"
          initial={false}
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 210, 0], rotate: [0, 0, 0] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 7,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.4,
                }
          }
        >
          <TrainFront className="size-8 sm:size-9" strokeWidth={1.7} />
        </motion.div>

        <div className="relative flex items-center justify-between">
          <div className="flex flex-col items-start gap-2">
            <span className="grid size-3 place-items-center rounded-full border-2 border-primary bg-background">
              <span className="size-1 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-foreground sm:text-xs">
              NEW DELHI
            </span>
            <span className="font-mono text-[9px] text-muted-foreground sm:text-[10px]">
              NDLS
            </span>
          </div>
          <div aria-hidden="true" className="flex -translate-y-5 items-center gap-1 text-muted-foreground/70">
            <span className="h-px w-5 bg-border sm:w-8" />
            <ArrowDownRight className="size-3 rotate-[-45deg]" />
            <span className="h-px w-5 bg-border sm:w-8" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="grid size-3 place-items-center rounded-full border-2 border-emerald-600 bg-background">
              <span className="size-1 rounded-full bg-emerald-600" />
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-foreground sm:text-xs">
              MUMBAI
            </span>
            <span className="font-mono text-[9px] text-muted-foreground sm:text-[10px]">
              CSMT
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 text-[10px] text-muted-foreground sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" aria-hidden="true" />
          Rail journeys, made resilient
        </span>
        <span className="flex items-center gap-1" aria-label="Indian tricolor accent">
          <span className="h-1 w-3 rounded-full bg-[#E88B35]" />
          <span className="h-1 w-3 rounded-full bg-[#F4F0E8]" />
          <span className="h-1 w-3 rounded-full bg-[#378765]" />
        </span>
      </div>
    </div>
  );
}
