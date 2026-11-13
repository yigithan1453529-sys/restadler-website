import sys, json, subprocess, numpy as np
import sherpa_onnx
mdir, wav, out = sys.argv[1], sys.argv[2], sys.argv[3]
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", wav, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"])
x = np.frombuffer(raw, np.float32)
rec = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=mdir + "/encoder.int8.onnx", decoder=mdir + "/decoder.int8.onnx", joiner=mdir + "/joiner.int8.onnx",
    tokens=mdir + "/tokens.txt", model_type="nemo_transducer", num_threads=4)
s = rec.create_stream()
s.accept_waveform(16000, x)
rec.decode_stream(s)
r = s.result
print(r.text)
toks = list(r.tokens); ts = list(r.timestamps)
json.dump(dict(text=r.text, tokens=toks, timestamps=ts), open(out, "w"), ensure_ascii=False, indent=1)
# Wörter aus Tokens
words = []; cur = ""; t0 = None
for tk, t in zip(toks, ts):
    if tk.startswith(" ") or tk.startswith("▁") or cur == "":
        if cur:
            words.append((t0, cur))
        cur = tk.strip(" ▁"); t0 = t
    else:
        cur += tk
if cur:
    words.append((t0, cur))
print(" | ".join("%.2f %s" % (t, w) for t, w in words))
