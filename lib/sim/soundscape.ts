/**
 * lib/sim/soundscape.ts
 * Synthesized Web Audio API sound engine for railway simulation.
 * Pure procedural synthesis without heavy external audio files.
 */

class SimSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private wheelGainNode: GainNode | null = null;
  private wheelSourceNode: AudioBufferSourceNode | null = null;
  private isWheelRolling: boolean = false;

  constructor() {
    if (typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem("travelrescue_sim_muted");
        // Defaults to MUTED on first load per autoplay policy and accessibility
        this.isMuted = stored !== null ? stored === "true" : true;
      } catch {
        this.isMuted = true;
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined" && typeof globalThis !== "undefined") {
      const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      if (!this.ctx && g.AudioContext) {
        this.ctx = new g.AudioContext();
      }
    }

    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("travelrescue_sim_muted", String(muted));
      } catch {
        // LocalStorage fallback
      }
    }

    if (muted) {
      this.stopWheelRoll();
    }
  }

  /**
   * T6.2 Departure Chime: Multi-tone harmonic chime when train departs origin
   */
  public playDepartureChime(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.75);
    });
  }

  /**
   * T6.2 Advisor Ding: Clean high-register bell when AI dispatcher generates candidates
   */
  public playAdvisorDing(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(1174.66, now); // D6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  /**
   * T6.2 Obstacle Warning Siren: Alternating dual-frequency alert
   */
  public playObstacleSiren(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(659.25, now + 0.15);
    osc.frequency.setValueAtTime(880, now + 0.3);
    osc.frequency.setValueAtTime(659.25, now + 0.45);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  /**
   * T6.2 Wheel-Roll Ambient Loop: Synthesized continuous rail rolling sound
   */
  public startWheelRoll(speedMultiplier = 1): void {
    if (this.isMuted || this.isWheelRolling) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Filtered rhythmic rolling pink/brown noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const brown = (lastOut + 0.02 * white) / 1.02;
        lastOut = brown;
        // subtle rhythmic modulation every 0.35s simulating rail joints
        const rhythm = Math.sin((i / ctx.sampleRate) * Math.PI * 4.5);
        data[i] = brown * (0.6 + 0.4 * Math.abs(rhythm));
      }

      this.wheelSourceNode = ctx.createBufferSource();
      this.wheelSourceNode.buffer = buffer;
      this.wheelSourceNode.loop = true;
      this.wheelSourceNode.playbackRate.setValueAtTime(
        Math.min(2.5, Math.max(0.6, speedMultiplier / 5)),
        ctx.currentTime
      );

      // Lowpass filter to muffle raw noise into warm mechanical roll
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      this.wheelGainNode = ctx.createGain();
      this.wheelGainNode.gain.setValueAtTime(0.08, ctx.currentTime);

      this.wheelSourceNode.connect(filter);
      filter.connect(this.wheelGainNode);
      this.wheelGainNode.connect(ctx.destination);

      this.wheelSourceNode.start(0);
      this.isWheelRolling = true;
    } catch (err) {
      console.warn("Could not start wheel roll loop:", err);
    }
  }

  public stopWheelRoll(): void {
    if (this.wheelSourceNode && this.isWheelRolling) {
      try {
        this.wheelSourceNode.stop();
        this.wheelSourceNode.disconnect();
      } catch {
        // ignore already stopped node
      }
      this.wheelSourceNode = null;
      this.isWheelRolling = false;
    }
  }
}

export const simSoundscape = new SimSoundscapeEngine();
