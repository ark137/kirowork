#!/usr/bin/env python3
"""
导出每条字幕在全片中的时间点（给配音用），输出到 docs/voiceover/：
  字幕时间表.csv   Excel 可直接打开（UTF-8 带 BOM）
  字幕-中文.srt / 字幕-英文.srt

时间规则与 src/SceneRenderer.tsx 完全一致：
  镜头起点 = 前面所有镜头时长之和；镜头内每条字幕的起点从第 8 帧开始，
  整个镜头可用帧数 = 时长×30 − 8（开头） − 6（结尾），按“字数+8”的权重分给各条字幕。
  字幕在显示结束前 10 帧开始淡出，所以配音最好在“建议说完”之前结束。
"""
import csv, json, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'voiceover')
FPS, LEAD_IN, TAIL, FADE = 30, 8, 6, 10

JS = r"""
const ts=require('typescript'),fs=require('fs');
const js=ts.transpileModule(fs.readFileSync('src/timeline.ts','utf8'),{compilerOptions:{module:'commonjs',target:'es2020'}}).outputText;
const m={exports:{}};new Function('module','exports','require',js)(m,m.exports,()=>({FPS:30}));
process.stdout.write(JSON.stringify(m.exports.SHOTS));
"""
SHOTS = json.loads(subprocess.run(['node', '-e', JS], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


def rnd(x):  # 与 JS 的 Math.round 一致（正数四舍五入）
    return int(x + 0.5)


def tc(frames, sep='.'):
    s = frames / FPS
    h, r = divmod(s, 3600)
    m, r = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{r:06.3f}'.replace('.', sep)


def speakable(zh):
    """估算朗读字数：去掉标点和空格（数字按 1 字计，实际略少）"""
    return sum(1 for ch in zh if ch.isalnum() or '\u4e00' <= ch <= '\u9fff')


rows, cursor = [], 0
for s in SHOTS:
    frames = rnd(s['dur'] * FPS)
    if s['subs']:
        total = frames - LEAD_IN - TAIL
        weights = [len(list(sub['zh'])) + 8 for sub in s['subs']]
        wsum = sum(weights)
        cur = LEAD_IN
        for sub, w in zip(s['subs'], weights):
            ln = rnd(total * w / wsum)
            a, b = cursor + cur, cursor + cur + ln
            rows.append({'shot': s['id'], 'act': s['act'], 'a': a, 'b': b, 'zh': sub['zh'], 'en': sub['en']})
            cur += ln
    cursor += frames

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, '字幕时间表.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['序号', '镜头号', '幕', '开始(秒)', '开始(时间码)', '开始(帧)', '字幕消失(秒)', '字幕消失(时间码)', '建议说完(秒)', '可用时长(秒)', '朗读字数', '语速(字/秒)', '提示', '中文', 'English'])
    for i, r in enumerate(rows, 1):
        a, b = r['a'] / FPS, r['b'] / FPS
        safe_end = (r['b'] - FADE) / FPS
        usable = safe_end - a
        n = speakable(r['zh'])
        cps = n / usable
        note = '偏紧，建议说快一点或缩短' if cps > 5.5 else ('略紧' if cps > 4.8 else '')
        w.writerow([i, r['shot'], r['act'], f'{a:.2f}', tc(r['a']), r['a'], f'{b:.2f}', tc(r['b']), f'{safe_end:.2f}', f'{usable:.2f}', n, f'{cps:.1f}', note, r['zh'], r['en']])

for lang, name in (('zh', '字幕-中文.srt'), ('en', '字幕-英文.srt')):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n') as f:
        for i, r in enumerate(rows, 1):
            f.write(f'{i}\n{tc(r["a"], ",")} --> {tc(r["b"], ",")}\n{r[lang]}\n\n')

print(json.dumps({'lines': len(rows), 'end_frame': cursor, 'total_s': cursor / FPS}, ensure_ascii=False))
for i, r in enumerate(rows, 1):
    a, b = r['a'] / FPS, r['b'] / FPS
    n = speakable(r['zh'])
    cps = n / ((r['b'] - FADE - r['a']) / FPS)
    print(f'{i:2d} | 镜{str(r["shot"]):>4} | {tc(r["a"])[3:]} → {tc(r["b"])[3:]} | {b - a:5.2f}s | {n:2d}字 {cps:3.1f}/s | {r["zh"]}')
