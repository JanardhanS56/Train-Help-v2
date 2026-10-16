"use client";

import { useState, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Plus,
  Trash2,
  CreditCard,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Train,
  ArrowRight,
  MapPin,
  ArrowLeftRight,
} from "lucide-react";
import { SuggestionCombobox } from "@/components/ui/suggestion-combobox";
import {
  TravelClass,
  BookingQuota,
  BookingPassenger,
  Trip,
  Station,
  BookingBerthPreference,
} from "@/lib/types";
import {
  calculateFareBreakdown,
  generatePNR,
  assignBerths,
  saveBookingToStorage,
} from "@/lib/booking/booking-engine";
import { formatCurrency, formatTimeWithDay, formatDate } from "@/lib/format";
import { useAppDispatch } from "@/context/app-context";

interface TrainBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainInfo?: {
    trainNumber: string;
    trainName: string;
    fromStation: Station;
    toStation: Station;
    departureTime: Date;
    arrivalTime: Date;
    defaultClass?: TravelClass;
  };
  onBookingSuccess?: (newTrip: Trip) => void;
}

const DEFAULT_TRAIN = {
  trainNumber: "22691",
  trainName: "Bengaluru Rajdhani Express",
  fromStation: { code: "SBC", name: "KSR Bengaluru", city: "Bengaluru" },
  toStation: { code: "NDLS", name: "New Delhi", city: "Delhi" },
  departureTime: new Date(2026, 9, 15, 20, 0, 0),
  arrivalTime: new Date(2026, 9, 17, 5, 30, 0),
  defaultClass: "3A" as TravelClass,
};

export function TrainBookingDialog({
  open,
  onOpenChange,
  trainInfo,
  onBookingSuccess,
}: TrainBookingDialogProps) {
  const dispatch = useAppDispatch();
  const formId = useId();

  // Train state (defaults to pre-selected train or standard Rajdhani fallback)
  const [train, setTrain] = useState(() => trainInfo || DEFAULT_TRAIN);
  const [prevTrainInfo, setPrevTrainInfo] = useState(trainInfo);

  // Form State
  const [step, setStep] = useState<"details" | "summary" | "confirmed">("details");
  const [selectedClass, setSelectedClass] = useState<TravelClass>(
    () => trainInfo?.defaultClass || DEFAULT_TRAIN.defaultClass || "3A"
  );
  const [selectedQuota, setSelectedQuota] = useState<BookingQuota>("GN");

  // Adjust state during render if trainInfo prop changes (React recommended pattern)
  if (trainInfo !== prevTrainInfo) {
    setPrevTrainInfo(trainInfo);
    if (trainInfo) {
      setTrain(trainInfo);
      if (trainInfo.defaultClass) {
        setSelectedClass(trainInfo.defaultClass);
      }
    }
  }
  const [passengers, setPassengers] = useState<BookingPassenger[]>([
    { id: "p-1", name: "", age: 30, gender: "M", berthPreference: "LB" },
  ]);
  const [contactMobile, setContactMobile] = useState("9876543210");
  const [contactEmail, setContactEmail] = useState("vikram.patel@example.com");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [confirmedTrip, setConfirmedTrip] = useState<Trip | null>(null);

  const fareDetails = calculateFareBreakdown(selectedClass, selectedQuota, passengers);

  function resetForm() {
    setStep("details");
    setTrain(trainInfo || DEFAULT_TRAIN);
    setSelectedClass(trainInfo?.defaultClass || "3A");
    setPassengers([{ id: "p-1", name: "", age: 30, gender: "M", berthPreference: "LB" }]);
    setErrors({});
    setConfirmedTrip(null);
  }

  function handleSwapStations() {
    setTrain((prev) => ({
      ...prev,
      fromStation: prev.toStation,
      toStation: prev.fromStation,
    }));
  }

  function handleAddPassenger() {
    if (passengers.length >= 6) {
      setErrors((prev) => ({ ...prev, general: "Maximum 6 passengers permitted per booking manifest." }));
      return;
    }
    setPassengers((prev) => [
      ...prev,
      {
        id: `p-${prev.length + 1}`,
        name: "",
        age: 28,
        gender: "M",
        berthPreference: "NONE",
      },
    ]);
  }

  function handleRemovePassenger(index: number) {
    if (passengers.length <= 1) {
      setErrors((prev) => ({ ...prev, general: "At least 1 passenger is required." }));
      return;
    }
    setPassengers((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.general;
      delete copy[`p-name-${index}`];
      delete copy[`p-age-${index}`];
      return copy;
    });
  }

  function updatePassenger(index: number, updates: Partial<BookingPassenger>) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};

    if (passengers.length === 0) {
      errs.general = "Please add at least 1 passenger.";
    }

    passengers.forEach((p, idx) => {
      const trimmed = p.name.trim();
      if (!trimmed) {
        errs[`p-name-${idx}`] = "Passenger name is required.";
      } else if (trimmed.length < 2) {
        errs[`p-name-${idx}`] = "Name must be at least 2 characters.";
      } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
        errs[`p-name-${idx}`] = "Name contains invalid characters.";
      }

      if (isNaN(p.age) || p.age < 1 || p.age > 120) {
        errs[`p-age-${idx}`] = "Age must be between 1 and 120.";
      }
    });

    if (!/^\d{10}$/.test(contactMobile.replace(/\s+/g, ""))) {
      errs.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleProceedToSummary() {
    if (validateForm()) {
      setStep("summary");
    }
  }

  function handleConfirmBooking() {
    const pnr = generatePNR();
    const berthInfo = assignBerths(selectedClass, passengers);
    const primaryPassenger = passengers[0]?.name || "Traveler";

    const newTrip: Trip = {
      id: `trip-bk-${pnr}`,
      pnr,
      passengerName:
        passengers.length > 1
          ? `${primaryPassenger} +${passengers.length - 1} more`
          : primaryPassenger,
      travelClass: selectedClass,
      fare: fareDetails.totalFare,
      coach: berthInfo.coach,
      berth: berthInfo.berths.join(", "),
      status: "on-time",
      segments: [
        {
          trainName: train.trainName,
          trainNumber: train.trainNumber,
          departureStation: train.fromStation,
          arrivalStation: train.toStation,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          status: "on-time",
          travelClass: selectedClass,
          coach: berthInfo.coach,
          berth: berthInfo.berths.join(", "),
          platform: "Platform 1",
        },
      ],
    };

    // Save to context & storage
    dispatch({ type: "ADD_TRIP", trip: newTrip });
    saveBookingToStorage(newTrip);

    setConfirmedTrip(newTrip);
    setStep("confirmed");

    if (onBookingSuccess) {
      onBookingSuccess(newTrip);
    }
  }

  function handleCopyReceipt() {
    if (!confirmedTrip) return;
    const seg = confirmedTrip.segments[0];
    const text = [
      `=== INDIAN RAILWAYS PASSENGER RESERVATION E-TICKET ===`,
      `PNR: ${confirmedTrip.pnr} | Status: CONFIRMED`,
      `Train: ${seg.trainName} (#${seg.trainNumber})`,
      `Route: ${seg.departureStation.name} (${seg.departureStation.code}) → ${seg.arrivalStation.name} (${seg.arrivalStation.code})`,
      `Departure: ${formatDate(seg.departureTime)} at ${formatTimeWithDay(seg.departureTime)}`,
      `Class: ${confirmedTrip.travelClass} | Quota: ${selectedQuota}`,
      `Coach: ${confirmedTrip.coach} | Berths: ${confirmedTrip.berth}`,
      `Passengers: ${passengers.map((p) => `${p.name} (${p.age}, ${p.gender})`).join("; ")}`,
      `Total Fare Paid: ₹${confirmedTrip.fare}`,
      `Verified on TravelRescue Platform`,
    ].join("\n");

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl bg-surface p-6 rounded-2xl border border-border shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-hairline">
          <div className="flex items-center justify-between">
            <span className="micro-label text-primary font-semibold tracking-wider">
              RESERVATION SYSTEM
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Train className="w-3.5 h-3.5" />
              <span>#{train.trainNumber}</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-display font-medium text-foreground">
            {step === "confirmed" ? "Reservation Confirmed!" : `Book ${train.trainName}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {train.fromStation.city} ({train.fromStation.code}) → {train.toStation.city} ({train.toStation.code}) · Express Manifest
          </DialogDescription>
        </DialogHeader>

        {/* Global Error Banner */}
        {errors.general && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* STEP 1: Details & Preferences Form */}
        {step === "details" && (
          <div className="space-y-5 py-2 text-xs">
            {/* Origin & Destination Station Selector & Train Suggestions */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Journey Route & Train</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted border border-border/80 text-foreground">
                  {train.trainName} (#{train.trainNumber})
                </span>
              </div>

              {/* Origin -> Swap -> Destination Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2.5 items-end">
                <div>
                  <SuggestionCombobox
                    type="station"
                    label="Starting Station / Place"
                    placeholder="e.g. SBC, Bengaluru, NDLS, Mumbai..."
                    value={`${train.fromStation.name} (${train.fromStation.code})`}
                    onSelect={(item) => {
                      const stn = item.meta as Record<string, unknown> | undefined;
                      setTrain((prev) => ({
                        ...prev,
                        fromStation: {
                          code: item.id,
                          name: item.title,
                          city: (stn?.state as string) || (stn?.name as string) || item.title,
                        },
                      }));
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSwapStations}
                  className="h-9 w-9 self-end mb-0.5 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Swap Origin and Destination"
                  aria-label="Swap Origin and Destination stations"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>

                <div>
                  <SuggestionCombobox
                    type="station"
                    label="Destination Station / Place"
                    placeholder="e.g. NDLS, New Delhi, CSMT, Howrah..."
                    value={`${train.toStation.name} (${train.toStation.code})`}
                    onSelect={(item) => {
                      const stn = item.meta as Record<string, unknown> | undefined;
                      setTrain((prev) => ({
                        ...prev,
                        toStation: {
                          code: item.id,
                          name: item.title,
                          city: (stn?.state as string) || (stn?.name as string) || item.title,
                        },
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Train Name & Auto-suggestion */}
              <div>
                <SuggestionCombobox
                  type="train"
                  label="Select Train (Search by name or number, e.g. 'raj-', 'shatabdi', '22691')"
                  placeholder="Type train name (e.g. raj- for Rajdhani, tejas, 12028)..."
                  value={`${train.trainName} (#${train.trainNumber})`}
                  onSelect={(item) => {
                    const t = item.meta as Record<string, unknown> | undefined;
                    const originCode = (t?.origin_station_code as string) || train.fromStation.code;
                    const originName = (t?.origin_name as string) || train.fromStation.name;
                    const destCode = (t?.destination_station_code as string) || train.toStation.code;
                    const destName = (t?.destination_name as string) || train.toStation.name;

                    setTrain((prev) => ({
                      ...prev,
                      trainNumber: item.id,
                      trainName: item.title,
                      fromStation: {
                        code: originCode,
                        name: originName,
                        city: originName,
                      },
                      toStation: {
                        code: destCode,
                        name: destName,
                        city: destName,
                      },
                    }));
                  }}
                />
              </div>
            </div>
            {/* Class & Quota Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-foreground block mb-1.5" htmlFor={`${formId}-class`}>
                  Travel Class
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["1A", "2A", "3A", "SL", "CC"] as TravelClass[]).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`h-9 rounded-lg font-mono text-xs font-medium border transition-colors flex flex-col items-center justify-center ${
                        selectedClass === cls
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span>{cls}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1.5" htmlFor={`${formId}-quota`}>
                  Quota
                </label>
                <select
                  id={`${formId}-quota`}
                  value={selectedQuota}
                  onChange={(e) => setSelectedQuota(e.target.value as BookingQuota)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="GN">General Quota (GN)</option>
                  <option value="TQ">Tatkal Quota (TQ)</option>
                  <option value="LD">Ladies Quota (LD)</option>
                  <option value="SS">Senior Citizen / Lower Berth (SS)</option>
                  <option value="HP">Divyangjan / Concession (HP)</option>
                </select>
              </div>
            </div>

            {/* Passenger Forms Header */}
            <div className="pt-2 border-t border-hairline">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground text-sm">Passenger Details</h3>
                  <p className="text-[11px] text-muted-foreground">Up to 6 travelers per reservation ticket</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPassenger}
                  className="h-7 px-2.5 rounded-md border border-border bg-surface hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Traveler</span>
                </button>
              </div>

              {/* Dynamic Passenger Rows */}
              <div className="space-y-3">
                {passengers.map((passenger, idx) => (
                  <div
                    key={passenger.id || idx}
                    className="p-3.5 rounded-xl border border-border bg-neutral-tint/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        PASSENGER {idx + 1}
                      </span>
                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePassenger(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove passenger"
                          aria-label={`Remove passenger ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Full Name (as per Govt ID)"
                          value={passenger.name}
                          onChange={(e) => updatePassenger(idx, { name: e.target.value })}
                          className={`w-full h-8 px-2.5 rounded-md border bg-background text-xs outline-none focus:ring-1 focus:ring-primary ${
                            errors[`p-name-${idx}`] ? "border-destructive" : "border-border"
                          }`}
                        />
                        {errors[`p-name-${idx}`] && (
                          <span className="text-[10px] text-destructive block mt-0.5">
                            {errors[`p-name-${idx}`]}
                          </span>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          placeholder="Age"
                          min="1"
                          max="120"
                          value={passenger.age || ""}
                          onChange={(e) =>
                            updatePassenger(idx, { age: parseInt(e.target.value) || 0 })
                          }
                          className={`w-full h-8 px-2.5 rounded-md border bg-background text-xs outline-none focus:ring-1 focus:ring-primary ${
                            errors[`p-age-${idx}`] ? "border-destructive" : "border-border"
                          }`}
                        />
                        {errors[`p-age-${idx}`] && (
                          <span className="text-[10px] text-destructive block mt-0.5">
                            {errors[`p-age-${idx}`]}
                          </span>
                        )}
                      </div>

                      <div>
                        <select
                          value={passenger.gender}
                          onChange={(e) =>
                            updatePassenger(idx, { gender: e.target.value as "M" | "F" | "O" })
                          }
                          className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs outline-none"
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">
                          Berth Preference
                        </label>
                        <select
                          value={passenger.berthPreference}
                          onChange={(e) =>
                            updatePassenger(idx, {
                              berthPreference: e.target.value as BookingBerthPreference,
                            })
                          }
                          className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs outline-none"
                        >
                          <option value="NONE">No Preference</option>
                          <option value="LB">Lower Berth (LB)</option>
                          <option value="MB">Middle Berth (MB)</option>
                          <option value="UB">Upper Berth (UB)</option>
                          <option value="SL">Side Lower (SL)</option>
                          <option value="SU">Side Upper (SU)</option>
                          <option value="WS">Window Seat (WS)</option>
                        </select>
                      </div>

                      {passenger.age >= 60 && (
                        <div className="flex items-center gap-1.5 p-2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Eligible for Senior Citizen lower berth priority.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className="pt-3 border-t border-hairline">
              <h4 className="font-medium text-foreground text-xs mb-2">Booking Contact Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="tel"
                    placeholder="10-digit Mobile Number"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded-md border bg-background text-xs outline-none ${
                      errors.mobile ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.mobile && (
                    <span className="text-[10px] text-destructive block mt-0.5">{errors.mobile}</span>
                  )}
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email Address for Ticket PDF"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded-md border bg-background text-xs outline-none ${
                      errors.email ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.email && (
                    <span className="text-[10px] text-destructive block mt-0.5">{errors.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Summary preview & submit */}
            <div className="pt-4 border-t border-hairline flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block">ESTIMATED FARE</span>
                <span className="font-mono text-base font-semibold text-foreground">
                  {formatCurrency(fareDetails.totalFare)}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  ({fareDetails.passengerCount} traveler{fareDetails.passengerCount > 1 ? "s" : ""})
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToSummary}
                className="h-9 px-5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary-hover transition-colors flex items-center gap-1.5"
              >
                <span>Review Fare Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Fare Breakdown & Confirmation Summary */}
        {step === "summary" && (
          <div className="space-y-5 py-2 text-xs">
            <div className="p-4 rounded-xl border border-border bg-neutral-tint/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{train.trainName}</h4>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    Train #{train.trainNumber} · Class {selectedClass} · Quota: {selectedQuota}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
                  AVAILABLE
                </span>
              </div>

              {/* Passenger list review */}
              <div>
                <span className="micro-label block mb-1">TRAVELERS</span>
                <div className="space-y-1">
                  {passengers.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                      <span className="font-medium text-foreground">
                        {p.name} ({p.gender}, {p.age} yrs)
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        Pref: {p.berthPreference}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Itemized Fare Breakdown */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2.5">
              <h4 className="font-semibold text-foreground text-xs pb-1 border-b border-hairline">
                Itemized Price Breakdown
              </h4>

              <div className="flex justify-between text-muted-foreground">
                <span>Base Fare ({fareDetails.passengerCount} × {formatCurrency(fareDetails.baseFarePerPassenger)})</span>
                <span className="font-mono text-foreground">{formatCurrency(fareDetails.totalBaseFare)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Reservation Charges</span>
                <span className="font-mono text-foreground">{formatCurrency(fareDetails.reservationCharge)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Superfast Surcharge</span>
                <span className="font-mono text-foreground">{formatCurrency(fareDetails.superfastCharge)}</span>
              </div>

              {fareDetails.tatkalCharge > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Tatkal Premium Charge</span>
                  <span className="font-mono">{formatCurrency(fareDetails.tatkalCharge)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Goods & Service Tax (GST 5%)</span>
                <span className="font-mono text-foreground">{formatCurrency(fareDetails.gstAmount)}</span>
              </div>

              <div className="pt-2 border-t border-hairline flex justify-between font-semibold text-sm text-foreground">
                <span>Total Amount Payable</span>
                <span className="font-mono text-base text-primary">
                  {formatCurrency(fareDetails.totalFare)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="h-9 px-4 rounded-lg border border-border bg-surface text-foreground font-medium text-xs hover:bg-muted transition-colors"
              >
                Back to Details
              </button>

              <button
                type="button"
                onClick={handleConfirmBooking}
                className="h-9 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Confirm & Generate PNR</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmed PNR & Receipt */}
        {step === "confirmed" && confirmedTrip && (
          <div className="space-y-5 py-2 text-xs">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">
                Ticket Reserved Successfully
              </h3>
              <p className="text-muted-foreground text-xs">
                Your reservation manifest has been registered with Indian Railways Passenger Reservation System.
              </p>
              <div className="pt-2 flex justify-center">
                <span className="px-4 py-1.5 rounded-lg bg-background border border-border font-mono text-base font-bold text-primary tracking-wider shadow-xs">
                  PNR: {confirmedTrip.pnr}
                </span>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-xl border border-border bg-neutral-tint/30 space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-hairline">
                <div>
                  <span className="micro-label block font-sans">COACH & BERTHS</span>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    Coach {confirmedTrip.coach}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{confirmedTrip.berth}</p>
                </div>

                <div>
                  <span className="micro-label block font-sans">STATUS</span>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs mt-0.5">
                    CNF / CONFIRMED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                <div>
                  <span className="micro-label block font-sans">DEPARTURE</span>
                  <p className="text-foreground font-semibold">
                    {train.fromStation.name} ({train.fromStation.code})
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {formatDate(train.departureTime)} · {formatTimeWithDay(train.departureTime)}
                  </p>
                </div>

                <div>
                  <span className="micro-label block font-sans">ARRIVAL</span>
                  <p className="text-foreground font-semibold">
                    {train.toStation.name} ({train.toStation.code})
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {formatDate(train.arrivalTime)} · {formatTimeWithDay(train.arrivalTime)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-hairline flex justify-between font-sans text-xs">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(confirmedTrip.fare)}
                </span>
              </div>
            </div>

            {/* Receipt Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="h-8 px-3 rounded-md border border-border bg-surface hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Receipt"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded-md border border-border bg-surface hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-8 px-4 rounded-md bg-primary text-primary-foreground font-medium text-xs hover:bg-primary-hover transition-colors"
              >
                Close & View in Trips
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
