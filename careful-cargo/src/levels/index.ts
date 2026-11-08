import { level01 } from "./level01";
import { level02 } from "./level02";
import { level03 } from "./level03";
import { level04 } from "./level04";
import { level05 } from "./level05";
import { level06 } from "./level06";
import type { LevelData } from "./types";

export const levels: LevelData[] = [level01, level02, level03, level04, level05, level06];

export function getLevel(id: number): LevelData {
  return levels.find((l) => l.id === id) ?? levels[0];
}
