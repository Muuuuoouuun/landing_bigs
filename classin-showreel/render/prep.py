"""Downscale + recompress the raw generated plates into src/assets/gen/*.jpg for the film (raw/ stays local)."""
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'src', 'assets', 'gen', 'raw')
OUT = os.path.join(ROOT, 'src', 'assets', 'gen')
SIZE = {'desk_wood': 2400, 'note_page': 1100, 'paper_cream': 900, 'wall_night': 2752, 'wall_dawn': 2752, 'sky_dawn': 2752, 'town_far': 2752, 'aerial': 2752}
for aid, w in SIZE.items():
    src = next((os.path.join(RAW, f'{aid}.{e}') for e in ('jpg', 'png') if os.path.exists(os.path.join(RAW, f'{aid}.{e}'))), None)
    if not src:
        print('missing', aid); continue
    im = Image.open(src).convert('RGB')
    if im.size[0] > w:
        im = im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS)
    im.save(os.path.join(OUT, f'{aid}.jpg'), quality=86, optimize=True, progressive=True)
    print(aid, im.size, os.path.getsize(os.path.join(OUT, f'{aid}.jpg')) // 1024, 'KB')
