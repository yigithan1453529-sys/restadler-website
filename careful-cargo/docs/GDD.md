# Careful Cargo – Game Design Document (Prototyp)

Stand: 8. November 2026 · Arbeitstitel, Name vor dem Einreichen prüfen

## 1. Idee in einem Satz

Fahr einen kleinen Lieferwagen über verrückte Hügel zum Kunden – die Ladung liegt
lose auf der Ladefläche, und du musst so viel wie möglich heil abliefern.

**Der Kern:** Ständige Spannung zwischen Tempo und Vorsicht. Wer zu schnell fährt,
verliert die Ladung. Wer zu langsam fährt, kommt die Hügel nicht hoch.

## 2. Plattform und Zielgruppe

- Poki (Browser), Desktop und Handy, Querformat 16:9.
- Alle Altersgruppen, Schwerpunkt Kinder und Jugendliche. Familienfreundlich.
- Kurze Runden: ein Level dauert 20–60 Sekunden.
- Das Spiel startet auf dem **Home-Bildschirm** (Wunsch des Projektinhabers); «Spielen»
  führt direkt ins aktuelle Level mit dem Hinweis («Hold ▶ to drive») und einem
  grossen Knopf «Start» (Enter, Leertaste oder Gas starten ebenfalls). Ein Klick oder Tipp blendet die Fahrknöpfe ◀ ▶ ein,
  damit man auch mit der Maus fahren kann. Die Levelauswahl ist über einen Menü-Knopf erreichbar.
- Auf Handys im Hochformat: Spielfläche mit Rand anzeigen und einen Hinweis
  «Gerät drehen» einblenden, das Spiel bleibt aber spielbar.

## 3. Spielablauf

1. Level startet, Wagen steht mit Ladung am Start.
2. Spieler fährt los (erste Eingabe = Spielbeginn).
3. Unterwegs kann Ladung herunterfallen oder zerbrechen.
4. Ziel: das Haus des Kunden mit Zielflagge. Über die Ziellinie fahren beendet das Level.
5. Endbildschirm mit Sternen → «Weiter» zum nächsten Level oder «Nochmal».

## 4. Steuerung

| Gerät | Gas | Bremse / rückwärts | Neustart | Pause |
| --- | --- | --- | --- | --- |
| Tastatur | → oder D | ← oder A | R | Esc oder P |
| Touch | grosse Taste rechts unten | grosse Taste links unten | Knopf oben rechts | Knopf oben rechts |
| Maus | Klick auf die Bildschirm-Tasten | Klick auf die Bildschirm-Tasten | Knopf | Knopf |

- **Am Boden:** rechts = Gas, links = bremsen, bei Stillstand rückwärts fahren.
- **In der Luft:** rechts neigt die Front nach unten, links neigt sie nach oben.
- Touch-Tasten nur auf Touch-Geräten anzeigen, halbtransparent, mindestens 18 % der
  Bildschirmhöhe gross.

## 5. Fahrzeug (Startwerte, beim Testen anpassen)

- Lieferwagen mit offener Ladefläche: Chassis ca. 3,0 × 0,8 m, Kabine vorne.
- Ladefläche ca. 1,6 m lang mit **niedrigen Seitenwänden** (ca. 0,25 m), damit Ladung
  bei zu viel Tempo herausfallen kann.
- 2 Räder, Radius ca. 0,45 m, `WheelJoint` mit Feder (Frequenz ca. 4 Hz,
  Dämpfung ca. 0,7) und Motor am Hinterrad (optional Allrad testen).
- Schwerkraft 10 m/s². Darstellung ca. 40 Pixel pro Meter bei 1280 × 720.
- Neigen in der Luft über ein kleines Drehmoment am Chassis.

## 6. Ladung

Im Prototyp drei Typen:

| Ladung | Verhalten | Wann verloren |
| --- | --- | --- |
| Holzkisten | Robust, rutschen und kippen | Berühren den Boden oder sind mehr als 3 m vom Wagen entfernt |
| Eier | Leicht, rollen | Wie Kisten **oder** zerbrechen bei hartem Aufprall (Kontakt-Impuls über Schwelle) |
| Tortenturm | 3 gestapelte Stockwerke, hohe Reibung | Jedes Stockwerk zählt einzeln; verloren, wenn es den Boden berührt oder vom Wagen weg ist |

- Verlorene Ladung bleibt sichtbar liegen (lustig), zählt aber nicht mehr.
- Zerbrochene Eier: gelbe Spritzer-Partikel, das Ei verschwindet.
- Glace-Kugeln: schmelzen nacheinander nach einer festen Fahrzeit (Timer im HUD)
  → «Geschmolzen!». Gegenteil der Eier: hier ist Tempo gefragt.
- Aquarium mit Fisch: das Wasser schwappt (schwere Kugel im Becken) und bringt den
  Wagen ins Schaukeln; verloren, wenn es zu stark kippt → «Platsch!».
- Bowlingkugeln: schwer, rollen herum und verändern das Fahrverhalten.
- Opa im Liegestuhl: ruft «Huch!» bei harten Stössen.
- Später (Meilenstein 3): Geschenkturm.

## 7. Ziel, Sterne und Fehlschlag

**Sterne** nach abgelieferter Ladung (abgeliefert ÷ gesamt):

- ★★★ = alles abgeliefert
- ★★ = mindestens 60 %
- ★ = mindestens ein Teil

**Fehlschlag** (sofortiger Neustart möglich, Taste R oder Knopf):

- Alle Ladung verloren → «All cargo lost!»
- Wagen liegt länger als 1,5 Sekunden auf dem Dach → «Flipped over!»
- Wagen fällt in eine Grube / unter das Level → «Fell off!»

Neustart muss **unter 1 Sekunde** dauern. Fortschritt speichern: freigeschaltete
Level und beste Sterne pro Level.

## 8. Die Level der Welt «Wiese»

Jedes Level bringt genau eine neue Sache bei.

| Level | Name | Länge | Ladung | Was es lehrt |
| --- | --- | --- | --- | --- |
| 1 | First Delivery | ca. 120 m | 3 Kisten | Gas und Bremse; sanfte Hügel. Hinweise «Hold ▶ to drive», dann «◀ to brake» |
| 2 | Bumpy Road | ca. 150 m | 4 Kisten (2 + 2 gestapelt) | Zu schnell über Bodenwellen = Kisten fliegen. 7 Wellen, 0,6–1,2 m hoch, die letzte kurz vor dem Ziel |
| 3 | Careful, Eggs! | ca. 140 m | 5 Eier | Weich landen: 3 Stufen nach unten (je ca. 0,8 m) plus kleine Wellen |
| 4 | Steep Hill | ca. 160 m | Tortenturm | Bremsen: langer steiler Abhang (ca. 30°), Welle im Tal, danach Gegenhang |
| 5 | The Jump | ca. 170 m | 3 Kisten | Neigen in der Luft: Rampe, Grube von ca. 6 m, kurzer Landehang, zweite kleine Grube (3 m). Checkpoint nach der ersten Grube |
| 6 | Egg Exam | ca. 130 m | 3 Eier | **Prüfung:** Wellen, Stufe, Abhang und Kuppe kombiniert |

**Schwierigkeits-Rhythmus:** drei normale Level, dann ein Prüfungs-Level, das alles
Gelernte kombiniert, danach ein leichteres Level zum Durchatmen. Durchkommen ist
leicht, 3 Sterne sind schwer.

**Level-Datenformat** (Beispiel, darf technisch angepasst werden):

```ts
export const level01: LevelData = {
  id: 1,
  name: "First Delivery",
  terrain: [[0, 0], [20, 0], [35, 1], [50, 0], /* ... */ [120, 0]], // Meter
  cargo: [{ type: "crate", count: 3 }],
  finishX: 115,
  checkpoints: [],
  hints: [{ x: 2, text: "hint.drive" }, { x: 40, text: "hint.brake" }],
};
```

## 9. Bildschirm und Bedienung

- **HUD oben:** links «Level 3», Mitte Ladungs-Symbole (grau und durchgestrichen,
  wenn verloren), rechts Neustart, Pause, Ton aus/an.
- **Endbildschirm Erfolg:** Sterne erscheinen nacheinander mit kleinem «Pop»,
  «4/5 delivered», grosser Knopf «Next», kleiner Knopf «Retry».
- **Endbildschirm Fehlschlag:** Grund in grosser Schrift, grosser Knopf «Retry».
- Enter oder Leertaste löst den grossen Knopf aus.
- Alle Knöpfe gross und gut lesbar, für Maus, Tastatur und Finger.

## 10. Grafik-Stil

Hell, farbig, flache Vektor-Formen mit dunkler Kontur (ca. 3 px, #2D2D2D).
Keine Pixel-Art, keine dunklen Farben.

| Element | Farbe (Startwert) |
| --- | --- |
| Himmel | Verlauf #8FD3FF → #E6F7FF |
| Hügel im Hintergrund (Parallax) | helle Grüntöne |
| Boden | Gras #5BC236 oben, Erde #8B5A2B darunter |
| Lieferwagen | Orange #FF6B35 |
| Räder | #333333 mit grauer Nabe |
| Kisten | #C68642 |
| Eier | #FFF8E7 |
| Torte | Rosa, Weiss, Schokobraun |
| Ziel | Kleines Kundenhaus mit Zielflagge und winkender Figur |

## 11. Spielgefühl («Juice»)

- Kamera folgt dem Wagen mit Vorausschau in Fahrtrichtung, zoomt bei Tempo leicht heraus.
- Staubwolken an den Rädern beim Anfahren.
- Kurzes Bildschirm-Wackeln bei harter Landung.
- Eier: gelbe Spritzer und «Knack»-Ton.
- Kurzer Text-Pop «Oops!» wenn Ladung verloren geht.
- Konfetti bei drei Sternen.

## 12. Ton

Im Code erzeugt (WebAudio): Motorbrummen mit Tonhöhe nach Tempo, dumpfer Aufprall,
Ei-Knacken, kurze Erfolgsmelodie (3 Töne), Fehlschlag (2 fallende Töne).
Stummschalten-Knopf, Zustand wird gespeichert.

## 13. Werbung (Meilenstein 2)

- **Pausen-Werbung** (`commercialBreak`): vor dem nächsten Level und vor dem
  Neustart nach einem Fehlschlag. Poki entscheidet, ob wirklich Werbung kommt.
- **Belohnte Werbung** (`rewardedBreak`), immer klar mit Werbe-Symbol beschriftet:
  - «Continue from checkpoint» nach Fehlschlag in Levels mit Checkpoint
  - «Skip level» nach 3 Fehlschlägen im selben Level
- Nie Werbung mitten im Fahren.

## 14. Welten, Hindernisse, Fahrzeuge

**4 Welten à 6 Level** (je 3 normale, 1 Prüfung, 1 leichteres, 1 normales):

| Welt | Level | Neu |
| --- | --- | --- |
| Wiese | 1–6 | Grundlagen, Prüfung 6 «Egg Exam» |
| Wüste | 7–12 | Glace, Wackelbrücke, Bowlingkugeln, Schlamm, Prüfung 10 |
| Schnee | 13–18 | Eis, Aquarium, niedriger Tunnel, Wippe, Prüfung 16 |
| Stadt bei Nacht | 19–24 | Lift, Opa, Dächer-Sprünge, Prüfung 22, Finale 24 |

**Hindernisse:** Wackelbrücke (Bretter an Gelenken über einer Grube), niedriger
Tunnel (hohe Ladung stösst an), Eis (rutschig), Schlamm (rutschig und bremst),
Wippe, Lift (fährt aus einer Grube hoch; grünes Licht = unten und bereit).

**Fahrzeuge** (im Shop mit Coins kaufen, in der Garage auswählen):

| Fahrzeug | Preis | Eigenschaft |
| --- | --- | --- |
| Lieferwagen | gratis | ausgewogen |
| Traktor | 150 Coins | langsam, stark, grosse Hinterräder |
| Pickup | 350 Coins | schnell, hohe Seitenwände |
| Renn-Truck 47 | 700 Coins | sehr schnell und stark, aber niedrige Wände; rot mit grauen Kotflügeln, Startnummer 47, Heckspoiler, Auspuffrohre |

Ältere Spielstände behalten Fahrzeuge, die sie schon mit Sternen freigeschaltet hatten.

**Coins:** pro geschafftem Level 10 Coins pro Stern, beim ersten Schaffen eines
Levels 20 Coins extra. Anzeige im Ergebnis-Fenster.

**Home:** Startbildschirm mit «Spielen» (aktuelles Level), Levelauswahl, Garage, Shop
und Coin-Anzeige. Der Home-Knopf im HUD, in der Pause und auf den Endbildschirmen
führt dorthin.

**Garage:** Fahrzeug wählen (Werte: Tempo, Kraft, Wände) und gekaufte Farbe pro
Fahrzeug wählen.

**Shop:** zwei Reiter, Fahrzeuge und Farben (Sonne, Ozean, Minze je 60 Coins;
Traube, Kaugummi, Limette je 90 Coins). Nur Spielwährung, kein echtes Geld.

**Kunde:** wartet winkend; bei 3 Sternen jubelt und springt er, bei 2 winkt er
fröhlich, bei 1 kratzt er sich am Kopf. Die Kamera zeigt das kurz, bevor das
Ergebnis-Fenster erscheint.

**Kunden am Ziel:** vier Figuren (Kind mit Mütze, Oma mit Brille, Koch, Bäuerin mit
Strohhut), abwechselnd pro Level. Sie stehen still, winken, wenn der Wagen näher als
30 m ist, und reagieren auf die Sterne (Jubel mit Herz, fröhliches Hüpfen, Kopfkratzen
mit «?»).

**Himmel:** Ab und zu fliegen ein Flugzeug mit Banner, Heissluftballone und ein
Zeppelin vorbei (nachts mit kleinen Lichtern).

**Rekorde und Freunde:** Eine Uhr läuft im HUD. Pro Level wird der beste Versuch
gespeichert (mehr Sterne, bei gleichen Sternen schneller). Jeder Spieler hat einen
zufälligen, kinderfreundlichen Namen (z. B. «Flinke Schildkröte 42», neu würfelbar).
«Freund einladen» teilt einen Link mit dem Namen und den Rekorden. Wer ihn öffnet,
hat den Absender in seiner Freunde-Rangliste (Sterne, Level, Gesamtzeit). Nach dem
Level steht im Ergebnis-Fenster «Du schlägst …» oder «… schaffte es in …».
Eine **weltweite** Rangliste gibt es nicht: Poki erlaubt keine eigenen Server und
bietet keine Rangliste im SDK.

## 15. Nicht im Prototyp

Echtgeld-Käufe, Sammelobjekte, weltweite Bestenlisten, Online-Funktionen mit eigenem
Server, Bilddateien und Musik.

## 16. Test des Prototyps

5–10 Testspieler, ohne Erklärung spielen lassen und beobachten:

- Verstehen sie in **unter 10 Sekunden**, was zu tun ist?
- Spielen sie **freiwillig länger als 3 Minuten**? (ungefähr die Hürde im
  Player Fit Test von Poki)
- Wo lachen sie, wo werden sie frustriert, bei welchem Level hören sie auf?
