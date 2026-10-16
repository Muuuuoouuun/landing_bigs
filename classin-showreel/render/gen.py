"""Generated imagery for v7 — plates, textures and props made with the Gemini image API.

  python3 render/gen.py              # generate everything missing
  python3 render/gen.py houses_a     # (re)generate specific ids

Reads GEMINI_API_KEY from the environment (never printed). Writes src/assets/gen/raw/<id>.<ext> and appends every
call to render/gen_log.json with token usage and an estimated cost, so the spend is always visible.
Props are generated on a flat magenta background and cut out by render/key.py.
"""
import base64, json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'src', 'assets', 'gen', 'raw')
LOG = os.path.join(ROOT, 'render', 'gen_log.json')
API = 'https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent'
PRO, FLASH = 'gemini-3-pro-image', 'gemini-3.1-flash-image'
COST = {PRO: 0.134, FLASH: 0.039}  # USD per image (list-price estimate)

LOOK = ('Cinematic 3D render with subtle stylization (premium animated-film realism), soft global illumination, '
        'filmic contrast, fine detail, clean shapes. No text, no letters, no logos, no watermark, no people.')
KEY = ('Each object is fully isolated on a perfectly flat, uniform solid magenta (#FF00FF) background, with no floor, '
       'no cast shadows, no reflections and no magenta tint on the objects.')

ASSETS = {
    # ---- night desk (bars 1–4) ----
    'desk_wood': (FLASH, '16:9', None,
        'Top-down orthographic view of a dark walnut wooden desk surface filling the entire frame edge to edge: rich wood '
        'grain, a few faint scratches and soft wear, evenly and softly lit with no objects, no shadows, no vignette. '
        'Photoreal texture.'),
    'paper_cream': (FLASH, '1:1', None,
        'Macro close-up of the surface of a sheet of warm ivory drawing paper, soft natural paper grain and tiny fibres, '
        'even diffuse light, the paper fills the whole frame, nothing printed on it.'),
    'note_page': (FLASH, '3:4', None,
        'Top-down orthographic view of one blank spiral-bound notebook page filling the entire frame: bright white paper '
        'with subtle texture, light blue ruled lines, one thin red margin line near the left, small black spiral rings along '
        'the left edge, evenly lit, completely blank (no writing), no background visible, no shadows.'),
    'cloth_green': (FLASH, '1:1', None,
        'Seamless flat texture of deep forest-green linen bookcloth filling the frame, fine woven threads, evenly lit, '
        'no text, no shadows, no vignette.'),
    'wall_night': (PRO, '16:9', None,
        'Interior of a child\'s bedroom at night, frontal view of the wall behind a desk (the desk itself is not visible): '
        'on the right, a large window showing a deep blue night sky with a few stars above distant rooftops; on the left, '
        'a wooden bookshelf with books, a small globe and a toy rocket; a few children\'s drawings pinned on the wall. '
        'Very dark and moody, lit only by faint cool moonlight from the window. ' + LOOK),
    'props_night': (PRO, '1:1', None,
        'Four separate objects arranged in a 2x2 grid with wide spacing between them: (1) a modern minimalist desk lamp seen '
        'from the side, matte charcoal, switched off; (2) a small round ceramic pot with a leafy green plant; (3) a cylindrical '
        'pencil cup holding colored pencils; (4) a short stack of three hardcover books. Soft studio light from the upper '
        'left. ' + KEY + ' ' + LOOK),
    # ---- dawn town (bar 7) ----
    'sky_dawn': (PRO, '16:9', None,
        'Wide early-dawn sky above gentle layered mountain ridges far away: blue hour overhead fading to warm peach and pale '
        'gold at the horizon, thin soft clouds, delicate mist in the valleys between the ridges, the lower third is soft '
        'distant mountains only. No buildings. ' + LOOK),
    'town_far': (PRO, '16:9', None,
        'Distant view of a calm Korean residential neighbourhood at early dawn seen from slightly above: rows of small '
        'low-rise houses and villas receding towards hazy hills, soft morning mist between the rows, many windows glowing '
        'warm, a few glowing soft lime green. The upper third of the image is plain pale hazy sky. ' + LOOK),
    'houses_a': (PRO, '1:1', None,
        'Four separate small Korean houses arranged in a 2x2 grid with wide spacing: two-story family houses with dark tiled '
        'roofs and a small flat-roofed villa, warm beige and white walls, each with several windows glowing warm yellow from '
        'inside, three-quarter front view from slightly above, soft early-dawn light from behind on the right. '
        + KEY + ' ' + LOOK),
    'houses_b': (PRO, '1:1', None,
        'Four separate small houses arranged in a 2x2 grid with wide spacing: a modern Korean townhouse with a flat roof and '
        'balcony, a cozy two-story house with a grey gable roof, a small brick villa, and a hanok-inspired house with a curved '
        'tiled roof; each has several windows glowing warm yellow from inside, three-quarter front view from slightly above, '
        'soft early-dawn light from behind on the right. ' + KEY + ' ' + LOOK),
    'houses_c': (PRO, '1:1', None,
        'Four separate small Korean apartment-style villas and houses (three to four stories, simple boxy shapes, light '
        'stucco and brick), arranged in a 2x2 grid with wide spacing; each has rows of windows, several glowing warm yellow '
        'and one or two glowing soft lime green, three-quarter front view from slightly above, soft early-dawn light from '
        'behind on the right. ' + KEY + ' ' + LOOK),
    'trees': (FLASH, '1:1', None,
        'Four separate objects arranged in a 2x2 grid with wide spacing: two round leafy deciduous trees, one slim evergreen '
        'tree and one street lamp post with a warm glowing lamp, front view, soft early-dawn light from behind on the right. '
        + KEY + ' ' + LOOK),
    # ---- nationwide (bar 8) ----
    'aerial': (PRO, '16:9', None,
        'View from very high altitude looking down over a sea of soft clouds at sunrise, dark blue ocean visible through '
        'gaps, warm golden light grazing the cloud tops, deep blue shadows, gentle curvature of the earth at the very top. '
        'No land masses, no coastlines. ' + LOOK),
}
# edits of an existing image (same composition, one change)
EDITS = {
    'wall_dawn': (PRO, 'wall_night',
        'Keep this exact image and composition. Change only what is seen through the window: early dawn, the sky deep blue '
        'at the top fading to warm peach at the horizon, and let a faint warm dawn glow fall on the wall and bookshelf near '
        'the window. Everything else stays identical.'),
}


def call(model, parts, aspect=None):
    cfg = {'responseModalities': ['IMAGE']}
    if aspect:
        cfg['imageConfig'] = {'aspectRatio': aspect}
        if model == PRO:
            cfg['imageConfig']['imageSize'] = '2K'
    body = json.dumps({'contents': [{'parts': parts}], 'generationConfig': cfg}).encode()
    req = urllib.request.Request(API.format(model), body, {'Content-Type': 'application/json', 'x-goog-api-key': os.environ['GEMINI_API_KEY']})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except Exception as e:  # network or 5xx: back off and retry
            print(f'  retry {attempt + 1}: {str(e)[:120]}')
            time.sleep(2 ** (attempt + 1))
    raise SystemExit('generation failed')


def save(aid, model, resp):
    if 'error' in resp:
        print(f"  ✗ {aid}: {resp['error'].get('status')} {resp['error'].get('message', '')[:200]}")
        return None
    for c in resp.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            if 'inlineData' in p:
                ext = 'png' if 'png' in p['inlineData'].get('mimeType', '') else 'jpg'
                path = os.path.join(RAW, f'{aid}.{ext}')
                with open(path, 'wb') as f:
                    f.write(base64.b64decode(p['inlineData']['data']))
                log = json.load(open(LOG)) if os.path.exists(LOG) else []
                log.append({'id': aid, 'model': model, 'usage': resp.get('usageMetadata', {}), 'usd_est': COST[model], 'time': time.strftime('%Y-%m-%d %H:%M:%S')})
                json.dump(log, open(LOG, 'w'), indent=1)
                total = sum(e['usd_est'] for e in log)
                print(f'  → {os.path.relpath(path, ROOT)}  (~${COST[model]:.3f}, total so far ~${total:.2f})')
                return path
    print(f'  ✗ {aid}: no image ({json.dumps(resp)[:200]})')  # e.g. IMAGE_RECITATION — not charged; carry on
    return None


def existing(aid):
    for ext in ('png', 'jpg'):
        p = os.path.join(RAW, f'{aid}.{ext}')
        if os.path.exists(p):
            return p
    return None


def main():
    os.makedirs(RAW, exist_ok=True)
    want = sys.argv[1:]
    for aid, (model, aspect, _ref, prompt) in ASSETS.items():
        if (want and aid not in want) or (not want and existing(aid)):
            continue
        print(f'{aid} [{model}]')
        save(aid, model, call(model, [{'text': prompt}], aspect))
    for aid, (model, src, prompt) in EDITS.items():
        if (want and aid not in want) or (not want and existing(aid)):
            continue
        sp = existing(src)
        if not sp:
            print(f'{aid}: needs {src} first')
            continue
        print(f'{aid} [{model}, edit of {src}]')
        mime = 'image/png' if sp.endswith('png') else 'image/jpeg'
        data = base64.b64encode(open(sp, 'rb').read()).decode()
        save(aid, model, call(model, [{'inlineData': {'mimeType': mime, 'data': data}}, {'text': prompt}], '16:9'))


if __name__ == '__main__':
    main()
