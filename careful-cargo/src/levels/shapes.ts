import type { LevelObject, TerrainPoint } from "./types";

/** A bump starting at x on ground level `base`. */
export function bump(x: number, height: number, width = 4, base = 0): TerrainPoint[] {
  return [
    [x, base],
    [x + width / 2, base + height],
    [x + width, base],
  ];
}

/** A deep pit from x0 to x1 with sharp edges (left edge at y0, right edge at y1). */
export function pit(x0: number, x1: number, y0: number, y1 = y0, depth = 9): TerrainPoint[] {
  const bottom = Math.min(y0, y1) - depth;
  return [
    [x0, y0, 0.1],
    [x0 + 0.1, bottom, 0.1],
    [x1 - 0.1, bottom, 0.1],
    [x1, y1, 0.1],
  ];
}

/** A pit with a wobbly bridge across it. */
export function bridge(x0: number, x1: number, y = 0): { terrain: TerrainPoint[]; object: LevelObject } {
  return { terrain: pit(x0, x1, y, y, 8), object: { type: "bridge", x0, x1 } };
}

/** A pit with a lift that carries the van from `bottom` up to the cliff at `top`. */
export function lift(x0: number, x1: number, bottom: number, top: number): { terrain: TerrainPoint[]; object: LevelObject } {
  return {
    terrain: [
      [x0, bottom, 0.1],
      [x0 + 0.1, bottom - 10, 0.1],
      [x1 - 0.1, bottom - 10, 0.1],
      [x1, top, 0.1],
    ],
    object: { type: "lift", x0: x0 + 0.1, x1, bottom, top },
  };
}
