// Small background songs made with WebAudio (no audio files). One loop per island.

import type { WorldId } from "./themes";

interface Song {
  bpm: number;
  lead: OscillatorType;
  /** 64 steps (4 bars of 16th notes), MIDI note numbers, 0 = rest. */
  melody: number[];
  /** One bass note per beat (16 beats). */
  bass: number[];
  bell?: boolean;
  hats: boolean;
}

// helper: write melodies compactly as "n,n,0,…" per bar
const bars = (...b: string[]): number[] => b.join(",").split(",").map(Number);

const SONGS: Record<WorldId, Song> = {
  meadow: {
    bpm: 112,
    lead: "triangle",
    melody: bars(
      "72,0,76,0,79,0,76,0,77,0,76,0,74,0,72,0",
      "74,0,77,0,81,0,77,0,79,0,77,0,76,0,74,0",
      "72,0,76,0,79,0,84,0,83,0,79,0,76,0,74,0",
      "72,0,74,0,76,0,74,0,72,0,0,0,67,0,0,0",
    ),
    bass: [48, 48, 55, 55, 50, 50, 55, 55, 48, 48, 53, 55, 48, 55, 48, 43],
    hats: true,
  },
  desert: {
    bpm: 104,
    lead: "square",
    melody: bars(
      "69,0,0,72,0,71,69,0,68,0,69,0,0,0,64,0",
      "65,0,0,68,0,69,71,0,72,0,71,0,69,0,0,0",
      "69,0,0,72,0,74,76,0,77,0,76,0,74,72,0,0",
      "71,0,69,0,68,0,64,0,69,0,0,0,0,0,0,0",
    ),
    bass: [45, 45, 45, 52, 41, 41, 43, 43, 45, 45, 50, 50, 44, 44, 45, 40],
    hats: true,
  },
  snow: {
    bpm: 92,
    lead: "sine",
    bell: true,
    melody: bars(
      "77,0,0,0,81,0,0,0,84,0,0,0,81,0,0,0",
      "79,0,0,0,82,0,0,0,86,0,0,0,82,0,0,0",
      "77,0,81,0,84,0,89,0,88,0,84,0,81,0,0,0",
      "79,0,77,0,76,0,74,0,77,0,0,0,0,0,0,0",
    ),
    bass: [53, 53, 60, 60, 55, 55, 58, 58, 53, 53, 57, 57, 48, 48, 53, 53],
    hats: false,
  },
  city: {
    bpm: 118,
    lead: "square",
    melody: bars(
      "69,0,72,0,0,76,0,74,0,72,0,69,0,0,67,0",
      "69,0,72,0,0,76,0,79,0,77,0,76,0,74,0,0",
      "72,0,74,0,0,76,0,72,0,74,0,76,0,79,0,0",
      "77,0,76,0,74,0,72,0,69,0,0,0,0,0,0,0",
    ),
    bass: [45, 0, 45, 52, 41, 0, 41, 48, 43, 0, 43, 50, 40, 0, 44, 45],
    hats: true,
  },
};

const freq = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

export class Music {
  private gain: GainNode;
  private song: Song = SONGS.meadow;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private noise: AudioBuffer;

  constructor(
    private ctx: AudioContext,
    out: AudioNode,
  ) {
    this.gain = ctx.createGain();
    this.gain.gain.value = 0.16;
    this.gain.connect(out);
    const len = Math.floor(ctx.sampleRate * 0.05);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  /** Switches to the song of an island (keeps playing). */
  setWorld(world: WorldId): void {
    const song = SONGS[world];
    if (song === this.song) return;
    this.song = song;
    this.step = 0;
  }

  start(): void {
    if (this.timer !== null) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    // schedule a little ahead so the rhythm stays steady
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const stepLen = 60 / this.song.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime, stepLen);
      this.step = (this.step + 1) % 64;
      this.nextTime += stepLen;
    }
  }

  private playStep(i: number, t: number, len: number): void {
    const s = this.song;
    const note = s.melody[i];
    if (note) this.note(freq(note), t, s.bell ? len * 6 : len * 1.8, s.lead, s.bell ? 0.3 : 0.22);
    if (i % 4 === 0) {
      const b = s.bass[(i / 4) % 16];
      if (b) this.note(freq(b), t, len * 3.5, "triangle", 0.35);
    }
    if (s.hats && i % 2 === 0) this.hat(t, i % 8 === 4 ? 0.12 : 0.05);
  }

  private note(f: number, t: number, dur: number, type: OscillatorType, vol: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.gain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private hat(t: number, vol: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(f).connect(g).connect(this.gain);
    src.start(t);
  }
}
