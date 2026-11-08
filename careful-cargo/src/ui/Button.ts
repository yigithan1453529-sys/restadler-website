import { drawIcon, drawSurface, IconName, plainText, SURFACES } from "./draw";

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

/**
 * Buttons are rebuilt every frame, so compare them by place and size,
 * not by object identity (a press can last several frames).
 */
export function sameButton(a: Button | null, b: Button | null): boolean {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
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
  const scale = pressed ? 0.97 : hover ? 1.03 : 1;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  if (b.render) {
    b.render(ctx, b, hover);
    ctx.restore();
    return;
  }
  const r = Math.min(b.h * 0.42, 34);
  const look = b.disabled ? SURFACES.disabled : b.primary ? SURFACES.primary : SURFACES.normal;
  const sink = pressed ? 4 : 0;
  drawSurface(ctx, b.x, b.y + sink, b.w, b.h, r, look[0], look[1], look[2], 6 - sink);
  ctx.translate(0, sink);

  const size = b.primary && b.h >= 80 ? 38 : 26;
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
