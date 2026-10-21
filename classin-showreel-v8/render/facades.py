"""v8.1 town: flat texture maps for the 3D blocks, cut out of the generated 4K house sheets (no new generation).

Each villa in houses8_c (and its _lit edit, which keeps the exact composition) shows a front wall and a gable-end side
wall in three-quarter view. The four corners of each wall are picked by hand (view coords of the 1024-px quadrant
crops, ×2 + quadrant offset = 4K px) and the wall is rectified with a homography into a straight-on elevation. The
lit sheet goes through the same warp, so lit − base is exactly the window glow. Low-frequency light is flattened so the
3D scene's own sun does the shading.

  python3 render/facades.py          # → src/assets/gen/town/*.webp + town.json
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'src', 'assets', 'gen', 'raw')
OUT = os.path.join(ROOT, 'src', 'assets', 'gen', 'town')

# quadrant offsets of the 2×2 sheets
OFF = [(0, 0), (2048, 0), (0, 2048), (2048, 2048)]
# view coords (1024-px quadrant crop): wall top = just under the eaves, bottom = ground line
WALLS = {
    'c0': dict(q=0, front=[(452, 183), (912, 272), (912, 882), (452, 988)], side=[(178, 298), (452, 183), (452, 988), (178, 887)]),
    'c1': dict(q=1, front=[(398, 185), (888, 273), (888, 872), (398, 985)], side=[(130, 298), (398, 185), (398, 985), (130, 878)]),
    'c2': dict(q=2, front=[(440, 148), (915, 238), (915, 860), (440, 962)], side=[(175, 262), (440, 148), (440, 962), (175, 860)]),
    'c3': dict(q=3, front=[(392, 145), (862, 232), (862, 858), (392, 975)], side=[(128, 262), (392, 145), (392, 975), (128, 868)]),
}
FRONT = (1024, 1000)   # 9.0 m × 8.8 m (three floors)
SIDE = (840, 1000)     # 7.4 m × 8.8 m
GABLE = 260            # extra rows above the side wall for the gable triangle


def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y, -u], [0, 0, 0, x, y, 1, -v * x, -v * y, -v]]
    _, _, vt = np.linalg.svd(np.array(A, float))
    return vt[-1].reshape(3, 3) / vt[-1][-1]


def warp(img, quad, size, extra_top=0):
    """Rectify quad (TL, TR, BR, BL in 4K px) to size; extra_top rows above continue the same plane."""
    w, h = size
    dst = [(0, extra_top), (w, extra_top), (w, extra_top + h), (0, extra_top + h)]
    Hm = homography(dst, quad)  # output px → source px (what PIL wants)
    coeffs = (Hm.flatten() / Hm[2, 2])[:8]
    return img.transform((w, h + extra_top), Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC)


def flatten(a, sigma=260, target=0.62):
    """Divide out the low-frequency light so the face reads evenly lit; keep detail and colour."""
    lum = a[..., :3] @ np.array([0.299, 0.587, 0.114])
    blur = np.asarray(Image.fromarray(np.clip(lum * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma)), float) / 255
    k = target / np.maximum(blur, 0.05)
    return np.clip(a[..., :3] * k[..., None] ** 0.6, 0, 1)


def save(a, path, q=88):
    Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).save(path, quality=q, method=6)


# the roof: one tiled slope of houses8_a #1 (ridge-left, ridge-right, eave-right, eave-left), ridge cap at the top
ROOF = dict(sheet='houses8_a', q=1, quad=[(240, 212), (785, 192), (648, 360), (82, 356)], size=(1536, 680))
# two-storey variants drop the middle floor of the three-storey walls (rows in the 1000-px wall)
CUT = (322, 644)


def two_floors(a, top=0):
    """Remove the middle floor (rows CUT, offset by `top` gable rows)."""
    return np.concatenate([a[: top + CUT[0]], a[top + CUT[1]:]], 0)


def main():
    os.makedirs(OUT, exist_ok=True)
    base = Image.open(os.path.join(RAW, 'houses8_c.jpg')).convert('RGB')
    lit = Image.open(os.path.join(RAW, 'houses8_c_lit.jpg')).convert('RGB')
    faces = {}
    for hid, wd in WALLS.items():
        ox, oy = OFF[wd['q']]
        for face, size, extra in (('front', FRONT, 0), ('side', SIDE, GABLE)):
            quad = [(2 * x + ox, 2 * y + oy) for x, y in wd[face]]
            b = np.asarray(warp(base, quad, size, extra), float) / 255
            l = np.asarray(warp(lit, quad, size, extra), float) / 255
            glow = np.clip(l - b, 0, 1)
            glow[glow.max(-1) < 0.06] = 0  # only the windows: drop the edit's faint global drift
            faces[(hid, face, 3)] = (flatten(b), np.clip(glow * 1.6, 0, 1))
            faces[(hid, face, 2)] = (two_floors(faces[(hid, face, 3)][0], extra), two_floors(faces[(hid, face, 3)][1], extra))
    # atlas: row 0 fronts 3F, row 1 fronts 2F, row 2 sides 3F (+gable), row 3 sides 2F (+gable)
    AW, AH = 4096, 4096
    atlas, glow = np.zeros((AH, AW, 3)), np.zeros((AH, AW, 3))
    meta, y = {'gable': GABLE, 'wall3': FRONT[1], 'wall2': FRONT[1] - (CUT[1] - CUT[0]), 'regions': {}}, 0
    for face, floors in (('front', 3), ('front', 2), ('side', 3), ('side', 2)):
        x, rh = 0, 0
        for hid in WALLS:
            b, g = faces[(hid, face, floors)]
            h, w = b.shape[:2]
            atlas[y:y + h, x:x + w], glow[y:y + h, x:x + w] = b, g
            meta['regions'][f'{hid}_{face}{floors}'] = [x / AW, 1 - (y + h) / AH, (x + w) / AW, 1 - y / AH, w, h]  # u0 v0 u1 v1 (v up)
            x, rh = x + w, max(rh, h)
        y += rh + 4
    save(atlas, os.path.join(OUT, 'atlas.webp'), 90)
    save(glow, os.path.join(OUT, 'atlas_glow.webp'), 85)
    # roof slope
    sh = Image.open(os.path.join(RAW, ROOF['sheet'] + '.jpg')).convert('RGB')
    ox, oy = OFF[ROOF['q']]
    r = np.asarray(warp(sh, [(2 * x + ox, 2 * y + oy) for x, y in ROOF['quad']], ROOF['size']), float) / 255
    save(flatten(r, 400, 0.42), os.path.join(OUT, 'roof.webp'), 90)
    json.dump(meta, open(os.path.join(OUT, 'town.json'), 'w'), indent=1)
    print(json.dumps(meta)[:400])


if __name__ == '__main__':
    main()
