import { VIEW_H, VIEW_W } from "../game/Camera";
import { getPaint, PAINTS } from "../game/paints";
import { COLORS, drawVehiclePreview } from "../game/Renderer";
import { getVehicleSpec, VEHICLES, type VehicleSpec } from "../game/Vehicle";
import { t } from "../i18n";
import { loadSave } from "../storage";
import type { Button } from "./Button";
import { drawCoin, drawCoinPill, drawIcon, outlinedText, plainText, roundRect } from "./draw";
import { drawDim } from "./Screens";

/** What the menu screens need from the game. */
export interface MenuHost {
  levelId: number;
  muted: boolean;
  time: number;
  shopTab: "vehicles" | "paints";
  play(): void;
  openLevels(): void;
  openGarage(): void;
  openShop(tab?: "vehicles" | "paints"): void;
  goHome(): void;
  toggleMute(): void;
  selectVehicle(id: string): void;
  selectPaint(id: string): void;
  buyVehicle(id: string): void;
  buyPaint(id: string): void;
}

function card(ctx: CanvasRenderingContext2D, b: Button, fill: string, selected: boolean): void {
  roundRect(ctx, b.x, b.y + 6, b.w, b.h, 22);
  ctx.fillStyle = "rgba(45,45,45,0.35)";
  ctx.fill();
  roundRect(ctx, b.x, b.y, b.w, b.h, 22);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = selected ? 5 : 3;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
}

function vehicleColor(spec: VehicleSpec): string {
  return getPaint(loadSave().paint[spec.id]).color ?? spec.color;
}

/** Draws a vehicle centered at (x, y) in screen pixels. */
function preview(ctx: CanvasRenderingContext2D, spec: VehicleSpec, x: number, y: number, scale: number, color = vehicleColor(spec), alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, -scale);
  drawVehiclePreview(ctx, spec, 3 / scale, color);
  ctx.restore();
}

function backButton(host: MenuHost): Button {
  return { x: VIEW_W - 100, y: 24, w: 76, h: 76, icon: "home", action: () => host.goHome() };
}

// ---------------- Home ----------------

export function homeButtons(host: MenuHost): Button[] {
  return [
    { x: VIEW_W / 2 - 190, y: 248, w: 380, h: 120, label: t("home.play"), icon: "play", primary: true, action: () => host.play() },
    { x: 235, y: 450, w: 250, h: 96, label: t("btn.levels"), icon: "menu", action: () => host.openLevels() },
    { x: 515, y: 450, w: 250, h: 96, label: t("btn.garage"), icon: "garage", action: () => host.openGarage() },
    { x: 795, y: 450, w: 250, h: 96, label: t("btn.shop"), icon: "shop", action: () => host.openShop() },
    { x: 20, y: 18, w: 68, h: 68, icon: host.muted ? "soundOff" : "soundOn", action: () => host.toggleMute() },
  ];
}

export function drawHome(ctx: CanvasRenderingContext2D, host: MenuHost): void {
  drawDim(ctx, 0.3);
  const bob = Math.sin(host.time * 2) * 5;
  outlinedText(ctx, t("title"), VIEW_W / 2, 150 + bob, 96, "#FFD23F");
  drawCoinPill(ctx, VIEW_W - 220, 22, loadSave().coins);
  outlinedText(ctx, t("hud.level", { n: host.levelId }), VIEW_W / 2, 400, 30, "#FFFFFF");
}

// ---------------- Garage ----------------

export function garageButtons(host: MenuHost): Button[] {
  const save = loadSave();
  const list: Button[] = [backButton(host)];
  // vehicle cards (2 × 2) on the right
  VEHICLES.forEach((spec, i) => {
    const owned = save.owned.includes(spec.id);
    const chosen = save.vehicle === spec.id;
    list.push({
      x: 720 + (i % 2) * 270,
      y: 130 + Math.floor(i / 2) * 200,
      w: 250,
      h: 180,
      render: (c, b) => {
        card(c, b, chosen ? "#FFE58A" : owned ? "#FFFFFF" : "#D5D5D5", chosen);
        preview(c, spec, b.x + b.w / 2, b.y + 72, 50, vehicleColor(spec), owned ? 1 : 0.4);
        plainText(c, t(spec.name), b.x + b.w / 2, b.y + 140, 22);
        if (!owned) {
          drawIcon(c, "lock", b.x + 30, b.y + 30, 34);
          plainText(c, t("garage.inShop"), b.x + b.w / 2, b.y + 164, 17, "#666666");
        }
      },
      action: () => (owned ? host.selectVehicle(spec.id) : host.openShop("vehicles")),
    });
  });
  // paint swatches (only bought ones) under the big preview
  const spec = getVehicleSpec(save.vehicle);
  const chosenPaint = save.paint[spec.id] ?? "original";
  const owned = PAINTS.filter((p) => save.paints.includes(p.id));
  owned.forEach((paint, i) => {
    list.push({
      x: 70 + i * 74,
      y: 610,
      w: 64,
      h: 64,
      render: (c, b) => {
        c.beginPath();
        c.arc(b.x + 32, b.y + 32, 28, 0, Math.PI * 2);
        c.fillStyle = paint.color ?? spec.color;
        c.fill();
        c.lineWidth = paint.id === chosenPaint ? 6 : 3;
        c.strokeStyle = paint.id === chosenPaint ? "#FFFFFF" : COLORS.outline;
        c.stroke();
        if (paint.id === chosenPaint) {
          c.beginPath();
          c.arc(b.x + 32, b.y + 32, 33, 0, Math.PI * 2);
          c.lineWidth = 3;
          c.strokeStyle = COLORS.outline;
          c.stroke();
        }
      },
      action: () => host.selectPaint(paint.id),
    });
  });
  if (owned.length < PAINTS.length) {
    list.push({
      x: 70 + owned.length * 74,
      y: 610,
      w: 64,
      h: 64,
      icon: "shop",
      action: () => host.openShop("paints"),
    });
  }
  return list;
}

function statBar(ctx: CanvasRenderingContext2D, label: string, value: number, y: number): void {
  plainText(ctx, label, 70, y, 22, "#FFFFFF", "left");
  roundRect(ctx, 200, y - 11, 360, 22, 11);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fill();
  roundRect(ctx, 200, y - 11, Math.max(22, 360 * Math.min(1, value)), 22, 11);
  ctx.fillStyle = "#FFD23F";
  ctx.fill();
  roundRect(ctx, 200, y - 11, 360, 22, 11);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
}

export function drawGarage(ctx: CanvasRenderingContext2D): void {
  drawDim(ctx, 0.6);
  const save = loadSave();
  outlinedText(ctx, t("btn.garage"), VIEW_W / 2, 64, 56, "#FFFFFF");
  drawCoinPill(ctx, 24, 24, save.coins);
  const spec = getVehicleSpec(save.vehicle);
  // platform and big preview
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(330, 380, 230, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  preview(ctx, spec, 330, 290, 92);
  outlinedText(ctx, t(spec.name), 330, 140, 38, "#FFD23F");
  statBar(ctx, t("garage.speed"), spec.maxSpeed / 15, 450);
  statBar(ctx, t("garage.power"), spec.driveForce / 30, 492);
  statBar(ctx, t("garage.walls"), (spec.bed.wallTop - 0.2) / 0.55, 534);
  plainText(ctx, t("garage.colors"), 70, 588, 22, "#FFFFFF", "left");
}

// ---------------- Shop ----------------

export function shopButtons(host: MenuHost): Button[] {
  const save = loadSave();
  const list: Button[] = [backButton(host)];
  const tab = host.shopTab;
  list.push(
    { x: VIEW_W / 2 - 250, y: 116, w: 240, h: 64, label: t("shop.vehicles"), primary: tab === "vehicles", action: () => host.openShop("vehicles") },
    { x: VIEW_W / 2 + 10, y: 116, w: 240, h: 64, label: t("shop.paints"), primary: tab === "paints", action: () => host.openShop("paints") },
  );
  if (tab === "vehicles") {
    const items = VEHICLES.filter((v) => v.price > 0);
    const w = 330;
    const gap = 26;
    const x0 = (VIEW_W - (items.length * w + (items.length - 1) * gap)) / 2;
    items.forEach((spec, i) => {
      const owned = save.owned.includes(spec.id);
      const afford = save.coins >= spec.price;
      list.push({
        x: x0 + i * (w + gap),
        y: 220,
        w,
        h: 440,
        render: (c, b) => {
          card(c, b, owned ? "#E9F9EE" : "#FFFFFF", false);
          preview(c, spec, b.x + b.w / 2, b.y + 120, 72, spec.color);
          plainText(c, t(spec.name), b.x + b.w / 2, b.y + 230, 26);
          const bars: [string, number][] = [
            [t("garage.speed"), spec.maxSpeed / 15],
            [t("garage.power"), spec.driveForce / 30],
            [t("garage.walls"), (spec.bed.wallTop - 0.2) / 0.55],
          ];
          bars.forEach(([label, v], k) => {
            const y = b.y + 272 + k * 34;
            plainText(c, label, b.x + 26, y, 18, "#555555", "left");
            roundRect(c, b.x + 120, y - 8, 180, 16, 8);
            c.fillStyle = "#E6E6E6";
            c.fill();
            roundRect(c, b.x + 120, y - 8, Math.max(16, 180 * Math.min(1, v)), 16, 8);
            c.fillStyle = "#FFB627";
            c.fill();
          });
          // price tag
          roundRect(c, b.x + 40, b.y + b.h - 78, b.w - 80, 58, 18);
          c.fillStyle = owned ? "#3BCEAC" : afford ? "#FFD23F" : "#DDDDDD";
          c.fill();
          c.lineWidth = 3;
          c.strokeStyle = COLORS.outline;
          c.stroke();
          if (owned) plainText(c, `✓ ${t("shop.owned")}`, b.x + b.w / 2, b.y + b.h - 48, 26);
          else {
            drawCoin(c, b.x + b.w / 2 - 44, b.y + b.h - 49, 17);
            plainText(c, String(spec.price), b.x + b.w / 2 - 18, b.y + b.h - 48, 28, afford ? COLORS.outline : "#888888", "left");
          }
        },
        action: () => (owned ? host.selectVehicle(spec.id) : host.buyVehicle(spec.id)),
      });
    });
  } else {
    const items = PAINTS.filter((p) => p.price > 0);
    const w = 180;
    const gap = 18;
    const perRow = 3;
    const x0 = (VIEW_W - (perRow * w + (perRow - 1) * gap)) / 2;
    const van = getVehicleSpec(save.vehicle);
    items.forEach((paint, i) => {
      const owned = save.paints.includes(paint.id);
      const afford = save.coins >= paint.price;
      list.push({
        x: x0 + (i % perRow) * (w + gap),
        y: 205 + Math.floor(i / perRow) * 250,
        w,
        h: 230,
        render: (c, b) => {
          card(c, b, owned ? "#E9F9EE" : "#FFFFFF", false);
          preview(c, van, b.x + b.w / 2, b.y + 62, 42, paint.color ?? van.color);
          plainText(c, t(paint.name), b.x + b.w / 2, b.y + 128, 22);
          roundRect(c, b.x + 22, b.y + b.h - 70, b.w - 44, 50, 16);
          c.fillStyle = owned ? "#3BCEAC" : afford ? "#FFD23F" : "#DDDDDD";
          c.fill();
          c.lineWidth = 3;
          c.strokeStyle = COLORS.outline;
          c.stroke();
          if (owned) plainText(c, "✓", b.x + b.w / 2, b.y + b.h - 44, 28);
          else {
            drawCoin(c, b.x + b.w / 2 - 30, b.y + b.h - 45, 14);
            plainText(c, String(paint.price), b.x + b.w / 2 - 8, b.y + b.h - 44, 24, afford ? COLORS.outline : "#888888", "left");
          }
        },
        action: () => (owned ? host.selectPaint(paint.id) : host.buyPaint(paint.id)),
      });
    });
  }
  return list;
}

export function drawShop(ctx: CanvasRenderingContext2D, toast: { text: string; good: boolean; left: number } | null): void {
  drawDim(ctx, 0.6);
  outlinedText(ctx, t("btn.shop"), VIEW_W / 2, 64, 56, "#FFFFFF");
  drawCoinPill(ctx, 24, 24, loadSave().coins);
  if (toast && toast.left > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, toast.left * 2);
    outlinedText(ctx, toast.text, VIEW_W / 2, VIEW_H - 14, 28, toast.good ? "#3BCEAC" : "#FF6B6B");
    ctx.restore();
  }
}
