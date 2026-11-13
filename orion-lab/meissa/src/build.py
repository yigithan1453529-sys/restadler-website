"""Baut die fertige Fassung: Bild unverändert (Stream-Kopie), Ton neu.

  python build.py <original.mp4> <ausgabe.mp4> [arbeitsordner]

Ton = lippensynchron korrigierte Stimme + Intro-Musik (klingt unter dem
ersten Satz aus), Gesamtlautheit ca. -15 LUFS, Spitzen max. -1.5 dBFS.
"""
import json
import os
import subprocess
import sys

import numpy as np

import intro_music
import sync_fix

SR = 48000
TARGET_LUFS = -15.0
MUSIC_BELOW_VOICE_LU = 4.0     # Intro-Musik etwas leiser als die Stimme
DUCK_DB = -8.0                 # zusätzliche Absenkung, sobald sie spricht


def write_wav(path, x):
    x = np.asarray(x, np.float32)
    ch = 1 if x.ndim == 1 else x.shape[1]
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
                          "-c:a", "pcm_s24le", path], stdin=subprocess.PIPE)
    p.stdin.write(x.tobytes())
    p.stdin.close()
    p.wait()


def loudness(path, t0=None, dur=None):
    cmd = ["ffmpeg", "-hide_banner"]
    if t0 is not None:
        cmd += ["-ss", str(t0), "-t", str(dur)]
    cmd += ["-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"]
    r = subprocess.run(cmd, capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    out = {}
    for line in tail.splitlines():
        line = line.strip()
        if line.startswith("I:"):
            out["I"] = float(line.split()[1])
        if line.startswith("Peak:"):
            out["TP"] = float(line.split()[1])
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    work = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(dst) or ".", "build")
    os.makedirs(work, exist_ok=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                         "stream=duration", "-of", "csv=p=0", src]).decode().strip())
    n = int(round(dur * SR))
    # 1) Stimme lippensynchron setzen
    voice = sync_fix.read_mono(src)
    print("Sync-Korrektur:")
    voice, mapping = sync_fix.apply_schedule(voice, total_len=n)
    json.dump(mapping, open(os.path.join(work, "mapping.json"), "w"))
    write_wav(os.path.join(work, "voice_fixed.wav"), voice)
    v_i = loudness(os.path.join(work, "voice_fixed.wav"))["I"]
    speech = np.where(np.abs(voice) > 0.01)[0]
    t_speech = speech[0] / SR
    # 2) Intro-Musik
    mus = intro_music.build()
    m = np.zeros((n, 2))
    k = min(n, len(mus))
    m[:k] = mus[:k]
    write_wav(os.path.join(work, "music_raw.wav"), m)
    m_i = loudness(os.path.join(work, "music_raw.wav"), 0, 10.0)["I"]
    gain = 10 ** (((v_i - MUSIC_BELOW_VOICE_LU) - m_i) / 20)
    t = np.arange(n) / SR
    duck = 10 ** (DUCK_DB * np.clip((t - (t_speech - 0.12)) / 0.30, 0, 1) / 20)
    m *= (gain * duck)[:, None]
    # 3) Mischen, Pegel, Begrenzer
    mix = m + voice[:, None]
    fade_out = np.clip((dur - t) / 0.12, 0, 1)
    mix *= fade_out[:, None]
    pre = os.path.join(work, "mix_pre.wav")
    write_wav(pre, mix)
    g_db = TARGET_LUFS - loudness(pre)["I"]
    final = os.path.join(work, "mix.wav")
    for _ in range(2):
        subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", pre, "-af",
                               f"volume={g_db:.2f}dB,alimiter=limit=0.82:attack=3:release=60:level=disabled",
                               "-ar", str(SR), "-c:a", "pcm_s24le", final])
        res = loudness(final)
        g_db += TARGET_LUFS - res["I"]
    print("Stimme beginnt bei %.3f s | Lautheit %.1f LUFS, Spitze %.1f dBFS" % (t_speech, res["I"], res["TP"]))
    # 4) Bild unverändert übernehmen, neuen Ton einsetzen
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", src, "-i", final, "-map", "0:v:0", "-map", "1:a:0",
                           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst])
    print("Fertig:", dst)


if __name__ == "__main__":
    main()
