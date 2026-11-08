import { COLORS, FONT } from "../game/Renderer";

export { FONT };

export type IconName = "restart" | "pause" | "play" | "soundOn" | "soundOff" | "menu" | "lock" | "next" | "prev" | "close" | "home" | "garage" | "shop";

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Text with dark outline. */
export function outlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fill = "#FFFFFF",
  align: CanvasTextAlign = "center",
): void {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeStyle = COLORS.outline;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export function plainText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = COLORS.outline,
  align: CanvasTextAlign = "center",
): void {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, filled: boolean): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.48;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? "#FFD23F" : "#D8D8D8";
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, r * 0.1);
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
}

/** Draws an icon centered at (x, y) with size s. */
export function drawIcon(ctx: CanvasRenderingContext2D, icon: IconName, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.outline;
  ctx.strokeStyle = COLORS.outline;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = s * 0.14;
  const h = s / 2;
  switch (icon) {
    case "restart": {
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.62, -Math.PI * 0.35, Math.PI * 1.35);
      ctx.stroke();
      const a = -Math.PI * 0.35;
      const ex = Math.cos(a) * h * 0.62;
      const ey = Math.sin(a) * h * 0.62;
      ctx.beginPath();
      ctx.moveTo(ex + h * 0.38, ey - h * 0.05);
      ctx.lineTo(ex - h * 0.05, ey - h * 0.42);
      ctx.lineTo(ex - h * 0.12, ey + h * 0.12);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "pause":
      roundRect(ctx, -h * 0.5, -h * 0.6, h * 0.34, h * 1.2, h * 0.08);
      ctx.fill();
      roundRect(ctx, h * 0.16, -h * 0.6, h * 0.34, h * 1.2, h * 0.08);
      ctx.fill();
      break;
    case "play":
    case "next":
      ctx.beginPath();
      ctx.moveTo(-h * 0.4, -h * 0.6);
      ctx.lineTo(h * 0.6, 0);
      ctx.lineTo(-h * 0.4, h * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "soundOn":
    case "soundOff": {
      ctx.beginPath();
      ctx.moveTo(-h * 0.7, -h * 0.25);
      ctx.lineTo(-h * 0.35, -h * 0.25);
      ctx.lineTo(h * 0.05, -h * 0.6);
      ctx.lineTo(h * 0.05, h * 0.6);
      ctx.lineTo(-h * 0.35, h * 0.25);
      ctx.lineTo(-h * 0.7, h * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = s * 0.1;
      if (icon === "soundOn") {
        ctx.beginPath();
        ctx.arc(h * 0.1, 0, h * 0.35, -0.9, 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(h * 0.1, 0, h * 0.62, -0.9, 0.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(h * 0.28, -h * 0.28);
        ctx.lineTo(h * 0.72, h * 0.28);
        ctx.moveTo(h * 0.72, -h * 0.28);
        ctx.lineTo(h * 0.28, h * 0.28);
        ctx.stroke();
      }
      break;
    }
    case "prev":
      ctx.beginPath();
      ctx.moveTo(h * 0.4, -h * 0.6);
      ctx.lineTo(-h * 0.6, 0);
      ctx.lineTo(h * 0.4, h * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "menu":
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          roundRect(ctx, -h * 0.6 + i * h * 0.7, -h * 0.6 + j * h * 0.7, h * 0.5, h * 0.5, h * 0.1);
          ctx.fill();
        }
      break;
    case "lock":
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.arc(0, -h * 0.15, h * 0.32, Math.PI, 0);
      ctx.stroke();
      roundRect(ctx, -h * 0.5, -h * 0.15, h, h * 0.75, h * 0.12);
      ctx.fill();
      break;
    case "home":
      ctx.beginPath();
      ctx.moveTo(-h * 0.7, -h * 0.05);
      ctx.lineTo(0, -h * 0.7);
      ctx.lineTo(h * 0.7, -h * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-h * 0.5, -h * 0.1, h, h * 0.75);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-h * 0.14, h * 0.2, h * 0.28, h * 0.45);
      break;
    case "garage":
      // a little truck
      roundRect(ctx, -h * 0.75, -h * 0.25, h * 1.0, h * 0.5, h * 0.08);
      ctx.fill();
      roundRect(ctx, h * 0.2, -h * 0.45, h * 0.5, h * 0.7, h * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-h * 0.4, h * 0.38, h * 0.2, 0, Math.PI * 2);
      ctx.arc(h * 0.42, h * 0.38, h * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "shop":
      // shopping bag
      roundRect(ctx, -h * 0.6, -h * 0.25, h * 1.2, h * 0.9, h * 0.12);
      ctx.fill();
      ctx.lineWidth = s * 0.09;
      ctx.beginPath();
      ctx.arc(0, -h * 0.25, h * 0.32, Math.PI, 0);
      ctx.stroke();
      break;
    case "close":
      ctx.lineWidth = s * 0.15;
      ctx.beginPath();
      ctx.moveTo(-h * 0.45, -h * 0.45);
      ctx.lineTo(h * 0.45, h * 0.45);
      ctx.moveTo(h * 0.45, -h * 0.45);
      ctx.lineTo(-h * 0.45, h * 0.45);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

/** A gold coin. */
export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#FFC93C";
  ctx.fill();
  ctx.lineWidth = Math.max(2.5, r * 0.16);
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = "#E0A21B";
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.stroke();
  ctx.fillStyle = "#FFF3C4";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.15, r * 0.25, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Coin counter in a white pill. */
export function drawCoinPill(ctx: CanvasRenderingContext2D, x: number, y: number, coins: number): void {
  roundRect(ctx, x, y, 200, 60, 30);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  drawCoin(ctx, x + 32, y + 30, 19);
  plainText(ctx, String(coins), x + 62, y + 31, 28, COLORS.outline, "left");
}
