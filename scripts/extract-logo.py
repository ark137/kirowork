"""从原 Logo 图识别 46 块地板条（精确旋转矩形）+ 描摹树干、地平弧、红字轮廓，输出 src/components/logoData.ts"""
import json, math, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import cv2

src = sys.argv[1]
out = sys.argv[2]
im = Image.open(src).convert('RGBA')
A = np.array(im).astype(int)
H, W = A.shape[:2]
r, g, b, al = A[..., 0], A[..., 1], A[..., 2], A[..., 3]
opaque = al > 128
gold = opaque & (r > 190) & (g > 120) & (g < 200) & (b < 90)
red = opaque & (r > 170) & (g < 90) & (b < 90)

lab, n = ndi.label(gold)
tiles, others = [], []
for i in range(1, n + 1):
    m = lab == i
    area = int(m.sum())
    if area < 400: continue
    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1).astype(np.float32)
    rect = cv2.minAreaRect(pts)
    box = cv2.boxPoints(rect)
    # 边向量 → 长轴角度
    e = [box[(k + 1) % 4] - box[k] for k in range(4)]
    l = [np.hypot(*v) for v in e]
    k = 0 if l[0] >= l[1] else 1
    ang = math.degrees(math.atan2(e[k][1], e[k][0]))
    if ang > 90: ang -= 180
    if ang <= -90: ang += 180
    L, S = max(l[0], l[1]), min(l[0], l[1])
    (cx, cy) = rect[0]
    # 用矩形回填检验贴合度
    mask = np.zeros((H, W), np.uint8); cv2.fillPoly(mask, [box.astype(np.int32)], 1)
    iou = (mask.astype(bool) & m).sum() / (mask.astype(bool) | m).sum()
    rec = dict(cx=float(cx), cy=float(cy), w=float(L), h=float(S), rot=float(ang), area=area, iou=float(iou))
    (tiles if area < 20000 else others).append(rec)

print('tiles', len(tiles), 'others', len(others))
print('w', np.mean([t['w'] for t in tiles]).round(1), 'h', np.mean([t['h'] for t in tiles]).round(1),
      'rot', np.mean([t['rot'] for t in tiles]).round(2), 'min iou', round(min(t['iou'] for t in tiles), 3))

def trace(mask, eps=1.2, min_area=50):
    m = (mask.astype(np.uint8)) * 255
    cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = ''
    for c in cs:
        if cv2.contourArea(c) < min_area: continue
        c = cv2.approxPolyDP(c, eps, True)[:, 0, :]
        d += 'M' + ' L'.join(f'{x},{y}' for x, y in c) + 'Z '
    return d.strip()

# 树干 + 地平弧（金色大连通域）
big = np.zeros((H, W), bool)
for i in range(1, n + 1):
    m = lab == i
    if m.sum() >= 20000: big |= m
# 分开树干和地平弧
lab2, n2 = ndi.label(big)
parts = []
for i in range(1, n2 + 1):
    ys, xs = np.nonzero(lab2 == i)
    parts.append((ys.mean(), i, xs.min(), ys.min(), xs.max(), ys.max()))
    print('big part', i, 'bbox', xs.min(), ys.min(), xs.max(), ys.max())
parts.sort()
trunk = trace(lab2 == parts[0][1], eps=1.5)
ground = trace(lab2 == parts[1][1], eps=1.5)
# 红字：左右两组
lab3, n3 = ndi.label(ndi.binary_dilation(red, iterations=12))
groups = []
for i in range(1, n3 + 1):
    ys, xs = np.nonzero((lab3 == i) & red)
    if len(xs) < 500: continue
    groups.append((xs.mean(), ys.min(), ys.max(), xs.min(), xs.max(), (lab3 == i) & red))
groups.sort(key=lambda t: t[0])
print('red groups', [(round(g_[0]), g_[3], g_[1], g_[4], g_[2]) for g_ in groups])
left_mask = np.zeros((H, W), bool); right_mask = np.zeros((H, W), bool)
for g_ in groups:
    if g_[0] < W / 2: left_mask |= g_[5]
    else: right_mask |= g_[5]
text_left = trace(left_mask, eps=1.0)
text_right = trace(right_mask, eps=1.0)

# 行号/序号：沿长轴方向把瓦片归行
rot = float(np.mean([t['rot'] for t in tiles]))
a = math.radians(rot)
u = (math.cos(a), math.sin(a)); v = (-math.sin(a), math.cos(a))
for t in tiles:
    t['v'] = t['cx'] * v[0] + t['cy'] * v[1]
    t['u'] = t['cx'] * u[0] + t['cy'] * u[1]
tiles.sort(key=lambda t: (t['v'], t['u']))
# 按 v 聚类成行
rows, cur = [], [tiles[0]]
pitch_v = np.median(np.diff(sorted(t['v'] for t in tiles)))
for t in tiles[1:]:
    if t['v'] - cur[-1]['v'] > 25: rows.append(cur); cur = [t]
    else: cur.append(t)
rows.append(cur)
print('rows', [len(r_) for r_ in rows])
final = []
for i, row in enumerate(rows):
    row.sort(key=lambda t: t['u'])
    for j, t in enumerate(row):
        final.append(dict(i=i, j=j, cx=round(t['cx'], 1), cy=round(t['cy'], 1), w=round(t['w'], 1), h=round(t['h'], 1), rot=round(t['rot'], 2)))

ts = 'export const LOGO_W = %d;\nexport const LOGO_H = %d;\n\n' % (W, H)
ts += '/** 由 scripts/extract-logo.py 从原图 assets/安信地板 logo-2011.png 识别生成，请勿手改 */\n'
ts += 'export const LOGO_TILE_DATA: {i: number; j: number; cx: number; cy: number; w: number; h: number; rot: number}[] = ' + json.dumps(final, ensure_ascii=False) + ';\n\n'
ts += 'export const TRUNK_PATH = %s;\n' % json.dumps(trunk)
ts += 'export const GROUND_PATH = %s;\n' % json.dumps(ground)
ts += 'export const TEXT_LEFT_PATH = %s;\n' % json.dumps(text_left)
ts += 'export const TEXT_RIGHT_PATH = %s;\n' % json.dumps(text_right)
open(out, 'w').write(ts)
print('wrote', out, len(ts) // 1024, 'KB')
