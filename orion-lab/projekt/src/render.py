"""Einstiegspunkt.

  python render.py testframes            Testbilder der vollsten Momente
  python render.py audio                 Stimme schneiden, Zeitachse, Mix
  python render.py video [--parts N]     ganzes Video (in Teilen, dann zusammenfügen)
  python render.py vertical              9:16-Version aus dem fertigen 16:9-Video
"""
import argparse
import os
import subprocess
import sys
import time

import numpy as np
import skia

from common import ROOT, BUILD, W, H, FPS, hexc
from timeline import Timeline, estimate_timeline
from motion import Motion
from scene import Director

TEST_DIR = os.path.join(ROOT, "testbilder")
OUT_VIDEO = os.path.join(ROOT, "ORION-LAB_Erklaervideo.mp4")
OUT_PREVIEW = os.path.join(ROOT, "ORION-LAB_Erklaervideo_ohne-Stimme.mp4")


def load_timeline():
    p = os.path.join(BUILD, "timeline.json")
    if os.path.exists(p):
        return Timeline.load(p)
    return estimate_timeline()


def load_features(T):
    p = os.path.join(BUILD, "voice_features.npz")
    if os.path.exists(p) and T.source != "schaetzung":
        d = np.load(p, allow_pickle=True)
        return dict(open=d["open"], wide=d["wide"], stress=list(d["stress"]), active=d["active"])
    return None


def key_moments(T, D):
    ev = D.ev
    return [
        ("01_hallo_winken", T.e(1) - 0.02),
        ("02_tolles_angebot", T.w(2, 5) + 0.25),
        ("03_lange_texte", ev["papers_away"] - 0.03),
        ("04_erklaervideo_bildschirm", T.e(4) + 0.1),
        ("05_kurz_klar_charakter", T.e(5) + 0.1),
        ("06_branchen", T.e(6)),
        ("07_beste_art_tada", min(T.e(7) + 0.05, ev["tada"] + 0.9)),
        ("08_rezept_kolben", min(T.e(8), ev["tags"][2][1] + 0.7)),
        ("09_fertig_karte", ev["card"] + 0.75),
        ("10_cta_abspann", T.duration - 0.35),
    ]


def cmd_testframes(args):
    os.makedirs(TEST_DIR, exist_ok=True)
    T = load_timeline()
    M = Motion(T, load_features(T))
    D = Director(T, M)
    shots = key_moments(T, D)
    if args.only:
        shots = [s for s in shots if any(o in s[0] for o in args.only.split(","))]
    thumbs = []
    for name, t in shots:
        t0 = time.time()
        surf = D.render(t)
        img = surf.makeImageSnapshot()
        p = os.path.join(TEST_DIR, f"{name}.png")
        img.save(p, skia.kPNG)
        thumbs.append((name, img))
        print(f"{name}: t={t:.2f}s  ({time.time() - t0:.2f}s)")
    if not args.only:
        # Kontaktbogen
        cols, rows = 2, (len(thumbs) + 1) // 2
        tw, th = 960, 540
        sheet = skia.Surface(cols * tw + (cols + 1) * 12, rows * th + (rows + 1) * 12)
        c = sheet.getCanvas()
        c.clear(hexc("#131417"))
        for i, (name, img) in enumerate(thumbs):
            x = 12 + (i % cols) * (tw + 12)
            y = 12 + (i // cols) * (th + 12)
            c.drawImageRect(img, skia.Rect.MakeXYWH(x, y, tw, th), skia.SamplingOptions(skia.FilterMode.kLinear))
        sheet.makeImageSnapshot().save(os.path.join(TEST_DIR, "00_uebersicht.png"), skia.kPNG)
    print("Zeitachse:", T.source, f"Dauer {T.duration:.2f}s")


def render_range(f0, f1, out_path):
    T = load_timeline()
    M = Motion(T, load_features(T))
    D = Director(T, M)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
           "-pix_fmt", "yuv420p", out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    surf = skia.Surface(W, H)
    for f in range(f0, f1):
        D.render(f / FPS, surf)
        arr = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)
        proc.stdin.write(arr.tobytes())
    proc.stdin.close()
    proc.wait()


def cmd_part(args):
    render_range(args.f0, args.f1, args.out)


def cmd_video(args):
    T = load_timeline()
    out_video = OUT_VIDEO
    if args.ohne_stimme:
        if T.source != "schaetzung":
            raise SystemExit("--ohne-stimme nur ohne build/timeline.json")
        import audio
        audio.sfx_only()
        out_video = OUT_PREVIEW
    nframes = int(round(T.duration * FPS))
    parts = args.parts
    bounds = [round(i * nframes / parts) for i in range(parts + 1)]
    pdir = os.path.join(BUILD, "parts")
    os.makedirs(pdir, exist_ok=True)
    procs = []
    t0 = time.time()
    for i in range(parts):
        out = os.path.join(pdir, f"part_{i:02d}.mp4")
        procs.append(subprocess.Popen([sys.executable, __file__, "part", str(bounds[i]), str(bounds[i + 1]), out]))
    for p in procs:
        p.wait()
        if p.returncode != 0:
            raise SystemExit("Teil fehlgeschlagen")
    print(f"{nframes} Bilder in {time.time() - t0:.0f}s gerendert")
    lst = os.path.join(pdir, "list.txt")
    with open(lst, "w") as f:
        for i in range(parts):
            f.write(f"file 'part_{i:02d}.mp4'\n")
    silent = os.path.join(BUILD, "video_silent.mp4")
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                           "-c", "copy", silent])
    mix = os.path.join(BUILD, "mix.wav")
    if os.path.exists(mix):
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", mix,
                               "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                               "-shortest", "-movflags", "+faststart", out_video])
        print("Fertig:", out_video)
    else:
        print("Kein Ton (build/mix.wav fehlt) – stummes Video:", silent)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd")
    a = sub.add_parser("testframes")
    a.add_argument("--only", default="")
    a = sub.add_parser("video")
    a.add_argument("--parts", type=int, default=4)
    a.add_argument("--ohne-stimme", action="store_true", help="Vorschau mit geschätzten Zeiten, nur Effekte")
    a = sub.add_parser("part")
    a.add_argument("f0", type=int)
    a.add_argument("f1", type=int)
    a.add_argument("out")
    sub.add_parser("audio")
    sub.add_parser("vertical")
    args = ap.parse_args()
    if args.cmd == "testframes":
        cmd_testframes(args)
    elif args.cmd == "video":
        cmd_video(args)
    elif args.cmd == "part":
        cmd_part(args)
    elif args.cmd == "audio":
        import audio
        audio.main()
    elif args.cmd == "vertical":
        import vertical
        vertical.main()
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
