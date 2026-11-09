import type { LevelData } from "./types";
import { heightAt } from "./terrain";

export interface Pickup {
  x: number;
  y: number;
  kind: "coin" | "star";
  taken: boolean;
}

export const PICKUP_VALUE = { coin: 2, star: 10 };

/**
 * Places coins along a level: groups of three every 26 m, floating above
 * the highest ground nearby (so they arc over pits), and one big star in
 * the air around the middle of the level that needs a bump or a jump.
 */
export function makePickups(level: LevelData, terrain: { x: number; y: number }[]): Pickup[] {
  const out: Pickup[] = [];
  const maxGround = (x: number, span: number): number => {
    let m = -Infinity;
    for (let dx = -span; dx <= span; dx += 0.5) m = Math.max(m, heightAt(terrain, x + dx));
    return m;
  };
  const ceilingAt = (x: number): number => {
    let c = Infinity;
    for (const o of level.objects ?? []) {
      if (o.type === "tunnel" && x >= o.x0 - 1 && x <= o.x1 + 1) c = Math.min(c, Math.min(heightAt(terrain, o.x0), heightAt(terrain, o.x1)) + o.height);
    }
    return c;
  };
  for (let x = 16; x < level.finishX - 6; x += 26) {
    for (let k = 0; k < 3; k++) {
      const cx = x + k * 1.4;
      const y = Math.min(maxGround(cx, 3) + 1.4, ceilingAt(cx) - 0.7);
      out.push({ x: cx, y, kind: "coin", taken: false });
    }
  }
  const sx = Math.round(level.finishX * 0.55);
  out.push({ x: sx, y: Math.min(maxGround(sx, 4) + 2.7, ceilingAt(sx) - 0.7), kind: "star", taken: false });
  return out;
}
