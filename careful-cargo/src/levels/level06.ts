import type { LevelData } from "./types";

// Exam level: bumps, a step, a downhill and a crest combined, with eggs.
export const level06: LevelData = {
  id: 6,
  name: "level.6",
  terrain: [
    [0, 4],
    [14, 4],
    // bumps
    [17, 4.6],
    [20, 4],
    [24, 4.7],
    [28, 4],
    // step down
    [36, 4, 0.5],
    [37.4, 3.2, 0.5],
    // downhill
    [44, 3.2],
    [58, -2.5],
    [64, -2.5],
    // sharp crest: fast = flying eggs
    [70, -1.2, 1.0],
    [72, -1.0, 0.6],
    [75, -3.0, 0.8],
    [88, -5.6],
    // waves before the finish
    [96, -5.6],
    [99, -5.0],
    [102, -5.6],
    [106, -4.9],
    [110, -5.6],
    [150, -5.6],
  ],
  cargo: [{ type: "egg", count: 3 }],
  finishX: 128,
  checkpoints: [],
  hints: [{ x: 4, text: "hint.exam" }],
  killY: -7.5,
};
