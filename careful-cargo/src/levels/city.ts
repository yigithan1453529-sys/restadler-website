import { bridge, bump, lift, pit } from "./shapes";
import type { LevelData } from "./types";

const l19 = lift(30, 35.1, 0, 3);
const l22 = lift(32, 37.1, 0, 3);
const b23 = bridge(40, 48.1);
const b24 = bridge(80, 90.1);
const l24 = lift(105, 110.1, 0, 3);

export const cityLevels: LevelData[] = [
  {
    id: 19,
    name: "level.19",
    world: "city",
    terrain: [[0, 0], [24, 0], ...l19.terrain, [60, 3], [75, 4.5], [90, 3], [130, 3]],
    objects: [l19.object],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 110,
    checkpoints: [],
    hints: [{ x: 14, text: "hint.lift" }],
    killY: -3,
  },
  {
    id: 20,
    name: "level.20",
    world: "city",
    terrain: [[0, 0], [18, 0], ...bump(20, 0.6), ...bump(28, 0.8), [40, 0], [75, 0], [85, 1.5], [95, 0], ...bump(100, 0.7), [115, 0], [140, 0]],
    objects: [{ type: "seesaw", x: 55, length: 10, pivotHeight: 1.1 }],
    cargo: [{ type: "grandpa", count: 1 }],
    finishX: 125,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.grandpa" }],
  },
  {
    id: 21,
    name: "level.21",
    world: "city",
    // Jumping between rooftops.
    terrain: [
      [0, 2], [25, 2], [37, 3.8, 0.3], ...pit(37, 42.1, 3.8, 3.0).slice(1), [50, 2.2], [60, 2.2],
      [70, 3.6, 0.3], ...pit(70, 74.6, 3.6, 2.8).slice(1), [84, 2], [130, 2],
    ],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 110,
    checkpoints: [50],
    hints: [
      { x: 14, text: "hint.tilt" },
      { x: 50, text: "hint.checkpoint" },
    ],
    killY: -1,
  },
  {
    id: 22,
    name: "level.22",
    world: "city",
    // Exam: grandpa on bumps, the lift and a tunnel.
    terrain: [[0, 0], [16, 0], ...bump(18, 0.6), [26, 0], ...l22.terrain, [50, 3], [66, 3], ...bump(72, 0.7, 5, 3), [85, 3], [95, 1], [140, 1]],
    objects: [l22.object, { type: "tunnel", x0: 52, x1: 64, height: 2.5 }],
    cargo: [{ type: "grandpa", count: 1 }],
    finishX: 120,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.exam" }],
    killY: -3,
  },
  {
    id: 23,
    name: "level.23",
    world: "city",
    // Easier level: ice cream at night (a little cooler).
    terrain: [[0, 0], [30, 0], ...b23.terrain, [60, 0], [75, 1.2], [90, 0], [120, 0]],
    objects: [b23.object],
    cargo: [{ type: "icecream", count: 4 }],
    meltTime: 40,
    finishX: 100,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.melt" }],
    killY: -4,
  },
  {
    id: 24,
    name: "level.24",
    world: "city",
    // Finale: the aquarium through mud, a seesaw, a bridge and the lift.
    terrain: [[0, 0], [30, 0], [40, 1.5], [50, 0], [74, 0], ...b24.terrain, [99, 0], ...l24.terrain, [125, 3], ...bump(128, 0.5, 5, 3), [140, 3], [180, 3]],
    objects: [
      { type: "mud", x0: 16, x1: 28 },
      { type: "seesaw", x: 62, length: 10, pivotHeight: 1.1 },
      b24.object,
      l24.object,
    ],
    cargo: [{ type: "aquarium", count: 1 }],
    finishX: 160,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.finale" }],
    killY: -3,
  },
];
