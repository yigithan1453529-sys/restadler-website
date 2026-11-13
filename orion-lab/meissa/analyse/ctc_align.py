"""CTC-Zwangsausrichtung: Zeichen des bekannten Textes -> Zeiten im Ton."""
import sys, json, subprocess, numpy as np
import onnxruntime as ort
mdir, wav, out = sys.argv[1], sys.argv[2], sys.argv[3]
TEXT = ("sie haben es bestimmt schon gesehen und nicht gemerkt grosse marken drehen ihre werbung längst nicht mehr "
        "nur mit kamera und crew heute entstehen bilder auf kinoniveau in einem bruchteil der zeit und der kosten "
        "kein drehteam keine reise kein wetterglück nur ihre idee so gross erzählt wie sie sie gedacht haben "
        "und falls sie sich fragen auch diese szene hat es nie gegeben mich übrigens auch nicht orion lab "
        "ideen die man sonst nicht drehen könnte")
T_START, T_END = 9.9, 40.149
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(T_START), "-i", wav, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"])
x = np.frombuffer(raw, np.float32).copy()
x = (x - x.mean()) / (x.std() + 1e-8)
so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession(mdir + "/model.int8.onnx", so, providers=["CPUExecutionProvider"])
print("inputs:", [(i.name, i.shape, i.type) for i in sess.get_inputs()])
print("outputs:", [(o.name, o.shape) for o in sess.get_outputs()])
print("meta:", dict(sess.get_modelmeta().custom_metadata_map))
tok = {}
for line in open(mdir + "/tokens.txt", encoding="utf-8"):
    parts = line.rstrip("\n").rsplit(" ", 1)
    if len(parts) == 2:
        tok[parts[0]] = int(parts[1])
inp = sess.get_inputs()
feed = {inp[0].name: x[None, :]}
if len(inp) > 1:
    feed[inp[1].name] = np.array([len(x)], dtype=np.int64)
outs = sess.run(None, feed)
logits = outs[0][0]
print("logits", logits.shape, "dauer", len(x) / 16000, "s -> Schritt", len(x) / 16000 / logits.shape[0] * 1000, "ms")
lp = logits - np.log(np.exp(logits - logits.max(1, keepdims=True)).sum(1, keepdims=True)) - logits.max(1, keepdims=True)
# greedy zur Kontrolle
inv = {v: k for k, v in tok.items()}
ids = lp.argmax(1); prev = -1; s = ""
blank = tok.get("<blank>", tok.get("<blk>", tok.get("<pad>", 0)))
for i in ids:
    if i != prev and i != blank:
        s += inv.get(int(i), "?")
    prev = i
print("blank id", blank, "| greedy:", s[:400])
np.save(out + "/ctc_lp.npy", lp.astype(np.float32))
json.dump(dict(tokens=tok, blank=blank, t_start=T_START, step=len(x) / 16000 / logits.shape[0], text=TEXT), open(out + "/ctc_meta.json", "w"), ensure_ascii=False)
