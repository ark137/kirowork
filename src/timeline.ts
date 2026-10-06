import {FPS} from './theme';

export type Sub = {zh: string; en: string};

export type Shot = {
  id: number;
  /** 非剧本编号镜头的显示标签（如标题卡 'T'） */
  label?: string;
  /** 秒 */
  dur: number;
  act: string;
  line: 'A' | 'B' | 'AB' | '—';
  /** 左上角年份标签 */
  year?: string;
  yearNote?: string;
  /** 镜头画面说明（占位卡用） */
  brief: string;
  subs: Sub[];
  /** 同一 scene 的连续镜头共用一个连续渲染组件 */
  scene: string;
  /** 字幕配色：亮底用墨色，暗底用浅色 */
  subTone?: 'ink' | 'light';
};

export const SHOTS: Shot[] = [
  // ───────── 序章 ─────────
  {id: 0, dur: 5, act: '序章', line: '—', scene: 'prologue', brief: '一个金色圆点，年轮一圈圈向外长，圈上闪过数字',
    subs: [{zh: '一棵树，要长多少年？', en: 'How many years does it take to grow a tree?'}]},
  {id: 1, dur: 4, act: '序章', line: '—', scene: 'prologue', brief: '年轮继续扩大，化作地平线上的落日，一个人的剪影浮现',
    subs: [{zh: '一个人，又要走多远？', en: 'And how far must a man walk?'}]},
  {id: 1.5, label: 'T', dur: 4, act: '片名', line: '—', scene: 'prologue',
    brief: '标题卡：年轮落日前，主标题《一棵树的秘密》落笔显现，副标题“安信地板的前世今生”', subs: []},

  // ───────── 第一幕：木的诞生 ─────────
  {id: 2, dur: 7, act: '第一幕 · 木的诞生', line: 'A', year: '约 4 亿年前', yearNote: 'DEVONIAN', scene: 's2',
    brief: '荒芜大地，苔藓与矮小蕨类；推进到细胞，细胞壁里长出“骨架”',
    subs: [
      {zh: '四亿年前，陆地一片荒芜。', en: 'Four hundred million years ago, the land lay barren.'},
      {zh: '植物学会了造“骨头”，它叫木质素。', en: 'Plants learned to build “bones” — a substance called lignin.'},
    ]},
  {id: 3, dur: 6, act: '第一幕 · 木的诞生', line: 'A', year: '约 3.85 亿年前', yearNote: 'FIRST FORESTS', scene: 's3',
    brief: '第一片森林，第一批真正站直的树，光线穿过树冠',
    subs: [{zh: '于是，地球有了第一片森林。', en: 'And so, the Earth grew its first forest.'}]},

  // ───────── 第二幕：人的起点 ─────────
  {id: 4, dur: 5, act: '第二幕 · 人的起点', line: 'B', year: '1966', yearNote: 'WENZHOU', scene: 's4',
    brief: '温州老街，水墨风，名字浮现',
    subs: [{zh: '1966 年，卢伟光出生在温州一个经商世家。', en: 'In 1966, Carl Lu was born into a merchant family in Wenzhou.'}]},
  {id: 5, dur: 6, act: '第二幕 · 人的起点', line: 'B', year: '大学时期', yearNote: 'DALIAN UNIV. OF TECHNOLOGY', scene: 's5',
    brief: '船的图纸上叠出木纹；一粒种子落在图纸上，长出一道年轮',
    subs: [
      {zh: '他学船舶设计。造船要懂水，更要懂木头。', en: 'He studied naval architecture. To build ships, you must know water — and wood.'},
      {zh: '一颗种子，就这样埋下了。', en: 'A seed was planted.'},
    ]},
  {id: 5.5, label: '5+', dur: 9, act: '第二幕 · 人的起点', line: 'B', scene: 's5b',
    // 年份标签由场景自己绘制：1988 → 1994 随证书滚动
    brief: '验船师：温州渔港，木质渔船；他沿船舷敲击船板验船 → 检验证书一年年盖章叠起（1988→1994）→ 放下检验锤、摘下工作帽 → 手抚船板，船板化作一片木地板',
    subs: [
      {zh: '1988 年毕业后，他考进温州市渔业船舶检验局，成了一名验船师。', en: 'In 1988, after graduating, he passed the exam to become a ship inspector in Wenzhou.'},
      {zh: '六年里，他验过一条又一条木船，摸透了船板里的木头。', en: 'For six years, he inspected boat after boat, coming to know the wood in every plank.'},
      {zh: '1994 年，他辞去公务员的“铁饭碗”，选择了心里更热爱的木头。', en: 'In 1994, he left his secure government post to follow the wood he truly loved.'},
    ]},
  {id: 6, dur: 7, act: '第二幕 · 人的起点', line: 'B', year: '1994.4.8', yearNote: '28 m²', scene: 's6',
    brief: '第一家门店（插画重绘）：黄色门头、红字“安信地板”，镜头缓慢推入',
    subs: [{zh: '1994 年 4 月 8 日，28 平方米的地板店，在温州街头开张了。', en: 'On April 8, 1994, a 28-square-meter flooring shop opened on a Wenzhou street.'}]},
  {id: 7, dur: 8, act: '第二幕 · 人的起点', line: 'B', year: '1994', yearNote: 'THE TREE MARK', scene: 's7',
    brief: '门头上的绿色大树 → 手绘稿 → 金色地板条一块块堆叠成树（企业 VI 升级后的金色 Logo）',
    subs: [
      {zh: '他亲手设计了“安信”商标：地板堆成的大树。', en: 'He designed the Anxin mark himself: a tree built from floorboards.'},
      {zh: '地板来自树木；信赖，要像树一样慢慢长成。', en: 'Floors come from trees. And trust, like a tree, takes time to grow.'},
    ]},

  // ───────── 第三幕：雨林里的树 ─────────
  {id: 8, dur: 6, act: '第三幕 · 雨林里的树', line: 'A', year: '数千万年后', yearNote: 'AMAZONIA', scene: 'amazon',
    brief: '大陆漂移，南美成形，水汽汇聚，雨林俯瞰，云雾升腾',
    subs: [
      {zh: '又过了很久很久，南美的雨水、阳光和河流，', en: 'Ages later, the rain, sun and rivers of South America'},
      {zh: '养出了亚马逊，地球上最大的热带雨林。', en: 'raised the Amazon — the largest rainforest on Earth.'},
    ]},
  {id: 9, dur: 6, act: '第三幕 · 雨林里的树', line: 'A', scene: 'canopy',
    brief: '同一片林子里，树为了争阳光，长成不同的模样',
    subs: [{zh: '为了抢到一缕阳光，树长成了各自的样子。', en: 'Reaching for a ray of light, each tree grew into its own shape.'}]},

  // ───────── 第四幕：断粮 ─────────
  {id: 10, dur: 6, act: '第四幕 · 断粮', line: 'B', year: '1998', yearNote: 'LOGGING BAN', scene: 'ban',
    brief: '一纸公文盖下红章“禁止砍伐”，木材堆渐渐变空',
    subs: [
      {zh: '1998 年，一纸公文，国家禁止砍伐森林资源。', en: 'In 1998, a national decree banned the logging of forests.'},
      {zh: '原料的来路，被一刀斩断。', en: 'His supply of timber was cut off overnight.'},
    ]},
  {id: 11, dur: 6, act: '第四幕 · 断粮', line: 'B', year: '1998', scene: 'chain',
    brief: '一条木材供应链，中间被一只手掐住',
    subs: [{zh: '他想去巴西进口木材，可海外的货源，都攥在中间商手里。', en: 'He wanted to import from Brazil, but middlemen held every overseas source.'}]},
  {id: 12, dur: 6, act: '第四幕 · 断粮', line: 'B', year: '1998', yearNote: 'THE DOCKS', scene: 'docks', subTone: 'light',
    brief: '码头货柜，混在搬运工里的身影翻看包装箱，手电光',
    subs: [{zh: '他混在搬运工中间，一箱一箱地看包装，找一个线索。', en: 'Among the dockworkers, he searched crate after crate for a single clue.'}]},

  // ───────── 第五幕：一纸传真 ─────────
  {id: 13, dur: 6, act: '第五幕 · 一纸传真', line: 'B', year: '1998.7', scene: 'tape',
    brief: '特写：一卷封箱胶带，印着电话和传真号码',
    subs: [{zh: '1998 年 7 月，他在一卷封箱胶带上，找到了一个巴西供应商的电话。', en: 'In July 1998, on a roll of packing tape, he found a Brazilian supplier’s number.'}]},
  {id: 14, dur: 7, act: '第五幕 · 一纸传真', line: 'B', year: '1998', scene: 'clocks',
    brief: '温州与巴西两个钟面，相差 11 小时；电话不停拨出',
    subs: [
      {zh: '他不懂葡萄牙语，对方不懂中文。', en: 'He spoke no Portuguese; they spoke no Chinese.'},
      {zh: '隔着 11 个小时的时差，他一直拨。', en: 'Across an 11-hour time difference, he kept dialing.'},
    ]},
  {id: 15, dur: 6, act: '第五幕 · 一纸传真', line: 'B', year: '1998', scene: 'fax', subTone: 'light',
    brief: '传真纸一张张飞出，没有回音；夜里，传真机忽然亮了',
    subs: [
      {zh: '一个多月后，传真机响了。', en: 'More than a month later, the fax machine rang.'},
      {zh: '巴西供应商路易斯，寄来了报价单。', en: 'Luis, a Brazilian supplier, had sent a quote.'},
    ]},

  // ───────── 第六幕：相遇 ─────────
  {id: 16, dur: 8, act: '第六幕 · 相遇', line: 'AB', year: '1999', yearNote: 'AMAZONIA', scene: 'meet',
    brief: '雨林深处，一个人手扶巨树；年轮与时间轴合并',
    subs: [{zh: '四亿年长出的树，等来了一个找它的人。', en: 'A tree four hundred million years in the making met the man who came looking for it.'}]},
  {id: 17, dur: 5, act: '第六幕 · 相遇', line: 'AB', year: '1999', scene: 'nameplates',
    brief: '四张树种名牌：Ipe 重蚁木、Cumaru 二翅豆、Garapa 铁苏木、Balsamo 香脂木豆',
    subs: [{zh: '他在雨林里，找到了最适合的木头。', en: 'In the rainforest, he found the perfect wood.'}]},
  {id: 18, dur: 9, act: '第六幕 · 相遇', line: 'B', year: '1999 起', yearNote: 'SATELLITE ROTATION', scene: 'satellite',
    brief: '卫星遥感视角，林区分成 25 块，一块采伐，一块重新种上',
    subs: [
      {zh: '卫星遥感把林区分成 25 块，每年只采一块，采完就种。', en: 'Satellites divide the forest into 25 plots. One is harvested each year, then replanted.'},
      {zh: '25 年一个轮回，森林生生不息。', en: 'A 25-year cycle — and the forest lives on.'},
    ]},

  // ───────── 第七幕：走出去 ─────────
  {id: 19, dur: 5, act: '第七幕 · 走出去', line: 'B', year: '1999', yearNote: 'QINGPU, SHANGHAI', scene: 'factory',
    brief: '卫星格网淡出，原木运抵上海青浦；厂房一跨一跨拔地而起，烟囱冒烟，金色厂牌亮起——根，先扎在上海',
    subs: [{zh: '1999 年，木头有了着落，他在上海青浦建起了自己的工厂。', en: 'In 1999, with timber secured, he built his own factory in Qingpu, Shanghai.'}]},
  {id: 20, dur: 8, act: '第七幕 · 走出去', line: 'B', year: '2004–2006', scene: 's20',
    brief: '时间轴：拉美四国；收购美国 ARK FLOORS；凯雷注资 5000 万美金；投资非洲木材',
    subs: [
      {zh: '从温州到美洲，再到非洲。', en: 'From Wenzhou to the Americas, and on to Africa,'},
      {zh: '安信把根扎向更远的地方。', en: 'Anxin sent its roots ever farther.'},
    ]},
  {id: 21, dur: 8, act: '第七幕 · 走出去', line: 'B', year: '2007–2010', scene: 's21',
    brief: '奥运场馆、苏州吴江工厂、世博中心、整木定制，逐一点亮（抽象建筑线稿）',
    subs: [
      {zh: '奥运场馆、上海世博中心、整木定制。', en: 'Olympic venues, the Shanghai Expo Center, bespoke whole-wood interiors —'},
      {zh: '它成了很多重要地方的脚下。', en: 'it became the ground beneath many landmark places.'},
    ]},

  // ───────── 第八幕：传承 ─────────
  {id: 22, dur: 7, act: '第八幕 · 传承', line: 'B', year: '2017', scene: 's22',
    brief: '年轻人从机场走出，行李箱贴着美国标签；身后长出小树苗',
    subs: [{zh: '卢伟光的大儿子卢奕开，留学美国十年，2017 年回到了公司。', en: 'After ten years of study in the U.S., his elder son Ben Lu joined the company in 2017.'}]},
  {id: 23, dur: 8, act: '第八幕 · 传承', line: 'B', scene: 's23',
    brief: '会议桌两端两个剪影，对话气泡变成两条缠绕的枝干',
    subs: [
      {zh: '父子俩在会议上常常争得面红耳赤。', en: 'Father and son often argued heatedly in meetings.'},
      {zh: '父亲说：只要儿子说得对，就该有心胸接受，否则，企业成不了百年企业。', en: '“If my son is right, I must have the heart to accept it — or we will never last a hundred years.”'},
    ]},
  {id: 24, dur: 9, act: '第八幕 · 传承', line: 'B', year: '2022–2025', scene: 's24',
    brief: '2022 接任总裁；2023 “树木的秘密”展厅；2025 上海旗舰店焕新；两条枝干合成一棵树',
    subs: [
      {zh: '2022 年，卢奕开出任总裁。', en: 'In 2022, Ben Lu became president.'},
      {zh: '从冲突到理解，互相依靠，互为铠甲。', en: 'From conflict to understanding — each other’s support, each other’s armor.'},
    ]},

  // ───────── 尾声 ─────────
  {id: 25, dur: 7, act: '尾声', line: '—', scene: 's25',
    brief: '书页翻动：《读者》、MBA 教材、国家统编中学生教材、浙江省初中德育课程教材、《风云浙商-2》',
    subs: [{zh: '信任，超越任何语言。', en: 'Trust transcends every language.'}]},
  {id: 26, dur: 10, act: '尾声', line: '—', scene: 's26',
    brief: '放大的金色 Logo，每块地板条变成一扇小窗：客厅、书房、儿童房、厨房与笑脸',
    subs: [{zh: '让每个人都拥有一个更温暖、更健康的生活空间。', en: 'A warmer, healthier living space — for everyone.'}]},
  {id: 27, dur: 8, act: '尾声', line: '—', scene: 's27',
    brief: '年轮长回金色大树，“安信地板”浮现，收束在 Logo',
    subs: [
      {zh: '安信地板。', en: 'Anxin Flooring.'},
      {zh: '树的秘密，是时间；人的秘密，是一个信字。', en: 'The secret of a tree is time. The secret of a man is a single word: trust.'},
    ]},
];

export type Scene = {key: string; shots: Shot[]; frames: number; startFrame: number};

/** 把连续同 scene 的镜头合并成渲染单元 */
export const buildScenes = (): Scene[] => {
  const scenes: Scene[] = [];
  let cursor = 0;
  for (const s of SHOTS) {
    const frames = s.dur * FPS;
    const last = scenes[scenes.length - 1];
    if (last && last.key === s.scene) {
      last.shots.push(s);
      last.frames += frames;
    } else {
      scenes.push({key: s.scene, shots: [s], frames, startFrame: cursor});
    }
    cursor += frames;
  }
  return scenes;
};

export const SCENES = buildScenes();
export const TOTAL_FRAMES = SHOTS.reduce((a, s) => a + s.dur * FPS, 0);
/** 场景间交叉淡化帧数 */
export const TRANSITION = 14;
