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
  "melted": "Melted!",
  "spilled": "Splash!",
  "whoa": "Whoa!",
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
  "level.7": "Ice Cream Rush",
  "level.8": "Wobbly Bridge",
  "level.9": "Heavy Ball",
  "level.10": "Desert Exam",
  "level.11": "Oasis",
  "level.12": "Dune Jump",
  "level.13": "Slippery Slope",
  "level.14": "Fish Tank",
  "level.15": "Low Tunnel",
  "level.16": "Snow Exam",
  "level.17": "Seesaw",
  "level.18": "Frozen Steps",
  "level.19": "Night Lift",
  "level.20": "Grandpa's Ride",
  "level.21": "Rooftops",
  "level.22": "City Exam",
  "level.23": "Easy Street",
  "level.24": "Grand Finale",
  "hint.melt": "Ice cream melts! Don't dawdle.",
  "hint.bridge": "Wobbly bridge! Go slowly.",
  "hint.bowling": "Heavy balls roll around!",
  "hint.mud": "Mud slows you down. Keep going!",
  "hint.ice": "Ice! Take a run-up for the hill.",
  "hint.aquarium": "Don't spill the water!",
  "hint.tunnel": "Low tunnel! Tall cargo bumps its head.",
  "hint.seesaw": "Seesaw! Slow down at the top.",
  "hint.lift": "Wait for the green light!",
  "hint.grandpa": "Grandpa wants a smooth ride!",
  "hint.finale": "The big finale. Good luck!",
  "vehicle.van": "Van",
  "vehicle.tractor": "Tractor",
  "vehicle.pickup": "Pickup",
  "vehicles.title": "Vehicle",
  "unlock.vehicle": "New vehicle: {name}!",
  "world.meadow": "Meadow",
  "world.desert": "Desert",
  "world.snow": "Snow",
  "world.city": "City at Night",
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
  "melted": "Geschmolzen!",
  "spilled": "Platsch!",
  "whoa": "Huch!",
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
  "level.7": "Glace-Eile",
  "level.8": "Wackelbrücke",
  "level.9": "Schwere Kugel",
  "level.10": "Wüsten-Prüfung",
  "level.11": "Oase",
  "level.12": "Dünensprung",
  "level.13": "Rutschpartie",
  "level.14": "Aquarium",
  "level.15": "Niedriger Tunnel",
  "level.16": "Schnee-Prüfung",
  "level.17": "Wippe",
  "level.18": "Eisige Stufen",
  "level.19": "Nacht-Lift",
  "level.20": "Opas Ausfahrt",
  "level.21": "Über die Dächer",
  "level.22": "Stadt-Prüfung",
  "level.23": "Gemütliche Strasse",
  "level.24": "Das grosse Finale",
  "hint.melt": "Glace schmilzt! Nicht trödeln.",
  "hint.bridge": "Wackelbrücke! Langsam fahren.",
  "hint.bowling": "Schwere Kugeln rollen herum!",
  "hint.mud": "Schlamm bremst. Weiterfahren!",
  "hint.ice": "Eis! Nimm Anlauf für den Hügel.",
  "hint.aquarium": "Nichts verschütten!",
  "hint.tunnel": "Niedriger Tunnel! Hohe Ladung stösst an.",
  "hint.seesaw": "Wippe! Oben langsam machen.",
  "hint.lift": "Warte auf das grüne Licht!",
  "hint.grandpa": "Opa will sanft fahren!",
  "hint.finale": "Das grosse Finale. Viel Glück!",
  "vehicle.van": "Lieferwagen",
  "vehicle.tractor": "Traktor",
  "vehicle.pickup": "Pickup",
  "vehicles.title": "Fahrzeug",
  "unlock.vehicle": "Neues Fahrzeug: {name}!",
  "world.meadow": "Wiese",
  "world.desert": "Wüste",
  "world.snow": "Schnee",
  "world.city": "Stadt bei Nacht",
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
