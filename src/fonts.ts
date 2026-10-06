import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_SANS, FONT_SERIF} from './theme';

let started = false;

/** 加载本地子集化字体（思源宋体 / 思源黑体，OFL 授权） */
export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading fonts');
  const faces = [
    new FontFace(FONT_SERIF, `url(${staticFile('fonts/serif.woff2')}) format('woff2')`, {weight: '200 900'}),
    new FontFace(FONT_SANS, `url(${staticFile('fonts/sans.woff2')}) format('woff2')`, {weight: '100 900'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((loaded) => {
      loaded.forEach((f) => (document.fonts as unknown as Set<FontFace>).add(f));
      continueRender(handle);
    })
    .catch((err) => {
      console.error('Font load failed', err);
      continueRender(handle);
    });
};
