import type { LevelData } from "./types";

// Braking: long steep downhill (about 30°), then an uphill.
export const level04: LevelData = {
  id: 4,
  name: "level.4",
  terrain: [
    [0, 10],
    [24, 10],
    [44, -1.55],
    [54, -1.55],
    [70, 4],
    [84, 4],
    [100, 5],
    [116, 4],
    [180, 4],
  ],
  cargo: [{ type: "cake", count: 3 }],
  finishX: 155,
  checkpoints: [],
  hints: [{ x: 10, text: "hint.steep" }],
};
