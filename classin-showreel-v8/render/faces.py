"""Cut the generated class faces (render/gen.py faces8) into the six webcam tiles.

  python3 render/faces.py   → src/assets/gen/face_0.jpg … face_5.jpg (teacher first, then the classmates in reading order)

The sheet is portraits on a flat dark grey; empty grey placeholder panels (low colour variance) are skipped. Each
portrait is centre-cropped to the tile aspect of the class screen.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'src', 'assets', 'gen', 'raw', 'faces8.jpg')
OUT = os.path.join(ROOT, 'src', 'assets', 'gen')
ASPECT = 260 / 160


def main():
    im = Image.open(RAW).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    bg = np.median(a[:20, :20].reshape(-1, 3), axis=0)
    fg = np.sqrt(((a - bg) ** 2).sum(axis=2)) > 18
    fg = ndimage.binary_opening(fg, iterations=4)
    lab, n = ndimage.label(fg)
    panels = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h * w < 0.02 * a.shape[0] * a.shape[1]:
            continue
        crop = a[sl]
        if crop.std(axis=(0, 1)).mean() < 12:  # an empty placeholder
            continue
        panels.append((sl[0].start, sl[1].start, sl))
    big = max(panels, key=lambda p: (p[2][0].stop - p[2][0].start) * (p[2][1].stop - p[2][1].start))
    rest = sorted([p for p in panels if p is not big], key=lambda p: (round(p[0] / (a.shape[0] / 3)), p[1]))
    for k, (_, _, sl) in enumerate([big] + rest):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        m = 14  # stay inside the rounded corners
        y0, y1, x0, x1 = y0 + m, y1 - m, x0 + m, x1 - m
        w, h = x1 - x0, y1 - y0
        if w / h > ASPECT:
            nw = int(h * ASPECT); x0 += (w - nw) // 2; x1 = x0 + nw
        else:
            nh = int(w / ASPECT); y0 += int((h - nh) * 0.35); y1 = y0 + nh
        tile = im.crop((x0, y0, x1, y1)).resize((520, 320), Image.LANCZOS)
        tile.save(os.path.join(OUT, f'face_{k}.jpg'), quality=90)
    print(f'{1 + len(rest)} faces')


if __name__ == '__main__':
    main()
