import sys, json, subprocess, numpy as np
from scipy import signal
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
work, wav = sys.argv[1], sys.argv[2]
shift = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0   # Ton um shift s verschieben (Anzeige)
name = sys.argv[4] if len(sys.argv) > 4 else "plot2.png"
SR = 48000
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", wav, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
x = np.frombuffer(raw, np.float32).astype(np.float64)
f, t, Z = signal.stft(x, SR, nperseg=1200, noverlap=1200 - 200)
P = np.abs(Z) ** 2
def band(a, b):
    e = 10 * np.log10(P[(f >= a) & (f < b)].sum(0) + 1e-10); e = np.maximum(e, e.max() - 50); return (e - e.min()) / (e.max() - e.min())
lo, hi, tot = band(100, 500), band(1000, 5000), band(100, 8000)
d = np.load(work + "/lm.npz", allow_pickle=True); lm = d["lm"]; bs = d["bs"]; names = list(d["names"])
io = np.linalg.norm(lm[:, 33, :2] - lm[:, 263, :2], axis=1)
ap = np.linalg.norm(lm[:, 13, :2] - lm[:, 14, :2], axis=1) / io
wd = np.linalg.norm(lm[:, 78, :2] - lm[:, 308, :2], axis=1) / io
tf = 10.0 + (np.arange(len(ap)) + 0.5) / 30
asr = json.load(open(work + "/asr.json"))
words = []; cur = ""; t0 = None
for tk, ts in zip(asr["tokens"], asr["timestamps"]):
    if tk.startswith(" ") or cur == "":
        if cur: words.append((t0, cur))
        cur = tk.strip(); t0 = ts
    else: cur += tk
words.append((t0, cur))
fig, ax = plt.subplots(6, 1, figsize=(22, 16))
for k in range(6):
    s = 10 + k * 5.05
    a = ax[k]
    sel = (t + shift >= s) & (t + shift < s + 5.05)
    a.fill_between(t[sel] + shift, 0, tot[sel], color="#9cc3ea", alpha=0.7, label="Ton gesamt")
    a.plot(t[sel] + shift, hi[sel], color="#1f5fa8", lw=1.0, label="Ton 1–5 kHz")
    sf = (tf >= s) & (tf < s + 5.05)
    a.plot(tf[sf], ap[sf] / 0.16, color="#e0303a", lw=2.0, marker="o", ms=3, label="Lippenöffnung")
    a.plot(tf[sf], (wd[sf] - 0.34) / 0.4 * 0.5 + 1.0, color="#2a9d4a", lw=1.0, label="Mundbreite (versetzt)")
    for (tw, w) in words:
        if s <= tw + shift < s + 5.05:
            a.text(tw + shift, 1.52, w, fontsize=9, rotation=0)
            a.axvline(tw + shift, color="k", lw=0.3, alpha=0.4)
    a.set_xlim(s, s + 5.05); a.set_ylim(0, 1.65)
    a.set_xticks(np.arange(np.ceil(s * 10) / 10, s + 5.05, 0.1)); a.tick_params(labelsize=6); a.grid(alpha=0.25)
ax[0].legend(loc="lower right", fontsize=7, ncol=4)
plt.tight_layout(); plt.savefig(work + "/" + name, dpi=62)
np.savez(work + "/signals.npz", t=t, lo=lo, hi=hi, tot=tot, tf=tf, ap=ap, wd=wd)
