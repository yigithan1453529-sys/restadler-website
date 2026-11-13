import sys, json, numpy as np
work = sys.argv[1]
lp = np.load(work + "/ctc_lp.npy").astype(np.float64)
meta = json.load(open(work + "/ctc_meta.json"))
tok = meta["tokens"]; step = meta["step"]; t0 = meta["t_start"]
blank = tok["<s>"]
text = meta["text"].replace("grosse", "große").replace("gross ", "groß ")
chars = list(text)
ids = []
for ch in chars:
    if ch not in tok:
        raise SystemExit("Zeichen fehlt im Vokabular: %r" % ch)
    ids.append(tok[ch])
T = lp.shape[0]; L = len(ids); S = 2 * L + 1
ext = [blank] * S
for i, k in enumerate(ids): ext[2 * i + 1] = k
NEG = -1e30
dp = np.full((T, S), NEG); bp = np.zeros((T, S), np.int8)
dp[0, 0] = lp[0, blank]; dp[0, 1] = lp[0, ext[1]]
for t in range(1, T):
    for s in range(max(0, S - 2 * (T - t)), min(S, 2 * (t + 1))):
        best = dp[t - 1, s]; arg = 0
        if s >= 1 and dp[t - 1, s - 1] > best: best = dp[t - 1, s - 1]; arg = 1
        if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2] and dp[t - 1, s - 2] > best: best = dp[t - 1, s - 2]; arg = 2
        dp[t, s] = best + lp[t, ext[s]]; bp[t, s] = arg
s = S - 1 if dp[T - 1, S - 1] > dp[T - 1, S - 2] else S - 2
path = np.zeros(T, int)
for t in range(T - 1, -1, -1):
    path[t] = s; s = int(s) - int(bp[t, s])
spans = []
for i in range(L):
    fr = np.where(path == 2 * i + 1)[0]
    spans.append((chars[i], float(t0 + fr[0] * step), float(t0 + (fr[-1] + 1) * step), float(np.exp(lp[fr, ids[i]]).max())))
json.dump(spans, open(work + "/chars.json", "w"), ensure_ascii=False)
# Ausgabe wortweise
line = ""; w = ""; ws = None
for ch, a, b, p in spans:
    if ch == " ":
        line += "%s[%.2f] " % (w, ws); w = ""; ws = None
    else:
        if ws is None: ws = a
        w += ch
line += "%s[%.2f]" % (w, ws)
print(line)
low = [(c, round(a, 2), round(p, 2)) for c, a, b, p in spans if p < 0.3 and c != " "]
print("unsichere Zeichen (p<0.3):", low[:40])
