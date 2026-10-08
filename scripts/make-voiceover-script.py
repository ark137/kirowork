#!/usr/bin/env python3
"""
生成配音稿（中文 / 英文）与时间表 → docs/voiceover/
配音稿是在片中字幕基础上“只改语速偏快的句子”的精简版；时间窗口沿用 SceneRenderer 的算法，
但按配音稿文字重新分配（如果把配音稿同步回画面字幕，就是这个时间）。

语速参考：中文旁白 ≤4.8 字/秒舒适，4.8–5.5 偏紧，>5.5 太快；
          英文旁白 ≤2.7 词/秒舒适，2.7–3.0 偏紧，>3.0 太快。
"""
import csv, json, os, re, subprocess, sys

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
ORIG = {s['id']: [(x['zh'], x['en']) for x in s['subs']] for s in SHOTS}

KEEP = 'KEEP'  # 沿用片中字幕原文
# 镜头号 → [(中文配音, 英文配音), ...]；KEEP 表示该镜沿用原字幕
V = {
    0: KEEP, 1: KEEP,
    2: [('四亿年前，陆地一片荒芜。', 'Four hundred million years ago: barren land.'),
        ('植物造出了“骨头”：木质素。', 'Plants built bones: lignin.')],
    3: KEEP, 3.1: KEEP,
    3.2: [('八千年前，浙江先民把原木凿成了船。', 'Eight thousand years ago in Zhejiang, a log became a boat.')],
    3.3: [('七千年前，河姆渡人发明了榫卯。', 'Seven thousand years ago, Hemudu invented mortise joints.'),
          ('不用钉子，木与木彼此咬合。', 'No nails: wood holding wood.')],
    3.4: [('六百多年前，紫禁城用斗拱托起屋檐。', "Six centuries ago, brackets lifted the Forbidden City's eaves."),
          ('木头柔韧、温暖，让人安心。', 'Wood is flexible, warm, reassuring.')],
    3.5: [('一代又一代人，住在木头里，被木头温暖。', 'Generations have lived in wood, warmed by it.')],
    4: [('1966 年，卢伟光生于温州经商世家。', 'Carl Lu was born in 1966, to a Wenzhou merchant family.')],
    5: [('他学船舶设计，懂水，更懂木头。', 'He studied shipbuilding, learning water and wood.'),
        ('一颗种子，就此埋下。', 'A seed was planted.')],
    5.5: [('1988 年，他分配进温州渔船检验处。', "In 1988, he joined Wenzhou's fishing-vessel inspection office."),
          ('做了六年验船师，验遍了木船。', 'Six years inspecting, boat after boat.'),
          ('1994 年，辞去铁饭碗，奔向木头。', 'In 1994, he left security for wood.')],
    6: KEEP,
    7: [('他亲手设计“安信”商标：地板堆成的树。', 'He designed the Anxin mark: a tree of floorboards.'),
        ('地板来自树木，信赖要像树一样慢慢长。', 'Floors come from trees. Trust, like trees, grows slowly.')],
    10: [('1998 年，国家禁止砍伐森林。', 'In 1998, the state banned logging.'),
         ('原料来路，被一刀斩断。', 'His supply was cut off.')],
    11: KEEP, 12: KEEP,
    13: [('1998 年 7 月，他在胶带上找到了巴西供应商的电话。', "In July 1998, a roll of tape gave him a Brazilian supplier's number.")],
    14: [('他不懂葡萄牙语，对方不懂中文。', "Neither spoke the other's language."),
         ('隔着 11 个小时的时差，他一直拨。', 'Eleven hours apart, he kept dialing.')],
    15: [('一个多月后，传真机响了。', 'Weeks later, the fax rang.'),
         ('巴西的路易斯，寄来了报价单。', 'Luis, in Brazil, sent a quote.')],
    8: [('报价单来自南美。', 'It came from South America.'),
        ('数千万年的雨水与阳光，养出了亚马逊雨林。', 'Tens of millions of years of rain raised the Amazon.')],
    9: KEEP, 16: KEEP, 17: KEEP,
    17.5: [('他和路易斯一起，在雨林边建起了工厂。', 'With Luis, he built a mill beside the rainforest.'),
           ('先规划，后采伐，只取森林给得起的。', 'Plan, then harvest. Take only what the forest gives.')],
    18: [('卫星遥感把林区分成 25 块，每年只采一块，采完就种。', 'Satellites divide the forest into 25 plots, one harvested yearly, then replanted.'),
         ('25 年一个轮回，森林生生不息。', 'A 25-year cycle, and the forest lives on.')],
    19: [('1999 年，他在上海青浦建起了自己的工厂。', 'In 1999, he built his own factory in Qingpu, Shanghai.')],
    20: KEEP, 21: KEEP,
    22: [('卢伟光的大儿子卢奕开，留学美国十年，2017 年回到了公司。', 'After ten years in the U.S., his elder son Ben returned in 2017.')],
    23: [('父子俩常常争得面红耳赤。', 'Father and son often argued fiercely.'),
         ('父亲说：儿子说得对，就该接受，否则成不了百年企业。', "If he's right, I accept, or we won't last a century.")],
    24: KEEP, 25: KEEP, 26: KEEP,
    27: [('安信地板。', 'Anxin Flooring.'),
         ('树的秘密，是时间；人的秘密，是一个信字。', "The tree's secret is time. The man's secret is one word: trust.")],
}


def rnd(x):
    return int(x + 0.5)


def tc(frames, sep='.'):
    s = frames / FPS
    h, r = divmod(s, 3600)
    m, r = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{r:06.3f}'.replace('.', sep)


def zh_len(zh):
    return sum(1 for ch in zh if ch.isalnum() or '\u4e00' <= ch <= '\u9fff')


def en_len(en):
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9.'’\-]*", en))


def flag_zh(c):
    return '太快' if c > 5.5 else ('偏紧' if c > 4.8 else '')


def flag_en(w):
    return '太快' if w > 3.0 else ('偏紧' if w > 2.7 else '')


rows, cursor = [], 0
for s in SHOTS:
    frames = rnd(s['dur'] * FPS)
    cues = ORIG[s['id']] if V.get(s['id'], KEEP) == KEEP else V[s['id']]
    if cues:
        total = frames - LEAD_IN - TAIL
        weights = [len(list(zh)) + 8 for zh, _ in cues]
        wsum = sum(weights)
        cur = LEAD_IN
        for (zh, en), w in zip(cues, weights):
            ln = rnd(total * w / wsum)
            a, b = cursor + cur, cursor + cur + ln
            usable = (b - FADE - a) / FPS
            orig_zh = [o[0] for o in ORIG[s['id']]]
            rows.append({
                'shot': s['id'], 'act': s['act'], 'a': a, 'b': b, 'usable': usable,
                'zh': zh, 'en': en, 'zn': zh_len(zh), 'wn': en_len(en),
                'cps': zh_len(zh) / usable, 'wps': en_len(en) / usable,
                'changed': zh not in orig_zh, 'en_changed': en not in [o[1] for o in ORIG[s['id']]],
            })
            cur += ln
    cursor += frames

os.makedirs(OUT, exist_ok=True)

# ── CSV ──
with open(os.path.join(OUT, '配音时间表.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['序号', '镜头号', '开始(秒)', '开始(时间码)', '建议说完(秒)', '可用时长(秒)', '中文字数', '中文语速(字/秒)', '中文提示',
                '英文词数', '英文语速(词/秒)', '英文提示', '中文配音稿', 'English VO', '中文相比原字幕', '英文相比原字幕'])
    for i, r in enumerate(rows, 1):
        w.writerow([i, r['shot'], f"{r['a'] / FPS:.2f}", tc(r['a']), f"{(r['b'] - FADE) / FPS:.2f}", f"{r['usable']:.2f}",
                    r['zn'], f"{r['cps']:.1f}", flag_zh(r['cps']), r['wn'], f"{r['wps']:.1f}", flag_en(r['wps']),
                    r['zh'], r['en'], '已精简' if r['changed'] else '同原字幕', '已精简' if r['en_changed'] else '同原字幕'])

# ── SRT ──
for lang, name in (('zh', '配音稿-中文.srt'), ('en', '配音稿-英文.srt')):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n') as f:
        for i, r in enumerate(rows, 1):
            f.write(f'{i}\n{tc(r["a"], ",")} --> {tc(r["b"], ",")}\n{r[lang]}\n\n')


# ── Markdown 配音稿 ──
def mmss(fr):
    s = fr / FPS
    return f'{int(s // 60)}:{s % 60:05.2f}'


for lang, title, name, flagf, unit in (
        ('zh', '配音稿（中文）', '配音稿-中文.md', lambda r: flag_zh(r['cps']), 'cps'),
        ('en', 'Voice-over script (English)', '配音稿-英文.md', lambda r: flag_en(r['wps']), 'wps')):
    out = [f'# 《一棵树的秘密》{title}', '',
           '时间为相对全片开头；“说完”为建议配音结束时间（字幕淡出前 0.33 秒）。' if lang == 'zh'
           else 'Times are from the start of the film. "Finish by" is the latest comfortable end for the line.', '',
           '| # | 开始 | 说完 | 配音 | 语速 | 提示 |' if lang == 'zh' else '| # | Start | Finish by | Line | Pace | Note |',
           '|---|---|---|---|---|---|']
    for i, r in enumerate(rows, 1):
        pace = f"{r['cps']:.1f} 字/秒" if lang == 'zh' else f"{r['wps']:.1f} w/s"
        mark = flagf(r)
        out.append(f"| {i} | {mmss(r['a'])} | {mmss(r['b'] - FADE)} | {r[lang]} | {pace} | {mark} |")
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write('\n'.join(out) + '\n')

# ── 汇总 ──
bad_zh = [(i, r) for i, r in enumerate(rows, 1) if r['cps'] > 5.5]
tight_zh = [(i, r) for i, r in enumerate(rows, 1) if 4.8 < r['cps'] <= 5.5]
bad_en = [(i, r) for i, r in enumerate(rows, 1) if r['wps'] > 3.0]
tight_en = [(i, r) for i, r in enumerate(rows, 1) if 2.7 < r['wps'] <= 3.0]
print(json.dumps({'cues': len(rows), 'zh_too_fast': len(bad_zh), 'zh_tight': len(tight_zh), 'en_too_fast': len(bad_en), 'en_tight': len(tight_en),
                  'zh_changed': sum(r['changed'] for r in rows), 'en_changed': sum(r['en_changed'] for r in rows)}, ensure_ascii=False))
if '-v' in sys.argv:
    for i, r in enumerate(rows, 1):
        print(f"{i:2d} 镜{str(r['shot']):>4} {mmss(r['a'])}→{mmss(r['b'])} 可用{r['usable']:.2f}s | 中{r['zn']:2d}字 {r['cps']:.1f}{('*' if r['cps'] > 4.8 else ' ')} | 英{r['wn']:2d}词 {r['wps']:.1f}{('*' if r['wps'] > 2.7 else ' ')} | {r['zh']} | {r['en']}")
