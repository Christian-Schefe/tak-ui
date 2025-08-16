import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import type { GameUI } from '../../packages/tak-core/ui';
import { Color3, Vector3, type BaseTexture } from '@babylonjs/core';
import { useBeforeRender } from 'react-babylonjs';
import { PBRBox } from './Box';
import { Lerp } from './Objects';

import marbleWhiteColor from '../../assets/textures/marble_white/marble_0008_color_1k.jpg';
import marbleWhiteNormal from '../../assets/textures/marble_white/marble_0008_normal_opengl_1k.png';
import marbleWhiteAO from '../../assets/textures/marble_white/marble_0008_ao_1k.jpg';
import marbleWhiteRoughness from '../../assets/textures/marble_white/marble_0008_roughness_1k.jpg';
import type { Player } from '../../packages/tak-core';
import { getTimeRemaining } from '../../packages/tak-core/game';

const segmentTransforms = [
  { pos: new Vector3(0, 0, 0), horizontal: true, bottom: false },
  { pos: new Vector3(1, 0, -1), horizontal: false, bottom: false },
  { pos: new Vector3(1, 0, -3), horizontal: false, bottom: true },
  { pos: new Vector3(0, 0, -4), horizontal: true, bottom: true },
  { pos: new Vector3(-1, 0, -3), horizontal: false, bottom: true },
  { pos: new Vector3(-1, 0, -1), horizontal: false, bottom: false },
  { pos: new Vector3(0, 0, -2), horizontal: true, bottom: false },
];
const digitToSegments = [
  [true, true, true, true, true, true, false],
  [false, true, true, false, false, false, false],
  [true, true, false, true, true, false, true],
  [true, true, true, true, false, false, true],
  [false, true, true, false, false, true, true],
  [true, false, true, true, false, true, true],
  [true, false, true, true, true, true, true],
  [true, true, true, false, false, false, false],
  [true, true, true, true, true, true, true],
  [true, true, true, true, false, true, true],
];

export const Clock: FC<{
  game: GameUI;
  pos: Vector3;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
  player: Player;
}> = ({ game, pos, cubeTextureRef, player }) => {
  const remaining = getTimeRemaining(game.actualGame, player, new Date()) ?? 0;

  const secondDigit = Math.floor((remaining % 10_000) / 1_000);
  const tenSecondDigit = Math.floor((remaining % 60_000) / 10_000);
  const minuteDigit = Math.floor((remaining % 600_000) / 60_000);
  const tenMinuteDigit = Math.floor((remaining % 3_600_000) / 600_000);

  const currentAnimationState = useMemo(
    () => ({
      segmentExtensions: [
        secondDigit,
        tenSecondDigit,
        minuteDigit,
        tenMinuteDigit,
      ].map((digit) =>
        digitToSegments[digit].map((active) => (active ? 1 : 0) as number),
      ),
    }),
    [secondDigit, tenSecondDigit, minuteDigit, tenMinuteDigit],
  );

  const targetAnimationState = useRef(currentAnimationState);
  useEffect(() => {
    targetAnimationState.current = currentAnimationState;
  }, [currentAnimationState]);

  const [actualAnimationState, setActualAnimationState] = useState(
    targetAnimationState.current,
  );

  useBeforeRender(() => {
    setActualAnimationState((prev) => {
      return {
        segmentExtensions: prev.segmentExtensions.map((dig, i) =>
          dig.map((seg, j) =>
            Lerp(
              seg,
              targetAnimationState.current.segmentExtensions[i][j],
              0.3,
            ),
          ),
        ),
      };
    });
  });

  const size = 0.3;
  const thickness = 0.05;
  const segmentHeight = 0.1;

  return (
    <PBRBox
      name="tile"
      width={8 * size}
      height={segmentHeight * 2}
      depth={3 * size}
      position={pos}
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={marbleWhiteNormal}
      colorTextureUrl={marbleWhiteColor}
      aoTextureUrl={marbleWhiteAO}
      roughnessTextureUrl={marbleWhiteRoughness}
      metallic={0.5}
      roughness={0.5}
      specularIntensity={0.05}
      albedoColor={Color3.White()}
    >
      {actualAnimationState.segmentExtensions.map((digit, i) =>
        digit.map((extension, j) => {
          const { pos, horizontal, bottom } = segmentTransforms[j];
          const actualPos = new Vector3(
            pos.x * size * 0.5 - (i - 1.5) * (size * 2),
            extension * segmentHeight + segmentHeight * 0.4,
            (pos.z + 2) * size * 0.5 +
              (!horizontal ? thickness * (bottom ? -0.25 : 0.25) : 0),
          );
          const color = Color3.Lerp(
            Color3.White(),
            Color3.FromHexString('#333333'),
            extension,
          );

          return (
            <PBRBox
              key={`clock-segment-${j}`}
              name="tile"
              width={horizontal ? size - thickness : thickness}
              depth={horizontal ? thickness : size + thickness * 0.5}
              height={segmentHeight}
              position={actualPos}
              cubeTextureRef={cubeTextureRef}
              normalTextureUrl={marbleWhiteNormal}
              colorTextureUrl={marbleWhiteColor}
              aoTextureUrl={marbleWhiteAO}
              roughnessTextureUrl={marbleWhiteRoughness}
              metallic={0.5}
              roughness={0.5}
              specularIntensity={0.05}
              albedoColor={color}
            ></PBRBox>
          );
        }),
      )}
    </PBRBox>
  );
};
