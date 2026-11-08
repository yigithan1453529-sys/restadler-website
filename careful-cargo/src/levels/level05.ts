import type { LevelData } from "./types";

// Tilting in the air: ramp, pit of about 6 m, landing slope. Checkpoint after the pit.
export const level05: LevelData = {
  id: 5,
  name: "level.5",
  terrain: [
    [0, 0],
    [36, 0],
    [52, 2.6, 0.3],
    [52.2, -10, 0.1],
    [57.8, -10, 0.1],
    [58, 1.6, 0.2],
    [72, 0],
    [92, 0],
    [106, 1.5],
    [120, 0],
    [190, 0],
  ],
  cargo: [{ type: "crate", count: 3 }],
  finishX: 165,
  checkpoints: [76],
  hints: [
    { x: 20, text: "hint.tilt" },
    { x: 76, text: "hint.checkpoint" },
  ],
  killY: -3,
};
