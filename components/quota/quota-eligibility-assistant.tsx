"use client";

import { useState, useEffect, useMemo, useId } from "react";
import {
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Users,
  Info,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  evaluateQuotaEligibility,
  getTatkalWindowStatus,
  TravelerPersona,
  PassengerProfileInput,
} from "@/lib/quota/quota-engine";
import { TravelClass } from "@/lib/types";

interface QuotaEligibilityAssistantProps {
  onSelectQuota?: (quotaCode: string) => void;
  initialClass?: TravelClass;
}

export function QuotaEligibilityAssistant({
  onSelectQuota,
  initialClass = "3A",
}: QuotaEligibilityAssistantProps) {
  const formId = useId();

  // Profile State
  const [persona, setPersona] = useState<TravelerPersona>("senior");
  const [age, setAge] = useState<number>(63);
  const [gender, setGender] = useState<"M" | "F" | "O">("M");
  const [isSolo, setIsSolo] = useState<boolean>(true);
  const [companionCount, setCompanionCount] = useState<number>(0);
  const [travelClass, setTravelClass] = useState<TravelClass>(initialClass);
  const [hasDisabilityCert, setHasDisabilityCert] = useState<boolean>(false);
  const [hasDefenseID, setHasDefenseID] = useState<boolean>(false);

  // Live Tatkal Countdown State (updates every second)
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tatkalStatus = useMemo(() => {
    return getTatkalWindowStatus(travelClass, currentTime);
  }, [travelClass, currentTime]);

  // Compute profile and quota evaluation
  const profile: PassengerProfileInput = useMemo(() => ({
    persona,
    age,
    gender,
    isSolo,
    companionCount,
    travelClass,
    hasDisabilityCertificate: hasDisabilityCert,
    hasDefenseID,
  }), [persona, age, gender, isSolo, companionCount, travelClass, hasDisabilityCert, hasDefenseID]);

  const quotaResults = useMemo(() => {
    return evaluateQuotaEligibility(profile);
  }, [profile]);

  // Handle persona quick-switch presets
  function handleSelectPersona(p: TravelerPersona) {
    setPersona(p);
    if (p === "senior") {
      setAge(65);
      setGender("M");
      setIsSolo(true);
      setCompanionCount(0);
    } else if (p === "female-solo") {
      setAge(32);
      setGender("F");
      setIsSolo(true);
      setCompanionCount(0);
    } else if (p === "female-group") {
      setAge(28);
      setGender("F");
      setIsSolo(false);
      setCompanionCount(2);
    } else if (p === "divyangjan") {
      setAge(42);
      setHasDisabilityCert(true);
    } else if (p === "defense") {
      setAge(38);
      setHasDefenseID(true);
    } else {
      setAge(29);
      setGender("M");
      setIsSolo(false);
      setCompanionCount(1);
    }
  }

  return (
    <section className="space-y-6 pt-6" aria-labelledby="quota-assistant-heading">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 id="quota-assistant-heading" className="text-base font-semibold text-foreground">
            Multi-Persona Quota & Lower Berth Eligibility
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select traveler attributes to calculate guaranteed quota eligibility and Tatkal countdown timers.
        </p>
      </div>

      {/* 1. Tatkal Window Live Countdown Alert Banner */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-foreground space-y-2 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-xs tracking-wide uppercase text-amber-800 dark:text-amber-300">
              Tatkal Booking Window Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-mono">
              Class {travelClass} ({tatkalStatus.windowType} Tatkal)
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-amber-600 text-white shadow-2xs">
              {tatkalStatus.isOpenNow ? "ACTIVE NOW" : `OPENS IN ${tatkalStatus.formattedCountdown}`}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {tatkalStatus.ruleExplanation} Opens at <strong className="text-foreground">{tatkalStatus.openingTimeStr}</strong> daily.
        </p>
      </div>

      {/* 2. Persona Switcher Chips */}
      <div>
        <label className="text-xs font-medium text-foreground block mb-2" id={`${formId}-persona-label`}>
          Select Traveler Persona Preset
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${formId}-persona-label`}>
          {[
            { id: "senior", label: "Senior Citizen (60+ M / 45+ F)", icon: ShieldCheck },
            { id: "female-solo", label: "Solo Female (Ladies Quota)", icon: Users },
            { id: "divyangjan", label: "Divyangjan / Concession", icon: Info },
            { id: "defense", label: "Armed Forces (Defense)", icon: Zap },
            { id: "general", label: "General Passenger", icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = persona === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPersona(item.id as TravelerPersona)}
                className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                    : "bg-surface border-border text-foreground hover:bg-background"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Passenger Profile Inputs */}
      <div className="p-4 rounded-xl border border-border bg-neutral-tint/30 space-y-4">
        <h3 className="text-xs font-semibold text-foreground">Traveler Profile Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Age</label>
            <input
              type="number"
              min="1"
              max="110"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "M" | "F" | "O")}
              className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground outline-none"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Group Size</label>
            <select
              value={companionCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                setCompanionCount(count);
                setIsSolo(count === 0);
              }}
              className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground outline-none"
            >
              <option value="0">Solo (1 traveler)</option>
              <option value="1">Pair (2 travelers)</option>
              <option value="3">Small Group (4 travelers)</option>
              <option value="5">Family Group (6 travelers)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Travel Class</label>
            <select
              value={travelClass}
              onChange={(e) => setTravelClass(e.target.value as TravelClass)}
              className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground outline-none font-mono"
            >
              <option value="3A">3A (Third AC)</option>
              <option value="2A">2A (Second AC)</option>
              <option value="1A">1A (First AC)</option>
              <option value="SL">SL (Sleeper)</option>
              <option value="CC">CC (Chair Car)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Quota Eligibility Results Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-foreground">Evaluated Quota Eligibility & Rules</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quotaResults.map((quota) => (
            <div
              key={quota.quotaCode}
              className={`p-4 rounded-xl border transition-all ${
                quota.isEligible
                  ? "border-border bg-surface shadow-2xs"
                  : "border-border/50 bg-surface/50 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <span className="font-semibold text-xs text-foreground">{quota.quotaName}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono border ${
                    quota.badgeVariant === "eligible"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : quota.badgeVariant === "conditional"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {quota.badgeLabel}
                </span>
              </div>

              <p className="text-xs text-foreground/90 mt-2 leading-relaxed">{quota.reason}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{quota.benefitSummary}</p>

              {/* Lower Berth Allocation Probability for Senior Quota */}
              {quota.lowerBerthProbability && (
                <div className="mt-3 pt-2 border-t border-hairline space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Lower Berth Allocation Chance</span>
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {quota.lowerBerthProbability.probabilityPercent}% ({quota.lowerBerthProbability.rating})
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${quota.lowerBerthProbability.probabilityPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {quota.lowerBerthProbability.rationale}
                  </p>
                </div>
              )}

              {onSelectQuota && quota.isEligible && (
                <div className="mt-3 pt-2 border-t border-hairline flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectQuota(quota.quotaCode)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <span>Use this quota</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
