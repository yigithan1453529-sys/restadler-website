"""Lippensynchron-Korrektur für «Meissa – Laborgespräch».

Messung (siehe analyse/): Die Lippen kommen im Original 0–220 ms NACH dem Ton,
je nach Satz unterschiedlich und im langen dritten Satz zunehmend. Korrigiert
wird nur der Ton, und zwar ohne Zeitdehnung: Jeder Satzteil wird an einer
stillen Stelle (Pause bzw. Verschlusslaut) abgetrennt und um den gemessenen
Wert später eingesetzt. Tonhöhe und Sprechtempo der Stimme bleiben unverändert,
es ändern sich nur Pausenlängen um höchstens ±100 ms.
"""
import subprocess

import numpy as np

SR = 48000

# (Schnittzeit im Original in s, Verzögerung ab hier in ms, Suchfenster ±s, Bemerkung)
INITIAL_DELAY_MS = 120
SCHEDULE = [
    (12.50, 60, 0.06, "Pause vor «und nicht gemerkt»"),
    (13.92, 120, 0.06, "Pause vor «Grosse Marken …»"),
    (14.716, 160, 0.012, "k-Verschluss in «Marken»"),
    (16.100, 180, 0.008, "t-Verschluss in «längst»"),
    (16.287, 200, 0.010, "t-Verschluss in «nicht»"),
    (16.752, 215, 0.008, "nach «mit»"),
    (17.91, 120, 0.06, "Pause vor «Heute entstehen …»"),
    (20.31, 40, 0.06, "Pause vor «In einem Bruchteil …»"),
    (20.867, 65, 0.006, "b-Verschluss in «Bruchteil»"),
    (22.05, 40, 0.05, "Pause vor «und der Kosten»"),
    (23.27, 60, 0.08, "Pause vor «Kein Drehteam»"),
    (24.52, 15, 0.05, "Pause vor «keine Reise»"),
    (25.56, 60, 0.05, "Pause vor «kein Wetterglück»"),
    (26.82, 60, 0.05, "Pause vor «Nur Ihre Idee»"),
    (28.046, 80, 0.04, "Pause nach «Idee,»"),
    (29.241, 100, 0.02, "Pause nach «erzählt,»"),
    (30.70, 95, 0.08, "Pause vor «Und falls Sie …»"),
    (32.25, 65, 0.05, "Pause vor «auch diese Szene …»"),
    (34.58, 15, 0.05, "Pause vor «Mich übrigens …»"),
    (36.40, 0, 0.08, "Pause vor «Orion Lab»"),
]


def read_mono(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32).astype(np.float64)


def quietest(x, t, win):
    """Leiseste Stelle (10-ms-Fenster) in t ± win."""
    w = int(0.010 * SR)
    a = max(0, int((t - win) * SR))
    b = min(len(x) - w, int((t + win) * SR))
    best, bi = 1e9, a
    for i in range(a, b, int(0.001 * SR)):
        e = float(np.mean(x[i:i + w] ** 2))
        if e < best:
            best, bi = e, i
    return bi + w // 2, 10 * np.log10(best + 1e-12)


def apply_schedule(x, schedule=SCHEDULE, initial=INITIAL_DELAY_MS, total_len=None, verbose=True):
    cuts = [0]
    delays = [initial]
    for (t, d, win, note) in schedule:
        i, lvl = quietest(x, t, win)
        cuts.append(i)
        delays.append(d)
        if verbose:
            print("  Schnitt %7.3f s (%5.1f dB)  -> %+4d ms   %s" % (i / SR, lvl, d, note))
    cuts.append(len(x))
    n_out = total_len or len(x)
    out = np.zeros(n_out + SR)
    fade = int(0.003 * SR)
    for k in range(len(delays)):
        a, b = cuts[k], cuts[k + 1]
        seg = x[a:b].copy()
        if k > 0:
            seg[:fade] *= np.linspace(0, 1, fade)
        if k < len(delays) - 1:
            seg[-fade:] *= np.linspace(1, 0, fade)
        o = a + int(round(delays[k] * SR / 1000))
        out[o:o + len(seg)] += seg
    return out[:n_out], [(c / SR, d) for c, d in zip(cuts[:-1], delays)]


def delay_at(t, mapping):
    d = mapping[0][1]
    for c, dd in mapping:
        if t >= c:
            d = dd
    return d
