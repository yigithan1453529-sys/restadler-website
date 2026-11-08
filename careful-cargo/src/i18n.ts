// All player-facing texts. English first, German second.

const en = {
  "hud.level": "Level {n}",
  "hint.drive": "Hold ▶ to drive",
  "hint.brake": "◀ to brake",
  "hint.bumps": "Slow down on bumps!",
  "hint.eggs": "Eggs break! Land softly.",
  "hint.steep": "Brake on the way down!",
  "hint.tilt": "In the air: ◀ ▶ to tilt",
  "hint.checkpoint": "Checkpoint!",
  "oops": "Oops!",
  "win.delivered": "{n}/{total} delivered",
  "win.title": "Delivered!",
  "fail.allLost": "All cargo lost!",
  "fail.flipped": "Flipped over!",
  "fail.fell": "Fell off!",
  "btn.next": "Next",
  "btn.retry": "Retry",
  "btn.levels": "Levels",
  "btn.resume": "Resume",
  "pause.title": "Paused",
  "levels.title": "Choose a level",
  "rotate": "Please rotate your device ⟳",
  "level.1": "First Delivery",
  "level.2": "Bumpy Road",
  "level.3": "Careful, Eggs!",
  "level.4": "Steep Hill",
  "level.5": "The Jump",
  "level.6": "Egg Exam",
  "hint.exam": "Exam! Show what you learned.",
} as const;

export type TextKey = keyof typeof en;

const de: Record<TextKey, string> = {
  "hud.level": "Level {n}",
  "hint.drive": "Halte ▶ zum Fahren",
  "hint.brake": "◀ zum Bremsen",
  "hint.bumps": "Langsam über die Wellen!",
  "hint.eggs": "Eier zerbrechen! Sanft landen.",
  "hint.steep": "Bergab bremsen!",
  "hint.tilt": "In der Luft: ◀ ▶ zum Neigen",
  "hint.checkpoint": "Checkpoint!",
  "oops": "Hoppla!",
  "win.delivered": "{n}/{total} geliefert",
  "win.title": "Geliefert!",
  "fail.allLost": "Alles verloren!",
  "fail.flipped": "Umgekippt!",
  "fail.fell": "Abgestürzt!",
  "btn.next": "Weiter",
  "btn.retry": "Nochmal",
  "btn.levels": "Level",
  "btn.resume": "Weiter",
  "pause.title": "Pause",
  "levels.title": "Wähle ein Level",
  "rotate": "Bitte Gerät drehen ⟳",
  "level.1": "Erste Lieferung",
  "level.2": "Holperstrasse",
  "level.3": "Vorsicht, Eier!",
  "level.4": "Steiler Hügel",
  "level.5": "Der Sprung",
  "level.6": "Eier-Prüfung",
  "hint.exam": "Prüfung! Zeig, was du kannst.",
};

const languages: Record<string, Record<TextKey, string>> = { en, de };

function detectLanguage(): string {
  try {
    const lang = (navigator.language || "en").slice(0, 2).toLowerCase();
    return lang in languages ? lang : "en";
  } catch {
    return "en";
  }
}

const current = languages[detectLanguage()];

export function t(key: TextKey, params?: Record<string, string | number>): string {
  let text: string = current[key] ?? en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}

export function isTextKey(key: string): key is TextKey {
  return key in en;
}
