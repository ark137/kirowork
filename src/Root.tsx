import React from 'react';
import {AbsoluteFill, Composition, Folder} from 'remotion';
import {Film} from './Film';
import {LogoCompare, LogoSheet} from './LogoSheet';
import {SceneRenderer, SCENE_COMPONENTS} from './SceneRenderer';
import {Atmosphere} from './components/Paper';
import {SCENES, TOTAL_FRAMES} from './timeline';
import {FPS, H, W} from './theme';
import {ensureFonts} from './fonts';

ensureFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="LogoCompare" component={LogoCompare} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="LogoSheet" component={LogoSheet} durationInFrames={100} fps={FPS} width={W} height={H} />
    <Folder name="Scenes">
      {SCENES.filter((s) => SCENE_COMPONENTS[s.key]).map((scene) => (
        <Composition
          key={scene.key}
          id={`Scene-${scene.key}`}
          component={() => (
            <AbsoluteFill>
              <SceneRenderer scene={scene} />
              <Atmosphere />
            </AbsoluteFill>
          )}
          durationInFrames={scene.frames}
          fps={FPS}
          width={W}
          height={H}
        />
      ))}
    </Folder>
  </>
);
