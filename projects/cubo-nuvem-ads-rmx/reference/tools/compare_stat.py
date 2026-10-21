"""7 em 10 scene verification. usage: python3 compare_stat.py <video> <snap_dir>"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image, ImageFilter

V, S = sys.argv[1:3]
tmp = tempfile.mkdtemp()


def ref(t):
    out = os.path.join(tmp, f'r_{t}.png')
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', V, '-frames:v', '1', out], check=True)
    return np.asarray(Image.open(out).convert('L')).astype(np.float32)


def snap(t):
    return np.asarray(Image.open(os.path.join(S, f'snap_{t}.png')).convert('L')).astype(np.float32)


W = {'7': (446, 571, 149, 349), 'em': (607, 787, 149, 349), '10': (814, 1065, 149, 349),
     'brasileiros': (437, 755, 395, 463), 'ja': (765, 818, 395, 463), 'usam': (837, 1000, 395, 463), 'IA': (1020, 1077, 395, 463),
     'na': (413, 481, 475, 540), 'jornada': (503, 743, 475, 540), 'de': (761, 839, 475, 540), 'compra': (856, 1097, 475, 540)}

print('=== 1) FINAL positions at t=22.0: per-word bbox (x0,x1,y0,y1) REF vs SNAP, brightness > bg+60')
fr, fs = ref('22.0'), snap('22.0')
bgr, bgs = np.median(fr[40:80, 300:1200]), np.median(fs[40:80, 300:1200])
for k, (x0, x1, y0, y1) in W.items():
    def bb(im, bg):
        m = im[y0 - 25:y1 + 25, x0 - 25:x1 + 25] > bg + 60
        r = np.where(m.sum(axis=1) > 1)[0]; c = np.where(m.sum(axis=0) > 0)[0]
        return None if len(r) == 0 else (x0 - 25 + c.min(), x0 - 25 + c.max(), y0 - 25 + r.min(), y0 - 25 + r.max())
    a, b = bb(fr, bgr), bb(fs, bgs)
    d = None if a is None or b is None else tuple(int(v - u) for u, v in zip(a, b))
    print(f'  {k:12s} REF {tuple(int(v) for v in a) if a else None}  SNAP {tuple(int(v) for v in b) if b else None}  d={d}')

print('=== 2) per-word opacity alpha / blur sigma at entrance times  (alpha|sigma)   REF vs SNAP')
sig = [0, 2, 4, 6, 8, 10, 13, 16, 20, 25, 30, 36, 44, 54]


def prep(fin, bg, box, pad=70):
    x0, x1, y0, y1 = box
    F = np.clip(fin[y0 - pad:y1 + pad + 1, x0 - pad:x1 + pad + 1] - bg, 0, None)
    im = Image.fromarray(np.clip(F, 0, 255).astype(np.uint8))
    return {s: (np.asarray(im.filter(ImageFilter.GaussianBlur(s))).astype(np.float32) if s > 0 else F) for s in sig}


GR = {k: prep(fr, bgr, b) for k, b in W.items()}
GS = {k: prep(fs, bgs, b) for k, b in W.items()}


def fit(X, G, box, pad=70):
    x0, x1, y0, y1 = box
    Xc = X[y0 - pad:y1 + pad + 1, x0 - pad:x1 + pad + 1]
    Xc = Xc - np.median(np.concatenate([Xc[:3].ravel(), Xc[-3:].ravel()]))
    best = None
    for s in sig:
        g = G[s]; den = (g * g).sum()
        if den <= 0: continue
        a = max(0.0, (Xc * g).sum() / den); e = ((Xc - a * g) ** 2).sum()
        if best is None or e < best[0]: best = (e, a, s)
    return best[1], best[2]


for t in ('19.5', '19.6', '19.7', '19.8', '19.9', '20.0', '20.1', '20.2', '20.3', '20.4'):
    xr, xs = ref(t), snap(t)
    row = []
    for k in W:
        ar, sr = fit(xr, GR[k], W[k]); as_, ss = fit(xs, GS[k], W[k])
        row.append(f'{k[:5]}:{ar:.2f}/{sr:.0f}|{as_:.2f}/{ss:.0f}')
    print(f't={t}: ' + '  '.join(row))
