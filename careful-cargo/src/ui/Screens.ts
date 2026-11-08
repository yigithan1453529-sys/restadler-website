import { VIEW_H, VIEW_W } from "../game/Camera";
import { COLORS } from "../game/Renderer";
import type { Button } from "./Button";
import { drawIcon, drawStar, outlinedText, plainText, roundRect } from "./draw";

export const PANEL = { x: 330, y: 120, w: 620, h: 480 };

export function drawDim(ctx: CanvasRenderingContext2D, alpha = 0.35): void {
  ctx.fillStyle = `rgba(30,40,60,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawPanel(ctx: CanvasRenderingContext2D, appear: number): void {
  const k = easeOutBack(Math.min(1, appear / 0.3));
  const { x, y, w, h } = PANEL;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(k, k);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  roundRect(ctx, x, y + 8, w, h, 32);
  ctx.fillStyle = "rgba(45,45,45,0.35)";
  ctx.fill();
  roundRect(ctx, x, y, w, h, 32);
  ctx.fillStyle = "#FFF8EC";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
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
  outlinedText(ctx, reason, VIEW_W / 2, 270, 64, "#FF6B35");
}

export function drawPauseScreen(ctx: CanvasRenderingContext2D, title: string): void {
  drawDim(ctx);
  drawPanel(ctx, 1);
  outlinedText(ctx, title, VIEW_W / 2, 230, 64, "#FFFFFF");
}

export function drawLevelSelectBackground(ctx: CanvasRenderingContext2D, title: string): void {
  drawDim(ctx, 0.55);
  outlinedText(ctx, title, VIEW_W / 2, 140, 56, "#FFFFFF");
}

export interface TileInfo {
  number: number;
  name: string;
  stars: number;
  locked: boolean;
  current: boolean;
}

/** Custom renderer for a level tile button. */
export function levelTileRenderer(info: TileInfo) {
  return (ctx: CanvasRenderingContext2D, b: Button): void => {
    roundRect(ctx, b.x, b.y + 6, b.w, b.h, 24);
    ctx.fillStyle = "rgba(45,45,45,0.35)";
    ctx.fill();
    roundRect(ctx, b.x, b.y, b.w, b.h, 24);
    ctx.fillStyle = info.locked ? "#D5D5D5" : info.current ? "#FFE58A" : "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = info.current ? 5 : 3;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
    const cx = b.x + b.w / 2;
    if (info.locked) {
      drawIcon(ctx, "lock", cx, b.y + 80, 70);
    } else {
      outlinedText(ctx, String(info.number), cx, b.y + 72, 64, "#FF6B35");
    }
    plainText(ctx, info.name, cx, b.y + 140, 19, info.locked ? "#777777" : COLORS.outline);
    for (let i = 0; i < 3; i++) drawStar(ctx, cx + (i - 1) * 42, b.y + 182, 17, i < info.stars);
  };
}
