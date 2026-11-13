import sys, json, subprocess, numpy as np
work, wav = sys.argv[1], sys.argv[2]
ex = np.load(work + "/expect.npz"); t, E, Wt, ds = ex["t"], ex["E"], ex["Wt"], ex["ds"]
sig = np.load(work + "/signals.npz"); PTS = sig["tf"] - 1 / 60; ap = sig["ap"] / 0.16
sp = json.load(open(work + "/chars.json"))
def corr(d, a, b):
    tt = np.arange(a, b, 1 / 60)
    Es = np.interp(tt - d, t, E); Ws = np.interp(tt - d, t, Wt); A = np.interp(tt, PTS + 1 / 60, ap)
    w = Ws > 0.5
    if w.sum() < 20 or np.std(Es[w]) < 1e-3: return np.nan
    return float(np.corrcoef(Es[w], A[w])[0, 1])
print("Gleitende Fenster 1.4 s (Schritt 0.35 s): Zeitmitte -> bester Versatz ms (r)")
row = []
for c in np.arange(10.9, 39.6, 0.35):
    cs = np.array([corr(d, c - 0.7, c + 0.7) for d in ds])
    if np.all(np.isnan(cs)): continue
    i = int(np.nanargmax(cs)); row.append("%.1f:%+d(%.2f)" % (c, round(ds[i] * 1000), cs[i]))
for k in range(0, len(row), 9): print("  " + "  ".join(row[k:k + 9]))
# Lippenschluss-Ereignisse: Ton (m/b/p) gegen Video-Schluss
print("\nLippenschluss m/b/p: Zeit im Ton -> nächster Lippenschluss im Bild")
closed = ap < 0.10
runs = []; i = 0
while i < len(ap):
    if closed[i]:
        j = i
        while j < len(ap) and closed[j]: j += 1
        runs.append((PTS[i], PTS[j - 1] + 1 / 30)); i = j
    else: i += 1
txt = "".join(c for c, a, b, p in sp)
for k, (c, a, b, p) in enumerate(sp):
    if c in "mbp":
        tc = (a + b) / 2
        # Wort bestimmen
        s0 = txt.rfind(" ", 0, k) + 1; s1 = txt.find(" ", k); s1 = len(txt) if s1 < 0 else s1
        best = min(runs, key=lambda r: min(abs((r[0] + r[1]) / 2 - tc - 0.08), abs(r[0] - tc), abs(r[1] - tc)))
        print("  %-12s %s @%.2f  Bild zu %.2f–%.2f  (Beginn %+4.0f ms, Mitte %+4.0f ms)" % (txt[s0:s1], c, tc, best[0], best[1], (best[0] - tc) * 1000, ((best[0] + best[1]) / 2 - tc) * 1000))
# Pegel in den Pausen
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", wav, "-f", "f32le", "-ac", "1", "-ar", "48000", "-"])
x = np.frombuffer(raw, np.float32)
for a, b in [(0.5, 9.9), (12.35, 12.65), (13.8, 14.05), (17.8, 18.0), (23.1, 23.45), (30.55, 30.85), (34.5, 34.7)]:
    seg = x[int(a * 48000):int(b * 48000)]
    print("Pause %.2f–%.2f: RMS %.1f dBFS, Spitze %.1f dBFS" % (a, b, 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12), 20 * np.log10(np.abs(seg).max() + 1e-12)))
