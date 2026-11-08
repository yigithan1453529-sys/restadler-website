import { bridge, bump } from "./shapes";
import type { LevelData } from "./types";

const b16 = bridge(60, 70.1);

export const snowLevels: LevelData[] = [
  {
    id: 13,
    name: "level.13",
    world: "snow",
    // Ice on the uphills: take a run-up.
    terrain: [[0, 0], [20, 0], [35, 2.5], [45, 2.5], [60, 0], [75, 0], [90, 3], [100, 3], [115, 0], [150, 0]],
    objects: [
      { type: "ice", x0: 22, x1: 40 },
      { type: "ice", x0: 78, x1: 96 },
    ],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 130,
    checkpoints: [],
    hints: [{ x: 8, text: "hint.ice" }],
  },
  {
    id: 14,
    name: "level.14",
    world: "snow",
    terrain: [[0, 0], [20, 0], [35, 1.5], [50, 0], [60, 0], ...bump(64, 0.6, 5), ...bump(74, 0.8, 5), [85, 0], [100, 2], [115, 0], [150, 0]],
    cargo: [{ type: "aquarium", count: 1 }],
    finishX: 130,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.aquarium" }],
  },
  {
    id: 15,
    name: "level.15",
    world: "snow",
    // Bumps under a low ceiling: the cake bumps its head when driving fast.
    terrain: [[0, 0], [20, 0], ...bump(23, 0.7, 3.4), [28, 0], ...bump(31, 0.25, 3), ...bump(36, 0.25, 3), ...bump(41, 0.25, 3), [47, 0], [60, 0], [75, 1.5], [90, 0], [130, 0]],
    objects: [{ type: "tunnel", x0: 29, x1: 46, height: 2.25 }],
    cargo: [{ type: "cake", count: 3 }],
    finishX: 110,
    checkpoints: [],
    hints: [{ x: 14, text: "hint.tunnel" }],
  },
  {
    id: 16,
    name: "level.16",
    world: "snow",
    // Exam: aquarium over hills, a bridge, ice and a tunnel.
    terrain: [[0, 0], [18, 0], [30, 2], [40, 2], [52, 0], ...b16.terrain, [80, 0], [90, 2.5], [100, 0], [110, 0], ...bump(115, 0.3, 4), [124, 0], [160, 0]],
    objects: [b16.object, { type: "ice", x0: 82, x1: 96 }, { type: "tunnel", x0: 112, x1: 124, height: 2.4 }],
    cargo: [{ type: "aquarium", count: 1 }],
    finishX: 140,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.exam" }],
    killY: -4,
  },
  {
    id: 17,
    name: "level.17",
    world: "snow",
    // Easier level: seesaws.
    terrain: [[0, 0], [70, 0], [80, 1.2], [90, 0], [120, 0]],
    objects: [
      { type: "seesaw", x: 28, length: 10, pivotHeight: 1.1 },
      { type: "seesaw", x: 52, length: 10, pivotHeight: 1.1 },
    ],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 100,
    checkpoints: [],
    hints: [{ x: 12, text: "hint.seesaw" }],
  },
  {
    id: 18,
    name: "level.18",
    world: "snow",
    // Eggs on icy steps.
    terrain: [
      [0, 4], [20, 4], [26, 4, 0.5], [27.4, 3.2, 0.5], [40, 3.2], [46, 3.2, 0.5], [47.4, 2.4, 0.5],
      [60, 2.4], [70, 1.0], [80, 1.0], [86, 1.0, 0.5], [87.4, 0.2, 0.5], [130, 0.2],
    ],
    objects: [
      { type: "ice", x0: 30, x1: 38 },
      { type: "ice", x0: 62, x1: 72 },
    ],
    cargo: [{ type: "egg", count: 4 }],
    finishX: 115,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.eggs" }],
  },
];
