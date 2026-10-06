import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper} from './components/Paper';
import {Person, ProfileSilhouette, Torso} from './components/Person';
import {W, H} from './theme';

/** 人物设定检查页（不进入正片） */
export const PersonSheet: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <g transform="translate(260 980) scale(1.4)"><Person who="carl" id="t1" /></g>
      <g transform="translate(560 980) scale(1.4)"><Person who="ben" arms="handle" walk={1} id="t2" /></g>
      <g transform="translate(900 1300) scale(1.7)"><Torso who="carl" arms="crossed" id="t3" /></g>
      <g transform="translate(1180 1300) scale(1.7)"><Torso who="ben" arms="crossed" id="t4" /></g>
      <g transform="translate(1500 700) scale(1.2)"><ProfileSilhouette who="carl" color="#3A3430" /></g>
      <g transform="translate(1760 700) scale(-1.2 1.2)"><ProfileSilhouette who="ben" color="#3A3430" /></g>
    </svg>
  </AbsoluteFill>
);
