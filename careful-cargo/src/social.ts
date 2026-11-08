// Player names, records and friend challenges shared by link.
// No server: a challenge link carries the sender's name and records.

import { LANG, t } from "./i18n";
import { poki } from "./platform/poki";
import { cleanRecords, loadSave, saveFriend, saveName, type LevelRecord } from "./storage";

const ADJECTIVES: Record<string, string[]> = {
  en: ["Speedy", "Careful", "Happy", "Brave", "Sunny", "Lucky", "Clever", "Jolly", "Mighty", "Gentle", "Bouncy", "Cozy"],
  de: ["Flinke", "Vorsichtige", "Fröhliche", "Mutige", "Sonnige", "Glückliche", "Schlaue", "Lustige", "Starke", "Sanfte", "Hüpfende", "Gemütliche"],
};
const ANIMALS: Record<string, string[]> = {
  en: ["Duck", "Owl", "Cat", "Mouse", "Bee", "Seal", "Giraffe", "Turtle", "Cow", "Goat", "Snail", "Seagull"],
  de: ["Ente", "Eule", "Katze", "Maus", "Biene", "Robbe", "Giraffe", "Schildkröte", "Kuh", "Ziege", "Schnecke", "Möwe"],
};

/** A name key like "3-7-42" (adjective, animal, number); shown in the player's language. */
export function randomNameKey(): string {
  const a = Math.floor(Math.random() * 12);
  const n = Math.floor(Math.random() * 12);
  const num = 10 + Math.floor(Math.random() * 90);
  return `${a}-${n}-${num}`;
}

export function isNameKey(key: string): boolean {
  return /^(\d|1[01])-(\d|1[01])-\d{2}$/.test(key);
}

export function displayName(key: string): string {
  if (!isNameKey(key)) return "?";
  const [a, n, num] = key.split("-").map(Number);
  const adj = (ADJECTIVES[LANG] ?? ADJECTIVES.en)[a];
  const animal = (ANIMALS[LANG] ?? ANIMALS.en)[n];
  return `${adj} ${animal} ${num}`;
}

/** The player's own name key (created on first use). */
export function myName(): string {
  const save = loadSave();
  if (!isNameKey(save.name)) saveName(randomNameKey());
  return loadSave().name;
}

export function rerollName(): void {
  saveName(randomNameKey());
}

// ---------- challenge links ----------

interface Payload {
  n: string;
  r: Record<string, [number, number]>;
}

function encode(p: Payload): string {
  const json = JSON.stringify(p);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(code: string): Payload | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const p = JSON.parse(json) as Payload;
    if (!p || typeof p.n !== "string" || !isNameKey(p.n) || typeof p.r !== "object") return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Reads a challenge from the link the game was opened with and stores the
 * sender as a friend. Returns the friend's name key, or null.
 */
export function receiveChallenge(): string | null {
  const code = poki.getURLParam("cc");
  if (!code) return null;
  const p = decode(code);
  if (!p || p.n === myName()) return null;
  const records: Record<string, { s: number; t: number }> = {};
  for (const [id, v] of Object.entries(p.r)) if (Array.isArray(v)) records[id] = { s: v[0], t: v[1] };
  saveFriend(p.n, cleanRecords(records));
  return p.n;
}

async function challengeLink(): Promise<string> {
  const r: Record<string, [number, number]> = {};
  for (const [id, rec] of Object.entries(loadSave().records)) r[id] = [rec.s, rec.t];
  return poki.shareableURL({ cc: encode({ n: myName(), r }) });
}

/**
 * Shares a challenge link: the phone's share menu if there is one, otherwise
 * the clipboard, otherwise a box with the link to copy by hand.
 * Returns a short message for the player.
 */
export async function inviteFriend(): Promise<string> {
  const url = await challengeLink();
  const text = t("invite.text", { name: displayName(myName()) });
  try {
    if (navigator.share) {
      await navigator.share({ title: t("title"), text, url });
      return t("invite.shared");
    }
  } catch {
    /* cancelled or not allowed: try the clipboard */
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return t("invite.copied");
  } catch {
    showLinkBox(url);
    return t("invite.copyHint");
  }
}

/** Fallback: an HTML box with the link selected, ready to copy. */
function showLinkBox(url: string): void {
  document.getElementById("invite-box")?.remove();
  const box = document.createElement("div");
  box.id = "invite-box";
  box.style.cssText =
    "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10;background:#fff;border:3px solid #2d2d2d;" +
    "border-radius:20px;padding:16px;width:min(90vw,520px);font:600 16px 'Trebuchet MS',system-ui,sans-serif;color:#2d2d2d;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:10px";
  const label = document.createElement("div");
  label.textContent = t("invite.copyHint");
  const input = document.createElement("input");
  input.value = url;
  input.readOnly = true;
  input.style.cssText = "width:100%;box-sizing:border-box;padding:10px;border:2px solid #2d2d2d;border-radius:12px;font:14px monospace";
  const close = document.createElement("button");
  close.textContent = "OK";
  close.style.cssText = "align-self:flex-end;padding:8px 22px;border:3px solid #2d2d2d;border-radius:14px;background:#ffd23f;font:800 16px system-ui;cursor:pointer";
  close.onclick = () => box.remove();
  box.append(label, input, close);
  document.body.append(box);
  input.focus();
  input.select();
}

// ---------- ranking ----------

export interface RankRow {
  key: string;
  name: string;
  me: boolean;
  stars: number;
  levels: number;
  time: number;
}

function summarize(key: string, records: Record<number, LevelRecord>, me: boolean): RankRow {
  let stars = 0;
  let time = 0;
  let levels = 0;
  for (const r of Object.values(records)) {
    stars += r.s;
    time += r.t;
    levels++;
  }
  return { key, name: displayName(key), me, stars, levels, time: Math.round(time * 10) / 10 };
}

/** Me and my friends: most stars first, then most levels, then the fastest total time. */
export function friendRanking(): RankRow[] {
  const save = loadSave();
  const rows = [summarize(myName(), save.records, true)];
  for (const [key, f] of Object.entries(save.friends)) rows.push(summarize(key, f.records, false));
  rows.sort((a, b) => b.stars - a.stars || b.levels - a.levels || a.time - b.time);
  return rows;
}

/** The best friend result for one level (for the "beat your friend" line). */
export function bestFriendRecord(levelId: number): { name: string; rec: LevelRecord } | null {
  let best: { name: string; rec: LevelRecord } | null = null;
  for (const [key, f] of Object.entries(loadSave().friends)) {
    const rec = f.records[levelId];
    if (!rec) continue;
    if (!best || rec.s > best.rec.s || (rec.s === best.rec.s && rec.t < best.rec.t)) best = { name: displayName(key), rec };
  }
  return best;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return m > 0 ? `${m}:${s.toFixed(1).padStart(4, "0")}` : `${s.toFixed(1)} s`;
}
