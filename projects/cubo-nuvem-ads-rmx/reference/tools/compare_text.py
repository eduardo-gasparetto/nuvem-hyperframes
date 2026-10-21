"""Compare title/pill rendering between reference video frames and composition snapshots.
usage: python3 compare_text.py <video.mp4> <snap_dir>
Snapshots expected as <snap_dir>/snap_<t>.png
"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image

V, S = sys.argv[1], sys.argv[2]
tmp = tempfile.mkdtemp()


def ref(t):
    out = os.path.join(tmp, f'ref_{t}.png')
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', V, '-frames:v', '1', out], check=True)
    return np.asarray(Image.open(out).convert('L')).astype(np.float32)


def snap(t):
    return np.asarray(Image.open(os.path.join(S, f'snap_{t}.png')).convert('L')).astype(np.float32)


def bbox(im, box, th):
    x0, y0, x1, y1 = box
    m = im[y0:y1, x0:x1] > th
    r = np.where(m.sum(axis=1) >= 3)[0]
    c = np.where(m.sum(axis=0) >= 2)[0]
    if len(r) == 0 or len(c) == 0:
        return None
    return (x0 + c.min(), y0 + r.min(), x0 + c.max(), y0 + r.max())


def line_bboxes(im, th=140):
    """bbox of the bright title text: line1 rows 190-345, line2 rows 345-470"""
    return bbox(im, (230, 190, 1290, 345), th), bbox(im, (230, 345, 1290, 470), th)


def fmt(b):
    return '-' if b is None else f'x{b[0]}-{b[2]} y{b[1]}-{b[3]}'


print('=== Title bounding boxes (line1 | line2), brightness>140')
for t in ('3.0', '5.5'):
    r1, r2 = line_bboxes(ref(t))
    s1, s2 = line_bboxes(snap(t))
    print(f't={t}  REF  {fmt(r1)} | {fmt(r2)}')
    print(f'       SNAP {fmt(s1)} | {fmt(s2)}')
    if r1 and s1 and r2 and s2:
        d = [abs(a - b) for a, b in zip(r1 + r2, s1 + s2)]
        print(f'       max abs diff px: {max(d)}')

print('=== Title opacity proxy (p99.5-p5 contrast vs final) at entrance times')
reg = (slice(236, 445), slice(230, 1290))


def contrast(im):
    r = im[reg]
    return np.percentile(r, 99.5) - np.percentile(r, 5)


for tag, final_t, times in (('title1', '3.0', ['0.1', '0.2', '0.33', '0.5', '0.7', '0.9']),
                            ('title1 exit', '3.0', ['3.8']),
                            ('title2', '5.5', ['4.1', '4.5'])):
    fr, fs = contrast(ref(final_t)), contrast(snap(final_t))
    for t in times:
        print(f'{tag:12s} t={t:5s} REF {contrast(ref(t)) / fr:5.2f}  SNAP {contrast(snap(t)) / fs:5.2f}')

print('=== Pill: text pixel count (>150) in region x0-420,y10-150 and tight bbox of bright text')
for t in ('0.7', '0.9', '1.1', '1.3', '1.6'):
    a, b = ref(t)[10:150, 0:420], snap(t)[10:150, 0:420]
    print(f't={t}: REF {int((a > 150).sum()):5d}  SNAP {int((b > 150).sum()):5d}')

print('=== Pill geometry in SNAP (edge by brightness step vs neighbour column), centre row y=77')
for t in ('0.1', '0.2', '0.33', '0.5', '0.7', '0.9', '1.1', '1.3', '1.6'):
    im = snap(t)
    row = im[70:85, 0:420].mean(axis=0)
    base = np.convolve(row, np.ones(41) / 41, mode='same')
    d = row - base
    xs = np.where(np.abs(d) > 1.5)[0]
    print(f't={t}: columns with |dev|>1.5: {xs.min() if len(xs) else None}..{xs.max() if len(xs) else None}')
