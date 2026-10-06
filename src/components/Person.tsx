import React from 'react';

/**
 * 父子扁平矢量人物（依据 assets 中的合影，只保留特征：发型、眼镜、西装配色、领带；不画写实五官）
 * - carl 卢伟光：及肩长发、黑色方框眼镜、灰蓝西装、浅蓝衬衫、灰蓝领带
 * - ben  卢奕开：短黑发、细圆框眼镜、藏青西装、白衬衫、斜纹领带
 * 正面全身：原点在双脚中点，身高 600 单位。
 */
export type Who = 'carl' | 'ben';

export const LOOK = {
  carl: {jacket: '#566A80', jacketDark: '#45576B', shirt: '#AFC2D6', tie: '#6E8196', tieStripe: '#6E8196', hair: '#1D1A18', trousers: '#4A5C70'},
  ben: {jacket: '#22304E', jacketDark: '#18223A', shirt: '#F5F4F0', tie: '#273A63', tieStripe: '#D9E0EA', hair: '#151414', trousers: '#1E2A44'},
};
const SKIN = '#ECCDAE';
const SKIN_SHADE = '#DDB792';

export const Hair: React.FC<{who: Who; back?: boolean}> = ({who, back}) => {
  const c = LOOK[who].hair;
  if (who === 'carl') {
    return back ? (
      // 脑后及肩长发（画在脸后面）
      <path d="M-40,-560 C-46,-610 46,-610 40,-560 L46,-500 C46,-484 34,-478 24,-486 L-24,-486 C-34,-478 -46,-484 -46,-500 Z" fill={c} />
    ) : (
      // 前额：中分、略带波浪地垂向两侧
      <path d="M-33,-552 C-38,-600 38,-600 33,-552 C30,-570 18,-584 2,-582 C-2,-584 -6,-582 -8,-578 C-16,-584 -30,-572 -33,-552 Z M-33,-552 C-36,-536 -36,-520 -40,-506 L-32,-512 C-30,-528 -30,-540 -28,-552 Z M33,-552 C36,-536 36,-520 40,-506 L32,-512 C30,-528 30,-540 28,-552 Z" fill={c} />
    );
  }
  if (back) return null;
  // 短发：顶部蓬松，刘海斜扫
  return (
    <path d="M-32,-556 C-38,-608 32,-614 34,-560 C34,-556 33,-552 31,-550 C28,-566 20,-576 4,-576 C10,-572 12,-570 10,-566 C-2,-574 -20,-570 -28,-556 C-30,-556 -32,-556 -32,-556 Z" fill={c} />
  );
};

export const Glasses: React.FC<{who: Who}> = ({who}) =>
  who === 'carl' ? (
    <g fill="none" stroke="#141414" strokeWidth={3.6} strokeLinejoin="round">
      <rect x={-27} y={-556} width={22} height={14} rx={3} />
      <rect x={5} y={-556} width={22} height={14} rx={3} />
      <path d="M-5,-551 Q0,-554 5,-551" />
      <path d="M-27,-552 L-31,-553 M27,-552 L31,-553" />
    </g>
  ) : (
    <g fill="none" stroke="#2B2B2B" strokeWidth={2.2}>
      <circle cx={-15} cy={-549} r={11} />
      <circle cx={15} cy={-549} r={11} />
      <path d="M-4,-551 Q0,-554 4,-551" />
      <path d="M-26,-551 L-31,-552 M26,-551 L31,-552" />
    </g>
  );

const Head: React.FC<{who: Who}> = ({who}) => (
  <g>
    <Hair who={who} back />
    {/* 颈 */}
    <path d="M-11,-520 L-11,-488 L11,-488 L11,-520 Z" fill={SKIN_SHADE} />
    {/* 耳 */}
    <ellipse cx={-31} cy={-546} rx={5} ry={9} fill={SKIN_SHADE} />
    <ellipse cx={31} cy={-546} rx={5} ry={9} fill={SKIN_SHADE} />
    {/* 脸 */}
    <path d="M-30,-560 C-30,-596 30,-596 30,-560 C30,-532 20,-514 0,-510 C-20,-514 -30,-532 -30,-560 Z" fill={SKIN} />
    {/* 鼻影（唯一的面部暗示） */}
    <path d="M1,-544 L-3,-530 L2,-529" fill="none" stroke={SKIN_SHADE} strokeWidth={2} strokeLinecap="round" />
    <Hair who={who} />
    <Glasses who={who} />
  </g>
);

const Tie: React.FC<{who: Who; id: string}> = ({who, id}) => {
  const L = LOOK[who];
  return (
    <g>
      {who === 'ben' ? (
        <defs>
          <pattern id={id} width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <rect width={9} height={9} fill={L.tie} />
            <rect width={3} height={9} fill={L.tieStripe} />
          </pattern>
        </defs>
      ) : null}
      <path d="M-8,-488 L8,-488 L5,-476 L-5,-476 Z" fill={who === 'ben' ? `url(#${id})` : L.tie} />
      <path d="M-5,-476 L5,-476 L12,-380 L0,-364 L-12,-380 Z" fill={who === 'ben' ? `url(#${id})` : L.tie} />
    </g>
  );
};

/** 上半身（含头）。arms: 'side' 垂手 / 'crossed' 抱臂（与合影一致） / 'handle' 右手握行李箱拉杆 */
export const Torso: React.FC<{who: Who; arms?: 'side' | 'crossed' | 'handle'; id: string}> = ({who, arms = 'side', id}) => {
  const L = LOOK[who];
  return (
    <g>
      {/* 西装主体 */}
      <path d="M-80,-470 C-70,-484 -40,-490 -14,-492 L14,-492 C40,-490 70,-484 80,-470 L84,-262 L-84,-262 Z" fill={L.jacket} />
      {/* 衬衫 V 区 */}
      <path d="M-15,-492 L15,-492 L0,-376 Z" fill={L.shirt} />
      <Tie who={who} id={id} />
      {/* 翻领 */}
      <path d="M-15,-492 L-36,-470 L-26,-440 L-34,-430 L-2,-372 L0,-376 Z" fill={L.jacketDark} />
      <path d="M15,-492 L36,-470 L26,-440 L34,-430 L2,-372 L0,-376 Z" fill={L.jacketDark} />
      {/* 门襟与纽扣 */}
      <path d="M0,-376 L0,-262" stroke={L.jacketDark} strokeWidth={2} />
      <circle cx={4} cy={-336} r={3} fill={L.jacketDark} />
      <circle cx={4} cy={-300} r={3} fill={L.jacketDark} />
      {arms === 'crossed' ? (
        <g stroke={L.jacketDark} strokeWidth={2.4} strokeLinejoin="round">
          {/* 上臂 */}
          <path d="M-80,-470 C-100,-440 -106,-400 -102,-352 L-74,-346 C-74,-392 -70,-430 -58,-452 Z" fill={L.jacket} />
          <path d="M80,-470 C100,-440 106,-400 102,-352 L74,-346 C74,-392 70,-430 58,-452 Z" fill={L.jacket} />
          {/* 在下的前臂（右臂 → 向左，手藏在左上臂下） */}
          <path d="M100,-376 C40,-386 -30,-386 -80,-376 L-82,-348 C-30,-356 40,-354 102,-348 Z" fill={L.jacketDark} />
          <path d="M-82,-372 C-92,-372 -96,-362 -94,-354 L-82,-350 Z" fill={SKIN} stroke="none" />
          {/* 在上的前臂（左臂 → 向右，手搭在右上臂上） */}
          <path d="M-102,-368 C-50,-404 16,-408 70,-400 L72,-370 C18,-376 -50,-372 -100,-340 Z" fill={L.jacket} />
          <path d="M70,-400 L72,-370 L82,-370 L80,-400 Z" fill={L.shirt} stroke="none" />
          <path d="M80,-401 C96,-404 104,-392 102,-380 C100,-370 90,-366 82,-370 Z" fill={SKIN} stroke={SKIN_SHADE} strokeWidth={1.4} />
        </g>
      ) : (
        <g>
          <path d="M-80,-470 C-96,-420 -100,-340 -98,-270 L-74,-268 C-76,-340 -70,-410 -58,-452 Z" fill={L.jacket} />
          <path d="M-98,-272 L-74,-270 L-76,-258 L-98,-260 Z" fill={L.shirt} />
          <ellipse cx={-87} cy={-246} rx={11} ry={14} fill={SKIN} />
          {arms === 'handle' ? (
            <g>
              <path d="M80,-470 C98,-430 108,-360 112,-300 L88,-294 C84,-350 74,-410 58,-452 Z" fill={L.jacket} />
              <path d="M112,-302 L88,-296 L90,-284 L114,-290 Z" fill={L.shirt} />
              <ellipse cx={103} cy={-274} rx={12} ry={14} fill={SKIN} />
            </g>
          ) : (
            <g>
              <path d="M80,-470 C96,-420 100,-340 98,-270 L74,-268 C76,-340 70,-410 58,-452 Z" fill={L.jacket} />
              <path d="M98,-272 L74,-270 L76,-258 L98,-260 Z" fill={L.shirt} />
              <ellipse cx={87} cy={-246} rx={11} ry={14} fill={SKIN} />
            </g>
          )}
        </g>
      )}
      <Head who={who} />
    </g>
  );
};

/** 正面全身；walk 为步态相位（弧度），0 表示站立 */
export const Person: React.FC<{who: Who; arms?: 'side' | 'crossed' | 'handle'; walk?: number; id: string}> = ({who, arms = 'side', walk = 0, id}) => {
  const L = LOOK[who];
  const lift = (p: number) => Math.max(0, Math.sin(p)) * 14;
  const la = walk ? lift(walk) : 0;
  const ra = walk ? lift(walk + Math.PI) : 0;
  return (
    <g>
      {/* 腿 */}
      <path d={`M-62,-266 L-4,-266 L-8,${-14 - la} L-46,${-14 - la} Z`} fill={L.trousers} />
      <path d={`M62,-266 L4,-266 L8,${-14 - ra} L46,${-14 - ra} Z`} fill={L.trousers} />
      <path d={`M-50,${-16 - la} L-6,${-16 - la} L-4,${-2 - la} C-20,${2 - la} -44,${2 - la} -52,${-4 - la} Z`} fill="#1A1714" />
      <path d={`M50,${-16 - ra} L6,${-16 - ra} L4,${-2 - ra} C20,${2 - ra} 44,${2 - ra} 52,${-4 - ra} Z`} fill="#1A1714" />
      <Torso who={who} arms={arms} id={id} />
    </g>
  );
};

/** 侧面剪影（会议桌用），面朝右；mirror 时面朝左 */
export const ProfileSilhouette: React.FC<{who: Who; color: string; glint?: string}> = ({who, color, glint = '#F7D47A'}) => (
  <g fill={color}>
    {/* 躯干（坐姿上半身） */}
    <path d="M-120,0 L-112,-120 C-104,-170 -70,-186 -30,-190 L30,-190 C72,-184 96,-160 104,-120 L112,0 Z" />
    {/* 颈 */}
    <path d="M-20,-230 L-20,-180 L20,-180 L20,-230 Z" />
    {/* 头：后脑 + 额 + 鼻 + 下巴 */}
    <path d="M-44,-262 C-46,-306 -6,-326 26,-314 C48,-306 56,-286 56,-270 L66,-252 L56,-246 L58,-232 L52,-226 L54,-214 C46,-204 30,-202 14,-206 L-18,-210 C-36,-222 -44,-240 -44,-262 Z" />
    {who === 'carl' ? (
      // 及肩长发
      <path d="M-48,-264 C-54,-322 30,-336 48,-296 C40,-300 30,-298 24,-292 C4,-292 -8,-280 -12,-258 L-16,-196 C-30,-186 -50,-190 -58,-204 C-56,-226 -50,-246 -48,-264 Z" />
    ) : (
      // 短发
      <path d="M-46,-262 C-52,-322 34,-338 52,-296 C42,-298 34,-296 28,-290 C10,-294 -10,-286 -18,-266 L-26,-238 C-38,-236 -44,-246 -46,-262 Z" />
    )}
    {/* 眼镜反光：方框 / 圆框 */}
    {who === 'carl' ? (
      <g fill="none" stroke={glint} strokeWidth={3}>
        <rect x={34} y={-272} width={18} height={11} rx={2} />
        <path d="M34,-268 L6,-272" />
      </g>
    ) : (
      <g fill="none" stroke={glint} strokeWidth={2.4}>
        <circle cx={43} cy={-266} r={8} />
        <path d="M35,-268 L6,-272" />
      </g>
    )}
  </g>
);
