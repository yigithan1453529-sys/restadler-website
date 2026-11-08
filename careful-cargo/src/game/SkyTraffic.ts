// Planes, hot-air balloons and blimps drifting through the sky (screen space).

import { VIEW_W } from "./Camera";
import { COLORS } from "./Renderer";

interface Lane {
  kind: "plane" | "balloon" | "blimp";
  period: number; // seconds between two appearances
  duration: number; // seconds to cross the screen
  offset: number;
  y: number;
  dir: 1 | -1; // 1 = left to right
  scale: number;
  colors: string[];
}

const LANES: Lane[] = [
  { kind: "plane", period: 21, duration: 8, offset: 4, y: 95, dir: -1, scale: 1, colors: ["#FFFFFF", "#E84A5F"] },
  { kind: "balloon", period: 33, duration: 30, offset: 0, y: 200, dir: 1, scale: 1, colors: ["#FF6B35", "#FFD23F", "#3BCEAC"] },
  { kind: "blimp", period: 52, duration: 34, offset: 20, y: 120, dir: 1, scale: 1, colors: ["#D9DDE2", "#4D9DE0"] },
  { kind: "balloon", period: 41, duration: 36, offset: 26, y: 150, dir: -1, scale: 0.7, colors: ["#9B5DE5", "#FF7EB6", "#FFFFFF"] },
];

function outline(ctx: CanvasRenderingContext2D, w = 3): void {
  ctx.lineWidth = w;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
}

function drawPlane(ctx: CanvasRenderingContext2D, colors: string[], time: number, night: boolean): void {
  // facing right; the caller mirrors it for the other direction
  // banner on a rope
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-58, 2);
  ctx.lineTo(-92, 2);
  ctx.stroke();
  ctx.fillStyle = "#FFF6D6";
  ctx.beginPath();
  const wave = Math.sin(time * 6) * 3;
  ctx.moveTo(-92, -12);
  ctx.quadraticCurveTo(-140, -12 + wave, -190, -12);
  ctx.lineTo(-190, 16);
  ctx.quadraticCurveTo(-140, 16 + wave, -92, 16);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 2.5);
  ctx.fillStyle = "#E84A5F";
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.arc(-160 + k * 26, 2 + wave * 0.3, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // tail
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.moveTo(-52, -2);
  ctx.lineTo(-62, -26);
  ctx.lineTo(-44, -26);
  ctx.lineTo(-30, -4);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  // body
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.moveTo(-56, -4);
  ctx.quadraticCurveTo(-20, -14, 30, -10);
  ctx.quadraticCurveTo(52, -6, 52, 4);
  ctx.quadraticCurveTo(46, 12, 20, 12);
  ctx.lineTo(-40, 8);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  // windows
  ctx.fillStyle = "#7FC4FF";
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.arc(-16 + k * 11, -2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // wing
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(16, 4);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-16, 22);
  ctx.closePath();
  ctx.fill();
  outline(ctx);
  // propeller
  ctx.fillStyle = "#555555";
  const blade = Math.abs(Math.sin(time * 40)) * 14;
  ctx.fillRect(52, -blade, 3, blade * 2);
  if (night && Math.sin(time * 5) > 0) {
    ctx.fillStyle = "#FF5A5A";
    ctx.beginPath();
    ctx.arc(-10, 22, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBalloon(ctx: CanvasRenderingContext2D, colors: string[]): void {
  // ropes
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 30);
  ctx.lineTo(-11, 62);
  ctx.moveTo(24, 30);
  ctx.lineTo(11, 62);
  ctx.stroke();
  // basket
  ctx.fillStyle = "#B07A45";
  ctx.beginPath();
  ctx.rect(-13, 60, 26, 20);
  ctx.fill();
  outline(ctx);
  // envelope with stripes
  const envelope = (): void => {
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.bezierCurveTo(-46, 10, -50, -46, 0, -50);
    ctx.bezierCurveTo(50, -46, 46, 10, 0, 38);
    ctx.closePath();
  };
  ctx.save();
  envelope();
  ctx.fillStyle = colors[0];
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let k = -2; k <= 2; k++) {
    ctx.fillStyle = colors[(k + 3) % colors.length];
    ctx.beginPath();
    ctx.ellipse(k * 18, -6, 7, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  envelope();
  outline(ctx);
  ctx.restore();
}

function drawBlimp(ctx: CanvasRenderingContext2D, colors: string[], time: number, night: boolean): void {
  // fins
  ctx.fillStyle = colors[1];
  for (const sy of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.lineTo(-112, sy * 30);
    ctx.lineTo(-98, sy * 4);
    ctx.closePath();
    ctx.fill();
    outline(ctx);
  }
  // body
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.ellipse(0, 0, 100, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx);
  // stripe and lettering band
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 100, 34, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors[1];
  ctx.fillRect(-100, -6, 200, 12);
  ctx.restore();
  // gondola
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.rect(-22, 32, 44, 14);
  ctx.fill();
  outline(ctx);
  ctx.fillStyle = "#7FC4FF";
  for (let k = 0; k < 3; k++) ctx.fillRect(-16 + k * 12, 35, 7, 7);
  // little propeller at the back of the gondola
  ctx.fillStyle = "#555555";
  const blade = Math.abs(Math.sin(time * 30)) * 8;
  ctx.fillRect(-26, 39 - blade, 3, blade * 2);
  if (night) {
    ctx.fillStyle = Math.sin(time * 4) > 0 ? "#FFE680" : "#FF5A5A";
    for (const lx of [-60, 0, 60]) {
      ctx.beginPath();
      ctx.arc(lx, -30 + Math.abs(lx) * 0.1, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Draws whatever is flying through the sky right now. */
export function drawSkyTraffic(ctx: CanvasRenderingContext2D, time: number, night: boolean): void {
  for (const lane of LANES) {
    const phase = (time + lane.offset) % lane.period;
    if (phase > lane.duration) continue;
    const p = phase / lane.duration;
    const margin = 260 * lane.scale;
    const x = lane.dir === 1 ? -margin + p * (VIEW_W + margin * 2) : VIEW_W + margin - p * (VIEW_W + margin * 2);
    const y = lane.y + Math.sin(time * 0.8 + lane.offset) * (lane.kind === "balloon" ? 12 : 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(lane.scale * lane.dir, lane.scale);
    ctx.lineJoin = "round";
    if (night) ctx.globalAlpha = 0.85;
    if (lane.kind === "plane") drawPlane(ctx, lane.colors, time, night);
    else if (lane.kind === "balloon") drawBalloon(ctx, lane.colors);
    else drawBlimp(ctx, lane.colors, time, night);
    ctx.restore();
  }
}
