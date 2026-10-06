import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import type {Shot} from '../timeline';

/** 未制作镜头的占位卡（用于整片节奏预览） */
export const Placeholder: React.FC<{shots: Shot[]}> = ({shots}) => {
  const f = useCurrentFrame();
  const s = shots[0];
  const zoom = interpolate(f, [0, s.dur * 30], [1, 1.04]);
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${zoom})`}}>
        <div style={{fontFamily: serif, fontSize: 260, color: C.goldLight, opacity: 0.5, lineHeight: 1}}>
          {String(s.id).padStart(2, '0')}
        </div>
        <div style={{fontFamily: sans, fontSize: 22, letterSpacing: '0.4em', color: C.goldDeep, marginTop: 10}}>
          {s.act}
        </div>
        <div style={{fontFamily: serif, fontSize: 32, color: C.inkSoft, marginTop: 24, maxWidth: 1200, textAlign: 'center', lineHeight: 1.6}}>
          {s.brief}
        </div>
        <div style={{fontFamily: sans, fontSize: 16, letterSpacing: '0.3em', color: C.inkMute, marginTop: 24}}>
          制作中 · {s.dur}s
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
