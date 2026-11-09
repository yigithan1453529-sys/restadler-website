import { SCOOP_COLORS, type CargoItem } from "./Cargo";
import { Camera, VIEW_H, VIEW_W } from "./Camera";
import type { LevelRun } from "./Level";
import type { Particles } from "./Particles";
import { CUSTOMER_KINDS, drawCustomer, type Mood } from "./Characters";
import { Obstacles } from "./Obstacles";
import { drawSkyTraffic } from "./SkyTraffic";
import { THEMES, type Theme } from "./themes";
import { getVehicleSpec, type VehicleSpec } from "./Vehicle";

export const COLORS = {
  outline: "#2D2D2D",
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
  extra: { melt?: number; waterAngle?: number; time?: number } = {},
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
  } else if (type === "icecream") {
    const color = grey ? "#C8C8C8" : SCOOP_COLORS[layer % SCOOP_COLORS.length];
    const melt = extra.melt ?? 0;
    ctx.fillStyle = color;
    // drips grow while the scoop melts
    for (let k = -1; k <= 1; k++) {
      const len = hh * (0.25 + melt * (0.6 + 0.3 * Math.abs(k)));
      ctx.beginPath();
      ctx.ellipse(k * hw * 0.5, -hh * 0.75 * up - (len * 0.5) * up, hw * 0.2, len * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, hw, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!grey) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-hw * 0.35, hh * 0.35 * up, hw * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "aquarium") {
    // water (kept level with the world, tilted by sloshing), then fish, then glass
    ctx.save();
    ctx.beginPath();
    ctx.rect(-hw, -hh, hw * 2, hh * 2);
    ctx.clip();
    ctx.save();
    ctx.rotate((extra.waterAngle ?? 0) * up);
    ctx.fillStyle = grey ? "#D5D5D5" : "rgba(80,180,255,0.75)";
    ctx.fillRect(-hw * 2, -hh * 3 * up, hw * 4, hh * 3.4 * up);
    ctx.restore();
    if (!grey) {
      const time = extra.time ?? 0;
      const fx = Math.sin(time * 1.3) * hw * 0.45;
      const dir = Math.cos(time * 1.3) >= 0 ? 1 : -1;
      ctx.fillStyle = "#FF8C1A";
      ctx.beginPath();
      ctx.ellipse(fx, -hh * 0.15 * up, hw * 0.28, hh * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = lw * 0.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx - dir * hw * 0.24, -hh * 0.15 * up);
      ctx.lineTo(fx - dir * hw * 0.45, -hh * 0.15 * up + hh * 0.18);
      ctx.lineTo(fx - dir * hw * 0.45, -hh * 0.15 * up - hh * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.outline;
      ctx.beginPath();
      ctx.arc(fx + dir * hw * 0.13, -hh * 0.1 * up, hw * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.fillStyle = "rgba(220,245,255,0.25)";
    ctx.beginPath();
    ctx.rect(-hw, -hh, hw * 2, hh * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === "bowling") {
    ctx.fillStyle = grey ? "#A8A8A8" : "#3D4FB5";
    ctx.beginPath();
    ctx.arc(0, 0, hw, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.outline;
    for (const [hx, hy] of [[-0.25, 0.3], [0.05, 0.42], [0.1, 0.15]]) {
      ctx.beginPath();
      ctx.arc(hx * hw * 1.6, hy * hh * 1.6 * up, hw * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "grandpa") {
    const g = grey;
    // deckchair frame
    ctx.strokeStyle = g ? "#999999" : "#8B5A2B";
    ctx.lineWidth = hw * 0.12;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.9, -hh);
    ctx.lineTo(hw * 0.5, hh * 0.2 * up);
    ctx.moveTo(hw * 0.9, -hh);
    ctx.lineTo(-hw * 0.6, hh * 0.9 * up);
    ctx.stroke();
    // striped fabric
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.75, hh * 0.95 * up);
    ctx.lineTo(-hw * 0.2, -hh * 0.35 * up);
    ctx.lineTo(hw * 0.75, -hh * 0.35 * up);
    ctx.lineTo(hw * 0.5, -hh * 0.05 * up);
    ctx.lineTo(-hw * 0.05, -hh * 0.05 * up);
    ctx.lineTo(-hw * 0.5, hh * 0.95 * up);
    ctx.closePath();
    ctx.fillStyle = g ? "#CCCCCC" : "#4D9DE0";
    ctx.fill();
    ctx.stroke();
    // grandpa: legs, body, head with hat and glasses
    ctx.fillStyle = g ? "#BBBBBB" : "#7B8B6F";
    ctx.beginPath();
    ctx.moveTo(-hw * 0.05, -hh * 0.05 * up);
    ctx.lineTo(hw * 0.75, -hh * 0.05 * up);
    ctx.lineTo(hw * 0.75, hh * 0.15 * up);
    ctx.lineTo(-hw * 0.05, hh * 0.2 * up);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = g ? "#DDDDDD" : "#F2F2F2";
    ctx.beginPath();
    ctx.ellipse(-hw * 0.2, hh * 0.35 * up, hw * 0.28, hh * 0.32, -0.4 * up, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = g ? "#CFCFCF" : "#FFD1A4";
    ctx.beginPath();
    ctx.arc(-hw * 0.4, hh * 0.82 * up, hw * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = g ? "#AAAAAA" : "#F5E6A8";
    ctx.beginPath();
    ctx.ellipse(-hw * 0.4, hh * 1.1 * up, hw * 0.5, hh * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.outline;
    ctx.fillRect(-hw * 0.3, hh * 0.82 * up - hh * 0.06, hw * 0.34, hh * 0.12);
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

/** Stable pseudo-random number 0..1 from three integers. */
function hash(a: number, b: number, c: number): number {
  const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

export function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  lw: number,
  sport = false,
): void {
  if (sport) {
    // racing rim: big silver rim with five spokes
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.fillStyle = "#2B2B2B";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#D9DDE2";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#8A9099";
    ctx.lineWidth = r * 0.12;
    ctx.lineCap = "round";
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14);
      ctx.lineTo(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.fillStyle = "#555B63";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
  ctx.fillStyle = COLORS.wheel;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.hub;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.outline;
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draws the chassis in its local frame (meters, y up). */
export function drawChassis(ctx: CanvasRenderingContext2D, spec: VehicleSpec, lw: number, color = spec.color, time = 0): void {
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
  ctx.lineJoin = "round";
  if (spec.id === "racer") drawRacerBack(ctx, lw);
  if (spec.id === "lorry") bar(ctx, [{ x: 0.32, y: 0.9 }, { x: 0.32, y: 1.62 }], 0.12, "#9AA1A9", lw);
  if (spec.id === "superRed") {
    // small rear wing
    bar(ctx, [{ x: -1.25, y: 0.38 }, { x: -1.3, y: 0.62 }], 0.05, "#2D2D2D", lw);
    ctx.fillStyle = "#2D2D2D";
    poly(ctx, [
      { x: -1.62, y: 0.6 },
      { x: -1.05, y: 0.6 },
      { x: -1.05, y: 0.68 },
      { x: -1.66, y: 0.7 },
    ]);
    ctx.fill();
  }
  if (spec.id === "tractor") {
    // exhaust pipe
    ctx.fillStyle = "#555555";
    ctx.fillRect(1.25, 0.55, 0.1, 0.55);
    ctx.strokeRect(1.25, 0.55, 0.1, 0.55);
  }
  ctx.fillStyle = color;
  poly(ctx, spec.cabin);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.window;
  poly(ctx, spec.window);
  ctx.fill();
  ctx.stroke();
  const d = spec.driver;
  ctx.fillStyle = "#FFD1A4";
  ctx.beginPath();
  ctx.arc(d.x, d.y, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = spec.id === "tractor" ? "#FFD23F" : "#4D9DE0";
  ctx.beginPath();
  ctx.arc(d.x, d.y + 0.06, 0.13, Math.PI * 0.05, Math.PI * 0.95);
  ctx.fill();

  ctx.fillStyle = color;
  poly(ctx, spec.body);
  ctx.fill();
  ctx.stroke();
  poly(ctx, spec.rearWall);
  ctx.fill();
  ctx.stroke();
  if (spec.id === "pickup") {
    // rails on the high walls
    ctx.strokeStyle = "rgba(45,45,45,0.5)";
    ctx.beginPath();
    ctx.moveTo(-1.5, 0.48);
    ctx.lineTo(spec.bed.left, 0.48);
    ctx.stroke();
    ctx.strokeStyle = COLORS.outline;
  }
  if (spec.id === "racer") drawRacerFront(ctx, spec, lw);
  else drawDetails(ctx, spec, lw, time);
  // head- and taillights
  const front = spec.cabin.reduce((m, p) => Math.max(m, p.x), 0);
  const sporty = spec.id === "superRed" || spec.id === "superYellow";
  ctx.fillStyle = "#FFE45E";
  if (sporty) {
    poly(ctx, [
      { x: front - 0.3, y: 0.3 },
      { x: front - 0.02, y: 0.24 },
      { x: front - 0.04, y: 0.29 },
      { x: front - 0.32, y: 0.34 },
    ]);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(front - 0.08, 0.4, 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#E8283C";
  ctx.fillRect(-1.52, 0.02, 0.08, 0.14);
}

/** Flashing red and blue lights on the roof. */
function lightBar(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, lw: number): void {
  const on = Math.sin(time * 12) > 0;
  ctx.fillStyle = "#2D2D2D";
  ctx.fillRect(x - 0.3, y, 0.6, 0.06);
  for (const [dx, col, lit] of [
    [-0.15, "#FF3B3B", on],
    [0.15, "#3D8BFF", !on],
  ] as const) {
    if (lit) {
      const g = ctx.createRadialGradient(x + dx, y + 0.13, 0.02, x + dx, y + 0.13, 0.5);
      g.addColorStop(0, col === "#FF3B3B" ? "rgba(255,80,80,0.55)" : "rgba(80,150,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + dx, y + 0.13, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = lit ? col : col === "#FF3B3B" ? "#8A2C2C" : "#2C4A8A";
    roundRectPath(ctx, x + dx - 0.13, y + 0.05, 0.26, 0.15, 0.05);
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
  }
}

/** Text painted on a vehicle side (local units, y up). */
function sideText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 40, -size / 40);
  ctx.font = `900 40px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Stripes, lettering and lights for each vehicle. */
function drawDetails(ctx: CanvasRenderingContext2D, spec: VehicleSpec, lw: number, time: number): void {
  const stripe = (color: string, y = -0.06, h = 0.1): void => {
    ctx.fillStyle = color;
    ctx.fillRect(-1.5, y, 3.0, h);
  };
  switch (spec.id) {
    case "police":
      ctx.fillStyle = "#1D3557";
      ctx.fillRect(-0.3, -0.2, 1.6, 0.4);
      ctx.strokeRect(-0.3, -0.2, 1.6, 0.4);
      sideText(ctx, "POLICE", 0.5, 0.0, 0.2, "#FFFFFF");
      lightBar(ctx, 0.5, 0.98, time, lw);
      break;
    case "policeVan":
      stripe("#FFFFFF", -0.09, 0.16);
      sideText(ctx, "POLICE", 0.44, 0.45, 0.15, "#FFFFFF");
      lightBar(ctx, 0.62, 1.2, time, lw);
      break;
    case "ambulance":
      stripe("#E63946", -0.08, 0.14);
      ctx.fillStyle = "#E63946";
      ctx.fillRect(0.3, 0.75, 0.24, 0.08);
      ctx.fillRect(0.38, 0.67, 0.08, 0.24);
      lightBar(ctx, 0.62, 1.15, time, lw);
      break;
    case "fireTruck":
      stripe("#FFFFFF", -0.08, 0.12);
      stripe("#FFD23F", -0.15, 0.04);
      // ladder on the roof racks, reaching back over the bed
      bar(ctx, [{ x: 0.3, y: 1.1 }, { x: 0.3, y: 1.22 }], 0.05, "#9AA1A9", lw);
      bar(ctx, [{ x: -1.3, y: 0.55 }, { x: -1.3, y: 1.22 }], 0.05, "#9AA1A9", lw);
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = lw;
      ctx.fillStyle = "#D9DDE2";
      ctx.fillRect(-1.55, 1.2, 2.0, 0.05);
      ctx.strokeRect(-1.55, 1.2, 2.0, 0.05);
      ctx.fillRect(-1.55, 1.34, 2.0, 0.05);
      ctx.strokeRect(-1.55, 1.34, 2.0, 0.05);
      for (let x = -1.5; x < 0.45; x += 0.22) {
        ctx.fillRect(x, 1.25, 0.04, 0.09);
      }
      lightBar(ctx, 1.0, 1.1, time, lw);
      break;
    case "lorry":
      stripe("#2D2D2D", -0.06, 0.08);
      ctx.fillStyle = "#4A4F55";
      ctx.fillRect(1.5, 0.25, 0.1, 0.45);
      ctx.strokeRect(1.5, 0.25, 0.1, 0.45);
      ctx.fillStyle = "#D9DDE2";
      ctx.fillRect(1.45, -0.22, 0.2, 0.14);
      ctx.strokeRect(1.45, -0.22, 0.2, 0.14);
      break;
    case "superRed":
    case "superYellow": {
      // dark wheel arches make the car look low
      ctx.fillStyle = "#2D2D2D";
      for (const w of [spec.rear, spec.front]) {
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r + 0.06, 0.05 * Math.PI, 0.95 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
      // dark side air intake in front of the rear wheel and a thin racing line
      ctx.fillStyle = "#2D2D2D";
      poly(ctx, [
        { x: -0.45, y: 0.12 },
        { x: 0.05, y: 0.18 },
        { x: 0.05, y: -0.05 },
        { x: -0.3, y: -0.1 },
      ]);
      ctx.fill();
      ctx.fillStyle = spec.id === "superRed" ? "#FFFFFF" : "#2D2D2D";
      ctx.fillRect(-1.5, -0.14, 3.15, 0.04);
      if (spec.id === "superYellow") {
        // angular vents on the cabin side
        ctx.fillStyle = "#2D2D2D";
        for (let k = 0; k < 3; k++) ctx.fillRect(0.95 + k * 0.12, 0.25, 0.07, 0.07);
      }
      break;
    }
    default:
      stripe("#FFFFFF");
  }
}

const SPORT_RIMS = new Set(["racer", "superRed", "superYellow", "police"]);

/** A thick bar with a dark outline (pipes, struts, roll cage). */
function bar(ctx: CanvasRenderingContext2D, pts: Pt[], width: number, color: string, lw: number): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = width + lw * 2;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
}

/** Race truck parts behind the body: exhaust stacks, roll cage, rear wing. */
function drawRacerBack(ctx: CanvasRenderingContext2D, lw: number): void {
  // roll cage over the bed
  bar(ctx, [{ x: 0.05, y: 0.4 }, { x: -0.05, y: 1.15 }, { x: -0.75, y: 0.45 }], 0.07, "#6C757D", lw);
  // two exhaust stacks leaning backwards
  for (const dx of [0, -0.22]) {
    bar(ctx, [{ x: -0.05 + dx, y: 0.35 }, { x: -0.22 + dx, y: 1.3 }], 0.13, "#9AA1A9", lw);
    ctx.fillStyle = "#3A3A3A";
    ctx.beginPath();
    ctx.ellipse(-0.22 + dx, 1.32, 0.08, 0.04, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // big rear wing on two struts
  bar(ctx, [{ x: -1.3, y: 0.42 }, { x: -1.36, y: 1.0 }], 0.06, "#4A4F55", lw);
  bar(ctx, [{ x: -0.95, y: 0.42 }, { x: -1.02, y: 1.0 }], 0.06, "#4A4F55", lw);
  ctx.fillStyle = "#4A4F55";
  poly(ctx, [
    { x: -1.78, y: 1.0 },
    { x: -0.82, y: 0.98 },
    { x: -0.78, y: 1.1 },
    { x: -1.82, y: 1.16 },
  ]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#E63946";
  poly(ctx, [
    { x: -1.86, y: 0.92 },
    { x: -1.74, y: 0.92 },
    { x: -1.74, y: 1.24 },
    { x: -1.86, y: 1.24 },
  ]);
  ctx.fill();
  ctx.stroke();
}

/** Race truck details on the body: fender flares, stripes, start number, grille. */
function drawRacerFront(ctx: CanvasRenderingContext2D, spec: VehicleSpec, lw: number): void {
  // grey diagonal stripes, clipped to the body and cabin
  ctx.save();
  ctx.beginPath();
  for (const shape of [spec.body, spec.cabin]) {
    ctx.moveTo(shape[0].x, shape[0].y);
    for (const p of shape.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
  }
  ctx.clip();
  ctx.fillStyle = "#6C757D";
  for (const x0 of [-0.9, -0.45, 1.05]) {
    poly(ctx, [
      { x: x0, y: -0.35 },
      { x: x0 + 0.18, y: -0.35 },
      { x: x0 + 0.62, y: 0.7 },
      { x: x0 + 0.44, y: 0.7 },
    ]);
    ctx.fill();
  }
  // grey lower edge
  ctx.fillRect(-1.6, -0.34, 3.3, 0.12);
  ctx.restore();

  // start number 47 in white
  ctx.save();
  ctx.translate(0.48, 0.44);
  ctx.scale(0.0085, -0.0085);
  ctx.font = `bold 44px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = COLORS.outline;
  ctx.strokeText("47", 0, 0);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("47", 0, 0);
  ctx.restore();

  // grille at the front
  ctx.fillStyle = "#4A4F55";
  ctx.fillRect(1.52, -0.25, 0.1, 0.6);
  ctx.strokeRect(1.52, -0.25, 0.1, 0.6);

  // grey fender flares over both wheels
  for (const w of [spec.rear, spec.front]) {
    ctx.beginPath();
    ctx.arc(w.x, w.y + 0.02, w.r + 0.13, Math.PI * 0.08, Math.PI * 0.92);
    ctx.lineCap = "butt";
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 0.17 + lw * 2;
    ctx.stroke();
    ctx.strokeStyle = "#6C757D";
    ctx.lineWidth = 0.17;
    ctx.stroke();
  }
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
}

/** A vehicle standing still (for the vehicle picker). */
export function drawVehiclePreview(ctx: CanvasRenderingContext2D, spec: VehicleSpec, lw: number, color = spec.color, time = 0): void {
  const sport = SPORT_RIMS.has(spec.id);
  drawWheel(ctx, spec.rear.x, spec.rear.y, spec.rear.r, 0, lw, sport);
  drawWheel(ctx, spec.front.x, spec.front.y, spec.front.r, 0, lw, sport);
  drawChassis(ctx, spec, lw, color, time);
}

export class Renderer {
  private theme: Theme = THEMES.meadow;
  private paint: string | null = null;
  private time = 0;
  private runTime = 0;

  constructor(private ctx: CanvasRenderingContext2D) {}

  draw(
    run: LevelRun,
    cam: Camera,
    particles: Particles,
    time: number,
    paint: string | null = null,
    ghost: { x: number; y: number; angle: number; vehicle: string } | null = null,
  ): void {
    this.paint = paint;
    const ctx = this.ctx;
    const theme = THEMES[run.level.world ?? "meadow"];
    this.time = time;
    this.runTime = run.time;
    this.theme = theme;
    this.drawSky(cam, time);
    drawSkyTraffic(this.ctx, time, theme.night);
    this.drawBackdrop(cam);

    ctx.save();
    cam.applyWorld(ctx);
    const lw = 3 / cam.zoom;
    this.drawDecor(run, cam, lw);
    this.drawCheckpoints(run, lw);
    this.drawFinish(run, lw, time);
    this.drawTerrain(run, cam, lw);
    this.drawObstacles(run, lw, time);
    for (const item of run.cargo.items) if (item.lost) this.drawCargo(item, lw);
    this.drawPickups(run, lw, time);
    if (ghost) {
      // the best run so far, see-through
      const spec = getVehicleSpec(ghost.vehicle);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(ghost.angle);
      drawVehiclePreview(ctx, spec, lw, "#FFFFFF", time);
      ctx.restore();
    }
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
        this.drawSkyline(li, offset, baseY, L.color);
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

  /**
   * One layer of skyscrapers. Every building and window gets its look from its
   * own index (not from the screen position), so nothing flickers while driving.
   */
  private drawSkyline(layer: number, offset: number, baseY: number, color: string): void {
    const ctx = this.ctx;
    const slot = layer === 0 ? 96 : 130;
    const first = Math.floor(offset / slot) - 1;
    const blink = Math.sin(this.time * 3) > 0;
    for (let k = first; k < first + VIEW_W / slot + 3; k++) {
      const w = slot * (0.62 + hash(k, layer, 1) * 0.3);
      const h = (layer === 0 ? 150 : 90) + hash(k, layer, 2) * (layer === 0 ? 190 : 140);
      const x = k * slot - offset + (slot - w) / 2;
      const top = baseY - h;
      ctx.fillStyle = color;
      ctx.fillRect(x, top, w, VIEW_H - top);
      // rooftop: some buildings get an antenna with a slow red light
      if (hash(k, layer, 3) > 0.6) {
        ctx.fillRect(x + w / 2 - 2, top - 26, 4, 26);
        if (blink) {
          ctx.fillStyle = "#FF5A5A";
          ctx.beginPath();
          ctx.arc(x + w / 2, top - 28, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // windows on a fixed grid; about 45 % are lit, in two warm tones
      const cols = Math.max(2, Math.floor((w - 12) / 20));
      const gapX = (w - cols * 10) / (cols + 1);
      const rows = Math.floor((VIEW_H - top) / 26);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = hash(k * 31 + r, layer * 7 + c, 4);
          if (v > 0.45) continue;
          ctx.fillStyle =
            layer === 0
              ? "rgba(255,226,140,0.32)"
              : v < 0.12
                ? "rgba(255,246,210,0.85)"
                : "rgba(255,214,120,0.7)";
          ctx.fillRect(x + gapX + c * (10 + gapX), top + 14 + r * 26, 10, 13);
        }
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

  /** Spinning coins and the big bonus star. */
  private drawPickups(run: LevelRun, lw: number, time: number): void {
    const ctx = this.ctx;
    for (const p of run.pickups) {
      if (p.taken) continue;
      ctx.save();
      ctx.translate(p.x, p.y + Math.sin(time * 3 + p.x) * 0.08);
      if (p.kind === "coin") {
        const sx = Math.max(0.15, Math.abs(Math.cos(time * 3 + p.x * 0.7)));
        ctx.scale(sx, 1);
        ctx.beginPath();
        ctx.arc(0, 0, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#FFC93C";
        ctx.fill();
        ctx.lineWidth = lw / sx;
        ctx.strokeStyle = COLORS.outline;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = "#E0A21B";
        ctx.lineWidth = 0.05;
        ctx.stroke();
      } else {
        const glow = ctx.createRadialGradient(0, 0, 0.1, 0, 0, 1.2);
        glow.addColorStop(0, "rgba(255,230,120,0.7)");
        glow.addColorStop(1, "rgba(255,230,120,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(time * 1.5);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 === 0 ? 0.6 : 0.28;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = "#FFD23F";
        ctx.fill();
        ctx.lineWidth = lw;
        ctx.strokeStyle = COLORS.outline;
        ctx.lineJoin = "round";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawObstacles(run: LevelRun, lw: number, time: number): void {
    const ctx = this.ctx;
    const obs = run.gw.obstacles;
    ctx.lineJoin = "round";

    // ice and mud bands along the ground
    for (const sf of obs.surfaces) {
      const pts = run.gw.terrain.filter((p) => p.x >= sf.x0 && p.x <= sf.x1);
      pts.unshift({ x: sf.x0, y: this.groundAt(run, sf.x0) });
      pts.push({ x: sf.x1, y: this.groundAt(run, sf.x1) });
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.lineWidth = 0.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = sf.type === "ice" ? "#BDEBFF" : "#5A3A1E";
      ctx.stroke();
      ctx.lineCap = "butt";
      ctx.lineWidth = lw;
      ctx.strokeStyle = COLORS.outline;
      ctx.stroke();
      for (let x = Math.ceil(sf.x0) + 0.5; x < sf.x1; x += 1.7) {
        const y = this.groundAt(run, x);
        if (sf.type === "ice") {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 0.07;
          ctx.beginPath();
          ctx.moveTo(x - 0.3, y - 0.12);
          ctx.lineTo(x + 0.2, y + 0.05);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#6E4826";
          ctx.beginPath();
          ctx.ellipse(x, y + 0.08, 0.32, 0.14, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (const o of obs.items) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = COLORS.outline;
      if (o.type === "bridge") {
        // ropes
        ctx.strokeStyle = "#6B4A2E";
        ctx.lineWidth = 0.06;
        ctx.beginPath();
        ctx.moveTo(o.anchors[0].x, o.anchors[0].y + 0.9);
        for (const p of o.planks) {
          const top = p.getWorldPoint({ x: 0, y: 0.9 });
          ctx.lineTo(top.x, top.y);
        }
        ctx.lineTo(o.anchors[1].x, o.anchors[1].y + 0.9);
        ctx.stroke();
        for (const a of o.anchors) {
          ctx.fillStyle = "#8B5A2B";
          ctx.lineWidth = lw;
          ctx.strokeStyle = COLORS.outline;
          ctx.fillRect(a.x - 0.1, a.y - 0.4, 0.2, 1.5);
          ctx.strokeRect(a.x - 0.1, a.y - 0.4, 0.2, 1.5);
        }
        for (const p of o.planks) {
          const c = p.getPosition();
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(p.getAngle());
          ctx.fillStyle = "#C68642";
          ctx.fillRect(-o.hw + 0.02, -0.1, o.hw * 2 - 0.04, 0.2);
          ctx.strokeRect(-o.hw + 0.02, -0.1, o.hw * 2 - 0.04, 0.2);
          ctx.restore();
        }
      } else if (o.type === "tunnel") {
        const h = 6;
        ctx.fillStyle = "#9A8F86";
        ctx.fillRect(o.x0, o.y, o.x1 - o.x0, h);
        ctx.strokeRect(o.x0, o.y, o.x1 - o.x0, h);
        ctx.fillStyle = "#857A72";
        for (let row = 0; row < h / 0.6; row++) {
          const off = row % 2 === 0 ? 0 : 0.6;
          for (let x = o.x0 + off; x < o.x1 - 0.3; x += 1.2) {
            ctx.fillRect(x + 0.08, o.y + row * 0.6 + 0.08, Math.min(1.05, o.x1 - x - 0.1), 0.44);
          }
        }
        // warning stripes on the edge
        for (let x = o.x0; x < o.x1; x += 0.8) {
          ctx.fillStyle = (Math.round((x - o.x0) / 0.8) % 2 === 0) ? "#FFD23F" : COLORS.outline;
          ctx.fillRect(x, o.y, Math.min(0.8, o.x1 - x), 0.25);
        }
        ctx.strokeRect(o.x0, o.y, o.x1 - o.x0, 0.25);
      } else if (o.type === "seesaw") {
        const { pivot } = o;
        ctx.fillStyle = "#7A8B99";
        ctx.beginPath();
        ctx.moveTo(pivot.x - 0.6, pivot.ground - 0.2);
        ctx.lineTo(pivot.x + 0.6, pivot.ground - 0.2);
        ctx.lineTo(pivot.x, pivot.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const c = o.plank.getPosition();
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(o.plank.getAngle());
        ctx.fillStyle = "#E8A33D";
        ctx.fillRect(-o.hw, -0.12, o.hw * 2, 0.24);
        ctx.strokeRect(-o.hw, -0.12, o.hw * 2, 0.24);
        ctx.restore();
        ctx.fillStyle = "#DDDDDD";
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (o.type === "lift") {
        const c = o.body.getPosition();
        // guide rails
        ctx.fillStyle = "#7A8B99";
        for (const gx of [o.x0 + 0.1, o.x1 - 0.25]) {
          ctx.fillRect(gx, o.bottom - 8, 0.15, o.top - o.bottom + 11);
          ctx.strokeRect(gx, o.bottom - 8, 0.15, o.top - o.bottom + 11);
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.beginPath();
        ctx.rect(-o.hw, -0.15, o.hw * 2, 0.3);
        ctx.fillStyle = "#FFD23F";
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = COLORS.outline;
        for (let x = -o.hw; x < o.hw; x += 0.6) {
          ctx.beginPath();
          ctx.moveTo(x, -0.15);
          ctx.lineTo(x + 0.3, -0.15);
          ctx.lineTo(x + 0.6, 0.15);
          ctx.lineTo(x + 0.3, 0.15);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        ctx.stroke();
        ctx.restore();
        // blinking light shows when the lift is down and ready
        const ready = Math.abs(Obstacles.liftHeight(o, run.gw.time) - o.bottom) < 0.05;
        const lx = o.x0 - 1.2;
        const ly = o.bottom;
        ctx.fillStyle = "#555555";
        ctx.fillRect(lx - 0.06, ly - 0.2, 0.12, 2.2);
        ctx.fillStyle = ready ? (Math.sin(time * 10) > 0 ? "#3BCEAC" : "#2A9C82") : "#E8283C";
        ctx.beginPath();
        ctx.arc(lx, ly + 2.1, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
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

    // the customer: idle, waves when the van is close, then reacts to the delivery
    const won = run.state === "won";
    const near = run.level.finishX - run.vehicle.position.x < 30;
    const mood: Mood = won ? (run.stars >= 3 ? "cheer" : run.stars === 2 ? "happy" : "puzzled") : near ? "wave" : "idle";
    const kind = CUSTOMER_KINDS[(run.level.id - 1) % CUSTOMER_KINDS.length];
    const px = fx + 2.6;
    drawCustomer(ctx, kind, px, this.groundAt(run, px), mood, time, lw);

    // finish flag
    this.drawFlag(fx, gy, lw, "#FFFFFF", true, Math.sin(time * 3));
  }

  private drawVehicle(run: LevelRun, lw: number): void {
    const ctx = this.ctx;
    const v = run.vehicle;
    const spec = v.spec;
    for (const [wheel, r] of [
      [v.rearWheel, spec.rear.r],
      [v.frontWheel, spec.front.r],
    ] as const) {
      const p = wheel.getPosition();
      drawWheel(ctx, p.x, p.y, r, wheel.getAngle(), lw, SPORT_RIMS.has(spec.id));
    }
    const c = v.chassis.getPosition();
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(v.chassis.getAngle());
    if (v.nitroActive) {
      // flickering nitro flame out of the back
      const len = 1.1 + Math.random() * 0.5;
      const g = ctx.createLinearGradient(-1.55, 0, -1.55 - len, 0);
      g.addColorStop(0, "#FFF6B0");
      g.addColorStop(0.4, "#FFB627");
      g.addColorStop(1, "rgba(255,80,40,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-1.5, 0.12);
      ctx.quadraticCurveTo(-1.55 - len * 0.6, 0.3, -1.55 - len, 0.02);
      ctx.quadraticCurveTo(-1.55 - len * 0.6, -0.26, -1.5, -0.12);
      ctx.closePath();
      ctx.fill();
    }
    drawChassis(ctx, spec, lw, this.paint ?? spec.color, this.time);
    ctx.restore();
  }

  private drawCargo(item: CargoItem, lw: number): void {
    if (!item.body) return;
    const ctx = this.ctx;
    const p = item.body.getPosition();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(item.body.getAngle());
    const extra: { melt?: number; waterAngle?: number; time?: number } = { time: this.time };
    if (item.type === "icecream" && item.meltAt !== undefined) {
      extra.melt = Math.max(0, Math.min(1, 1 - (item.meltAt - this.runTime) / 8));
    }
    if (item.type === "aquarium" && item.water) {
      const local = item.body.getLocalPoint(item.water.getPosition());
      extra.waterAngle = -item.body.getAngle() + Math.max(-0.5, Math.min(0.5, local.x * 1.5));
    }
    drawCargoShape(ctx, item.type, item.hw, item.hh, item.layer, lw, true, false, extra);
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
