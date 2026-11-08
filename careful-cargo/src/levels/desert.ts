import { bridge, bump, pit } from "./shapes";
import type { LevelData } from "./types";

const b8 = bridge(45, 55.1);
const b10 = bridge(44, 52.1);

export const desertLevels: LevelData[] = [
  {
    id: 7,
    name: "level.7",
    world: "desert",
    // Ice cream: do not dawdle.
    terrain: [[0, 0], [25, 0], [40, 1.5], [55, 0], [70, 2], [85, 0], [100, 1.2], [112, 0], [145, 0]],
    cargo: [{ type: "icecream", count: 4 }],
    meltTime: 26,
    finishX: 120,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.melt" }],
  },
  {
    id: 8,
    name: "level.8",
    world: "desert",
    terrain: [[0, 0], [22, 0], [30, 1.2], [38, 0], ...b8.terrain, [70, 0], [80, 1.4], [90, 0], [130, 0]],
    objects: [b8.object],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 110,
    checkpoints: [],
    hints: [{ x: 30, text: "hint.bridge" }],
    killY: -4,
  },
  {
    id: 9,
    name: "level.9",
    world: "desert",
    terrain: [[0, 0], [20, 0], [32, 3.5], [44, 0], ...bump(50, 1.0), [62, 0], [72, 4.5], [84, 0], ...bump(90, 1.1), [100, 0], [108, 2], [116, 0], [150, 0]],
    cargo: [{ type: "bowling", count: 2 }],
    finishX: 128,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.bowling" }],
  },
  {
    id: 10,
    name: "level.10",
    world: "desert",
    // Exam: melting ice cream, bumps and a bridge.
    terrain: [[0, 0], [16, 0], ...bump(18, 0.7), ...bump(26, 0.9), [36, 0], ...b10.terrain, [62, 0], [72, 2], [82, 0], ...bump(90, 0.8), [110, 0], [140, 0]],
    objects: [b10.object],
    cargo: [{ type: "icecream", count: 4 }],
    meltTime: 30,
    finishX: 120,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.exam" }],
    killY: -4,
  },
  {
    id: 11,
    name: "level.11",
    world: "desert",
    // Easier level: a mud pit in the oasis.
    terrain: [[0, 0], [25, 0], [50, 0], [60, 1], [70, 0], [110, 0]],
    objects: [{ type: "mud", x0: 26, x1: 44 }],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 90,
    checkpoints: [],
    hints: [{ x: 14, text: "hint.mud" }],
  },
  {
    id: 12,
    name: "level.12",
    world: "desert",
    terrain: [[0, 0], [30, 0], [44, 2.2, 0.3], ...pit(44, 49.1, 2.2, 1.4).slice(1), [58, 0], [80, 0], [92, 2], [104, 0], [140, 0]],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 120,
    checkpoints: [62],
    hints: [
      { x: 20, text: "hint.tilt" },
      { x: 62, text: "hint.checkpoint" },
    ],
    killY: -3,
  },
];
