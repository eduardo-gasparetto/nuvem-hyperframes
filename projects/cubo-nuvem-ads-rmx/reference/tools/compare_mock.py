"""Compare mockup entrance, page scroll and connector lines between video and snapshots.
usage: python3 compare_mock.py <video.mp4> <snap_dir> <page.jpg>
"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image, ImageFilter

V, S, PAGE = sys.argv[1:4]
tmp = tempfile.mkdtemp()


def ref(t):
    out = os.path.join(tmp, f'r_{t}.png')
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', V, '-frames:v', '1', out], check=True)
    return Image.open(out).convert('RGB')


def snap(t):
    return Image.open(os.path.join(S, f'snap_{t}.png')).convert('RGB')


def arr(im):
    return np.asarray(im).astype(np.float32)


# ---- 1) mean abs RGB diff in the mockup region + top edge by row profile
print('=== mockup region diff (REF vs SNAP), region x372-1140, y40-672   [lower = better; static-bg noise floor ~5]')
for t in ('5.9', '6.0', '6.1', '6.3', '6.6', '7.0', '8.0', '8.5', '10.0'):
    a, b = arr(ref(t)), arr(snap(t))
    d = np.abs(a[40:672, 372:1140] - b[40:672, 372:1140]).mean()
    # compare rows where each image first differs from its own top background strip (row 20..30)
    def top(img):
        reg = img[:, 600:900]
        bg = img[20:30, 600:900].mean(axis=(0, 1))
        dif = np.abs(reg - bg).sum(axis=2).mean(axis=1)
        rows = np.where(dif[40:] > 40)[0]
        return 40 + rows.min() if len(rows) else None
    print(f't={t:5s} region diff {d:6.1f}   first non-bg row at x600-900: REF {top(a)}  SNAP {top(b)}')

# ---- 2) page scroll offset by template matching (same method as the measurement)
page = Image.open(PAGE).convert('L')
PW, PH = 712, int(round(3757.6 * 712 / 711.9))
page = np.asarray(page.resize((PW, PH), Image.LANCZOS)).astype(np.float32)
SW, SH = 712, 498


def scroll_of(im, guess_lo=0, guess_hi=700):
    g = np.asarray(im.convert('L').crop((400, 88, 400 + SW, 88 + SH))).astype(np.float32)[::2, ::2]
    best = None
    for s in range(guess_lo, guess_hi):
        e = ((page[s:s + SH:2, ::2] - g) ** 2).mean()
        if best is None or e < best[0]:
            best = (e, s)
    return best[1], best[0] ** .5


print('=== page scroll offset (px) REF vs SNAP')
for t in ('7.0', '7.5', '7.7', '8.0', '8.5', '10.0'):
    sr, er = scroll_of(ref(t)); ss, es = scroll_of(snap(t))
    print(f't={t:5s} REF {sr:4d} (rmse {er:5.1f})   SNAP {ss:4d} (rmse {es:5.1f})   diff {ss - sr:+d}')

# ---- 3) connector lines: visible x-extent from rim to edge
lines = {'whatsapp': (0.232, 240.6 - 0.232 * 372, 'L', 273, 372), 'tiktok': (-0.374, 496.0 + 0.374 * 372, 'L', 262, 372),
         'instagram': (-0.479, 219.4 + 0.479 * 1140, 'R', 1140, 1218), 'google': (0.379, 473.6 - 0.379 * 1140, 'R', 1140, 1256)}


def hp_of(im):
    l = im.convert('L')
    a = np.asarray(l).astype(np.float32)
    bl = np.asarray(l.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
    return a - bl


def lengths(hp):
    out = []
    for k, (m, c, side, a1, a2) in lines.items():
        start, end = (a1, a2) if side == 'L' else (a2, a1)
        step = 1 if end >= start else -1
        L = 0; gap = 0
        for x in range(start, end + step, step):
            y = m * x + c
            v = hp[int(round(y)) - 2:int(round(y)) + 3, x].max()
            if v > 1.6: L += 1; gap = 0
            else:
                gap += 1
                if gap > 5: break
        out.append(L)
    return out


print('=== connector line visible lengths   (whatsapp tiktok instagram google)')
for t in ('5.75', '5.8', '5.85', '5.9', '6.0', '6.6', '8.0'):
    print(f't={t:5s} REF {lengths(hp_of(ref(t)))}   SNAP {lengths(hp_of(snap(t)))}')


# ---- 4) rising edge via differencing against a no-mockup baseline (same method used for the fit) + final edges by luma profile
def edge_top(img, base):
    d = np.abs(arr(img) - arr(base)).sum(axis=2)[:, 1000:1060].mean(axis=1)
    rows = np.where(d > 12)[0]
    return int(rows.min()) if len(rows) else None


print('=== rising edge (diff vs t=5.5 baseline, threshold 12) REF vs SNAP   [video final ~80]')
rb, sb = ref('5.5'), snap('5.5')
for t in ('5.9', '6.0', '6.1', '6.2', '6.3', '6.4', '6.6'):
    print(f't={t:4s} REF {edge_top(ref(t), rb)}   SNAP {edge_top(snap(t), sb)}')


def luma_edges(img):
    g = arr(img).mean(axis=2)
    col = g[:, 692:708].mean(axis=1)
    top_bg = np.median(col[40:56])
    glass_top = next((y for y in range(56, 120) if col[y] > top_bg + 2.5), None)
    scr_top = next((y for y in range(56, 160) if col[y] > 150), None)
    scr_bot = next((y for y in range(560, 640) if col[y] < 120 and col[y - 4] > 150), None)
    return glass_top, scr_top, scr_bot


print('=== final edges by luma at x=700: (glass top, screen top, screen bottom)  REF vs SNAP')
for t in ('8.0', '10.0'):
    print(f't={t}: REF {luma_edges(ref(t))}   SNAP {luma_edges(snap(t))}')
