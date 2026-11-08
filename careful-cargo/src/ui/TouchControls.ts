import { TOUCH_BRAKE, TOUCH_GAS, type Circle } from "../game/Input";
import { COLORS } from "../game/Renderer";

function arrow(ctx: CanvasRenderingContext2D, c: Circle, dir: 1 | -1): void {
  const s = c.r * 0.42;
  ctx.beginPath();
  ctx.moveTo(c.x + dir * s, c.y);
  ctx.lineTo(c.x - dir * s * 0.6, c.y - s);
  ctx.lineTo(c.x - dir * s * 0.6, c.y + s);
  ctx.closePath();
  ctx.fill();
}

/** Semi-transparent drive buttons (touch devices). */
export function drawTouchControls(ctx: CanvasRenderingContext2D, gas: boolean, brake: boolean): void {
  const pairs: [Circle, boolean, 1 | -1][] = [
    [TOUCH_BRAKE, brake, -1],
    [TOUCH_GAS, gas, 1],
  ];
  for (const [c, down, dir] of pairs) {
    ctx.save();
    ctx.globalAlpha = down ? 0.7 : 0.4;
    ctx.beginPath();
    ctx.arc(c.x, c.y, down ? c.r * 0.94 : c.r, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
    ctx.fillStyle = COLORS.outline;
    arrow(ctx, c, dir);
    ctx.restore();
  }
}
