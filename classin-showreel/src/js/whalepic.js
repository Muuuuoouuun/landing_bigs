// The whale pictures (generated, cut out and traced by render/whale_trace.py) as planes in the world. They are
// drawn through a canvas so they can swim: every 4-px column is shifted by the same travelling wave the outline
// uses, and they can be revealed from the head back as the light passes.
import { M4, clamp, h } from './core.js';
import WH from '../assets/gen/whale.js';

const PAD = 60; // canvas room above and below for the wave (picture px)

export function whalePic(kind) {
  const D = WH[kind];
  const el = h('div', 'obj whalepic');
  const cv = document.createElement('canvas');
  cv.width = D.w; cv.height = D.h + 2 * PAD;
  el.appendChild(cv);
  const img = new Image();
  img.src = `assets/gen/${D.src}`;
  el.appendChild(img); // in the DOM so the film waits for it to decode (hidden by CSS)
  const g = cv.getContext('2d');
  // canvas px → whale-local units (nose at x = -240)
  const toLocal = M4.chain(M4.S(D.k, D.k, 1), M4.T(-D.x0, -D.y0 - PAD, 0));
  let blank = true;
  return {
    el, D,
    // model for place(): pose maps whale-local units into the world
    model: pose => M4.mul(pose, toLocal),
    // wave(x) → vertical offset in local units; reveal: local x up to which the picture shows (soft edge)
    draw({ wave = null, reveal = 1e9, soft = 50, alpha = 1 } = {}) {
      if (!img.naturalWidth) return;
      g.clearRect(0, 0, cv.width, cv.height);
      blank = alpha <= 0.003;
      if (blank) return;
      const step = 4;
      for (let x = 0; x < D.w; x += step) {
        const lx = (x + step / 2 - D.x0) * D.k;
        const a = alpha * clamp((reveal - lx) / soft);
        if (a <= 0.003) continue;
        const dy = wave ? wave(lx) / D.k : 0;
        g.globalAlpha = a;
        g.drawImage(img, x, 0, Math.min(step, D.w - x), D.h, x, PAD + dy, Math.min(step, D.w - x), D.h);
      }
      g.globalAlpha = 1;
    },
    clear() { if (!blank) { g.clearRect(0, 0, cv.width, cv.height); blank = true; } },
  };
}
