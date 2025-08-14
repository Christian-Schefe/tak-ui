import {
  Color3,
  CubeTexture,
  Mesh,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { useEffect, useRef, useState, type FC } from 'react';
import type { Coord } from '../../packages/tak-core';
import type { GameUI, UIPiece } from '../../packages/tak-core/ui';
import { useBeforeRender, useClick, useHover } from 'react-babylonjs';
import woodColor from '../../assets/textures/wood_0066/wood_0066_color_1k.jpg';
import woodNormal from '../../assets/textures/wood_0066/wood_0066_normal_opengl_1k.png';
import woodAO from '../../assets/textures/wood_0066/wood_0066_ao_1k.jpg';
import woodRoughness from '../../assets/textures/wood_0066/wood_0066_roughness_1k.jpg';

import tileColor from '../../assets/textures/tiles/tiles_color.jpg';
import tileNormal from '../../assets/textures/tiles/tiles_normal.png';
import tileAO from '../../assets/textures/tiles/tiles_ao.jpg';
import tileRoughness from '../../assets/textures/tiles/tiles_roughness.jpg';

import marbleBlackColor from '../../assets/textures/marble_black/marble_0007_color_1k.jpg';
import marbleBlackNormal from '../../assets/textures/marble_black/marble_0007_normal_opengl_1k.png';
import marbleBlackAO from '../../assets/textures/marble_black/marble_0007_ao_1k.jpg';
import marbleBlackRoughness from '../../assets/textures/marble_black/marble_0007_roughness_1k.jpg';

import marbleWhiteColor from '../../assets/textures/marble_white/marble_0008_color_1k.jpg';
import marbleWhiteNormal from '../../assets/textures/marble_white/marble_0008_normal_opengl_1k.png';
import marbleWhiteAO from '../../assets/textures/marble_white/marble_0008_ao_1k.jpg';
import marbleWhiteRoughness from '../../assets/textures/marble_white/marble_0008_roughness_1k.jpg';

export const Board: FC<{
  size: number;
  cubeTextureRef: React.RefObject<CubeTexture | undefined>;
}> = ({ size, cubeTextureRef }) => {
  return (
    <box
      name="board"
      width={size + 0.5}
      depth={size + 0.5}
      height={0.2}
      position={new Vector3(size / 2, -0.1, size / 2)}
      receiveShadows
    >
      <pbrMaterial
        name="material"
        reflectionTexture={cubeTextureRef.current}
        environmentIntensity={1}
        specularIntensity={0.05}
        albedoColor={Color3.FromHexString('#c0c0c0')}
        metallic={1}
        roughness={0}
      >
        <texture url={tileNormal} assignTo="bumpTexture" />
        <texture url={tileColor} assignTo="albedoTexture" />
        <texture url={tileAO} assignTo="ambientTexture" />
        <texture url={tileRoughness} assignTo="baseDiffuseRoughnessTexture" />
      </pbrMaterial>
    </box>
  );
};

export const Tile: FC<{
  game: GameUI;
  pos: Coord;
  onClick: () => void;
  cubeTextureRef: React.RefObject<CubeTexture | undefined>;
}> = ({ game, pos, onClick, cubeTextureRef }) => {
  const isEven = (num: number) => num % 2 === 0;
  const [isHover, setIsHover] = useState(false);
  const data = game.tiles[pos.y][pos.x];
  const boxRef = useRef<Mesh>(null);
  useHover(
    () => setIsHover(true),
    () => setIsHover(false),
    boxRef,
  );
  const isBeingHovered = isHover && data.hoverable;
  const normalColor = isEven(pos.x + pos.y)
    ? isBeingHovered
      ? Color3.FromHexString('#CCCCCC')
      : Color3.FromHexString('#888888')
    : isBeingHovered
      ? Color3.FromHexString('#AAAAAA')
      : Color3.FromHexString('#666666');

  const selectableColor = isEven(pos.x + pos.y)
    ? isBeingHovered
      ? Color3.FromHexString('#AAAAFF')
      : Color3.FromHexString('#9999DD')
    : isBeingHovered
      ? Color3.FromHexString('#88AAFF')
      : Color3.FromHexString('#6699DD');

  const color = data.selectable ? selectableColor : normalColor;
  const targetColor = useRef(color);
  useEffect(() => {
    targetColor.current = color;
  }, [color]);

  const [actualColor, setActualColor] = useState(color);

  useBeforeRender(() => {
    setActualColor((prev) => Color3.Lerp(prev, targetColor.current, 0.3));
  });

  const curOnClick = useRef<() => void>(onClick);
  useEffect(() => {
    curOnClick.current = onClick;
  }, [onClick]);

  useClick(() => {
    console.log('Tile clicked:', pos);
    curOnClick.current();
  }, boxRef);

  const textureScale = 1 / game.actualGame.board.size;
  const uOffset = pos.x * textureScale;
  const vOffset = pos.y * textureScale;

  return (
    <box
      name="tile"
      ref={boxRef}
      width={1}
      depth={1}
      height={0.1}
      position={new Vector3(pos.x + 0.5, 0.05, pos.y + 0.5)}
      receiveShadows
    >
      <pbrMaterial
        name="material"
        reflectionTexture={cubeTextureRef.current}
        environmentIntensity={1}
        specularIntensity={0.05}
        albedoColor={actualColor}
        metallic={0.5}
        roughness={0.2}
      >
        <texture
          url={marbleWhiteNormal}
          assignTo="bumpTexture"
          uScale={textureScale}
          vScale={textureScale}
          uOffset={uOffset}
          vOffset={vOffset}
        />
        <texture
          url={marbleWhiteColor}
          assignTo="albedoTexture"
          uScale={textureScale}
          vScale={textureScale}
          uOffset={uOffset}
          vOffset={vOffset}
        />
        <texture
          url={marbleWhiteAO}
          assignTo="ambientTexture"
          uScale={textureScale}
          vScale={textureScale}
          uOffset={uOffset}
          vOffset={vOffset}
        />
        <texture
          url={marbleWhiteRoughness}
          assignTo="baseDiffuseRoughnessTexture"
          uScale={textureScale}
          vScale={textureScale}
          uOffset={uOffset}
          vOffset={vOffset}
        />
      </pbrMaterial>
    </box>
  );
};

export const Piece: FC<{
  game: GameUI;
  id: number;
  cubeTextureRef: React.RefObject<CubeTexture | undefined>;
}> = ({ game, id, cubeTextureRef }) => {
  const data = game.pieces.get(id)!;

  const curData = useRef(data);
  useEffect(() => {
    curData.current = data;
  }, [data]);

  const computeTargetPos = (data: UIPiece) => {
    let height = (data.height + 1 + (data.isFloating ? 2 : 0)) * 0.1;
    if (data.variant === 'flat') {
      height += 0.05;
    } else if (data.variant === 'standing') {
      height += 0.25;
    } else {
      height += 0.25;
    }
    return new Vector3(data.pos.x + 0.5, height, data.pos.y + 0.5);
  };

  const computeTargetRotation = (data: UIPiece) => {
    if (data.variant === 'flat') {
      return Quaternion.FromEulerAngles(0, 0, 0);
    } else if (data.variant === 'standing') {
      return Quaternion.FromEulerAngles(Math.PI / 2, Math.PI / 4, 0);
    } else {
      return Quaternion.FromEulerAngles(0, 0, 0);
    }
  };

  const [actualTransform, setActualTransform] = useState({
    pos: computeTargetPos(data),
    rot: computeTargetRotation(data),
    scale: new Vector3(0, 0, 0),
  });

  useBeforeRender(() => {
    const targetPos = computeTargetPos(curData.current);
    const targetRot = computeTargetRotation(curData.current);
    setActualTransform((prev) => ({
      pos: Vector3.Lerp(prev.pos, targetPos, 0.15).add(
        targetPos
          .subtract(prev.pos)
          .normalize()
          .scale(Math.min(Vector3.Distance(targetPos, prev.pos), 0.03)),
      ),
      rot: Quaternion.Slerp(prev.rot, targetRot, 0.15),
      scale: Vector3.Lerp(prev.scale, new Vector3(1, 1, 1), 0.25),
    }));
  });

  const colorTextureUrl =
    data.player === 'white' ? marbleWhiteColor : marbleBlackColor;
  const normalTextureUrl =
    data.player === 'white' ? marbleWhiteNormal : marbleBlackNormal;
  const aoTextureUrl = data.player === 'white' ? marbleWhiteAO : marbleBlackAO;
  const roughnessTextureUrl =
    data.player === 'white' ? marbleWhiteRoughness : marbleBlackRoughness;

  const material = (
    <pbrMaterial
      name="material"
      reflectionTexture={cubeTextureRef.current}
      environmentIntensity={1}
      specularIntensity={0.05}
      albedoColor={Color3.White()}
      metallic={0.2}
      roughness={0.5}
    >
      <texture
        url={normalTextureUrl}
        assignTo="bumpTexture"
        uScale={0.2}
        vScale={0.2}
      />
      <texture
        url={colorTextureUrl}
        assignTo="albedoTexture"
        uScale={0.2}
        vScale={0.2}
      />
      <texture
        url={aoTextureUrl}
        assignTo="ambientTexture"
        uScale={0.2}
        vScale={0.2}
      />
      <texture
        url={roughnessTextureUrl}
        assignTo="baseDiffuseRoughnessTexture"
        uScale={0.2}
        vScale={0.2}
      />
    </pbrMaterial>
  );

  return data.variant === 'capstone' ? (
    <cylinder
      name="piece"
      height={0.5}
      diameter={0.4}
      position={actualTransform.pos}
      rotationQuaternion={actualTransform.rot}
      scaling={actualTransform.scale}
      receiveShadows
      isPickable={false}
    >
      {material}
    </cylinder>
  ) : (
    <box
      name="piece"
      width={0.5}
      depth={0.5}
      height={0.1}
      position={actualTransform.pos}
      rotationQuaternion={actualTransform.rot}
      scaling={actualTransform.scale}
      receiveShadows
      isPickable={false}
    >
      {material}
    </box>
  );
};

export const Table: FC<{
  size: number;
  cubeTextureRef: React.RefObject<CubeTexture | undefined>;
}> = ({ size, cubeTextureRef }) => {
  return (
    <box
      name="table"
      width={size + 10}
      depth={size + 5}
      height={2}
      position={new Vector3(size / 2, -1 - 0.2, size / 2)}
      receiveShadows
    >
      <pbrMaterial
        name="material"
        reflectionTexture={cubeTextureRef.current}
        environmentIntensity={1}
        specularIntensity={0.05}
        albedoColor={Color3.White()}
        metallic={0.5}
        roughness={0.2}
      >
        <texture url={woodNormal} assignTo="bumpTexture" />
        <texture url={woodColor} assignTo="albedoTexture" />
        <texture url={woodAO} assignTo="ambientTexture" />
        <texture url={woodRoughness} assignTo="baseDiffuseRoughnessTexture" />
      </pbrMaterial>
    </box>
  );
};
