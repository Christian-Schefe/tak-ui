import {
  BaseTexture,
  Color3,
  Mesh,
  Quaternion,
  Vector3,
} from '@babylonjs/core';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import type { Coord, PieceVariant } from '../../packages/tak-core';
import type { GameUI, UIPiece, UITile } from '../../packages/tak-core/ui';
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
import { PBRBox, PBRCylinder } from './Box';

export function Lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export const Table: FC<{
  size: number;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
}> = ({ size, cubeTextureRef }) => {
  return (
    <PBRBox
      name="table"
      width={size + 10}
      height={2}
      depth={size + 5}
      position={new Vector3(size / 2, -1 - 0.2, size / 2)}
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={woodNormal as string}
      colorTextureUrl={woodColor as string}
      aoTextureUrl={woodAO as string}
      roughnessTextureUrl={woodRoughness as string}
      metallic={0.4}
      roughness={0.4}
      specularIntensity={0.05}
    />
  );
};

export const Board: FC<{
  size: number;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
}> = ({ size, cubeTextureRef }) => {
  return (
    <PBRBox
      name="board"
      width={size + 0.5}
      height={0.2}
      depth={size + 0.5}
      position={new Vector3(size / 2, -0.1, size / 2)}
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={tileNormal as string}
      colorTextureUrl={tileColor as string}
      aoTextureUrl={tileAO as string}
      roughnessTextureUrl={tileRoughness as string}
      metallic={1}
      roughness={0}
      specularIntensity={0.05}
      albedoColor={Color3.FromHexString('#c0c0c0')}
    />
  );
};

export const Tile: FC<{
  tile: UITile;
  pos: Coord;
  interactive: boolean;
  onClick: (pos: Coord) => void;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
}> = ({ tile, pos, onClick, cubeTextureRef, interactive }) => {
  const isEven = (pos.x + pos.y) % 2 === 0;
  const [isHover, setIsHover] = useState(false);
  const boxRef = useRef<Mesh>(null);
  useHover(
    () => {
      setIsHover(true);
    },
    () => {
      setIsHover(false);
    },
    boxRef,
  );
  const isBeingHovered = interactive && isHover && tile.hoverable;
  const normalColor = isEven
    ? Color3.FromHexString('#888888')
    : Color3.FromHexString('#666666');

  const currentAnimationState = useMemo(
    () => ({
      emissive:
        (tile.selectable ? 0.05 : 0) +
        (isBeingHovered ? 0.06 : 0) +
        (tile.lastMove ? 0.2 : 0),
      height: isBeingHovered ? 0.015 : 0,
      emissiveColor: tile.lastMove ? Color3.Blue() : Color3.White(),
    }),
    [isBeingHovered, tile.selectable, tile.lastMove],
  );

  const targetAnimationState = useRef(currentAnimationState);
  useEffect(() => {
    targetAnimationState.current = currentAnimationState;
  }, [currentAnimationState]);

  const [actualAnimationState, setActualAnimationState] = useState(
    targetAnimationState.current,
  );

  useBeforeRender(() => {
    setActualAnimationState((prev) => ({
      emissive: Lerp(prev.emissive, targetAnimationState.current.emissive, 0.2),
      height: Lerp(prev.height, targetAnimationState.current.height, 0.15),
      emissiveColor: Color3.Lerp(
        prev.emissiveColor,
        targetAnimationState.current.emissiveColor,
        0.1,
      ),
    }));
  });

  const curOnClick = useRef<() => void>(() => {
    onClick(pos);
  });
  useEffect(() => {
    curOnClick.current = () => {
      onClick(pos);
    };
  }, [onClick, pos]);

  useClick(() => {
    curOnClick.current();
  }, boxRef);

  return (
    <PBRBox
      name="tile"
      width={1}
      height={0.1}
      depth={1}
      position={
        new Vector3(
          pos.x + 0.5,
          0.05 + actualAnimationState.height,
          pos.y + 0.5,
        )
      }
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={marbleWhiteNormal as string}
      colorTextureUrl={marbleWhiteColor as string}
      aoTextureUrl={marbleWhiteAO as string}
      roughnessTextureUrl={marbleWhiteRoughness as string}
      metallic={0.5}
      roughness={0.5}
      specularIntensity={0.05}
      albedoColor={normalColor}
      textureScale={1 / 10}
      emissiveColor={actualAnimationState.emissiveColor}
      emissiveIntensity={actualAnimationState.emissive}
      ref={boxRef}
    />
  );
};

export const Piece: FC<{
  game: GameUI;
  id: number;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
}> = ({ game, id, cubeTextureRef }) => {
  const data = game.pieces[id];

  const curData = useRef(data);
  useEffect(() => {
    curData.current = data;
  }, [data]);

  const pieceSize = 0.6;
  const pieceHeight = pieceSize * 0.2;

  const computeTargetPos = (data: UIPiece) => {
    let height = (data.height + 1 + (data.isFloating ? 2 : 0)) * pieceHeight;
    if (data.variant === 'flat') {
      height += pieceHeight * 0.5;
    } else if (data.variant === 'standing') {
      height += pieceSize * 0.5;
    } else {
      height += pieceSize * 0.5;
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
    const targetScale = curData.current.deleted
      ? new Vector3(0, 0, 0)
      : new Vector3(1, 1, 1);
    setActualTransform((prev) => ({
      pos: Vector3.Lerp(prev.pos, targetPos, 0.15).add(
        targetPos
          .subtract(prev.pos)
          .normalize()
          .scale(Math.min(Vector3.Distance(targetPos, prev.pos), 0.03)),
      ),
      rot: Quaternion.Slerp(prev.rot, targetRot, 0.15),
      scale: Vector3.Lerp(prev.scale, targetScale, 0.25),
    }));
  });

  const colorTextureUrl =
    data.player === 'white'
      ? (marbleWhiteColor as string)
      : (marbleBlackColor as string);
  const normalTextureUrl =
    data.player === 'white'
      ? (marbleWhiteNormal as string)
      : (marbleBlackNormal as string);
  const aoTextureUrl =
    data.player === 'white'
      ? (marbleWhiteAO as string)
      : (marbleBlackAO as string);
  const roughnessTextureUrl =
    data.player === 'white'
      ? (marbleWhiteRoughness as string)
      : (marbleBlackRoughness as string);

  return data.variant === 'capstone' ? (
    <PBRCylinder
      name="piece"
      height={pieceSize}
      diameter={pieceSize * 0.8}
      position={actualTransform.pos}
      rotationQuaternion={actualTransform.rot}
      scaling={actualTransform.scale}
      isPickable={false}
      aoTextureUrl={aoTextureUrl}
      colorTextureUrl={colorTextureUrl}
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={normalTextureUrl}
      metallic={0.5}
      roughness={0.5}
      roughnessTextureUrl={roughnessTextureUrl}
      albedoColor={Color3.White()}
      specularIntensity={0.05}
      textureScale={1 / 12}
    />
  ) : (
    <PBRBox
      name="piece"
      width={pieceSize}
      height={pieceHeight}
      depth={pieceSize}
      position={actualTransform.pos}
      rotationQuaternion={actualTransform.rot}
      scaling={actualTransform.scale}
      isPickable={false}
      cubeTextureRef={cubeTextureRef}
      colorTextureUrl={colorTextureUrl}
      normalTextureUrl={normalTextureUrl}
      aoTextureUrl={aoTextureUrl}
      roughnessTextureUrl={roughnessTextureUrl}
      metallic={0.5}
      roughness={0.5}
      albedoColor={Color3.White()}
      specularIntensity={0.05}
      textureScale={1 / 12}
    />
  );
};

export const VariantButton: FC<{
  variant: PieceVariant;
  currentVariant: PieceVariant;
  position: Vector3;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
  onClick: () => void;
}> = ({ variant, position, currentVariant, cubeTextureRef, onClick }) => {
  const boxRef = useRef<Mesh | null>(null);

  const currentAnimationState = useMemo(
    () => ({
      emissive: variant === currentVariant ? 0.2 : 0,
    }),
    [variant, currentVariant],
  );

  const targetAnimationState = useRef(currentAnimationState);
  useEffect(() => {
    targetAnimationState.current = currentAnimationState;
  }, [currentAnimationState]);

  const [actualAnimationState, setActualAnimationState] = useState(
    targetAnimationState.current,
  );

  useBeforeRender(() => {
    setActualAnimationState((prev) => ({
      emissive: Lerp(prev.emissive, targetAnimationState.current.emissive, 0.2),
    }));
  });

  const curOnClick = useRef<() => void>(onClick);
  useEffect(() => {
    curOnClick.current = onClick;
  }, [onClick]);

  useClick(() => {
    curOnClick.current();
  }, boxRef);

  return (
    <PBRBox
      name="tile"
      width={0.8}
      height={0.1}
      depth={0.8}
      position={position}
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={marbleWhiteNormal as string}
      colorTextureUrl={marbleWhiteColor as string}
      aoTextureUrl={marbleWhiteAO as string}
      roughnessTextureUrl={marbleWhiteRoughness as string}
      metallic={0.5}
      roughness={0.5}
      specularIntensity={0.05}
      albedoColor={Color3.White()}
      textureScale={1 / 10}
      emissiveColor={Color3.Blue()}
      emissiveIntensity={actualAnimationState.emissive}
      ref={boxRef}
    />
  );
};
