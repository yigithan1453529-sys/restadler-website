import type { LevelData } from "./types";

// Soft landings: 3 steps down (about 0.8 m each) plus small waves.
export const level03: LevelData = {
  id: 3,
  name: "level.3",
  terrain: [
    [0, 3.2],
    [16, 3.2],
    [21, 3.55],
    [26, 3.2],
    // step 1 (a small kick right before it throws fast drivers into the air)
    [31, 3.2],
    [34, 3.5, 1.2],
    [36, 3.2, 0.5],
    [37.4, 2.4, 0.5],
    [50, 2.4],
    [54, 2.7],
    [58, 2.4],
    // step 2
    [64, 2.4],
    [67, 2.7, 1.2],
    [70, 2.4, 0.5],
    [71.4, 1.6, 0.5],
    [84, 1.6],
    // step 3
    [89, 1.9, 1.2],
    [92, 1.6, 0.5],
    [93.4, 0.8, 0.5],
    [106, 0.8],
    [110, 1.05],
    [114, 0.8],
    [160, 0.8],
  ],
  cargo: [{ type: "egg", count: 5 }],
  finishX: 135,
  checkpoints: [],
  hints: [{ x: 0, text: "hint.eggs" }],
};
