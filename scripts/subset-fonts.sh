#!/usr/bin/env bash
# 把思源宋体 / 思源黑体子集化为片中实际用到的字符（woff2），大幅缩短渲染加载时间。
# 源字体（OFL）：https://github.com/google/fonts/tree/main/ofl/notoserifsc 、notosanssc
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=${FONT_SRC:-/tmp/fonts}
mkdir -p "$SRC" public/fonts
[ -f "$SRC/serif.ttf" ] || curl -sSL -o "$SRC/serif.ttf" "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
[ -f "$SRC/sans.ttf" ]  || curl -sSL -o "$SRC/sans.ttf"  "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"

# 收集 src 下所有字符 + 常用标点/ASCII
python3 - <<'PY'
import pathlib
chars = set()
for p in pathlib.Path('src').rglob('*.ts*'):
    chars |= set(p.read_text(encoding='utf-8'))
chars |= set(chr(c) for c in range(0x20, 0x7F))
chars |= set('，。、：；！？“”‘’（）《》【】—…·「」年月日')
pathlib.Path('/tmp/fonts/chars.txt').write_text(''.join(sorted(chars)), encoding='utf-8')
print(len(chars), 'glyphs')
PY

for f in serif sans; do
  pyftsubset "$SRC/$f.ttf" --text-file=/tmp/fonts/chars.txt --flavor=woff2 \
    --layout-features='*' --output-file="public/fonts/$f.woff2"
done
ls -la public/fonts
