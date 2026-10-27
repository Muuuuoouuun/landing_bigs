// Frame renderer: serves src/, opens the film in headless Chromium and captures every frame
// (with motion-blur sub-frames) by calling the deterministic window.__film.render(t).
//
//   node render/render.mjs --fmt 16x9 --fps 60 --sub 2 --workers 3          → out/frames_16x9/
//   node render/render.mjs --fmt 16x9 --stills 0.17,2.4,7.5 --out docs/storyboard --prefix sb_
//
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]?.startsWith('--') || arr[i + 1] == null ? '1' : arr[i + 1]]] : a), []));
const fmt = args.fmt || '16x9';
const fps = +(args.fps || 60);
const sub = +(args.sub || 2);
const shutter = +(args.shutter || 0.75); // fraction of the frame interval the "shutter" stays open
const workers = +(args.workers || 3);
const quality = +(args.quality || 94);
const stills = args.stills ? args.stills.split(',').map(Number) : null;
const outDir = path.resolve(ROOT, args.out || `out/frames_${fmt}`);
const prefix = args.prefix || '';
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

const MIME = { '.webp': 'image/webp', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(SRC, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(SRC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?render=1${fmt === '9x16' ? '&fmt=9x16' : ''}`;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--hide-scrollbars', '--disable-gpu-vsync', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    // big 3D planes (the room's wall and desk seen up close) must not be dropped when several pages share the GPU budget
    '--force-gpu-mem-available-mb=8192'],
});
const [W, H] = fmt === '9x16' ? [1080, 1920] : [1920, 1080];

async function openPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page]', e.message));
  page.on('console', m => m.type() === 'error' && console.error('[console]', m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.__film?.ready, null, { timeout: 300000 }); // the 3D town takes a while to build
  await page.addStyleTag({ content: '#viewport{display:block!important} #stage{transform:none!important}' });
  return page;
}

async function shoot(page, t, file) {
  await page.evaluate(tt => window.__film.render(tt), t);
  // images that sat off screen for a while can be dropped from the decode cache; make sure they are back before the shot
  await page.evaluate(() => Promise.all([...document.images].filter(i => i.complete && i.naturalWidth).map(i => i.decode().catch(() => {}))));
  await page.screenshot({ path: file, type: 'jpeg', quality, clip: { x: 0, y: 0, width: W, height: H }, timeout: 300000 }); // first 3D frames compile shaders
}

const t0 = Date.now();
// the sound cue sheet comes from the same timeline the picture uses
{
  const page = await openPage();
  const cues = await page.evaluate(() => window.__film.cues);
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'out', 'cues.json'), JSON.stringify(cues, null, 1));
  fs.writeFileSync(path.join(ROOT, 'out', 'beats.json'), JSON.stringify(await page.evaluate(() => window.__film.music), null, 1));
  await page.close();
}
if (stills) {
  const page = await openPage();
  for (const t of stills) {
    await shoot(page, t, path.join(outDir, `${prefix}${t.toFixed(2).padStart(5, '0')}.jpg`));
    process.stdout.write('.');
  }
  console.log(`\n${stills.length} stills → ${outDir} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else {
  const duration = await (await openPage()).evaluate(() => window.__film.duration);
  const from = +(args.from || 0), to = +(args.to || duration);
  const frames = [];
  for (let f = Math.round(from * fps); f < Math.round(to * fps); f++) frames.push(f);
  const jobs = frames.flatMap(f => Array.from({ length: sub }, (_, s) => ({ f, s })));
  let done = 0;
  const run = async () => {
    const page = await openPage();
    for (;;) {
      const job = jobs.shift();
      if (!job) break;
      const off = sub > 1 ? ((job.s / (sub - 1)) - 0.5) * shutter : 0;
      const t = Math.max(0, (job.f + off) / fps);
      await shoot(page, t, path.join(outDir, `f${String(job.f * sub + job.s).padStart(6, '0')}.jpg`));
      if (++done % 60 === 0) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\r${done}/${frames.length * sub} sub-frames · ${el.toFixed(0)}s · eta ${((el / done) * (frames.length * sub - done)).toFixed(0)}s   `);
      }
    }
  };
  await Promise.all(Array.from({ length: workers }, run));
  fs.writeFileSync(path.join(outDir, 'render.json'), JSON.stringify({ fmt, fps, sub, shutter, from, to, frames: frames.length }));
  console.log(`\nrendered ${frames.length} frames × ${sub} sub-frames → ${outDir} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close();
server.close();
