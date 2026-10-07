#!/usr/bin/env python3
"""
生成全片音效轨（无音乐）：public/sfx/soundtrack.mp3（入库）+ out/soundtrack.wav（合成用）

素材来源：
  - Kenney 音效包（CC0）：RPG Audio / Impact Sounds / Interface Sounds  https://kenney.nl
    运行前会自动下载到 .sfx-src/（不入库）
  - 其余（环境底噪、风、雨林、虫鸣、水声、钟声、电话拨号音、传真握手音、卫星提示音、低频冲击等）均为本脚本程序化合成

时间轴：从 src/timeline.ts 解析每个场景的起始帧，提示点（cue）以“场景内帧号”书写，
与各场景组件里的动画节点一一对应。

用法：
  python3 scripts/make-soundtrack.py                 全片音效轨
  python3 scripts/make-soundtrack.py --clip mill     只导出某一镜的音效 → out/<scene>-sfx.wav
      （响度增益取自“不含该镜”的全片混音，即与已出成片的音量一致；可单独剪进原片）
"""
import os, re, subprocess, json, math, urllib.request, zipfile
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
SRC = os.path.join(ROOT, '.sfx-src')
rng = np.random.default_rng(7)

# ───────────────────────── 时间轴 ─────────────────────────
def scene_starts(exclude=()):
    txt = open(os.path.join(ROOT, 'src/timeline.ts'), encoding='utf-8').read()
    body = txt[txt.index('export const SHOTS'):txt.index('export type Scene')]
    shots = re.findall(r"\{id: [\d.]+,.*?dur: ([\d.]+),.*?scene: '(\w+)'", body, re.S)
    starts, order, cur = {}, [], 0
    for dur, sc in shots:
        if sc in exclude:
            continue
        fr = int(round(float(dur) * FPS))
        if not order or order[-1][0] != sc:
            order.append([sc, cur, 0])
            starts[sc] = cur
        order[-1][2] += fr
        cur += fr
    return starts, order, cur

def setup(exclude=()):
    global STARTS, ORDER, TOTAL, N, mix
    STARTS, ORDER, TOTAL = scene_starts(exclude)
    N = int(TOTAL / FPS * SR) + SR  # 尾部多留 1 秒
    mix = np.zeros((N, 2), dtype=np.float64)

setup()

def at(scene, frame):
    return (STARTS[scene] + frame) / FPS

# ───────────────────────── 素材 ─────────────────────────
PACKS = {
    'rpg': 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
    'impact': 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
    'ui': 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
}

def ensure_packs():
    os.makedirs(SRC, exist_ok=True)
    for k, url in PACKS.items():
        d = os.path.join(SRC, k)
        if os.path.isdir(d):
            continue
        z = d + '.zip'
        urllib.request.urlretrieve(url, z)
        zipfile.ZipFile(z).extractall(d)

_cache = {}
def sample(name):
    """按文件名（不含扩展名）查找 Kenney 素材，解码为单声道 float"""
    if name in _cache:
        return _cache[name]
    path = None
    for dp, _, fs in os.walk(SRC):
        for f in fs:
            if f == name + '.ogg':
                path = os.path.join(dp, f)
    if not path:
        raise FileNotFoundError(name)
    wav = os.path.join(SRC, 'wav', name + '.wav')
    os.makedirs(os.path.dirname(wav), exist_ok=True)
    if not os.path.exists(wav):
        subprocess.run(['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), wav], cwd=ROOT, check=True)
    sr, x = wavfile.read(wav)
    x = x.astype(np.float64) / (32768.0 if x.dtype == np.int16 else 1.0)
    x /= max(1e-6, np.abs(x).max())
    _cache[name] = x
    return x

# ───────────────────────── 工具 ─────────────────────────
def db(g):
    return 10 ** (g / 20)

def t(sec):
    return np.arange(int(sec * SR)) / SR

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)

def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)

def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)

def noise(sec):
    return rng.standard_normal(int(sec * SR))

def pink(sec):
    n = int(sec * SR)
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X /= np.sqrt(np.maximum(f, 20))
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)

def env_ad(n, a, d, curve=4.0):
    """a/d 为秒；指数衰减"""
    na = max(1, int(a * SR))
    e = np.ones(n)
    e[:na] = np.linspace(0, 1, na)
    tt = np.arange(n - na) / SR
    e[na:] = np.exp(-curve * tt / max(d, 1e-3))
    return e

def fade(x, fi=0.05, fo=0.05):
    n = len(x)
    a, b = min(n, int(fi * SR)), min(n, int(fo * SR))
    if a:
        x[:a] *= np.linspace(0, 1, a) ** 2
    if b:
        x[-b:] *= np.linspace(1, 0, b) ** 2
    return x

def speed(x, r):
    """变速（同时变调）"""
    if abs(r - 1) < 1e-3:
        return x
    idx = np.arange(0, len(x) - 1, r)
    return np.interp(idx, np.arange(len(x)), x)

_ir = None
def reverb(x, wet=0.25, size=1.2):
    global _ir
    if _ir is None or len(_ir) != int(size * SR):
        n = int(size * SR)
        _ir = lp(rng.standard_normal(n), 6000) * np.exp(-6 * np.arange(n) / n)
        _ir /= np.sqrt((_ir ** 2).sum())
    y = signal.fftconvolve(x, _ir)[: len(x) + len(_ir)]
    out = np.zeros(len(y))
    out[: len(x)] += x * (1 - wet)
    out += y * wet
    return out

def place(x, sec, gain_db=0.0, pan=0.0, width=0.0):
    """把单声道 x 放到 sec 秒处；pan ∈ [-1, 1]；width>0 时左右轻微去相关（用于底噪）"""
    i = int(sec * SR)
    if i >= N or len(x) == 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: N - i] * db(gain_db)
    l = math.cos((pan + 1) * math.pi / 4)
    r = math.sin((pan + 1) * math.pi / 4)
    if width > 0:
        d = int(0.011 * SR)
        xr = np.concatenate([np.zeros(d), x[:-d]]) if len(x) > d else x
        mix[i:i + len(x), 0] += x * l * 1.41
        mix[i:i + len(x), 1] += (x * (1 - width) + xr * width) * r * 1.41
    else:
        mix[i:i + len(x), 0] += x * l * 1.41
        mix[i:i + len(x), 1] += x * r * 1.41

def kenney(name, sec, gain_db=-6, pan=0.0, rate=1.0, wet=0.0):
    x = speed(sample(name), rate)
    if wet > 0:
        x = reverb(x, wet)
    place(x, sec, gain_db, pan)

# ───────────────────────── 合成音色 ─────────────────────────
def s_wind(sec, lo=180, hi=900, gust=0.12):
    x = bp(pink(sec), lo, hi)
    tt = t(sec)[: len(x)]
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * gust * tt + rng.uniform(0, 6)) * np.sin(2 * np.pi * gust * 0.37 * tt + 1)
    return fade(x / (np.abs(x).max() + 1e-9) * lfo, 1.0, 1.0)

def s_room(sec, f=260):
    x = lp(pink(sec), f)
    return fade(x / (np.abs(x).max() + 1e-9), 0.6, 0.6)

def s_water(sec, rate=0.35):
    x = lp(pink(sec), 900)
    tt = t(sec)[: len(x)]
    e = 0.45 + 0.55 * np.clip(np.sin(2 * np.pi * rate * tt) ** 3, 0, None)
    x = x * e + 0.25 * bp(noise(sec), 1500, 4000) * e
    return fade(x / (np.abs(x).max() + 1e-9), 0.8, 0.8)

def s_bird(seed):
    r = np.random.default_rng(seed)
    out = []
    for _ in range(r.integers(2, 5)):
        d = r.uniform(0.05, 0.14)
        tt = t(d)
        f0, f1 = r.uniform(2600, 4200), r.uniform(3000, 5600)
        fr = np.linspace(f0, f1, len(tt)) + 300 * np.sin(2 * np.pi * r.uniform(25, 60) * tt)
        ph = 2 * np.pi * np.cumsum(fr) / SR
        out.append(np.sin(ph) * np.sin(np.pi * np.arange(len(tt)) / len(tt)) ** 2)
        out.append(np.zeros(int(r.uniform(0.03, 0.09) * SR)))
    return np.concatenate(out)

def s_forest(sec, birds=1.0, insects=1.0, rain=0.0, seed=1):
    x = 0.35 * s_wind(sec, 300, 2500, 0.08)
    if insects:
        tt = t(sec)
        buzz = np.sin(2 * np.pi * 4300 * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * tt)))
        buzz *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * tt)
        x[: len(buzz)] += insects * 0.05 * buzz[: len(x)]
    if rain:
        x += rain * 0.4 * hp(noise(sec), 3000)[: len(x)] * 0.3
    r = np.random.default_rng(seed)
    k = 0.4
    while k < sec - 0.5 and birds > 0:
        b = s_bird(r.integers(1e6)) * r.uniform(0.15, 0.4) * birds
        i = int(k * SR)
        x[i:i + len(b)] += b[: len(x) - i]
        k += r.uniform(0.6, 2.2)
    return fade(x / (np.abs(x).max() + 1e-9), 1.0, 1.0)

def s_crickets(sec):
    tt = t(sec)
    chirp = np.sin(2 * np.pi * 4700 * tt) * (np.sin(2 * np.pi * 3.2 * tt) > 0.6) * (0.5 + 0.5 * np.sin(2 * np.pi * 60 * tt))
    chirp2 = np.sin(2 * np.pi * 5200 * tt) * (np.sin(2 * np.pi * 2.1 * tt + 1) > 0.7)
    x = 0.12 * chirp + 0.08 * chirp2 + 0.4 * s_room(sec, 180)[: len(tt)]
    return fade(x, 1.0, 1.0)

def s_whoosh(sec=1.2, f0=300, f1=2500, rev=False):
    n = int(sec * SR)
    x = noise(sec)
    # 用逐段带通近似扫频：分 24 段滤波后拼接
    segs = 24
    y = np.zeros(n)
    for k in range(segs):
        a, b = k * n // segs, (k + 1) * n // segs
        u = k / segs
        fc = f0 * (f1 / f0) ** (1 - u if rev else u)
        part = bp(x[max(0, a - 2048):b], fc * 0.6, min(fc * 1.6, SR / 2 - 100))[-(b - a):]
        y[a:b] = part
    e = np.sin(np.pi * np.arange(n) / n) ** 1.6
    y = y * e
    return y / (np.abs(y).max() + 1e-9)

def s_bell(f=880, dur=2.5, partials=((1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12))):
    tt = t(dur)
    y = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (2.2 + m * 0.9)) for m, a in partials)
    y *= env_ad(len(tt), 0.004, dur, 1.0)
    return y / (np.abs(y).max() + 1e-9)

def s_chime(base=1046.5, n=4, gap=0.07, seed=0):
    r = np.random.default_rng(seed)
    scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2]
    out = np.zeros(int((gap * n + 2.5) * SR))
    for k in range(n):
        b = s_bell(base * scale[r.integers(len(scale))], 2.0) * r.uniform(0.5, 1)
        i = int(k * gap * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    return reverb(out / (np.abs(out).max() + 1e-9), 0.35, 1.6)

def s_shimmer(sec=2.0, density=26, lo=2500, hi=6500, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros(int((sec + 1.2) * SR))
    for _ in range(int(density * sec)):
        f = r.uniform(lo, hi)
        d = r.uniform(0.15, 0.5)
        tt = t(d)
        g = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * r.uniform(0.2, 1)
        i = int(r.uniform(0, sec) * SR)
        out[i:i + len(g)] += g[: len(out) - i]
    env = np.ones(len(out))
    m = int(sec * SR)
    env[:m] = np.sin(np.pi * np.arange(m) / m) ** 0.7
    out *= env
    return reverb(out / (np.abs(out).max() + 1e-9), 0.45, 1.8)

def s_boom(dur=4.0, f0=70, f1=34):
    tt = t(dur)
    fr = f1 + (f0 - f1) * np.exp(-tt * 3)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    y = np.sin(ph) * env_ad(len(tt), 0.01, dur, 2.6)
    y += 0.5 * lp(noise(dur), 180) * env_ad(len(tt), 0.005, 0.6, 5)
    y = reverb(y, 0.3, 2.5)
    return y / (np.abs(y).max() + 1e-9)

def s_swell(dur=2.5, f=55):
    tt = t(dur)
    y = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.sin(np.pi * tt / dur) ** 2
    y += 0.3 * lp(pink(dur), 300)[: len(tt)] * np.sin(np.pi * tt / dur) ** 2
    return y / (np.abs(y).max() + 1e-9)

def s_tone(f, dur, a=0.005, r=0.02):
    tt = t(dur)
    y = np.sin(2 * np.pi * f * tt) if np.isscalar(f) else sum(np.sin(2 * np.pi * ff * tt) for ff in f) / len(f)
    return fade(y, a, r)

DTMF = {'1': (697, 1209), '2': (697, 1336), '3': (697, 1477), '4': (770, 1209), '5': (770, 1336), '6': (770, 1477),
        '7': (852, 1209), '8': (852, 1336), '9': (852, 1477), '0': (941, 1336)}

def s_dial(digits, on=0.07, off=0.05):
    out = []
    for d in digits:
        out.append(s_tone(DTMF[d], on))
        out.append(np.zeros(int(off * SR)))
    return lp(np.concatenate(out), 3400)

def s_ring(dur=1.2):
    # 老式电话铃：两组 20Hz 调制的双音
    tt = t(dur)
    y = (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 20 * tt)))
    return fade(lp(y, 3000) * 0.5, 0.01, 0.08)

def s_fax_handshake():
    parts = [s_tone(1100, 0.5), np.zeros(int(0.35 * SR)), s_tone(2100, 0.7), np.zeros(int(0.1 * SR))]
    hs = bp(noise(0.9), 600, 3200) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 9 * t(0.9))))
    parts.append(fade(hs * 0.5, 0.02, 0.1))
    return lp(np.concatenate(parts), 3600)

def s_motor(dur=2.0):
    tt = t(dur)
    y = 0.6 * np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.3 + 0.4 * bp(noise(dur), 300, 1800)[: len(tt)]
    y *= 0.7 + 0.3 * np.sin(2 * np.pi * 6 * tt)
    return fade(lp(y, 2500), 0.1, 0.2)

def s_rumble(dur=3.0):
    tt = t(dur)
    y = lp(noise(dur), 120, 4) * 3 + 0.3 * np.sin(2 * np.pi * 48 * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * tt))
    return fade(y / (np.abs(y).max() + 1e-9), 0.6, 0.8)

def s_horn(dur=1.8, f=98):
    tt = t(dur)
    y = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 6))
    return reverb(fade(lp(y, 900), 0.15, 0.5) / 2, 0.5, 2.5)

def s_blip(f=1400, dur=0.08):
    return s_tone(f, dur, 0.002, 0.04) * env_ad(int(dur * SR), 0.002, dur, 3)

def s_pop(f=600):
    tt = t(0.12)
    fr = f * (1 + 1.5 * np.exp(-tt * 60))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 35)
    return y

def s_tape(dur=2.3):
    # 胶带撕开：带通噪声 + 密集小爆裂，越拉越快
    n = int(dur * SR)
    y = bp(noise(dur), 1200, 7000)[:n] * 0.25
    k = 0.0
    while k < dur - 0.02:
        i = int(k * SR)
        c = hp(noise(0.006), 2000) * rng.uniform(0.4, 1)
        y[i:i + len(c)] += c[: n - i]
        k += 0.012 + 0.03 * (1 - k / dur) * rng.uniform(0.5, 1.5)
    e = np.minimum(1, np.arange(n) / (0.2 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.3 * SR))
    return y * e

def s_wheels(dur):
    n = int(dur * SR)
    y = lp(noise(dur), 400)[:n] * 0.6
    k = 0.2
    while k < dur:
        i = int(k * SR)
        c = lp(noise(0.02), 1500) * env_ad(int(0.02 * SR), 0.001, 0.02, 5)
        y[i:i + len(c)] += c[: n - i] * 0.8
        k += 0.42
    return fade(y, 0.3, 0.3)

def s_rustle(dur=2.0):
    x = bp(noise(dur), 1500, 7000)
    tt = t(dur)[: len(x)]
    e = np.abs(lp(rng.standard_normal(len(x)), 6)) * 6
    return fade(x * np.clip(e, 0, 1.5) * np.sin(np.pi * tt / dur), 0.2, 0.3)

def s_ding_dong():
    a = s_bell(659.3, 1.6, ((1, 1), (2, 0.2), (3, 0.08)))
    b = s_bell(523.3, 2.2, ((1, 1), (2, 0.2), (3, 0.08)))
    out = np.zeros(len(a) // 2 + len(b))
    out[: len(a)] += a
    out[len(a) // 2:] += b
    return reverb(out, 0.5, 2.2)

def bed(scene, synth, gain_db, extra_in=0.4, extra_out=0.6):
    sc = [o for o in ORDER if o[0] == scene][0]
    dur = sc[2] / FPS + extra_in + extra_out
    x = synth(dur)
    place(x, sc[1] / FPS - extra_in, gain_db, 0, width=0.6)

# ───────────────────────── 提示点 ─────────────────────────
def build():
    # 序章：一粒金点、年轮生长 → 落日与背影 → 标题卡
    bed('prologue', lambda d: s_wind(d, 150, 700, 0.06), -30)
    place(s_swell(4.0, 44), at('prologue', 0), -20)
    for k, fr in enumerate([10, 32, 55, 78, 100, 122]):
        place(s_bell(1568 * [1, 1.125, 1.25, 1.5, 1.667, 2][k % 6], 2.4), at('prologue', fr), -27, pan=(k % 3 - 1) * 0.3)
    place(s_shimmer(2.5, 18, seed=1), at('prologue', 140), -22)
    place(s_whoosh(2.0, 1800, 200, False), at('prologue', 150), -24)
    place(s_boom(5.0), at('prologue', 266), -7)
    place(s_whoosh(1.3, 400, 3000), at('prologue', 266), -26)
    kenney('impactSoft_heavy_001', at('prologue', 270 + 46), -14, wet=0.3)
    place(s_shimmer(2.2, 22, seed=2), at('prologue', 270 + 50), -21)

    # 第 2 镜：荒芜大地 → 细胞里的木质素
    bed('s2', lambda d: s_wind(d, 120, 600, 0.05), -24)
    for k in range(9):
        kenney('impactSoft_medium_00%d' % (k % 5), at('s2', 20 + k * 10), -34, pan=rng.uniform(-0.6, 0.6), rate=1.6)
    place(s_whoosh(1.4, 200, 1600), at('s2', 100), -20)
    place(s_shimmer(2.6, 30, 3000, 7000, seed=3), at('s2', 130), -22)
    place(s_bell(784, 3.0), at('s2', 128), -24)

    # 第 3 镜：第一片森林
    bed('s3', lambda d: s_wind(d, 200, 1400, 0.09), -23)
    kenney('creak1', at('s3', 30), -24, pan=-0.4, rate=0.8, wet=0.4)
    kenney('creak3', at('s3', 95), -26, pan=0.5, rate=0.7, wet=0.4)
    place(s_swell(3.5, 65), at('s3', 20), -20)
    place(s_shimmer(2.0, 16, seed=4), at('s3', 70), -26)

    # 第 4 镜：1966 温州水街
    bed('s4', lambda d: s_water(d, 0.3) * 0.7 + 0.3 * s_forest(d, birds=0.6, insects=0, seed=4)[: int(d * SR)], -22)
    kenney('creak2', at('s4', 40), -28, pan=-0.3, rate=0.9, wet=0.3)
    kenney('impactSoft_medium_002', at('s4', 96), -20, wet=0.3)

    # 第 5 镜：船舶设计图纸
    bed('s5', lambda d: s_room(d, 300), -30)
    for k in range(6):
        kenney('scratch_00%d' % (k % 5 + 1), at('s5', 6 + k * 13), -24, pan=rng.uniform(-0.4, 0.4))
    place(s_whoosh(1.4, 300, 2200), at('s5', 70), -26)
    kenney('impactGeneric_light_002', at('s5', 127), -22, rate=1.3, wet=0.4)
    place(s_bell(1046.5, 2.5), at('s5', 128), -24)
    place(s_shimmer(1.8, 18, seed=5), at('s5', 132), -27)

    # 第 5.5 镜：验船师
    bed('s5b', lambda d: s_water(d, 0.4) * 0.8 + 0.2 * s_wind(d, 300, 1200), -21)
    place(s_horn(2.2, 87), at('s5b', 4), -30, pan=0.6)
    for fr, pan in [(26, -0.4), (46, -0.1), (66, 0.2)]:
        kenney('impactWood_medium_00%d' % (fr % 5), at('s5b', fr), -12, pan=pan, wet=0.25)
        place(s_bell(523.3, 1.5, ((1, 1), (2.0, 0.3))), at('s5b', fr + 1), -32, pan=pan)
    for k in range(7):
        kenney('impactSoft_medium_00%d' % (k % 5), at('s5b', 82 + k * 12 + 6), -20, rate=1.1)
        kenney('bookPlace%d' % (k % 3 + 1), at('s5b', 82 + k * 12 + 1), -30, rate=1.2)
    kenney('metalClick', at('s5b', 168), -20, pan=0.2)
    kenney('bookPlace2', at('s5b', 176), -22, pan=0.2)
    kenney('cloth2', at('s5b', 186), -24)
    place(s_rustle(1.6), at('s5b', 204), -28)
    place(s_shimmer(1.8, 20, seed=6), at('s5b', 236), -23)

    # 第 6 镜：第一家门店
    bed('s6', lambda d: s_room(d, 400) * 0.6 + 0.4 * s_forest(d, birds=0.3, insects=0, seed=6)[: int(d * SR)], -26)
    kenney('bookPlace1', at('s6', 8), -18)
    kenney('switch_002', at('s6', 32), -22)
    place(s_tone([120, 240], 3.0) * 0.3, at('s6', 34), -36)
    place(s_bell(2093, 1.2, ((1, 1), (2.7, 0.3))), at('s6', 120), -30, pan=-0.6)  # 远处一声自行车铃
    place(s_bell(2093, 1.2, ((1, 1), (2.7, 0.3))), at('s6', 128), -32, pan=-0.6)
    place(s_whoosh(1.6, 300, 2000), at('s6', 148), -26)

    # 第 7 镜：亲手设计商标
    bed('s7', lambda d: s_room(d, 300), -31)
    for k in range(5):
        kenney('scratch_00%d' % (k % 5 + 1), at('s7', 26 + k * 11), -25, pan=rng.uniform(-0.3, 0.3))
    for i in range(46):
        st = 70 + (i / 46) * 90
        kenney('impactWood_light_00%d' % (i % 5), at('s7', st + 10), -27 + rng.uniform(-3, 2), pan=rng.uniform(-0.5, 0.5), rate=rng.uniform(1.1, 1.5))
    kenney('impactWood_heavy_001', at('s7', 152), -20, wet=0.3)
    place(s_chime(784, 5, 0.09, seed=7), at('s7', 176), -18)
    place(s_shimmer(1.8, 24, seed=8), at('s7', 192), -22)

    # 禁伐
    bed('ban', lambda d: s_room(d, 220), -26)
    kenney('cloth1', at('ban', 2), -20)
    place(s_whoosh(0.35, 2500, 300), at('ban', 62), -20)
    kenney('impactPunch_heavy_002', at('ban', 70), -8, wet=0.3)
    place(s_boom(2.5, 60, 30), at('ban', 70), -12)
    for k in range(8):
        kenney('impactWood_heavy_00%d' % (k % 5), at('ban', 84 + k * 9), -24 - k, pan=0.4, rate=0.9, wet=0.3)

    # 中间商
    bed('chain', lambda d: s_room(d, 160) + 0.3 * np.sin(2 * np.pi * 55 * t(d))[: int(d * SR)], -27)
    place(s_horn(2.4, 82), at('chain', 10), -26, pan=0.0)
    for k in range(7):
        kenney('impactWood_light_00%d' % (k % 5), at('chain', 12 + k * 10), -28, pan=-0.6 + k * 0.2)
    place(s_whoosh(0.9, 2000, 200), at('chain', 62), -20)
    kenney('impactPunch_medium_001', at('chain', 84), -12, wet=0.2)
    kenney('creak2', at('chain', 90), -20, rate=0.8)

    # 码头（夜）
    bed('docks', lambda d: s_water(d, 0.25) * 0.6 + 0.4 * s_crickets(d)[: int(d * SR)], -21)
    kenney('switch_005', at('docks', 18), -22, pan=-0.1)
    for k in range(10):
        kenney('footstep_concrete_00%d' % (k % 5), at('docks', 6 + k * 17), -30, pan=-0.8 + k * 0.16)
    for k in range(4):
        kenney('impactWood_light_00%d' % k, at('docks', 50 + k * 28), -30, pan=0.3)

    # 封箱胶带
    bed('tape', lambda d: s_room(d, 250), -30)
    place(s_tape(2.3), at('tape', 0), -27)
    for k in range(3):
        kenney('scratch_00%d' % (k + 2), at('tape', 112 + k * 12), -22)
    place(s_bell(1318.5, 2.2), at('tape', 150), -22)

    # 时差与拨号
    bed('clocks', lambda d: s_room(d, 200), -29)
    for k in range(int(210 / 15)):
        kenney('tick_001', at('clocks', 4 + k * 15), -24, pan=-0.6 if k % 2 == 0 else 0.6, rate=0.9)
    nums = ['5591', '2231', '998', '5591223', '19981', '55912', '2231998']
    for k in range(7):
        d = s_dial(nums[k % len(nums)])
        st = 30 + k * 24
        place(d, at('clocks', st), -24)
        place(s_tone(425, 0.45) * 0.6, at('clocks', st) + len(d) / SR + 0.05, -32, pan=0.5)

    # 传真
    bed('fax', lambda d: s_crickets(d), -22)
    for k in range(6):
        kenney('cloth%d' % (k % 4 + 1), at('fax', 4 + k * 13), -26, pan=-0.2 + k * 0.1, rate=1.2)
    for k in range(8):
        kenney('bookFlip%d' % (k % 3 + 1), at('fax', 8 + k * 10), -32, pan=-0.6, rate=1.2)
    place(s_ring(1.0), at('fax', 100), -25)
    place(s_ring(1.0), at('fax', 100) + 1.6, -27)
    place(s_fax_handshake(), at('fax', 110), -26)
    place(s_motor(2.0), at('fax', 116), -26)
    place(s_chime(659.3, 4, 0.12, seed=9), at('fax', 106), -22)

    # 南美 · 亚马逊
    bed('amazon', lambda d: s_forest(d, birds=0.8, insects=0.8, rain=0.4, seed=11), -21, extra_in=0.2)
    place(s_whoosh(2.6, 150, 900), at('amazon', 0), -22)
    place(s_water(1.6, 1.2), at('amazon', 40), -30)
    place(s_whoosh(1.2, 300, 2400), at('amazon', 108), -20)
    for k in range(5):
        kenney('cloth%d' % (k % 4 + 1), at('amazon', 128 + k * 7), -30, pan=-0.7 + k * 0.25, rate=1.6)

    # 争光的树
    bed('canopy', lambda d: s_forest(d, birds=1.0, insects=0.6, seed=12), -21)
    for k, fr in enumerate([10, 40, 70, 100]):
        kenney('creak%d' % (k % 3 + 1), at('canopy', fr), -27, pan=(k - 1.5) * 0.4, rate=0.75, wet=0.35)
    place(s_swell(3.0, 62), at('canopy', 60), -22)
    place(s_shimmer(2.0, 24, seed=13), at('canopy', 120), -22)

    # 相遇
    bed('meet', lambda d: s_forest(d, birds=0.7, insects=0.9, seed=14), -21)
    for k in range(8):
        kenney('footstep_grass_00%d' % (k % 5), at('meet', 4 + k * 10), -22, pan=-0.6 + k * 0.1)
    place(s_boom(4.0, 52, 30), at('meet', 108), -16)
    place(s_bell(392, 4.0, ((1, 1), (2.0, 0.4), (3.0, 0.2), (4.2, 0.1))), at('meet', 108), -16)
    place(s_shimmer(1.8, 26, seed=15), at('meet', 112), -21)
    place(s_whoosh(1.6, 200, 3000), at('meet', 126), -19)
    place(s_chime(523.3, 6, 0.1, seed=16), at('meet', 152), -22)
    for k, a in enumerate([0.0, 0.42, 0.8, 0.92]):
        place(s_bell(1046.5 * [1, 1.25, 1.5, 2][k], 1.8), at('meet', 182 + a * 38), -25, pan=0.1 + k * 0.12)
    place(s_shimmer(1.6, 16, seed=17), at('meet', 214), -24)

    # 树种名牌
    bed('nameplates', lambda d: s_forest(d, birds=0.5, insects=0.4, seed=18), -27)
    for i in range(4):
        kenney('impactWood_light_00%d' % i, at('nameplates', 4 + i * 13 + 10), -16, pan=-0.5 + i * 0.33, rate=1.1)
        kenney('handleSmallLeather', at('nameplates', 4 + i * 13 + 2), -30, pan=-0.5 + i * 0.33)
    place(s_shimmer(1.6, 20, seed=19), at('nameplates', 94), -23)

    if 'mill' in STARTS:
        mill_cues()

    # 卫星轮伐
    bed('satellite', lambda d: s_wind(d, 400, 2400, 0.05) * 0.6 + 0.4 * s_room(d, 140)[: int(d * SR)], -26)
    place(s_whoosh(3.2, 2600, 400), at('satellite', 0), -24, pan=0.4)
    place(s_whoosh(2.0, 300, 1800), at('satellite', 22), -27)
    for k in range(5):
        place(s_blip(1800, 0.05), at('satellite', 30 + k * 11), -26)
    for y in range(25):
        place(s_blip(1320 if y < 24 else 1760, 0.07), at('satellite', 84 + y * 152 / 25), -27, pan=0.5)
        if y % 3 == 0:
            kenney('impactWood_heavy_00%d' % (y % 5), at('satellite', 84 + y * 152 / 25 + 2), -34, pan=-0.2, rate=0.8)
    place(s_chime(880, 4, 0.08, seed=20), at('satellite', 238), -20, pan=0.4)

    # 青浦工厂
    bed('factory', lambda d: s_room(d, 220) * 0.6 + 0.4 * s_wind(d, 200, 900), -25)
    place(s_rumble(2.6), at('factory', 0), -18, pan=-0.5)
    for i in range(7):
        kenney('impactPlank_medium_00%d' % (i % 5), at('factory', 26 + i * 7 + 18), -24, pan=-0.4 + i * 0.12, wet=0.25)
    kenney('impactMetal_light_002', at('factory', 70), -26, pan=0.5)
    place(s_chime(1046.5, 3, 0.08, seed=21), at('factory', 96), -21)

    # 走出去：世界地图
    bed('s20', lambda d: s_wind(d, 150, 800, 0.05), -28)
    place(s_whoosh(1.6, 200, 1200), at('s20', 0), -24)
    for (t0, t1, pan) in [(36, 74, 0.6), (86, 116, 0.5), (126, 158, -0.1), (166, 200, -0.6)]:
        place(s_whoosh((t1 - t0) / FPS + 0.2, 400, 2400), at('s20', t0), -25, pan=pan)
        place(s_bell(1318.5, 1.6), at('s20', t1), -25, pan=pan)
    for i in range(4):
        kenney('glass_00%d' % (i + 1), at('s20', 70 + i * 5), -28, pan=0.6)
    kenney('handleCoins', at('s20', 130), -22, pan=0.2)
    kenney('handleCoins2', at('s20', 146), -26, pan=-0.1)
    for k, fr in enumerate([200, 210, 220]):
        kenney('creak%d' % (k + 1), at('s20', fr), -32, rate=1.4)
    place(s_shimmer(1.6, 18, seed=22), at('s20', 204), -25)

    # 地标线稿
    bed('s21', lambda d: s_room(d, 300) * 0.6 + 0.4 * s_wind(d, 300, 1200), -28)
    for i in range(4):
        for k in range(3):
            kenney('scratch_00%d' % ((i + k) % 5 + 1), at('s21', 8 + i * 44 + k * 12), -26, pan=-0.6 + i * 0.4)
        place(s_bell(784 * [1, 1.125, 1.25, 1.5][i], 1.8), at('s21', 8 + i * 44 + 40), -25, pan=-0.6 + i * 0.4)
    for k in range(16):
        kenney('impactWood_light_00%d' % (k % 5), at('s21', 50 + k * 9), -34, pan=-0.7 + k * 0.09, rate=1.4)
    place(s_shimmer(1.4, 24, seed=23), at('s21', 192), -22)

    # 回国：机场
    bed('s22', lambda d: s_room(d, 350) * 0.7 + 0.3 * lp(pink(d), 1200)[: int(d * SR)], -25)
    place(s_ding_dong(), at('s22', 6), -24)
    place(s_rumble(6.0), at('s22', 0), -28, pan=0.4)
    place(s_wheels(5.0), at('s22', 0), -24, pan=0.2)
    for k in range(17):
        kenney('footstep_concrete_00%d' % (k % 5), at('s22', 2 + k * 8.7), -26 + k * 0.4, pan=(-0.15 if k % 2 else 0.15))
    for k in range(14):
        place(s_pop(500 + k * 30), at('s22', (0.06 + k * 0.065) * 150 + 12), -32, pan=(-0.4 if k % 2 == 0 else 0.4))
    place(s_shimmer(1.8, 18, seed=24), at('s22', 142), -24)

    # 会议上的争论
    bed('s23', lambda d: s_room(d, 280), -27)
    for k, fr in enumerate([6, 24, 42, 58, 74, 90]):
        place(s_pop(420 + k * 40), at('s23', fr), -24 + k, pan=(-0.6 if k % 2 == 0 else 0.6))
    kenney('impactWood_medium_002', at('s23', 76), -22, pan=-0.5, wet=0.2)
    for k, fr in enumerate([116, 140, 164]):
        kenney('creak%d' % (k + 1), at('s23', fr), -28, rate=0.8, wet=0.3)
    place(s_chime(659.3, 5, 0.11, seed=25), at('s23', 182), -20)
    for k in range(6):
        place(s_pop(900 + k * 60), at('s23', 186 + k * 9), -34)

    # 里程碑之树
    bed('s24', lambda d: s_forest(d, birds=0.4, insects=0.0, seed=26) * 0.6 + 0.4 * s_room(d, 300)[: int(d * SR)], -26)
    kenney('creak1', at('s24', 6), -26, rate=0.7, wet=0.3)
    for k, fr in enumerate([76, 121, 166]):
        place(s_bell([523.3, 659.3, 784.0][k], 3.0, ((1, 1), (2.0, 0.35), (3.0, 0.15))), at('s24', fr), -18)
    place(s_rustle(3.0), at('s24', 144), -26)
    place(s_shimmer(2.6, 24, seed=27), at('s24', 150), -22)
    place(s_whoosh(1.2, 200, 1200), at('s24', 172), -28)

    # 书页
    bed('s25', lambda d: s_room(d, 260), -29)
    kenney('bookOpen', at('s25', 0), -18)
    for i in range(4):
        kenney('bookFlip%d' % (i % 3 + 1), at('s25', 24 + i * 26), -16, pan=0.1)
    kenney('bookPlace3', at('s25', 138), -22)
    place(s_boom(4.0, 58, 32), at('s25', 140), -16)
    place(s_bell(523.3, 4.0, ((1, 1), (2.0, 0.4), (3.0, 0.2))), at('s25', 140), -16)
    place(s_shimmer(2.0, 18, seed=28), at('s25', 150), -24)

    # Logo 窗格
    bed('s26', lambda d: s_room(d, 300) * 0.5 + 0.5 * s_forest(d, birds=0.35, insects=0.0, seed=29)[: int(d * SR)], -27)
    for i in range(46):
        tl = 8 + rng.uniform(0, 130) * (1 if i > 4 else 0.2)
        kenney('glass_00%d' % (i % 6 + 1), at('s26', tl), -34 + rng.uniform(-2, 2), pan=rng.uniform(-0.6, 0.6), rate=rng.uniform(0.9, 1.3))
    place(s_whoosh(6.0, 1500, 250), at('s26', 20), -30)
    place(s_shimmer(5.0, 10, 2000, 5000, seed=30), at('s26', 120), -24)
    place(s_swell(5.0, 65), at('s26', 130), -26)

    # 收束
    bed('s27', lambda d: s_wind(d, 150, 700, 0.05), -31, extra_out=1.0)
    place(s_swell(3.0, 44), at('s27', 0), -21)
    for k in range(6):
        place(s_bell(1046.5 * [1, 1.125, 1.25, 1.5, 1.667, 2][k], 2.2), at('s27', 6 + k * 9), -27, pan=(k - 2.5) * 0.15)
    for i in range(46):
        st = 50 + (i / 46) * 70
        kenney('impactWood_light_00%d' % (i % 5), at('s27', st + 24), -29 + rng.uniform(-2, 2), pan=rng.uniform(-0.5, 0.5), rate=rng.uniform(1.15, 1.5))
    kenney('impactWood_heavy_002', at('s27', 124), -20, wet=0.3)
    place(s_boom(6.0, 62, 30), at('s27', 150), -11)
    place(s_chime(523.3, 6, 0.12, seed=31), at('s27', 152), -14)
    place(s_shimmer(3.0, 22, seed=32), at('s27', 178), -20)


def mill_cues(edge_in=0.4, edge_out=0.6):
    """巴西 · 雨林边的原材料工厂（scene: mill，240 帧）。随机数用局部 rng，不影响其他镜头。"""
    r = np.random.default_rng(1999)
    bed('mill', lambda d: s_forest(d, birds=0.8, insects=0.5, seed=40) * 0.65 + 0.35 * s_water(d, 0.3)[: int(d * SR)], -21,
        extra_in=edge_in, extra_out=edge_out)
    # A：河岸 · 厂房立起 · 握手
    place(s_horn(1.8, 110), at('mill', 4), -33, pan=0.7)
    place(s_water(1.6, 1.0), at('mill', 6), -30, pan=0.6)
    for k, fr in enumerate([0, 7, 14, 21]):
        kenney('footstep_grass_00%d' % (k % 5), at('mill', fr), -27, pan=-0.55 if k % 2 == 0 else -0.25)
    for i in range(6):
        kenney('impactPlank_medium_00%d' % (i % 5), at('mill', 6 + i * 8 + 16), -22, pan=-0.1 + i * 0.1, wet=0.25)
    for k in range(6):
        kenney('impactWood_light_00%d' % (k % 5), at('mill', 30 + k * 9), -31, pan=0.25, rate=1.2)
    stacks = [(4, 0), (3, 1), (2, 2)]
    for rows, si in stacks:
        n = 0
        for row in range(rows):
            for _ in range(rows - row):
                kenney('impactWood_light_00%d' % (n % 5), at('mill', 16 + si * 12 + n * 2.2 + 6), -33 + r.uniform(-2, 1), pan=-0.35 + si * 0.08, rate=r.uniform(0.8, 0.95))
                n += 1
    kenney('impactWood_medium_001', at('mill', 30), -28, pan=0.5)
    kenney('impactWood_medium_003', at('mill', 40), -30, pan=0.55)
    place(lp(s_motor(2.2), 1400), at('mill', 44), -38, pan=0.1)
    kenney('cloth2', at('mill', 20), -26, pan=-0.45)
    kenney('cloth3', at('mill', 38), -28, pan=-0.45)
    place(s_chime(587.3, 4, 0.1, seed=41), at('mill', 44), -22, pan=-0.4)
    place(s_shimmer(1.6, 20, seed=42), at('mill', 48), -27, pan=-0.4)
    place(s_whoosh(1.2, 200, 1400), at('mill', 80), -26)
    # B：规划图展开、落笔 → 推入图纸，化作林地
    kenney('bookOpen', at('mill', 92), -22)
    place(s_rustle(0.9), at('mill', 93), -24)
    kenney('bookPlace1', at('mill', 116), -30)
    for k in range(6):
        kenney('scratch_00%d' % (k % 5 + 1), at('mill', 104 + k * 6), -26, pan=r.uniform(-0.3, 0.3))
    place(s_whoosh(1.4, 250, 2000), at('mill', 132), -23)
    place(s_swell(2.4, 58), at('mill', 134), -24)
    # C：升起、拉直成金色网格 → 交给卫星
    place(s_whoosh(1.6, 300, 2400), at('mill', 166), -24)
    place(s_shimmer(1.8, 22, seed=43), at('mill', 186), -23)
    place(s_bell(1318.5, 2.0), at('mill', 196), -25)
    place(s_chime(1046.5, 4, 0.07, seed=44), at('mill', 204), -24, pan=0.3)
    for fr in [226, 233]:
        place(s_blip(1800, 0.05), at('mill', fr), -28, pan=0.4)


def limiter(x):
    """前视限幅：5 ms 前视取峰值包络，120 ms 释放，天花板 -1 dBFS"""
    ceil = db(-1)
    a = np.abs(x).max(1)
    look = int(0.005 * SR)
    from scipy.ndimage import maximum_filter1d
    env = maximum_filter1d(a, size=2 * look + 1)
    g = np.minimum(1.0, ceil / np.maximum(env, 1e-9))
    rel = np.exp(-1 / (0.12 * SR))
    gs = g.copy()
    for i in range(1, len(gs)):  # 只在需要时逐点平滑（下降立即、回升缓慢）
        gs[i] = min(g[i], gs[i - 1] * rel + (1 - rel) * g[i]) if g[i] > gs[i - 1] else g[i]
    return x * gs[:, None]


def master_gain():
    """高通去直流后，按全片 RMS 求出整体增益（音效轨整体偏安静，留给画面）"""
    for ch in range(2):
        mix[:, ch] = hp(mix[:, ch], 25)
    rms = np.sqrt((mix ** 2).mean())
    return db(-19) / (rms + 1e-9)


def export_clip(scene):
    """单镜音效：增益取自不含该镜的全片（= 已出成片的响度），再单独混这一镜"""
    global mix
    setup(exclude=(scene,))
    build()
    gain = master_gain()
    setup()
    sc = [o for o in ORDER if o[0] == scene][0]
    {'mill': lambda: mill_cues(edge_in=1.2, edge_out=1.2)}[scene]()
    for ch in range(2):
        mix[:, ch] = hp(mix[:, ch], 25)
    a, b = int(sc[1] / FPS * SR), int((sc[1] + sc[2]) / FPS * SR)
    x = limiter(mix[a:b] * gain)
    e = int(0.08 * SR)
    x[:e] *= np.linspace(0, 1, e)[:, None]
    x[-e:] *= np.linspace(1, 0, e)[:, None]
    out = os.path.join(ROOT, 'out', f'{scene}-sfx.wav')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    wavfile.write(out, SR, (x * 32767).astype(np.int16))
    print(json.dumps({'scene': scene, 'frames': sc[2], 'seconds': sc[2] / FPS, 'gain_db': 20 * math.log10(gain), 'wav': out}))


def master():
    global mix
    # 轻微高通去直流、整体响度、软限幅
    mix *= master_gain()
    mix = limiter(mix)
    # 片尾淡出（最后 1.2 秒）
    end = int(TOTAL / FPS * SR)
    fo = int(1.2 * SR)
    mix[end - fo:end] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    mix = mix[:end]


if __name__ == '__main__':
    import sys
    ensure_packs()
    if '--clip' in sys.argv:
        export_clip(sys.argv[sys.argv.index('--clip') + 1])
        sys.exit(0)
    build()
    master()
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'public/sfx'), exist_ok=True)
    wav = os.path.join(ROOT, 'out/soundtrack.wav')
    wavfile.write(wav, SR, (mix * 32767).astype(np.int16))
    m4a = os.path.join(ROOT, 'public/sfx/soundtrack.mp3')
    subprocess.run(['npx', 'remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', m4a], cwd=ROOT, check=True)
    print(json.dumps({'total_frames': TOTAL, 'seconds': TOTAL / FPS, 'scenes': len(ORDER), 'wav': wav, 'm4a': m4a}))
