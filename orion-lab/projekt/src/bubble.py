"""Sprechblasen: weiss, abgerundet, Schweif zum Mund, Wörter synchron zur
Stimme, Schlüsselwörter mit neongrüner Textmarker-Hinterlegung."""
import math
import re

import skia

from common import (NEON, ANTH, OUT, WHITE, OUTLINE, fill, stroke, rrect_path, union, poly_path, font,
                    clamp, lerp, spring01, ease_out_cubic, ease_in_cubic)

FSIZE = 54
LINE_H = 66
MAX_TW = 720
PAD_X, PAD_Y = 40, 30
BUB_LEFT = 646
BUB_BOTTOM = 280


def parse_tokens(markup):
    toks = []
    hl = False
    for raw in markup.split():
        s = raw
        start_hl = s.startswith("*")
        if start_hl:
            s = s[1:]
            hl = True
        tok_hl = hl
        tail = ""
        m = re.match(r"^(.*?)\*([^A-Za-zÄÖÜäöü0-9]*)$", s)
        if m:
            s, tail = m.group(1), m.group(2)
            hl = False
        if tok_hl:
            toks.append(dict(core=s, tail=tail, hl=True))
        else:
            toks.append(dict(core=s + tail, tail="", hl=False))
    return toks


def _wrap(toks, sp):
    """Ausgewogener Zeilenumbruch (max. Zeilenbreite möglichst klein)."""
    ws = [t["w"] for t in toks]
    n = len(toks)

    def width(a, b):
        return sum(ws[a:b]) + sp * (b - a - 1)

    if width(0, n) <= MAX_TW:
        return [list(toks)]
    best = None
    for k in range(1, n):
        if toks[k]["core"] in ("–", "-"):
            continue
        m = max(width(0, k), width(k, n))
        if m <= MAX_TW and (best is None or m < best[0]):
            best = (m, k)
    if best:
        return [list(toks[:best[1]]), list(toks[best[1]:])]
    lines = [[]]
    lw = 0.0
    for tk in toks:
        add = tk["w"] + (sp if lines[-1] else 0)
        if lines[-1] and lw + add > MAX_TW:
            lines.append([tk])
            lw = tk["w"]
        else:
            lines[-1].append(tk)
            lw += add
    return lines


class Bubble:
    def __init__(self, markup, times):
        self.f = font(FSIZE, "SemiBold")
        self.toks = parse_tokens(markup)
        assert len(self.toks) == len(times), (markup, len(self.toks), len(times))
        for tk, tm in zip(self.toks, times):
            tk["t"] = tm
            tk["w_core"] = self.f.measureText(tk["core"])
            tk["w"] = tk["w_core"] + self.f.measureText(tk["tail"])
        sp = self.f.measureText(" ") * 1.18
        lines = _wrap(self.toks, sp)
        self.lines = lines
        widths = [sum(t["w"] for t in ln) + sp * (len(ln) - 1) for ln in lines]
        self.tw = max(widths)
        self.w = self.tw + 2 * PAD_X
        self.h = LINE_H * len(lines) + 2 * PAD_Y - 6
        self.x = BUB_LEFT
        self.y = BUB_BOTTOM - self.h
        # Wortpositionen
        for li, ln in enumerate(lines):
            x = self.x + PAD_X + (self.tw - widths[li]) / 2
            base = self.y + PAD_Y + li * LINE_H + FSIZE * 0.86
            for tk in ln:
                tk["x"] = x
                tk["base"] = base
                tk["line"] = li
                x += tk["w"] + sp
        # Markerband bis zum nächsten markierten Wort derselben Zeile verlängern
        for ln in lines:
            for a, b in zip(ln, ln[1:]):
                a["hl_ext"] = (b["x"] - (a["x"] + a["w_core"])) if (a["hl"] and b["hl"]) else 0.0
            ln[-1]["hl_ext"] = 0.0

    def path(self, mouth):
        body = rrect_path(self.x, self.y, self.w, self.h, 42)
        bx0 = self.x + 52
        bx1 = self.x + 128
        by = self.y + self.h - 4
        mx, my = mouth
        # Schweifspitze kurz vor dem Mund
        dx, dy = mx - (bx0 + bx1) / 2, my - by
        L = math.hypot(dx, dy) or 1
        stop = 150
        tx, ty = mx - dx / L * stop, my - dy / L * stop
        tail = skia.Path()
        tail.moveTo(bx0, by)
        tail.quadTo(bx0 - 10, by + (ty - by) * 0.55, tx, ty)
        tail.quadTo(bx0 + 40, by + (ty - by) * 0.45, bx1, by)
        tail.close()
        return union(body, tail), ((bx0 + bx1) / 2, by)

    def draw(self, c, t, mouth, scale=1.0, alpha=1.0):
        if scale <= 0.01 or alpha <= 0.01:
            return
        p, anchor = self.path(mouth)
        c.save()
        c.translate(anchor[0], anchor[1])
        c.scale(scale, scale)
        c.translate(-anchor[0], -anchor[1])
        sh = skia.Path(p)
        sh.offset(9, 11)
        c.drawPath(sh, fill(OUT, 0.32 * alpha))
        c.drawPath(p, fill(WHITE, alpha))
        c.drawPath(p, stroke(OUT, OUTLINE + 0.5, alpha))
        # Textmarker zuerst (hinter dem Text)
        for tk in self.toks:
            if not tk["hl"]:
                continue
            k = clamp((t - tk["t"] - 0.02) / 0.22)
            if k <= 0:
                continue
            k = ease_out_cubic(k)
            x0 = tk["x"] - 8
            full = tk["w_core"] + 16 + max(0.0, tk["hl_ext"] - 16)
            y0 = tk["base"] - FSIZE * 0.52
            hh = FSIZE * 0.62
            band = skia.Path()
            band.moveTo(x0, y0 + 3)
            band.lineTo(x0 + full * k, y0)
            band.lineTo(x0 + full * k + 2, y0 + hh - 2)
            band.lineTo(x0 - 2, y0 + hh + 1)
            band.close()
            c.drawPath(band, fill(NEON, 0.95 * alpha))
        # Wörter
        for tk in self.toks:
            dt = t - tk["t"]
            if dt < 0:
                continue
            a = clamp(dt / 0.09) * alpha
            s = 0.6 + 0.4 * spring01(dt, 3.4, 0.72)
            cx = tk["x"] + tk["w"] / 2
            cy = tk["base"] - FSIZE * 0.32
            c.save()
            c.translate(cx, cy)
            c.scale(s, s)
            c.translate(-cx, -cy - (1 - clamp(dt / 0.12)) * 10)
            c.drawString(tk["core"] + tk["tail"], tk["x"], tk["base"], self.f, fill(ANTH, a))
            c.restore()
        c.restore()


def bubble_scale(t, t_open, t_close):
    """Aufploppen (Feder) und schnelles Schliessen."""
    if t < t_open:
        return 0.0
    s = spring01(t - t_open, 2.6, 0.45)
    if t_close is not None and t >= t_close:
        k = clamp((t - t_close) / 0.13)
        s *= 1 - ease_in_cubic(k)
    return s
