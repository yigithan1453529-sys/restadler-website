import type { TextKey } from "../i18n";
import type { WorldId } from "../game/themes";

export type CargoType = "crate" | "egg" | "cake" | "icecream" | "aquarium" | "bowling" | "grandpa" | "gift";

/**
 * Terrain control point in meters, y points up.
 * Optional third value: how much the corner is rounded (meters cut away on
 * each side). Small values (e.g. 0.1) give sharp edges like steps or cliffs.
 */
export type TerrainPoint = [x: number, y: number, round?: number];

export interface LevelData {
  id: number;
  name: TextKey;
  /** Look of the level. Defaults to "meadow". */
  world?: WorldId;
  terrain: TerrainPoint[];
  /** perRow: optional max pieces per row on the bed (e.g. 2 makes a 2 + 2 stack). */
  cargo: { type: CargoType; count: number; perRow?: number }[];
  finishX: number;
  checkpoints: number[];
  hints: { x: number; text: TextKey }[];
  objects?: LevelObject[];
  /** Rain makes the road slippery; wind pushes the cargo backwards. */
  weather?: "rain" | "wind";
  /** Ice cream: seconds of driving until the first scoop melts (default 40). */
  meltTime?: number;
  /** Vehicle below this height = "Fell off!". Defaults to lowest terrain point - 6. */
  killY?: number;
}

/** Obstacles placed in a level (all values in meters). */
export type LevelObject =
  /** Wobbly plank bridge from x0 to x1 (put a pit below it in the terrain). */
  | { type: "bridge"; x0: number; x1: number }
  /** Low ceiling: tall cargo bumps into it. height = free space above the ground. */
  | { type: "tunnel"; x0: number; x1: number; height: number }
  /** Slippery (ice) or slow and slippery (mud) ground. */
  | { type: "ice" | "mud"; x0: number; x1: number }
  /** Plank on a pivot; starts with the left end on the ground. */
  | { type: "seesaw"; x: number; length: number; pivotHeight: number }
  /** Platform in a pit that moves between `bottom` and `top` (terrain heights). */
  | { type: "lift"; x0: number; x1: number; bottom: number; top: number }
  /** Barrels that roll down a hill towards the van, one every `every` seconds. */
  | { type: "barrels"; x: number; every: number }
  /** A bridge over a pit that lifts up and comes down again (hinge at x0). */
  | { type: "drawbridge"; x0: number; x1: number };
