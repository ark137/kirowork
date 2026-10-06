#!/usr/bin/env python3
"""
全片分段渲染（8 核机器上一次性渲染会卡住，因此分段后拼接），最后混入音效轨。
用法：python3 scripts/render-full.py [crf]
输出：out/anxin-film-full.mp4
"""
import os, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRF = sys.argv[1] if len(sys.argv) > 1 else '21'
TOTAL = 6090
STEP = 260
CH = os.path.join(ROOT, 'out/full-chunks')
LOG = os.path.join(ROOT, 'out/render.log')
os.makedirs(CH, exist_ok=True)

def log(msg):
    with open(LOG, 'a') as f:
        f.write(time.strftime('%H:%M:%S ') + msg + '\n')

lst = []
a, k = 0, 0
while a < TOTAL:
    b = min(a + STEP - 1, TOTAL - 1)
    out = os.path.join(CH, f'c{k:03d}.mp4')
    if not os.path.exists(out):
        for attempt in range(3):
            try:
                r = subprocess.run(['npx', 'remotion', 'render', 'src/index.ts', 'Film', out, f'--frames={a}-{b}', '--codec=h264', f'--crf={CRF}', '--concurrency=6', '--muted', '--log=error'],
                                   cwd=ROOT, timeout=420, capture_output=True, text=True)
                if r.returncode == 0:
                    break
                log(f'err chunk {k}: {r.stderr[-300:]}')
            except subprocess.TimeoutExpired:
                log(f'timeout chunk {k} attempt {attempt}')
            if os.path.exists(out):
                os.remove(out)
    log(f'done {k} {a}-{b}')
    lst.append(f"file 'c{k:03d}.mp4'")
    a, k = b + 1, k + 1

with open(os.path.join(CH, 'list.txt'), 'w') as f:
    f.write('\n'.join(lst) + '\n')
video = os.path.join(ROOT, 'out/full-video.mp4')
subprocess.run(['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(CH, 'list.txt'), '-c', 'copy', video], cwd=ROOT, check=True)
final = os.path.join(ROOT, 'out/anxin-film-full.mp4')
subprocess.run(['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', os.path.join(ROOT, 'out/soundtrack.wav'),
                '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], cwd=ROOT, check=True)
log('ALL DONE ' + final)
