import type { CargoItem } from "./Cargo";
import { Camera, VIEW_H, VIEW_W } from "./Camera";
import type { LevelRun } from "./Level";
import type { Particles } from "./Particles";
import { CHASSIS_SHAPES, VEHICLE } from "./Vehicle";

export const COLORS = {
  outline: "#2D2D2D",
  skyTop: "#8FD3FF",
  skyBottom: "#E6F7FF",
  hillFar: "#C9EFA9",
  hillNear: "#A6E07E",
  grass: "#5BC236",
  dirt: "#8B5A2B",
  dirtDark: "#7A4E25",
  van: "#FF6B35",
  vanDark: "#E2541F",
  window: "#BDE7FF",
  wheel: "#333333",
  hub: "#BBBBBB",
  crate: "#C68642",
  crateDark: "#9C6630",
  egg: "#FFF8E7",
  cakeChoco: "#7B4A2A",
  cakePink: "#FF9EC7",
  cakeWhite: "#FFF5F8",
  cherry: "#E8283C",
};

type Pt = { x: number; y: number };

function poly(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Draws one cargo piece centered at (0,0) in its local frame.
 * Works in world units (y up) and in HUD units (y down) because the shapes
 * are symmetric; `lw` is the outline width in the current units.
 */
export function drawCargoShape(
  ctx: CanvasRenderingContext2D,
  type: CargoItem["type"],
  hw: number,
  hh: number,
  layer: number,
  lw: number,
  yUp = true,
  grey = false,
): void {
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
  ctx.lineJoin = "round";
  const up = yUp ? 1 : -1;
  if (type === "crate") {
    ctx.fillStyle = grey ? "#BDBDBD" : COLORS.crate;
    roundRectPath(ctx, -hw, -hh, hw * 2, hh * 2, hw * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = grey ? "#9A9A9A" : COLORS.crateDark;
    ctx.lineWidth = lw * 0.8;
    const i = hw * 0.28;
    ctx.strokeRect(-hw + i, -hh + i, (hw - i) * 2, (hh - i) * 2);
    ctx.beginPath();
    ctx.moveTo(-hw + i, -hh + i);
    ctx.lineTo(hw - i, hh - i);
    ctx.stroke();
  } else if (type === "egg") {
    ctx.fillStyle = grey ? "#D0D0D0" : COLORS.egg;
    ctx.beginPath();
    ctx.ellipse(0, 0.08 * hh * up, hw * 0.92, hh * 1.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!grey) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.ellipse(-hw * 0.3, hh * 0.35 * up, hw * 0.2, hh * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const base = [COLORS.cakeChoco, COLORS.cakePink, COLORS.cakeWhite][layer] ?? COLORS.cakePink;
    const frosting = [COLORS.cakePink, COLORS.cakeWhite, COLORS.cakePink][layer] ?? COLORS.cakeWhite;
    ctx.fillStyle = grey ? "#BDBDBD" : base;
    roundRectPath(ctx, -hw, -hh, hw * 2, hh * 2, hh * 0.25);
    ctx.fill();
    ctx.stroke();
    // wavy frosting along the top
    ctx.fillStyle = grey ? "#E0E0E0" : frosting;
    ctx.beginPath();
    const top = hh * up;
    const drop = hh * 0.55 * up;
    ctx.moveTo(-hw, top);
    ctx.lineTo(hw, top);
    ctx.lineTo(hw, top - drop * 0.6);
    const waves = 4;
    for (let k = waves; k > 0; k--) {
      const x0 = -hw + ((k - 0.5) / waves) * hw * 2;
      const x1 = -hw + ((k - 1) / waves) * hw * 2;
      ctx.quadraticCurveTo(x0, top - drop * 1.3, x1, top - drop * 0.6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    if (layer === 2) {
      ctx.fillStyle = grey ? "#A0A0A0" : COLORS.cherry;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(0, top + hh * 0.35 * up, hh * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export class Renderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  draw(run: LevelRun, cam: Camera, particles: Particles, time: number): void {
    const ctx = this.ctx;
    this.drawSky(cam);
    this.drawHills(cam);

    ctx.save();
    cam.applyWorld(ctx);
    const lw = 3 / cam.zoom;
    this.drawCheckpoints(run, lw);
    this.drawFinish(run, lw, time);
    this.drawTerrain(run, cam, lw);
    for (const item of run.cargo.items) if (item.lost) this.drawCargo(item, lw);
    this.drawVehicle(run, lw);
    for (const item of run.cargo.items) if (!item.lost) this.drawCargo(item, lw);
    particles.drawWorld(ctx);
    ctx.restore();

    this.drawTextPops(particles, cam);
  }

  private drawSky(cam: Camera): void {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, COLORS.skyTop);
    g.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // clouds (slow parallax)
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const span = VIEW_W + 400;
    for (let i = 0; i < 6; i++) {
      const base = i * 330 + (i % 2) * 90;
      const x = ((((base - cam.x * 4) % span) + span) % span) - 200;
      const y = 70 + ((i * 53) % 140);
      const s = 0.7 + ((i * 37) % 10) / 20;
      ctx.beginPath();
      ctx.arc(x, y, 34 * s, 0, Math.PI * 2);
      ctx.arc(x + 38 * s, y - 14 * s, 42 * s, 0, Math.PI * 2);
      ctx.arc(x + 82 * s, y, 32 * s, 0, Math.PI * 2);
      ctx.rect(x, y, 82 * s, 30 * s);
      ctx.fill();
    }
  }

  private drawHills(cam: Camera): void {
    const ctx = this.ctx;
    const layers = [
      { f: 0.15, color: COLORS.hillFar, base: 430, a: 70, b: 30, freq: 0.0035 },
      { f: 0.35, color: COLORS.hillNear, base: 500, a: 55, b: 22, freq: 0.006 },
    ];
    for (const L of layers) {
      const offset = cam.x * cam.zoom * L.f;
      const baseY = L.base + cam.y * 6 * L.f;
      ctx.fillStyle = L.color;
      ctx.beginPath();
      ctx.moveTo(0, VIEW_H);
      for (let sx = 0; sx <= VIEW_W + 16; sx += 16) {
        const u = sx + offset;
        const y = baseY - Math.sin(u * L.freq) * L.a - Math.sin(u * L.freq * 2.7 + 1.3) * L.b;
        ctx.lineTo(sx, y);
      }
      ctx.lineTo(VIEW_W, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawTerrain(run: LevelRun, cam: Camera, lw: number): void {
    const ctx = this.ctx;
    const pts = run.gw.terrain;
    const [x0, x1] = cam.visibleX(3);
    let i0 = 0;
    while (i0 < pts.length - 1 && pts[i0 + 1].x < x0) i0++;
    let i1 = pts.length - 1;
    while (i1 > 0 && pts[i1 - 1].x > x1) i1--;
    const visible = pts.slice(i0, i1 + 1);
    // Continue the ground flat beyond both level ends (behind the walls).
    if (i0 === 0) visible.unshift({ x: pts[0].x - 60, y: pts[0].y });
    if (i1 === pts.length - 1) visible.push({ x: pts[pts.length - 1].x + 60, y: pts[pts.length - 1].y });
    if (visible.length < 2) return;
    const bottom = cam.y - VIEW_H / cam.zoom - 10;

    const fillPath = (): void => {
      ctx.beginPath();
      ctx.moveTo(visible[0].x, bottom);
      for (const p of visible) ctx.lineTo(p.x, p.y);
      ctx.lineTo(visible[visible.length - 1].x, bottom);
      ctx.closePath();
    };
    const topPath = (): void => {
      ctx.beginPath();
      ctx.moveTo(visible[0].x, visible[0].y);
      for (const p of visible) ctx.lineTo(p.x, p.y);
    };

    fillPath();
    ctx.fillStyle = COLORS.dirt;
    ctx.fill();

    ctx.save();
    fillPath();
    ctx.clip();
    // pebbles
    ctx.fillStyle = COLORS.dirtDark;
    const startX = Math.floor(x0 / 2.5) * 2.5;
    for (let x = startX; x < x1; x += 2.5) {
      const h = Math.sin(x * 12.9898) * 43758.5453;
      const r = h - Math.floor(h);
      const ground = this.heightNear(visible, x + r);
      ctx.beginPath();
      ctx.ellipse(x + r, ground - 0.9 - r * 2.5, 0.18 + r * 0.12, 0.1 + r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // grass band
    topPath();
    ctx.strokeStyle = COLORS.grass;
    ctx.lineWidth = 0.9;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    topPath();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private heightNear(pts: Pt[], x: number): number {
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].x >= x) {
        const a = pts[i - 1];
        const b = pts[i];
        const t = b.x - a.x < 1e-6 ? 0 : (x - a.x) / (b.x - a.x);
        return a.y + (b.y - a.y) * t;
      }
    }
    return pts[pts.length - 1].y;
  }

  private groundAt(run: LevelRun, x: number): number {
    return this.heightNear(run.gw.terrain, x);
  }

  private drawFlag(x: number, y: number, lw: number, color: string, checkered: boolean, wave: number): void {
    const ctx = this.ctx;
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.fillStyle = "#EEEEEE";
    ctx.fillRect(x - 0.06, y, 0.12, 3.2);
    ctx.strokeRect(x - 0.06, y, 0.12, 3.2);
    const top = y + 3.1;
    ctx.beginPath();
    ctx.moveTo(x + 0.06, top);
    ctx.quadraticCurveTo(x + 0.7, top + 0.15 * wave, x + 1.4, top);
    ctx.lineTo(x + 1.4, top - 0.9);
    ctx.quadraticCurveTo(x + 0.7, top - 0.9 + 0.15 * wave, x + 0.06, top - 0.9);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (checkered) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = COLORS.outline;
      for (let cx = 0; cx < 4; cx++)
        for (let cy = 0; cy < 3; cy++)
          if ((cx + cy) % 2 === 0) ctx.fillRect(x + 0.06 + cx * 0.34, top - 0.9 + cy * 0.3 + 0.15 * wave * 0.5, 0.34, 0.3);
      ctx.restore();
    }
    ctx.stroke();
  }

  private drawCheckpoints(run: LevelRun, lw: number): void {
    for (const cx of run.level.checkpoints) {
      const reached = run.reachedCheckpoints.includes(cx);
      this.drawFlag(cx, this.groundAt(run, cx), lw, reached ? "#3BCEAC" : "#FFD23F", false, 1);
    }
  }

  private drawFinish(run: LevelRun, lw: number, time: number): void {
    const ctx = this.ctx;
    const fx = run.level.finishX;
    const gy = this.groundAt(run, fx);
    ctx.lineJoin = "round";

    // house
    const hx = fx + 5;
    const hy = this.groundAt(run, hx + 2);
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.fillStyle = "#FFE6A7";
    ctx.fillRect(hx, hy - 0.3, 4.4, 3.3);
    ctx.strokeRect(hx, hy - 0.3, 4.4, 3.3);
    poly(ctx, [
      { x: hx - 0.5, y: hy + 3 },
      { x: hx + 2.2, y: hy + 5.2 },
      { x: hx + 4.9, y: hy + 3 },
    ]);
    ctx.fillStyle = "#E84A5F";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4D9DE0";
    ctx.fillRect(hx + 0.5, hy - 0.3, 1.1, 2.0);
    ctx.strokeRect(hx + 0.5, hy - 0.3, 1.1, 2.0);
    ctx.fillStyle = COLORS.window;
    ctx.fillRect(hx + 2.4, hy + 1.1, 1.4, 1.1);
    ctx.strokeRect(hx + 2.4, hy + 1.1, 1.4, 1.1);
    ctx.beginPath();
    ctx.moveTo(hx + 3.1, hy + 1.1);
    ctx.lineTo(hx + 3.1, hy + 2.2);
    ctx.moveTo(hx + 2.4, hy + 1.65);
    ctx.lineTo(hx + 3.8, hy + 1.65);
    ctx.stroke();

    // waving customer
    const px = fx + 2.6;
    const py = this.groundAt(run, px);
    ctx.fillStyle = "#3BCEAC";
    roundRectPath(ctx, px - 0.32, py, 0.64, 1.1, 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FFD1A4";
    ctx.beginPath();
    ctx.arc(px, py + 1.45, 0.33, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.outline;
    ctx.beginPath();
    ctx.arc(px - 0.11, py + 1.5, 0.045, 0, Math.PI * 2);
    ctx.arc(px + 0.11, py + 1.5, 0.045, 0, Math.PI * 2);
    ctx.fill();
    const armAngle = 0.5 + Math.sin(time * 6) * 0.45;
    ctx.lineWidth = 0.13;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px + 0.25, py + 0.85);
    ctx.lineTo(px + 0.25 + Math.sin(armAngle) * 0.65, py + 0.85 + Math.cos(armAngle) * 0.65);
    ctx.stroke();
    ctx.lineCap = "butt";

    // finish flag
    this.drawFlag(fx, gy, lw, "#FFFFFF", true, Math.sin(time * 3));
  }

  private drawVehicle(run: LevelRun, lw: number): void {
    const ctx = this.ctx;
    const v = run.vehicle;

    for (const wheel of [v.rearWheel, v.frontWheel]) {
      const p = wheel.getPosition();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(wheel.getAngle());
      ctx.lineWidth = lw;
      ctx.strokeStyle = COLORS.outline;
      ctx.fillStyle = COLORS.wheel;
      ctx.beginPath();
      ctx.arc(0, 0, VEHICLE.wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.hub;
      ctx.beginPath();
      ctx.arc(0, 0, VEHICLE.wheelRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.outline;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    const c = v.chassis.getPosition();
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(v.chassis.getAngle());
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineJoin = "round";

    ctx.fillStyle = COLORS.van;
    poly(ctx, CHASSIS_SHAPES.cabin);
    ctx.fill();
    ctx.stroke();
    // window (cut-out look)
    ctx.fillStyle = COLORS.window;
    poly(ctx, [
      { x: 0.32, y: 0.62 },
      { x: 1.04, y: 0.62 },
      { x: 0.84, y: 0.95 },
      { x: 0.32, y: 0.95 },
    ]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FFD1A4";
    ctx.beginPath();
    ctx.arc(0.55, 0.76, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4D9DE0";
    ctx.beginPath();
    ctx.arc(0.55, 0.82, 0.13, Math.PI * 0.05, Math.PI * 0.95);
    ctx.fill();

    ctx.fillStyle = COLORS.van;
    poly(ctx, CHASSIS_SHAPES.body);
    ctx.fill();
    ctx.stroke();
    poly(ctx, CHASSIS_SHAPES.rearWall);
    ctx.fill();
    ctx.stroke();
    // stripe
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(-1.5, -0.06, 3.0, 0.1);
    // lights
    ctx.fillStyle = "#FFE45E";
    ctx.beginPath();
    ctx.arc(1.42, 0.4, 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#E8283C";
    ctx.fillRect(-1.52, 0.02, 0.08, 0.14);
    ctx.restore();
  }

  private drawCargo(item: CargoItem, lw: number): void {
    if (!item.body) return;
    const ctx = this.ctx;
    const p = item.body.getPosition();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(item.body.getAngle());
    drawCargoShape(ctx, item.type, item.hw, item.hh, item.layer, lw, true, false);
    ctx.restore();
  }

  private drawTextPops(particles: Particles, cam: Camera): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const t of particles.texts) {
      const k = t.life / 1.1;
      const scale = t.life < 0.15 ? 0.6 + (t.life / 0.15) * 0.6 : 1.2 - Math.min(0.2, (t.life - 0.15) * 0.5);
      ctx.save();
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.translate(cam.toScreenX(t.x), cam.toScreenY(t.y));
      ctx.scale(scale, scale);
      ctx.font = `bold 34px ${FONT}`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = COLORS.outline;
      ctx.lineJoin = "round";
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = "#FFD23F";
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }
}

export const FONT = '"Trebuchet MS", "Segoe UI", "Arial Rounded MT Bold", system-ui, sans-serif';
