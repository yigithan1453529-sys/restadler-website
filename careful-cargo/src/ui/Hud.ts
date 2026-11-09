import type { CargoItem } from "../game/Cargo";
import { VIEW_W } from "../game/Camera";
import { drawCargoShape } from "../game/Renderer";
import { drawCoin, glassPill, outlinedText, plainText } from "./draw";

/** Level label (left) and cargo icons (center). Buttons are added by Game. */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  levelLabel: string,
  items: CargoItem[],
  lostFlash: Map<number, number>,
  meltLeft: number | null,
  time: number,
): void {
  // level pill
  ctx.font = `bold 30px sans-serif`;
  glassPill(ctx, 20, 18, 170, 60);
  plainText(ctx, levelLabel, 105, 49, 28);

  // cargo icons
  const size = 44;
  const gap = 10;
  const total = items.length * size + (items.length - 1) * gap;
  let x = VIEW_W / 2 - total / 2 + size / 2;
  const y = 48;
  glassPill(ctx, x - size / 2 - 14, 18, total + 28, 60);

  for (const item of items) {
    const flash = lostFlash.get(item.id) ?? 0;
    const pop = flash > 0 ? 1 + Math.sin(flash * Math.PI) * 0.4 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop, pop);
    // normalise sizes so every icon fits the slot
    if (item.type === "crate") drawCargoShape(ctx, "crate", 15, 15, 0, 3, false, item.lost);
    else if (item.type === "egg") drawCargoShape(ctx, "egg", 13, 13, 0, 3, false, item.lost);
    else if (item.type === "cake") drawCargoShape(ctx, "cake", 19 - item.layer * 3, 11, item.layer, 3, false, item.lost);
    else if (item.type === "icecream") drawCargoShape(ctx, "icecream", 14, 14, item.layer, 3, false, item.lost);
    else if (item.type === "aquarium") drawCargoShape(ctx, "aquarium", 19, 14, 0, 3, false, item.lost, { time });
    else if (item.type === "bowling") drawCargoShape(ctx, "bowling", 15, 15, 0, 3, false, item.lost);
    else drawCargoShape(ctx, "grandpa", 17, 17, 0, 3, false, item.lost);
    if (item.lost) {
      ctx.strokeStyle = "#E8283C";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-17, 17);
      ctx.lineTo(17, -17);
      ctx.stroke();
    }
    ctx.restore();
    x += size + gap;
  }

  // melting timer for ice cream
  if (meltLeft !== null) {
    const urgent = meltLeft < 8;
    const blink = urgent && Math.sin(time * 10) > 0;
    outlinedText(ctx, `${Math.ceil(meltLeft)}s`, x + 18, y, 30, blink ? "#FF6B6B" : "#FFFFFF", "left");
  }
}

/** Big hint text in a pill below the HUD. */
export function drawHint(ctx: CanvasRenderingContext2D, text: string, alpha: number, time: number): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const bob = Math.sin(time * 4) * 4;
  ctx.font = `bold 34px sans-serif`;
  outlinedText(ctx, text, VIEW_W / 2, 150 + bob, 40, "#FFFFFF");
  ctx.restore();
}

/** Running time of the level, next to the restart button. */
export function drawTimer(ctx: CanvasRenderingContext2D, text: string): void {
  glassPill(ctx, 870, 18, 140, 60);
  plainText(ctx, text, 940, 49, 24);
}

/** Speedometer with the current gear, bottom center. */
export function drawSpeedometer(ctx: CanvasRenderingContext2D, kmh: number, gear: number, rpm: number, maxKmh: number): void {
  const cx = 640;
  const cy = 690;
  const r = 78;
  ctx.save();
  // dial
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#2D2D2D";
  ctx.stroke();
  // rev band: green → yellow → red
  for (let i = 0; i < 20; i++) {
    const a0 = Math.PI + (i / 20) * Math.PI;
    const a1 = Math.PI + ((i + 0.8) / 20) * Math.PI;
    const lit = i / 20 < rpm;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, a0, a1);
    ctx.strokeStyle = !lit ? "rgba(45,45,45,0.15)" : i < 12 ? "#3BCEAC" : i < 16 ? "#FFB627" : "#E84A5F";
    ctx.lineWidth = 9;
    ctx.stroke();
  }
  // needle shows the speed
  const a = Math.PI + Math.min(1, kmh / Math.max(1, maxKmh)) * Math.PI;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22));
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#E84A5F";
  ctx.stroke();
  ctx.restore();
  // gear and speed
  plainText(ctx, gear === 0 ? "R" : String(gear), cx, cy - 34, 26, "#2D2D2D");
  plainText(ctx, `${Math.round(kmh)} km/h`, cx, cy - 10, 17, "#555555");
}

/** Coins picked up on the road in this run (paid out at the finish). */
export function drawPickedCoins(ctx: CanvasRenderingContext2D, value: number): void {
  glassPill(ctx, 20, 88, 130, 46);
  drawCoin(ctx, 46, 111, 14);
  plainText(ctx, String(value), 70, 112, 22, "#2D2D2D", "left");
}

/** Nitro tank next to the speedometer. */
export function drawNitroGauge(ctx: CanvasRenderingContext2D, charge: number, active: boolean): void {
  const x = 735;
  const y = 662;
  glassPill(ctx, x, y, 150, 34);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect?.(x + 34, y + 9, 104, 16, 8);
  ctx.fillStyle = "rgba(45,45,45,0.15)";
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect?.(x + 34, y + 9, Math.max(12, 104 * charge), 16, 8);
  ctx.fillStyle = active ? "#FF6B35" : charge > 0.25 ? "#3D8BFF" : "#9BB8E8";
  ctx.fill();
  ctx.restore();
  plainText(ctx, "N₂O", x + 18, y + 18, 13, "#2D2D2D");
}
