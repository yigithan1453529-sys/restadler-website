import type { TextKey } from "../i18n";
import type { WorldId } from "../game/themes";

export type CargoType = "crate" | "egg" | "cake";

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
  /** Vehicle below this height = "Fell off!". Defaults to lowest terrain point - 6. */
  killY?: number;
}
