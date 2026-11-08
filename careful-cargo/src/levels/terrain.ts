import type { TerrainPoint } from "./types";

const DEFAULT_ROUND = 6;
const STEP = 0.4; // meters between generated points on curves

/**
 * Turns control points into a smooth polyline: every corner is rounded with a
 * quadratic curve. Straight parts stay straight (good for even slopes).
 */
export function buildTerrain(points: TerrainPoint[]): { x: number; y: number }[] {
  if (points.length < 2) return points.map(([x, y]) => ({ x, y }));
  const out: { x: number; y: number }[] = [{ x: points[0][0], y: points[0][1] }];

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy, round] = points[i];
    const [nx, ny] = points[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    if (inLen < 1e-6 || outLen < 1e-6) continue;
    const cut = Math.min(round ?? DEFAULT_ROUND, inLen * 0.5, outLen * 0.5);
    const ax = cx - ((cx - px) / inLen) * cut;
    const ay = cy - ((cy - py) / inLen) * cut;
    const bx = cx + ((nx - cx) / outLen) * cut;
    const by = cy + ((ny - cy) / outLen) * cut;
    const steps = Math.max(1, Math.ceil((cut * 2) / STEP));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      const x = u * u * ax + 2 * u * t * cx + t * t * bx;
      const y = u * u * ay + 2 * u * t * cy + t * t * by;
      const last = out[out.length - 1];
      if (Math.hypot(x - last.x, y - last.y) > 0.02) out.push({ x, y });
    }
  }
  const [lx, ly] = points[points.length - 1];
  out.push({ x: lx, y: ly });
  return out;
}

/** Terrain height at x (first matching segment). */
export function heightAt(poly: { x: number; y: number }[], x: number): number {
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1];
    const b = poly[i];
    if (x >= a.x && x <= b.x) {
      const t = b.x - a.x < 1e-6 ? 0 : (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return x < poly[0].x ? poly[0].y : poly[poly.length - 1].y;
}
