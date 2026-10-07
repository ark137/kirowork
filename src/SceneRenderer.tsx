import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {FPS} from './theme';
import type {Scene, Shot} from './timeline';
import {Subtitle} from './components/Subtitle';
import {YearTag} from './components/YearTag';
import {Placeholder} from './scenes/Placeholder';
import {Prologue} from './scenes/Prologue';
import {S2Lignin} from './scenes/S2Lignin';
import {S3Forest} from './scenes/S3Forest';
import {H1Fire} from './scenes/H1Fire';
import {H2Canoe} from './scenes/H2Canoe';
import {H3Mortise} from './scenes/H3Mortise';
import {H4Palace} from './scenes/H4Palace';
import {H5Home} from './scenes/H5Home';
import {S4Wenzhou} from './scenes/S4Wenzhou';
import {S5Blueprint} from './scenes/S5Blueprint';
import {S5bInspector} from './scenes/S5bInspector';
import {S6Store} from './scenes/S6Store';
import {S7TreeMark} from './scenes/S7TreeMark';
import {Factory} from './scenes/Factory';
import {S8Amazon} from './scenes/S8Amazon';
import {S9Canopy} from './scenes/S9Canopy';
import {S10Ban} from './scenes/S10Ban';
import {S11Chain} from './scenes/S11Chain';
import {S12Docks} from './scenes/S12Docks';
import {S13Tape} from './scenes/S13Tape';
import {S14Clocks} from './scenes/S14Clocks';
import {S15Fax} from './scenes/S15Fax';
import {SMeet} from './scenes/SMeet';
import {SNameplates} from './scenes/SNameplates';
import {SMill} from './scenes/SMill';
import {SSatellite} from './scenes/SSatellite';
import {S20World} from './scenes/S20World';
import {S21Landmarks} from './scenes/S21Landmarks';
import {S22Return} from './scenes/S22Return';
import {S23Debate} from './scenes/S23Debate';
import {S24Legacy} from './scenes/S24Legacy';
import {S25Books} from './scenes/S25Books';
import {S26Windows} from './scenes/S26Windows';
import {S27Finale} from './scenes/S27Finale';

/** scene key → 画面组件；未登记的场景显示占位卡 */
export const SCENE_COMPONENTS: Record<string, React.FC> = {
  prologue: Prologue,
  s2: S2Lignin,
  s3: S3Forest,
  fire: H1Fire,
  canoe: H2Canoe,
  mortise: H3Mortise,
  palace: H4Palace,
  home: H5Home,
  s4: S4Wenzhou,
  s5: S5Blueprint,
  s5b: S5bInspector,
  s6: S6Store,
  s7: S7TreeMark,
  factory: Factory,
  amazon: S8Amazon,
  canopy: S9Canopy,
  ban: S10Ban,
  chain: S11Chain,
  docks: S12Docks,
  tape: S13Tape,
  clocks: S14Clocks,
  fax: S15Fax,
  meet: SMeet,
  nameplates: SNameplates,
  mill: SMill,
  satellite: SSatellite,
  s20: S20World,
  s21: S21Landmarks,
  s22: S22Return,
  s23: S23Debate,
  s24: S24Legacy,
  s25: S25Books,
  s26: S26Windows,
  s27: S27Finale,
};

const LEAD_IN = 8;
const TAIL = 6;

/** 按字数把一个镜头的时长分配给多句字幕 */
const subWindows = (shot: Shot) => {
  const total = shot.dur * FPS - LEAD_IN - TAIL;
  const weights = shot.subs.map((s) => Array.from(s.zh).length + 8);
  const sum = weights.reduce((a, b) => a + b, 0);
  let cur = LEAD_IN;
  return shot.subs.map((sub, i) => {
    const len = Math.round((total * weights[i]) / sum);
    const w = {sub, from: cur, len};
    cur += len;
    return w;
  });
};

/** 场景画面 + 字幕 + 年份标签 */
export const SceneRenderer: React.FC<{scene: Scene}> = ({scene}) => {
  const Comp = SCENE_COMPONENTS[scene.key];
  let offset = 0;
  return (
    <AbsoluteFill>
      {Comp ? <Comp /> : <Placeholder shots={scene.shots} />}
      {scene.shots.map((shot) => {
        const start = offset;
        offset += shot.dur * FPS;
        return (
          <Sequence key={shot.id} from={start} durationInFrames={shot.dur * FPS} layout="none">
            {shot.year ? (
              <Sequence durationInFrames={shot.dur * FPS} layout="none">
                <YearTag year={shot.year} note={shot.yearNote} tone={shot.subTone} variant={shot.line === 'A' ? 'earth' : shot.line === 'H' ? 'history' : undefined} />
              </Sequence>
            ) : null}
            {subWindows(shot).map((w, i) => (
              <Sequence key={i} from={w.from} durationInFrames={w.len} layout="none">
                <Subtitle sub={w.sub} tone={shot.subTone} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
