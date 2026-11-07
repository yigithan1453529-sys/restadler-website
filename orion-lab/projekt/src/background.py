"""Gezeichnetes Industrie-Labor (Backstein, Sprossenfenster, Stahlträger,
Dachoberlichter, Hängelampen, Regale mit Glaskolben und Pflanzen).

Wird einmal gerendert, weichgezeichnet und Richtung Anthrazit abgedunkelt,
damit die Figur hervorsticht. Ergebnis wird in build/ zwischengespeichert.
"""
import math
import os

import numpy as np
import skia

from common import (BUILD, W, H, NEON, ANTH, OUT, WHITE, hexc, fill, stroke, rrect_path,
                    poly_path, oval_path, circle_path, union, smooth_closed_path, radial_glow)

BO = 3.2  # Konturstärke im Hintergrund

LAMPS = [(250, 300), (1245, 262), (1665, 318)]  # (x, y Lampenschirm-Unterkante)


def _bricks(c, rng, x0, y0, x1, y1):
    c.drawRect(skia.Rect.MakeLTRB(x0, y0, x1, y1), fill("#5B524E"))
    bh, bw = 34, 96
    row = 0
    y = y0
    while y < y1:
        off = (row % 2) * bw / 2 - bw / 2
        x = x0 + off
        while x < x1:
            v = rng.uniform(-1, 1)
            base = np.array([0x6E, 0x4A, 0x42], float)  # gedecktes Rotbraun (kein Orange)
            col = np.clip(base * (1 + 0.13 * v) + rng.uniform(-6, 6), 0, 255).astype(int)
            if rng.rand() < 0.08:
                col = np.clip(col * 0.78, 0, 255).astype(int)
            p = rrect_path(x + 2.5, y + 2.5, bw - 5, bh - 5, 4)
            c.drawPath(p, fill(skia.Color(*[int(k) for k in col])))
            # obere Lichtkante
            c.drawLine(x + 6, y + 6, x + bw - 8, y + 6, stroke(skia.Color(255, 255, 255, 22), 2))
            x += bw
        y += bh
        row += 1


def _window(c, x, y, w, h, cols, rows, rng):
    # Fensterlaibung
    c.drawPath(rrect_path(x - 18, y - 18, w + 36, h + 40, 6), fill("#4A4544"))
    glass = rrect_path(x, y, w, h, 4)
    sh = skia.GradientShader.MakeLinear(
        [skia.Point(x, y), skia.Point(x + w * 0.4, y + h)],
        [hexc("#E3EAE6"), hexc("#B8C7C3"), hexc("#94A6A4")], [0.0, 0.55, 1.0])
    gp = skia.Paint(AntiAlias=True)
    gp.setShader(sh)
    c.drawPath(glass, gp)
    # Silhouette draussen (Bäume/Dächer), sehr dezent
    c.save()
    c.clipPath(glass, doAntiAlias=True)
    hill = skia.Path()
    hill.moveTo(x, y + h)
    for i in range(0, int(w) + 40, 40):
        hill.lineTo(x + i, y + h * 0.72 - 30 * math.sin(i * 0.013 + x) - rng.uniform(0, 25))
    hill.lineTo(x + w, y + h)
    hill.close()
    c.drawPath(hill, fill("#7F9290", 0.55))
    # Lichtstreifen
    for k in range(3):
        sx = x + w * (0.1 + 0.3 * k)
        band = poly_path([(sx, y), (sx + 70, y), (sx - 90, y + h), (sx - 160, y + h)])
        c.drawPath(band, fill("#FFFFFF", 0.10))
    c.restore()
    # Sprossen
    pw, ph = w / cols, h / rows
    for i in range(1, cols):
        c.drawLine(x + i * pw, y, x + i * pw, y + h, stroke("#2C2E33", 7, cap=skia.Paint.kButt_Cap))
    for j in range(1, rows):
        c.drawLine(x, y + j * ph, x + w, y + j * ph, stroke("#2C2E33", 7, cap=skia.Paint.kButt_Cap))
    # einzelne gekippte Scheiben
    for _ in range(2):
        i, j = rng.randint(0, cols), rng.randint(0, rows - 2)
        c.drawRect(skia.Rect.MakeXYWH(x + i * pw + 4, y + j * ph + 4, pw - 8, ph - 8), fill("#6E8280", 0.35))
    c.drawPath(glass, stroke("#2C2E33", 14))
    c.drawPath(rrect_path(x - 7, y - 7, w + 14, h + 14, 6), stroke(OUT, BO))
    # Fensterbank
    c.drawPath(rrect_path(x - 30, y + h + 10, w + 60, 22, 4), fill("#77716C"))
    c.drawPath(rrect_path(x - 30, y + h + 10, w + 60, 22, 4), stroke(OUT, BO))


def _flask(c, cx, base, h, liquid, kind, rng):
    """Kleine Laborgefässe fürs Regal."""
    if kind == "erlen":
        wb, wn = h * 0.62, h * 0.2
        body = poly_path([(cx - wn / 2, base - h), (cx + wn / 2, base - h), (cx + wn / 2, base - h * 0.62),
                          (cx + wb / 2, base - 4), (cx - wb / 2, base - 4), (cx - wn / 2, base - h * 0.62)])
        liq_top = base - h * 0.38
    elif kind == "round":
        r = h * 0.36
        body = union(circle_path(cx, base - r, r),
                     rrect_path(cx - h * 0.1, base - h, h * 0.2, h - r, 3))
        liq_top = base - r * 1.05
    elif kind == "beaker":
        wb = h * 0.7
        body = rrect_path(cx - wb / 2, base - h, wb, h, 5)
        liq_top = base - h * 0.55
    else:  # tube
        wb = h * 0.22
        body = rrect_path(cx - wb / 2, base - h, wb, h, wb / 2)
        liq_top = base - h * 0.5
    c.drawPath(body, fill("#DCE6E2", 0.55))
    if liquid:
        c.save()
        c.clipPath(body, doAntiAlias=True)
        c.drawRect(skia.Rect.MakeLTRB(cx - h, liq_top, cx + h, base + 2), fill(liquid))
        c.drawRect(skia.Rect.MakeLTRB(cx - h, liq_top, cx + h, liq_top + 4), fill("#FFFFFF", 0.4))
        c.restore()
    c.drawPath(body, stroke(OUT, BO))
    c.drawLine(cx - h * 0.12, base - h * 0.85, cx - h * 0.12, base - h * 0.55, stroke("#FFFFFF", 3, 0.6))


def _plant(c, cx, base, size, rng, hanging=False):
    pot = poly_path([(cx - size * 0.32, base - size * 0.42), (cx + size * 0.32, base - size * 0.42),
                     (cx + size * 0.24, base), (cx - size * 0.24, base)])
    leaves = []
    n = 7 if not hanging else 6
    for i in range(n):
        if hanging:
            a = math.radians(rng.uniform(20, 160))
            L = size * rng.uniform(0.7, 1.4)
            ex, ey = cx + math.cos(a) * L * 0.7, base - size * 0.4 + math.sin(a) * L
        else:
            a = math.radians(-90 + rng.uniform(-70, 70))
            L = size * rng.uniform(0.6, 1.0)
            ex, ey = cx + math.cos(a) * L, base - size * 0.42 + math.sin(a) * L
        mx, my = (cx + ex) / 2, (base - size * 0.42 + ey) / 2
        nx, ny = -(ey - (base - size * 0.42)), ex - cx
        nl = math.hypot(nx, ny) or 1
        wl = size * 0.16
        leaf = skia.Path()
        leaf.moveTo(cx, base - size * 0.42)
        leaf.quadTo(mx + nx / nl * wl, my + ny / nl * wl, ex, ey)
        leaf.quadTo(mx - nx / nl * wl, my - ny / nl * wl, cx, base - size * 0.42)
        leaves.append(leaf)
    greens = ["#3F7A3A", "#4E8F3F", "#5FA046", "#356B33"]
    for i, lf in enumerate(leaves):
        c.drawPath(lf, fill(greens[i % 4]))
        c.drawPath(lf, stroke(OUT, BO * 0.8))
    c.drawPath(pot, fill("#E9E6DF"))
    c.drawPath(pot, stroke(OUT, BO))
    c.drawRect(skia.Rect.MakeLTRB(cx - size * 0.33, base - size * 0.45, cx + size * 0.33, base - size * 0.36),
               fill("#CFCBC2"))


def _shelf(c, rng):
    x0, x1 = 18, 392
    top, bottom = 268, 850
    levels = [392, 528, 664, 800]
    # Rückwand leicht dunkler
    c.drawRect(skia.Rect.MakeLTRB(x0, top, x1, bottom), fill("#2B2D31", 0.35))
    for lv in levels:
        c.drawPath(rrect_path(x0 - 6, lv, x1 - x0 + 12, 14, 3), fill("#6C7077"))
        c.drawPath(rrect_path(x0 - 6, lv, x1 - x0 + 12, 14, 3), stroke(OUT, BO))
    # Gegenstände
    items = {
        392: [("plant_h", 70, 70), ("erlen", 180, 92), ("round", 255, 88), ("tube", 300, 70),
              ("tube", 322, 78), ("tube", 344, 64)],
        528: [("binder", 52, 0), ("beaker", 175, 70), ("erlen", 250, 100), ("round", 340, 84)],
        664: [("round", 70, 90), ("erlen", 150, 80), ("plant", 260, 92), ("beaker", 345, 62)],
        800: [("box", 90, 0), ("erlen", 230, 110), ("beaker", 320, 76)],
    }
    liquids = [NEON, None, "#8FD1C9", NEON, "#C7E58C", None]
    k = 0
    for lv, lst in items.items():
        for kind, x, h in lst:
            if kind == "plant":
                _plant(c, x, lv, h, rng)
            elif kind == "plant_h":
                _plant(c, x, lv, h, rng, hanging=True)
            elif kind == "binder":
                for i, col in enumerate(["#3C4048", "#92E01F", "#555A63", "#3C4048"]):
                    p = rrect_path(x + i * 24, lv - 105 + (i % 2) * 6, 22, 105 - (i % 2) * 6, 3)
                    c.drawPath(p, fill(col, 0.9 if col != NEON else 0.7))
                    c.drawPath(p, stroke(OUT, BO * 0.8))
            elif kind == "box":
                p = rrect_path(x - 60, lv - 80, 120, 80, 4)
                c.drawPath(p, fill("#8A8377"))
                c.drawPath(p, stroke(OUT, BO))
                c.drawRect(skia.Rect.MakeLTRB(x - 30, lv - 60, x + 30, lv - 40), fill("#F4F5F2", 0.7))
            else:
                _flask(c, x, lv, h, liquids[k % len(liquids)], kind, rng)
                k += 1
    # Pfosten
    for px in [x0, x1 - 14]:
        c.drawPath(rrect_path(px, top, 14, bottom - top, 3), fill("#7B8088"))
        c.drawPath(rrect_path(px, top, 14, bottom - top, 3), stroke(OUT, BO))


def _ceiling(c, rng):
    c.drawRect(skia.Rect.MakeLTRB(0, 0, W, 190), fill("#2A2C31"))
    # Dachoberlichter (schräge Glasflächen)
    for x0 in [90, 720, 1350]:
        w = 520
        tr = poly_path([(x0 + 60, -10), (x0 + w - 60, -10), (x0 + w, 122), (x0, 122)])
        sh = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, 122)],
                                            [hexc("#E6EEEB"), hexc("#B4C3C0")], [0.0, 1.0])
        gp = skia.Paint(AntiAlias=True)
        gp.setShader(sh)
        c.drawPath(tr, gp)
        for i in range(1, 6):
            t = i / 6
            c.drawLine(x0 + 60 + (w - 120) * t, -10, x0 + w * t, 122, stroke("#34373D", 6))
        c.drawLine(x0 + 30, 56, x0 + w - 30, 56, stroke("#34373D", 6))
        c.drawPath(tr, stroke("#34373D", 10))
    # Fachwerkträger
    c.drawRect(skia.Rect.MakeLTRB(0, 124, W, 138), fill("#3E4248"))
    c.drawRect(skia.Rect.MakeLTRB(0, 176, W, 192), fill("#3E4248"))
    c.drawLine(0, 126, W, 126, stroke("#5A5F67", 2.5))
    x = -20
    up = True
    while x < W + 40:
        c.drawLine(x, 136 if up else 178, x + 46, 178 if up else 136, stroke("#3E4248", 9))
        x += 46
        up = not up
    c.drawRect(skia.Rect.MakeLTRB(0, 124, W, 138), stroke(OUT, BO))
    c.drawRect(skia.Rect.MakeLTRB(0, 176, W, 192), stroke(OUT, BO))
    # Lüftungsrohr an der Wand
    c.drawPath(rrect_path(-10, 212, W + 20, 26, 13), fill("#6A6F77"))
    c.drawPath(rrect_path(-10, 212, W + 20, 26, 13), stroke(OUT, BO))
    for x in range(140, W, 330):
        c.drawPath(rrect_path(x, 206, 16, 38, 4), fill("#555A62"))
        c.drawPath(rrect_path(x, 206, 16, 38, 4), stroke(OUT, BO * 0.8))


def _column(c, x):
    c.drawRect(skia.Rect.MakeLTRB(x, 190, x + 44, 852), fill("#3B3F45"))
    c.drawRect(skia.Rect.MakeLTRB(x + 10, 190, x + 34, 852), fill("#474C53"))
    for y in range(240, 840, 60):
        c.drawCircle(x + 6, y, 3, fill("#6A6F77"))
        c.drawCircle(x + 38, y, 3, fill("#6A6F77"))
    c.drawRect(skia.Rect.MakeLTRB(x, 190, x + 44, 852), stroke(OUT, BO))


def _lamp_shapes(c, alpha=1.0):
    for (x, y) in LAMPS:
        c.drawLine(x, 192, x, y - 46, stroke(OUT, 3.5, alpha))
        shade = skia.Path()
        shade.moveTo(x - 16, y - 50)
        shade.lineTo(x + 16, y - 50)
        shade.cubicTo(x + 30, y - 40, x + 66, y - 16, x + 70, y)
        shade.lineTo(x - 70, y)
        shade.cubicTo(x - 66, y - 16, x - 30, y - 40, x - 16, y - 50)
        shade.close()
        c.drawPath(shade, fill("#2E3136", alpha))
        c.drawLine(x - 50, y - 18, x - 20, y - 38, stroke("#5A5F67", 4, alpha))
        c.drawPath(shade, stroke(OUT, BO, alpha))
        c.drawPath(oval_path(x, y + 4, 22, 12), fill("#FFFDF0", alpha))


def _floor(c):
    sh = skia.GradientShader.MakeLinear([skia.Point(0, 850), skia.Point(0, H)],
                                        [hexc("#4A4C50"), hexc("#2E3034")], [0.0, 1.0])
    p = skia.Paint(AntiAlias=True)
    p.setShader(sh)
    c.drawRect(skia.Rect.MakeLTRB(0, 850, W, H), p)
    c.drawRect(skia.Rect.MakeLTRB(0, 842, W, 858), fill("#3A3C41"))
    c.drawLine(0, 858, W, 858, stroke(OUT, BO))
    for x in range(-200, W + 400, 260):
        c.drawLine(x, 858, x - 180, H, stroke("#26282C", 2.5, 0.6))


def build_background(force=False):
    path = os.path.join(BUILD, "background.png")
    if os.path.exists(path) and not force:
        return skia.Image.open(path)
    rng = np.random.RandomState(7)
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    c.clear(hexc("#2A2C31"))
    _bricks(c, rng, 0, 190, W, 852)
    _window(c, 728, 268, 470, 498, 5, 7, rng)
    _window(c, 1300, 268, 470, 498, 5, 7, rng)
    _column(c, 620)
    _column(c, 1862)
    _ceiling(c, rng)
    _floor(c)
    _shelf(c, rng)
    _plant(c, 1835, 1010, 230, rng)
    _lamp_shapes(c)
    raw = surf.makeImageSnapshot()

    # Weichzeichnen + Abdunkeln Richtung Anthrazit + Vignette
    out = skia.Surface(W, H)
    oc = out.getCanvas()
    bp = skia.Paint()
    bp.setImageFilter(skia.ImageFilters.Blur(2.6, 2.6, skia.TileMode.kClamp))
    oc.drawImage(raw, 0, 0, skia.SamplingOptions(), bp)
    oc.drawRect(skia.Rect.MakeWH(W, H), fill(ANTH, 0.50))
    vig = skia.GradientShader.MakeRadial(skia.Point(W * 0.55, H * 0.45), W * 0.75,
                                         [skia.Color(26, 27, 30, 0), skia.Color(26, 27, 30, 0),
                                          skia.Color(19, 20, 23, 200)], [0.0, 0.45, 1.0])
    vp = skia.Paint()
    vp.setShader(vig)
    oc.drawRect(skia.Rect.MakeWH(W, H), vp)
    # Lampenlicht nach dem Abdunkeln, damit es leuchtet
    for (x, y) in LAMPS:
        radial_glow(oc, x, y + 10, 190, "#FFFBEA", 0.30)
        radial_glow(oc, x, y + 6, 46, "#FFFFFF", 0.85)
    # Lichtkegel
    for (x, y) in LAMPS:
        cone = poly_path([(x - 60, y), (x + 60, y), (x + 230, y + 520), (x - 230, y + 520)])
        sh = skia.GradientShader.MakeLinear([skia.Point(0, y), skia.Point(0, y + 520)],
                                            [skia.Color(255, 252, 235, 34), skia.Color(255, 252, 235, 0)],
                                            [0.0, 1.0])
        cp = skia.Paint(AntiAlias=True)
        cp.setShader(sh)
        cp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 18))
        oc.drawPath(cone, cp)
    img = out.makeImageSnapshot()
    img.save(path, skia.kPNG)
    return img


def build_halftone():
    """Dezentes Halbton-Raster in den Ecken (Bildschirm-Ebene)."""
    path = os.path.join(BUILD, "halftone.png")
    if os.path.exists(path):
        return skia.Image.open(path)
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    c.clear(skia.Color(0, 0, 0, 0))
    step = 18
    corners = [(0, 0), (W, 0), (0, H), (W, H)]
    reach = 430
    for j in range(0, H + step, step):
        for i in range(0, W + step, step):
            x = i + (step / 2 if (j // step) % 2 else 0)
            y = j
            d = min(math.hypot(x - cx, (y - cy) * 1.35) for cx, cy in corners)
            if d > reach:
                continue
            r = 5.2 * (1 - d / reach) ** 1.3
            if r < 0.6:
                continue
            c.drawCircle(x, y, r, fill(OUT, 0.55))
    img = surf.makeImageSnapshot()
    img.save(path, skia.kPNG)
    return img


if __name__ == "__main__":
    build_background(force=True)
    print("ok")
