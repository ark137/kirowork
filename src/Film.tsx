import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {SCENES, TRANSITION} from './timeline';
import {SceneRenderer} from './SceneRenderer';
import {Atmosphere} from './components/Paper';

/**
 * 全片：场景之间交叉淡化。
 * 每个非末场景多渲染 TRANSITION 帧用于重叠，因此总时长 = 剧本时长之和。
 */
export const Film: React.FC = () => {
  const last = SCENES.length - 1;
  const children: React.ReactNode[] = [];
  SCENES.forEach((scene, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s-${scene.key}`} durationInFrames={scene.frames + (i < last ? TRANSITION : 0)}>
        <SceneRenderer scene={scene} />
      </TransitionSeries.Sequence>,
    );
    if (i < last) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${scene.key}`}
          presentation={fade()}
          timing={linearTiming({durationInFrames: TRANSITION})}
        />,
      );
    }
  });
  return (
    <AbsoluteFill style={{background: '#F3EADA'}}>
      <TransitionSeries>{children}</TransitionSeries>
      <Atmosphere />
      {/* 全片音效轨（无音乐），由 scripts/make-soundtrack.py 生成 */}
      <Html5Audio src={staticFile('sfx/soundtrack.mp3')} />
    </AbsoluteFill>
  );
};
