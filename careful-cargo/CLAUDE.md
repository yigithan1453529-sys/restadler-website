# Careful Cargo – Projektanleitung für Claude Code

Careful Cargo ist ein HTML5-Webspiel für die Plattform **Poki** (Desktop + Handy).
Ein kleiner Lieferwagen fährt über hügelige Strecken; die Ladung liegt lose auf der
Ladefläche und kann herunterfallen oder zerbrechen. Das vollständige Spielkonzept
steht in `docs/GDD.md` – vor jeder grösseren Arbeit lesen.

## Zusammenarbeit

- Antworte auf **Deutsch**, in einfacher Sprache. Der Projektinhaber ist kein
  Profi-Programmierer.
- Arbeite in **kleinen Schritten**. Nach jedem Schritt muss das Spiel lauffähig sein.
- Sag nach jeder Änderung in 1–3 Sätzen, **was** sich geändert hat und **wie man es
  testet** (welcher Befehl, was man im Browser sehen sollte).
- Code, Dateinamen und Kommentare im Code auf Englisch; Texte für Spieler kommen
  aus `src/i18n.ts` (zuerst Englisch, Deutsch als zweite Sprache).
- Frag nach, bevor du Spielregeln aus `docs/GDD.md` änderst. Technische Details
  darfst du selbst entscheiden.

## Tech-Stack (fest)

- **Vite + TypeScript** (`strict: true`), keine Game-Engine.
- **Physik:** `planck` (Box2D-Port, npm-Paket `planck`). Fahrzeug mit `WheelJoint`
  (Motor + Federung). Einheiten in Metern; feste Physik-Schrittweite 1/60 s mit
  Accumulator, unabhängig von der Bildrate.
- **Grafik:** Canvas 2D, alles **im Code gezeichnet** (flache Vektor-Formen, helle
  Farben). Keine Bilddateien im Prototyp → einheitlicher Stil, winzige Dateigrösse.
- **Ton:** kurze Effekte mit WebAudio im Code erzeugt (keine Audiodateien im Prototyp).
- Keine externen Bibliotheken ausser `planck`, ohne vorher zu fragen.

## Projektstruktur (Ziel)

```
index.html
src/
  main.ts            Einstieg, Spielschleife, Grössenanpassung
  i18n.ts            Alle Texte für Spieler
  storage.ts         Spielstand (localStorage, immer in try/catch)
  platform/poki.ts   Poki-SDK-Wrapper mit No-op-Fallback
  game/
    Game.ts          Zustände: Titel, Spielen, Pause, Ziel, Fehlschlag
    World.ts         planck-Welt, Kollisionen, Schrittweite
    Vehicle.ts       Lieferwagen (Chassis, Räder, Ladefläche)
    Cargo.ts         Ladungstypen und Verlust-Erkennung
    Camera.ts        Kamera mit Vorausschau
    Input.ts         Tastatur, Touch-Tasten, Maus
    Renderer.ts      Zeichnen von Gelände, Wagen, Ladung, Partikeln
    Audio.ts         WebAudio-Effekte, Stummschalten
    Obstacles.ts     Brücke, Tunnel, Eis/Schlamm, Wippe, Lift
    themes.ts        Aussehen der Welten
    paints.ts        Farben aus dem Shop
    Characters.ts    Kunden-Figuren am Ziel
    SkyTraffic.ts    Flugzeuge, Ballone, Zeppelin
  social.ts          Spielername, Rekorde, Freunde-Einladung per Link
  levels/
    index.ts         Level-Liste
    level01.ts ...   Level als Daten (Gelände-Punkte, Ladung, Ziel)
    meadow.ts ...    Level pro Insel (Wiese 7–10, Wüste, Schnee, Stadt); ids 1–40
    shapes.ts        Bausteine für Gelände (Welle, Grube, Brücke, Lift)
  ui/                HUD, Endbildschirm, Weltkarte (WorldMap.ts), Home/Garage/Shop (Menus.ts)
docs/GDD.md          Spielkonzept
```

## Poki-Regeln (müssen immer erfüllt sein)

- **Download unter 8 MB** (gesamter `dist`-Ordner). Ziel für den Prototyp: unter 1 MB.
- **16:9-Spielfläche**, die den verfügbaren Platz ausfüllt und bei Grössenänderung
  sauber skaliert. Muss auf Desktop, Handy und Tablet laufen; Tablets nutzen die
  Touch-Steuerung.
- **Keine externen Anfragen** zur Laufzeit (keine CDN-Schriften, keine Tracker).
  Einzige Ausnahme später: das Poki-SDK-Skript.
- `localStorage` immer in `try/catch` (das Spiel muss im Inkognito-Modus laufen).
- Pfeiltasten und Leertaste dürfen die Seite **nicht scrollen** (`preventDefault`).
- Inhalte familienfreundlich: keine Gewalt, kein Glücksspiel, keine Marken, keine
  Namen oder Grafiken anderer Spiele.
- Kein Debug-Code und keine Test-Overlays im Produktions-Build.

### Poki-SDK (ab Meilenstein 2)

- Skript in `index.html`: `https://game-cdn.poki.com/scripts/v2/poki-sdk.js`
- Ablauf: `PokiSDK.init()` → nach dem Laden `gameLoadingFinished()` →
  `gameplayStart()` erst bei der **ersten Eingabe** des Spielers, nicht beim Laden.
- `gameplayStop()` bei Pause, Menü, Levelende und Fehlschlag. Nie zweimal dasselbe
  Ereignis hintereinander senden.
- `commercialBreak()` immer dann, wenn der Spieler weiterspielen will (nächstes
  Level, Neustart nach Fehlschlag) – **vor** `gameplayStart()`. Poki entscheidet
  selbst, ob wirklich Werbung kommt.
- `rewardedBreak()` nur nach klarer Wahl des Spielers, Knopf deutlich als Werbung
  kennzeichnen; `.then(success)` entscheidet über die Belohnung.
- Während jeder Werbung: Spiel pausieren und Ton stummschalten.
- `src/platform/poki.ts` kapselt alles und fällt auf No-ops zurück, wenn das SDK
  fehlt (lokale Entwicklung). Testen mit dem Poki Inspector: https://inspector.poki.io

## Befehle

- `npm run dev` – Entwicklungsserver
- `npm run dev -- --host` – erreichbar im WLAN, zum Testen auf dem Handy
- `npm run build` – Produktions-Build in `dist/`
- `npm run preview` – Build lokal ansehen
- Nach jedem Build die Grösse von `dist/` nennen.

## Fertig heisst (für jede Änderung)

- TypeScript kompiliert ohne Fehler, `npm run build` läuft durch.
- Keine Fehler in der Browser-Konsole.
- Läuft flüssig (Ziel 60 fps) auch auf einem durchschnittlichen Handy.
- Neustart eines Levels dauert unter 1 Sekunde.

## Meilensteine

### Meilenstein 1 – Spielbarer Prototyp (jetzt)

- [x] Projekt-Setup (Vite, TypeScript, planck), leere Szene skaliert auf 16:9
- [x] Gelände aus Level-Daten, Lieferwagen mit Federung, Gas/Bremse/Rückwärts
- [x] Neigen in der Luft
- [x] Ladefläche mit niedrigen Wänden, Ladungstypen: Kisten, Eier, Tortenturm
- [x] Verlust-Erkennung und HUD mit Ladungs-Symbolen
- [x] Ziel, Sterne, Fehlschlag, sofortiger Neustart
- [x] 5 Level gemäss GDD, einfache Levelauswahl, Fortschritt speichern
- [x] Touch-Tasten auf Touch-Geräten, Tastatur auf Desktop
- [x] Spielgefühl: Kamera, Partikel, Bildschirm-Wackeln, Töne

### Meilenstein 2 – Poki-bereit

- [x] Poki-SDK-Wrapper, Ereignisse und Werbung gemäss Regeln oben
- [x] Belohnte Werbung: «Ab Checkpoint weiterfahren», «Level überspringen», «Coins ×2»
- [ ] Test im Poki Inspector ohne Fehler
- [x] Ladebildschirm, Stummschalten-Knopf, Pause; neue Spieler starten direkt in Level 1

### Meilenstein 3 – Inhalt und Feinschliff

- [x] 40 Level: 4 Inseln à 10 Level mit Weltkarte; weitere Ladungen (Aquarium, Opa,
  Glace, Bowlingkugel)
- [ ] Geschenkturm als Ladung
- [x] Weitere Fahrzeuge (Traktor, Pickup, Renn-Truck 47), Deutsch als zweite Sprache
- [x] Coins, Shop (Fahrzeuge, Farben), Garage, Home-Bildschirm
- [x] Rekorde, Freunde-Rangliste per Einladungs-Link, neue Kunden-Figuren, Himmel mit
  Flugzeugen/Ballonen/Zeppelin, moderneres Design
- [x] Statisches Vorschaubild für Poki (`promo/thumbnail-1024.png`)
- [ ] Animiertes Vorschaubild (mp4, 1080 × 1080, 4–6 s) – erst für die Soft Release nötig
