// Customers waiting at the finish. Drawn in world units (meters, y up).

import { COLORS, FONT } from "./Renderer";

export type CustomerKind = "kid" | "grandma" | "chef" | "farmer";
export type Mood = "idle" | "wave" | "cheer" | "happy" | "puzzled";

interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
}

const LOOKS: Record<CustomerKind, Look> = {
  kid: { skin: "#FFD1A4", hair: "#6B3E26", shirt: "#4D9DE0", pants: "#2F5D8A", shoes: "#E84A5F" },
  grandma: { skin: "#F7C9A3", hair: "#E8E8F0", shirt: "#B07BD8", pants: "#7D5BA6", shoes: "#5B4A6B" },
  chef: { skin: "#C98B5E", hair: "#2D2D2D", shirt: "#FFFFFF", pants: "#3A3F4B", shoes: "#2D2D2D" },
  farmer: { skin: "#FFDDB8", hair: "#E89B3C", shirt: "#E84A5F", pants: "#3D6FB6", shoes: "#6B4A2E" },
};

export const CUSTOMER_KINDS: CustomerKind[] = ["kid", "grandma", "chef", "farmer"];

function limb(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w: number, color: string, lw: number): void {
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = w + lw * 2;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.lineCap = "butt";
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, lw: number, outline = true): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
  }
}

/**
 * Draws a customer standing on the ground at (x, ground).
 * `face` is -1 (looking left, towards the arriving van) or 1.
 */
export function drawCustomer(
  ctx: CanvasRenderingContext2D,
  kind: CustomerKind,
  x: number,
  ground: number,
  mood: Mood,
  time: number,
  lw: number,
): void {
  const L = LOOKS[kind];
  // jumping and breathing
  const hop = mood === "cheer" ? Math.abs(Math.sin(time * 7)) * 0.55 : mood === "happy" ? Math.abs(Math.sin(time * 5)) * 0.18 : 0;
  const breathe = Math.sin(time * 2.2) * 0.02;
  const y = ground + hop;
  const squash = mood === "cheer" ? 1 - Math.max(0, Math.cos(time * 14)) * 0.04 : 1;

  ctx.save();
  ctx.lineJoin = "round";

  // shadow on the ground
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(x, ground + 0.02, 0.55 - hop * 0.3, 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs and shoes
  const legTop = y + 0.75;
  const kick = mood === "cheer" ? Math.sin(time * 7) * 0.12 : 0;
  limb(ctx, x - 0.17, legTop, x - 0.2 - kick, y + 0.12, 0.2, L.pants, lw);
  limb(ctx, x + 0.17, legTop, x + 0.2 + kick, y + 0.12, 0.2, L.pants, lw);
  for (const sx of [-1, 1]) {
    ctx.fillStyle = L.shoes;
    ctx.beginPath();
    ctx.ellipse(x + sx * (0.22 + (sx > 0 ? kick : -kick)) - 0.04, y + 0.08, 0.17, 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
  }

  // body (a soft pear shape)
  const bodyTop = y + 1.45 * squash + breathe;
  ctx.fillStyle = L.shirt;
  ctx.beginPath();
  ctx.moveTo(x - 0.3, bodyTop);
  ctx.quadraticCurveTo(x - 0.5, y + 1.0, x - 0.42, y + 0.68);
  ctx.lineTo(x + 0.42, y + 0.68);
  ctx.quadraticCurveTo(x + 0.5, y + 1.0, x + 0.3, bodyTop);
  ctx.quadraticCurveTo(x, bodyTop + 0.08, x - 0.3, bodyTop);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  if (kind === "chef") {
    // two rows of buttons
    for (const bx of [-0.1, 0.1]) for (const by of [0.9, 1.1, 1.3]) dot(ctx, x + bx, y + by, 0.035, "#BBBBBB", lw * 0.5, false);
  } else if (kind === "farmer") {
    // overall straps
    ctx.fillStyle = L.pants;
    ctx.fillRect(x - 0.28, y + 0.68, 0.56, 0.38);
    ctx.strokeRect(x - 0.28, y + 0.68, 0.56, 0.38);
    limb(ctx, x - 0.2, y + 1.05, x - 0.2, y + 1.42, 0.07, L.pants, lw * 0.6);
    limb(ctx, x + 0.2, y + 1.05, x + 0.2, y + 1.42, 0.07, L.pants, lw * 0.6);
  } else if (kind === "grandma") {
    // necklace
    for (let k = -2; k <= 2; k++) dot(ctx, x + k * 0.08, bodyTop - 0.12 - Math.abs(k) * -0.02 - 0.04 * (2 - Math.abs(k)), 0.03, "#FFFFFF", lw * 0.5);
  }

  // arms
  const sh = bodyTop - 0.12; // shoulder height
  const arm = (side: number, angle: number, len = 0.62): [number, number] => {
    const sx = x + side * 0.36;
    const ex = sx + side * Math.sin(angle) * len;
    const ey = sh + Math.cos(angle) * len;
    limb(ctx, sx, sh, ex, ey, 0.15, L.shirt, lw);
    dot(ctx, ex, ey, 0.1, L.skin, lw);
    return [ex, ey];
  };
  if (mood === "cheer") {
    arm(-1, 0.45 + Math.sin(time * 14) * 0.15);
    arm(1, 0.45 + Math.sin(time * 14 + 1.5) * 0.15);
  } else if (mood === "wave" || mood === "happy") {
    arm(-1, Math.PI - 0.25);
    arm(1, 0.6 + Math.sin(time * (mood === "happy" ? 13 : 7)) * 0.45);
  } else if (mood === "puzzled") {
    arm(-1, Math.PI - 0.3);
    // hand scratching the head
    const sx = x + 0.36;
    const hx = x + 0.3 + Math.sin(time * 14) * 0.04;
    const hy = sh + 0.75;
    limb(ctx, sx, sh, sx + 0.25, sh + 0.35, 0.15, L.shirt, lw);
    limb(ctx, sx + 0.25, sh + 0.35, hx, hy, 0.15, L.shirt, lw);
    dot(ctx, hx, hy, 0.1, L.skin, lw);
  } else {
    arm(-1, Math.PI - 0.2 + Math.sin(time * 2) * 0.05);
    arm(1, Math.PI - 0.2 - Math.sin(time * 2) * 0.05);
  }

  // head
  const hx = x;
  const hy = bodyTop + 0.42;
  const r = 0.42;
  // hair behind the head
  if (kind === "grandma") dot(ctx, hx, hy + 0.42, 0.2, L.hair, lw); // bun
  if (kind === "farmer") {
    // pigtails
    dot(ctx, hx - 0.45, hy - 0.05, 0.14, L.hair, lw);
    dot(ctx, hx + 0.45, hy - 0.05, 0.14, L.hair, lw);
  }
  dot(ctx, hx, hy, r, L.skin, lw);
  // hair on top
  ctx.fillStyle = L.hair;
  ctx.beginPath();
  if (kind === "kid") {
    ctx.arc(hx, hy + 0.05, r * 0.98, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(hx, hy + 0.02, r * 0.99, 0.08 * Math.PI, 0.92 * Math.PI);
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();

  // face
  const blink = Math.sin(time * 1.3 + x) > 0.97;
  const eyeY = hy + 0.02;
  for (const ex of [-0.15, 0.15]) {
    if (blink || mood === "cheer") {
      // closed happy eyes
      ctx.beginPath();
      ctx.arc(hx + ex, eyeY - 0.03, 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.lineWidth = lw * 1.2;
      ctx.strokeStyle = COLORS.outline;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(hx + ex, eyeY, 0.085, 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = lw * 0.7;
      ctx.strokeStyle = COLORS.outline;
      ctx.stroke();
      dot(ctx, hx + ex - 0.015, eyeY - 0.01, 0.05, COLORS.outline, lw, false);
      dot(ctx, hx + ex - 0.03, eyeY + 0.02, 0.017, "#FFFFFF", lw, false);
    }
  }
  if (kind === "grandma") {
    // round glasses
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = "#8A6D3B";
    for (const ex of [-0.15, 0.15]) {
      ctx.beginPath();
      ctx.arc(hx + ex, eyeY, 0.13, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(hx - 0.02, eyeY);
    ctx.lineTo(hx + 0.02, eyeY);
    ctx.stroke();
  }
  if (mood === "puzzled") {
    ctx.lineWidth = lw;
    ctx.strokeStyle = COLORS.outline;
    ctx.beginPath();
    ctx.moveTo(hx - 0.24, eyeY + 0.17);
    ctx.lineTo(hx - 0.08, eyeY + 0.14);
    ctx.moveTo(hx + 0.08, eyeY + 0.12);
    ctx.lineTo(hx + 0.24, eyeY + 0.19);
    ctx.stroke();
  }
  // rosy cheeks
  ctx.fillStyle = "rgba(255,120,140,0.45)";
  for (const cx of [-0.26, 0.26]) {
    ctx.beginPath();
    ctx.ellipse(hx + cx, hy - 0.13, 0.08, 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // mouth
  ctx.lineWidth = lw;
  ctx.strokeStyle = COLORS.outline;
  if (mood === "cheer" || mood === "happy") {
    ctx.fillStyle = "#8C2F39";
    ctx.beginPath();
    ctx.moveTo(hx - 0.13, hy - 0.15);
    ctx.quadraticCurveTo(hx, hy - 0.38, hx + 0.13, hy - 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (mood === "puzzled") {
    ctx.beginPath();
    ctx.moveTo(hx - 0.1, hy - 0.2);
    ctx.quadraticCurveTo(hx - 0.03, hy - 0.16, hx + 0.02, hy - 0.2);
    ctx.quadraticCurveTo(hx + 0.07, hy - 0.24, hx + 0.11, hy - 0.2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(hx, hy - 0.1, 0.11, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }

  // hats
  if (kind === "kid") {
    ctx.fillStyle = "#E84A5F";
    ctx.beginPath();
    ctx.arc(hx, hy + 0.18, r * 0.95, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(hx - 0.42, hy + 0.2, 0.28, 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (kind === "chef") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(hx - 0.3, hy + 0.28, 0.6, 0.25);
    ctx.strokeRect(hx - 0.3, hy + 0.28, 0.6, 0.25);
    for (const [cx, cy, cr] of [[-0.2, 0.68, 0.2], [0.2, 0.68, 0.2], [0, 0.78, 0.24]] as const) dot(ctx, hx + cx, hy + cy, cr, "#FFFFFF", lw);
  } else if (kind === "farmer") {
    ctx.fillStyle = "#F2D16B";
    ctx.beginPath();
    ctx.ellipse(hx, hy + 0.28, 0.65, 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy + 0.3, 0.3, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#E84A5F";
    ctx.fillRect(hx - 0.29, hy + 0.32, 0.58, 0.07);
  }

  // speech bubble
  if (mood === "puzzled" || mood === "cheer") {
    const bx = hx + 0.75;
    const by = hy + 0.95;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.ellipse(bx, by, 0.36, 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.save();
    ctx.translate(bx, by - 0.02);
    ctx.scale(0.012, -0.012);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold 40px ${FONT}`;
    if (mood === "puzzled") {
      ctx.fillStyle = COLORS.outline;
      ctx.fillText("?", 0, 2);
    } else {
      // heart
      ctx.fillStyle = "#E84A5F";
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.bezierCurveTo(-24, -2, -14, -20, 0, -8);
      ctx.bezierCurveTo(14, -20, 24, -2, 0, 14);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
