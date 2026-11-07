"""Regie: setzt pro Zeitpunkt Hintergrund, Figur, Tisch, Inhalte, Sprechblase
und Halbton-Raster zusammen. Alle Inhalte richten sich nach den Wortzeiten."""
import math

import numpy as np
import skia

from common import (W, H, NEON, ANTH, OUT, WHITE, fill, stroke, font, draw_text, clamp, lerp, smoothstep,
                    spring01, pop, ease_out_cubic, ease_in_cubic, ease_in_out, noise1, radial_glow,
                    circle_path)
from background import build_background, build_halftone
from character import draw_character_body, draw_character_arms, mouth_world
from bubble import Bubble, bubble_scale
from timeline import SCENES
import props as P
from logo import draw_logo, logo_geometry, draw_wordmark


def _out_scale(t, t0, dur=0.24):
    if t < t0:
        return 1.0
    return 1.0 - ease_in_cubic(clamp((t - t0) / dur))


class Director:
    def __init__(self, T, motion):
        self.T = T
        self.M = motion
        self.bg = build_background()
        self.ht = build_halftone()
        self._bubbles()
        self._events()

    # ------------------------------------------------------------ Zeitpunkte
    def _bubbles(self):
        T = self.T
        self.bubbles = []
        n = len(SCENES)
        for k, sc in enumerate(SCENES, 1):
            times = [T.w(k, a) - 0.03 for a in sc["anchors"]]
            open_t = T.s(k)
            if "bubble2" in sc:
                split = T.w(k, sc["split2"])
                self.bubbles.append((Bubble(sc["bubble"], times), open_t, split))
                times2 = [T.w(k, a) - 0.03 for a in sc["anchors2"]]
                self.bubbles.append((Bubble(sc["bubble2"], times2), split, T.speech_end + 1.0))
            else:
                close_t = T.s(k + 1) if k < n else T.speech_end + 1.0
                self.bubbles.append((Bubble(sc["bubble"], times), open_t, close_t))

    def _events(self):
        T = self.T
        w, s, e = T.w, T.s, T.e
        ev = {}
        # 2: Funkeln bei «Super!»
        ev["super"] = w(2, 5)
        # 3: Papiere fallen bei «Lange Texte liest heute», Fragezeichen bei «kaum jemand»
        a, b = w(3, 1), w(3, 5)
        ev["papers"] = [a + i * (b - a) / 6.0 for i in range(6)]
        ev["qmarks"] = [w(3, 5) + k * 0.14 for k in range(3)]
        ev["papers_away"] = e(3) - 0.18
        # 4: Bildschirm
        ev["screen_in"] = s(4) - 0.10
        ev["play"] = w(4, 2) - 0.04
        ev["bulb"] = w(4, 3) - 0.04
        ev["arrow"] = (w(4, 4), w(4, 6))
        ev["smiley"] = w(4, 6) - 0.04
        ev["diagram_out"] = s(5) - 0.02
        ev["pills"] = [w(5, 0) - 0.04, w(5, 1) - 0.04, w(5, 3) - 0.04]
        ev["screen_out"] = s(6) - 0.02
        # 6/7: Branchen-Icons + Häkchen
        a, b = w(6, 4), w(6, 10)
        ev["icons"] = [a + i * (b - a) / 5.0 for i in range(6)]
        a, b = w(7, 1), w(7, 4)
        ev["checks"] = [a + i * (b - a) / 5.0 for i in range(6)]
        ev["tada"] = w(7, 4)
        ev["icons_out"] = s(8) - 0.04
        # 8: Kolben + Etiketten genau beim Wort
        ev["flask_in"] = s(8) - 0.06
        ev["tags"] = [("Ihre Idee", w(8, 6)), ("Story & Skript", w(8, 9)), ("Design & Animation", w(8, 12))]
        # 9: Leuchten, Wackeln, Karte springt heraus
        ev["glow"] = w(9, 0)
        ev["shake"] = w(9, 0) + 0.04
        ev["card"] = w(9, 2) - 0.06
        ev["flask_out"] = s(10) - 0.02
        # 10: CTA
        ev["logo"] = s(10) + 0.02
        ev["wordmark"] = s(10) + 0.18
        ev["contact"] = w(10, 1)
        ev["tagline"] = w(10, 3) - 0.04
        ev["button"] = w(10, 8) - 0.04
        ev["click"] = T.speech_end + 1.35
        self.ev = ev

    # ------------------------------------------------------------ Kamera
    def camera(self, t):
        T = self.T
        z = 1.02 + 0.02 * smoothstep(0.0, T.duration, t)
        # kleine Push-ins bei den Szenenwechseln
        for k in range(2, len(SCENES) + 1):
            u = t - T.s(k)
            if 0 <= u < 1.2:
                z += 0.004 * math.sin(math.pi * u / 1.2)
        cx = 960 + 18 * smoothstep(0, T.duration, t) - 8
        cy = 540
        sx = sy = 0.0
        u = t - self.ev["shake"]
        if 0 <= u < 0.5:
            k = math.exp(-6.5 * u)
            sx = 11 * k * math.sin(u * 83)
            sy = 8 * k * math.sin(u * 61 + 1.3)
        return z, cx, cy, sx, sy

    # ------------------------------------------------------------ Bild
    def render(self, t, surface=None):
        surf = surface or skia.Surface(W, H)
        c = surf.getCanvas()
        c.clear(skia.Color(26, 27, 30))
        z, cx, cy, sx, sy = self.camera(t)
        # Hintergrund mit leichter Parallaxe
        c.save()
        zb = 1 + (z - 1) * 0.6
        c.translate(W / 2 + sx * 0.5, H / 2 + sy * 0.5)
        c.scale(zb, zb)
        c.translate(-cx, -cy)
        c.drawImage(self.bg, 0, 0, skia.SamplingOptions(skia.FilterMode.kLinear))
        c.restore()

        c.save()
        c.translate(W / 2 + sx, H / 2 + sy)
        c.scale(z, z)
        c.translate(-cx, -cy)
        rig = self.M.rig(t)
        self._behind_character(c, t)
        draw_character_body(c, rig, t)
        P.draw_table_top(c)
        draw_character_arms(c, rig)
        ca = self._contact_alpha(t)
        P.draw_table_front(c, t, ca)
        self._content(c, t)
        self._bubble(c, t, rig)
        c.restore()
        # Halbton-Raster in den Ecken (Bildschirmebene)
        p = skia.Paint()
        p.setAlphaf(0.75)
        c.drawImage(self.ht, 0, 0, skia.SamplingOptions(), p)
        return surf

    def _contact_alpha(self, t):
        return ease_out_cubic(clamp((t - self.ev["contact"]) / 0.45))

    def _behind_character(self, c, t):
        # Funkeln bei «Super!» hinter/neben dem Kopf
        u = t - self.ev["super"]
        if 0 <= u < 1.1:
            for k, (dx, dy, sz) in enumerate([(-190, -170, 1.1), (200, -230, 0.9), (-150, -330, 0.7), (150, -110, 0.6)]):
                uu = u - k * 0.06
                if uu < 0:
                    continue
                s = pop(uu, 0, 3.0, 0.4) * (1 - smoothstep(0.6, 1.0, uu)) * sz
                P.draw_sparkle(c, 470 + dx, 400 + dy + 20, s * 1.3, uu * 90, NEON if k % 2 == 0 else WHITE)

    # ------------------------------------------------------------ Inhalte rechts
    def _content(self, c, t):
        T = self.T
        ev = self.ev
        if T.s(3) - 0.2 <= t < T.s(4) + 0.8:
            self._papers(c, t)
        if ev["screen_in"] <= t < ev["screen_out"] + 0.4:
            self._screen(c, t)
        if ev["icons"][0] - 0.05 <= t < ev["icons_out"] + 0.5:
            self._icons(c, t)
        if ev["flask_in"] <= t < ev["flask_out"] + 0.4:
            self._flask(c, t)
        if t >= ev["logo"] - 0.05:
            self._cta(c, t)

    def _papers(self, c, t):
        ev = self.ev
        rest = [(1196, 486, -9), (1636, 470, 8), (1416, 446, -3), (1226, 704, 7), (1612, 712, -8),
                (1420, 676, 3)]
        away = ev["papers_away"]
        for i, tp in enumerate(ev["papers"]):
            u = t - tp
            if u < 0:
                continue
            x, y, r = rest[i]
            fall = 0.40
            if u < fall:
                p = u / fall
                yy = lerp(-260, y, p * p)
                rr = r + 34 * (1 - p) * (1 if i % 2 else -1)
                xx = x + 40 * (1 - p) * (1 if i % 2 else -1)
            else:
                uu = u - fall
                yy = y - 16 * math.exp(-7 * uu) * abs(math.sin(11 * uu))
                rr = r + 2.5 * math.exp(-4 * uu) * math.sin(9 * uu)
                xx = x
            q = t - (away + i * 0.035)
            if q > 0:
                q = q / 0.55
                xx += 1400 * q * q + 200 * q
                yy -= 620 * q - 200 * q * q
                rr += 200 * q * (1 if i % 2 else -1)
            if xx > W + 250:
                continue
            P.draw_paper(c, xx, yy, rr, 0.9, i)
        # Fragezeichen
        pos = [(1318, 262, -12), (1530, 236, 6), (1752, 284, 14)]
        for k, tq in enumerate(ev["qmarks"]):
            u = t - tq
            if u < 0:
                continue
            x, y, r = pos[k]
            s = pop(u, 0, 2.6, 0.38)
            q = t - away
            if q > 0:
                s *= 1 - ease_in_cubic(clamp(q / 0.2))
            if s <= 0.01:
                continue
            P.draw_qmark(c, x, y + 6 * math.sin(t * 3 + k), s, r + 8 * math.sin(t * 4.2 + k * 2))

    def _screen(self, c, t):
        ev = self.ev
        T = self.T
        u = t - ev["screen_in"]
        s = pop(u, 0, 2.2, 0.45)
        q = t - ev["screen_out"]
        dy = 0.0
        if q > 0:
            s *= 1 - ease_in_cubic(clamp(q / 0.3))
            dy = 180 * ease_in_cubic(clamp(q / 0.3))
        if s <= 0.01:
            return
        cx, cy = P.SCREEN_C
        c.save()
        c.translate(cx, 858 + dy)
        c.scale(s, s)
        c.translate(-cx, -858)
        ip = P.draw_screen_frame(c, t)
        inner = P.screen_inner()
        c.save()
        c.clipPath(ip, doAntiAlias=True)
        icx, icy = inner.centerX(), inner.centerY()
        # Diagramm (Szene 4): Play -> Glühbirne -> Pfeil -> Smiley
        dq = t - ev["diagram_out"]
        da = 1.0 - clamp(dq / 0.22) if dq > 0 else 1.0
        dshift = -120 * ease_in_cubic(clamp(dq / 0.25)) if dq > 0 else 0.0
        up = t - ev["play"]
        if up < 0.15:
            sa = 1.0 - clamp(up / 0.15) if up > 0 else 1.0
            for k in range(3):
                ph = (t * 2.4 - k * 0.22) % 1.0
                rr = 9 + 5 * math.sin(math.pi * ph) ** 2
                c.drawCircle(icx - 40 + k * 40, icy, rr, fill(NEON, sa * (0.35 + 0.65 * math.sin(math.pi * ph) ** 2)))
        if up >= 0:
            m = ease_in_out(clamp((t - ev["bulb"]) / 0.35))
            px = lerp(icx, inner.left() + 52, m)
            py = lerp(icy, inner.top() + 46, m)
            pr = lerp(92, 26, m) * pop(up, 0, 2.6, 0.4)
            P.draw_play(c, px, py, pr)
            if m > 0:
                # Fortschrittsbalken
                bx0, bx1 = inner.left() + 96, inner.right() - 40
                by = inner.top() + 46
                pk = clamp((t - ev["bulb"]) / (T.e(5) + 0.3 - ev["bulb"]))
                c.drawRoundRect(skia.Rect.MakeLTRB(bx0, by - 5, bx1, by + 5), 5, 5, fill("#4A4D55", m))
                c.drawRoundRect(skia.Rect.MakeLTRB(bx0, by - 5, bx0 + (bx1 - bx0) * pk, by + 5), 5, 5,
                                fill(NEON, m))
                c.drawCircle(bx0 + (bx1 - bx0) * pk, by, 10 * m, fill(WHITE))
        if da > 0:
            c.save()
            c.translate(0, dshift)
            ub = t - ev["bulb"]
            if ub >= 0:
                sb = pop(ub, 0, 2.6, 0.4)
                P.draw_bulb(c, inner.left() + 160, icy + 4, 1.05 * sb, 0.8 + 0.2 * math.sin(t * 5), da)
                f = font(38, "SemiBold")
                draw_text(c, "Ihre Idee", inner.left() + 160, icy + 140, f, WHITE, "center", da * clamp(ub / 0.15))
            a0, a1 = ev["arrow"]
            P.draw_arrow(c, inner.left() + 280, inner.right() - 300, icy + 4,
                         ease_out_cubic(clamp((t - a0) / max(0.2, a1 - a0))), da)
            us = t - ev["smiley"]
            if us >= 0:
                ss = pop(us, 0, 2.6, 0.38)
                P.draw_smiley(c, inner.right() - 170, icy + 4, 1.15 * ss, da, wink=1.0 if 0.7 < us < 0.9 else 0.0)
                f = font(38, "SemiBold")
                draw_text(c, "Verstanden!", inner.right() - 170, icy + 140, f, NEON, "center", da * clamp(us / 0.15))
            c.restore()
        # Pillen (Szene 5)
        labels = ["Kurz", "Klar", "Mit Charakter"]
        for k, tp in enumerate(ev["pills"]):
            u = t - tp
            if u < 0:
                continue
            sp = pop(u, 0, 2.8, 0.42)
            P.draw_pill(c, icx + 10, icy - 108 + k * 118 + 22, labels[k], sp, clamp((u - 0.1) / 0.22))
        c.restore()
        c.restore()

    def _icons(self, c, t):
        ev = self.ev
        for i, ti in enumerate(ev["icons"]):
            u = t - ti
            if u < 0:
                continue
            s = pop(u, 0, 2.5, 0.4)
            q = t - (ev["icons_out"] + i * 0.035)
            if q > 0:
                s *= 1 - ease_in_cubic(clamp(q / 0.22))
            if s <= 0.01:
                continue
            cs = 0.0
            uc = t - ev["checks"][i]
            if uc >= 0:
                cs = pop(uc, 0, 3.2, 0.38)
            wob = 2.5 * math.sin(t * 2.2 + i * 1.7)
            ut = t - ev["tada"]
            dy = 0.0
            if 0 <= ut < 0.6:
                dy = -18 * math.sin(math.pi * clamp(ut / 0.35)) * (1 if ut < 0.35 else 0)
            x, y = P.ICON_POS[i]
            P.draw_icon_card(c, x, y + dy, i, s, cs, wob=wob)
        # Funkeln beim Ta-da
        ut = t - ev["tada"]
        if 0 <= ut < 1.2:
            rng = np.random.RandomState(9)
            for k in range(10):
                x = rng.uniform(1040, 1800)
                y = rng.uniform(300, 860)
                uu = ut - k * 0.04
                if uu < 0:
                    continue
                s = pop(uu, 0, 3, 0.4) * (1 - smoothstep(0.5, 0.9, uu))
                P.draw_sparkle(c, x, y, s * rng.uniform(0.6, 1.1), uu * 120, NEON if k % 2 else WHITE)

    def _flask(self, c, t):
        ev = self.ev
        u = t - ev["flask_in"]
        s = pop(u, 0, 2.2, 0.45)
        q = t - ev["flask_out"]
        if q > 0:
            s *= 1 - ease_in_cubic(clamp(q / 0.28))
        if s <= 0.01:
            return
        # Füllstand steigt mit jedem Etikett
        level = 0.12
        bub = 0.3
        floaters = []
        flying = []
        tag_x = [P.FLASK_CX - 66, P.FLASK_CX + 62, P.FLASK_CX - 4]
        tag_depth = [56, 126, 196]
        tag_rot = [-6, 5, -2]
        splashes = []
        for k, (txt, tk) in enumerate(ev["tags"]):
            t_app = tk - 0.36
            t_in = tk + 0.10
            if t >= t_in:
                level += 0.22 * spring01(t - t_in, 1.6, 0.55)
                bub += 0.25
                splashes.append(t_in)
            if t_app <= t < t_in + 0.28:
                flying.append((k, txt, t_app, t_in))
            if t >= t_in + 0.12:
                floaters.append(k)
        ly = P.flask_level_y(level)
        glow_k = 0.0
        ug = t - ev["glow"]
        if ug >= 0:
            glow_k = clamp(spring01(ug, 1.8, 0.4) * 1.0)
        fl = []
        for k in floaters:
            txt = ev["tags"][k][0]
            tin = ev["tags"][k][1] + 0.22
            sink = ease_out_cubic(clamp((t - tin) / 0.5))
            fy = lerp(ly - 10, ly + tag_depth[k], sink) + 6 * math.sin(t * 2.6 + k * 2)
            fy = min(fy, P.FLASK_BASE - 40)
            fl.append((txt, tag_x[k], fy, tag_rot[k] + 3 * math.sin(t * 2 + k), 0.74))
        c.save()
        c.translate(P.FLASK_CX, P.FLASK_BASE)
        c.scale(s, s)
        c.translate(-P.FLASK_CX, -P.FLASK_BASE)
        P.draw_flask(c, t, level, glow_k, bub, fl)
        # Spritzer
        for ts_ in splashes:
            uu = t - ts_
            if uu > 0.7:
                continue
            rng = np.random.RandomState(int(ts_ * 100) % 1000)
            for d in range(9):
                vx = rng.uniform(-260, 260)
                vy = rng.uniform(-620, -380)
                x = P.FLASK_CX + vx * uu * 0.55
                y = P.FLASK_BASE - P.FLASK_H + 10 + vy * uu + 1500 * uu * uu
                if y > P.FLASK_BASE - P.FLASK_H + 40 and uu > 0.25:
                    continue
                r = rng.uniform(6, 13) * (1 - uu / 0.7)
                c.drawCircle(x, y, r, fill(NEON))
                c.drawCircle(x, y, r, stroke(OUT, 3))
        c.restore()
        # fallende Etiketten
        for (k, txt, t_app, t_in) in flying:
            uu = t - t_app
            dur = t_in - t_app
            p = clamp(uu / dur)
            x0 = P.FLASK_CX + [300, 330, 340][k]
            x = lerp(x0, P.FLASK_CX, ease_in_out(p))
            y = lerp(372, P.FLASK_BASE - P.FLASK_H - 10, p) - 90 * math.sin(math.pi * p)
            sc = lerp(0.74, 0.5, p * p) * pop(uu, 0, 3.0, 0.5)
            rot = [-12, 10, -6][k] * (1 - p) + 4 * math.sin(uu * 8)
            if t > t_in:
                # verschwindet im Hals
                pp = clamp((t - t_in) / 0.25)
                y += 120 * pp
                sc *= 1 - pp
                c.save()
                neck = skia.Path()
                neck.addRect(skia.Rect.MakeLTRB(0, 0, W, P.FLASK_BASE - P.FLASK_H - 4))
                c.clipPath(neck)
                P.draw_tag(c, x, y, txt, sc, rot)
                c.restore()
            else:
                P.draw_tag(c, x, y, txt, sc, rot)
        # Videokarte springt heraus
        uc = t - ev["card"]
        if uc >= 0:
            p = spring01(uc, 1.9, 0.42)
            cxx = lerp(P.FLASK_CX, P.FLASK_CX - 40, p)
            cyy = lerp(P.FLASK_BASE - P.FLASK_H + 20, 476, p) - 40 * math.sin(math.pi * clamp(uc / 0.45))
            sc = lerp(0.15, 1.0, p) * s
            rot = lerp(-18, 0, clamp(p)) + 2 * math.sin(t * 2)
            # Glitzer
            rng = np.random.RandomState(4)
            for k in range(14):
                a = rng.uniform(0, 2 * math.pi)
                rad = rng.uniform(250, 360)
                tw = 0.5 + 0.5 * math.sin(t * rng.uniform(5, 9) + k)
                ss = pop(uc - k * 0.03, 0, 3, 0.4) * (0.5 + 0.6 * tw) * s
                P.draw_sparkle(c, cxx + math.cos(a) * rad, cyy + math.sin(a) * rad * 0.62, ss * rng.uniform(0.5, 1.0),
                               t * 60 + k * 20, NEON if k % 3 else WHITE)
            P.draw_video_card(c, cxx, cyy, sc, rot, t)

    def _cta(self, c, t):
        ev = self.ev
        cx = P.CTA_X
        # Logo «o.»
        u = t - ev["logo"]
        if u >= 0:
            # dunkler, weicher Hintergrund für Lesbarkeit
            ba = clamp(u / 0.4)
            sh = skia.GradientShader.MakeRadial(skia.Point(cx, 570), 620,
                                                [skia.Color(19, 20, 23, int(190 * ba)),
                                                 skia.Color(19, 20, 23, int(120 * ba)),
                                                 skia.Color(19, 20, 23, 0)], [0.0, 0.55, 1.0])
            bp = skia.Paint(AntiAlias=True)
            bp.setShader(sh)
            c.save()
            c.scale(1.0, 0.72)
            c.drawCircle(cx, 570 / 0.72, 620, bp)
            c.restore()
            s = pop(u, 0, 2.3, 0.42)
            D = 190
            g = logo_geometry(D)
            lw = g["right"] - g["left"]
            radial_glow(c, cx, 392, 300, NEON, 0.16 * clamp(u / 0.4))
            c.save()
            c.translate(cx, 392)
            c.scale(s, s)
            draw_logo(c, -lw / 2 + D / 2, 0, D, outline=0)
            c.restore()
        u = t - ev["wordmark"]
        if u >= 0:
            a = clamp(u / 0.25)
            draw_wordmark(c, cx, 596 + 30 * (1 - ease_out_cubic(clamp(u / 0.35))), 108, WHITE, a, "center")
        u = t - ev["tagline"]
        if u >= 0:
            a = clamp(u / 0.25)
            f = font(46, "Medium")
            t1 = "Für jeden das passende "
            t2 = "Erklärvideo."
            w1, w2 = f.measureText(t1), f.measureText(t2)
            x0 = cx - (w1 + w2) / 2
            yy = 672 + 16 * (1 - ease_out_cubic(clamp(u / 0.3)))
            c.drawString(t1, x0, yy, f, fill(WHITE, a))
            c.drawString(t2, x0 + w1, yy, f, fill(NEON, a))
        u = t - ev["button"]
        if u >= 0:
            s = pop(u, 0, 2.4, 0.4)
            gk = 0.5 + 0.5 * math.sin((t - ev["button"]) * 4.0)
            uc = t - ev["click"]
            press = 0.0
            if 0 <= uc < 0.25:
                press = math.sin(math.pi * uc / 0.25)
            pulse = 1.0 + 0.025 * math.sin((t - ev["button"]) * 4.0) * (t > self.T.speech_end)
            P.draw_button(c, cx, 784, s * pulse, 1.0, gk if t > self.T.speech_end else 0.3, press)
            # Klick-Ring
            if uc >= 0.05:
                rr = 60 + 260 * ease_out_cubic(clamp((uc - 0.05) / 0.5))
                ra = 1 - clamp((uc - 0.05) / 0.5)
                if ra > 0:
                    c.drawRoundRect(skia.Rect.MakeXYWH(cx - rr * 1.6, 784 - rr * 0.45, rr * 3.2, rr * 0.9),
                                    rr * 0.45, rr * 0.45, stroke(NEON, 5, ra))
            self._cursor(c, t, cx, 784)

    def _cursor(self, c, t, bx, by):
        ev = self.ev
        t0 = ev["click"] - 0.75
        if t < t0:
            return
        p = ease_in_out(clamp((t - t0) / 0.7))
        x = lerp(bx + 420, bx + 150, p)
        y = lerp(by + 300, by + 22, p)
        uc = t - ev["click"]
        s = 1.0 - (0.15 * math.sin(math.pi * uc / 0.25) if 0 <= uc < 0.25 else 0.0)
        c.save()
        c.translate(x, y)
        c.scale(s, s)
        c.rotate(-12)
        hand = skia.Path()
        pts = [(0, 0), (0, 64), (16, 50), (28, 76), (40, 70), (28, 46), (50, 46)]
        hand.moveTo(*pts[0])
        for q in pts[1:]:
            hand.lineTo(*q)
        hand.close()
        c.drawPath(hand, fill(WHITE))
        c.drawPath(hand, stroke(OUT, 5))
        c.restore()

    # ------------------------------------------------------------ Sprechblase
    def _bubble(self, c, t, rig):
        mouth = mouth_world(rig)
        active = []
        for (b, t_open, t_close) in self.bubbles:
            if t < t_open or (t_close is not None and t > t_close + 0.15):
                continue
            active.append((b, t_open, t_close))
        # alte zuerst (schliessend), neue darüber
        active.sort(key=lambda k: k[1])
        for (b, t_open, t_close) in active:
            s = bubble_scale(t, t_open, t_close)
            b.draw(c, t, mouth, s)
