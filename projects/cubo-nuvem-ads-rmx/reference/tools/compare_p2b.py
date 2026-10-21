"""Part 2b verification. usage: python3 compare_p2b.py <video> <snap_dir> <page.jpg> <cursor.png>"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image, ImageFilter

V, S, PAGE, CUR = sys.argv[1:5]
tmp = tempfile.mkdtemp()


def ref(t):
    out = os.path.join(tmp, f'r_{t}.png')
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', V, '-frames:v', '1', out], check=True)
    return Image.open(out).convert('RGB')


def snap(t):
    return Image.open(os.path.join(S, f'snap_{t}.png')).convert('RGB')


A = lambda im: np.asarray(im).astype(np.float32)

# ---------- 1) cursor tracker
cur = Image.open(CUR).convert('RGB')


def corr2(F, K):
    h, w = F.shape; kh, kw = K.shape; H, W = h + kh, w + kw
    return np.fft.irfft2(np.fft.rfft2(F, (H, W)) * np.conj(np.fft.rfft2(K, (H, W))), (H, W))[:h - kh + 1, :w - kw + 1]


T = {}
for sc in (0.8, 0.85, 0.9, 0.95, 1.0, 1.05):
    w, h = int(round(47 * sc)), int(round(74 * sc))
    t_ = np.asarray(cur.resize((w, h), Image.LANCZOS)).astype(np.float32); g = t_.mean(axis=2)
    Mk = ((t_.max(axis=2) < 70) | (t_.min(axis=2) > 190)).astype(np.float32)
    T[sc] = (g, Mk, (Mk * g ** 2).sum() / Mk.sum())


def cursor_pos(im):
    f = A(im).mean(axis=2)[40:660, 380:1500]; f2 = f ** 2; b = None
    for sc, (g, Mk, tt) in T.items():
        ssd = (corr2(f2, Mk) - 2 * corr2(f, Mk * g)) / Mk.sum() + tt
        j = np.unravel_index(np.argmin(ssd), ssd.shape)
        if b is None or ssd[j] < b[0]: b = (ssd[j], sc, j[1] + 380, j[0] + 40)
    return b if b[0] < 1200 else None


print('=== 1) CURSOR top-left (x,y) and scale   REF | SNAP')
for t in ('15.65', '15.8', '16.0', '16.2', '16.4', '16.6', '16.8', '17.05', '17.2', '18.6', '18.8', '19.0', '19.1'):
    r, s = cursor_pos(ref(t)), cursor_pos(snap(t))
    f = lambda v: '   none   ' if v is None else f'({v[2]:4d},{v[3]:3d}) s{v[1]:.2f}'
    print(f't={t:5s} {f(r)} | {f(s)}')

# ---------- 2) icon shrink
cent = {'instagram': (1273.4, 156.6), 'whatsapp': (213.4, 219.3), 'tiktok': (200.9, 544.9), 'google': (1314.2, 539.4)}


def mask(name, w):
    R, G, B = w[..., 0], w[..., 1], w[..., 2]
    if name == 'google': return (R > 205) & (G > 205) & (B > 205)
    if name == 'whatsapp': return (G > 140) & (R < 110) & (B < 130)
    if name == 'instagram': return (R > 170) & (G < 170) & (B < 200) & (R > B - 40)
    if name == 'tiktok': return (B < 75) & (R < 80)


def diam(im, k):
    a = A(im); cx, cy = cent[k]; x0, y0 = int(cx - 75), int(cy - 75)
    c = mask(k, a[y0:y0 + 150, x0:x0 + 150]).sum()
    return 2 * np.sqrt(c / np.pi) if c > 12 else 0.0


r0, s0 = ref('16.95'), snap('16.95')
fr = {k: max(1e-6, diam(r0, k)) for k in cent}; fs = {k: max(1e-6, diam(s0, k)) for k in cent}
print('=== 2) OTHER ICONS scale (diameter/before)  order: instagram whatsapp tiktok google   REF | SNAP')
for t in ('17.15', '17.2', '17.3', '17.4', '17.5', '17.6', '17.7', '17.8'):
    r, s = ref(t), snap(t)
    print(f't={t:5s} ' + '  '.join(f'{diam(r, k) / fr[k]:5.2f}|{diam(s, k) / fs[k]:5.2f}' for k in cent))

# ---------- 3) GPT icon growth (white-area diameter, relative to rest at 16.95)
yy, xx = np.mgrid[0:672, 0:1512]


def gpt_ad(im, cx=1290, cy=336):
    a = A(im)
    m = (a[..., 0] > 235) & (a[..., 1] > 235) & (a[..., 2] > 235)
    near = ((xx - cx) ** 2 + (yy - cy) ** 2) <= 120 ** 2
    cur_ = (xx >= 1280) & (xx <= 1345) & (yy >= 372) & (yy <= 462)
    n = (m & near & ~cur_).sum()
    return 2 * np.sqrt(n / np.pi) if n > 300 else 0.0


rr, rs = gpt_ad(ref('16.95')), gpt_ad(snap('16.95'))
print('=== 3) GPT icon size relative to 16.95 (REF | SNAP)')
for t in ('17.05', '17.15', '17.2', '17.3', '17.4', '17.5', '17.6', '17.7', '18.0'):
    print(f't={t:5s} {gpt_ad(ref(t)) / rr:5.3f} | {gpt_ad(snap(t)) / rs:5.3f}')

# ---------- 4) glass top, page scroll
page = Image.open(PAGE).convert('L')
PW, PH = 712, int(round(3757.6 * 712 / 711.9))
page = np.asarray(page.resize((PW, PH), Image.LANCZOS)).astype(np.float32)


def glass_top(im):
    g = A(im).mean(axis=2); col = g[:, 692:708].mean(axis=1); bg = np.median(col[20:30])
    return next((y for y in range(30, 672) if col[y] > bg + 2.5 and col[y - 2] <= bg + 1.2), None)


def scroll(im, guess):
    gt = glass_top(im)
    if gt is None or gt + 28 > 520: return None
    y0 = gt + 28; h = min(672, y0 + 498) - y0
    if h < 200: return None
    crop = np.asarray(im.convert('L').crop((400, y0, 1112, y0 + h))).astype(np.float32)[::2, ::2]
    best = None
    for s in range(max(0, guess - 80), min(page.shape[0] - h, guess + 700), 2):
        e = ((page[s:s + h:2, ::2] - crop) ** 2).mean()
        if best is None or e < best[0]: best = (e, s)
    return best[1] - 16


print('=== 4) MOCKUP glass top and PAGE scroll S   REF | SNAP')
for t, g in (('17.6', 574), ('17.9', 612), ('18.0', 696), ('18.2', 952), ('18.4', 1092), ('18.6', 1130), ('18.7', 1138), ('18.8', 1140), ('18.9', 1142), ('19.0', 1146), ('19.1', 1148), ('19.2', 1148)):
    r, s = ref(t), snap(t)
    print(f't={t:5s} glass {glass_top(r)} | {glass_top(s)}    S {scroll(r, g)} | {scroll(s, g)}')

# ---------- 5) lines
lines = {'whatsapp': (0.232, 240.6 - 0.232 * 372, 'L', 273, 372), 'tiktok': (-0.374, 496.0 + 0.374 * 372, 'L', 262, 372),
         'google': (0.379, 473.6 - 0.379 * 1140, 'R', 1140, 1256), 'instagram': (-0.479, 219.4 + 0.479 * 1140, 'R', 1140, 1218)}


def hp(im):
    l = im.convert('L'); a = np.asarray(l).astype(np.float32); return a - np.asarray(l.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)


def llen(im):
    h = hp(im); out = []
    for k, (m_, c_, side, a1, a2) in lines.items():
        start, end = (a1, a2) if side == 'L' else (a2, a1); step = 1 if end >= start else -1; L = 0; gap = 0
        for x in range(start, end + step, step):
            y = m_ * x + c_
            if not (3 < y < 668): break
            v = h[int(round(y)) - 2:int(round(y)) + 3, x].max()
            if v > 1.6: L += 1; gap = 0
            else:
                gap += 1
                if gap > 5: break
        out.append(L)
    return out


print('=== 5) CONNECTOR LINE visible lengths (wa tk gg ig)   REF | SNAP')
for t in ('17.15', '17.2', '17.3', '17.4', '17.5'):
    print(f't={t:5s} {llen(ref(t))} | {llen(snap(t))}')
