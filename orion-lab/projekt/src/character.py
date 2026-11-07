"""Hauptfigur: junge Wissenschaftlerin als Comic-Karikatur.

Alle Masse in Pixel, Ursprung = Wurzelpunkt auf Höhe der Tischkante.
Die Figur wird über ein Rig (Parameter pro Bild) gesteuert.
"""
import math
from dataclasses import dataclass, field

import skia

from common import (NEON, NEON_DARK, ANTH, ANTH2, OUT, WHITE, GREY, SKIN, SKIN_SH, CHEEK, HAIR, HAIR_HI,
                    MOUTH_IN, TONGUE, OUTLINE, fill, stroke, draw_outlined, draw_limb, rrect_path,
                    circle_path, oval_path, capsule_path, union, smooth_closed_path, poly_path, clamp, lerp)
from logo import draw_badge

SHOULDER_L = (-112.0, -196.0)
SHOULDER_R = (112.0, -196.0)
L_UP = 120.0
L_LO = 118.0
SLEEVE_W = 50.0
NECK = (0.0, -232.0)      # Drehpunkt des Kopfes
HEAD_C = (0.0, -372.0)    # Kopfmitte (ungedreht)


@dataclass
class Arm:
    wx: float = -135.0     # Handgelenk relativ zur Wurzel
    wy: float = -12.0
    ang: float = 0.0       # absolute Richtung der Hand (Grad, 0 = nach rechts)
    shape: str = "rest"    # rest | open | point | fist | wave
    bend: float = 1.0      # Ellbogen nach aussen (+1) / innen (-1)


@dataclass
class Rig:
    x: float = 470.0
    y: float = 770.0
    dy: float = 0.0            # Sprung / Wippen
    stretch: float = 1.0       # Squash & Stretch (>1 = gestreckt)
    lean: float = 0.0          # Grad, + = zur Seite des Inhalts (rechts)
    breath: float = 0.0        # -1..1
    head_tilt: float = 0.0     # Grad
    head_nod: float = 0.0      # px nach unten
    head_turn: float = 0.0     # -1..1 (Gesicht leicht nach rechts)
    gaze_x: float = 0.0
    gaze_y: float = 0.0
    blink: float = 0.0         # 0 offen, 1 zu
    brow: float = 0.0          # -1 zusammengezogen .. +1 hochgezogen
    brow_think: float = 0.0    # einseitig hochgezogen (nachdenklich)
    mouth_open: float = 0.0
    mouth_wide: float = 0.0    # -1 rund (o/u) .. +1 breit (i/e)
    smile: float = 0.6
    ear_swing: float = 0.0     # Grad
    bun_swing: float = 0.0     # Grad
    armL: Arm = field(default_factory=lambda: Arm(-138, -10, 70, "rest", 1))
    armR: Arm = field(default_factory=lambda: Arm(138, -10, 110, "rest", 1))


# ------------------------------------------------------------------ Hände
def _hand_path(shape, flip):
    """Hand in lokalen Koordinaten (Handgelenk = Ursprung, Finger Richtung +x).
    flip = +1: Daumen auf -y-Seite, -1: gespiegelt."""
    s = flip
    if shape in ("open", "wave"):
        parts = [rrect_path(-4, -23, 50, 46, 19)]
        spec = [(-15, -20, 31), (-5, -7, 36), (5, 6, 34), (15, 19, 28)]
        for oy, a, L in spec:
            ar = math.radians(a)
            x0, y0 = 38, oy * s
            parts.append(capsule_path(x0, y0, x0 + L * math.cos(ar), y0 + L * math.sin(ar) * s, 7.2))
        parts.append(capsule_path(14, -17 * s, 14 + 26 * math.cos(math.radians(-62)),
                                  -17 * s + 26 * math.sin(math.radians(-62)) * s, 8.2))
        return union(*parts), []
    if shape == "point":
        parts = [rrect_path(-4, -22, 50, 44, 18),
                 capsule_path(36, -13 * s, 82, -16 * s, 7.6),
                 circle_path(46, -1 * s, 9), circle_path(45, 10 * s, 9), circle_path(41, 19 * s, 8),
                 capsule_path(14, -19 * s, 36, -24 * s, 7.6)]
        lines = [((40, 4 * s), (50, 4 * s)), ((38, 14 * s), (47, 15 * s))]
        return union(*parts), lines
    if shape == "fist":
        parts = [rrect_path(-4, -22, 50, 44, 18),
                 circle_path(46, -12 * s, 9), circle_path(48, -1 * s, 9), circle_path(47, 10 * s, 9),
                 circle_path(42, 19 * s, 8), capsule_path(18, -20 * s, 40, -18 * s, 8)]
        lines = [((42, -6 * s), (52, -6 * s)), ((42, 5 * s), (52, 5 * s)), ((40, 15 * s), (48, 15 * s))]
        return union(*parts), lines
    # rest: flach aufliegende Hand, Finger geschlossen
    parts = [rrect_path(-4, -22, 48, 44, 18)]
    for oy in (-15, -5, 5, 15):
        parts.append(capsule_path(36, oy * s * 0.95, 64 - abs(oy) * 0.35, oy * s * 1.05, 7.0))
    parts.append(capsule_path(12, -19 * s, 30, -30 * s, 7.6))
    lines = [((44, -10 * s), (58, -10 * s)), ((44, 0), (60, 0)), ((44, 10 * s), (58, 10 * s))]
    return union(*parts), lines


def draw_hand(c, x, y, ang, shape, flip):
    path, lines = _hand_path(shape, flip)
    c.save()
    c.translate(x, y)
    c.rotate(ang)
    draw_outlined(c, path, SKIN, OUTLINE)
    for a, b in lines:
        c.drawLine(a[0], a[1], b[0], b[1], stroke(OUT, 3.2))
    c.restore()


def _ik(sx, sy, wx, wy, side, pref=1.0):
    """Zwei-Gelenk-IK. Ellbogen bevorzugt unten und aussen (pref=-1: andere Lösung)."""
    dx, dy = wx - sx, wy - sy
    d = math.hypot(dx, dy)
    d = clamp(d, 20.0, L_UP + L_LO - 2.0)
    base = math.atan2(dy, dx)
    cosA = clamp((L_UP ** 2 + d ** 2 - L_LO ** 2) / (2 * L_UP * d), -1.0, 1.0)
    A = math.acos(cosA)
    cands = []
    for sgn in (1, -1):
        a = base + A * sgn
        ex, ey = sx + L_UP * math.cos(a), sy + L_UP * math.sin(a)
        score = (ey - sy) + 0.9 * side * (ex - sx)
        cands.append((score, (ex, ey)))
    cands.sort(key=lambda k: -k[0])
    ex, ey = cands[0][1] if pref >= 0 else cands[1][1]
    ux, uy = math.cos(base), math.sin(base)
    wx2, wy2 = sx + ux * d, sy + uy * d
    return (ex, ey), (wx2, wy2)


def draw_arm(c, arm, shoulder, side):
    """side = -1 (links im Bild) / +1 (rechts im Bild)."""
    sx, sy = shoulder
    (ex, ey), (wx, wy) = _ik(sx, sy, arm.wx, arm.wy, side, arm.bend)
    # Ärmel (Kittel)
    pts = [(sx, sy), (ex, ey), (wx, wy)]
    draw_limb(c, pts, SLEEVE_W, WHITE)
    # Schattenkante im Ärmel
    c.drawLine(sx + 10 * side, sy + 10, ex + 6 * side, ey, stroke(GREY, 9, 0.8))
    # Manschette
    fx, fy = wx - ex, wy - ey
    fl = math.hypot(fx, fy) or 1
    ux, uy = fx / fl, fy / fl
    cx0, cy0 = wx - ux * 16, wy - uy * 16
    nx, ny = -uy, ux
    cuff = poly_path([(cx0 + nx * 27, cy0 + ny * 27), (wx + nx * 25, wy + ny * 25),
                      (wx - nx * 25, wy - ny * 25), (cx0 - nx * 27, cy0 - ny * 27)])
    draw_outlined(c, cuff, "#E9EBE5", 4.0)
    # Hand
    flip = 1 if side > 0 else -1
    if arm.shape in ("open", "wave", "point") and math.cos(math.radians(arm.ang)) < 0:
        flip = -flip
    draw_hand(c, wx, wy, arm.ang, arm.shape, flip * (-1 if arm.shape == "rest" and side < 0 else 1))


# ------------------------------------------------------------------ Körper
def _coat_path(breath):
    b = breath * 3.0
    p = skia.Path()
    p.moveTo(-36, -236 - b)
    p.cubicTo(-70, -236 - b, -112, -232 - b, -134, -206 - b)
    p.cubicTo(-150, -186, -150, -150, -146, -110)
    p.lineTo(-156, 60)
    p.lineTo(156, 60)
    p.lineTo(146, -110)
    p.cubicTo(150, -150, 150, -186, 134, -206 - b)
    p.cubicTo(112, -232 - b, 70, -236 - b, 36, -236 - b)
    p.close()
    return p


def draw_torso(c, rig):
    b = rig.breath * 3.0
    coat = _coat_path(rig.breath)
    draw_outlined(c, coat, WHITE)
    # Seitenschatten
    c.save()
    c.clipPath(coat, doAntiAlias=True)
    sh = skia.Path()
    sh.moveTo(-160, -200)
    sh.cubicTo(-125, -150, -122, -60, -128, 60)
    sh.lineTo(-170, 60)
    sh.close()
    c.drawPath(sh, fill(GREY))
    c.restore()
    c.drawPath(coat, stroke(OUT, OUTLINE))
    # T-Shirt im V-Ausschnitt
    shirt = poly_path([(-40, -238 - b), (40, -238 - b), (6, -96), (-6, -96)])
    draw_outlined(c, shirt, ANTH2, 4.5)
    c.drawPath(oval_path(0, -236 - b, 30, 10), fill(SKIN))
    # Rundhals
    neckline = skia.Path()
    neckline.moveTo(-30, -238 - b)
    neckline.quadTo(0, -206 - b, 30, -238 - b)
    c.drawPath(neckline, stroke("#3A3D44", 7))
    # Revers
    lapL = poly_path([(-40, -238 - b), (-58, -224 - b), (-34, -170), (-6, -96)])
    lapR = poly_path([(40, -238 - b), (58, -224 - b), (34, -170), (6, -96)])
    draw_outlined(c, lapL, "#ECEEE8", 4.5)
    draw_outlined(c, lapR, "#ECEEE8", 4.5)
    # Knopfleiste
    c.drawLine(0, -96, 0, 40, stroke(OUT, 4.0))
    for y in (-60, -12):
        c.drawCircle(-10, y, 5.5, fill("#DADCD6"))
        c.drawCircle(-10, y, 5.5, stroke(OUT, 2.8))
    # Logo-Aufnäher (links im Bild)
    draw_badge(c, -78, -148, 40)
    # Brusttasche mit neongrünem Stift (rechts im Bild)
    pen = rrect_path(70, -204, 13, 60, 6.5)
    draw_outlined(c, pen, NEON, 3.6)
    c.drawPath(rrect_path(78, -199, 4, 30, 2), fill(NEON_DARK))
    c.drawCircle(76.5, -204, 5.5, fill("#E8F7C9"))
    c.drawCircle(76.5, -204, 5.5, stroke(OUT, 2.6))
    pocket = rrect_path(40, -156, 72, 58, 8)
    draw_outlined(c, pocket, WHITE, 4.5)
    c.drawLine(44, -142, 108, -142, stroke(GREY2_LINE, 3))


GREY2_LINE = "#C9CCC4"


def draw_neck(c, rig):
    neck = rrect_path(-27, -282, 54, 66, 16)
    draw_outlined(c, neck, SKIN, 4.5)
    c.drawPath(oval_path(0, -270, 26, 10), fill(SKIN_SH, 0.9))


# ------------------------------------------------------------------ Kopf
FACE_PTS = [(0, -138), (78, -126), (118, -72), (124, 6), (110, 70), (72, 114), (0, 132),
            (-72, 114), (-110, 70), (-124, 6), (-118, -72), (-78, -126)]


def _face_path():
    return smooth_closed_path(FACE_PTS, 0.9)


def _hair_back():
    pts = [(0, -186), (104, -168), (160, -100), (170, -10), (164, 66), (148, 104), (112, 110),
           (-112, 110), (-148, 104), (-164, 66), (-170, -10), (-160, -100), (-104, -168)]
    return smooth_closed_path(pts, 0.85)


def _hair_front():
    p = skia.Path()
    p.moveTo(-150, -4)
    p.cubicTo(-168, -70, -150, -150, -84, -182)
    p.cubicTo(-40, -200, 40, -200, 84, -182)
    p.cubicTo(150, -150, 168, -70, 150, -4)
    # Innenkante rechts (Strähne seitlich am Gesicht)
    p.cubicTo(142, -20, 132, -40, 124, -60)
    p.cubicTo(112, -84, 96, -96, 70, -88)
    # Pony (seitlich geschwungen)
    p.cubicTo(40, -78, 14, -66, -8, -70)
    p.cubicTo(-30, -74, -34, -100, -40, -104)
    p.cubicTo(-56, -84, -86, -74, -112, -66)
    p.cubicTo(-122, -50, -130, -30, -150, -4)
    p.close()
    return p


def draw_head(c, rig, t=0.0):
    turn = rig.head_turn * 9.0
    # Dutt (hinter der Haarkappe)
    c.save()
    c.translate(6, -170)
    c.rotate(rig.bun_swing)
    bun = circle_path(0, -46, 50)
    draw_outlined(c, bun, HAIR)
    sp = skia.Path()
    sp.moveTo(-22, -60)
    sp.cubicTo(-10, -84, 26, -74, 24, -46)
    sp.cubicTo(22, -22, -8, -20, -10, -40)
    c.drawPath(sp, stroke(HAIR_HI, 4.5))
    c.restore()
    # Haar hinten (Bob)
    draw_outlined(c, _hair_back(), HAIR)
    hb = skia.Path()
    hb.moveTo(-150, 70)
    hb.cubicTo(-140, 90, -120, 100, -100, 104)
    c.drawPath(hb, stroke(HAIR_HI, 4))
    hb2 = skia.Path()
    hb2.moveTo(150, 70)
    hb2.cubicTo(140, 90, 120, 100, 100, 104)
    c.drawPath(hb2, stroke(HAIR_HI, 4))
    # Ohren + Ohrringe
    for side in (-1, 1):
        ex = side * (122 - turn * 0.25 * side)
        ear = oval_path(ex, 14, 17, 25)
        draw_outlined(c, ear, SKIN, 4.5)
        inner = skia.Path()
        inner.moveTo(ex + side * 2, 2)
        inner.quadTo(ex + side * 9, 14, ex + side * 1, 26)
        c.drawPath(inner, stroke(SKIN_SH, 4))
        # Ohrring: Häkchen + neongrüner Anhänger, schwingt träge mit
        c.save()
        c.translate(ex + side * 3, 34)
        c.rotate(rig.ear_swing * (1.0 if side > 0 else 0.85))
        c.drawLine(0, 0, 0, 16, stroke(OUT, 3.4))
        drop = rrect_path(-9.5, 14, 19, 19, 5)
        draw_outlined(c, drop, NEON, 3.4)
        c.drawCircle(-3, 19, 2.6, fill("#E8FFC2"))
        c.restore()
    # Gesicht
    face = _face_path()
    draw_outlined(c, face, SKIN)
    c.save()
    c.clipPath(face, doAntiAlias=True)
    # Schatten unter dem Pony
    c.drawPath(oval_path(-10 + turn, -66, 120, 22), fill(SKIN_SH, 0.55))
    c.restore()
    c.drawPath(face, stroke(OUT, OUTLINE))
    # Wangen
    for side in (-1, 1):
        c.drawPath(oval_path(side * 80 + turn * 0.8, 60, 27, 15), fill(CHEEK, 0.62))
    # Augen
    _draw_eyes(c, rig, turn)
    # Nase
    nose = skia.Path()
    nose.moveTo(-5 + turn * 1.2, 34)
    nose.cubicTo(4 + turn * 1.2, 40, 6 + turn * 1.2, 46, -2 + turn * 1.2, 50)
    c.drawPath(nose, stroke(SKIN_SH, 5.5))
    c.drawPath(nose, stroke(OUT, 3.2))
    # Mund
    _draw_mouth(c, rig, turn)
    # Haar vorne
    hf = _hair_front()
    draw_outlined(c, hf, HAIR)
    hl = skia.Path()
    hl.moveTo(-96, -158)
    hl.cubicTo(-60, -180, -10, -186, 30, -178)
    c.drawPath(hl, stroke(HAIR_HI, 6))
    hl2 = skia.Path()
    hl2.moveTo(-20, -96)
    hl2.cubicTo(10, -120, 50, -128, 92, -116)
    c.drawPath(hl2, stroke(HAIR_HI, 4))
    # Haargummi neongrün
    c.save()
    c.translate(6, -170)
    c.rotate(rig.bun_swing * 0.6)
    band = rrect_path(-33, -16, 66, 22, 11)
    draw_outlined(c, band, NEON, 4.2)
    c.drawLine(-22, -9, 18, -9, stroke("#D6FF9A", 3.0))
    c.restore()


def _draw_eyes(c, rig, turn):
    blink = clamp(rig.blink)
    for side in (-1, 1):
        cx = side * 50 + turn
        cy = 6
        rx, ry = 30, 37
        open_k = 1 - blink
        # Augenbraue
        br = rig.brow * 13 + (rig.brow_think * 12 if side > 0 else -rig.brow_think * 4)
        by = -54 - br
        tilt = -rig.brow * 4 * side + (rig.brow < 0) * 0
        brow = skia.Path()
        brow.moveTo(cx - 27 * side * -1 if False else cx - 28, by + 8 + (tilt if side < 0 else -tilt))
        brow.quadTo(cx, by - 8, cx + 28, by + 8 + (-tilt if side < 0 else tilt))
        c.drawPath(brow, stroke(HAIR, 9.5))
        if open_k > 0.12:
            ry2 = ry * open_k
            sclera = oval_path(cx, cy + (ry - ry2) * 0.55, rx, ry2)
            c.drawPath(sclera, fill("#FFFFFF"))
            c.save()
            c.clipPath(sclera, doAntiAlias=True)
            ix = cx + rig.gaze_x * 9 + turn * 0.4
            iy = cy + 4 + rig.gaze_y * 7
            c.drawCircle(ix, iy, 23, fill("#3A2A24"))
            c.drawCircle(ix, iy, 23, stroke("#2A1E1A", 3))
            c.drawCircle(ix, iy + 2, 12.5, fill(OUT))
            c.drawCircle(ix - 8, iy - 9, 7.5, fill("#FFFFFF"))
            c.drawCircle(ix + 8, iy + 9, 3.5, fill("#FFFFFF", 0.9))
            # Oberlid-Schatten
            c.drawPath(oval_path(cx, cy - ry2 - 4, rx + 6, 12), fill(SKIN_SH, 0.5))
            c.restore()
            c.drawPath(sclera, stroke(OUT, 4.2))
            # dickes Oberlid + Wimpern
            lid = skia.Path()
            top = cy + (ry - ry2) * 0.55 - ry2
            lid.moveTo(cx - rx - 2, cy + (ry - ry2) * 0.55 - ry2 * 0.15)
            lid.cubicTo(cx - rx * 0.7, top - 3, cx + rx * 0.7, top - 3, cx + rx + 3, cy + (ry - ry2) * 0.55 - ry2 * 0.2)
            c.drawPath(lid, stroke(OUT, 7.5))
            ox = cx + side * rx * 0.92
            oy = cy + (ry - ry2) * 0.55 - ry2 * 0.35
            for k, (dx, dy) in enumerate([(13, -12), (16, -2), (8, -18)]):
                c.drawLine(ox - side * 2, oy + (k == 1) * 6 - (k == 2) * 8, ox + side * dx, oy + dy + (k == 1) * 6 - (k == 2) * 8,
                           stroke(OUT, 4.2))
        else:
            # geschlossen: Bogen nach unten
            lid = skia.Path()
            lid.moveTo(cx - rx, cy + 10)
            lid.quadTo(cx, cy + 26, cx + rx, cy + 10)
            c.drawPath(lid, stroke(OUT, 6.5))
            ox = cx + side * rx
            c.drawLine(ox, cy + 10, ox + side * 12, cy + 2, stroke(OUT, 4.2))
            c.drawLine(ox - side * 6, cy + 16, ox + side * 8, cy + 14, stroke(OUT, 4.2))


def _draw_mouth(c, rig, turn):
    o = clamp(rig.mouth_open)
    w = clamp(rig.mouth_wide, -1, 1)
    s = clamp(rig.smile)
    cx = turn * 1.1
    cy = 86
    hw = 30 + 11 * w + 4 * s - (8 * o if w < 0 else 0)
    hw = max(14.0, hw)
    corner_y = cy - 7 * s
    if o < 0.07:
        p = skia.Path()
        p.moveTo(cx - hw, corner_y)
        p.quadTo(cx, cy + 8 + 12 * s, cx + hw, corner_y)
        c.drawPath(p, stroke(OUT, 5.2))
        for side in (-1, 1):
            c.drawLine(cx + side * hw, corner_y, cx + side * (hw + 5), corner_y - 4, stroke(OUT, 3.6))
        return
    h = 6 + o * 44 * (1.0 + 0.25 * max(0.0, -w))
    roundness = max(0.0, -w)
    top_y = cy - 4 - o * 4 + 3 * s
    bot_y = cy + h - 2 * s
    k_top = 0.55 + 0.35 * roundness
    k_bot = 0.62 + 0.4 * roundness
    p = skia.Path()
    lx, rx_ = cx - hw, cx + hw
    p.moveTo(lx, corner_y)
    p.cubicTo(lx + hw * (1 - k_top), top_y - 2, rx_ - hw * (1 - k_top), top_y - 2, rx_, corner_y)
    p.cubicTo(rx_ - hw * (1 - k_bot) * 0.2, bot_y + 2, lx + hw * (1 - k_bot) * 0.2, bot_y + 2, lx, corner_y)
    p.close()
    c.drawPath(p, fill(MOUTH_IN))
    c.save()
    c.clipPath(p, doAntiAlias=True)
    if o > 0.18:
        c.drawPath(rrect_path(cx - hw, top_y - 10, 2 * hw, 10 + 8 * min(1.0, o * 1.6), 4), fill("#FFFFFF"))
    c.drawPath(oval_path(cx, bot_y + 2, hw * 0.62, 6 + 10 * o), fill(TONGUE))
    c.restore()
    c.drawPath(p, stroke(OUT, 5.0))


# ------------------------------------------------------------------ Gesamt
def head_transform(c, rig):
    """Kopf-Koordinatensystem (Ursprung Kopfmitte) auf den Canvas anwenden."""
    c.translate(NECK[0], NECK[1] + rig.head_nod * 0.4 - rig.breath * 2.5)
    c.rotate(rig.head_tilt)
    c.translate(HEAD_C[0] - NECK[0], HEAD_C[1] - NECK[1] + rig.head_nod)


def body_transform(c, rig):
    c.translate(rig.x, rig.y + rig.dy)
    # Squash & Stretch um die Wurzel
    sx = 1.0 / math.sqrt(max(0.5, rig.stretch))
    c.scale(sx, rig.stretch)
    # Lehnen um einen tiefer liegenden Drehpunkt
    c.translate(0, 160)
    c.rotate(rig.lean)
    c.translate(0, -160)


def draw_character_body(c, rig, t=0.0):
    """Alles ausser den Armen (die kommen über die Tischplatte)."""
    c.save()
    body_transform(c, rig)
    draw_torso(c, rig)
    draw_neck(c, rig)
    c.save()
    head_transform(c, rig)
    draw_head(c, rig, t)
    c.restore()
    c.restore()


def draw_character_arms(c, rig):
    c.save()
    body_transform(c, rig)
    # Arm, der weiter "vorne" ist, zuletzt zeichnen
    order = [(rig.armL, SHOULDER_L, -1), (rig.armR, SHOULDER_R, 1)]
    if rig.armL.wy < rig.armR.wy - 40 and rig.armL.wx > -60:
        order.reverse()
    for arm, sh, side in order:
        draw_arm(c, arm, sh, side)
    c.restore()


def mouth_world(rig):
    """Ungefähre Mundposition in Bildkoordinaten (für den Blasenschweif)."""
    m = skia.Matrix()
    m.setTranslate(rig.x, rig.y + rig.dy)
    sx = 1.0 / math.sqrt(max(0.5, rig.stretch))
    m.preScale(sx, rig.stretch)
    m.preTranslate(0, 160)
    m.preRotate(rig.lean)
    m.preTranslate(0, -160)
    m.preTranslate(NECK[0], NECK[1] + rig.head_nod * 0.4 - rig.breath * 2.5)
    m.preRotate(rig.head_tilt)
    m.preTranslate(HEAD_C[0] - NECK[0], HEAD_C[1] - NECK[1] + rig.head_nod)
    pt = m.mapXY(rig.head_turn * 9 + 20, 90)
    return pt.x(), pt.y()
