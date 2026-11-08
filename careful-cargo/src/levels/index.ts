import { level01 } from "./level01";
import { level02 } from "./level02";
import { level03 } from "./level03";
import { level04 } from "./level04";
import { level05 } from "./level05";
import { level06 } from "./level06";
import { desertLevels } from "./desert";
import { snowLevels } from "./snow";
import { cityLevels } from "./city";
import type { WorldId } from "../game/themes";
import type { LevelData } from "./types";

export const levels: LevelData[] = [level01, level02, level03, level04, level05, level06, ...desertLevels, ...snowLevels, ...cityLevels];

export function getLevel(id: number): LevelData {
  return levels.find((l) => l.id === id) ?? levels[0];
}

/** Levels grouped by world, in level order (one level-select page per world). */
export function worldPages(): { world: WorldId; levels: LevelData[] }[] {
  const pages: { world: WorldId; levels: LevelData[] }[] = [];
  for (const level of levels) {
    const world = level.world ?? "meadow";
    const last = pages[pages.length - 1];
    if (last && last.world === world) last.levels.push(level);
    else pages.push({ world, levels: [level] });
  }
  return pages;
}
