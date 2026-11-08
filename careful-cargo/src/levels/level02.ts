import type { LevelData, TerrainPoint } from "./types";

/** A short, rather sharp bump: going over it too fast throws the cargo. */
function bump(x: number, height: number, width = 4): TerrainPoint[] {
  return [
    [x, 0],
    [x + width / 2, height],
    [x + width, 0],
  ];
}

// Driving too fast over bumps makes crates fly. 6 bumps, 0.6–1.2 m high.
export const level02: LevelData = {
  id: 2,
  name: "level.2",
  terrain: [
    [0, 0],
    ...bump(22, 0.6),
    ...bump(38, 0.8),
    ...bump(54, 1.0),
    ...bump(70, 0.7),
    ...bump(87, 1.2, 5),
    ...bump(105, 0.9),
    [118, 0],
    [128, 1.5],
    [138, 0],
    [165, 0],
  ],
  cargo: [{ type: "crate", count: 4 }],
  finishX: 145,
  checkpoints: [],
  hints: [{ x: 8, text: "hint.bumps" }],
};
