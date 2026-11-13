"""MediaPipe FaceLandmarker pro Bild (IMAGE-Modus, ohne zeitliche Glättung)."""
import subprocess, sys, numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
src, model, out = sys.argv[1], sys.argv[2], sys.argv[3]
T0 = float(sys.argv[4]) if len(sys.argv) > 4 else 10.0
X, Y, S = 560, 100, 800
cmd = ["ffmpeg", "-v", "error", "-ss", str(T0), "-i", src, "-vf", f"crop={S}:{S}:{X}:{Y}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
opts = vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=model),
                                    running_mode=vision.RunningMode.IMAGE, num_faces=1,
                                    output_face_blendshapes=True, min_face_detection_confidence=0.3,
                                    min_face_presence_confidence=0.3)
det = vision.FaceLandmarker.create_from_options(opts)
L, Bs, ok = [], [], []
names = None
while True:
    buf = p.stdout.read(S * S * 3)
    if len(buf) < S * S * 3:
        break
    img = np.frombuffer(buf, np.uint8).reshape(S, S, 3)
    res = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
    if res.face_landmarks:
        lm = np.array([[q.x * S + X, q.y * S + Y, q.z * S] for q in res.face_landmarks[0]])
        bs = res.face_blendshapes[0]
        if names is None:
            names = [b.category_name for b in bs]
        L.append(lm); Bs.append([b.score for b in bs]); ok.append(1)
    else:
        L.append(np.full((478, 3), np.nan)); Bs.append([np.nan] * 52); ok.append(0)
L = np.array(L); Bs = np.array(Bs)
np.savez(out, lm=L, bs=Bs, names=np.array(names), ok=np.array(ok), t0=T0)
print("Bilder:", len(L), "erkannt:", int(np.sum(ok)))
