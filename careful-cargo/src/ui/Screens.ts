import { VIEW_H, VIEW_W } from "../game/Camera";
import { drawStar, drawSurface, outlinedText, plainText } from "./draw";

export const PANEL = { x: 330, y: 120, w: 620, h: 480 };

/** Darkens the scene with a soft blue vignette (stronger at the edges). */
export function drawDim(ctx: CanvasRenderingContext2D, alpha = 0.35): void {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.2, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.75);
  g.addColorStop(0, `rgba(25,35,70,${alpha * 0.7})`);
  g.addColorStop(1, `rgba(15,20,45,${Math.min(0.9, alpha * 1.6)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawPanel(ctx: CanvasRenderingContext2D, appear: number): void {
  const k = easeOutBack(Math.min(1, appear / 0.3));
  const { x, y, w, h } = PANEL;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(k, k);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  drawSurface(ctx, x, y, w, h, 36, "#FFFFFF", "#EEF3FA", "#B4C0D3", 8);
  ctx.restore();
}

function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

/** Win screen: stars pop in one after another. */
export function drawWinScreen(
  ctx: CanvasRenderingContext2D,
  title: string,
  delivered: string,
  stars: number,
  t: number,
  starDelay: (i: number) => number,
): void {
  drawDim(ctx);
  drawPanel(ctx, t);
  if (t < 0.15) return;
  outlinedText(ctx, title, VIEW_W / 2, 185, 56, "#FFD23F");
  for (let i = 0; i < 3; i++) {
    const x = VIEW_W / 2 + (i - 1) * 130;
    const y = 300 - (i === 1 ? 14 : 0);
    const st = t - starDelay(i);
    const filled = i < stars && st > 0;
    const k = filled ? easeOutBack(Math.min(1, st / 0.25)) : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    drawStar(ctx, 0, 0, 56, filled);
    ctx.restore();
  }
  plainText(ctx, delivered, VIEW_W / 2, 395, 32);
}

export function drawFailScreen(ctx: CanvasRenderingContext2D, reason: string, t: number): void {
  drawDim(ctx);
  drawPanel(ctx, t);
  if (t < 0.15) return;
  outlinedText(ctx, reason, VIEW_W / 2, 215, 64, "#FF6B35");
}

export function drawPauseScreen(ctx: CanvasRenderingContext2D, title: string): void {
  drawDim(ctx);
  drawPanel(ctx, 1);
  outlinedText(ctx, title, VIEW_W / 2, 230, 64, "#FFFFFF");
}
