// Prize wheel and daily supplies screens.

import { VIEW_W } from "../game/Camera";
import { COLORS } from "../game/Renderer";
import { t } from "../i18n";
import { poki } from "../platform/poki";
import {
  freeSpins,
  hourlyWait,
  LEVELS_PER_BONUS_SPIN,
  SUPPLY_HOURLY,
  SUPPLY_TIERS,
  suppliesTaken,
  WHEEL,
  wheelInfo,
} from "../progress";
import { loadSave } from "../storage";
import type { Button } from "./Button";
import { drawCoin, drawCoinPill, drawIcon, drawSurface, outlinedText, plainText, roundRect } from "./draw";
import { drawDim } from "./Screens";

export interface RewardHost {
  goHome(): void;
  spin(how: "free" | "ad"): void;
  /** True while the wheel is turning. */
  spinning: boolean;
  /** Current wheel rotation in radians. */
  wheelAngle: number;
  claimHourly(): void;
  claimSupply(): void;
}

const CX = VIEW_W / 2;
const CY = 330;
const R = 215;

function back(host: RewardHost): Button {
  return { x: VIEW_W - 100, y: 24, w: 76, h: 76, icon: "home", action: () => host.goHome() };
}

// ---------------- wheel ----------------

export function wheelButtons(host: RewardHost): Button[] {
  const list: Button[] = [back(host)];
  if (host.spinning) return list;
  const free = freeSpins();
  const info = wheelInfo();
  if (free > 0) {
    list.push({ x: CX - 160, y: 596, w: 320, h: 92, label: free > 1 ? `${t("wheel.spin")} ×${free}` : t("wheel.spin"), icon: "play", primary: true, action: () => host.spin("free") });
  } else if (info.adLeft > 0 && poki.available) {
    list.push({ x: CX - 160, y: 596, w: 320, h: 92, label: t("wheel.spin"), icon: "ad", primary: true, action: () => host.spin("ad") });
  }
  return list;
}

/** Fields of the wheel as angles (0 = top, clockwise). */
function fields(): { a0: number; a1: number }[] {
  let a = 0;
  return WHEEL.map((p) => {
    const f = { a0: a, a1: a + p.share * Math.PI * 2 };
    a = f.a1;
    return f;
  });
}

/** The rotation that puts the middle (± a little) of field `i` under the pointer. */
export function wheelTarget(current: number, i: number): number {
  const f = fields()[i];
  const mid = (f.a0 + f.a1) / 2 + (Math.random() - 0.5) * (f.a1 - f.a0) * 0.6;
  const want = -mid;
  const base = current - (current % (Math.PI * 2));
  let target = base + want;
  while (target < current + Math.PI * 2 * 5) target += Math.PI * 2;
  return target;
}

export function drawWheel(ctx: CanvasRenderingContext2D, host: RewardHost, time: number): void {
  drawDim(ctx, 0.6);
  outlinedText(ctx, t("wheel.title"), CX, 60, 52, "#FFD23F");
  drawCoinPill(ctx, 24, 24, loadSave().coins);

  // rim
  ctx.save();
  ctx.shadowColor = "rgba(20,30,60,0.35)";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(CX, CY, R + 22, 0, Math.PI * 2);
  ctx.fillStyle = "#9B5DE5";
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(CX, CY, R + 22, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  // little lights on the rim
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(CX + Math.cos(a) * (R + 11), CY + Math.sin(a) * (R + 11), 5, 0, Math.PI * 2);
    ctx.fillStyle = (k + Math.floor(time * 4)) % 2 === 0 ? "#FFF3B0" : "#7D4BC8";
    ctx.fill();
  }

  // fields
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(host.wheelAngle);
  fields().forEach((f, i) => {
    const p = WHEEL[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, f.a0 - Math.PI / 2, f.a1 - Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
    // label, turned to read from the middle outwards
    const mid = (f.a0 + f.a1) / 2 - Math.PI / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.translate(R * 0.66, 0);
    ctx.rotate(Math.PI / 2);
    if (p.kind === "paint") {
      for (const [dx, col] of [
        [-18, "#E84A5F"],
        [0, "#3D8BFF"],
        [18, "#FFD23F"],
      ] as const) {
        ctx.beginPath();
        ctx.arc(dx, -8, 11, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = COLORS.outline;
        ctx.stroke();
      }
      plainText(ctx, t("wheel.color"), 0, 22, 17);
    } else {
      drawCoin(ctx, 0, -12, p.coins >= 150 ? 18 : 14);
      outlinedText(ctx, String(p.coins), 0, 20, p.coins >= 150 ? 26 : 22, "#FFFFFF");
    }
    ctx.restore();
  });
  ctx.restore();

  // hub
  ctx.beginPath();
  ctx.arc(CX, CY, 36, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  drawIcon(ctx, "trophy", CX, CY, 34, "#9B5DE5");

  // pointer at the top
  ctx.beginPath();
  ctx.moveTo(CX - 22, CY - R - 36);
  ctx.lineTo(CX + 22, CY - R - 36);
  ctx.lineTo(CX, CY - R + 8);
  ctx.closePath();
  ctx.fillStyle = "#E84A5F";
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // progress towards the next bonus spin
  const info = wheelInfo();
  if (!host.spinning) {
    if (freeSpins() === 0) {
      const msg = info.adLeft > 0 && poki.available ? t("wheel.watch", { n: info.adLeft }) : t("wheel.tomorrow");
      plainText(ctx, msg, CX, 580, 20, "#FFFFFF");
    }
  }
  const bx = 120;
  roundRect(ctx, bx, 640, 260, 24, 12);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();
  roundRect(ctx, bx, 640, Math.max(24, (260 * info.toward) / LEVELS_PER_BONUS_SPIN), 24, 12);
  ctx.fillStyle = "#3BCEAC";
  ctx.fill();
  roundRect(ctx, bx, 640, 260, 24, 12);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  plainText(ctx, t("wheel.levels", { n: info.toward, total: LEVELS_PER_BONUS_SPIN }), bx + 130, 620, 17, "#FFFFFF");
}

// ---------------- daily supplies ----------------

const ROW_X = 330;
const ROW_W = 620;
const ROW_Y = 150;
const ROW_H = 84;

export function supplyButtons(host: RewardHost): Button[] {
  const list: Button[] = [back(host)];
  const wait = hourlyWait();
  list.push({
    x: ROW_X + ROW_W - 220,
    y: ROW_Y + 14,
    w: 200,
    h: 56,
    label: wait > 0 ? formatWait(wait) : t("btn.collect"),
    primary: wait <= 0,
    disabled: wait > 0,
    action: () => host.claimHourly(),
  });
  const taken = suppliesTaken();
  SUPPLY_TIERS.forEach((_, i) => {
    const y = ROW_Y + (i + 1) * (ROW_H + 12) + 14;
    const open = i === taken && poki.available;
    list.push({
      x: ROW_X + ROW_W - 220,
      y,
      w: 200,
      h: 56,
      label: i < taken ? "✓" : t("supply.free"),
      icon: i < taken ? undefined : i > taken ? "lock" : "ad",
      primary: open,
      disabled: !open,
      action: () => host.claimSupply(),
    });
  });
  return list;
}

function formatWait(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

export function drawSupply(ctx: CanvasRenderingContext2D): void {
  drawDim(ctx, 0.6);
  outlinedText(ctx, t("supply.title"), CX, 64, 52, "#FFFFFF");
  drawCoinPill(ctx, 24, 24, loadSave().coins);
  const rows = [SUPPLY_HOURLY, ...SUPPLY_TIERS];
  rows.forEach((coins, i) => {
    const y = ROW_Y + i * (ROW_H + 12);
    const first = i === 0;
    drawSurface(ctx, ROW_X, y, ROW_W, ROW_H, 24, first ? "#E6F4FF" : "#FFFFFF", first ? "#CFE6FA" : "#EEF3FA", "#B4C0D3", 5);
    // a stack of coins that grows with the reward
    const n = Math.min(5, 1 + Math.floor(coins / 25));
    for (let k = 0; k < n; k++) drawCoin(ctx, ROW_X + 50 + k * 12, y + ROW_H / 2 - k * 2, 18);
    outlinedText(ctx, `×${coins}`, ROW_X + 130, y + ROW_H / 2 + 1, 32, "#FFD23F", "left");
    plainText(ctx, first ? t("supply.hourly") : t("supply.video"), ROW_X + 235, y + ROW_H / 2 + 1, 18, "#555555", "left");
  });
  plainText(ctx, t("supply.hint"), CX, ROW_Y + 5 * (ROW_H + 12) + 18, 20, "#FFFFFF");
}
