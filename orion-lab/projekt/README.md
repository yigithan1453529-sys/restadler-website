# ORION.LAB – Comic-Erklärvideo

«Für jeden das passende Erklärvideo – auf die beste Art und Weise.»

Flacher Comic-Stil, 1920×1080, 30 fps. Alles wird per Code gezeichnet: Python, skia-python, numpy, scipy und ffmpeg.
Die Bilder richten sich nach der Stimme. Satzanfänge, Wortzeiten, Lip-Sync, Nicken und Effekte kommen aus der Tonspur.

## Ordner

| Pfad | Inhalt |
|---|---|
| `src/` | Render-Code (siehe unten) |
| `fonts/` | Fredoka Medium/SemiBold/Bold (von npm `@fontsource/fredoka`, woff2 → ttf mit fontTools) |
| `assets/` | **Eingaben:** `voice.wav` (KIE-Stimme), `musik_2.mp3`, optional `logo.png` |
| `testbilder/` | Testbilder der vollsten Momente + `00_uebersicht.png` |
| `build/` | Zwischenergebnisse (nicht im Git) |
| `kie_tts_auftrag.json` | Auftrag für die Stimme (Gemini-TTS «Leda», eine durchgehende Aufnahme) |

## Ablauf

```bash
pip install -r requirements.txt          # ffmpeg muss installiert sein
cd src

python render.py testframes              # 1. Testbilder (ohne Stimme: geschätzte Zeiten)
#   -> assets/voice.wav + assets/musik_2.mp3 ablegen
python render.py audio                   # 2. Pausen kürzen, Sätze/Wörter erkennen, Lip-Sync, SFX, Mix
python render.py testframes              # 3. Testbilder jetzt mit echten Zeiten prüfen
python render.py video --parts 4         # 4. ganzes Video in 4 Teilen parallel, dann zusammenfügen
```

Ergebnis: `ORION-LAB_Erklaervideo.mp4` (H.264 crf 18, AAC 192k, `+faststart`).

## Stimme (wichtig)

- Eine einzige durchgehende Aufnahme, alle 10 Sätze in einem `dialogue_turn` (siehe `kie_tts_auftrag.json`).
- `audio.py` kürzt jede Pause über 0.5 s auf 0.35 s. Es wird nur Stille herausgeschnitten (20 ms Überblendung), nichts gedehnt. Die Stimme bleibt also unverzerrt.
- Satzgrenzen: Die Sprechabschnitte werden aus der Hüllkurve bestimmt. Eine dynamische Programmierung ordnet die 9 Satzgrenzen den passenden Pausen zu (erwartete Position aus Silbengewichten, längere Pausen bevorzugt). Innerhalb der Sätze werden die Wörter auf die Mikro-Pausen (Komma, Doppelpunkt) und nach Silben verteilt.
- Lip-Sync: Die Mundöffnung kommt aus der Lautstärke, die Mundbreite aus dem Spektrum (Energie 1.7–3.5 kHz gegen 250–900 Hz: breit bei i/e, rund bei o/u). Der Mund läuft 35 ms vor dem Ton.
- Betonungen (starke Lautheitsanstiege) lösen Kopfnicken, Augenbrauen und kleine Hand-Beats aus.

## Ton

- Musik läuft leise unter der Stimme. Sie wird beim Sprechen um 6.5 dB abgesenkt (Attack 0.12 s, Release 0.5 s), am Anfang 1.2 s eingeblendet und am Ende 2.3 s ausgeblendet.
- Die Soundeffekte werden synthetisch erzeugt (Pop, Whoosh, Ding, Blubbern, Glitzern, Plopp, Klick). Ihre Zeitpunkte kommen aus der Regie (`scene.py → Director.ev`).
- Lautheit: ffmpeg `loudnorm` in zwei Durchgängen auf −15 LUFS, True Peak −1.5 dBFS.

## Code

| Datei | Aufgabe |
|---|---|
| `common.py` | Farben, Schrift, Pfad-/Zeichen-Helfer, Federn/Easing |
| `logo.py` | «o.» nach Spezifikation (Ring 27.5 % D, Quadrat 0.28 D, Abstand 0.10 D, 0.06 D über Ringunterkante), Wortmarke ORION■LAB |
| `background.py` | Industrie-Labor (Backstein, Sprossenfenster, Träger, Oberlichter, Lampen, Regal mit Kolben und Pflanzen), weichgezeichnet und abgedunkelt, Halbton-Raster |
| `character.py` | Figur mit Rig (Kopf, Augen, Brauen, Mund, Arme mit 2-Gelenk-IK, Handformen, Ohrringe, Dutt) |
| `motion.py` | Posen pro Szene mit Feder-Überschwingen, Sprung mit Squash & Stretch, Blinzeln, Blick, Pendel für Ohrringe und Dutt |
| `bubble.py` | Sprechblasen mit wortgenauer Einblendung und Textmarker |
| `props.py` | Tisch, Papiere, Bildschirm, Branchen-Icons, Erlenmeyerkolben, Etiketten, Videokarte, Button |
| `scene.py` | Regie: alle Ereignisse an Wortzeiten gebunden, Kamera (Zoom 1.02–1.04, Wackeln) |
| `timeline.py` | Sprechertext, Blasentexte mit Wort-Ankern, Ausrichtung an der Aufnahme |
| `audio.py` | Stimme, Merkmale, SFX, Musik, Mix, Lautheit |
| `render.py` | Kommandos `testframes`, `audio`, `video` |
