import React from 'react';
import {C} from '../theme';
import {GROUND_PATH, LOGO_H, LOGO_TILE_DATA, LOGO_W, TEXT_LEFT_PATH, TEXT_RIGHT_PATH, TRUNK_PATH} from './logoData';

/**
 * 安信地板 Logo 矢量重绘（坐标系与原图一致：1867 × 1347）
 * 所有几何均由 scripts/extract-logo.py 从原图 assets/安信地板 logo-2011.png 识别得到：
 * 46 块地板条（精确位置）、树干、地平弧、红字轮廓。
 * 导出 LOGO_TILES，供第 7 / 26 / 27 镜逐块动画使用。
 */
export {LOGO_W, LOGO_H, TRUNK_PATH, GROUND_PATH};

export type Tile = {
  i: number; // 行（沿长轴方向，从左上到右下）
  j: number; // 行内序号
  idx: number; // 堆叠顺序（自下而上）
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number; // deg
};

/** 原图中所有地板条尺寸、倾角一致（约 132.6 × 107.8，36.87°），这里统一取均值，位置保持实测值 */
const TILE_W = 132.6;
const TILE_H = 107.8;
const TILE_ROT = 36.87;

const buildTiles = (): Tile[] => {
  const sorted = [...LOGO_TILE_DATA].sort((p, q) => q.cy - p.cy || p.cx - q.cx);
  return sorted.map((t, idx) => ({i: t.i, j: t.j, idx, cx: t.cx, cy: t.cy, w: TILE_W, h: TILE_H, rot: TILE_ROT}));
};

export const LOGO_TILES: Tile[] = buildTiles();

export type LogoProps = {
  /** 每块地板条的样式回调：返回 null 表示不渲染 */
  tileStyle?: (t: Tile) => React.SVGProps<SVGGElement> | null;
  tileFill?: string;
  trunkOpacity?: number;
  groundOpacity?: number;
  textOpacity?: number;
  showText?: boolean;
  textColor?: string;
  renderTileContent?: (t: Tile) => React.ReactNode;
};

export const LogoTileRect: React.FC<{t: Tile; fill: string}> = ({t, fill}) => (
  <rect x={-t.w / 2} y={-t.h / 2} width={t.w} height={t.h} fill={fill} />
);

export const AnxinLogoArt: React.FC<LogoProps> = ({
  tileStyle,
  tileFill = C.gold,
  trunkOpacity = 1,
  groundOpacity = 1,
  textOpacity = 1,
  showText = true,
  textColor = C.red,
  renderTileContent,
}) => {
  return (
    <g>
      {LOGO_TILES.map((t) => {
        const extra = tileStyle ? tileStyle(t) : {};
        if (extra === null) return null;
        const {transform: extraTransform, ...rest} = extra as React.SVGProps<SVGGElement>;
        return (
          <g key={t.idx} {...rest}>
            <g transform={`${extraTransform ?? ''} translate(${t.cx} ${t.cy}) rotate(${t.rot})`}>
              <LogoTileRect t={t} fill={tileFill} />
              {renderTileContent ? renderTileContent(t) : null}
            </g>
          </g>
        );
      })}
      <path d={TRUNK_PATH} fill={tileFill} opacity={trunkOpacity} fillRule="evenodd" />
      <path d={GROUND_PATH} fill={tileFill} opacity={groundOpacity} fillRule="evenodd" />
      {showText ? (
        <g opacity={textOpacity} fill={textColor} fillRule="evenodd">
          <path d={TEXT_LEFT_PATH} />
          <path d={TEXT_RIGHT_PATH} />
        </g>
      ) : null}
    </g>
  );
};

/** 便捷：完整 SVG Logo */
export const AnxinLogo: React.FC<LogoProps & {width: number; style?: React.CSSProperties}> = ({width, style, ...rest}) => (
  <svg width={width} height={(width * LOGO_H) / LOGO_W} viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} style={style} overflow="visible">
    <AnxinLogoArt {...rest} />
  </svg>
);
