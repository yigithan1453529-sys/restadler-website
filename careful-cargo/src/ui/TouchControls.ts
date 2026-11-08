import { TOUCH_BRAKE, TOUCH_GAS, type Circle } from "../game/Input";

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
    const r = down ? c.r * 0.94 : c.r;
    ctx.save();
    ctx.shadowColor = "rgba(20,30,60,0.25)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    const g = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.4, r * 0.1, c.x, c.y, r);
    g.addColorStop(0, down ? "rgba(255,240,180,0.85)" : "rgba(255,255,255,0.7)");
    g.addColorStop(1, down ? "rgba(255,190,60,0.75)" : "rgba(220,230,245,0.45)");
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(45,45,45,0.7)";
    ctx.stroke();
    ctx.fillStyle = "rgba(45,45,45,0.8)";
    ctx.lineJoin = "round";
    arrow(ctx, c, dir);
  }
}
