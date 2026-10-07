#!/usr/bin/env python3
"""
全片分段渲染（8 核机器上一次性渲染会卡住，因此分段后拼接），最后混入音效轨。
用法：python3 scripts/render-full.py [crf] [本次最多渲染的分段数]
（可重复执行：已完成的分段会跳过；全部分段完成后才拼接、混音）
输出：out/anxin-film-full.mp4
"""
import os, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRF = sys.argv[1] if len(sys.argv) > 1 else '21'
MAX_NEW = int(sys.argv[2]) if len(sys.argv) > 2 else 10 ** 6
TOTAL = 7245
STEP = 260
CH = os.path.join(ROOT, 'out/full-chunks')
LOG = os.path.join(ROOT, 'out/render.log')
os.makedirs(CH, exist_ok=True)

def log(msg):
    with open(LOG, 'a') as f:
        f.write(time.strftime('%H:%M:%S ') + msg + '\n')

lst = []
a, k = 0, 0
new = 0
while a < TOTAL:
    b = min(a + STEP - 1, TOTAL - 1)
    out = os.path.join(CH, f'c{k:03d}.mp4')
    if not os.path.exists(out):
        if new >= MAX_NEW:
            print(f'paused before chunk {k}; rerun to continue')
            sys.exit(0)
        new += 1
        tmp = out + '.part.mp4'
        for attempt in range(3):
            try:
                r = subprocess.run(['npx', 'remotion', 'render', 'src/index.ts', 'Film', tmp, f'--frames={a}-{b}', '--codec=h264', f'--crf={CRF}', '--concurrency=6', '--muted', '--log=error'],
                                   cwd=ROOT, timeout=420, capture_output=True, text=True)
                if r.returncode == 0:
                    os.replace(tmp, out)
                    break
                log(f'err chunk {k}: {r.stderr[-300:]}')
            except subprocess.TimeoutExpired:
                log(f'timeout chunk {k} attempt {attempt}')
            if os.path.exists(tmp):
                os.remove(tmp)
    log(f'done {k} {a}-{b}')
    print(f'done {k} {a}-{b}', flush=True)
    lst.append(f"file 'c{k:03d}.mp4'")
    a, k = b + 1, k + 1

with open(os.path.join(CH, 'list.txt'), 'w') as f:
    f.write('\n'.join(lst) + '\n')
video = os.path.join(ROOT, 'out/full-video.mp4')
subprocess.run(['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(CH, 'list.txt'), '-c', 'copy', video], cwd=ROOT, check=True)
final = os.path.join(ROOT, 'out/anxin-film-full.mp4')
subprocess.run(['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', os.path.join(ROOT, 'out/soundtrack.wav'),
                '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], cwd=ROOT, check=True)
log('ALL DONE ' + final)
