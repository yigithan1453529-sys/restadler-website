// Sound effects generated with WebAudio (no audio files).

type Ctx = AudioContext;

export class AudioFx {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  private suspendedByGame = false;
  muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  /** Must be called from a user gesture (browsers block audio before that). */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.6;
        this.master.connect(this.ctx.destination);
        this.noise = this.makeNoise();
      }
      if (this.ctx.state === "suspended" && !this.suspendedByGame) void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.02);
  }

  /** Pause all sound (pause menu, hidden tab, ads). */
  setSuspended(suspended: boolean): void {
    this.suspendedByGame = suspended;
    if (!this.ctx) return;
    try {
      if (suspended) void this.ctx.suspend();
      else void this.ctx.resume();
    } catch {
      /* ignore */
    }
  }

  private makeNoise(): AudioBuffer | null {
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private ready(): Ctx | null {
    return this.ctx && this.master && this.ctx.state === "running" ? this.ctx : null;
  }

  // ---- engine ----

  startEngine(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.engineOsc) return;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.value = 500;
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 50;
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = "square";
    this.engineOsc2.frequency.value = 25;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    this.engineOsc.connect(this.engineFilter);
    this.engineOsc2.connect(g2).connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain).connect(this.master);
    this.engineOsc.start();
    this.engineOsc2.start();
  }

  stopEngine(): void {
    try {
      this.engineOsc?.stop();
      this.engineOsc2?.stop();
      this.engineGain?.disconnect();
    } catch {
      /* ignore */
    }
    this.engineOsc = this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
  }

  /** rpm 0..1 within the current gear, gear 0..n, throttle 0..1 */
  updateEngine(rpm: number, gear: number, throttle: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.engineOsc || !this.engineGain || !this.engineOsc2 || !this.engineFilter) return;
    const t = ctx.currentTime;
    // Each gear revs from low to high, so the sound climbs and drops at every shift.
    const f = 48 + rpm * 120 + gear * 6 + throttle * 10;
    this.engineOsc.frequency.setTargetAtTime(f, t, 0.03);
    this.engineOsc2.frequency.setTargetAtTime(f / 2, t, 0.03);
    this.engineFilter.frequency.setTargetAtTime(380 + throttle * 500 + rpm * 500, t, 0.04);
    this.engineGain.gain.setTargetAtTime(0.05 + throttle * 0.07, t, 0.06);
  }

  /** Nitro whoosh. */
  nitro(): void {
    this.noiseBurst(0.5, 0.35, "bandpass", 1400);
    this.tone(220, 0, 0.4, "sawtooth", 0.08, 660);
  }

  /** Short "blip" when the gearbox shifts up. */
  shift(): void {
    this.noiseBurst(0.06, 0.12, "bandpass", 900);
    this.tone(180, 0, 0.08, "sawtooth", 0.06, 120);
  }

  // ---- one-shot effects ----

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, endFreq?: number): void {
    const ctx = this.ready();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noiseBurst(dur: number, vol: number, filterType: BiquadFilterType, freq: number): void {
    const ctx = this.ready();
    if (!ctx || !this.master || !this.noise) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /** strength 0..1 */
  thump(strength: number): void {
    this.tone(110, 0, 0.18, "sine", 0.25 + strength * 0.35, 45);
    this.noiseBurst(0.12, 0.15 + strength * 0.2, "lowpass", 400);
  }

  crack(): void {
    this.noiseBurst(0.09, 0.5, "highpass", 1800);
    this.tone(900, 0, 0.05, "square", 0.08, 300);
  }

  oops(): void {
    this.tone(520, 0, 0.12, "triangle", 0.18, 330);
  }

  coin(big = false): void {
    this.tone(big ? 880 : 1180, 0, 0.07, "square", 0.08);
    this.tone(big ? 1320 : 1580, 0.06, big ? 0.25 : 0.12, "square", 0.08);
  }

  whoa(): void {
    this.tone(330, 0, 0.12, "triangle", 0.2, 520);
    this.tone(520, 0.1, 0.2, "triangle", 0.2, 300);
  }

  pop(index = 0): void {
    this.tone(600 + index * 180, 0, 0.12, "triangle", 0.25, 900 + index * 180);
  }

  click(): void {
    this.tone(700, 0, 0.05, "square", 0.08);
  }

  checkpoint(): void {
    this.tone(660, 0, 0.12, "triangle", 0.2);
    this.tone(990, 0.1, 0.18, "triangle", 0.2);
  }

  success(): void {
    this.tone(523, 0, 0.18, "triangle", 0.3);
    this.tone(659, 0.15, 0.18, "triangle", 0.3);
    this.tone(784, 0.3, 0.35, "triangle", 0.3);
  }

  fail(): void {
    this.tone(392, 0, 0.25, "triangle", 0.3);
    this.tone(294, 0.22, 0.45, "triangle", 0.3);
  }
}
