import { continueRender, delayRender } from 'remotion';
import light from 'pretendard/dist/web/static/woff2/Pretendard-Light.woff2';
import regular from 'pretendard/dist/web/static/woff2/Pretendard-Regular.woff2';
import medium from 'pretendard/dist/web/static/woff2/Pretendard-Medium.woff2';
import semibold from 'pretendard/dist/web/static/woff2/Pretendard-SemiBold.woff2';
import bold from 'pretendard/dist/web/static/woff2/Pretendard-Bold.woff2';
import extrabold from 'pretendard/dist/web/static/woff2/Pretendard-ExtraBold.woff2';
import black from 'pretendard/dist/web/static/woff2/Pretendard-Black.woff2';
import mono400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2';
import mono500 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2';
import mono700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2';
// Handwriting for the whiteboard (Korean + math symbols). Fontsource splits it into unicode-range
// slices, so it is declared through its stylesheet and the slices we use are preloaded below.
import '@fontsource/nanum-pen-script/400.css';

// All fonts ship from node_modules, so rendering never needs network access.
export const FONT = {
  sans: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
  mono: '"JetBrains Mono", "Pretendard", ui-monospace, monospace',
  hand: '"Nanum Pen Script", "Pretendard", sans-serif',
};

/** Holds the render until every handwriting slice needed for `text` has loaded. */
export const preloadHand = (text) => {
  if (typeof document === 'undefined' || !document.fonts) return;
  const handle = delayRender('Loading handwriting font');
  document.fonts
    .load('400 60px "Nanum Pen Script"', text)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error('Handwriting font failed to load', err);
      continueRender(handle);
    });
};

const FACES = [
  ['Pretendard', 300, light],
  ['Pretendard', 400, regular],
  ['Pretendard', 500, medium],
  ['Pretendard', 600, semibold],
  ['Pretendard', 700, bold],
  ['Pretendard', 800, extrabold],
  ['Pretendard', 900, black],
  ['JetBrains Mono', 400, mono400],
  ['JetBrains Mono', 500, mono500],
  ['JetBrains Mono', 700, mono700],
];

if (typeof window !== 'undefined' && 'FontFace' in window) {
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(([family, weight, url]) =>
      new FontFace(family, `url(${url}) format('woff2')`, { weight: String(weight) })
        .load()
        .then((face) => document.fonts.add(face)),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error('Font loading failed', err);
      continueRender(handle);
    });
}
