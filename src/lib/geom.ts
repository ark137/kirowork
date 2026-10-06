import {random} from 'remotion';

/** 平滑一维噪声（多正弦叠加，确定性） */
export const smoothNoise = (x: number, seed: string, octaves = 4) => {
  let v = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const f = Math.pow(2, o) * (0.7 + random(`${seed}-f${o}`) * 0.6);
    const p = random(`${seed}-p${o}`) * Math.PI * 2;
    v += amp * Math.sin(x * f + p);
    norm += amp;
    amp *= 0.5;
  }
  return v / norm; // -1..1
};

/** 手绘感的闭合圆（年轮） */
export const wobblyCircle = (
  cx: number,
  cy: number,
  r: number,
  seed: string,
  amp = 0.025,
  n = 180,
) => {
  const hs = [2, 3, 4, 6, 9, 13].map((k, i) => ({
    k,
    a: (amp * (random(`${seed}a${k}`) - 0.5) * 2) / Math.sqrt(i + 1),
    p: random(`${seed}p${k}`) * Math.PI * 2,
  }));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    let rr = r;
    for (const h of hs) rr += r * h.a * Math.sin(h.k * t + h.p);
    const x = cx + rr * Math.cos(t);
    const y = cy + rr * Math.sin(t);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + 'Z';
};

/** 水墨山脊 / 地平线剪影 */
export const ridgePath = (
  width: number,
  baseY: number,
  height: number,
  seed: string,
  bottom: number,
  step = 12,
  freq = 0.004,
) => {
  let d = `M${-50},${bottom} L${-50},${baseY}`;
  for (let x = -50; x <= width + 50; x += step) {
    const n = smoothNoise(x * freq, seed, 5);
    const peak = Math.pow(Math.max(0, (n + 1) / 2), 1.6);
    d += ` L${x},${(baseY - peak * height).toFixed(1)}`;
  }
  d += ` L${width + 50},${bottom} Z`;
  return d;
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
