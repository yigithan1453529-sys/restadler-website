import { bridge, bump, lift, pit } from "./shapes";
import type { LevelData } from "./types";

const l19 = lift(30, 35.1, 0, 3);
const l22 = lift(32, 37.1, 0, 3);
const b23 = bridge(40, 48.1);
const b24 = bridge(80, 90.1);
const l24 = lift(105, 110.1, 0, 3);
const l36 = lift(40, 45.1, 0, 3);
const l39 = lift(60, 65.1, 0, 3);
const b39 = bridge(30, 38.1);

export const cityLevels: LevelData[] = [
  {
    id: 31,
    name: "level.31",
    world: "city",
    terrain: [[0, 0], [24, 0], ...l19.terrain, [60, 3], [75, 4.5], [90, 3], [95, 3], ...pit(96, 104, 3, 3), [130, 3]],
    objects: [l19.object, { type: "drawbridge", x0: 96, x1: 104 }],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 110,
    checkpoints: [],
    hints: [
      { x: 14, text: "hint.lift" },
      { x: 84, text: "hint.drawbridge" },
    ],
    killY: -3,
  },
  {
    id: 32,
    name: "level.32",
    world: "city",
    terrain: [[0, 0], [18, 0], ...bump(20, 0.6), ...bump(28, 0.8), [40, 0], [75, 0], [85, 1.5], [95, 0], ...bump(100, 0.7), [115, 0], [140, 0]],
    objects: [{ type: "seesaw", x: 55, length: 10, pivotHeight: 1.1 }],
    cargo: [{ type: "grandpa", count: 1 }],
    finishX: 125,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.grandpa" }],
  },
  {
    id: 33,
    name: "level.33",
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
    id: 34,
    name: "level.34",
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
    id: 35,
    name: "level.35",
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
    id: 36,
    name: "level.36",
    world: "city",
    terrain: [[0, 0], [16, 0], ...bump(18, 0.6), ...bump(26, 0.6), [34, 0], ...l36.terrain, [60, 3], [75, 4.2], [90, 3], [130, 3]],
    objects: [l36.object],
    weather: "rain",
    cargo: [{ type: "icecream", count: 4 }],
    meltTime: 34,
    finishX: 112,
    checkpoints: [],
    hints: [{ x: 28, text: "hint.lift" }],
    killY: -3,
  },
  {
    id: 37,
    name: "level.37",
    world: "city",
    terrain: [[0, 2], [50, 2], [62, 3.8, 0.3], ...pit(62, 66.6, 3.8, 3.0).slice(1), [76, 2.2], [86, 3.2], [96, 2.2], [130, 2.2]],
    objects: [{ type: "seesaw", x: 30, length: 10, pivotHeight: 1.1 }],
    cargo: [{ type: "bowling", count: 2 }],
    finishX: 112,
    checkpoints: [72],
    hints: [{ x: 72, text: "hint.checkpoint" }],
    killY: -1,
  },
  {
    id: 38,
    name: "level.38",
    world: "city",
    // Three rooftop gaps in a row.
    terrain: [
      [0, 2], [20, 2], [30, 3.4, 0.3], ...pit(30, 34.6, 3.4, 2.8).slice(1), [44, 2.4],
      [54, 3.6, 0.3], ...pit(54, 58.6, 3.6, 3.0).slice(1), [68, 2.4],
      [78, 3.6, 0.3], ...pit(78, 82.6, 3.6, 3.0).slice(1), [92, 2.2], [130, 2.2],
    ],
    cargo: [{ type: "crate", count: 3 }],
    finishX: 112,
    checkpoints: [62],
    hints: [{ x: 62, text: "hint.checkpoint" }],
    killY: -1,
  },
  {
    // Exam: grandpa over a bridge and up the lift.
    id: 39,
    name: "level.39",
    world: "city",
    terrain: [[0, 0], [16, 0], ...bump(18, 0.6), [26, 0], ...b39.terrain, [48, 0], ...l39.terrain, [80, 3], ...bump(84, 0.6, 4, 3), [96, 3], [130, 3]],
    objects: [b39.object, l39.object],
    cargo: [{ type: "grandpa", count: 1 }],
    finishX: 112,
    checkpoints: [],
    hints: [{ x: 0, text: "hint.exam" }],
    killY: -3,
  },
  {
    id: 40,
    name: "level.40",
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
