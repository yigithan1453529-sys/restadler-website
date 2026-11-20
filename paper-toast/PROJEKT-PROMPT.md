# Projekt: Paper Toast – 3D-Büro-Wurfspiel

Du hilfst mir, mein Browser-Spiel **„Paper Toast“** weiterzuentwickeln. Antworte auf Deutsch (Schweizer Schreibweise, also „ss“ statt „ß“). Ich bin kein Programmierer. Erkläre Änderungen kurz und verständlich und liefere immer die **komplette, lauffähige Datei**, keine Ausschnitte.

## Das Spiel
Man steht am Kopfende eines Konferenztisches in einem Büro und wirft eine zerknüllte Papierkugel in einen Papierkorb aus Drahtgitter.
- **Steuerung:** mit Finger oder Maus nach oben wischen. Die Länge des Wischens bestimmt die Kraft, die Richtung bestimmt das Ziel. Eine Kraftanzeige (grün → gelb → rot, mit Prozent) sitzt fest am **rechten Bildschirmrand**, nicht unter dem Finger. Unter dem Finger erscheint nur eine gestrichelte Wischlinie.
- **Ablauf:** Pro Stufe gibt es 10 Würfe, und man braucht 3–5 Treffer, um befördert zu werden.
- **Die Stufen sind eine Büro-Karriere:** Praktikum → Lehre → Sachbearbeitung → Teamleitung → Abteilungsleitung → Bereichsleitung → Direktion → Vizepräsidium → CEO → Verwaltungsrat, danach endlos „Legende I, II …“.
- **So wird es schwerer:** grössere Distanz (3,2–7,15 m), kleinerer Kübel, Wind von Standventilatoren (Stärke und Richtung oben in der Anzeige). In Stufe 5 und 8 fährt der Kübel auf einem Saugroboter über den Tisch.
  - Stufen 1–8: Der Kübel steht auf dem Konferenztisch (Distanz wächst sanft: 3,2 / 3,5 / 3,8 / 4,1 / 4,4 / 4,9 / 5,4 / 5,9 m).
  - Stufen 9 und 10 (und jede zweite Legende-Stufe): Der Kübel steht auf einem Stehtisch hinter dem Tischende (7,15 m).
- **Punkte:** Ein Treffer gibt 100 Punkte, ein „Swish“ ohne Randberührung +50. Mehrere Treffer hintereinander geben einen Serien-Multiplikator bis ×3. Am Ende jeder Stufe gibt es 1–3 Sterne mit Bonus. Rekord und höchste Stufe werden im Browser gespeichert (localStorage).
- **Physik:** Schwerkraft, Luftwiderstand, Wind, Abprallen am Kübelrand, an der Kübelwand, am Tisch und am Boden. Nach jedem Wurf bleibt die Flugbahn als gestrichelte Linie stehen.

## Look & Atmosphäre
- **HUD:** gelbe Post-it-Zettel mit Handschrift (Font „Caveat“). Links stehen Stufe, Treffer und Würfe, rechts Punkte bzw. die Rangliste.
- **Menüs:** „INTERNES MEMO der Personalabteilung“ im Schreibmaschinen-Font („Special Elite“) mit Stempel „BEFÖRDERT“ (grün) oder „ABGELEHNT“ (rot).
- **Raum:** Konferenzraum mit dunklem Holzboden, Lamellenvorhängen mit Tageslicht, schwarzen Pendelleuchten, Strahlerschiene, grauer Schrankwand und einem breiten TV. Dazu kommen 16 hellbraune Lederstühle und ein langer Tisch mit dunkler Platte.
- **Möbel:** vorne links eine Arbeitsplatz-Ecke (L-Tisch, PC, Pinnwand, Regale, Ordner), hinten links ein Wasserspender, hinten rechts ein schwarzer Aktenschrank mit einem kleinen Röhren-TV obendrauf, links und rechts je ein Vintage-Tischventilator (türkis, Chromkorb) auf einem schwarzen Beistelltisch, über dem vorderen Tischteil ein drehender Deckenventilator (nur Dekoration).
- **TV „BÜRO·TV“:** wechselt alle 12 s zwischen News mit Laufband (zeigt den Spielstand), Wetter (Appenzell, St. Gallen, Zürich), „Papierkorb-Liga“ (Rangliste der Spieler) und Aquarium.
- **Ton:** Alles wird live im Browser erzeugt (WebAudio), es gibt keine Audiodateien.
  - Radio „Büro Eins“: Popmusik, die wie ein kleiner Lautsprecher klingt, mit Jingle.
  - Gemurmel von drei Kollegen und ab und zu ein echter Satz über die Sprachausgabe des Geräts.
  - Ein Knopf für Radio an/aus, ein Knopf für Ton an/aus.

## Mehrspieler
1. **Allein spielen:** Wer eine Stufe nicht schafft, wiederholt sie.
2. **Mehrspieler am Gerät (2–4 Spieler):** Die Spieler werfen abwechselnd, jeder hat eine eigene Papierfarbe (gelb, blau, grün, rosa). Oben steht „Name ist dran“, und der Notizzettel färbt sich in der Spielerfarbe. Wer am Ende einer Stufe zu wenig Treffer hat, wird „freigestellt“. Wer zuletzt übrig bleibt oder die meisten Punkte hat, gewinnt.
3. **Freunde einladen (online, bis zu 4 Spieler):**
   - Ein Raum-Code mit 4 Zeichen und ein Einladungslink `…#pt-abcd`.
   - In der Lobby sieht man alle Spieler. Drückt jemand „Spiel starten“, startet das Spiel bei allen.
   - Jeder spielt auf dem eigenen Gerät, mit einer Live-Rangliste. Die Würfe der anderen fliegen als farbige Papierkugeln mit.
   - Technik: die `room`-Fähigkeit von claude.ai-Artifacts (`claude.use("room")`, `join()`, nur `presence`, keine Events). Das Spiel ist mit Link freigegeben: Jede Person, die bei claude.ai angemeldet ist und den Link hat, kann mitspielen. Wer nicht angemeldet ist, sieht den Hinweis „bei claude.ai anmelden“ und kann am selben Gerät spielen.

## Sterne ⭐, Belohnungen, Kiosk
- Ein Online-Spiel kostet 1 ⭐ (wird beim Spielstart abgezogen). Allein und Mehrspieler am Gerät sind gratis. Neue Spieler starten mit 3 ⭐.
- Tages-Bonus (Leiter, jeden Tag neu): Stufe 1 = +1 ⭐ gratis, Stufen 2–5 = +2/+3/+4/+5 ⭐, jeweils nach einem Werbevideo; immer nur die nächste Stufe ist offen.
- Werbung ist ein Platzhalter (grauer Kasten „Hier läuft später ein Werbevideo“, 15 s, nicht überspringbar, Radio stumm). Echte Werbung (z. B. Poki-SDK) geht erst ausserhalb von claude.ai.
- Aufgaben: täglich (10 Treffer, 1 Swish, 30 Würfe: je 1 ⭐), wöchentlich (60 Treffer, Teamleitung erreichen, 3 Online-Spiele: je 3 ⭐), monatlich (250 Treffer 8 ⭐, 20 Swishes 6 ⭐, 15× ★★★ 8 ⭐). Erledigte Aufgaben muss man unter „Belohnungen“ abholen.
- Sterne schenken: In der Online-Lobby hat jeder Mitspieler einen Knopf „⭐ schenken“ (1 Stern pro Tipp, höchstens 20 pro Person und Raumbesuch). Übertragen wird über die room-Presence (Feld gf = Summe pro Empfänger).
- Startbildschirm: Allein spielen, Weiter bei …, Mit Freunden (Auswahl: am selben Gerät / online), ⭐ Sterne & Aufgaben (von dort zum Kiosk).
- Kiosk: Spielpunkte (aus Solo- und Online-Spielen) gegen Sterne tauschen: 1 ⭐ = 1'000, 5 ⭐ = 4'500, 12 ⭐ = 10'000 Punkte. Kein Echtgeld (auf claude.ai nicht möglich).
- Speicherung: im Browser (localStorage „papertoast.wallet“). Der Code kann das claude.ai-Konto (db-Fähigkeit, data/users/<id>/wallet) nutzen, aber db lässt sich bei einem öffentlich geteilten Artifact nicht einschalten.
- Wichtige Funktionen: W (Wallet), track(), earnPoints(), showRewards(), showShop(), showAd(), needStarMemo(), initWallet().

## Technik (bitte beibehalten)
- **Eine HTML-Datei** (`paper-toast/index.html`) mit Inline-CSS und Inline-JS, ohne Build-Schritt.
- **three.js r147 als klassische Skripte** (keine ES-Module):
  `https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js`,
  `…/examples/js/loaders/GLTFLoader.js`,
  `…/examples/js/environments/RoomEnvironment.js`.
- **3D-Modelle** liegen neben der Seite und werden mit `loadGLB(name)` geladen. Die Funktion versucht zuerst `name.glb` und sonst `name.glb.txt` (Base64, für die Veröffentlichung als claude.ai-Artifact, weil dort `.glb` nicht ausgeliefert wird):
  - `trash_can.glb`: Papierkorb
  - `office.glb`: Konferenzraum
  - `desk.glb`: Knoten „cubicle“ (Arbeitsplatz-Ecke) und „cooler“ (Wasserspender)
  - `drawer.glb`: Aktenschrank
  - `fan.glb`: Vintage-Ventilator, Knoten „body“ und „blades“ (Flügel drehen um die x-Achse)
  - `ceiling_fan.glb`: Deckenventilator mit eigener Animation (AnimationMixer)
  - `tv_small.glb`: kleiner Röhren-TV
- **Koordinaten:** Kamera bei (0; 1,6; 0,5), Blick nach −z. Der Tisch geht von x ±0,84 und z −2,37 bis −6,59, seine Platte liegt auf 0,73 m Höhe. Wände bei x ±2,6, Rückwand bei z −7,75, Decke bei 2,95 m.
- **Wichtige Funktionen im Code:** `levelDef()` / `LEVELS` (Stufen), `startLevel()`, `stepBall()` (Physik), `surfaceAt()` (Tisch- und Stehtisch-Flächen), `throwBall()`, `finishThrow()` (Spielerwechsel), `updateHUD()`, `memo()` (Menüs), `drawTV()`, `radio…` / `sfx` (Ton), `net…` (Online-Raum).
- **Regeln für claude.ai-Artifacts:**
  - Skripte nur von erlaubten CDNs (cdnjs, jsdelivr, unpkg).
  - Keine `alert()`-, `confirm()`- oder `prompt()`-Dialoge.
  - `localStorage` immer in try/catch.
  - Muss auf dem Handy im Hochformat funktionieren.

## Quellen (Pflichtangabe)
- Papierkorb: „Trash Can“ von rickmaolly (Sketchfab), Lizenz CC BY 4.0. Die Namensnennung muss im Startbildschirm bleiben.
- Weitere Sketchfab-Modelle, alle CC BY 4.0 (Namensnennung steht ebenfalls im Startbildschirm): „Office Props Pack“ von seenoise (Arbeitsplatz-Ecke und Wasserspender, mit Original-Texturen), „Office Drawer“ von Mkky (Aktenschrank), „Vintage Ventilator“ von Özlem Çandır, „Ceiling Ventilator – Dirt (Animated)“ von Berk Gedik, „Tv Small“ von Cyber_Monkey. Texturen verkleinert (512/256 px) und als WebP gespeichert.
- Der Konferenzraum stammt aus der gelieferten Format2.FBX. Er wurde vereinfacht und komprimiert. Die Original-Texturen fehlten, deshalb sind die Farben selbst gewählt.

## Bekannte offene Punkte / Ideen
- Den Online-Modus mit echten Mitspielern auf claude.ai testen. Bisher wurde er nur mit einem nachgebauten Raum getestet.
- Am Handy im Hochformat sind die Ventilatoren in den ersten Stufen ausserhalb des Bildes.
- Ideen: Original-Texturen für den Raum, mehr Hindernisse (zum Beispiel ein Kollege läuft durchs Bild), Tages- oder Wochen-Rangliste, Erfolge oder Abzeichen, eigene Kugel-Skins.

## Arbeitsweise
- Ändere nur, was ich verlange, und behalte Stil und Spielgefühl bei.
- Sag mir vor grösseren Umbauten kurz, was du vorhast.
- Wenn ich neue 3D-Modelle schicke: Erst prüfen, was drin ist (Grösse, Texturen), dann einen sinnvollen Platz im Raum vorschlagen, ohne dass die Wurfbahn oder die Sicht auf den Kübel blockiert wird.
- Zum Schluss jeder Änderung: kurz sagen, was neu ist und was ich testen soll.

Code und Modelle liegen im GitHub-Repository `yigithan1453529-sys/restadler-website`, Ordner `paper-toast/`, Branch `ccr-32d61d97-f5a22c`.
