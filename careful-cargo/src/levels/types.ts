import type { TextKey } from "../i18n";

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
  terrain: TerrainPoint[];
  cargo: { type: CargoType; count: number }[];
  finishX: number;
  checkpoints: number[];
  hints: { x: number; text: TextKey }[];
  /** Vehicle below this height = "Fell off!". Defaults to lowest terrain point - 6. */
  killY?: number;
}
