"""Part 2a verification: exit, text, re-entry, scroll, GPT icon. usage: python3 compare_p2a.py <video> <snap_dir> <page.jpg> <gpt_frame.png>"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image, ImageFilter

V, S, PAGE, GPT = sys.argv[1:5]
tmp = tempfile.mkdtemp()


def ref(t):
    out = os.path.join(tmp, f'r_{t}.png')
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', V, '-frames:v', '1', out], check=True)
    return Image.open(out).convert('RGB')


def snap(t):
    return Image.open(os.path.join(S, f'snap_{t}.png')).convert('RGB')


A = lambda im: np.asarray(im).astype(np.float32)


def glass_top(im):
    g = A(im).mean(axis=2)
    col = g[:, 692:708].mean(axis=1)
    bg = np.median(col[20:30])
    return next((y for y in range(30, 672) if col[y] > bg + 2.5 and col[y - 2] <= bg + 1.2), None)


def wa_cy(im):
    a = A(im)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    m = (G > 140) & (R < 110) & (B < 130)
    sub = m[:, 150:310]
    ys = np.where(sub.sum(axis=1) > 3)[0]
    return None if len(ys) < 8 else (ys.min() + ys.max()) / 2


print('=== 1) EXIT / RE-ENTRY: mockup glass top (y) and WhatsApp centre y   REF | SNAP   (final: glass 76, WA 219)')
for t in ('9.9', '10.3', '10.45', '10.55', '10.65', '10.75', '13.6', '13.7', '13.8', '14.0', '14.2', '14.3', '14.5', '15.0'):
    r, s = ref(t), snap(t)
    f = lambda v: '  -  ' if v is None else f'{v:5.0f}'
    print(f't={t:5s} glass {f(glass_top(r))} | {f(glass_top(s))}     WA {f(wa_cy(r))} | {f(wa_cy(s))}')

print('=== 2) TEXT "E agora, Chat GPT": word x-ranges and rows at t=12.0 (REF vs SNAP)')


def word_ranges(im):
    g = A(im).mean(axis=2)[200:470, 200:1320]
    m = g > 200
    rows = np.where(m.sum(axis=1) > 2)[0]
    cols = np.where(m.sum(axis=0) > 0)[0]
    gaps = np.where(np.diff(cols) > 14)[0]
    segs = []; s0 = cols[0]
    for gg in gaps:
        segs.append((s0 + 200, cols[gg] + 200)); s0 = cols[gg + 1]
    segs.append((s0 + 200, cols[-1] + 200))
    return (rows.min() + 200, rows.max() + 200), segs


rr, rs = word_ranges(ref('12.0')), word_ranges(snap('12.0'))
print('REF  rows', rr[0], 'x-ranges', [(int(a), int(b)) for a, b in rr[1]])
print('SNAP rows', rs[0], 'x-ranges', [(int(a), int(b)) for a, b in rs[1]])


def contrast(im):
    r = A(im).mean(axis=2)[270:400, 380:1130]
    return np.percentile(r, 99.5) - np.percentile(r, 5)


c_r, c_s = contrast(ref('12.0')), contrast(snap('12.0'))
for t in ('11.2', '11.5', '13.3', '13.45'):
    print(f'  opacity proxy t={t}: REF {contrast(ref(t)) / c_r:5.2f}  SNAP {contrast(snap(t)) / c_s:5.2f}')

print('=== 3) page scroll S during re-entry (composition coords)   REF | SNAP')
page = Image.open(PAGE).convert('L')
PW, PH = 712, int(round(3757.6 * 712 / 711.9))
page = np.asarray(page.resize((PW, PH), Image.LANCZOS)).astype(np.float32)


def scroll(im):
    gt = glass_top(im)
    if gt is None or gt + 28 > 560: return None
    y0 = gt + 28; h = min(672, y0 + 498) - y0
    if h < 150: return None
    crop = np.asarray(im.convert('L').crop((400, y0, 1112, y0 + h))).astype(np.float32)[::2, ::2]
    best = None
    for s in range(0, 700, 2):
        e = ((page[s:s + h:2, ::2] - crop) ** 2).mean()
        if best is None or e < best[0]: best = (e, s)
    return best[1] - 16


for t in ('14.0', '14.2', '14.3', '14.5', '15.0', '15.5'):
    print(f't={t:5s} REF {scroll(ref(t))} | SNAP {scroll(snap(t))}')

print('=== 4) GPT icon: white-area diameter and avatar/line presence   REF | SNAP')
yy, xx = np.mgrid[0:672, 0:1512]
near = ((xx - 1294.4) ** 2 + (yy - 338.4) ** 2) <= 75 ** 2


def gpt_area(im):
    a = A(im)
    m = (a[..., 0] > 235) & (a[..., 1] > 235) & (a[..., 2] > 235) & near
    c = m.sum()
    return 2 * np.sqrt(c / np.pi) if c > 20 else 0.0


for t in ('14.2', '14.3', '14.5', '14.7', '15.0', '15.5'):
    print(f't={t:5s} icon white-area diameter REF {gpt_area(ref(t)):6.1f} | SNAP {gpt_area(snap(t)):6.1f}')


def hp(im):
    l = im.convert('L'); a = np.asarray(l).astype(np.float32); return a - np.asarray(l.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)


def gpt_line_len(im):
    h = hp(im); m_, c_ = -0.031, 340.0 + 0.031 * 1140; L = 0; gap = 0
    for x in range(1141, 1228):
        y = m_ * x + c_; v = h[int(round(y)) - 2:int(round(y)) + 3, x].max()
        if v > 1.6: L += 1; gap = 0
        else:
            gap += 1
            if gap > 5: break
    return L


for t in ('14.3', '14.5', '14.7', '15.0'):
    print(f't={t:5s} GPT line visible px REF {gpt_line_len(ref(t))} | SNAP {gpt_line_len(snap(t))}')
a_r, a_s = A(ref('15.5')), A(snap('15.5'))
d = np.abs(a_r[250:450, 1180:1440] - a_s[250:450, 1180:1440]).mean()
print(f'GPT region (x1180-1440,y250-450) mean abs diff at 15.5: {d:.1f}')
