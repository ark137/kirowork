# 《一棵树的信》— Remotion + SVG

1920×1080 · 30fps · 241.5s（含 mill 镜与“人与木”五镜）· 音效轨（无音乐）

```bash
npm i
npm run fonts      # 子集化思源宋体/黑体（新增文字后需重跑）
npm run studio     # 预览
npm run render     # 全片 → out/film.mp4
npx remotion render src/index.ts Scene-prologue out/prologue.mp4   # 单场景
python3 scripts/make-soundtrack.py --clip mill   # 单镜音效 → out/mill-sfx.wav（响度与已出成片一致）
python3 scripts/make-soundtrack.py --rework s5b   # 第 5.5 镜改版（9→10.5 秒）的替换音频
python3 scripts/make-soundtrack.py --range fire home   # 连续多镜音效（含两端 14 帧交叉淡化）
npx remotion render src/index.ts Film out/x.mp4 --frames=780-1663 --muted   # 对应的画面区间
```

## 结构
- `src/timeline.ts` — 36 个镜头的时长、年份标签、中英字幕（唯一数据源）
- `src/SceneRenderer.tsx` — 场景注册表；未制作的场景自动显示占位卡
- `src/Film.tsx` — 全片串联（场景间交叉淡化，总时长不变）
- `src/components/` — 宣纸底、字幕、年份标签、年轮、Logo 重绘（`LOGO_TILES` 可逐块动画）、水墨人物
- `src/scenes/` — 各场景画面
