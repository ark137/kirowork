import {random} from 'remotion';
import {smoothNoise} from '../lib/geom';

/**
 * 植物几何生成（确定性，返回 path d 字符串，供 SVG 绘制与描边生长动画）
 */

/** 裸蕨（Cooksonia 类早期维管植物）：二叉分枝 + 顶端孢子囊 */
export const cooksonia = (x: number, y: number, h: number, seed: string) => {
  let stems = '';
  const tips: {x: number; y: number; r: number}[] = [];
  const grow = (x0: number, y0: number, ang: number, len: number, depth: number, key: string) => {
    const bend = (random(`${key}b`) - 0.5) * 0.35;
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    const mx = (x0 + x1) / 2 + Math.cos(ang + Math.PI / 2) * len * bend;
    const my = (y0 + y1) / 2 + Math.sin(ang + Math.PI / 2) * len * bend;
    stems += `M${x0.toFixed(1)},${y0.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} `;
    if (depth === 0) {
      tips.push({x: x1, y: y1, r: 3 + random(`${key}r`) * 2.5});
      return;
    }
    const spread = 0.32 + random(`${key}s`) * 0.22;
    grow(x1, y1, ang - spread, len * 0.72, depth - 1, key + 'l');
    grow(x1, y1, ang + spread, len * 0.72, depth - 1, key + 'r');
  };
  const depth = 2 + Math.floor(random(`${seed}d`) * 2);
  const base = h / (1 + 0.72 + 0.72 * 0.72 + (depth > 2 ? 0.37 : 0));
  grow(x, y, -Math.PI / 2 + (random(`${seed}a`) - 0.5) * 0.25, base, depth, seed);
  return {stems, tips};
};

/** 苔藓团：一簇小圆点 */
export const mossClump = (x: number, y: number, w: number, seed: string, n = 26) =>
  new Array(n).fill(0).map((_, i) => {
    const t = random(`${seed}t${i}`);
    const dx = (t - 0.5) * w;
    const lift = (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * w * 0.22 * random(`${seed}h${i}`);
    return {x: x + dx, y: y - lift, r: 2 + random(`${seed}r${i}`) * 4.5, v: random(`${seed}k${i}`)};
  });

/**
 * 古羊齿（Archaeopteris，最早的“真正的树”）
 * 返回树干多边形、枝条、羽叶三组 path
 */
export const archaeopteris = (x: number, baseY: number, h: number, seed: string, trunkW = 18) => {
  const top = baseY - h;
  const sway = (t: number) => smoothNoise(t * 2.2, seed + 'trunk', 3) * h * 0.018;
  // 树干：从底到顶逐渐收窄
  const left: string[] = [];
  const right: string[] = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const yy = baseY - t * h;
    const ww = trunkW * (1 - t * 0.82) * (t < 0.06 ? 1 + (0.06 - t) * 9 : 1);
    const cx = x + sway(t);
    left.push(`${(cx - ww / 2).toFixed(1)},${yy.toFixed(1)}`);
    right.unshift(`${(cx + ww / 2).toFixed(1)},${yy.toFixed(1)}`);
  }
  const trunk = `M${left.join(' L')} L${right.join(' L')} Z`;

  let branches = '';
  let leaves = '';
  const nb = 15;
  for (let k = 0; k < nb; k++) {
    const t = 0.38 + (k / (nb - 1)) * 0.6;
    const yy = baseY - t * h;
    const cx = x + sway(t);
    const side = k % 2 === 0 ? -1 : 1;
    // 锥形树冠：越往上枝越短
    const len = h * 0.3 * (1 - (t - 0.38) / 0.66) * (0.8 + random(`${seed}bl${k}`) * 0.35) + h * 0.03;
    const droop = 0.12 + random(`${seed}dr${k}`) * 0.18;
    const ex = cx + side * len;
    const ey = yy + len * droop - len * 0.15;
    const mx = cx + side * len * 0.5;
    const my = yy - len * 0.12;
    branches += `M${cx.toFixed(1)},${yy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} `;
    // 羽叶：沿枝两侧的短线
    const nl = Math.max(5, Math.round(len / 9));
    for (let j = 1; j <= nl; j++) {
      const s = j / (nl + 1);
      // 二次贝塞尔上的点与切线
      const px = (1 - s) * (1 - s) * cx + 2 * (1 - s) * s * mx + s * s * ex;
      const py = (1 - s) * (1 - s) * yy + 2 * (1 - s) * s * my + s * s * ey;
      const tx = 2 * (1 - s) * (mx - cx) + 2 * s * (ex - mx);
      const ty = 2 * (1 - s) * (my - yy) + 2 * s * (ey - my);
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl;
      const ny = tx / tl;
      const ll = (1 - s * 0.6) * Math.min(22, h * 0.045);
      const fx = tx / tl;
      const fy = ty / tl;
      for (const d of [-1, 1]) {
        const lx = px + (nx * d * 0.85 + fx * 0.55) * ll;
        const ly = py + (ny * d * 0.85 + fy * 0.55) * ll + ll * 0.25;
        leaves += `M${px.toFixed(1)},${py.toFixed(1)} L${lx.toFixed(1)},${ly.toFixed(1)} `;
      }
    }
  }
  return {trunk, branches, leaves, top};
};

/** 简单的地被蕨丛（剪影） */
export const fernTuft = (x: number, y: number, s: number, seed: string) => {
  let d = '';
  const n = 5 + Math.floor(random(`${seed}n`) * 3);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i / (n - 1)) - 0.5) * 2.2 + (random(`${seed}a${i}`) - 0.5) * 0.2;
    const len = s * (0.6 + random(`${seed}l${i}`) * 0.5);
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len * 0.9;
    const cx = x + Math.cos(a) * len * 0.5 - Math.sin(a) * len * 0.12;
    const cy = y + Math.sin(a) * len * 0.5 - len * 0.2;
    d += `M${x},${y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} `;
  }
  return d;
};
