"""The whale, from the generated images: cut out, downsize, and trace the outline the light draws.

  python3 render/whale_trace.py

whale_glow (the imagination, light on black) → src/assets/gen/whale_glow.jpg + its silhouette traced into a polygon.
whale_3d (the whale that flies over the town, on magenta) → keyed → src/assets/gen/whale_3d.png.
Both are mapped to the same local frame the code uses (nose at x = -240, fluke tip at x = +240, y down) and
written to src/assets/gen/whale.js, so the light traces exactly the outline of the picture.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'src', 'assets', 'gen', 'raw')
OUT = os.path.join(ROOT, 'src', 'assets', 'gen')
sys.path.insert(0, os.path.join(ROOT, 'render'))
from key import key  # noqa: E402


def trace(mask):
    """Moore-neighbour boundary trace of the largest blob → list of (x, y), clockwise in image space"""
    lab, n = ndimage.label(mask)
    big = 1 + int(np.argmax(ndimage.sum(mask, lab, range(1, n + 1))))
    m = ndimage.binary_fill_holes(lab == big)
    m = np.pad(m, 1)
    ys, xs = np.nonzero(m)
    i = np.argmin(xs * 100000 + ys)
    start = (int(xs[i]), int(ys[i]))
    nb = [(0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)]  # clockwise (y down)
    cur, back = start, 6  # we entered the start pixel from the west
    pts = [start]
    for _ in range(400000):
        for k in range(1, 9):
            dd = (back + k) % 8
            x, y = cur[0] + nb[dd][0], cur[1] + nb[dd][1]
            if m[y, x]:
                back = (dd + 4) % 8  # direction pointing back to where we came from …
                back = (back + 1) % 8  # … and start the next sweep just past it
                cur = (x, y)
                break
        if cur == start:
            break
        pts.append(cur)
    return np.array(pts, dtype=float) - 1


def smooth(p, r):
    k = np.ones(2 * r + 1) / (2 * r + 1)
    return np.stack([np.convolve(np.concatenate([p[-r:, j], p[:, j], p[:r, j]]), k, 'valid') for j in range(2)], 1)


def resample(p, n):
    q = np.vstack([p, p[:1]])
    s = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(q, axis=0).T))])
    u = np.linspace(0, s[-1], n, endpoint=False)
    return np.stack([np.interp(u, s, q[:, 0]), np.interp(u, s, q[:, 1])], 1)


def frame(xmin, xmax, ymid):
    k = 480.0 / (xmax - xmin)
    return {'x0': (xmin + xmax) / 2, 'y0': ymid, 'k': k}


def main():
    meta = {}
    # ---- the glow whale ----
    im = Image.open(os.path.join(RAW, 'whale_glow.jpg')).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255
    lum = a.max(axis=2)
    body = ndimage.binary_fill_holes(ndimage.binary_closing(ndimage.binary_opening(lum > 0.42, iterations=3), iterations=10))
    poly = trace(body)
    poly = resample(smooth(poly, 6), 220)
    xmin, xmax = poly[:, 0].min(), poly[:, 0].max()
    ys = poly[:, 1]
    F = frame(xmin, xmax, (ys.min() + ys.max()) / 2 - 0.08 * (ys.max() - ys.min()))
    # start the outline at the nose and run along the back first (the light traces head → tail along the top)
    i0 = int(np.argmin(poly[:, 0]))
    poly = np.roll(poly, -i0, axis=0)
    if poly[len(poly) // 8, 1] > poly[0, 1]:  # going down the belly first → reverse
        poly = np.vstack([poly[:1], poly[:0:-1]])
    loc = lambda p: [round((p[0] - F['x0']) * F['k'], 1), round((p[1] - F['y0']) * F['k'], 1)]
    small = im.resize((im.size[0] // 2, im.size[1] // 2), Image.LANCZOS)
    # light on black → colour + alpha (alpha = brightness), so it composites like light over anything
    sa = np.asarray(small).astype(np.float32) / 255
    al = np.clip(sa.max(axis=2), 0, 1)
    col = np.where(al[..., None] > 1e-3, sa / np.maximum(al[..., None], 1e-3), 0)
    al = np.where(al < 0.03, 0, al)  # the JPEG's near-black noise floor
    Image.fromarray((np.dstack([col, al]) * 255).round().astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'whale_glow.png'), optimize=True)
    # inner lines read off the picture (half-size image px): jaw, the flipper's leading edge over the belly, the eye
    half = lambda pts: [loc((x * 2, y * 2)) for x, y in pts]
    meta['glow'] = {'src': 'whale_glow.png', 'w': small.size[0], 'h': small.size[1], 'k': F['k'] * 2,
                    'x0': F['x0'] / 2, 'y0': F['y0'] / 2, 'body': [loc(p) for p in poly],
                    'jaw': half([(128, 338), (200, 352), (300, 366), (390, 380), (444, 393)]),
                    'flipper': half([(516, 400), (572, 396), (602, 426), (644, 470)]),
                    'eye': loc((450 * 2, 350 * 2))}
    # ---- the 3D whale ----
    parts = key(os.path.join(RAW, 'whale_3d.jpg'))
    crop = max(parts, key=lambda c: c.shape[0] * c.shape[1])
    img = Image.fromarray(crop, 'RGBA')
    s = 1500 / img.size[0]
    img = img.resize((round(img.size[0] * s), round(img.size[1] * s)), Image.LANCZOS)
    img.save(os.path.join(OUT, 'whale_3d.png'), optimize=True)
    al = np.asarray(img)[..., 3] > 128
    yy, xx = np.nonzero(al)
    # the body's vertical middle: the mean of the top and bottom edges over the front half (the flipper hangs below)
    cols = [c for c in range(int(xx.min()), int(xx.min() + 0.5 * (xx.max() - xx.min())))]
    tops = [np.nonzero(al[:, c])[0].min() for c in cols if al[:, c].any()]
    F3 = frame(xx.min(), xx.max(), np.median(tops) + 0.42 * (al.sum(axis=0).max()))
    meta['solid'] = {'src': 'whale_3d.png', 'w': img.size[0], 'h': img.size[1], **F3}
    js = '// generated by render/whale_trace.py — the whale pictures and the outline traced from them (local units)\n'
    js += f'export default {json.dumps(meta, separators=(",", ":"))};\n'
    open(os.path.join(OUT, 'whale.js'), 'w').write(js)
    # a check image: the traced outline over the picture
    chk = small.copy()
    from PIL import ImageDraw
    d = ImageDraw.Draw(chk)
    pts = [((x / F['k'] + F['x0']) / 2, (y / F['k'] + F['y0']) / 2) for x, y in meta['glow']['body']]
    d.line(pts + pts[:1], fill=(255, 60, 60), width=2)
    for kk in ('jaw', 'flipper'):
        q = [((x / F['k'] + F['x0']) / 2, (y / F['k'] + F['y0']) / 2) for x, y in meta['glow'][kk]]
        d.line(q, fill=(80, 160, 255), width=2)
    e = meta['glow']['eye']; e = ((e[0] / F['k'] + F['x0']) / 2, (e[1] / F['k'] + F['y0']) / 2)
    d.ellipse([e[0] - 5, e[1] - 5, e[0] + 5, e[1] + 5], outline=(80, 160, 255), width=2)
    d.ellipse([pts[0][0] - 6, pts[0][1] - 6, pts[0][0] + 6, pts[0][1] + 6], outline=(255, 255, 0), width=2)
    chk.save(os.path.join(ROOT, 'out', 'whale_trace_check.jpg'), quality=85)
    b = np.array(meta['glow']['body'])
    print('bounds x', b[:, 0].min(), b[:, 0].max(), 'y', b[:, 1].min(), b[:, 1].max(), 'eye', meta['glow']['eye'])
    print(f"glow: {len(meta['glow']['body'])} pts, k={meta['glow']['k']:.3f} · solid: {img.size}, k={F3['k']:.3f}")


if __name__ == '__main__':
    main()
