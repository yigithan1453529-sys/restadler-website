import type { CargoItem } from "./Cargo";
import { Camera, VIEW_H, VIEW_W } from "./Camera";
import type { LevelRun } from "./Level";
import type { Particles } from "./Particles";
import { THEMES, type Theme } from "./themes";
import { CHASSIS_SHAPES, VEHICLE } from "./Vehicle";

export const COLORS = {
  outline: "#2D2D2D",
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
  private theme: Theme = THEMES.meadow;

  constructor(private ctx: CanvasRenderingContext2D) {}

  draw(run: LevelRun, cam: Camera, particles: Particles, time: number): void {
    const ctx = this.ctx;
    const theme = THEMES[run.level.world ?? "meadow"];
    this.theme = theme;
    this.drawSky(cam, time);
    this.drawBackdrop(cam);

    ctx.save();
    cam.applyWorld(ctx);
    const lw = 3 / cam.zoom;
    this.drawDecor(run, cam, lw);
    this.drawCheckpoints(run, lw);
    this.drawFinish(run, lw, time);
    this.drawTerrain(run, cam, lw);
    for (const item of run.cargo.items) if (item.lost) this.drawCargo(item, lw);
    this.drawVehicle(run, lw);
    for (const item of run.cargo.items) if (!item.lost) this.drawCargo(item, lw);
    if (theme.night) this.drawHeadlight(run);
    particles.drawWorld(ctx);
    ctx.restore();

    if (theme.snowfall) this.drawSnowfall(cam, time);
    this.drawTextPops(particles, cam);
  }

  private drawSky(cam: Camera, time: number): void {
    const ctx = this.ctx;
    const th = this.theme;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, th.skyTop);
    g.addColorStop(1, th.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    if (th.night) {
      // twinkling stars and a moon
      for (let i = 0; i < 60; i++) {
        const x = (i * 211.7) % VIEW_W;
        const y = (i * 97.3) % 330;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 2 + i);
        ctx.fillStyle = "#FFF7CC";
        ctx.fillRect(x, y, 3, 3);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFF3B0";
      ctx.beginPath();
      ctx.arc(1040, 110, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th.skyTop;
      ctx.beginPath();
      ctx.arc(1062, 96, 40, 0, Math.PI * 2);
      ctx.fill();
    } else if (th.id === "desert") {
      ctx.fillStyle = "#FFF4C2";
      ctx.beginPath();
      ctx.arc(980, 130, 70, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!th.clouds) return;
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

  private drawBackdrop(cam: Camera): void {
    const ctx = this.ctx;
    const th = this.theme;
    const layers = [
      { f: 0.15, color: th.far, base: 430 },
      { f: 0.35, color: th.near, base: 500 },
    ];
    for (const [li, L] of layers.entries()) {
      const offset = cam.x * cam.zoom * L.f;
      const baseY = L.base + cam.y * 6 * L.f;
      ctx.fillStyle = L.color;

      if (th.backdrop === "city") {
        // building silhouettes with lit windows
        const w = li === 0 ? 90 : 120;
        const first = Math.floor(offset / w);
        for (let k = first; k < first + VIEW_W / w + 2; k++) {
          const r = Math.abs(Math.sin(k * 12.9898 + li * 7) * 43758.5453) % 1;
          const h = (li === 0 ? 120 : 90) + r * (li === 0 ? 200 : 150);
          const x = k * w - offset;
          ctx.fillStyle = L.color;
          ctx.fillRect(x, baseY - h, w - 8, VIEW_H);
          ctx.fillStyle = li === 0 ? "rgba(255,230,140,0.35)" : "rgba(255,230,140,0.6)";
          for (let wy = baseY - h + 14; wy < baseY + 60; wy += 26)
            for (let wx = x + 10; wx < x + w - 22; wx += 22)
              if (Math.abs(Math.sin(wx * 3.1 + wy * 1.7)) > 0.45) ctx.fillRect(wx, wy, 10, 12);
        }
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(0, VIEW_H);
      for (let sx = 0; sx <= VIEW_W + 16; sx += 16) {
        const u = sx + offset;
        let y: number;
        if (th.backdrop === "mountains") {
          const period = li === 0 ? 260 : 340;
          const p = (((u % period) + period) % period) / period;
          const tri = 1 - Math.abs(p * 2 - 1);
          const peak = li === 0 ? 190 : 120;
          y = baseY - tri * peak * (0.7 + 0.3 * Math.sin(Math.floor(u / period) * 2.3));
        } else if (th.backdrop === "dunes") {
          y = baseY - Math.sin(u * 0.003) * 45 - Math.sin(u * 0.0071 + 2) * 20;
        } else {
          const freq = li === 0 ? 0.0035 : 0.006;
          y = baseY - Math.sin(u * freq) * (li === 0 ? 70 : 55) - Math.sin(u * freq * 2.7 + 1.3) * (li === 0 ? 30 : 22);
        }
        ctx.lineTo(sx, y);
      }
      ctx.lineTo(VIEW_W, VIEW_H);
      ctx.closePath();
      ctx.fill();

      if (th.backdrop === "mountains") {
        // snow caps: same outline, clipped to the top part
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(0, 0, VIEW_W, baseY - (li === 0 ? 120 : 80));
        ctx.restore();
      }
    }
  }

  /** Background props along the road (trees, cacti, pines, street lamps). */
  private drawDecor(run: LevelRun, cam: Camera, lw: number): void {
    const ctx = this.ctx;
    const th = this.theme;
    const [x0, x1] = cam.visibleX(4);
    const spacing = th.decor === "lamp" ? 14 : 19;
    const start = Math.floor(x0 / spacing) * spacing;
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineJoin = "round";
    for (let bx = start; bx < x1; bx += spacing) {
      const r = Math.abs(Math.sin(bx * 78.233) * 43758.5453) % 1;
      if (r < 0.3 && th.decor !== "lamp") continue;
      const x = bx + r * 6;
      if (Math.abs(x - run.level.finishX) < 12) continue;
      const g = this.groundAt(run, x);
      if (g < this.groundAt(run, x - 1.5) - 1.5 || g < this.groundAt(run, x + 1.5) - 1.5) continue; // skip pits
      const s = 0.8 + r * 0.5;
      if (th.decor === "tree") {
        ctx.fillStyle = "#8B5A2B";
        ctx.fillRect(x - 0.15 * s, g - 0.3, 0.3 * s, 2 * s);
        ctx.strokeRect(x - 0.15 * s, g - 0.3, 0.3 * s, 2 * s);
        ctx.fillStyle = "#3FAE2A";
        ctx.beginPath();
        ctx.arc(x, g + 2.3 * s, 1.0 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (th.decor === "cactus") {
        ctx.fillStyle = "#4CAF50";
        const arm = (ax: number, ay: number, h: number): void => {
          roundRectPath(ctx, ax - 0.17 * s, ay, 0.34 * s, h * s, 0.17 * s);
          ctx.fill();
          ctx.stroke();
        };
        arm(x - 0.55 * s, g + 1.0 * s, 1.0);
        arm(x + 0.55 * s, g + 1.4 * s, 0.9);
        ctx.fillRect(x - 0.55 * s, g + 1.0 * s, 1.1 * s, 0.26 * s);
        arm(x, g - 0.3, 2.6);
      } else if (th.decor === "pine") {
        ctx.fillStyle = "#6B4A2E";
        ctx.fillRect(x - 0.12 * s, g - 0.3, 0.24 * s, 0.9 * s);
        for (let k = 0; k < 3; k++) {
          const by = g + 0.5 * s + k * 0.7 * s;
          const hw = (1.0 - k * 0.25) * s;
          ctx.fillStyle = "#2E8B57";
          ctx.beginPath();
          ctx.moveTo(x - hw, by);
          ctx.lineTo(x + hw, by);
          ctx.lineTo(x, by + 1.1 * s);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.moveTo(x - hw * 0.35, by + 0.7 * s);
          ctx.lineTo(x + hw * 0.35, by + 0.7 * s);
          ctx.lineTo(x, by + 1.1 * s);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // street lamp with a warm glow
        ctx.fillStyle = "#3A3D4D";
        ctx.fillRect(x - 0.07, g - 0.3, 0.14, 3.6);
        ctx.fillRect(x - 0.07, g + 3.2, 0.7, 0.14);
        const glow = ctx.createRadialGradient(x + 0.6, g + 3.1, 0.1, x + 0.6, g + 3.1, 2.6);
        glow.addColorStop(0, "rgba(255,230,140,0.55)");
        glow.addColorStop(1, "rgba(255,230,140,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x + 0.6, g + 3.1, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFE680";
        ctx.beginPath();
        ctx.arc(x + 0.6, g + 3.05, 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /** Light cone in front of the van (night levels). */
  private drawHeadlight(run: LevelRun): void {
    const ctx = this.ctx;
    const c = run.vehicle.chassis;
    const p = c.getWorldPoint({ x: 1.45, y: 0.4 });
    const a = c.getAngle();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 7, 0);
    g.addColorStop(0, "rgba(255,240,170,0.5)");
    g.addColorStop(1, "rgba(255,240,170,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0.1);
    ctx.lineTo(7, 1.2);
    ctx.lineTo(7, -1.8);
    ctx.lineTo(0, -0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawSnowfall(cam: Camera, time: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 70; i++) {
      const speed = 40 + (i % 7) * 12;
      const x = (((i * 173.3 + Math.sin(time + i) * 20 - cam.x * 8) % VIEW_W) + VIEW_W) % VIEW_W;
      const y = (i * 61.7 + time * speed) % VIEW_H;
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
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
    ctx.fillStyle = this.theme.ground;
    ctx.fill();

    ctx.save();
    fillPath();
    ctx.clip();
    // pebbles
    ctx.fillStyle = this.theme.groundDark;
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
    ctx.strokeStyle = this.theme.top;
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
