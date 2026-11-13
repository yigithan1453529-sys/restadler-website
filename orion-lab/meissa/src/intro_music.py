"""Intro-Musik für «Meissa – Laborgespräch» (synthetisch, keine Fremdrechte).

4 Takte in 96 BPM = genau 10 s: Fläche, gezupftes E-Piano-Arpeggio, weicher
Bass, dezenter Puls, kleines Glockenmotiv. Der Schlussakkord fällt auf den
Schnitt zur Nahaufnahme (10.033 s) und klingt unter dem ersten Satz aus.

Akkorde (D-Dur):  | Hm9 | Gmaj9 | D/Fis | Asus4 – A |  ->  Dadd9
"""
import numpy as np
from scipy import signal

SR = 48000
BPM = 96.0
BEAT = 60.0 / BPM            # 0.625 s
BAR = 4 * BEAT               # 2.5 s
T_OFF = 0.033                # Taktraster so, dass Takt 5 auf dem Bildschnitt liegt
T_HIT = T_OFF + 4 * BAR      # 10.033 s
DUR = 15.5


def hz(note):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n = names[note[0]]
    rest = note[1:]
    if rest[0] == "#":
        n += 1
        rest = rest[1:]
    octv = int(rest)
    return 440.0 * 2 ** ((n - 9) / 12 + (octv - 4))


def _place(buf, t, snd, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(buf) or i < 0:
        return
    n = min(len(snd), len(buf) - i)
    if snd.ndim == 2:
        buf[i:i + n] += snd[:n] * gain
        return
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i + n, 0] += snd[:n] * gain * l
    buf[i:i + n, 1] += snd[:n] * gain * r


def ep_note(f, dur=1.6, bright=1.0, decay=0.55):
    """Weiches FM-E-Piano / Kalimba."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = (1.6 * bright) * np.exp(-t / 0.07) + 0.25 * bright
    mod = np.sin(2 * np.pi * f * 1.0 * t)
    car = np.sin(2 * np.pi * f * t + idx * mod)
    tine = 0.12 * bright * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t / 0.05)
    env = np.minimum(1.0, t / 0.004) * np.exp(-t / decay)
    rel = np.clip((dur - t) / 0.08, 0, 1)
    return (car + tine) * env * rel


def bell_note(f, dur=2.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 1.1 * np.exp(-t / 0.5) + 0.15
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 4.0 * t))
    y += 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.4)
    env = np.minimum(1.0, t / 0.006) * np.exp(-t / 0.9)
    return y * env * np.clip((dur - t) / 0.1, 0, 1)


def saw_bl(f, n, fmax=3200.0, phase=0.0):
    """Bandbegrenzter Sägezahn (additiv), reicht für die tiefpassgefilterte Fläche."""
    t = np.arange(n) / SR
    y = np.zeros(n)
    k = 1
    while k * f < fmax:
        y += np.sin(2 * np.pi * k * f * t + phase * k) / k ** 1.5
        k += 1
    return y * 0.6


def pad_chord(freqs, dur, attack=0.7, release=1.2, seed=0):
    n = int((dur + release) * SR)
    rng = np.random.RandomState(seed)
    out = np.zeros((n, 2))
    for f in freqs:
        for det, pan in [(-7, -0.7), (0, 0.0), (6, 0.7), (11, -0.3)]:
            ff = f * 2 ** (det / 1200)
            y = saw_bl(ff, n, phase=rng.rand() * 6.28)
            vib = 1 + 0.03 * np.sin(2 * np.pi * rng.uniform(0.15, 0.4) * np.arange(n) / SR + rng.rand() * 6.28)
            y = y * vib
            out[:, 0] += y * np.cos((pan + 1) * np.pi / 4)
            out[:, 1] += y * np.sin((pan + 1) * np.pi / 4)
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / attack) ** 1.5 * np.where(t < dur, 1.0, np.exp(-(t - dur) / (release / 3.5)))
    return out * env[:, None] / (len(freqs) * 2.2)


def bass_note(f, dur):
    n = int((dur + 0.3) * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(1.0, t / 0.04) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.08))
    env *= 0.75 + 0.25 * np.exp(-t / 0.6)
    return np.tanh(y * 0.9) * env


def kick():
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 46 + 70 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    return y * np.minimum(1.0, t / 0.002)


def shaker(seed=0, dur=0.07):
    n = int(dur * SR)
    rng = np.random.RandomState(seed)
    x = rng.randn(n)
    sos = signal.butter(2, [5500, 11000], btype="band", fs=SR, output="sos")
    y = signal.sosfilt(sos, x)
    t = np.arange(n) / SR
    return y * np.minimum(1.0, t / 0.004) * np.exp(-t / 0.022)


def riser(dur=2.0, seed=3):
    n = int(dur * SR)
    rng = np.random.RandomState(seed)
    x = rng.randn(n)
    f, tt, Z = signal.stft(x, SR, nperseg=2048)
    cen = np.geomspace(500, 5000, Z.shape[1])
    mask = np.exp(-0.5 * ((np.log(f[:, None] + 1) - np.log(cen[None, :])) / 0.45) ** 2)
    _, y = signal.istft(Z * mask, SR, nperseg=2048)
    y = y[:n]
    t = np.arange(n) / dur / SR
    return y / (np.abs(y).max() + 1e-9) * t ** 2.2


def impact(seed=5):
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 30 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5)
    rng = np.random.RandomState(seed)
    nz = rng.randn(n)
    body = signal.sosfilt(signal.butter(2, 1800, btype="low", fs=SR, output="sos"), nz) * np.exp(-t / 0.16) * 0.5
    air = signal.sosfilt(signal.butter(2, 5000, btype="high", fs=SR, output="sos"), nz) * np.exp(-t / 0.75) * 0.10
    return (sub * 0.9 + body + air) * np.minimum(1.0, t / 0.003)


def reverb(x, rt60=2.3, wet=0.3, seed=11):
    n = int(rt60 * 1.3 * SR)
    rng = np.random.RandomState(seed)
    t = np.arange(n) / SR
    out = np.zeros((len(x) + n - 1, 2))
    for ch in range(2):
        ir = rng.randn(n) * np.exp(-t * 6.91 / rt60)
        ir = signal.sosfilt(signal.butter(2, [220, 5200], btype="band", fs=SR, output="sos"), ir)
        ir[: int(0.022 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        mono_send = 0.7 * x[:, ch] + 0.3 * x[:, 1 - ch]
        out[:, ch] = signal.fftconvolve(mono_send, ir)
    out = out[: len(x)]
    return x + wet * out


def pingpong(x, delay=0.46875, fb=0.38, mix=0.32):
    d = int(delay * SR)
    out = x.copy()
    tap = x.copy()
    sos = signal.butter(1, 3200, btype="low", fs=SR, output="sos")
    g = mix
    for k in range(5):
        tap = np.roll(tap, d, axis=0)
        tap[:d] = 0
        tap = tap[:, ::-1].copy()
        tap = signal.sosfilt(sos, tap, axis=0)
        out += g * tap
        g *= fb
    return out


def build():
    n = int(DUR * SR)
    pad = np.zeros((n, 2))
    arp = np.zeros((n, 2))
    low = np.zeros((n, 2))
    perc = np.zeros((n, 2))
    bell = np.zeros((n, 2))
    fx = np.zeros((n, 2))

    chords = [
        (["B3", "D4", "F#4", "A4", "C#5"], "B2"),
        (["B3", "D4", "F#4", "A4"], "G2"),
        (["A3", "D4", "E4", "A4"], "F#2"),
        (["A3", "D4", "E4", "A4"], "A2"),
    ]
    for b, (notes, root) in enumerate(chords):
        t0 = T_OFF + b * BAR
        _place(pad, max(0.0, t0 - 0.15), pad_chord([hz(x) for x in notes], BAR + 0.1, seed=b), 1.0)
        _place(low, t0, bass_note(hz(root), BAR - 0.12), 0.55)
    # Takt 4, zweite Hälfte: Asus4 löst sich nach A auf
    _place(pad, T_OFF + 3 * BAR + 2 * BEAT - 0.1, pad_chord([hz("C#4"), hz("E4"), hz("A4")], 2 * BEAT, attack=0.35, seed=9), 0.55)
    # Schlussakkord Dadd9
    _place(pad, T_HIT - 0.1, pad_chord([hz(x) for x in ["A3", "D4", "E4", "F#4", "A4"]], 1.6, attack=0.25, release=3.4, seed=7), 0.95)
    _place(low, T_HIT, bass_note(hz("D2"), 2.2), 0.45)

    # Arpeggio in Achteln, wird von Takt zu Takt präsenter
    arps = [
        ["F#4", "A4", "C#5", "A4", "D5", "A4", "C#5", "A4"],
        ["F#4", "B4", "D5", "B4", "F#5", "B4", "D5", "A4"],
        ["E4", "A4", "D5", "A4", "E5", "A4", "D5", "F#5"],
        ["E4", "A4", "D5", "A4", "E5", "A4", "C#5", "E5"],
    ]
    vel = [0.34, 0.5, 0.64, 0.78]
    for b, notes in enumerate(arps):
        for k, nt in enumerate(notes):
            if b == 0 and k in (1, 5):
                continue
            t = T_OFF + b * BAR + k * BEAT / 2
            acc = 1.0 if k % 4 == 0 else (0.82 if k % 2 == 0 else 0.66)
            _place(arp, t, ep_note(hz(nt), 1.5, bright=0.7 + 0.3 * vel[b]), vel[b] * acc * 0.5, pan=(-0.35 if k % 2 == 0 else 0.35))
    # kleiner Auftakt in Sechzehnteln zum Schlussakkord
    for k, nt in enumerate(["A4", "C#5", "E5", "A5"]):
        _place(arp, T_HIT - (4 - k) * BEAT / 4, ep_note(hz(nt), 1.0, bright=1.0), 0.30 + 0.05 * k, pan=-0.3 + 0.2 * k)
    # Schlussakkord gezupft (leicht arpeggiert)
    for k, nt in enumerate(["D3", "A3", "D4", "F#4", "A4", "E5"]):
        _place(arp, T_HIT + k * 0.014, ep_note(hz(nt), 3.4, bright=1.0, decay=1.3), 0.34, pan=-0.4 + 0.16 * k)

    # Glockenmotiv: A – Fis – E – D … Fis
    for t_b, nt, g in [(1 * BAR + 2 * BEAT, "A5", 0.20), (2 * BAR, "F#5", 0.22), (2 * BAR + 2 * BEAT, "E5", 0.22),
                       (3 * BAR, "D5", 0.24), (3 * BAR + 2 * BEAT, "E5", 0.22)]:
        _place(bell, T_OFF + t_b, bell_note(hz(nt)), g, pan=0.15)
    _place(bell, T_HIT, bell_note(hz("F#5"), 3.2), 0.26, pan=0.15)
    _place(bell, T_HIT + 0.02, bell_note(hz("A5"), 3.2), 0.16, pan=-0.2)

    # Puls: weiche Kick ab Takt 2, Shaker ab Takt 3
    kk = kick()
    for b in range(1, 4):
        beats = [0, 2] if b < 3 else [0, 1, 2, 3]
        for q in beats:
            _place(perc, T_OFF + b * BAR + q * BEAT, kk, 0.42 if q % 2 == 0 else 0.3)
    for b in range(2, 4):
        for k in range(8):
            g = 0.10 if k % 2 == 1 else 0.05
            if b == 3:
                g *= 1.3
            _place(perc, T_OFF + b * BAR + k * BEAT / 2, shaker(seed=b * 8 + k), g, pan=0.3)

    # Anstieg zum Schnitt + Akzent
    rs = riser(1.9)
    _place(fx, T_HIT - 1.9, rs, 0.11)
    _place(fx, T_HIT, impact(), 0.3)

    # Fläche: von dunkel nach hell überblenden
    dark = signal.sosfilt(signal.butter(2, 650, btype="low", fs=SR, output="sos"), pad, axis=0)
    brightp = signal.sosfilt(signal.butter(2, 2300, btype="low", fs=SR, output="sos"), pad, axis=0)
    tt = np.arange(n) / SR
    w = np.clip((tt - 0.5) / (T_HIT - 0.5), 0, 1) ** 1.3
    pad = dark * (1 - w)[:, None] + brightp * w[:, None]
    pad = signal.sosfilt(signal.butter(2, 140, btype="high", fs=SR, output="sos"), pad, axis=0)

    arp = pingpong(arp)
    wet_bus = pad * 0.95 + arp * 1.0 + bell * 1.0 + fx * 0.8 + perc * 0.25
    mix = reverb(wet_bus, wet=0.34) + low * 1.0 + perc * 0.75
    # Einblenden, Ausklingen nach dem Schlussakkord
    fade_in = np.clip(tt / 0.9, 0, 1) ** 1.4
    tail = np.where(tt < T_HIT + 0.25, 1.0, np.exp(-(tt - T_HIT - 0.25) / 1.15))
    tail *= np.clip((14.6 - tt) / 1.2, 0, 1)
    mix *= (fade_in * tail)[:, None]
    mix = signal.sosfilt(signal.butter(2, 38, btype="high", fs=SR, output="sos"), mix, axis=0)
    mix = np.tanh(mix * 1.1) / 1.1
    return mix / (np.abs(mix).max() + 1e-9) * 0.7


if __name__ == "__main__":
    import subprocess
    import sys
    m = build()
    out = sys.argv[1] if len(sys.argv) > 1 else "intro_music.wav"
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                          "-c:a", "pcm_s24le", out], stdin=subprocess.PIPE)
    p.stdin.write(m.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    print("geschrieben:", out, "%.2f s" % (len(m) / SR))
