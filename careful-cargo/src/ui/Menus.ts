import { VIEW_W } from "../game/Camera";
import { getPaint, PAINTS } from "../game/paints";
import { COLORS, drawVehiclePreview } from "../game/Renderer";
import {
  getVehicleSpec,
  MAX_UPGRADE,
  UPGRADE_KINDS,
  UPGRADE_PRICES,
  upgradedSpec,
  VEHICLES,
  type UpgradeKind,
  type VehicleSpec,
} from "../game/Vehicle";
import { t, type TextKey } from "../i18n";
import { loadSave, upgradeLevel } from "../storage";
import type { Button } from "./Button";
import { drawCoin, drawCoinPill, drawIcon, drawStar, drawSurface, outlinedText, plainText, roundRect, SURFACES } from "./draw";
import { drawDim } from "./Screens";
import { formatTime, type RankRow } from "../social";

/** What the menu screens need from the game. */
export interface MenuHost {
  levelId: number;
  muted: boolean;
  time: number;
  shopTab: "vehicles" | "paints";
  rankingTab: "friends" | "records";
  openRanking(tab?: "friends" | "records"): void;
  invite(): void;
  rerollName(): void;
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
  buyUpgrade(kind: UpgradeKind): void;
}

function card(ctx: CanvasRenderingContext2D, b: Button, kind: "normal" | "selected" | "disabled" | "owned"): void {
  const look =
    kind === "selected" ? SURFACES.selected : kind === "disabled" ? SURFACES.disabled : kind === "owned" ? (["#F4FFF9", "#DDF5EA", "#9CC9B5"] as const) : SURFACES.normal;
  drawSurface(ctx, b.x, b.y, b.w, b.h, 26, look[0], look[1], look[2]);
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

/** Page index of the vehicle lists (kept while the game runs). */
const pager = { shop: 0, garage: 0 };

/** Left/right arrows for paged lists; x0/x1 are the outer edges. */
function pageArrows(page: number, pages: number, x0: number, x1: number, y: number, set: (p: number) => void): Button[] {
  const list: Button[] = [];
  if (page > 0) list.push({ x: x0, y: y - 38, w: 60, h: 76, icon: "prev", action: () => set(page - 1) });
  if (page < pages - 1) list.push({ x: x1 - 60, y: y - 38, w: 60, h: 76, icon: "next", action: () => set(page + 1) });
  return list;
}

/** Shows the page that contains a vehicle (e.g. after choosing it elsewhere). */
export function showVehicleInLists(id: string): void {
  const i = VEHICLES.findIndex((v) => v.id === id);
  if (i < 0) return;
  pager.garage = Math.floor(i / 4);
  const j = VEHICLES.filter((v) => v.price > 0).findIndex((v) => v.id === id);
  if (j >= 0) pager.shop = Math.floor(j / 3);
}

function backButton(host: MenuHost): Button {
  return { x: VIEW_W - 100, y: 24, w: 76, h: 76, icon: "home", action: () => host.goHome() };
}

// ---------------- Home ----------------

/** Game logo: big gradient lettering, tilted a little, with a crate on top. */
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.04);
  const text = t("title");
  ctx.font = `900 104px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  // thick dark outline and a drop "3D" layer
  ctx.lineWidth = 22;
  ctx.strokeStyle = "#2D2D2D";
  ctx.strokeText(text, 0, 8);
  ctx.fillStyle = "#2D2D2D";
  ctx.fillText(text, 0, 8);
  ctx.strokeText(text, 0, 0);
  const g = ctx.createLinearGradient(0, -50, 0, 50);
  g.addColorStop(0, "#FFE066");
  g.addColorStop(0.55, "#FFB627");
  g.addColorStop(1, "#FF6B35");
  ctx.fillStyle = g;
  ctx.fillText(text, 0, 0);
  // little crate sitting on the logo
  const w = ctx.measureText(text).width;
  ctx.translate(w / 2 - 20, -62);
  ctx.rotate(0.18);
  ctx.fillStyle = "#C68642";
  roundRect(ctx, -26, -26, 52, 52, 6);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "#9C6630";
  ctx.lineWidth = 3;
  ctx.strokeRect(-17, -17, 34, 34);
  ctx.beginPath();
  ctx.moveTo(-17, -17);
  ctx.lineTo(17, 17);
  ctx.stroke();
  ctx.restore();
}

export function homeButtons(host: MenuHost): Button[] {
  return [
    { x: VIEW_W / 2 - 190, y: 248, w: 380, h: 120, label: t("home.play"), icon: "play", primary: true, action: () => host.play() },
    { x: 150, y: 440, w: 230, h: 92, label: t("btn.levels"), icon: "menu", action: () => host.openLevels() },
    { x: 400, y: 440, w: 230, h: 92, label: t("btn.garage"), icon: "garage", action: () => host.openGarage() },
    { x: 650, y: 440, w: 230, h: 92, label: t("btn.shop"), icon: "shop", action: () => host.openShop() },
    { x: 900, y: 440, w: 230, h: 92, label: t("btn.ranking"), icon: "trophy", action: () => host.openRanking() },
    { x: VIEW_W / 2 - 170, y: 568, w: 340, h: 76, label: t("btn.invite"), icon: "share", action: () => host.invite() },
    { x: 20, y: 18, w: 68, h: 68, icon: host.muted ? "soundOff" : "soundOn", action: () => host.toggleMute() },
  ];
}

export function drawHome(ctx: CanvasRenderingContext2D, host: MenuHost): void {
  drawDim(ctx, 0.3);
  drawLogo(ctx, VIEW_W / 2, 140 + Math.sin(host.time * 2) * 5);
  drawCoinPill(ctx, VIEW_W - 220, 22, loadSave().coins);
  outlinedText(ctx, t("hud.level", { n: host.levelId }), VIEW_W / 2, 400, 30, "#FFFFFF");
}

// ---------------- Garage ----------------

export function garageButtons(host: MenuHost): Button[] {
  const save = loadSave();
  const list: Button[] = [backButton(host)];
  // vehicle cards (2 × 2) on the right
  // 4 vehicles per page, arrows to flip through
  const perPage = 4;
  const pages = Math.ceil(VEHICLES.length / perPage);
  pager.garage = Math.min(pager.garage, pages - 1);
  list.push(...pageArrows(pager.garage, pages, 628, 1268, 330, (p) => (pager.garage = p)));
  VEHICLES.slice(pager.garage * perPage, pager.garage * perPage + perPage).forEach((spec, i) => {
    const owned = save.owned.includes(spec.id);
    const chosen = save.vehicle === spec.id;
    list.push({
      x: 698 + (i % 2) * 255,
      y: 130 + Math.floor(i / 2) * 200,
      w: 240,
      h: 180,
      render: (c, b) => {
        card(c, b, chosen ? "selected" : owned ? "normal" : "disabled");
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
  // upgrade buttons next to the upgrade rows
  UPGRADE_KINDS.forEach((kind, i) => {
    const level = upgradeLevel(save.vehicle, kind);
    const max = level >= MAX_UPGRADE;
    const price = UPGRADE_PRICES[Math.min(level, MAX_UPGRADE - 1)];
    const afford = save.coins >= price;
    list.push({
      x: 470,
      y: 412 + i * 44,
      w: 150,
      h: 38,
      disabled: max,
      render: (c, b) => {
        roundRect(c, b.x, b.y, b.w, b.h, 19);
        c.fillStyle = max ? "#3BCEAC" : afford ? "#FFD23F" : "#DDDDDD";
        c.fill();
        c.lineWidth = 2.5;
        c.strokeStyle = COLORS.outline;
        c.stroke();
        if (max) plainText(c, "MAX", b.x + b.w / 2, b.y + b.h / 2 + 1, 18);
        else {
          drawCoin(c, b.x + 30, b.y + b.h / 2, 11);
          plainText(c, `+  ${price}`, b.x + 48, b.y + b.h / 2 + 1, 18, afford ? COLORS.outline : "#888888", "left");
        }
      },
      action: () => host.buyUpgrade(kind),
    });
  });
  // paint swatches (only bought ones) under the big preview
  const spec = getVehicleSpec(save.vehicle);
  const chosenPaint = save.paint[spec.id] ?? "original";
  const owned = PAINTS.filter((p) => save.paints.includes(p.id));
  owned.forEach((paint, i) => {
    list.push({
      x: 70 + i * 74,
      y: 618,
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
      y: 618,
      w: 64,
      h: 64,
      icon: "shop",
      action: () => host.openShop("paints"),
    });
  }
  return list;
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
  // upgrade rows: name and three level pips
  UPGRADE_KINDS.forEach((kind, i) => {
    const y = 431 + i * 44;
    const level = upgradeLevel(save.vehicle, kind);
    plainText(ctx, t(`upgrade.${kind}` as TextKey), 70, y, 21, "#FFFFFF", "left");
    for (let k = 0; k < MAX_UPGRADE; k++) {
      roundRect(ctx, 260 + k * 64, y - 10, 56, 20, 10);
      ctx.fillStyle = k < level ? "#FFD23F" : "rgba(255,255,255,0.25)";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = COLORS.outline;
      ctx.stroke();
    }
  });
  const up = upgradedSpec(spec, save.upgrades[spec.id] ?? {});
  plainText(ctx, `${Math.round(up.maxSpeed * 3.6)} km/h`, 330, 395, 20, "#FFFFFF");
  plainText(ctx, t("garage.colors"), 70, 600, 20, "#FFFFFF", "left");
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
    const all = VEHICLES.filter((v) => v.price > 0);
    const perPage = 3;
    const pages = Math.ceil(all.length / perPage);
    pager.shop = Math.min(pager.shop, pages - 1);
    list.push(...pageArrows(pager.shop, pages, 30, VIEW_W - 30, 440, (p) => (pager.shop = p)));
    const items = all.slice(pager.shop * perPage, pager.shop * perPage + perPage);
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
          card(c, b, owned ? "owned" : "normal");
          preview(c, spec, b.x + b.w / 2, b.y + 120, 72, spec.color);
          plainText(c, t(spec.name), b.x + b.w / 2, b.y + 230, 26);
          const bars: [string, number][] = [
            [t("garage.speed"), spec.maxSpeed / 27],
            [t("garage.power"), spec.driveForce / 35],
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
          card(c, b, owned ? "owned" : "normal");
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

export function drawShop(ctx: CanvasRenderingContext2D): void {
  drawDim(ctx, 0.6);
  outlinedText(ctx, t("btn.shop"), VIEW_W / 2, 64, 56, "#FFFFFF");
  drawCoinPill(ctx, 24, 24, loadSave().coins);
}

// ---------------- Ranking ----------------

export function rankingButtons(host: MenuHost): Button[] {
  const tab = host.rankingTab;
  return [
    backButton(host),
    { x: VIEW_W / 2 - 250, y: 116, w: 240, h: 64, label: t("ranking.friends"), primary: tab === "friends", action: () => host.openRanking("friends") },
    { x: VIEW_W / 2 + 10, y: 116, w: 240, h: 64, label: t("ranking.records"), primary: tab === "records", action: () => host.openRanking("records") },
    { x: VIEW_W / 2 - 330, y: 630, w: 360, h: 74, label: t("btn.invite"), icon: "share", primary: true, action: () => host.invite() },
    { x: VIEW_W / 2 + 50, y: 630, w: 280, h: 74, label: t("ranking.newName"), icon: "dice", action: () => host.rerollName() },
  ];
}

const MEDALS = ["#FFD23F", "#C9D3DE", "#E3A869"];

export function drawRanking(ctx: CanvasRenderingContext2D, host: MenuHost, rows: RankRow[], levelsCount: number): void {
  drawDim(ctx, 0.6);
  outlinedText(ctx, t("btn.ranking"), VIEW_W / 2, 64, 56, "#FFFFFF");
  drawCoinPill(ctx, 24, 24, loadSave().coins);
  const x = 200;
  const w = VIEW_W - 400;
  drawSurface(ctx, x, 200, w, 410, 30, "#FFFFFF", "#EEF3FA", "#B4C0D3");

  if (host.rankingTab === "friends") {
    const shown = rows.slice(0, 6);
    shown.forEach((row, i) => {
      const y = 222 + i * 62;
      if (row.me) {
        roundRect(ctx, x + 14, y, w - 28, 54, 18);
        ctx.fillStyle = "#FFF1B8";
        ctx.fill();
      }
      // rank badge
      ctx.beginPath();
      ctx.arc(x + 52, y + 27, 21, 0, Math.PI * 2);
      ctx.fillStyle = MEDALS[i] ?? "#E6EBF2";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = COLORS.outline;
      ctx.stroke();
      plainText(ctx, String(i + 1), x + 52, y + 28, 22);
      plainText(ctx, row.me ? `${row.name}  (${t("ranking.you")})` : row.name, x + 92, y + 28, 24, COLORS.outline, "left");
      drawStar(ctx, x + w - 330, y + 27, 15, true);
      plainText(ctx, String(row.stars), x + w - 308, y + 28, 24, COLORS.outline, "left");
      plainText(ctx, t("ranking.levels", { n: row.levels }), x + w - 230, y + 28, 20, "#666666", "left");
      plainText(ctx, row.levels ? formatTime(row.time) : "–", x + w - 34, y + 28, 22, COLORS.outline, "right");
    });
    if (rows.length === 1) {
      plainText(ctx, t("ranking.empty"), VIEW_W / 2, 470, 22, "#555555");
    }
  } else {
    const records = loadSave().records;
    const cols = 6;
    const cw = (w - 40) / cols;
    for (let id = 1; id <= levelsCount; id++) {
      const c = (id - 1) % cols;
      const r = Math.floor((id - 1) / cols);
      const cx = x + 20 + c * cw;
      const cy = 220 + r * 96;
      roundRect(ctx, cx + 4, cy, cw - 8, 86, 16);
      ctx.fillStyle = records[id] ? "#FFFFFF" : "#F0F2F6";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#C5CEDB";
      ctx.stroke();
      plainText(ctx, `${t("ranking.level")} ${id}`, cx + cw / 2, cy + 18, 16, "#666666");
      const rec = records[id];
      if (rec) {
        for (let k = 0; k < 3; k++) drawStar(ctx, cx + cw / 2 + (k - 1) * 24, cy + 44, 10, k < rec.s);
        plainText(ctx, formatTime(rec.t), cx + cw / 2, cy + 70, 18);
      } else {
        plainText(ctx, "–", cx + cw / 2, cy + 52, 24, "#AAAAAA");
      }
    }
  }
}

/** A short message at the bottom of the screen. */
export function drawToast(ctx: CanvasRenderingContext2D, toast: { text: string; good: boolean; left: number } | null): void {
  if (!toast || toast.left <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, toast.left * 2);
  ctx.font = `800 26px "Trebuchet MS", system-ui, sans-serif`;
  const w = ctx.measureText(toast.text).width + 60;
  drawSurface(ctx, VIEW_W / 2 - w / 2, 14, w, 52, 26, toast.good ? "#6EE7C2" : "#FF9B9B", toast.good ? "#2FBF95" : "#F06262", toast.good ? "#1E8E6D" : "#B83B3B", 4);
  plainText(ctx, toast.text, VIEW_W / 2, 41, 24, "#FFFFFF");
  ctx.restore();
}
