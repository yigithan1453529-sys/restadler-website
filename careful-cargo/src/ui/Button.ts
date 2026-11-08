import { COLORS } from "../game/Renderer";
import { drawIcon, IconName, plainText, roundRect } from "./draw";

export interface Button {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  icon?: IconName;
  primary?: boolean;
  disabled?: boolean;
  action: () => void;
  /** Custom drawing instead of the default look. */
  render?: (ctx: CanvasRenderingContext2D, b: Button, hover: boolean) => void;
}

export function hitButton(buttons: Button[], x: number, y: number): Button | null {
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

export function drawButton(ctx: CanvasRenderingContext2D, b: Button, hover: boolean, pressed: boolean): void {
  ctx.save();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const scale = pressed ? 0.95 : hover ? 1.04 : 1;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  if (b.render) {
    b.render(ctx, b, hover);
    ctx.restore();
    return;
  }
  const r = Math.min(18, b.h / 3);
  // shadow
  roundRect(ctx, b.x, b.y + 5, b.w, b.h, r);
  ctx.fillStyle = "rgba(45,45,45,0.35)";
  ctx.fill();
  roundRect(ctx, b.x, b.y, b.w, b.h, r);
  ctx.fillStyle = b.disabled ? "#CCCCCC" : b.primary ? "#FFD23F" : "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();

  const size = b.primary ? 38 : 26;
  if (b.icon && b.label) {
    ctx.font = `bold ${size}px sans-serif`;
    const iconSize = size * 0.9;
    plainText(ctx, b.label, cx + iconSize * 0.45, cy + 1, size);
    const tw = ctx.measureText(b.label).width;
    drawIcon(ctx, b.icon, cx - tw / 2 - iconSize * 0.25, cy, iconSize);
  } else if (b.icon) {
    drawIcon(ctx, b.icon, cx, cy, Math.min(b.w, b.h) * 0.6);
  } else if (b.label) {
    plainText(ctx, b.label, cx, cy + 1, size);
  }
  ctx.restore();
}
