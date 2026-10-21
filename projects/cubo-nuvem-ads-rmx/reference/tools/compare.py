"""Compare ring positions (row y=296, both sides) between video frames and composition snapshots.
usage: python3 compare.py <video.mp4> <snap_dir> <t1> <t2> ...
"""
import subprocess, sys, tempfile, os
import numpy as np
from PIL import Image

ROW = 296
W = 400  # strip width from each edge
TH = 4.0


def load_gray(path):
    return np.asarray(Image.open(path).convert('L')).astype(np.float32)


def hp_row(g, side):
    row = g[ROW, :W] if side == 'left' else g[ROW, -W:][::-1]
    k = 15
    pad = k // 2
    ap = np.pad(row, (pad, pad), mode='edge')
    ma = np.convolve(ap, np.ones(k) / k, mode='valid')
    return row - ma


def peaks(hp, th=TH):
    return [x for x in range(3, W - 3) if hp[x] > th and hp[x] >= hp[x - 1] and hp[x] > hp[x + 1]
            and hp[x] >= hp[x - 2] and hp[x] > hp[x + 2]]


def video_frame(video, t, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', video, '-frames:v', '1', out], check=True)


def main():
    video, snaps = sys.argv[1], sys.argv[2]
    times = sys.argv[3:]
    tmp = tempfile.mkdtemp()
    for t in times:
        ref_png = os.path.join(tmp, f'ref_{t}.png')
        video_frame(video, t, ref_png)
        ref = load_gray(ref_png)
        snap = load_gray(os.path.join(snaps, f'snap_{t}.png'))
        print(f'--- t={t}s  ref{ref.shape} snap{snap.shape}')
        for side in ('left', 'right'):
            pr = peaks(hp_row(ref, side))
            ps = peaks(hp_row(snap, side))
            # ring lines are strong & isolated: keep peaks with amplitude > 2*TH in the reference
            hr = hp_row(ref, side)
            hs = hp_row(snap, side)
            pr = [x for x in pr if hr[x] > 8]
            ps = [x for x in ps if hs[x] > 4]
            errs = []
            for x in pr:
                if ps:
                    d = min(abs(x - y) for y in ps)
                    errs.append(d)
            print(f'  {side}: ref strong peaks {pr}')
            print(f'  {side}: snap peaks       {ps}')
            if errs:
                print(f'  {side}: nearest-peak error px: max {max(errs):.0f}, mean {np.mean(errs):.1f}')


if __name__ == '__main__':
    main()
