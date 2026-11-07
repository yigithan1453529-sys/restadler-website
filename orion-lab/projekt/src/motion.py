"""Bewegung der Figur: Posen pro Szene (mit Federn/Überschwingen), Sprung,
Lip-Sync, Nicken/Brauen bei Betonungen, Blinzeln, Blick, Atmung,
träge nachschwingende Ohrringe und Dutt.

Alles wird einmal für die ganze Dauer mit 120 Hz vorberechnet.
"""
import math
from dataclasses import replace

import numpy as np

from character import Rig, Arm
from common import clamp, lerp, smoothstep, noise1
from timeline import syllables

RATE = 120

P = {
    "restL": Arm(-140, -8, 72, "rest"),
    "restR": Arm(140, -8, 108, "rest"),
    "waveR": Arm(212, -400, -84, "open"),
    "waveL": Arm(-214, -400, -96, "open"),
    "upL": Arm(-212, -396, -96, "open"),
    "upR": Arm(212, -396, -84, "open"),
    "presentR": Arm(318, -246, -14, "open"),
    "pointR": Arm(322, -294, -22, "point"),
    "chinR": Arm(60, -190, -114, "fist"),
    "beatR": Arm(292, -238, -24, "open"),
    "wideL": Arm(-322, -292, -158, "open"),
    "wideR": Arm(322, -292, -22, "open"),
    "tadaL": Arm(-252, -384, -128, "open"),
    "tadaR": Arm(252, -384, -52, "open"),
    "wowL": Arm(-196, -332, -100, "open"),
    "wowR": Arm(196, -332, -80, "open"),
    "ctaR": Arm(318, -270, -20, "point"),
}


class Spring2:
    def __init__(self, x0, f, z):
        self.x = x0
        self.v = 0.0
        self.w = 2 * math.pi * f
        self.z = z

    def step(self, target, dt):
        a = self.w ** 2 * (target - self.x) - 2 * self.z * self.w * self.v
        self.v += a * dt
        self.x += self.v * dt
        return self.x


def _target(keys, t):
    v = keys[0][1]
    for kt, kv in keys:
        if t >= kt:
            v = kv
        else:
            break
    return v


def synth_voice_features(T, dur):
    """Ersatz-Lip-Sync aus Wortzeiten (nur für Testbilder ohne Aufnahme)."""
    n = int(dur * RATE) + 2
    op = np.zeros(n)
    wd = np.zeros(n)
    stress = []
    rng = np.random.RandomState(3)
    for (a, b, txt, s, wi) in T.all_words():
        ns = syllables(txt)
        i0, i1 = int(a * RATE), int(b * RATE)
        for i in range(i0, min(i1, n)):
            ph = (i - i0) / max(1, i1 - i0) * ns
            op[i] = max(op[i], 0.18 + 0.72 * math.sin(math.pi * (ph % 1.0)) ** 0.7)
        for k in range(ns):
            j0 = i0 + int((i1 - i0) * k / ns)
            j1 = i0 + int((i1 - i0) * (k + 1) / ns)
            wd[j0:j1] = rng.uniform(-1, 1)
        if txt[0].isupper() and len(txt) > 3:
            stress.append(a + 0.04)
    return dict(open=op, wide=wd, stress=stress, active=(op > 0.05).astype(float))


class Motion:
    def __init__(self, T, feats=None):
        self.T = T
        self.dur = T.duration + 0.5
        self.feats = feats if feats is not None else synth_voice_features(T, self.dur)
        self._build()

    # ------------------------------------------------------------ Schlüsselposen
    def _keys(self):
        T = self.T
        s = T.s
        w = T.w
        e = T.e
        K = dict(L=[(0, P["waveL"])], R=[(0, P["upR"])])
        jump_t = max(0.05, s(1) - 0.42)
        self.jump_t = jump_t
        K["R"].append((jump_t + 0.62, P["restR"]))
        K["L"].append((e(1) + 0.08, P["restL"]))
        # 2: offene Hand nach rechts
        K["R"].append((s(2) - 0.04, P["presentR"]))
        # 3: Hand am Kinn
        K["R"].append((w(3, 1) - 0.06, P["chinR"]))
        # 4: zeigt auf Bildschirm
        K["R"].append((s(4) - 0.06, P["pointR"]))
        # 5: Hand-Beats
        K["R"].append((s(5) - 0.04, P["beatR"]))
        # 6: Arme weit offen
        K["L"].append((s(6) + 0.02, P["wideL"]))
        K["R"].append((s(6) + 0.02, P["wideR"]))
        # 7: Ta-da bei «beste»
        K["L"].append((w(7, 4) - 0.1, P["tadaL"]))
        K["R"].append((w(7, 4) - 0.1, P["tadaR"]))
        # 8: präsentiert den Kolben
        K["L"].append((s(8) + 0.05, P["restL"]))
        K["R"].append((s(8) - 0.02, P["presentR"]))
        # 9: Freude
        K["L"].append((w(9, 0) - 0.02, P["wowL"]))
        K["R"].append((w(9, 0) - 0.02, P["wowR"]))
        # 10: zeigt auf CTA, winkt bei «Bis bald»
        K["L"].append((s(10) + 0.06, P["restL"]))
        K["R"].append((s(10) - 0.02, P["ctaR"]))
        K["L"].append((w(10, 9) - 0.12, P["waveL"]))
        K["L"].append((T.speech_end + 0.95, P["restL"]))
        self.wave_spans = [(0.0, e(1) + 0.05), (w(10, 9) - 0.05, T.speech_end + 1.0)]
        self.jazz_span = (w(7, 4) - 0.02, e(7) + 0.25)

        K["lean"] = [(0, 0.0), (s(2), 2.5), (s(3), -0.5), (s(4), 3.0), (s(6), 0.0), (w(7, 4), -2.0),
                     (s(8), 2.5), (w(9, 0), -2.0), (s(10), 2.0), (w(10, 9), 0.0)]
        K["tilt"] = [(0, -4.0), (s(2), 3.0), (s(3), -6.0), (s(4), 2.5), (s(5), -2.0), (s(6), 0.0),
                     (w(7, 4), 3.5), (s(8), 2.0), (w(9, 0), -3.0), (s(10), 2.0), (w(10, 9), -4.0)]
        K["gx"] = [(0, 0.0), (s(2), 0.75), (w(2, 5), 0.0), (w(3, 1), 0.85), (s(4), 0.85), (w(4, 6), 0.0),
                   (s(5), 0.7), (w(5, 4), 0.0), (w(6, 5), 0.6), (w(6, 10), 0.0), (s(8), 0.85),
                   (w(8, 12) + 0.35, 0.0), (w(9, 2), 0.7), (e(9), 0.0), (s(10), 0.75), (w(10, 3), 0.0)]
        K["gy"] = [(0, 0.0), (w(3, 1), -0.5), (s(4), 0.0), (w(9, 2), -0.4), (e(9), 0.0)]
        K["turn"] = [(0, 0.0), (s(2), 0.45), (w(2, 5), 0.0), (w(3, 1), 0.55), (s(4), 0.6), (w(4, 6), 0.1),
                     (s(5), 0.4), (w(5, 4), 0.0), (s(8), 0.55), (w(8, 12) + 0.35, 0.1), (w(9, 2), 0.4),
                     (e(9), 0.0), (s(10), 0.45), (w(10, 3), 0.0)]
        K["brow"] = [(0, 0.5), (s(2), 0.3), (w(2, 5), 0.9), (s(3), -0.35), (s(4), 0.25), (w(4, 6), 0.8),
                     (s(5), 0.3), (s(6), 0.4), (w(7, 4), 1.0), (s(8), 0.3), (w(9, 0), 1.0), (s(10), 0.4)]
        K["think"] = [(0, 0.0), (s(3), 1.0), (s(4), 0.0)]
        K["smile"] = [(0, 0.85), (s(2), 0.7), (w(2, 5), 1.0), (s(3), 0.1), (s(4), 0.7), (w(4, 6), 1.0),
                      (s(5), 0.8), (s(6), 0.85), (w(7, 4), 1.0), (s(8), 0.75), (w(9, 0), 1.0), (s(10), 0.85)]
        # kleine Hüpfer
        self.hops = [(w(2, 5) - 0.02, 16), (w(7, 4) - 0.02, 20), (w(9, 3) - 0.02, 22)]
        return K

    # ------------------------------------------------------------ Simulation
    def _build(self):
        K = self._keys()
        n = int(self.dur * RATE) + 2
        dt = 1.0 / RATE
        ts = np.arange(n) * dt
        self.ts = ts
        arrs = {k: np.zeros(n) for k in
                ["Lx", "Ly", "La", "Rx", "Ry", "Ra", "lean", "tilt", "gx", "gy", "turn", "brow", "think",
                 "smile", "nod", "browimp", "ear", "bun", "dy", "stretch", "blink", "beat"]}
        shapesL, shapesR = [], []

        def arm_springs(a0):
            return [Spring2(a0.wx, 2.4, 0.52), Spring2(a0.wy, 2.4, 0.52), Spring2(a0.ang, 2.6, 0.5)]

        sL = arm_springs(K["L"][0][1])
        sR = arm_springs(K["R"][0][1])
        sc = {k: Spring2(K[k][0][1], f, z) for k, f, z in
              [("lean", 1.6, 0.6), ("tilt", 1.8, 0.55), ("gx", 5.0, 0.8), ("gy", 5.0, 0.8),
               ("turn", 2.2, 0.7), ("brow", 3.0, 0.6), ("think", 2.5, 0.8), ("smile", 2.5, 0.8)]}
        nod = Spring2(0.0, 3.6, 0.35)
        browimp = Spring2(0.0, 3.0, 0.5)
        beat = Spring2(0.0, 4.0, 0.4)
        hop = Spring2(0.0, 2.2, 0.32)
        ear = [0.0, 0.0]
        bun = [0.0, 0.0]
        prev_hx = [0.0, 0.0]
        prev_hy = [0.0, 0.0]

        stress = sorted(self.feats["stress"])
        si = 0
        hop_i = 0
        unwrap = {"L": None, "R": None}

        rng = np.random.RandomState(11)
        # Blinzeln: unregelmässig, ab und zu doppelt
        blinks = []
        tb = 1.6
        while tb < self.dur:
            blinks.append(tb)
            if rng.rand() < 0.22:
                blinks.append(tb + 0.24)
            tb += rng.uniform(2.0, 4.6)
        # Mikrosakkaden
        sacc = []
        tsc = 0.0
        while tsc < self.dur:
            sacc.append((tsc, rng.uniform(-0.18, 0.18), rng.uniform(-0.12, 0.12)))
            tsc += rng.uniform(0.45, 1.3)

        def arm_target(side, t):
            a = _target(K[side], t)
            return a

        for i, t in enumerate(ts):
            for side, sp, shapes in (("L", sL, shapesL), ("R", sR, shapesR)):
                a = arm_target(side, t)
                ang = a.ang
                cur = sp[2].x
                while ang - cur > 180:
                    ang -= 360
                while ang - cur < -180:
                    ang += 360
                sp[0].step(a.wx, dt)
                sp[1].step(a.wy, dt)
                sp[2].step(ang, dt)
                # Handform wechselt kurz nach dem Posenwechsel
                ks = [k for k in K[side] if k[0] <= t - 0.07]
                shapes.append(ks[-1][1].shape if ks else K[side][0][1].shape)
            for k, spr in sc.items():
                arrs[k][i] = spr.step(_target(K[k], t), dt)
            # Betonungen -> Nicken, Brauen, Hand-Beat
            imp_n = 0.0
            while si < len(stress) and stress[si] <= t:
                nod.v += 95.0
                browimp.v += 7.0
                beat.v += 260.0
                si += 1
            while hop_i < len(self.hops) and self.hops[hop_i][0] <= t:
                hop.v -= self.hops[hop_i][1] * 14
                hop_i += 1
            arrs["nod"][i] = nod.step(0.0, dt)
            arrs["browimp"][i] = browimp.step(0.0, dt)
            arrs["beat"][i] = beat.step(0.0, dt)
            # Sprung (Szene 1)
            dyj, st = self._jump(t)
            arrs["dy"][i] = dyj + hop.step(0.0, dt)
            arrs["stretch"][i] = st
            arrs["Lx"][i], arrs["Ly"][i], arrs["La"][i] = sL[0].x, sL[1].x, sL[2].x
            arrs["Rx"][i], arrs["Ry"][i], arrs["Ra"][i] = sR[0].x, sR[1].x, sR[2].x
            # Kopfposition für Pendel
            hx = arrs["lean"][i] * 7.0 + arrs["tilt"][i] * 2.6
            hy = arrs["dy"][i] + arrs["nod"][i]
            ax = (hx - 2 * prev_hx[0] + prev_hx[1]) / dt ** 2 if i > 1 else 0.0
            ay = (hy - 2 * prev_hy[0] + prev_hy[1]) / dt ** 2 if i > 1 else 0.0
            prev_hx[1], prev_hx[0] = prev_hx[0], hx
            prev_hy[1], prev_hy[0] = prev_hy[0], hy
            ax = clamp(ax, -6000, 6000)
            ay = clamp(ay, -6000, 6000)
            tilt_r = math.radians(arrs["tilt"][i] + arrs["lean"][i])
            # Ohrringe: Pendel (träge, wenig Dämpfung)
            w0 = 2 * math.pi * 1.55
            th = ear[0]
            acc = -w0 ** 2 * math.sin(th + tilt_r) - 2 * 0.09 * w0 * ear[1] - ax * 0.0016 * math.cos(th) \
                  + ay * 0.0006 * math.sin(th)
            ear[1] += acc * dt
            ear[0] += ear[1] * dt
            arrs["ear"][i] = math.degrees(ear[0])
            w1 = 2 * math.pi * 1.2
            accb = -w1 ** 2 * bun[0] - 2 * 0.25 * w1 * bun[1] - ax * 0.0006 + ay * 0.0002
            bun[1] += accb * dt
            bun[0] += bun[1] * dt
            arrs["bun"][i] = math.degrees(bun[0])
            # Blinzeln
            bk = 0.0
            for b0 in blinks:
                u = t - b0
                if -0.01 < u < 0.2:
                    if u < 0.06:
                        bk = max(bk, u / 0.06)
                    elif u < 0.09:
                        bk = 1.0
                    else:
                        bk = max(bk, 1 - (u - 0.09) / 0.1)
            arrs["blink"][i] = clamp(bk)
        self.arrs = arrs
        self.shapesL = shapesL
        self.shapesR = shapesR
        self.sacc = sacc

    def _jump(self, t):
        """Sprung hinter dem Tisch hoch: Hochschnellen, Scheitel, Landung mit Squash."""
        j0 = self.jump_t
        depth = 640.0
        apex = -46.0
        ta = 0.40
        g = 2 * (depth - apex) / ta ** 2  # Beschleunigung, damit Scheitel bei ta
        if t < j0:
            return depth, 1.0
        u = t - j0
        if u < ta:
            v0 = g * ta
            y = depth - (v0 * u - 0.5 * g * u * u)
            return y, 1.0 + 0.10 * (1 - u / ta)
        fall_t = math.sqrt(2 * (-apex) / g)
        if u < ta + fall_t:
            uu = u - ta
            return apex + 0.5 * g * uu * uu, 1.02
        ul = u - ta - fall_t
        sq = -0.10 * math.exp(-7.0 * ul) * math.cos(2 * math.pi * 3.2 * ul)
        return 6.0 * math.exp(-8 * ul) * math.sin(2 * math.pi * 3.2 * ul), 1.0 + sq

    # ------------------------------------------------------------ Abfrage
    def _at(self, name, t):
        x = t * RATE
        i = int(clamp(x, 0, len(self.ts) - 2))
        f = x - i
        a = self.arrs[name]
        return a[i] * (1 - f) + a[i + 1] * f

    def _feat(self, name, t):
        arr = self.feats[name]
        x = t * RATE
        i = int(clamp(x, 0, len(arr) - 2))
        f = clamp(x - i)
        return arr[i] * (1 - f) + arr[i + 1] * f

    def rig(self, t):
        A = self._at
        i = int(clamp(t * RATE, 0, len(self.ts) - 1))
        r = Rig()
        r.dy = A("dy", t)
        r.stretch = A("stretch", t)
        speaking = self._feat("active", t + 0.03)
        r.lean = A("lean", t) + 0.8 * noise1(t * 0.6, 21)
        r.breath = math.sin(2 * math.pi * t / 3.6)
        r.head_tilt = A("tilt", t) + 1.6 * noise1(t * 0.9, 5) + 1.2 * speaking * noise1(t * 2.2, 8)
        r.head_nod = A("nod", t) * 2.0 + 1.5 * noise1(t * 1.3, 9)
        r.head_turn = A("turn", t)
        # Blick + Mikrosakkaden
        sx = sy = 0.0
        for (ts_, dx, dy) in self.sacc:
            if ts_ <= t:
                sx, sy = dx, dy
            else:
                break
        r.gaze_x = clamp(A("gx", t) + sx, -1, 1)
        r.gaze_y = clamp(A("gy", t) + sy, -1, 1)
        r.blink = A("blink", t)
        r.brow = clamp(A("brow", t) + A("browimp", t) * 1.0, -1, 1.3)
        r.brow_think = A("think", t)
        # Lip-Sync: Mund minimal vor dem Ton
        r.mouth_open = clamp(self._feat("open", t + 0.035))
        r.mouth_wide = clamp(self._feat("wide", t + 0.035), -1, 1)
        r.smile = clamp(A("smile", t) - 0.25 * r.mouth_open * 0.5)
        r.ear_swing = clamp(A("ear", t), -40, 40)
        r.bun_swing = clamp(A("bun", t), -8, 8)
        # Arme
        beat = A("beat", t)
        La = Arm(A("Lx", t), A("Ly", t), A("La", t), self.shapesL[i])
        Ra = Arm(A("Rx", t), A("Ry", t), A("Ra", t), self.shapesR[i])
        for (w0, w1) in self.wave_spans:
            if w0 <= t <= w1:
                env = smoothstep(w0, w0 + 0.2, t) * (1 - smoothstep(w1 - 0.2, w1, t))
                ph = 2 * math.pi * 2.5 * (t - w0)
                La.ang += 24 * math.sin(ph) * env
                La.wx += 12 * math.sin(ph - 0.6) * env
        j0, j1 = self.jazz_span
        if j0 <= t <= j1:
            env = smoothstep(j0, j0 + 0.1, t) * (1 - smoothstep(j1 - 0.2, j1, t))
            jz = math.sin(2 * math.pi * 7.0 * (t - j0)) * env
            La.ang += 9 * jz
            Ra.ang -= 9 * jz
        # Hand-Beats nur bei Gesten-Posen
        if Ra.shape in ("open", "point"):
            Ra.wy -= beat * 1.2
            Ra.ang -= beat * 0.5
        # Atmung hebt die Arme minimal
        La.wy -= r.breath * 1.5
        Ra.wy -= r.breath * 1.5
        r.armL = La
        r.armR = Ra
        return r
