"""Compare icon pop + avatar emergence between the reference video and composition snapshots.
usage: python3 compare_icons.py <video.mp4> <snap_dir> <t1> <t2> ...   (snap files: snap_<t>.png; last t = final-state reference)
"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image

V, S = sys.argv[1], sys.argv[2]
TS = sys.argv[3:]
tmp = tempfile.mkdtemp()


def ref(t):
    out = os.path.join(tmp, f'r_{t}.png')
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', V, '-frames:v', '1', out], check=True)
    return np.asarray(Image.open(out).convert('RGB')).astype(np.float32)


def snap(t):
    return np.asarray(Image.open(os.path.join(S, f'snap_{t}.png')).convert('RGB')).astype(np.float32)


cent = {'google': (1314.2, 539.4), 'tiktok': (200.9, 544.9), 'whatsapp': (213.4, 219.3), 'instagram': (1273.4, 156.6)}
avw = {'google': (1382, 540, 1417, 615), 'tiktok': (84, 512, 138, 590), 'whatsapp': (97, 158, 150, 236), 'instagram': (1345, 146, 1383, 222)}
pair_box = {'google': (1240, 465, 1430, 625), 'tiktok': (70, 470, 270, 625), 'whatsapp': (85, 145, 285, 285), 'instagram': (1200, 85, 1400, 235)}


def mask(name, w):
    R, G, B = w[..., 0], w[..., 1], w[..., 2]
    if name == 'google': return (R > 205) & (G > 205) & (B > 205)
    if name == 'whatsapp': return (G > 140) & (R < 110) & (B < 130)
    if name == 'instagram': return (R > 170) & (G < 170) & (B < 200) & (R > B - 40)
    if name == 'tiktok': return (B < 75) & (R < 80)


def diam(im, k):
    cx, cy = cent[k]
    x0, y0 = int(cx - 75), int(cy - 75)
    c = mask(k, im[y0:y0 + 150, x0:x0 + 150]).sum()
    return 2 * np.sqrt(c / np.pi) if c > 12 else 0.0


def avfrac(im, k, bg, fin):
    x0, y0, x1, y1 = avw[k]
    n = (np.abs(im[y0:y1, x0:x1] - bg).sum(axis=2) > 90).sum()
    return n / max(1, fin)


bg0 = {k: np.median(ref(TS[0])[avw[k][1]:avw[k][3], avw[k][0]:avw[k][2]], axis=(0, 1)) for k in avw}
last = TS[-1]
finr = {k: (np.abs(ref(last)[avw[k][1]:avw[k][3], avw[k][0]:avw[k][2]] - bg0[k]).sum(axis=2) > 90).sum() for k in avw}
fins = {k: (np.abs(snap(last)[avw[k][1]:avw[k][3], avw[k][0]:avw[k][2]] - bg0[k]).sum(axis=2) > 90).sum() for k in avw}
dfr = {k: max(1e-6, diam(ref(last), k)) for k in cent}
dfs = {k: max(1e-6, diam(snap(last), k)) for k in cent}

print('=== icon scale (diameter / final)   REF | SNAP   per icon')
print('t     ' + '   '.join(f'{k:>16}' for k in cent))
for t in TS:
    r, s = ref(t), snap(t)
    print(f'{t:5s} ' + '   '.join(f'{diam(r, k) / dfr[k]:6.2f} |{diam(s, k) / dfs[k]:6.2f} ' for k in cent))
print('=== avatar visible fraction (window pixels / final)   REF | SNAP')
for t in TS:
    r, s = ref(t), snap(t)
    print(f'{t:5s} ' + '   '.join(f'{avfrac(r, k, bg0[k], finr[k]):6.2f} |{avfrac(s, k, bg0[k], fins[k]):6.2f} ' for k in cent))
print('=== final state: mean abs RGB diff REF vs SNAP inside icon+avatar box (t=%s), and bg-only reference box' % last)
r, s = ref(last), snap(last)
for k, (x0, y0, x1, y1) in pair_box.items():
    d = np.abs(r[y0:y1, x0:x1] - s[y0:y1, x0:x1]).mean()
    print(f'  {k:10s} mean abs diff {d:5.1f}')
