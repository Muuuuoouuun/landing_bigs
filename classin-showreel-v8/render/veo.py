"""Generated video shots (Veo, image-to-video) for v8 — a still plate as the first frame, a camera move in words.

  python3 render/veo.py town_glide

Reads GEMINI_API_KEY (never printed). Writes src/assets/gen/raw/<id>.mp4 and logs every call (duration and an
estimated cost) to render/gen_log.json alongside the image calls, so the total spend stays visible.
"""
import base64, json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'src', 'assets', 'gen', 'raw')
LOG = os.path.join(ROOT, 'render', 'gen_log.json')
BASE = 'https://generativelanguage.googleapis.com/v1beta/'
FAST, STD = 'veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'
PER_SEC = {FAST: 0.15, STD: 0.40}  # USD per generated second (list-price estimate)

SHOTS = {
    'town_glide': (FAST, 'town_far.jpg', 8,
        'Slow cinematic drone glide forward and slightly down over the rooftops of this quiet Korean neighbourhood at early '
        'dawn. Morning mist drifts between the houses, and windows light up one by one with warm light from left to right '
        'across the town. Smooth, steady camera, gentle parallax, premium animated-film realism. No people, no text, no '
        'birds, no sudden changes.'),
}


def req(url, body=None):
    r = urllib.request.Request(url, json.dumps(body).encode() if body else None, {'Content-Type': 'application/json', 'x-goog-api-key': os.environ['GEMINI_API_KEY']})
    with urllib.request.urlopen(r, timeout=300) as f:
        return json.load(f)


def main():
    for sid in sys.argv[1:]:
        model, first, secs, prompt = SHOTS[sid]
        img = os.path.join(RAW, first)
        inst = {'prompt': prompt, 'image': {'bytesBase64Encoded': base64.b64encode(open(img, 'rb').read()).decode(), 'mimeType': 'image/jpeg'}}
        op = req(BASE + f'models/{model}:predictLongRunning', {'instances': [inst], 'parameters': {'aspectRatio': '16:9', 'durationSeconds': secs, 'resolution': '1080p'}})
        if 'error' in op:
            print(sid, 'ERROR', op['error'].get('status'), op['error'].get('message', '')[:300]); continue
        name = op['name']
        print(f'{sid}: {name} …', flush=True)
        t0 = time.time()
        while True:
            time.sleep(10)
            st = req(BASE + name)
            if st.get('done'):
                break
            if time.time() - t0 > 900:
                raise SystemExit('timeout')
        if 'error' in st:
            print(sid, 'ERROR', st['error'].get('message', '')[:300]); continue
        samples = st.get('response', {}).get('generateVideoResponse', {}).get('generatedSamples', [])
        if not samples:
            print(sid, 'no video:', json.dumps(st)[:400]); continue
        uri = samples[0]['video']['uri']
        r = urllib.request.Request(uri, headers={'x-goog-api-key': os.environ['GEMINI_API_KEY']})
        out = os.path.join(RAW, f'{sid}.mp4')
        with urllib.request.urlopen(r, timeout=300) as f, open(out, 'wb') as g:
            g.write(f.read())
        log = json.load(open(LOG)) if os.path.exists(LOG) else []
        log.append({'id': sid, 'model': model, 'seconds': secs, 'usd_est': PER_SEC[model] * secs, 'time': time.strftime('%Y-%m-%d %H:%M:%S')})
        json.dump(log, open(LOG, 'w'), indent=1)
        print(f'  → {os.path.relpath(out, ROOT)} ({time.time() - t0:.0f}s, ~${PER_SEC[model] * secs:.2f}, total ~${sum(e["usd_est"] for e in log):.2f})')


if __name__ == '__main__':
    main()
