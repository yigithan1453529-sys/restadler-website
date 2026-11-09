import { bridge, bump, pit } from "./shapes";
import type { LevelData } from "./types";

const b8 = bridge(45, 55.1);
const b10 = bridge(44, 52.1);
const b19 = bridge(34, 43.1);
const b20 = bridge(66, 74.1);

export const desertLevels: LevelData[] = [
  {
    id: 11,
    name: "level.11",
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
    id: 12,
    name: "level.12",
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
    id: 13,
    name: "level.13",
    world: "desert",
    terrain: [[0, 0], [20, 0], [32, 3.5], [44, 0], ...bump(50, 1.0), [62, 0], [72, 4.5], [84, 0], ...bump(90, 1.1), [100, 0], [108, 2], [116, 0], [150, 0]],
    cargo: [{ type: "bowling", count: 2 }],
    finishX: 128,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.bowling" }],
  },
  {
    id: 14,
    name: "level.14",
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
    id: 15,
    name: "level.15",
    world: "desert",
    // Easier level: a mud pit in the oasis.
    terrain: [[0, 0], [25, 0], [50, 0], [60, 1], [70, 0], [110, 0]],
    objects: [{ type: "mud", x0: 26, x1: 44 }],
    cargo: [{ type: "gift", count: 3 }],
    finishX: 90,
    checkpoints: [],
    hints: [{ x: 14, text: "hint.mud" }],
  },
  {
    id: 16,
    name: "level.16",
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
  {
    id: 17,
    name: "level.17",
    world: "desert",
    terrain: [[0, 0], [16, 0], [26, 1.6], [36, 0], [46, 2.2], [56, 0], [66, 1.4], [76, 0], ...bump(82, 0.9), [94, 0], [104, 2.4], [114, 0], [145, 0]],
    weather: "wind",
    cargo: [{ type: "bowling", count: 2 }],
    finishX: 126,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.wind" }],
  },
  {
    id: 18,
    name: "level.18",
    world: "desert",
    terrain: [[0, 0], [18, 0], [34, 3.5], [46, 3.5], [60, 0], [74, 4], [86, 4], [100, 0], [140, 0]],
    cargo: [{ type: "icecream", count: 4 }],
    meltTime: 26,
    finishX: 120,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.melt" }],
  },
  {
    // Exam: a bridge and a jump over a canyon.
    id: 19,
    name: "level.19",
    world: "desert",
    terrain: [
      [0, 0], [16, 0], ...bump(18, 0.8), [28, 0], ...b19.terrain, [52, 0],
      [64, 2.4, 0.3], ...pit(64, 69.5, 2.4, 1.5).slice(1), [78, 0], [90, 0], ...bump(94, 1.0), [106, 0], [140, 0],
    ],
    objects: [b19.object],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 122,
    checkpoints: [74],
    hints: [
      { x: 0, text: "hint.exam" },
      { x: 74, text: "hint.checkpoint" },
    ],
    killY: -3.5,
  },
  {
    // Island finale: eggs through mud, over the bridge and the dunes.
    id: 20,
    name: "level.20",
    world: "desert",
    terrain: [[0, 0], [20, 0], [30, 1.2], [40, 0], [62, 0], ...b20.terrain, [84, 0], [94, 1.5], [104, 0], ...bump(110, 0.5, 5), [122, 0], [160, 0]],
    objects: [{ type: "mud", x0: 44, x1: 60 }, b20.object],
    cargo: [{ type: "egg", count: 3 }],
    finishX: 140,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.finale" }],
    killY: -4,
  },
];
