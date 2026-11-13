# Meissa – Laborgespräch (v3)

Überarbeitung von `meissa_labor_gespraech_v2-1.mp4` für die ORION.LAB-Website.

**Ergebnis:** `meissa_labor_gespraech_v3.mp4` (1920×1080, 30 fps, 40.2 s). Die Bildspur ist bitgenau die des Originals (Stream-Kopie, kein Neu-Encoding), nur der Ton ist neu.

## Was geändert wurde

1. **Intro-Musik (0–10 s).** Das Original war bis zum ersten Wort still. Neu läuft ein kurzes Stück in D-Dur, 96 BPM, genau 4 Takte. Der Schlussakkord fällt auf den Schnitt zur Nahaufnahme (10.03 s) und klingt unter dem ersten Satz aus. Die Musik ist synthetisch erzeugt (`src/intro_music.py`), es gibt keine Fremdrechte.
2. **Lippensynchronität.** Im Original kam der Ton 50–220 ms *vor* den Lippen, je nach Satz unterschiedlich; im langen dritten Satz wuchs der Versatz von 115 auf 220 ms. Jeder Satzteil wird jetzt an einer stillen Stelle abgetrennt und um den gemessenen Wert später eingesetzt (`src/sync_fix.py`). Die Stimme wird nicht gedehnt, es ändern sich nur Pausenlängen um höchstens ±100 ms.
3. **Lautheit.** −15.0 LUFS, Spitzen −1.7 dBFS, Stereo AAC 192 kbit/s, `+faststart`.

Vorher/Nachher: `sync_vorher_nachher.png`. Nach der Korrektur liegen alle Satzteile innerhalb von ±30 ms (ein Bild).

## Grenze

Die Lippenbewegung im Video ist KI-generiert und artikuliert nicht jeden Laut (bei «bestimmt» zum Beispiel schliesst der Mund fürs «mm» gar nicht). Solche Stellen lassen sich über den Ton nicht beheben, dafür müsste die Lippenbewegung neu erzeugt werden.

## Neu bauen

```bash
pip install numpy scipy            # ffmpeg muss installiert sein
cd src
python build.py <original.mp4> ../meissa_labor_gespraech_v3.mp4
```

## Wie gemessen wurde (`analyse/`)

| Schritt | Skript | Modell |
|---|---|---|
| Lippenöffnung pro Bild | `landmarks.py` | MediaPipe Face Landmarker |
| Text mit Wortzeiten | `asr.py` | NVIDIA Parakeet TDT 0.6b v3 (sherpa-onnx) |
| Zeichen-genaue Ausrichtung des Textes am Ton | `ctc_align.py`, `ctc_viterbi.py` | Omnilingual ASR CTC 300M |
| Erwartete gegen gemessene Lippenöffnung, Versatz pro Satzteil | `expect.py`, `subwin.py` | – |

Gesprochener Text: «Sie haben es bestimmt schon gesehen und nicht gemerkt. Grosse Marken drehen ihre Werbung längst nicht mehr nur mit Kamera und Crew. Heute entstehen Bilder auf Kinoniveau. In einem Bruchteil der Zeit und der Kosten. Kein Drehteam, keine Reise, kein Wetterglück. Nur Ihre Idee, so gross erzählt, wie Sie sie gedacht haben. Und falls Sie sich fragen: Auch diese Szene hat es nie gegeben. Mich übrigens auch nicht. Orion Lab. Ideen, die man sonst nicht drehen könnte.»
