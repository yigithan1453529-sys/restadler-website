"""Gemeinsame Grundlagen: Farben, Schriften, Zeichen-Helfer, Easing/Federn."""
import math
import os

import numpy as np
import skia

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "fonts")
BUILD = os.path.join(ROOT, "build")
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(BUILD, exist_ok=True)

W, H = 1920, 1080
FPS = 30


# ------------------------------------------------------------------ Farben
def hexc(h, a=255):
    h = h.lstrip("#")
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


NEON = "#92E01F"
NEON_DARK = "#6FAE12"
ANTH = "#1A1B1E"
ANTH2 = "#26282D"
ANTH3 = "#33363C"
WHITE = "#F4F5F2"
OUT = "#131417"
GREY = "#D9DCD4"
GREY2 = "#B9BDB4"
TEXTGREY = "#8C9088"

SKIN = "#F8D7C1"
SKIN_SH = "#EDBCA2"
CHEEK = "#F2909F"
HAIR = "#2B2624"
HAIR_HI = "#453D39"
MOUTH_IN = "#6E2230"
TONGUE = "#E8737F"

OUTLINE = 5.5  # Strichstärke der Konturen (px)


# ------------------------------------------------------------------ Schrift
_TF = {}


def typeface(weight="SemiBold"):
    if weight not in _TF:
        _TF[weight] = skia.Typeface.MakeFromFile(os.path.join(FONT_DIR, f"Fredoka-{weight}.ttf"))
    return _TF[weight]


def font(size, weight="SemiBold"):
    f = skia.Font(typeface(weight), size)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    f.setSubpixel(True)
    return f


def text_width(text, f):
    return f.measureText(text)


# ------------------------------------------------------------------ Paints
def fill(color, alpha=1.0):
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kFill_Style)
    p.setColor(hexc(color) if isinstance(color, str) else color)
    if alpha < 1.0:
        p.setAlphaf(max(0.0, alpha))
    return p


def stroke(color, width, alpha=1.0, cap=skia.Paint.kRound_Cap, join=skia.Paint.kRound_Join):
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=width,
                   StrokeCap=cap, StrokeJoin=join)
    p.setColor(hexc(color) if isinstance(color, str) else color)
    if alpha < 1.0:
        p.setAlphaf(max(0.0, alpha))
    return p


def draw_outlined(c, path, color, ow=OUTLINE, oc=OUT, alpha=1.0):
    """Fläche füllen und dunkle Kontur darüber ziehen."""
    c.drawPath(path, fill(color, alpha))
    if ow > 0:
        c.drawPath(path, stroke(oc, ow, alpha))


def draw_limb(c, pts, width, color, ow=OUTLINE, oc=OUT, alpha=1.0):
    """Dicke Linie (Arm, Kordel …) mit Kontur: erst breit dunkel, dann Füllung."""
    path = skia.Path()
    path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    c.drawPath(path, stroke(oc, width + 2 * ow, alpha))
    c.drawPath(path, stroke(color, width, alpha))


# ------------------------------------------------------------------ Pfade
def rrect_path(x, y, w, h, r):
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r))
    return p


def circle_path(x, y, r):
    p = skia.Path()
    p.addCircle(x, y, r)
    return p


def oval_path(cx, cy, rx, ry):
    p = skia.Path()
    p.addOval(skia.Rect.MakeLTRB(cx - rx, cy - ry, cx + rx, cy + ry))
    return p


def capsule_path(x1, y1, x2, y2, r):
    """Kapsel zwischen zwei Punkten (für Finger u. ä.)."""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-6
    ang = math.degrees(math.atan2(dy, dx))
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-r, -r, L + 2 * r, 2 * r), r, r))
    m = skia.Matrix()
    m.setRotate(ang)
    m.postTranslate(x1, y1)
    p.transform(m)
    return p


def union(*paths):
    out = paths[0]
    for p in paths[1:]:
        out = skia.Op(out, p, skia.PathOp.kUnion_PathOp)
    return out


def diff(a, b):
    return skia.Op(a, b, skia.PathOp.kDifference_PathOp)


def intersect(a, b):
    return skia.Op(a, b, skia.PathOp.kIntersect_PathOp)


def poly_path(pts, close=True):
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    if close:
        p.close()
    return p


def smooth_closed_path(pts, tension=0.5):
    """Geschlossener Catmull-Rom-Pfad durch Punkte."""
    n = len(pts)
    p = skia.Path()
    p.moveTo(*pts[0])
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        p.cubicTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    p.close()
    return p


def star_path(cx, cy, r_out, r_in, n=4, rot=0.0):
    pts = []
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = rot + math.pi * i / n - math.pi / 2
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return poly_path(pts)


def check_path(cx, cy, s):
    """Häkchen als offene Linie (mit stroke zeichnen)."""
    p = skia.Path()
    p.moveTo(cx - 0.42 * s, cy + 0.02 * s)
    p.lineTo(cx - 0.12 * s, cy + 0.32 * s)
    p.lineTo(cx + 0.45 * s, cy - 0.30 * s)
    return p


# ------------------------------------------------------------------ Mathe / Easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0)) if e1 != e0 else (1.0 if x >= e1 else 0.0)
    return t * t * (3 - 2 * t)


def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in_cubic(t):
    t = clamp(t)
    return t ** 3


def ease_in_out(t):
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def spring01(t, freq=2.2, damp=0.38):
    """Gedämpfte Feder von 0 nach 1 (federndes Aufploppen), t in Sekunden."""
    if t <= 0:
        return 0.0
    w = 2 * math.pi * freq
    wd = w * math.sqrt(max(1e-6, 1 - damp ** 2))
    return 1 - math.exp(-damp * w * t) * (math.cos(wd * t) + damp * w / wd * math.sin(wd * t))


def pop(t, dur_in=0.0, freq=2.4, damp=0.42):
    """Skalierung fürs Aufploppen (startet bei 0, schwingt leicht über 1)."""
    return max(0.0, spring01(t - dur_in, freq, damp))


def noise1(t, seed=0, octaves=3):
    """Glattes Pseudo-Rauschen (Summe von Sinus) im Bereich ca. -1..1."""
    v = 0.0
    amp = 1.0
    tot = 0.0
    rng = np.random.RandomState(seed)
    for o in range(octaves):
        f = (0.35 + rng.rand() * 0.4) * (2 ** o)
        ph = rng.rand() * 6.283
        v += amp * math.sin(t * f * 6.283 + ph)
        tot += amp
        amp *= 0.5
    return v / tot


# ------------------------------------------------------------------ Text
def draw_text(c, text, x, y, f, color, align="left", alpha=1.0):
    w = f.measureText(text)
    if align == "center":
        x -= w / 2
    elif align == "right":
        x -= w
    c.drawString(text, x, y, f, fill(color, alpha))
    return w


def cap_height(f):
    m = f.getMetrics()
    return m.fCapHeight if m.fCapHeight > 0 else f.getSize() * 0.7


def glow(c, path, color, sigma, alpha=1.0):
    p = fill(color, alpha)
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, sigma))
    c.drawPath(path, p)


def radial_glow(c, cx, cy, r, color, alpha=1.0):
    col = hexc(color)
    cols = [skia.ColorSetA(col, int(255 * alpha)), skia.ColorSetA(col, int(110 * alpha)),
            skia.ColorSetA(col, 0)]
    sh = skia.GradientShader.MakeRadial(skia.Point(cx, cy), r, cols, [0.0, 0.35, 1.0])
    p = skia.Paint(AntiAlias=True)
    p.setShader(sh)
    c.drawCircle(cx, cy, r, p)
