"""Sprechertext, Sprechblasen und Zeitachse.

Die Zeitachse richtet sich nach der Stimme: Satzanfänge werden über die
Pausen in der Aufnahme erkannt, Wortzeiten innerhalb der Sätze über
Silbengewichte und Mikro-Pausen geschätzt. Ohne Stimme (Testbilder) wird
eine Schätzung mit typischem Sprechtempo verwendet.
"""
import json
import os
import re

import numpy as np

from common import BUILD

# Vorlauf bis zum ersten Wort (Figur springt hoch)
LEAD_IN = 0.55
# Abspann nach dem letzten Wort
OUTRO = 2.6

SCENES = [
    dict(text="Hallo und willkommen im Orion Lab!",
         bubble="Hallo! Willkommen im *ORION.LAB*!", anchors=[0, 2, 3, 4]),
    dict(text="Sie haben ein tolles Angebot? Super!",
         bubble="Sie haben ein *tolles* Angebot?", anchors=[0, 1, 2, 3, 4]),
    dict(text="Nur: Lange Texte liest heute kaum jemand bis zum Schluss.",
         bubble="Nur: Lange Texte liest kaum jemand fertig.", anchors=[0, 1, 2, 3, 5, 6, 9]),
    dict(text="Mit einem Erklärvideo versteht man es sofort.",
         bubble="Mit einem *Erklärvideo* versteht man es sofort!", anchors=[0, 1, 2, 3, 4, 5, 6]),
    dict(text="Kurz, klar und mit Charakter.",
         bubble="Kurz. Klar. Mit *Charakter*.", anchors=[0, 1, 3, 4]),
    dict(text="Und das machen wir für jede Firma, egal aus welcher Branche.",
         bubble="Und das für *jede Firma* – egal welche Branche!", anchors=[0, 1, 4, 5, 6, 7, 7, 9, 10]),
    dict(text="Und zwar auf die beste Art und Weise.",
         bubble="Jedes Video auf die *beste Art und Weise*.", anchors=[0, 1, 2, 3, 4, 5, 6, 7]),
    dict(text="Unser Rezept aus dem Labor: Ihre Idee, eine starke Story und lebendige Animation.",
         bubble="Unser Rezept aus dem *Labor*:", anchors=[0, 1, 2, 3, 4]),
    dict(text="Fertig ist Ihr Erklärvideo!",
         bubble="Fertig ist Ihr *Erklärvideo*!", anchors=[0, 1, 2, 3]),
    dict(text="Schreiben Sie uns, wir freuen uns auf Ihr Projekt. Bis bald im Labor!",
         bubble="Schreiben Sie uns – wir freuen uns auf Ihr *Projekt*!",
         anchors=[0, 1, 2, 3, 3, 4, 5, 6, 7, 8],
         bubble2="Bis bald im *Labor*!", anchors2=[9, 10, 11, 12], split2=9),
]

FULL_TEXT = " ".join(s["text"] for s in SCENES)


def words_of(text):
    return text.split()


_VOW = "aeiouyäöü"


def syllables(word):
    w = re.sub(r"[^a-zäöüß]", "", word.lower())
    if not w:
        return 0
    w = re.sub(r"(ei|ie|au|eu|äu|ai|ee|aa|oo)", "a", w)
    n = len(re.findall(r"[aeiouyäöü]+", w))
    return max(1, n)


def word_weight(word):
    core = re.sub(r"[^A-Za-zÄÖÜäöüß]", "", word)
    return 0.65 * syllables(word) + 0.35 * len(core) / 3.2 + 0.05


def pause_after(word):
    """Typische Pausenlänge nach Satzzeichen (für die Schätzung)."""
    if word.endswith((".", "!", "?")):
        return 0.30
    if word.endswith(":"):
        return 0.18
    if word.endswith(","):
        return 0.10
    return 0.0


class Timeline:
    """scene_start[i], scene_end[i], words[i] = [(start, end, text)]."""

    def __init__(self, words, voice_offset, voice_len, source):
        self.words = words
        self.voice_offset = voice_offset
        self.voice_len = voice_len
        self.source = source
        self.scene_start = [w[0][0] for w in words]
        self.scene_end = [w[-1][1] for w in words]
        self.speech_end = self.scene_end[-1]
        self.duration = self.speech_end + OUTRO

    def w(self, s, i):
        """Startzeit von Wort i in Szene s (1-basiert)."""
        return self.words[s - 1][i][0]

    def we(self, s, i):
        return self.words[s - 1][i][1]

    def s(self, s):
        return self.scene_start[s - 1]

    def e(self, s):
        return self.scene_end[s - 1]

    def next_start(self, s):
        return self.scene_start[s] if s < len(self.scene_start) else self.duration

    def scene_at(self, t):
        k = 1
        for i, st in enumerate(self.scene_start):
            if t >= st - 0.001:
                k = i + 1
        return k

    def all_words(self):
        out = []
        for si, ws in enumerate(self.words):
            for wi, (a, b, txt) in enumerate(ws):
                out.append((a, b, txt, si + 1, wi))
        return out

    def save(self, path=None):
        path = path or os.path.join(BUILD, "timeline.json")
        with open(path, "w") as f:
            json.dump(dict(words=self.words, voice_offset=self.voice_offset,
                           voice_len=self.voice_len, source=self.source), f, ensure_ascii=False, indent=1)

    @staticmethod
    def load(path=None):
        path = path or os.path.join(BUILD, "timeline.json")
        with open(path) as f:
            d = json.load(f)
        words = [[tuple(w) for w in ws] for ws in d["words"]]
        return Timeline(words, d["voice_offset"], d["voice_len"], d["source"])


def _distribute(words, t0, t1):
    """Wörter proportional zu Silbengewichten zwischen t0 und t1 verteilen."""
    wts = np.array([word_weight(w) for w in words])
    pauses = np.array([pause_after(w) for w in words[:-1]] + [0.0])
    speak = (t1 - t0) - pauses.sum()
    if speak <= 0.05:
        pauses *= 0.0
        speak = t1 - t0
    dur = wts / wts.sum() * speak
    out = []
    t = t0
    for w, d, p in zip(words, dur, pauses):
        out.append((round(t, 4), round(t + d, 4), w))
        t += d + p
    return out


def estimate_timeline(rate=4.9, scene_gap=0.38):
    """Schätzung ohne Aufnahme (nur für Testbilder)."""
    words = []
    t = LEAD_IN
    for sc in SCENES:
        ws = words_of(sc["text"])
        dur = sum(word_weight(w) for w in ws) / rate * 1.05 + sum(pause_after(w) for w in ws[:-1])
        words.append(_distribute(ws, t, t + dur))
        t += dur + scene_gap
    return Timeline(words, LEAD_IN, t - LEAD_IN, "schaetzung")


# ------------------------------------------------------------------ Ausrichtung an der Aufnahme
def speech_segments(env, hop, thr_db=-38.0, min_gap=0.11, min_seg=0.06):
    """Sprechabschnitte aus der Hüllkurve (dB) bestimmen."""
    on = env > thr_db
    segs = []
    i = 0
    n = len(on)
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]:
                j += 1
            segs.append([i * hop, j * hop])
            i = j
        else:
            i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] >= min_seg]


def align_to_voice(segs, offset):
    """Satzgrenzen über die Pausen finden (DP über Silbengewichte), dann
    Wörter innerhalb jedes Satzes auf die Teilabschnitte verteilen."""
    scene_words = [words_of(s["text"]) for s in SCENES]
    weights = [sum(word_weight(w) for w in ws) for ws in scene_words]
    n_sc = len(SCENES)
    gaps = [(segs[i][1], segs[i + 1][0]) for i in range(len(segs) - 1)]
    G = len(gaps)
    if G < n_sc - 1:
        raise RuntimeError(f"Nur {G} Pausen gefunden, {n_sc - 1} Satzgrenzen nötig")
    total_speech = segs[-1][1] - segs[0][0]
    cum_w = np.cumsum(weights) / sum(weights)
    # Erwartete Zeit jeder Grenze
    exp_t = [segs[0][0] + cum_w[k] * total_speech for k in range(n_sc - 1)]
    glen = [g[1] - g[0] for g in gaps]
    gmid = [(g[0] + g[1]) / 2 for g in gaps]
    # DP: Grenze k -> Lücke j (streng aufsteigend)
    INF = 1e18
    cost = np.full((n_sc - 1, G), INF)
    back = np.zeros((n_sc - 1, G), int)
    for j in range(G):
        cost[0, j] = _bcost(gmid[j], exp_t[0], glen[j], total_speech)
    for k in range(1, n_sc - 1):
        best = INF
        bj = -1
        for j in range(G):
            if j - 1 >= 0 and cost[k - 1, j - 1] < best:
                best = cost[k - 1, j - 1]
                bj = j - 1
            if bj >= 0:
                cost[k, j] = best + _bcost(gmid[j], exp_t[k], glen[j], total_speech)
                back[k, j] = bj
    j = int(np.argmin(cost[-1]))
    chosen = [j]
    for k in range(n_sc - 2, 0, -1):
        j = back[k, j]
        chosen.append(j)
    chosen = chosen[::-1]
    # Abschnitte je Szene
    bounds = [-1] + chosen + [len(segs) - 1]
    words = []
    for k in range(n_sc):
        sub = segs[bounds[k] + 1: bounds[k + 1] + 1]
        words.append(_words_in_segments(scene_words[k], sub))
    return words


def _bcost(t, t_exp, glen, total):
    return ((t - t_exp) / (0.08 * total)) ** 2 - 6.0 * min(glen, 0.6)


def _words_in_segments(ws, sub):
    """Wörter auf Teilabschnitte (Mikro-Pausen) eines Satzes verteilen."""
    if len(sub) == 1:
        return _distribute(ws, sub[0][0], sub[0][1])
    # Phrasen an Satzzeichen bilden
    phrases = [[]]
    for w in ws:
        phrases[-1].append(w)
        if re.search(r"[,.:!?]$", w):
            phrases.append([])
    phrases = [p for p in phrases if p]
    # Abschnitte zu so vielen Gruppen zusammenfassen wie Phrasen (falls möglich)
    if len(sub) >= len(phrases) > 1:
        gaps = sorted(range(len(sub) - 1), key=lambda i: -(sub[i + 1][0] - sub[i][1]))
        # Gewichtsbasiert: Grenzen nahe der erwarteten Phrasengrenzen wählen
        tot_w = sum(word_weight(w) for w in ws)
        t0, t1 = sub[0][0], sub[-1][1]
        cum = 0.0
        exp_b = []
        for p in phrases[:-1]:
            cum += sum(word_weight(w) for w in p)
            exp_b.append(t0 + cum / tot_w * (t1 - t0))
        chosen = []
        for eb in exp_b:
            best = None
            for i in range(len(sub) - 1):
                if i in chosen:
                    continue
                mid = (sub[i][1] + sub[i + 1][0]) / 2
                g = sub[i + 1][0] - sub[i][1]
                sc = abs(mid - eb) - 1.2 * g
                if best is None or sc < best[0]:
                    best = (sc, i)
            chosen.append(best[1])
        chosen = sorted(set(chosen))
        groups = []
        a = 0
        for i in chosen:
            groups.append((sub[a][0], sub[i][1]))
            a = i + 1
        groups.append((sub[a][0], sub[-1][1]))
        if len(groups) == len(phrases):
            out = []
            for p, (g0, g1) in zip(phrases, groups):
                out += _distribute(p, g0, g1)
            return out
    return _distribute(ws, sub[0][0], sub[-1][1])
