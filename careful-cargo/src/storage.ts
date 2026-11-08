// Save game in localStorage. Every access is wrapped in try/catch so the game
// also runs in private/incognito mode or when storage is blocked.

const KEY = "careful-cargo-save-v1";

export interface SaveData {
  unlocked: number; // highest unlocked level id
  stars: Record<number, number>; // best stars per level id
  muted: boolean;
  vehicle: string; // chosen vehicle
  coins: number;
  owned: string[]; // bought vehicles
  paints: string[]; // bought paint colors
  paint: Record<string, string>; // chosen paint per vehicle
}

function defaults(): SaveData {
  return { unlocked: 1, stars: {}, muted: false, vehicle: "van", coins: 0, owned: ["van"], paints: ["original"], paint: {} };
}

/** Vehicles that older saves unlocked with stars stay unlocked. */
const OLD_STAR_UNLOCKS: [string, number][] = [
  ["tractor", 15],
  ["pickup", 35],
];

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

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
