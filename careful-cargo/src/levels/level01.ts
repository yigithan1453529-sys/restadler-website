import type { LevelData } from "./types";

// Gas and brake on gentle hills.
export const level01: LevelData = {
  id: 1,
  name: "level.1",
  terrain: [[0, 0], [20, 0], [35, 1.5], [50, 0], [65, 2], [80, 0.5], [95, 2.5], [108, 0], [140, 0]],
  cargo: [{ type: "crate", count: 3 }],
  finishX: 115,
  checkpoints: [],
  hints: [
    { x: 0, text: "hint.drive" },
    { x: 40, text: "hint.brake" },
  ],
};
