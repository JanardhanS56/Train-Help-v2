"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { APP_NAME } from "@/lib/constants";
import { BrandLogo } from "@/components/ui/brand-logo";

// ─── Indian Railway Junction Canvas ───────────────────────────────

interface StationNode {
  code: string;
  name: string;
  x: number;
  y: number;
}

const STATIONS: StationNode[] = [
  { code: "NDLS", name: "New Delhi", x: 0.38, y: 0.22 },
  { code: "CSMT", name: "Mumbai", x: 0.24, y: 0.52 },
  { code: "HYB", name: "Hyderabad", x: 0.44, y: 0.62 },
  { code: "SBC", name: "Bengaluru", x: 0.38, y: 0.8 },
  { code: "MAS", name: "Chennai", x: 0.54, y: 0.78 },
  { code: "HWH", name: "Kolkata", x: 0.74, y: 0.42 },
];

const CORRIDORS = [
  { from: 0, to: 1 }, // Delhi - Mumbai
  { from: 0, to: 5 }, // Delhi - Kolkata
  { from: 1, to: 2 }, // Mumbai - Hyderabad
  { from: 2, to: 3 }, // Hyderabad - Bengaluru
  { from: 3, to: 4 }, // Bengaluru - Chennai
  { from: 0, to: 3 }, // Delhi - Bengaluru (Karnataka Express corridor!)
  { from: 5, to: 4 }, // Kolkata - Chennai
];

function RailwayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const startTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Subtle track grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const grid = 32;
      for (let x = 0; x < w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw railway corridors
      CORRIDORS.forEach((c) => {
        const s1 = STATIONS[c.from];
        const s2 = STATIONS[c.to];
        const x1 = s1.x * w;
        const y1 = s1.y * h;
        const x2 = s2.x * w;
        const y2 = s2.y * h;

        // Base track line
        ctx.strokeStyle = "rgba(147, 197, 253, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Animated trains moving along corridors
      const t = (now - startTime) / 1000;
      CORRIDORS.forEach((c, idx) => {
        const s1 = STATIONS[c.from];
        const s2 = STATIONS[c.to];
        const x1 = s1.x * w;
        const y1 = s1.y * h;
        const x2 = s2.x * w;
        const y2 = s2.y * h;

        const speed = 0.15 + (idx % 3) * 0.05;
        const progress = ((t * speed + idx * 0.2) % 1);
        const px = x1 + (x2 - x1) * progress;
        const py = y1 + (y2 - y1) * progress;

        // Glowing train head
        const grad = ctx.createRadialGradient(px, py, 1, px, py, 8);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(0.5, "rgba(59, 130, 246, 0.8)");
        grad.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Station nodes
      STATIONS.forEach((s, idx) => {
        const sx = s.x * w;
        const sy = s.y * h;

        // Pulse ring around stations
        const pulse = (Math.sin(t * 2 + idx) + 1) / 2;
        ctx.strokeStyle = `rgba(96, 165, 250, ${0.15 + pulse * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, 8 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();

        // Node dot
        ctx.fillStyle = idx === 3 ? "#ef4444" : "#60a5fa"; // Bengaluru red for cancelled train
        ctx.beginPath();
        ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = "600 11px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(s.code, sx + 10, sy + 3);

        ctx.font = "400 9px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText(s.name, sx + 10, sy + 14);
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 pointer-events-none" />;
}

// ─── Main Auth Screen ─────────────────────────────────────────────

export type AuthTab = "sign-in" | "sign-up";

interface AuthScreenProps {
  initialTab?: AuthTab;
}

export function AuthScreen({ initialTab = "sign-in" }: AuthScreenProps) {
  const {
    signIn,
    signUp,
    signInDemo,
    signInGoogle,
    savedCredentials,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState(savedCredentials?.email || "");
  const [signInPassword, setSignInPassword] = useState(savedCredentials?.password || "");
  const [signInRemember, setSignInRemember] = useState(true);
  const [showSignInPass, setShowSignInPass] = useState(false);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpAgree, setSignUpAgree] = useState(true);
  const [signUpRemember, setSignUpRemember] = useState(true);
  const [showSignUpPass, setShowSignUpPass] = useState(false);

  // Shared State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Sign In submission
  const handleSignInSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!signInEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!signInPassword.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await signIn(signInEmail, signInPassword, signInRemember);
      if (!success) {
        setError("Invalid email or password. Please check your credentials.");
      }
    } catch {
      setError("An unexpected error occurred during sign-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!signUpName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!signUpEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!signUpPassword) {
      setError("Please create a password.");
      return;
    }
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match. Please re-enter carefully.");
      return;
    }
    if (!signUpAgree) {
      setError("Please accept the Passenger Charter and terms to proceed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await signUp(signUpName, signUpEmail, signUpPassword, signUpRemember);
      if (!success) {
        setError("Sign-up could not be completed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred during account creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo sign in shortcut
  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInDemo();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google sign in shortcut
  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 md:p-8 bg-[#0b1329] bg-gradient-to-br from-[#070d1d] via-[#0f1d38] to-[#122244] text-white">
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-700/60 bg-[#0d162a]/90 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        
        {/* ─── Left Hero Panel (5 cols on lg) ────────────────────────── */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 bg-gradient-to-b from-[#111e3b] to-[#0a1226] border-r border-slate-700/50 overflow-hidden">
          {/* Animated Canvas */}
          <RailwayCanvas />

          {/* Top Brand Banner */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <BrandLogo variant="wordmark" size="md" showTagline className="[&_span]:text-white [&_div]:text-blue-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/15 border border-red-500/30 text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
              Live Rail Disruption Monitoring
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <h2 className="text-2xl font-semibold text-white tracking-tight leading-snug">
              Something went wrong.
              <br />
              <span className="text-blue-400 italic font-serif">We&rsquo;ve got this.</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Instantly resolve train cancellations and severe delays with verified alternative berths, 100% automated refund tracking, and zero station counter queues.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Deterministic berth scoring: Confirmed &gt; RAC &gt; WL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Automatic 100% refund tracker with zero clerkage fee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Indian Railways Passenger Charter compliant</span>
              </div>
            </div>
          </div>

          {/* Bottom Corridor Metric */}
          <div className="relative z-10 pt-4 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>SBC · KSR Bengaluru</span>
            <Compass className="h-3.5 w-3.5 text-blue-400" />
            <span>NDLS · New Delhi</span>
          </div>
        </div>

        {/* ─── Right Form Panel (7 cols on lg) ───────────────────────── */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-[#0e172d]/80">
          <div>
            {/* Top Segmented Choice: ALWAYS ASK FOR SIGN IN OR SIGN UP */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Select an Option
                </span>
                <span className="text-xs text-slate-400">
                  {activeTab === "sign-in" ? "Existing Passenger" : "New Registration"}
                </span>
              </div>

              {/* Segmented Control Buttons */}
              <div className="grid grid-cols-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                <button
                  type="button"
                  id="tab-sign-in"
                  onClick={() => {
                    setError(null);
                    setActiveTab("sign-in");
                  }}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === "sign-in"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  id="tab-sign-up"
                  onClick={() => {
                    setError(null);
                    setActiveTab("sign-up");
                  }}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === "sign-up"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Tab Body Switching with Framer Motion */}
            <AnimatePresence mode="wait">
              {activeTab === "sign-in" ? (
                /* ─── Sign In View ─── */
                <motion.div
                  key="sign-in-tab"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Sign in to your account
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Access active PNR recovery status, coach allotments, and refund timelines.
                    </p>
                  </div>

                  {/* 1-Click Demo Shortcut */}
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                        <span>Instant Portfolio Demo</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Continue as Vikram Patel (Train 12627 Karnataka Exp disruption)
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-demo-login"
                      disabled={isSubmitting}
                      onClick={handleDemoLogin}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>1-Click Demo</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/60" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono">
                      <span className="px-3 bg-[#0e172d] text-slate-400">or sign in with email</span>
                    </div>
                  </div>

                  {/* Sign In Form */}
                  <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="signin-email"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Email Address <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="signin-email"
                          type="email"
                          autoComplete="email"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="e.g. vikram.patel@railmail.in"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="signin-password"
                          className="block text-xs font-medium text-slate-300"
                        >
                          Password <span className="text-blue-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSignInEmail("vikram.patel@railmail.in");
                            setSignInPassword("demo1234");
                          }}
                          className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Fill demo credentials
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="signin-password"
                          type={showSignInPass ? "text" : "password"}
                          autoComplete="current-password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                        <button
                          type="button"
                          aria-label={showSignInPass ? "Hide password" : "Show password"}
                          onClick={() => setShowSignInPass(!showSignInPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          {showSignInPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={signInRemember}
                          onChange={(e) => setSignInRemember(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Remember me on this browser</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      id="btn-submit-signin"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-medium text-sm rounded-lg shadow-lg shadow-blue-600/25 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      <span>{isSubmitting ? "Signing In..." : "Sign In to Dashboard"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* ─── Sign Up View ─── */
                <motion.div
                  key="sign-up-tab"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Create your passenger account
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Get immediate disruption alerts, alternative berth confirmations, and zero-fee refunds.
                    </p>
                  </div>

                  {/* Sign Up Form */}
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="signup-name"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Full Name <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="signup-name"
                          type="text"
                          autoComplete="name"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="e.g. Vikram Patel"
                          className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-email"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        Email Address <span className="text-blue-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="e.g. vikram.patel@railmail.in"
                          className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="signup-password"
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Password <span className="text-blue-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="signup-password"
                            type={showSignUpPass ? "text" : "password"}
                            autoComplete="new-password"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full pl-10 pr-8 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                          <button
                            type="button"
                            aria-label={showSignUpPass ? "Hide password" : "Show password"}
                            onClick={() => setShowSignUpPass(!showSignUpPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showSignUpPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-confirm-password"
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Confirm Password <span className="text-blue-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="signup-confirm-password"
                            type={showSignUpPass ? "text" : "password"}
                            autoComplete="new-password"
                            value={signUpConfirmPassword}
                            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={signUpRemember}
                          onChange={(e) => setSignUpRemember(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[11px] text-slate-300">Remember me on this browser</span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={signUpAgree}
                          onChange={(e) => setSignUpAgree(e.target.checked)}
                          className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="leading-tight text-[11px] text-slate-300">
                          I agree to the Indian Railway Passenger Charter and automated refund claims protocol.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      id="btn-submit-signup"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-medium text-sm rounded-lg shadow-lg shadow-blue-600/25 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      <span>{isSubmitting ? "Creating Account..." : "Create Account & Continue"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Social / Google Option */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                id="btn-google-login"
                onClick={handleGoogleLogin}
                className="w-full py-2 px-3 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/70 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>

          {/* Bottom Switcher Note */}
          <div className="pt-4 text-center text-xs text-slate-400">
            {activeTab === "sign-in" ? (
              <p>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveTab("sign-up");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveTab("sign-in");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
