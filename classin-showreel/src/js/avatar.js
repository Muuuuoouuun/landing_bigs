// Friendly illustrated people for the video seats, the stage and the family's phone.
// (No real photos: everyone on screen is fictional and drawn in code.)

const SKIN = ['#F6D3B7', '#EEC19E', '#D9A47F'];
const HAIR = ['#2B2220', '#3B2A22', '#1E1A1A', '#5A3A28'];
const ROOM = [['#E9E3DA', '#CFC6B8'], ['#DCE3EA', '#B9C3CF'], ['#EADFD6', '#CDBBAA'], ['#E3E6DE', '#C3C8BB'], ['#E7E0EA', '#C8BED0'], ['#DDE6E6', '#BCCACA']];
const SHIRT = ['#3F6FB5', '#E07A5F', '#5B8C6A', '#F2C14E', '#7A6FB0', '#2F3A4A', '#D6D9DE'];

/*
  avatar({ seed, hair: 0 short | 1 bob | 2 long | 3 bun, glasses, smile 0..1, w, h, shirt, room })
  Returns an SVG string sized like a webcam tile (default 160×120), bust at the bottom centre.
*/
export function avatar(o = {}) {
  const s = o.seed || 0;
  const w = o.w || 160, h = o.h || 120;
  const skin = SKIN[o.skin ?? s % SKIN.length], hair = HAIR[o.hairColor ?? s % HAIR.length];
  const [r0, r1] = ROOM[o.room ?? s % ROOM.length];
  const shirt = o.shirt || SHIRT[s % SHIRT.length];
  const smile = o.smile ?? 0.5;
  const id = `av${o.id ?? s}`;
  const cx = w / 2, hy = h * 0.47, R = h * 0.2;
  const style = o.hair ?? s % 4;
  const hairBack = style === 2 ? `<path d="M${cx - R * 1.15} ${hy - R * 0.2} Q${cx - R * 1.3} ${hy + R * 1.6} ${cx - R * 0.6} ${hy + R * 1.9} L${cx + R * 0.6} ${hy + R * 1.9} Q${cx + R * 1.3} ${hy + R * 1.6} ${cx + R * 1.15} ${hy - R * 0.2} Z" fill="${hair}"/>`
    : style === 3 ? `<circle cx="${cx}" cy="${hy - R * 1.15}" r="${R * 0.48}" fill="${hair}"/>` : '';
  const hairFront = style === 1
    ? `<path d="M${cx - R * 1.08} ${hy + R * 0.55} Q${cx - R * 1.25} ${hy - R * 1.25} ${cx} ${hy - R * 1.12} Q${cx + R * 1.25} ${hy - R * 1.25} ${cx + R * 1.08} ${hy + R * 0.55} L${cx + R * 0.92} ${hy + R * 0.5} Q${cx + R * 0.95} ${hy - R * 0.45} ${cx + R * 0.2} ${hy - R * 0.62} Q${cx - R * 0.6} ${hy - R * 0.2} ${cx - R * 0.92} ${hy + R * 0.5} Z" fill="${hair}"/>`
    : `<path d="M${cx - R * 1.02} ${hy + R * 0.05} Q${cx - R * 1.1} ${hy - R * 1.2} ${cx} ${hy - R * 1.1} Q${cx + R * 1.1} ${hy - R * 1.2} ${cx + R * 1.02} ${hy + R * 0.05} Q${cx + R * 0.8} ${hy - R * 0.55} ${cx + R * 0.1} ${hy - R * 0.58} Q${cx - R * 0.7} ${hy - R * 0.5} ${cx - R * 1.02} ${hy + R * 0.05} Z" fill="${hair}"/>`;
  const my = hy + R * 0.42, mw = R * 0.42, md = R * (0.08 + 0.26 * smile);
  const mouth = `<path d="M${cx - mw} ${my} Q${cx} ${my + md * 2} ${cx + mw} ${my}${smile > 0.55 ? ` Q${cx} ${my + md * 0.9} ${cx - mw} ${my} Z" fill="#7A2E2A"` : '" fill="none"'} stroke="#7A2E2A" stroke-width="${R * 0.09}" stroke-linecap="round"/>`;
  const eyeY = hy + R * 0.02, ex = R * 0.38, eh = R * (0.13 - 0.05 * Math.max(0, smile - 0.6));
  const eyes = smile > 0.85
    ? `<path d="M${cx - ex - R * 0.12} ${eyeY} q${R * 0.12} ${-R * 0.14} ${R * 0.24} 0 M${cx + ex - R * 0.12} ${eyeY} q${R * 0.12} ${-R * 0.14} ${R * 0.24} 0" stroke="#2B2220" stroke-width="${R * 0.08}" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="${cx - ex}" cy="${eyeY}" rx="${R * 0.085}" ry="${eh}" fill="#2B2220"/><ellipse cx="${cx + ex}" cy="${eyeY}" rx="${R * 0.085}" ry="${eh}" fill="#2B2220"/>`;
  const glasses = o.glasses ? `<g fill="none" stroke="#3A3A40" stroke-width="${R * 0.07}"><circle cx="${cx - ex}" cy="${eyeY}" r="${R * 0.26}"/><circle cx="${cx + ex}" cy="${eyeY}" r="${R * 0.26}"/><path d="M${cx - ex + R * 0.26} ${eyeY} H${cx + ex - R * 0.26}"/></g>` : '';
  return `<svg class="avsvg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="${id}r" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${r0}"/><stop offset="1" stop-color="${r1}"/></radialGradient>
  <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shirt}"/><stop offset="1" stop-color="${shirt}" stop-opacity="0.85"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${id}r)"/>
  <rect x="${w * 0.08}" y="${h * 0.12}" width="${w * 0.22}" height="${h * 0.3}" rx="3" fill="#fff" opacity="0.28"/>
  ${hairBack}
  <path d="M${cx - R * 2.2} ${h} Q${cx - R * 2.0} ${hy + R * 1.55} ${cx} ${hy + R * 1.45} Q${cx + R * 2.0} ${hy + R * 1.55} ${cx + R * 2.2} ${h} Z" fill="url(#${id}s)"/>
  <rect x="${cx - R * 0.32}" y="${hy + R * 0.7}" width="${R * 0.64}" height="${R * 0.75}" rx="${R * 0.2}" fill="${skin}" style="filter:brightness(0.92)"/>
  <ellipse cx="${cx}" cy="${hy}" rx="${R * 0.98}" ry="${R * 1.08}" fill="${skin}"/>
  <circle cx="${cx - R * 0.62}" cy="${hy + R * 0.32}" r="${R * 0.16}" fill="#F09A8A" opacity="${0.25 + 0.35 * smile}"/>
  <circle cx="${cx + R * 0.62}" cy="${hy + R * 0.32}" r="${R * 0.16}" fill="#F09A8A" opacity="${0.25 + 0.35 * smile}"/>
  ${eyes}${glasses}${mouth}${hairFront}
</svg>`;
}
