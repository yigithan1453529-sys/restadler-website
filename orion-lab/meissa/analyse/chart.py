import sys
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
out = sys.argv[1]
labels = ["Sie haben es\nbestimmt …", "und nicht\ngemerkt", "Grosse Marken …\nKamera und Crew", "Heute entstehen\nBilder …", "In einem\nBruchteil …", "und der\nKosten",
          "Kein\nDrehteam", "keine\nReise", "kein\nWetterglück", "Nur Ihre Idee …\ngedacht haben", "Und falls Sie\nsich fragen", "auch diese\nSzene …", "Mich übrigens\nauch nicht", "Orion\nLab", "Ideen, die\nman …"]
before = [120, 60, 190, 120, 60, 50, 60, 10, 60, 90, 90, 60, 10, -25, 0]
after = [0, 20, 10, -10, -30, -10, -10, -5, -10, -10, -10, -10, -10, -25, 0]
x = np.arange(len(labels))
fig, ax = plt.subplots(figsize=(15, 6.2), facecolor="#1A1B1E")
ax.set_facecolor("#1A1B1E")
ax.axhspan(-40, 40, color="#92E01F", alpha=0.13, lw=0)
ax.text(len(labels) - 0.45, 33, "unmerklich (±40 ms)", color="#92E01F", ha="right", va="top", fontsize=10)
ax.bar(x - 0.2, before, 0.4, color="#8C9088", label="vorher (Original)")
ax.bar(x + 0.2, after, 0.4, color="#92E01F", label="nachher (v3)")
ax.plot([2 - 0.4, 2], [115, 220], color="#F4F5F2", lw=0)  # Platzhalter
ax.annotate("im Satz von 115 auf 220 ms\nanwachsend", xy=(1.8, 190), xytext=(3.3, 215), color="#F4F5F2", fontsize=9,
            arrowprops=dict(arrowstyle="-", color="#F4F5F2", lw=0.8))
ax.axhline(0, color="#F4F5F2", lw=1)
ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=8, color="#F4F5F2")
ax.set_ylabel("Ton kommt … ms vor den Lippen", color="#F4F5F2")
ax.tick_params(colors="#F4F5F2")
for s in ax.spines.values(): s.set_color("#33363C")
ax.set_ylim(-60, 240)
ax.set_title("Meissa – Laborgespräch: Versatz zwischen Ton und Lippen pro Satzteil", color="#F4F5F2", fontsize=13, pad=12)
leg = ax.legend(facecolor="#26282D", edgecolor="#33363C", labelcolor="#F4F5F2", loc="upper right", bbox_to_anchor=(1.0, 0.86))
plt.tight_layout(); plt.savefig(out, dpi=110, facecolor=fig.get_facecolor())
