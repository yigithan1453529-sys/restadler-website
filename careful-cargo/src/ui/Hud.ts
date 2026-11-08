import type { CargoItem } from "../game/Cargo";
import { VIEW_W } from "../game/Camera";
import { drawCargoShape } from "../game/Renderer";
import { glassPill, outlinedText, plainText } from "./draw";

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
