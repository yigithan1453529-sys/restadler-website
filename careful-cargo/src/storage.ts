// Save game in localStorage. Every access is wrapped in try/catch so the game
// also runs in private/incognito mode or when storage is blocked.

const KEY = "careful-cargo-save-v1";

export interface SaveData {
  unlocked: number; // highest unlocked level id
  stars: Record<number, number>; // best stars per level id
  muted: boolean;
  vehicle: string;
}

function defaults(): SaveData {
  return { unlocked: 1, stars: {}, muted: false, vehicle: "van" };
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

/** Store the result of a finished level. Returns true if it is a new best. */
export function saveLevelResult(levelId: number, stars: number, levelCount: number): boolean {
  const data = loadSave();
  const best = data.stars[levelId] ?? 0;
  const improved = stars > best;
  if (improved) data.stars[levelId] = stars;
  if (stars > 0) data.unlocked = Math.min(levelCount, Math.max(data.unlocked, levelId + 1));
  write();
  return improved;
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
