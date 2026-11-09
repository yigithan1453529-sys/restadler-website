// Statistics, daily gift, daily missions and trophies. Everything is stored
// locally; rewards are coins.

import type { TextKey } from "./i18n";
import { addCoins, loadSave, saveProgress } from "./storage";

export type StatKey =
  | "levelsWon"
  | "threeStars"
  | "cratesDelivered"
  | "eggsDelivered"
  | "cargoDelivered"
  | "coinsPicked"
  | "starsPicked"
  | "nitroUsed"
  | "recordsSet"
  | "purchases"
  | "finalesWon";

// ---------- statistics ----------

export function stat(key: StatKey): number {
  return loadSave().progress.stats[key] ?? 0;
}

/** Adds to statistics; returns trophies that were unlocked by this. */
export function addStats(add: Partial<Record<StatKey, number>>): Trophy[] {
  const p = loadSave().progress;
  for (const [k, v] of Object.entries(add)) if (v) p.stats[k] = (p.stats[k] ?? 0) + v;
  const fresh = checkTrophies();
  saveProgress();
  return fresh;
}

// ---------- dates ----------

function dayString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function today(): string {
  return dayString(new Date());
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayString(d);
}

// ---------- daily gift ----------

/** Coins for the gift on streak day n (1, 2, 3 …): grows for a week. */
export function giftAmount(streakDay: number): number {
  return 30 + 10 * Math.min(streakDay, 7);
}

/** Today's gift if it has not been collected yet. */
export function pendingGift(): { day: number; coins: number } | null {
  const d = loadSave().progress.daily;
  if (d.claimed === today()) return null;
  const day = d.claimed === yesterday() ? d.streak + 1 : 1;
  return { day, coins: giftAmount(day) };
}

export function claimGift(): number {
  const gift = pendingGift();
  if (!gift) return 0;
  const d = loadSave().progress.daily;
  d.streak = gift.day;
  d.claimed = today();
  addCoins(gift.coins);
  saveProgress();
  return gift.coins;
}

// ---------- daily missions ----------

export interface MissionDef {
  id: string;
  stat: StatKey;
  target: number;
  text: TextKey;
}

const MISSION_POOL: MissionDef[] = [
  { id: "win3", stat: "levelsWon", target: 3, text: "mission.win" },
  { id: "stars2", stat: "threeStars", target: 2, text: "mission.threeStars" },
  { id: "eggs", stat: "eggsDelivered", target: 8, text: "mission.eggs" },
  { id: "crates", stat: "cratesDelivered", target: 12, text: "mission.crates" },
  { id: "coins", stat: "coinsPicked", target: 40, text: "mission.coins" },
  { id: "nitro", stat: "nitroUsed", target: 5, text: "mission.nitro" },
  { id: "bonus", stat: "starsPicked", target: 1, text: "mission.bonusStar" },
  { id: "records", stat: "recordsSet", target: 2, text: "mission.records" },
];

export const MISSION_REWARD = 40;

export interface Mission extends MissionDef {
  progress: number;
  claimed: boolean;
}

/** Three missions per day, chosen from the date so they stay the same all day. */
export function missions(): Mission[] {
  const p = loadSave().progress;
  if (p.missions.date !== today()) {
    let seed = Number(today().replace(/-/g, ""));
    const pool = [...MISSION_POOL];
    const chosen: { id: string; base: number; claimed: boolean }[] = [];
    for (let i = 0; i < 3; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const def = pool.splice(seed % pool.length, 1)[0];
      chosen.push({ id: def.id, base: stat(def.stat), claimed: false });
    }
    p.missions = { date: today(), list: chosen };
    saveProgress();
  }
  return p.missions.list.map((m) => {
    const def = MISSION_POOL.find((d) => d.id === m.id) ?? MISSION_POOL[0];
    return { ...def, progress: Math.min(def.target, stat(def.stat) - m.base), claimed: m.claimed };
  });
}

/** Number of finished missions whose reward was not collected yet. */
export function claimableMissions(): number {
  return missions().filter((m) => m.progress >= m.target && !m.claimed).length;
}

export function claimMission(id: string): boolean {
  const m = missions().find((x) => x.id === id);
  if (!m || m.claimed || m.progress < m.target) return false;
  const entry = loadSave().progress.missions.list.find((x) => x.id === id);
  if (entry) entry.claimed = true;
  addCoins(MISSION_REWARD);
  saveProgress();
  return true;
}

// ---------- trophies ----------

export interface Trophy {
  id: string;
  name: TextKey;
  stat: StatKey;
  target: number;
}

export const TROPHY_REWARD = 50;

export const TROPHIES: Trophy[] = [
  { id: "first", name: "trophy.first", stat: "levelsWon", target: 1 },
  { id: "win25", name: "trophy.win25", stat: "levelsWon", target: 25 },
  { id: "stars10", name: "trophy.stars10", stat: "threeStars", target: 10 },
  { id: "crates100", name: "trophy.crates100", stat: "cratesDelivered", target: 100 },
  { id: "eggs50", name: "trophy.eggs50", stat: "eggsDelivered", target: 50 },
  { id: "cargo300", name: "trophy.cargo300", stat: "cargoDelivered", target: 300 },
  { id: "coins500", name: "trophy.coins500", stat: "coinsPicked", target: 500 },
  { id: "bonus5", name: "trophy.bonus5", stat: "starsPicked", target: 5 },
  { id: "nitro50", name: "trophy.nitro50", stat: "nitroUsed", target: 50 },
  { id: "records10", name: "trophy.records10", stat: "recordsSet", target: 10 },
  { id: "shopper", name: "trophy.shopper", stat: "purchases", target: 1 },
  { id: "islands", name: "trophy.islands", stat: "finalesWon", target: 4 },
];

export function trophyUnlocked(id: string): boolean {
  return loadSave().progress.trophies.includes(id);
}

/** Unlocks trophies that reached their target (pays the reward once). */
function checkTrophies(): Trophy[] {
  const p = loadSave().progress;
  const fresh: Trophy[] = [];
  for (const tr of TROPHIES) {
    if (p.trophies.includes(tr.id)) continue;
    if ((p.stats[tr.stat] ?? 0) >= tr.target) {
      p.trophies.push(tr.id);
      addCoins(TROPHY_REWARD);
      fresh.push(tr);
    }
  }
  return fresh;
}
