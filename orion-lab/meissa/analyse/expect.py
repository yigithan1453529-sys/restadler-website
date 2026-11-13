"""Erwartete Lippenöffnung aus der Zeichen-Ausrichtung; Versatz pro Satzteil."""
import sys, json, numpy as np
work = sys.argv[1]
import os
MAPPING = json.load(open(work + "/mapping.json")) if os.path.exists(work + "/mapping.json") else None
def _sh(t):
    if not MAPPING: return t
    d = MAPPING[0][1]
    for c, dd in MAPPING:
        if t >= c: d = dd
    return t + d / 1000.0
sp = json.load(open(work + "/chars.json"))
sig = np.load(work + "/signals.npz"); tf = sig["tf"] - 1 / 60 + 1 / 60; ap = sig["ap"] / 0.16
PTS = sig["tf"] - 1 / 60
SEG = [(10.19, 12.29), (12.71, 13.70), (14.13, 17.72), (18.10, 20.15), (20.48, 21.91), (22.19, 23.00),
       (23.54, 24.38), (24.66, 25.42), (25.70, 26.66), (26.97, 30.48), (30.93, 32.11), (32.40, 34.44),
       (35.05, 36.18), (36.61, 37.43), (37.73, 40.10)]
SEG = [(_sh(a + 0.01), _sh(b - 0.01)) for a, b in SEG]
BASE = dict(a=1.0, ä=0.8, e=0.5, i=0.4, o=0.55, ö=0.45, u=0.3, ü=0.3, y=0.3,
            m=0.0, b=0.0, p=0.0, f=0.1, w=0.1, v=0.1,
            s=0.2, ß=0.2, z=0.2, t=0.25, d=0.25, n=0.25, l=0.3, r=0.4, k=0.35, g=0.35, c=0.3, h=0.5, j=0.3, x=0.3, q=0.3)
def build(table, R=240):
    """Stückweise Erwartung E(t) auf 240-Hz-Raster; w(t)=Gewicht (0 in Pausen)."""
    t = np.arange(9.9, 40.3, 1 / R); E = np.zeros_like(t); Wt = np.zeros_like(t); lab = np.full(len(t), "", dtype=object)
    words = []; cur = []
    for c, a, b, p in sp:
        if c == " ":
            if cur: words.append(cur); cur = []
        else:
            cur.append((c, (a + b) / 2))
    if cur: words.append(cur)
    flat = [x for w in words for x in w]
    for k, (c, tc) in enumerate(flat):
        seg = next((s for s in SEG if s[0] - 0.08 <= tc <= s[1] + 0.08), None)
        lo = (flat[k - 1][1] + tc) / 2 if k > 0 else tc - 0.06
        hi = (flat[k + 1][1] + tc) / 2 if k + 1 < len(flat) else tc + 0.08
        lo = max(lo, tc - 0.09); hi = min(hi, tc + 0.11)
        if seg: lo = max(lo, seg[0] - 0.02); hi = min(hi, seg[1] + 0.02)
        sel = (t >= lo) & (t < hi)
        E[sel] = table.get(c, 0.3); Wt[sel] = 1.0; lab[sel] = c
    return t, E, Wt, lab, flat
def smooth(x, n=9):
    k = np.hanning(n); k /= k.sum(); return np.convolve(x, k, mode="same")
def corr_shift(t, E, Wt, d, a, b, R=240):
    """Korrelation zwischen E (um d verzögert) und gemessener Öffnung im Abschnitt [a,b]."""
    tt = np.arange(a - 0.05, b + 0.25, 1 / 60)
    Es = np.interp(tt - d, t, E); Ws = np.interp(tt - d, t, Wt)
    A = np.interp(tt, PTS + 1 / 60, ap)
    w = Ws > 0.5
    if w.sum() < 10: return 0.0
    x, y = Es[w], A[w]
    return float(np.corrcoef(x, y)[0, 1])
table = dict(BASE)
ds = np.arange(-0.25, 0.3001, 0.01)
for it in range(3):
    t, E, Wt, lab, flat = build(table)
    Es = smooth(E, 13)
    offs = []
    for (a, b) in SEG:
        cs = np.array([corr_shift(t, Es, Wt, d, a, b) for d in ds])
        offs.append((ds[int(np.argmax(cs))], cs.max(), cs))
    # Tabelle aus den Daten neu schätzen (mit den gefundenen Versätzen)
    acc = {}
    for (a, b), (d, r, cs) in zip(SEG, offs):
        for c, tc in flat:
            if a - 0.08 <= tc <= b + 0.08:
                acc.setdefault(c, []).append(float(np.interp(tc + d + 0.01, PTS + 1 / 60, ap)))
    new = {c: float(np.median(v)) for c, v in acc.items() if len(v) >= 3}
    mx = max(new.values())
    if it < 2:
        table = {c: 0.5 * BASE.get(c, 0.3) + 0.5 * new.get(c, BASE.get(c, 0.3)) / mx for c in set(BASE) | set(new)}
print("Viseme (gemessen, Median Öffnung):", " ".join("%s:%.2f" % (c, v) for c, v in sorted(new.items(), key=lambda kv: kv[1])))
print("\nVersatz pro Satzteil (+ = Ton muss später kommen):")
for k, ((a, b), (d, r, cs)) in enumerate(zip(SEG, offs)):
    r0 = cs[np.argmin(abs(ds))]
    # zweitbestes lokales Maximum
    peaks = [i for i in range(1, len(cs) - 1) if cs[i] >= cs[i - 1] and cs[i] >= cs[i + 1]]
    peaks.sort(key=lambda i: -cs[i])
    alt = ", ".join("%+.0f(%.2f)" % (ds[i] * 1000, cs[i]) for i in peaks[:3])
    print("  %2d %5.2f–%5.2f: %+4.0f ms  r=%.2f (bei 0: %.2f)   Maxima: %s" % (k + 1, a, b, d * 1000, r, r0, alt))
allc = np.array([o[2] for o in offs]); wts = np.array([b - a for a, b in SEG])
g = (allc * wts[:, None]).sum(0) / wts.sum()
print("\nGESAMT (alle Satzteile, gleicher Versatz): bester %+.0f ms (r=%.2f), bei 0 ms r=%.2f" % (ds[int(np.argmax(g))] * 1000, g.max(), g[np.argmin(abs(ds))]))
print("Kurve gesamt:", " ".join("%+d:%.2f" % (round(d * 1000), v) for d, v in zip(ds[::3], g[::3])))
np.savez(work + "/expect.npz", t=t, E=Es, Wt=Wt, ds=ds, curves=allc, offs=np.array([o[0] for o in offs]), seg=np.array(SEG))
json.dump(table, open(work + "/viseme_table.json", "w"), ensure_ascii=False)
