export type ParticleKind = "dust" | "splat" | "confetti";

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
}

export interface TextPop {
  text: string;
  x: number; // world
  y: number;
  life: number;
}

const CONFETTI_COLORS = ["#FF6B35", "#FFD23F", "#3BCEAC", "#EE4266", "#540D6E", "#4D9DE0"];
const MAX_PARTICLES = 400;

/** Simple particle system in world coordinates (meters). */
export class Particles {
  items: Particle[] = [];
  texts: TextPop[] = [];
  /** Confetti lives in screen space (pixels). */
  confetti: Particle[] = [];

  clear(): void {
    this.items.length = 0;
    this.texts.length = 0;
    this.confetti.length = 0;
  }

  private push(list: Particle[], p: Particle): void {
    if (list.length >= MAX_PARTICLES) list.shift();
    list.push(p);
  }

  dust(x: number, y: number, dir: number, amount = 1): void {
    for (let i = 0; i < amount; i++) {
      this.push(this.items, {
        kind: "dust",
        x: x + (Math.random() - 0.5) * 0.3,
        y: y + Math.random() * 0.1,
        vx: -dir * (0.6 + Math.random() * 1.2),
        vy: 0.3 + Math.random() * 0.8,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 0.12 + Math.random() * 0.12,
        color: Math.random() < 0.5 ? "#E8D9B5" : "#D9C49A",
        angle: 0,
        spin: 0,
      });
    }
  }

  splat(x: number, y: number): void {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI;
      const s = 1.5 + Math.random() * 3;
      this.push(this.items, {
        kind: "splat",
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.5,
        size: 0.05 + Math.random() * 0.08,
        color: i % 3 === 0 ? "#FFFFFF" : "#FFC300",
        angle: 0,
        spin: 0,
      });
    }
  }

  confettiBurst(width: number): void {
    for (let i = 0; i < 140; i++) {
      this.push(this.confetti, {
        kind: "confetti",
        x: Math.random() * width,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 120,
        vy: 150 + Math.random() * 200,
        life: 0,
        maxLife: 3 + Math.random() * 1.5,
        size: 7 + Math.random() * 7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 12,
      });
    }
  }

  text(text: string, x: number, y: number): void {
    this.texts.push({ text, x, y, life: 0 });
  }

  update(dt: number): void {
    for (const p of this.items) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "splat") p.vy -= 10 * dt;
      else {
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.size += dt * 0.25;
      }
    }
    this.items = this.items.filter((p) => p.life < p.maxLife);

    for (const p of this.confetti) {
      p.life += dt;
      p.x += (p.vx + Math.sin(p.life * 4 + p.spin) * 40) * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
    }
    this.confetti = this.confetti.filter((p) => p.life < p.maxLife);

    for (const t of this.texts) {
      t.life += dt;
      t.y += dt * 1.2;
    }
    this.texts = this.texts.filter((t) => t.life < 1.1);
  }

  /** Draws world particles. The context must already use world coordinates. */
  drawWorld(ctx: CanvasRenderingContext2D): void {
    for (const p of this.items) {
      const a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = p.kind === "dust" ? a * 0.8 : Math.min(1, a * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Draws confetti in screen space. */
  drawConfetti(ctx: CanvasRenderingContext2D): void {
    for (const p of this.confetti) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.maxLife - p.life) * 2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
