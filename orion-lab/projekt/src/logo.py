"""Logo «o.» und Wortmarke ORION■LAB nach Markenvorgaben.

Falls eine Logo-Datei (assets/logo.png, nur das Zeichen «o.», transparent)
vorhanden ist, wird diese statt der Konstruktion verwendet.
"""
import os

import skia

from common import ASSETS, NEON, WHITE, OUT, fill, stroke, font, rrect_path

_LOGO_IMG = None
_LOGO_CHECKED = False


def _logo_file():
    global _LOGO_IMG, _LOGO_CHECKED
    if not _LOGO_CHECKED:
        _LOGO_CHECKED = True
        p = os.path.join(ASSETS, "logo.png")
        if os.path.exists(p):
            _LOGO_IMG = skia.Image.open(p)
    return _LOGO_IMG


def logo_geometry(D):
    """Bounding-Box des Logos relativ zum Ringmittelpunkt."""
    R = D / 2
    sq = 0.28 * D
    x0 = R + 0.10 * D
    yb = R - 0.06 * D
    return dict(R=R, ring_w=0.275 * D, sq=sq, sq_x=x0, sq_y=yb - sq,
                left=-R, right=x0 + sq, top=-R, bottom=R)


def draw_logo(c, cx, cy, D, ring=WHITE, square=NEON, alpha=1.0, outline=0.0):
    """Ring-Mittelpunkt bei (cx, cy), Aussendurchmesser D."""
    img = _logo_file()
    g = logo_geometry(D)
    if img is not None:
        w = g["right"] - g["left"]
        h = D
        rect = skia.Rect.MakeXYWH(cx + g["left"], cy - g["R"], w, h)
        p = skia.Paint(AntiAlias=True)
        p.setAlphaf(alpha)
        c.drawImageRect(img, rect, skia.SamplingOptions(skia.FilterMode.kLinear), p)
        return
    rw = g["ring_w"]
    rmid = g["R"] - rw / 2
    if outline > 0:
        c.drawCircle(cx, cy, rmid, stroke(OUT, rw + 2 * outline, alpha))
        c.drawRect(skia.Rect.MakeXYWH(cx + g["sq_x"] - outline, cy + g["sq_y"] - outline,
                                      g["sq"] + 2 * outline, g["sq"] + 2 * outline), fill(OUT, alpha))
    c.drawCircle(cx, cy, rmid, stroke(ring, rw, alpha))
    c.drawRect(skia.Rect.MakeXYWH(cx + g["sq_x"], cy + g["sq_y"], g["sq"], g["sq"]), fill(square, alpha))


def logo_width(D):
    g = logo_geometry(D)
    return g["right"] - g["left"]


def wordmark_width(size):
    f = font(size, "SemiBold")
    sq = 0.24 * size
    gap = 0.07 * size
    return f.measureText("ORION") + gap + sq + gap + f.measureText("LAB")


def draw_wordmark(c, x, baseline, size, color=WHITE, alpha=1.0, align="left"):
    """ORION■LAB – der Punkt ist ein neongrünes Quadrat auf der Grundlinie."""
    f = font(size, "SemiBold")
    sq = 0.24 * size
    gap = 0.07 * size
    total = wordmark_width(size)
    if align == "center":
        x -= total / 2
    w1 = f.measureText("ORION")
    c.drawString("ORION", x, baseline, f, fill(color, alpha))
    sx = x + w1 + gap
    c.drawRect(skia.Rect.MakeXYWH(sx, baseline - sq, sq, sq), fill(NEON, alpha))
    c.drawString("LAB", sx + sq + gap, baseline, f, fill(color, alpha))
    return total


def draw_badge(c, cx, cy, size, alpha=1.0):
    """Kleiner anthrazitfarbener Aufnäher mit «o.» (für den Kittel)."""
    w = size * 1.45
    h = size * 1.05
    p = rrect_path(cx - w / 2, cy - h / 2, w, h, size * 0.22)
    c.drawPath(p, fill("#1A1B1E", alpha))
    c.drawPath(p, stroke(OUT, 3.5, alpha))
    D = size * 0.62
    lw = (logo_geometry(D)["right"] - logo_geometry(D)["left"])
    draw_logo(c, cx - lw / 2 + D / 2, cy, D, alpha=alpha)
