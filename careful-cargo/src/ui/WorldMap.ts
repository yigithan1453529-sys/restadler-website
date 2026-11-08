// World map with four islands, and the island view with its ten level stops.

import { VIEW_H, VIEW_W } from "../game/Camera";
import { COLORS } from "../game/Renderer";
import { THEMES, type WorldId } from "../game/themes";
import { getVehicleSpec } from "../game/Vehicle";
import { drawVehiclePreview } from "../game/Renderer";
import { t } from "../i18n";
import type { LevelData } from "../levels/types";
import type { SaveData } from "../storage";
import type { Button } from "./Button";
import { drawIcon, drawStar, glassPill, outlinedText, plainText, roundRect } from "./draw";

export interface Island {
  world: WorldId;
  levels: LevelData[];
}

export interface MapHost {
  levelId: number;
  time: number;
  openIsland(index: number): void;
  openMap(): void;
  goHome(): void;
  playLevel(id: number): void;
}

/** Island colors: sand rim, land, and a darker land shade. */
const LAND: Record<WorldId, [string, string, string]> = {
  meadow: ["#F4D58D", "#7ED957", "#5BC236"],
  desert: ["#F7E1A8", "#F2C57C", "#E0A94F"],
  snow: ["#DDEBF7", "#FFFFFF", "#CFE2F3"],
  city: ["#C9CED9", "#8E9AAF", "#6F7C93"],
};

/** Island centers on the world map (virtual pixels), left to right along the ferry route. */
const SPOTS = [
  { x: 240, y: 470 },
  { x: 520, y: 270 },
  { x: 800, y: 480 },
  { x: 1060, y: 270 },
];

export function islandOf(levelId: number, islands: Island[]): number {
  const i = islands.findIndex((isl) => isl.levels.some((l) => l.id === levelId));
  return Math.max(0, i);
}

function starsOn(island: Island, save: SaveData): number {
  return island.levels.reduce((sum, l) => sum + (save.stars[l.id] ?? 0), 0);
}

function islandLocked(island: Island, save: SaveData): boolean {
  return island.levels[0].id > save.unlocked;
}

// ---------- shared drawing ----------

function drawSea(ctx: CanvasRenderingContext2D, time: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "#6FD3FF");
  g.addColorStop(1, "#1E88E5");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // gentle wave lines
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * 180 + (row % 2) * 90 + Math.sin(time * 0.8 + row) * 14;
      const y = 40 + row * 80;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 15, y - 8, x + 30, y);
      ctx.quadraticCurveTo(x + 45, y + 8, x + 60, y);
      ctx.stroke();
    }
  }
  ctx.lineCap = "butt";
}

/** A soft, bumpy island blob centered at (x, y). */
function blobPath(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, seed: number): void {
  ctx.beginPath();
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 1 + 0.07 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 + seed * 2);
    const px = x + Math.cos(a) * rx * wobble;
    const py = y + Math.sin(a) * ry * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawLand(ctx: CanvasRenderingContext2D, world: WorldId, x: number, y: number, rx: number, ry: number, seed: number, grey: boolean): void {
  const [rim, land, shade] = grey ? ["#D6D6D6", "#BDBDBD", "#A8A8A8"] : LAND[world];
  // shallow water ring
  blobPath(ctx, x, y + 6, rx * 1.12, ry * 1.14, seed);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fill();
  // sand
  blobPath(ctx, x, y + 6, rx, ry, seed);
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  // land
  blobPath(ctx, x, y - 4, rx * 0.86, ry * 0.8, seed + 1);
  const g = ctx.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, land);
  g.addColorStop(1, shade);
  ctx.fillStyle = g;
  ctx.fill();
}

/** Small props that tell the islands apart. */
function drawProps(ctx: CanvasRenderingContext2D, world: WorldId, x: number, y: number, s: number, grey: boolean): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 2.5 / s;
  ctx.strokeStyle = COLORS.outline;
  const g = (c: string): string => (grey ? "#9E9E9E" : c);
  const spots = [
    [-60, -10],
    [10, -30],
    [55, 5],
  ];
  for (const [px, py] of spots) {
    if (world === "meadow") {
      ctx.fillStyle = g("#8B5A2B");
      ctx.fillRect(px - 3, py, 6, 16);
      ctx.fillStyle = g("#3FAE2A");
      ctx.beginPath();
      ctx.arc(px, py - 4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (world === "desert") {
      ctx.fillStyle = g("#4CAF50");
      roundRect(ctx, px - 5, py - 18, 10, 34, 5);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, px - 15, py - 8, 8, 16, 4);
      ctx.fill();
      ctx.stroke();
    } else if (world === "snow") {
      ctx.fillStyle = g("#2E8B57");
      ctx.beginPath();
      ctx.moveTo(px - 14, py + 14);
      ctx.lineTo(px + 14, py + 14);
      ctx.lineTo(px, py - 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(px - 5, py - 6);
      ctx.lineTo(px + 5, py - 6);
      ctx.lineTo(px, py - 20);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = g("#4C5797");
      const h = 30 + ((px + 60) % 25);
      ctx.fillRect(px - 10, py + 14 - h, 20, h);
      ctx.strokeRect(px - 10, py + 14 - h, 20, h);
      ctx.fillStyle = grey ? "#BBBBBB" : "#FFE07A";
      for (let wy = py + 18 - h; wy < py + 8; wy += 8) {
        ctx.fillRect(px - 6, wy, 4, 4);
        ctx.fillRect(px + 2, wy, 4, 4);
      }
    }
  }
  ctx.restore();
}

function ribbon(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, size = 26): void {
  ctx.font = `900 ${size}px "Trebuchet MS", system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 50;
  const h = size + 22;
  ctx.fillStyle = "#E84A5F";
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 18, y - h / 2 + 6);
  ctx.lineTo(x - w / 2, y - h / 2 + 6);
  ctx.lineTo(x - w / 2, y + h / 2 + 6);
  ctx.lineTo(x - w / 2 - 18, y + h / 2 + 6);
  ctx.lineTo(x - w / 2 - 8, y + 6);
  ctx.closePath();
  ctx.moveTo(x + w / 2 + 18, y - h / 2 + 6);
  ctx.lineTo(x + w / 2, y - h / 2 + 6);
  ctx.lineTo(x + w / 2, y + h / 2 + 6);
  ctx.lineTo(x + w / 2 + 18, y + h / 2 + 6);
  ctx.lineTo(x + w / 2 + 8, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 10);
  ctx.fillStyle = "#FF6B6B";
  ctx.fill();
  ctx.stroke();
  outlinedText(ctx, text, x, y + 1, size, "#FFFFFF");
}

function drawVan(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, vehicle: string, color: string | null): void {
  const spec = getVehicleSpec(vehicle);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, -scale);
  drawVehiclePreview(ctx, spec, 3 / scale, color ?? spec.color);
  ctx.restore();
}

// ---------- world map ----------

export function mapButtons(host: MapHost, islands: Island[], save: SaveData): Button[] {
  const list: Button[] = [{ x: VIEW_W - 100, y: 24, w: 76, h: 76, icon: "home", action: () => host.goHome() }];
  islands.forEach((island, i) => {
    const p = SPOTS[i] ?? SPOTS[SPOTS.length - 1];
    const locked = islandLocked(island, save);
    list.push({
      x: p.x - 130,
      y: p.y - 110,
      w: 260,
      h: 230,
      disabled: locked,
      render: () => {}, // drawn by drawMap
      action: () => host.openIsland(i),
    });
  });
  return list;
}

export function drawMap(ctx: CanvasRenderingContext2D, time: number, islands: Island[], save: SaveData, current: number, paint: string | null): void {
  drawSea(ctx, time);
  // ferry route
  ctx.save();
  ctx.setLineDash([4, 14]);
  ctx.lineCap = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  SPOTS.slice(0, islands.length).forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else {
      const q = SPOTS[i - 1];
      ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 + 90, p.x, p.y);
    }
  });
  ctx.stroke();
  ctx.restore();

  islands.forEach((island, i) => {
    const p = SPOTS[i] ?? SPOTS[SPOTS.length - 1];
    const locked = islandLocked(island, save);
    const bob = Math.sin(time * 1.2 + i) * 3;
    drawLand(ctx, island.world, p.x, p.y + bob, 125, 80, i * 1.7, locked);
    drawProps(ctx, island.world, p.x, p.y - 8 + bob, 1, locked);
    ribbon(ctx, p.x, p.y + 92 + bob, t(THEMES[island.world].name), 22);
    if (locked) {
      ctx.beginPath();
      ctx.arc(p.x, p.y - 10 + bob, 34, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.outline;
      ctx.stroke();
      drawIcon(ctx, "lock", p.x, p.y - 8 + bob, 40);
    } else {
      const stars = starsOn(island, save);
      glassPill(ctx, p.x - 62, p.y - 118 + bob, 124, 40);
      drawStar(ctx, p.x - 34, p.y - 98 + bob, 13, true);
      plainText(ctx, `${stars}/${island.levels.length * 3}`, p.x - 16, p.y - 97 + bob, 20, COLORS.outline, "left");
    }
    if (i === current) drawVan(ctx, p.x + 70, p.y - 30 + bob + Math.sin(time * 4) * 3, 20, save.vehicle, paint);
  });

  outlinedText(ctx, t("map.title"), VIEW_W / 2, 64, 52, "#FFFFFF");
  glassPill(ctx, 24, 28, 170, 60);
  drawStar(ctx, 58, 58, 18, true);
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  plainText(ctx, `${total}`, 86, 59, 26, COLORS.outline, "left");
}

// ---------- island view ----------

/** Positions of the 10 stops: a road that snakes over the island in two rows. */
function stopPositions(n: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const perRow = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const row = i < perRow ? 0 : 1;
    const k = row === 0 ? i : n - 1 - i;
    const x = 210 + k * ((VIEW_W - 420) / (perRow - 1));
    const y = (row === 0 ? 300 : 520) + Math.sin(k * 1.3) * 22;
    out.push({ x, y });
  }
  return out;
}

export function islandButtons(host: MapHost, island: Island, index: number, count: number, save: SaveData): Button[] {
  const list: Button[] = [
    { x: VIEW_W - 100, y: 24, w: 76, h: 76, icon: "home", action: () => host.goHome() },
    { x: 24, y: 24, w: 76, h: 76, icon: "menu", action: () => host.openMap() },
  ];
  if (index > 0) list.push({ x: 24, y: VIEW_H / 2 - 38, w: 64, h: 76, icon: "prev", action: () => host.openIsland(index - 1) });
  if (index < count - 1) list.push({ x: VIEW_W - 88, y: VIEW_H / 2 - 38, w: 64, h: 76, icon: "next", action: () => host.openIsland(index + 1) });
  const stops = stopPositions(island.levels.length);
  island.levels.forEach((level, i) => {
    const p = stops[i];
    const locked = level.id > save.unlocked;
    const r = i === island.levels.length - 1 ? 52 : 44;
    list.push({
      x: p.x - r,
      y: p.y - r,
      w: r * 2,
      h: r * 2,
      disabled: locked,
      render: () => {}, // drawn by drawIsland
      action: () => host.playLevel(level.id),
    });
  });
  return list;
}

export function drawIsland(ctx: CanvasRenderingContext2D, time: number, island: Island, save: SaveData, currentLevel: number, paint: string | null): void {
  drawSea(ctx, time);
  drawLand(ctx, island.world, VIEW_W / 2, VIEW_H / 2 + 50, 560, 270, 3, false);
  // a few props around the edge
  drawProps(ctx, island.world, 170, 430, 1.1, false);
  drawProps(ctx, island.world, 1110, 420, 1.1, false);
  drawProps(ctx, island.world, VIEW_W / 2, 420, 0.9, false);

  const stops = stopPositions(island.levels.length);
  // road
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const road = (): void => {
    ctx.beginPath();
    stops.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const q = stops[i - 1];
        if (Math.abs(p.y - q.y) > 100) ctx.bezierCurveTo(q.x + 150, q.y, p.x + 150, p.y, p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    });
  };
  road();
  ctx.lineWidth = 34;
  ctx.strokeStyle = COLORS.outline;
  ctx.stroke();
  road();
  ctx.lineWidth = 28;
  ctx.strokeStyle = "#F7E7C1";
  ctx.stroke();
  road();
  ctx.setLineDash([10, 16]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#D9B97A";
  ctx.stroke();
  ctx.restore();

  island.levels.forEach((level, i) => {
    const p = stops[i];
    const locked = level.id > save.unlocked;
    const finale = i === island.levels.length - 1;
    const exam = i === 3 || i === 8;
    const current = level.id === currentLevel;
    const stars = save.stars[level.id] ?? 0;
    const r = finale ? 52 : 44;
    const pulse = current ? 1 + Math.sin(time * 5) * 0.05 : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "rgba(20,30,60,0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    if (locked) {
      g.addColorStop(0, "#E4E4E4");
      g.addColorStop(1, "#BDBDBD");
    } else if (current) {
      g.addColorStop(0, "#FFE066");
      g.addColorStop(1, "#FFB627");
    } else if (finale) {
      g.addColorStop(0, "#FF9A8B");
      g.addColorStop(1, "#E84A5F");
    } else {
      g.addColorStop(0, "#FFFFFF");
      g.addColorStop(1, "#E3EAF5");
    }
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.outline;
    ctx.stroke();
    if (locked) drawIcon(ctx, "lock", 0, 2, 36);
    else if (finale) drawIcon(ctx, "trophy", 0, -4, 46);
    else outlinedText(ctx, String(level.id), 0, 2, 34, current ? "#FFFFFF" : "#FF6B35");
    if (exam && !locked) {
      ctx.beginPath();
      ctx.arc(r * 0.72, -r * 0.72, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#3D8BFF";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.stroke();
      plainText(ctx, "!", r * 0.72, -r * 0.72 + 1, 20, "#FFFFFF");
    }
    ctx.restore();
    if (!locked) for (let k = 0; k < 3; k++) drawStar(ctx, p.x + (k - 1) * 26, p.y + r + 16, 11, k < stars);
    if (current) drawVan(ctx, p.x, p.y - r - 34 + Math.sin(time * 4) * 3, 22, save.vehicle, paint);
  });

  ribbon(ctx, VIEW_W / 2, 64, t(THEMES[island.world].name), 34);
  const done = island.levels.filter((l) => (save.stars[l.id] ?? 0) > 0).length;
  plainText(ctx, t("map.progress", { n: done, total: island.levels.length }), VIEW_W / 2, 118, 22, "#FFFFFF");
}
