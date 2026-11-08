// Save game in localStorage. Every access is wrapped in try/catch so the game
// also runs in private/incognito mode or when storage is blocked.

const KEY = "careful-cargo-save-v1";

/** Save format version. 2 = four islands with 10 levels each (ids 1–40). */
const SAVE_VERSION = 2;

/**
 * Level ids before version 2 (four worlds with 6 levels each) mapped to the
 * island ids. Levels 1–6 stay, desert 7–12 → 11–16, snow 13–18 → 21–26,
 * city 19–23 → 31–35 and the old finale 24 → 40.
 */
export function migrateLevelId(old: number): number {
  if (old <= 6) return old;
  if (old <= 12) return old + 4;
  if (old <= 18) return old + 8;
  if (old <= 23) return old + 12;
  return 40;
}

function migrateKeys<T>(rec: Record<number, T>): Record<number, T> {
  const out: Record<number, T> = {};
  for (const [id, v] of Object.entries(rec)) out[migrateLevelId(Number(id))] = v;
  return out;
}

export interface SaveData {
  unlocked: number; // highest unlocked level id
  stars: Record<number, number>; // best stars per level id
  muted: boolean;
  vehicle: string; // chosen vehicle
  coins: number;
  owned: string[]; // bought vehicles
  paints: string[]; // bought paint colors
  paint: Record<string, string>; // chosen paint per vehicle
  name: string; // random player name key, see social.ts
  records: Record<number, LevelRecord>; // best result per level
  friends: Record<string, FriendData>; // keyed by the friend's name key
  v: number; // save format version
}

export interface LevelRecord {
  s: number; // stars
  t: number; // time in seconds (one decimal)
}

export interface FriendData {
  records: Record<number, LevelRecord>;
  at: number; // when the challenge was received (ms)
}

function defaults(): SaveData {
  return {
    unlocked: 1,
    stars: {},
    muted: false,
    vehicle: "van",
    coins: 0,
    owned: ["van"],
    paints: ["original"],
    paint: {},
    name: "",
    records: {},
    friends: {},
    v: SAVE_VERSION,
  };
}

/** Vehicles that older saves unlocked with stars stay unlocked. */
const OLD_STAR_UNLOCKS: [string, number][] = [
  ["tractor", 15],
  ["pickup", 35],
];

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function cleanRecords(raw: unknown): Record<number, LevelRecord> {
  const out: Record<number, LevelRecord> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, r] of Object.entries(raw as Record<string, unknown>)) {
    const rec = r as Partial<LevelRecord> | null;
    const s = Number(rec?.s);
    const t = Number(rec?.t);
    if (Number.isFinite(s) && Number.isFinite(t) && s >= 1 && s <= 3 && t > 0 && t < 3600 && Number(id) > 0) {
      out[Number(id)] = { s: Math.round(s), t: Math.round(t * 10) / 10 };
    }
  }
  return out;
}

let cache: SaveData | null = null;

export function loadSave(): SaveData {
  if (cache) return cache;
  const data = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (typeof parsed.unlocked === "number") data.unlocked = Math.max(1, Math.floor(parsed.unlocked));
      if (parsed.stars && typeof parsed.stars === "object") {
        for (const [id, s] of Object.entries(parsed.stars)) {
          if (typeof s === "number") data.stars[Number(id)] = Math.max(0, Math.min(3, Math.floor(s)));
        }
      }
      if (typeof parsed.muted === "boolean") data.muted = parsed.muted;
      if (typeof parsed.vehicle === "string") data.vehicle = parsed.vehicle;
      if (typeof parsed.coins === "number" && parsed.coins >= 0) data.coins = Math.floor(parsed.coins);
      if (Array.isArray(parsed.owned)) {
        data.owned = Array.from(new Set(["van", ...strings(parsed.owned)]));
      } else {
        const total = Object.values(data.stars).reduce((a, b) => a + b, 0);
        for (const [id, need] of OLD_STAR_UNLOCKS) if (total >= need) data.owned.push(id);
      }
      if (Array.isArray(parsed.paints)) data.paints = Array.from(new Set(["original", ...strings(parsed.paints)]));
      if (parsed.paint && typeof parsed.paint === "object") {
        for (const [v, p] of Object.entries(parsed.paint)) if (typeof p === "string") data.paint[v] = p;
      }
      if (!data.owned.includes(data.vehicle)) data.vehicle = "van";
      const oldIds = parsed.v !== SAVE_VERSION;
      if (typeof parsed.name === "string") data.name = parsed.name;
      data.records = cleanRecords(parsed.records);
      if (parsed.friends && typeof parsed.friends === "object") {
        for (const [k, f] of Object.entries(parsed.friends)) {
          if (f && typeof f === "object") data.friends[k] = { records: cleanRecords((f as FriendData).records), at: Number((f as FriendData).at) || 0 };
        }
      }
      if (oldIds) {
        // Older save from before the islands: move everything to the new level ids.
        data.stars = migrateKeys(data.stars);
        data.records = migrateKeys(data.records);
        for (const f of Object.values(data.friends)) f.records = migrateKeys(f.records);
        data.unlocked = migrateLevelId(data.unlocked);
        cache = data;
        write();
      }
    }
  } catch {
    // Storage not available: play without saving.
  }
  cache = data;
  return data;
}

function write(): void {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Ignore: storage full or blocked.
  }
}

/** Store the result of a finished level. */
export function saveLevelResult(levelId: number, stars: number, levelCount: number): { improved: boolean; firstClear: boolean } {
  const data = loadSave();
  const best = data.stars[levelId] ?? 0;
  const firstClear = best === 0 && stars > 0;
  const improved = stars > best;
  if (improved) data.stars[levelId] = stars;
  if (stars > 0) data.unlocked = Math.min(levelCount, Math.max(data.unlocked, levelId + 1));
  write();
  return { improved, firstClear };
}

export function saveMuted(muted: boolean): void {
  loadSave().muted = muted;
  write();
}

export function saveVehicle(id: string): void {
  loadSave().vehicle = id;
  write();
}

/** Sum of the best stars of all levels. */
export function totalStars(): number {
  return Object.values(loadSave().stars).reduce((a, b) => a + b, 0);
}

export function addCoins(amount: number): void {
  loadSave().coins += Math.max(0, Math.floor(amount));
  write();
}

/** Pays if there are enough coins. Returns true if the purchase worked. */
export function spendCoins(amount: number): boolean {
  const data = loadSave();
  if (data.coins < amount) return false;
  data.coins -= amount;
  write();
  return true;
}

export function addOwnedVehicle(id: string): void {
  const data = loadSave();
  if (!data.owned.includes(id)) data.owned.push(id);
  write();
}

export function addOwnedPaint(id: string): void {
  const data = loadSave();
  if (!data.paints.includes(id)) data.paints.push(id);
  write();
}

export function savePaint(vehicle: string, paint: string): void {
  loadSave().paint[vehicle] = paint;
  write();
}

/** Keeps the better result: more stars, or the same stars in less time. Returns true if it is a new record. */
export function saveRecord(levelId: number, stars: number, time: number): boolean {
  if (stars < 1) return false;
  const data = loadSave();
  const old = data.records[levelId];
  const t = Math.round(time * 10) / 10;
  if (old && (old.s > stars || (old.s === stars && old.t <= t))) return false;
  data.records[levelId] = { s: stars, t };
  write();
  return true;
}

export function saveName(name: string): void {
  loadSave().name = name;
  write();
}

export function saveFriend(name: string, records: Record<number, LevelRecord>): void {
  loadSave().friends[name] = { records, at: Date.now() };
  write();
}

export function removeFriend(name: string): void {
  delete loadSave().friends[name];
  write();
}

/** A level skipped with a rewarded ad: the next level unlocks, no stars or coins. */
export function skipLevelSave(levelId: number, levelCount: number): void {
  const data = loadSave();
  data.unlocked = Math.min(levelCount, Math.max(data.unlocked, levelId + 1));
  write();
}
