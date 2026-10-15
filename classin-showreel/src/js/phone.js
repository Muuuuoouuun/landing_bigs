// A phone (titanium frame, dynamic island) whose screen hosts ClassIn's light app UI.
import { h } from './core.js';

export const PW = 390, PH = 844, BEZ = 13;

export function createPhone(cls = '') {
  const el = h('div', `phone obj ${cls}`);
  const scr = h('div', 'pscr');
  el.append(h('div', 'pedge'), scr, h('div', 'island'));
  scr.appendChild(h('div', 'sbar', '<b>9:41</b><span class="sic"><i></i><i></i><i></i><em></em></span>'));
  return { el, scr, W: PW + BEZ * 2, H: PH + BEZ * 2 };
}
