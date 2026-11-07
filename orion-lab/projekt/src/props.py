"""Requisiten: Tisch, Papiere, Bildschirm, Icons, Kolben, Etiketten, Karte, CTA."""
import math

import numpy as np
import skia

from common import (NEON, NEON_DARK, ANTH, ANTH2, ANTH3, OUT, WHITE, GREY, GREY2, TEXTGREY, OUTLINE,
                    hexc, fill, stroke, draw_outlined, draw_limb, rrect_path, circle_path, oval_path,
                    capsule_path, union, diff, poly_path, star_path, check_path, font, draw_text,
                    clamp, lerp, glow, radial_glow, cap_height)
from logo import draw_logo, logo_geometry, draw_wordmark, wordmark_width

# ------------------------------------------------------------------ Tisch
TABLE_X0, TABLE_X1 = 64, 884
TABLE_TOP = 752
TABLE_EDGE = 786


def draw_table_top(c):
    top = poly_path([(TABLE_X0 + 10, TABLE_TOP), (TABLE_X1 - 10, TABLE_TOP),
                     (TABLE_X1, TABLE_EDGE), (TABLE_X0, TABLE_EDGE)])
    sh = skia.GradientShader.MakeLinear([skia.Point(0, TABLE_TOP), skia.Point(0, TABLE_EDGE)],
                                        [hexc("#3A3D44"), hexc("#2A2C31")], [0, 1])
    p = skia.Paint(AntiAlias=True)
    p.setShader(sh)
    c.drawPath(top, p)
    c.drawPath(top, stroke(OUT, OUTLINE))


def draw_table_front(c, t, contact_alpha=0.0, logo_scale=1.0):
    front = rrect_path(TABLE_X0, TABLE_EDGE, TABLE_X1 - TABLE_X0, 400, 6)
    draw_outlined(c, front, ANTH)
    # dezente Paneel-Fuge
    c.drawPath(rrect_path(TABLE_X0 + 26, TABLE_EDGE + 30, TABLE_X1 - TABLE_X0 - 52, 400, 14),
               stroke("#24262B", 4))
    # neongrüne Leuchtkante
    edge = skia.Path()
    edge.moveTo(TABLE_X0 + 4, TABLE_EDGE + 2)
    edge.lineTo(TABLE_X1 - 4, TABLE_EDGE + 2)
    pulse = 0.85 + 0.15 * math.sin(t * 2.1)
    gp = stroke(NEON, 16, 0.55 * pulse)
    gp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 9))
    c.drawPath(edge, gp)
    c.drawPath(edge, stroke(NEON, 5.5))
    c.drawPath(edge, stroke("#D9FFA6", 1.8))
    # Logo vorne auf dem Tisch
    cx = (TABLE_X0 + TABLE_X1) / 2 + 6
    D = 112 * logo_scale
    g = logo_geometry(D)
    lw = g["right"] - g["left"]
    ly = 892 if contact_alpha <= 0 else lerp(892, 870, clamp(contact_alpha))
    draw_logo(c, cx - lw / 2 + D / 2, ly, D)
    if contact_alpha > 0:
        f = font(36, "Medium")
        txt = "hallo@orion-lab.ch  ·  orion-lab.ch"
        draw_text(c, txt, cx, 986 + 14 * (1 - contact_alpha), f, WHITE, "center", contact_alpha)
        tw = f.measureText(txt)
        c.drawLine(cx - tw / 2, 1004, cx - tw / 2 + tw * contact_alpha, 1004, stroke(NEON, 3, contact_alpha))


# ------------------------------------------------------------------ Papiere
PAPERS = [
    ("Broschüre", "lines"), ("Preisliste", "table"), ("AGB", "para"),
    ("FAQ", "qa"), ("Handbuch", "lines"), ("Datenblatt", "table"),
]


def draw_paper(c, x, y, rot, scale, idx, alpha=1.0):
    title, kind = PAPERS[idx % len(PAPERS)]
    w, h = 230, 300
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(scale, scale)
    # Schatten
    c.drawPath(rrect_path(-w / 2 + 9, -h / 2 + 11, w, h, 10), fill(OUT, 0.35 * alpha))
    pg = rrect_path(-w / 2, -h / 2, w, h, 10)
    draw_outlined(c, pg, "#FBFBF8", OUTLINE, alpha=alpha)
    # Eselsohr
    fold = poly_path([(w / 2 - 34, -h / 2), (w / 2, -h / 2 + 34), (w / 2 - 34, -h / 2 + 34)])
    draw_outlined(c, fold, "#E1E3DC", 4, alpha=alpha)
    f = font(31, "SemiBold")
    draw_text(c, title, -w / 2 + 22, -h / 2 + 48, f, ANTH, alpha=alpha)
    c.drawLine(-w / 2 + 22, -h / 2 + 60, -w / 2 + 22 + f.measureText(title), -h / 2 + 60, stroke(NEON, 5, alpha))
    rng = np.random.RandomState(idx * 13 + 1)
    y0 = -h / 2 + 88
    gc = "#B6BAB1"
    if kind == "table":
        for r in range(8):
            yy = y0 + r * 23
            c.drawPath(rrect_path(-w / 2 + 22, yy, 100 + rng.randint(-20, 20), 9, 4.5), fill(gc, alpha))
            c.drawPath(rrect_path(w / 2 - 70, yy, 46, 9, 4.5), fill("#8E9389", alpha))
            c.drawLine(-w / 2 + 20, yy + 16, w / 2 - 20, yy + 16, stroke("#E3E5DF", 2, alpha))
    elif kind == "qa":
        for r in range(4):
            yy = y0 + r * 46
            c.drawPath(rrect_path(-w / 2 + 22, yy, 14, 12, 3), fill(NEON, alpha))
            c.drawPath(rrect_path(-w / 2 + 44, yy, 120 + rng.randint(-20, 30), 11, 5), fill("#8E9389", alpha))
            c.drawPath(rrect_path(-w / 2 + 44, yy + 19, 150 + rng.randint(-30, 10), 8, 4), fill(gc, alpha))
    else:
        nl = 9 if kind == "lines" else 11
        dy = 20 if kind == "lines" else 17
        for r in range(nl):
            yy = y0 + r * dy
            ww = (w - 44) * (0.55 + 0.45 * rng.rand()) if r % 4 == 3 else (w - 44) * (0.88 + 0.12 * rng.rand())
            hh = 8 if kind == "lines" else 6.5
            c.drawPath(rrect_path(-w / 2 + 22, yy, ww, hh, hh / 2), fill(gc, alpha))
    c.restore()


def draw_qmark(c, x, y, s, rot, alpha=1.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(s, s)
    f = font(150, "Bold")
    blob = skia.TextBlob.MakeFromString("?", f)
    wq = f.measureText("?")
    c.drawTextBlob(blob, -wq / 2 + 6, 56, fill(OUT, 0.4 * alpha))
    c.drawTextBlob(blob, -wq / 2, 50, stroke(OUT, 14, alpha))
    c.drawTextBlob(blob, -wq / 2, 50, fill(NEON, alpha))
    c.restore()


# ------------------------------------------------------------------ Bildschirm
SCREEN_C = (1404, 540)
SCREEN_W, SCREEN_H = 780, 460


def screen_inner():
    cx, cy = SCREEN_C
    return skia.Rect.MakeXYWH(cx - SCREEN_W / 2 + 22, cy - SCREEN_H / 2 + 22, SCREEN_W - 44, SCREEN_H - 44)


def draw_screen_frame(c, t):
    cx, cy = SCREEN_C
    # Ständer
    draw_limb(c, [(cx, cy + SCREEN_H / 2), (cx, 842)], 30, "#3A3D44")
    base = rrect_path(cx - 120, 832, 240, 26, 13)
    draw_outlined(c, base, "#3A3D44")
    # Schatten
    c.drawPath(rrect_path(cx - SCREEN_W / 2 + 12, cy - SCREEN_H / 2 + 14, SCREEN_W, SCREEN_H, 30), fill(OUT, 0.35))
    frame = rrect_path(cx - SCREEN_W / 2, cy - SCREEN_H / 2, SCREEN_W, SCREEN_H, 30)
    draw_outlined(c, frame, "#2A2C31")
    inner = screen_inner()
    ip = skia.Path()
    ip.addRRect(skia.RRect.MakeRectXY(inner, 14, 14))
    sh = skia.GradientShader.MakeLinear([skia.Point(inner.left(), inner.top()), skia.Point(inner.left(), inner.bottom())],
                                        [hexc("#2C2F35"), hexc("#1E2024")], [0, 1])
    p = skia.Paint(AntiAlias=True)
    p.setShader(sh)
    c.drawPath(ip, p)
    c.drawPath(ip, stroke(OUT, 4))
    # Spiegelung
    c.save()
    c.clipPath(ip, doAntiAlias=True)
    refl = poly_path([(inner.left() + 40, inner.top()), (inner.left() + 160, inner.top()),
                      (inner.left() + 20, inner.bottom()), (inner.left() - 100, inner.bottom())])
    c.drawPath(refl, fill("#FFFFFF", 0.035))
    c.restore()
    # Status-LED
    c.drawCircle(cx + SCREEN_W / 2 - 34, cy + SCREEN_H / 2 - 11, 4.5, fill(NEON))
    return ip


def draw_play(c, cx, cy, r, alpha=1.0, color=NEON):
    draw_outlined(c, circle_path(cx, cy, r), color, OUTLINE, alpha=alpha)
    tri = poly_path([(cx - r * 0.3, cy - r * 0.42), (cx + r * 0.48, cy), (cx - r * 0.3, cy + r * 0.42)])
    c.drawPath(tri, fill(ANTH, alpha))
    c.drawPath(tri, stroke(ANTH, r * 0.12, alpha))


def draw_bulb(c, cx, cy, s, glow_k=1.0, alpha=1.0):
    c.save()
    c.translate(cx, cy)
    c.scale(s, s)
    if glow_k > 0:
        radial_glow(c, 0, -10, 105, NEON, 0.45 * glow_k * alpha)
    bulb = union(circle_path(0, -18, 50), rrect_path(-24, 8, 48, 34, 10))
    draw_outlined(c, bulb, "#F6FFE6", OUTLINE, alpha=alpha)
    c.drawPath(oval_path(-16, -36, 12, 18), fill("#FFFFFF", alpha))
    fil = skia.Path()
    fil.moveTo(-14, 6)
    fil.lineTo(-8, -18)
    fil.lineTo(0, -6)
    fil.lineTo(8, -18)
    fil.lineTo(14, 6)
    c.drawPath(fil, stroke(NEON_DARK, 5, alpha))
    base = rrect_path(-22, 40, 44, 26, 7)
    draw_outlined(c, base, "#7B8088", 4.5, alpha=alpha)
    c.drawLine(-22, 49, 22, 49, stroke(OUT, 3.5, alpha))
    c.drawLine(-22, 58, 22, 58, stroke(OUT, 3.5, alpha))
    for k in range(5):
        a = math.radians(-90 + (k - 2) * 34)
        c.drawLine(math.cos(a) * 66, -18 + math.sin(a) * 66, math.cos(a) * 84, -18 + math.sin(a) * 84,
                   stroke(NEON, 7, alpha * glow_k))
    c.restore()


def draw_smiley(c, cx, cy, s, alpha=1.0, wink=0.0):
    c.save()
    c.translate(cx, cy)
    c.scale(s, s)
    draw_outlined(c, circle_path(0, 0, 62), NEON, OUTLINE, alpha=alpha)
    c.drawPath(oval_path(-22, -14, 7.5, 12), fill(ANTH, alpha))
    if wink > 0.5:
        c.drawLine(12, -14, 32, -14, stroke(ANTH, 7, alpha))
    else:
        c.drawPath(oval_path(22, -14, 7.5, 12), fill(ANTH, alpha))
    m = skia.Path()
    m.moveTo(-34, 12)
    m.cubicTo(-20, 44, 20, 44, 34, 12)
    m.close()
    c.drawPath(m, fill(ANTH, alpha))
    c.drawPath(m, stroke(ANTH, 4, alpha))
    c.drawPath(oval_path(-40, 10, 10, 6), fill("#FFFFFF", 0.35 * alpha))
    c.restore()


def draw_arrow(c, x0, x1, y, prog, alpha=1.0):
    if prog <= 0:
        return
    xe = lerp(x0, x1, clamp(prog))
    c.drawLine(x0, y, xe - 14, y, stroke(NEON, 12, alpha))
    head = poly_path([(xe + 8, y), (xe - 26, y - 24), (xe - 26, y + 24)])
    c.drawPath(head, fill(NEON, alpha))
    c.drawPath(head, stroke(NEON, 5, alpha))


def draw_label_text(c, text, cx, y, size=34, color=WHITE, alpha=1.0):
    f = font(size, "SemiBold")
    draw_text(c, text, cx, y, f, color, "center", alpha)


def draw_pill(c, cx, cy, text, s, check_k, alpha=1.0):
    f = font(50, "SemiBold")
    tw = f.measureText(text)
    w = tw + 150
    h = 86
    c.save()
    c.translate(cx, cy)
    c.scale(s, s)
    c.drawPath(rrect_path(-w / 2 + 7, -h / 2 + 9, w, h, h / 2), fill(OUT, 0.35 * alpha))
    pill = rrect_path(-w / 2, -h / 2, w, h, h / 2)
    draw_outlined(c, pill, WHITE, OUTLINE, alpha=alpha)
    # Check-Kreis
    ccx = -w / 2 + 50
    r = 28
    k = clamp(check_k)
    draw_outlined(c, circle_path(ccx, 0, r), NEON if k > 0 else "#E6E8E2", 4.5, alpha=alpha)
    if k > 0:
        ck = check_path(ccx, 2, 34)
        meas = skia.PathMeasure(ck, False)
        L = meas.getLength()
        seg = skia.Path()
        meas.getSegment(0, L * k, seg, True)
        c.drawPath(seg, stroke(ANTH, 8, alpha))
    draw_text(c, text, -w / 2 + 96, 18, f, ANTH, alpha=alpha)
    c.restore()


# ------------------------------------------------------------------ Branchen-Icons
BRANCHES = ["Handwerk", "Gastronomie", "Praxis", "Software", "Detailhandel", "Immobilien"]
ICON_POS = [(1150, 440), (1410, 440), (1670, 440), (1150, 712), (1410, 712), (1670, 712)]
CARD_W, CARD_H = 222, 236


def _icon_glyph(c, kind):
    ow = 5.0
    if kind == 0:  # Handwerk: Hammer + Schraubenschlüssel
        c.save()
        c.rotate(40)
        draw_outlined(c, rrect_path(-9, -40, 18, 100, 8), "#3A3D44", ow)
        draw_outlined(c, rrect_path(-11, 26, 22, 36, 8), NEON, ow)
        head = union(rrect_path(-40, -62, 80, 30, 6), rrect_path(30, -58, 20, 22, 4))
        draw_outlined(c, head, GREY2, ow)
        c.restore()
        c.save()
        c.rotate(-40)
        wr = union(rrect_path(-9, -30, 18, 92, 9), circle_path(0, -42, 24))
        wr = diff(wr, rrect_path(-9, -74, 18, 32, 4))
        draw_outlined(c, wr, WHITE, ow)
        c.restore()
    elif kind == 1:  # Gastronomie: Cloche mit Teller
        draw_outlined(c, rrect_path(-70, 34, 140, 16, 8), WHITE, ow)
        dome = skia.Path()
        dome.moveTo(-60, 34)
        dome.cubicTo(-60, -40, 60, -40, 60, 34)
        dome.close()
        draw_outlined(c, dome, GREY, ow)
        c.drawLine(-36, 6, -24, -16, stroke(WHITE, 7))
        draw_outlined(c, circle_path(0, -26, 11), NEON, ow)
        for k in (-26, 0, 26):
            s = skia.Path()
            s.moveTo(k, -48)
            s.cubicTo(k + 10, -58, k - 10, -66, k, -76)
            c.drawPath(s, stroke(TEXTGREY, 5))
    elif kind == 2:  # Praxis: Kreuz + Herzschlag
        cross = union(rrect_path(-18, -56, 36, 92, 9), rrect_path(-46, -28, 92, 36, 9))
        draw_outlined(c, cross, NEON, ow)
        pl = skia.Path()
        pl.moveTo(-64, 54)
        for x, y in [(-30, 54), (-18, 36), (-4, 70), (10, 44), (22, 54), (64, 54)]:
            pl.lineTo(x, y)
        c.drawPath(pl, stroke(ANTH, 7))
    elif kind == 3:  # Software: Laptop mit </>
        draw_outlined(c, rrect_path(-62, -50, 124, 82, 8), "#2A2C31", ow)
        draw_outlined(c, poly_path([(-78, 32), (78, 32), (88, 50), (-88, 50)]), GREY2, ow)
        f = font(44, "Bold")
        draw_text(c, "</>", 0, 6, f, NEON, "center")
    elif kind == 4:  # Detailhandel: Einkaufstasche
        bag = poly_path([(-50, -20), (50, -20), (58, 60), (-58, 60)])
        h = skia.Path()
        h.moveTo(-24, -20)
        h.cubicTo(-24, -70, 24, -70, 24, -20)
        c.drawPath(h, stroke(OUT, 14))
        c.drawPath(h, stroke(GREY, 6))
        draw_outlined(c, bag, NEON, ow)
        draw_outlined(c, rrect_path(-22, 10, 44, 26, 6), WHITE, 4)
    else:  # Immobilien: Haus mit Schlüssel
        draw_outlined(c, rrect_path(-50, -14, 100, 74, 4), WHITE, ow)
        roof = poly_path([(-66, -8), (0, -68), (66, -8)])
        draw_outlined(c, roof, "#3A3D44", ow)
        draw_outlined(c, rrect_path(-14, 18, 28, 42, 4), NEON, 4.5)
        draw_outlined(c, rrect_path(22, 2, 20, 20, 3), "#BFE7F0", 4)
        c.drawCircle(-6, 40, 3, fill(OUT))


def draw_icon_card(c, cx, cy, kind, s, check_s=0.0, alpha=1.0, wob=0.0):
    if s <= 0.01:
        return
    c.save()
    c.translate(cx, cy)
    c.rotate(wob)
    c.scale(s, s)
    c.drawPath(rrect_path(-CARD_W / 2 + 8, -CARD_H / 2 + 10, CARD_W, CARD_H, 28), fill(OUT, 0.35 * alpha))
    card = rrect_path(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 28)
    draw_outlined(c, card, WHITE, OUTLINE, alpha=alpha)
    c.save()
    c.translate(0, -26)
    c.scale(0.92, 0.92)
    _icon_glyph(c, kind)
    c.restore()
    f = font(31, "SemiBold")
    draw_text(c, BRANCHES[kind], 0, CARD_H / 2 - 24, f, ANTH, "center", alpha)
    if check_s > 0.01:
        c.save()
        c.translate(CARD_W / 2 - 14, -CARD_H / 2 + 14)
        c.scale(check_s, check_s)
        draw_outlined(c, circle_path(0, 0, 34), NEON, OUTLINE)
        c.drawPath(check_path(0, 2, 38), stroke(ANTH, 8.5))
        c.restore()
    c.restore()


# ------------------------------------------------------------------ Erlenmeyerkolben
FLASK_CX = 1486
FLASK_BASE = 846
FLASK_H = 528


def flask_path(cx=FLASK_CX, base=FLASK_BASE, h=FLASK_H, inset=0.0):
    nw = 132 - 2 * inset
    neck_top = base - h + inset * 0.4
    neck_bot = base - h * 0.64
    bw = 500 - 2 * inset
    b = base - inset
    p = skia.Path()
    p.moveTo(cx - nw / 2, neck_top)
    p.lineTo(cx + nw / 2, neck_top)
    p.lineTo(cx + nw / 2, neck_bot)
    p.lineTo(cx + bw / 2 - 26, b - 34)
    p.quadTo(cx + bw / 2 + 4, b - 2, cx + bw / 2 - 40, b)
    p.lineTo(cx - bw / 2 + 40, b)
    p.quadTo(cx - bw / 2 - 4, b - 2, cx - bw / 2 + 26, b - 34)
    p.lineTo(cx - nw / 2, neck_bot)
    p.close()
    return p


def flask_level_y(level, h=FLASK_H, base=FLASK_BASE):
    """level 0..1 -> y (0 = Boden, 1 = Halsansatz)."""
    return base - 12 - level * (h * 0.64 - 12)


def draw_flask(c, t, level, glow_k=0.0, bubble_k=1.0, floaters=(), alpha=1.0):
    cx = FLASK_CX
    outer = flask_path()
    inner = flask_path(inset=7)
    if glow_k > 0:
        radial_glow(c, cx, FLASK_BASE - 200, 520 * (0.8 + 0.2 * glow_k), NEON, 0.55 * glow_k)
        # Lichtstrahlen
        c.save()
        c.translate(cx, FLASK_BASE - 230)
        c.rotate(t * 18)
        for k in range(12):
            ray = poly_path([(0, 0), (520, -34), (520, 34)])
            c.save()
            c.rotate(k * 30)
            rp = fill(NEON, 0.10 * glow_k)
            rp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 8))
            c.drawPath(ray, rp)
            c.restore()
        c.restore()
    # Schatten am Boden
    c.drawPath(oval_path(cx + 10, FLASK_BASE + 4, 270, 16), fill(OUT, 0.45))
    # Glas
    c.drawPath(outer, fill("#DDEBE6", 0.20))
    # Flüssigkeit
    ly = flask_level_y(level)
    c.save()
    c.clipPath(inner, doAntiAlias=True)
    surf = skia.Path()
    surf.moveTo(cx - 300, ly)
    for i in range(0, 61):
        x = cx - 300 + i * 10
        surf.lineTo(x, ly + 5 * math.sin(x * 0.035 + t * 5.5) + 3 * math.sin(x * 0.07 - t * 3.1))
    surf.lineTo(cx + 300, FLASK_BASE + 10)
    surf.lineTo(cx - 300, FLASK_BASE + 10)
    surf.close()
    bright = 1.0 + 0.5 * glow_k
    sh = skia.GradientShader.MakeLinear([skia.Point(0, ly), skia.Point(0, FLASK_BASE)],
                                        [hexc("#B8F25A"), hexc(NEON), hexc("#5E9A10")], [0, 0.35, 1])
    lp = skia.Paint(AntiAlias=True)
    lp.setShader(sh)
    c.drawPath(surf, lp)
    # Blasen
    rng = np.random.RandomState(5)
    nb = int(18 + 30 * bubble_k)
    for i in range(nb):
        speed = rng.uniform(60, 140) * (0.7 + 0.6 * bubble_k)
        x0 = cx + rng.uniform(-200, 200)
        ph = rng.uniform(0, 10)
        span = FLASK_BASE - ly + 20
        if span < 30:
            continue
        yy = FLASK_BASE - 10 - ((t + ph) * speed) % span
        xx = x0 + 8 * math.sin((t + ph) * 4 + i)
        r = rng.uniform(5, 13) * (0.6 + 0.4 * bubble_k)
        c.drawCircle(xx, yy, r, fill("#EFFFD6", 0.85))
        c.drawCircle(xx, yy, r, stroke(NEON_DARK, 2.5))
    # schwimmende Etiketten (im Glas, vor den Blasen)
    for (txt, fx, fy, frot, fs) in floaters:
        draw_tag(c, fx, fy, txt, fs, frot, alpha=1.0, tint=0.10)
    if glow_k > 0:
        c.drawPath(surf, fill("#E9FFC9", 0.35 * glow_k))
    c.restore()
    # Oberflächenlinie
    c.save()
    c.clipPath(inner, doAntiAlias=True)
    sl = skia.Path()
    sl.moveTo(cx - 300, ly)
    for i in range(0, 61):
        x = cx - 300 + i * 10
        sl.lineTo(x, ly + 5 * math.sin(x * 0.035 + t * 5.5) + 3 * math.sin(x * 0.07 - t * 3.1))
    c.drawPath(sl, stroke("#DFFFB0", 5))
    c.restore()
    # Skala
    for k in range(4):
        yy = FLASK_BASE - 90 - k * 62
        c.drawLine(cx - 150 + k * 14, yy, cx - 112 + k * 14, yy, stroke("#FFFFFF", 4, 0.6))
    # Glanzlichter + Kontur
    c.drawLine(cx - 44, FLASK_BASE - FLASK_H + 40, cx - 44, FLASK_BASE - FLASK_H * 0.66, stroke("#FFFFFF", 9, 0.55))
    hl = skia.Path()
    hl.moveTo(cx - 70, FLASK_BASE - FLASK_H * 0.58)
    hl.lineTo(cx - 170, FLASK_BASE - 120)
    c.drawPath(hl, stroke("#FFFFFF", 10, 0.45))
    c.drawPath(outer, stroke(OUT, 6.5))
    # Lippe
    lip = rrect_path(cx - 84, FLASK_BASE - FLASK_H - 16, 168, 30, 15)
    draw_outlined(c, lip, "#E6F0EC", 6)


def draw_tag(c, x, y, text, s, rot, alpha=1.0, tint=0.0):
    f = font(38, "SemiBold")
    tw = f.measureText(text)
    w = tw + 92
    h = 72
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(s, s)
    if tint == 0:
        c.drawPath(rrect_path(-w / 2 + 7, -h / 2 + 9, w, h, 16), fill(OUT, 0.35 * alpha))
    tag = union(rrect_path(-w / 2 + 18, -h / 2, w - 18, h, 16),
                poly_path([(-w / 2 + 22, -h / 2), (-w / 2, 0), (-w / 2 + 22, h / 2)]))
    draw_outlined(c, tag, WHITE, OUTLINE, alpha=alpha)
    c.drawCircle(-w / 2 + 26, 0, 9, fill(NEON, alpha))
    c.drawCircle(-w / 2 + 26, 0, 9, stroke(OUT, 4, alpha))
    draw_text(c, text, -w / 2 + 50, 13, f, ANTH, alpha=alpha)
    if tint > 0:
        c.drawPath(tag, fill(NEON, tint))
    c.restore()


# ------------------------------------------------------------------ Videokarte
def draw_video_card(c, cx, cy, s, rot, t, alpha=1.0):
    w, h = 470, 330
    c.save()
    c.translate(cx, cy)
    c.rotate(rot)
    c.scale(s, s)
    c.drawPath(rrect_path(-w / 2 + 10, -h / 2 + 12, w, h, 26), fill(OUT, 0.4 * alpha))
    card = rrect_path(-w / 2, -h / 2, w, h, 26)
    draw_outlined(c, card, WHITE, OUTLINE, alpha=alpha)
    scr = rrect_path(-w / 2 + 18, -h / 2 + 18, w - 36, 214, 16)
    draw_outlined(c, scr, "#24262B", 4.5, alpha=alpha)
    c.save()
    c.clipPath(scr, doAntiAlias=True)
    radial_glow(c, 0, -h / 2 + 125, 200, NEON, 0.35 * alpha)
    c.restore()
    draw_play(c, 0, -h / 2 + 125, 56, alpha)
    # Fortschrittsbalken
    by = -h / 2 + 214
    c.drawPath(rrect_path(-w / 2 + 40, by - 18, w - 80, 8, 4), fill("#4A4D55", alpha))
    pk = (t * 0.25) % 1.0
    c.drawPath(rrect_path(-w / 2 + 40, by - 18, (w - 80) * pk, 8, 4), fill(NEON, alpha))
    f = font(40, "SemiBold")
    draw_text(c, "Ihr Erklärvideo", 0, h / 2 - 30, f, ANTH, "center", alpha)
    c.restore()


def draw_sparkle(c, x, y, s, rot=0.0, color=WHITE, alpha=1.0):
    if s <= 0.01 or alpha <= 0.01:
        return
    p = star_path(x, y, 26 * s, 7 * s, 4, math.radians(rot))
    c.drawPath(p, fill(color, alpha))
    c.drawPath(p, stroke(OUT, 3.5 * min(1.0, s), alpha))


# ------------------------------------------------------------------ CTA
CTA_X = 1404


def draw_button(c, cx, cy, s, alpha=1.0, glow_k=0.0, press=0.0):
    f = font(46, "SemiBold")
    text = "Projekt anfragen"
    tw = f.measureText(text)
    w, h = tw + 150, 104
    c.save()
    c.translate(cx, cy)
    c.scale(s, s)
    if glow_k > 0:
        gp = rrect_path(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, h / 2 + 10)
        glow(c, gp, NEON, 22, 0.5 * glow_k * alpha)
    off = 9 * (1 - press)
    c.drawPath(rrect_path(-w / 2 + off, -h / 2 + off + 2, w, h, h / 2), fill(OUT, alpha))
    btn = rrect_path(-w / 2 + (9 - off), -h / 2 + (9 - off), w, h, h / 2)
    draw_outlined(c, btn, NEON, OUTLINE, alpha=alpha)
    draw_text(c, text, -w / 2 + 50 + (9 - off), 16 + (9 - off), f, ANTH, alpha=alpha)
    # Pfeil
    ax = w / 2 - 66 + (9 - off)
    ay = (9 - off)
    c.drawLine(ax - 14, ay, ax + 18, ay, stroke(ANTH, 8, alpha))
    c.drawLine(ax + 4, ay - 14, ax + 18, ay, stroke(ANTH, 8, alpha))
    c.drawLine(ax + 4, ay + 14, ax + 18, ay, stroke(ANTH, 8, alpha))
    c.restore()
