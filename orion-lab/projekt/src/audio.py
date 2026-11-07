"""Ton: Stimme schneiden (Pausen > 0.5 s -> 0.35 s, ohne Zeitdehnung),
Lip-Sync-Merkmale, Satz-/Wortzeiten, Soundeffekte, Musik mit Ducking,
Lautheit -15 LUFS.

Eingaben (assets/):  voice.wav  (KIE, Gemini-TTS «Leda», eine Aufnahme)
                     musik_2.mp3
Ausgaben (build/):   voice.wav, voice_features.npz, timeline.json, sfx.wav, mix.wav
"""
import json
import math
import os
import subprocess

import numpy as np
from scipy import signal

from common import ASSETS, BUILD
from timeline import LEAD_IN, OUTRO, Timeline, align_to_voice, speech_segments

SR = 48000
FEAT_RATE = 120

MAX_PAUSE = 0.5     # längere Pausen werden gekürzt …
NEW_PAUSE = 0.35    # … auf diese Länge
XFADE = 0.02


# ------------------------------------------------------------------ Ein-/Ausgabe
def read_audio(path, sr=SR, mono=True):
    cmd = ["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le",
           "-ac", "1" if mono else "2", "-ar", str(sr), "-"]
    raw = subprocess.check_output(cmd)
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    if not mono:
        x = x.reshape(-1, 2)
    return x


def write_wav(path, x, sr=SR):
    x = np.asarray(x, np.float32)
    ch = 1 if x.ndim == 1 else x.shape[1]
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(sr), "-ac", str(ch), "-i", "-",
           "-c:a", "pcm_s24le", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    p.stdin.write(x.tobytes())
    p.stdin.close()
    p.wait()


def env_db(x, sr=SR, rate=200, win=0.025):
    hop = int(sr / rate)
    w = int(sr * win)
    n = max(1, (len(x) - w) // hop + 1)
    idx = np.arange(n)[:, None] * hop + np.arange(w)[None, :]
    idx = np.clip(idx, 0, len(x) - 1)
    rms = np.sqrt(np.mean(x[idx] ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-9)


def silence_threshold(db):
    peak = np.percentile(db, 99)
    floor = np.percentile(db, 5)
    return max(floor + 10, peak - 42)


# ------------------------------------------------------------------ Pausen kürzen
def shorten_pauses(x, sr=SR):
    rate = 200
    db = env_db(x, sr, rate)
    thr = silence_threshold(db)
    quiet = db < thr
    runs = []
    i = 0
    n = len(quiet)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            runs.append((i / rate, j / rate))
            i = j
        else:
            i += 1
    stats = dict(threshold_db=float(thr), pauses_before=[], pauses_after=[])
    # Anfang/Ende
    start = runs[0][1] - 0.04 if runs and runs[0][0] <= 0.01 else 0.0
    end = len(x) / sr
    if runs and runs[-1][1] >= end - 0.01:
        end = min(end, runs[-1][0] + 0.25)
    inner = [r for r in runs if r[0] > start + 0.05 and r[1] < end - 0.05]
    stats["pauses_before"] = [round(b - a, 3) for a, b in inner if b - a >= 0.08]
    keep = []
    cur = start
    for a, b in inner:
        if b - a > MAX_PAUSE:
            half = (NEW_PAUSE + XFADE) / 2
            keep.append((cur, a + half))
            cur = b - half
    keep.append((cur, end))
    xf = int(XFADE * sr)
    out = np.zeros(0)
    for k, (a, b) in enumerate(keep):
        seg = x[int(a * sr): int(b * sr)].copy()
        if len(out) and xf > 0 and len(seg) > xf:
            ramp = np.linspace(0, 1, xf)
            out[-xf:] = out[-xf:] * (1 - ramp) + seg[:xf] * ramp
            seg = seg[xf:]
        out = np.concatenate([out, seg])
    db2 = env_db(out, sr, rate)
    q2 = db2 < thr
    i = 0
    while i < len(q2):
        if q2[i]:
            j = i
            while j < len(q2) and q2[j]:
                j += 1
            if i > 0 and j < len(q2) and (j - i) / rate >= 0.08:
                stats["pauses_after"].append(round((j - i) / rate, 3))
            i = j
        else:
            i += 1
    stats["max_pause_before"] = max(stats["pauses_before"] or [0])
    stats["max_pause_after"] = max(stats["pauses_after"] or [0])
    return out, stats


# ------------------------------------------------------------------ Lip-Sync-Merkmale
def voice_features(v, sr=SR, rate=FEAT_RATE, offset=LEAD_IN, total=None):
    hop = sr // rate
    nwin = 1024
    db = env_db(v, sr, rate, 0.03)
    thr = silence_threshold(env_db(v, sr, 200))
    # Mundöffnung aus der Lautstärke
    op = np.clip((db - (thr + 4)) / 26.0, 0, 1) ** 0.85
    # Mundbreite aus dem Spektrum: hohe F2-Energie (i/e) vs. tiefe (o/u)
    f, tt, Z = signal.stft(v, sr, nperseg=nwin, noverlap=nwin - hop, boundary=None, padded=True)
    P = np.abs(Z) ** 2
    lo = P[(f >= 250) & (f < 900)].sum(0) + 1e-12
    hi = P[(f >= 1700) & (f < 3500)].sum(0) + 1e-12
    ratio = 10 * np.log10(hi / lo)
    m = min(len(ratio), len(op))
    ratio = ratio[:m]
    op = op[:m]
    voiced = op > 0.15
    if voiced.sum() > 10:
        med = np.median(ratio[voiced])
        spread = np.percentile(ratio[voiced], 90) - np.percentile(ratio[voiced], 10) + 1e-6
        wide = np.clip((ratio - med) / spread * 2.2, -1, 1)
    else:
        wide = np.zeros(m)
    wide = np.where(voiced, wide, 0.0)
    # Glätten (schnell auf, etwas langsamer zu)
    def smooth(a, up, down):
        out = np.zeros_like(a)
        y = 0.0
        for i, v_ in enumerate(a):
            k = up if v_ > y else down
            y += (v_ - y) * k
            out[i] = y
        return out
    op = smooth(op, 0.65, 0.38)
    wide = smooth(wide, 0.3, 0.3)
    # Betonungen: starke Lautheits-Anstiege
    sm = np.convolve(db, np.ones(6) / 6, mode="same")[:m]
    rise = np.diff(sm, prepend=sm[0])
    cand = [i for i in range(2, m - 2) if rise[i] > rise[i - 1] and rise[i] >= rise[i + 1] and op[min(m - 1, i + 4)] > 0.4]
    cand.sort(key=lambda i: -rise[i])
    strong = []
    thr_r = np.percentile(rise[cand], 55) if cand else 0
    for i in cand:
        if rise[i] < thr_r:
            break
        if all(abs(i - j) > 0.32 * rate for j in strong):
            strong.append(i)
    stress = sorted(i / rate + offset for i in strong)
    # in Videozeit verschieben
    pad = int(round(offset * rate))
    total_n = int((total or (m / rate + offset + OUTRO + 1)) * rate)
    def place(a):
        out = np.zeros(total_n)
        n_ = min(len(a), total_n - pad)
        out[pad:pad + n_] = a[:n_]
        return out
    op_v = place(op)
    return dict(open=op_v, wide=place(wide), stress=np.array(stress), active=(op_v > 0.08).astype(float))


# ------------------------------------------------------------------ Soundeffekte (synthetisch)
def _env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-t / d)


def sfx_pop(pitch=1.0, rng=None):
    n = int(0.13 * SR)
    t = np.arange(n) / SR
    f = (950 * pitch) * np.exp(-t * 22) + 260 * pitch
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * _env(n, 0.002, 0.045)
    click = np.random.RandomState(1).randn(n) * _env(n, 0.0005, 0.004) * 0.3
    return (y + click) * 0.9


def sfx_ding(f0=1318.5):
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for mul, amp, dec in [(1, 1.0, 0.55), (2.76, 0.45, 0.28), (5.40, 0.22, 0.16), (8.93, 0.1, 0.09)]:
        y += amp * np.sin(2 * np.pi * f0 * mul * t) * np.exp(-t / dec)
    y *= np.minimum(1, t / 0.002)
    return y * 0.5


def _band_noise(n, f_lo, f_hi, seed=0):
    rng = np.random.RandomState(seed)
    x = rng.randn(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024)
    nt = Z.shape[1]
    centers = np.geomspace(f_lo, f_hi, nt)
    mask = np.exp(-0.5 * (np.log(f[:, None] + 1) - np.log(centers[None, :])) ** 2 / 0.35 ** 2)
    _, y = signal.istft(Z * mask, SR, nperseg=1024)
    y = y[:n]
    return y / (np.abs(y).max() + 1e-9)


def sfx_whoosh(dur=0.45, up=True, seed=0):
    n = int(dur * SR)
    y = _band_noise(n, 500 if up else 2800, 2800 if up else 500, seed)
    t = np.arange(n) / n
    env = np.sin(np.pi * t) ** 1.6
    return y * env * 0.55


def sfx_bubbles(dur, seed=0, density=12):
    n = int(dur * SR)
    y = np.zeros(n)
    rng = np.random.RandomState(seed)
    t = 0.0
    while t < dur - 0.08:
        m = int(0.05 * SR)
        tt = np.arange(m) / SR
        f0 = rng.uniform(260, 520)
        f = f0 * (1 + 2.2 * tt / 0.05)
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.05) ** 2 * rng.uniform(0.3, 1.0)
        i = int(t * SR)
        y[i:i + m] += b[: max(0, min(m, n - i))]
        t += rng.exponential(1.0 / density)
    fizz = _band_noise(n, 3000, 4500, seed + 1) * 0.06
    return (y * 0.35 + fizz)


def sfx_glitter(dur=1.0, seed=0):
    n = int(dur * SR)
    y = np.zeros(n)
    rng = np.random.RandomState(seed)
    for k in range(34):
        t0 = rng.uniform(0, dur * 0.75) ** 1.3 / (dur * 0.75) ** 0.3
        f = rng.uniform(2800, 7500)
        m = int(0.12 * SR)
        tt = np.arange(m) / SR
        p = np.sin(2 * np.pi * f * tt) * np.exp(-tt / rng.uniform(0.02, 0.06)) * rng.uniform(0.2, 0.7)
        i = int(t0 * SR)
        y[i:i + m] += p[: max(0, min(m, n - i))]
    tt = np.arange(n) / SR
    shimmer = np.sin(2 * np.pi * (1200 + 1400 * tt / dur) * tt) * np.sin(np.pi * tt / dur) * 0.08
    return (y + shimmer) * 0.6


def sfx_plop():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 620 * np.exp(-t * 16) + 140
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.07)
    splash = _band_noise(n, 2500, 1200, 7) * _env(n, 0.003, 0.06) * 0.35
    return (y + splash) * 0.8


def sfx_click():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 2200 * t) * _env(n, 0.0005, 0.008) + np.random.RandomState(3).randn(n) * _env(n, 0.0002, 0.003) * 0.5
    return y * 0.7


def db2lin(d):
    return 10 ** (d / 20)


def build_sfx(D, total):
    """Effekt-Spur aus den Ereigniszeiten der Regie."""
    T = D.T
    ev = D.ev
    n = int(total * SR) + SR
    y = np.zeros(n)

    def add(t, snd, gain_db):
        i = int(t * SR)
        if i < 0 or i >= n:
            return
        m = min(len(snd), n - i)
        y[i:i + m] += snd[:m] * db2lin(gain_db)

    add(D.M.jump_t, sfx_whoosh(0.42, True, 1), -16)
    add(D.M.jump_t + 0.55, sfx_pop(0.7), -20)
    for (b, t_open, t_close) in D.bubbles:
        add(t_open, sfx_pop(1.25), -27)
    add(ev["super"], sfx_glitter(0.7, 2), -22)
    for i, tp in enumerate(ev["papers"]):
        add(tp, sfx_whoosh(0.32, False, 10 + i), -21)
    for k, tq in enumerate(ev["qmarks"]):
        add(tq, sfx_pop(1.0 + 0.12 * k), -21)
    add(ev["papers_away"], sfx_whoosh(0.6, True, 3), -14)
    add(ev["screen_in"], sfx_pop(0.8), -20)
    add(ev["play"], sfx_pop(1.1), -21)
    add(ev["bulb"], sfx_pop(1.3), -21)
    add(ev["arrow"][0], sfx_whoosh(0.3, True, 5), -24)
    add(ev["smiley"], sfx_pop(1.45), -20)
    for k, tp in enumerate(ev["pills"]):
        add(tp, sfx_pop(1.0 + 0.1 * k), -22)
        add(tp + 0.12, sfx_ding(1318.5 * 2 ** (k * 2 / 12)), -24)
    add(ev["screen_out"], sfx_whoosh(0.3, False, 6), -22)
    for k, ti in enumerate(ev["icons"]):
        add(ti, sfx_pop(0.9 + 0.08 * k), -21)
    scale = [0, 2, 4, 5, 7, 9]
    for k, tc in enumerate(ev["checks"]):
        add(tc, sfx_ding(1046.5 * 2 ** (scale[k] / 12)), -24)
    add(ev["tada"], sfx_glitter(1.0, 4), -19)
    add(ev["flask_in"], sfx_pop(0.75), -20)
    add(ev["flask_in"] + 0.1, sfx_bubbles(ev["flask_out"] - ev["flask_in"] + 0.1, 8, 10), -25)
    for k, (txt, tk) in enumerate(ev["tags"]):
        add(tk - 0.36, sfx_whoosh(0.4, False, 20 + k), -24)
        add(tk + 0.10, sfx_plop(), -17)
    add(ev["glow"] - 0.05, sfx_glitter(1.4, 6), -17)
    add(ev["card"], sfx_whoosh(0.35, True, 9), -19)
    add(ev["card"] + 0.2, sfx_pop(1.2), -19)
    add(ev["logo"], sfx_pop(0.85), -19)
    add(ev["wordmark"], sfx_whoosh(0.3, True, 11), -25)
    add(ev["button"], sfx_pop(1.05), -19)
    add(ev["click"], sfx_click(), -16)
    add(ev["click"] + 0.03, sfx_glitter(0.6, 12), -24)
    return y[: int(total * SR)]


# ------------------------------------------------------------------ Musik
def build_music(path, total, voice_active, rate=FEAT_RATE):
    m = read_audio(path, SR, mono=False)
    n = int(total * SR)
    if len(m) < n:
        reps = int(math.ceil(n / len(m)))
        m = np.concatenate([m] * reps)
    m = m[:n]
    t = np.arange(n) / SR
    fade_in = np.clip(t / 1.2, 0, 1) ** 1.5
    fade_out = np.clip((total - t) / 2.3, 0, 1) ** 1.3
    # Ducking: Stimme aktiv -> Musik leiser (Attack 0.12 s, Release 0.5 s)
    act = np.interp(t, np.arange(len(voice_active)) / rate, voice_active, right=0.0)
    hold = np.convolve(act[::48], np.ones(25), mode="same")[: len(act[::48])]  # ~25 ms Haltezeit
    hold = np.clip(hold, 0, 1)
    duck = np.zeros_like(hold)
    y = 0.0
    a_up = 1 - math.exp(-1 / (0.12 * 1000))
    a_dn = 1 - math.exp(-1 / (0.5 * 1000))
    for i, v in enumerate(hold):
        y += (v - y) * (a_up if v > y else a_dn)
        duck[i] = y
    duck = np.interp(t, np.arange(len(duck)) * 48 / SR, duck)
    g = db2lin(-6.5 * duck)
    return m * (fade_in * fade_out * g)[:, None]


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def loudnorm(src, dst, target=-15.0, tp=-1.5):
    cmd = ["ffmpeg", "-hide_banner", "-i", src, "-af", f"loudnorm=I={target}:TP={tp}:LRA=11:print_format=json",
           "-f", "null", "-"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    txt = r.stderr[r.stderr.rfind("{"): r.stderr.rfind("}") + 1]
    m = json.loads(txt)
    af = (f"loudnorm=I={target}:TP={tp}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
          f"linear=true")
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", af, "-ar", str(SR),
                           "-c:a", "pcm_s24le", dst])
    return m


def measure(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    out = {}
    for line in tail.splitlines():
        line = line.strip()
        if line.startswith("I:"):
            out["LUFS"] = float(line.split()[1])
        if line.startswith("Peak:"):
            out["TruePeak_dBFS"] = float(line.split()[1])
    return out


# ------------------------------------------------------------------ Ablauf
def find_asset(stem, exts):
    for e in exts:
        p = os.path.join(ASSETS, stem + e)
        if os.path.exists(p):
            return p
    return os.path.join(ASSETS, stem + exts[0])


def prepare_voice(src=None):
    src = src or find_asset("voice", [".wav", ".mp3", ".m4a", ".ogg"])
    if not os.path.exists(src):
        raise SystemExit(f"Stimme fehlt: {src} (KIE-Aufnahme als assets/voice.wav ablegen)")
    raw = read_audio(src)
    v, stats = shorten_pauses(raw)
    peak = np.abs(v).max()
    if peak > 0:
        v = v / peak * db2lin(-3)
    write_wav(os.path.join(BUILD, "voice.wav"), v)
    return v, stats


def build_timeline(v):
    db = env_db(v, SR, FEAT_RATE, 0.03)
    thr = silence_threshold(env_db(v, SR, 200))
    segs = speech_segments(db, 1.0 / FEAT_RATE, thr_db=thr + 2, min_gap=0.11)
    segs = [[a + LEAD_IN, b + LEAD_IN] for a, b in segs]
    words = align_to_voice(segs, LEAD_IN)
    T = Timeline(words, LEAD_IN, len(v) / SR, "stimme")
    T.save()
    return T


def main(voice_src=None, music_src=None):
    from motion import Motion
    from scene import Director
    v, stats = prepare_voice(voice_src)
    T = build_timeline(v)
    total = T.duration
    feats = voice_features(v, total=total + 0.5)
    np.savez(os.path.join(BUILD, "voice_features.npz"), **feats)
    M = Motion(T, feats)
    D = Director(T, M)
    sfx = build_sfx(D, total)
    n = int(total * SR)
    voice_track = np.zeros(n)
    i0 = int(LEAD_IN * SR)
    m = min(len(v), n - i0)
    voice_track[i0:i0 + m] = v[:m]
    music_src = music_src or os.path.join(ASSETS, "musik_2.mp3")
    if os.path.exists(music_src):
        mus = build_music(music_src, total, feats["active"])
        # Musik ca. 15 dB unter der Stimme (beim Sprechen), Pausen etwas lauter
        vr = rms_db(v[np.abs(v) > 0.02]) if np.any(np.abs(v) > 0.02) else -20
        mr = rms_db(mus.mean(1)[: int(min(total, 20) * SR)]) + 1e-9
        mus *= db2lin((vr - 13.5) - mr)
    else:
        print("WARNUNG: Musik fehlt:", music_src)
        mus = np.zeros((n, 2))
    sfx_gain = db2lin(rms_db(v[np.abs(v) > 0.02]) + 15) if np.any(np.abs(v) > 0.02) else 1.0
    mix = mus + (voice_track + sfx * sfx_gain)[:, None]
    pre = os.path.join(BUILD, "mix_pre.wav")
    write_wav(pre, mix)
    loudnorm(pre, os.path.join(BUILD, "mix.wav"))
    write_wav(os.path.join(BUILD, "sfx.wav"), sfx)
    res = measure(os.path.join(BUILD, "mix.wav"))
    rep = dict(pausen=stats, dauer_stimme=round(len(v) / SR, 2), dauer_video=round(total, 2), lautheit=res,
               saetze=[(round(T.s(k), 2), round(T.e(k), 2)) for k in range(1, len(T.words) + 1)])
    with open(os.path.join(BUILD, "audio_report.json"), "w") as f:
        json.dump(rep, f, indent=1, ensure_ascii=False)
    print(json.dumps(rep, indent=1, ensure_ascii=False))
    return rep


def sfx_only(target_lufs=-21.0):
    """Vorschau ohne Stimme: nur Soundeffekte (und Musik, falls vorhanden)."""
    from motion import Motion
    from scene import Director
    from timeline import estimate_timeline
    T = estimate_timeline()
    M = Motion(T)
    D = Director(T, M)
    total = T.duration
    sfx = build_sfx(D, total)
    sfx = sfx / (np.abs(sfx).max() + 1e-9) * 0.5
    mix = np.stack([sfx, sfx], 1)
    music_src = os.path.join(ASSETS, "musik_2.mp3")
    if os.path.exists(music_src):
        mus = build_music(music_src, total, M.feats["active"], rate=120)
        mus *= db2lin(rms_db(sfx[np.abs(sfx) > 0.01]) - 4 - rms_db(mus.mean(1)[: int(min(total, 20) * SR)]))
        mix = mix + mus
    pre = os.path.join(BUILD, "mix_pre.wav")
    write_wav(pre, mix)
    loudnorm(pre, os.path.join(BUILD, "mix.wav"), target=target_lufs)
    res = measure(os.path.join(BUILD, "mix.wav"))
    print("Vorschau-Ton:", res)
    return res


if __name__ == "__main__":
    main()
