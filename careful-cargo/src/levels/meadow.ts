import { bridge, bump, pit } from "./shapes";
import type { LevelData } from "./types";

const b10 = bridge(40, 49.1);

/** Meadow island, levels 7–10 (levels 1–6 have their own files). */
export const meadowLevels: LevelData[] = [
  {
    id: 7,
    name: "level.7",
    terrain: [[0, 0], [18, 0], [30, 2.5], [42, 0], [52, 0], [64, 3.5], [76, 0], [84, 0], ...bump(88, 0.8), [100, 0], [112, 2], [124, 0], [150, 0]],
    // barrels roll down the second hill
    objects: [{ type: "barrels", x: 66, every: 6 }],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 132,
    checkpoints: [],
    hints: [{ x: 46, text: "hint.barrels" }],
  },
  {
    id: 8,
    name: "level.8",
    terrain: [[0, 0], [20, 0], [30, 0.8], [40, 0], [70, 0], [80, 1.2], [92, 0], ...bump(98, 0.5, 5), [110, 0], [140, 0]],
    objects: [{ type: "mud", x0: 44, x1: 64 }],
    weather: "rain",
    cargo: [{ type: "egg", count: 4 }],
    finishX: 122,
    checkpoints: [],
    hints: [
      { x: 0, text: "hint.rain" },
      { x: 30, text: "hint.mud" },
    ],
  },
  {
    // Exam: bumps on a plateau, a long downhill, a bump in the valley, uphill.
    id: 9,
    name: "level.9",
    terrain: [[0, 6], [16, 6], ...bump(18, 0.5, 5, 6), [30, 6], [46, -0.5], [54, -0.5], ...bump(57, 0.6, 5, -0.5), [66, -0.5], [80, 3], [92, 3], [150, 3]],
    cargo: [{ type: "cake", count: 3 }],
    finishX: 120,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.exam" }],
  },
  {
    // Island finale: bumps, the wobbly bridge and a jump.
    id: 10,
    name: "level.10",
    terrain: [
      [0, 0], [14, 0], ...bump(16, 0.7), ...bump(24, 0.9), [32, 0], ...b10.terrain, [58, 0],
      [70, 2.2, 0.3], ...pit(70, 75.6, 2.2, 1.3).slice(1), [84, 0], [100, 0], [110, 1.5], [120, 0], [150, 0],
    ],
    objects: [b10.object],
    cargo: [{ type: "crate", count: 4, perRow: 2 }],
    finishX: 132,
    checkpoints: [80],
    hints: [
      { x: 0, text: "hint.finale" },
      { x: 80, text: "hint.checkpoint" },
    ],
    killY: -3.5,
  },
];
