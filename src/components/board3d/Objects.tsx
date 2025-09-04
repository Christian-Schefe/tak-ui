import {
  BaseTexture,
  Color3,
  Mesh,
  Quaternion,
  Texture,
  Vector3,
} from '@babylonjs/core';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import {
  playerOpposite,
  type Coord,
  type PieceId,
  type PieceVariant,
} from '../../packages/tak-core';
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
import type { BoardMode } from '../board';
import { Control } from '@babylonjs/gui/2D/controls/control';

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
      position={new Vector3(size / 2, -1 - 0.2 - 0.1, size / 2)}
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
  const rowPositions = [];
  const colPositions = [];
  for (let i = 0; i < size; i++) {
    rowPositions.push({ x: i, y: 0 });
    colPositions.push({ x: 0, y: i });
  }
  return (
    // Key hack to recreate mesh when size changes
    <PBRBox
      key={size}
      name="board"
      width={size + 0.5}
      height={0.2}
      depth={size + 0.5}
      position={new Vector3(size / 2, -0.1 - 0.1, size / 2)}
      cubeTextureRef={cubeTextureRef}
      normalTextureUrl={tileNormal as string}
      colorTextureUrl={tileColor as string}
      aoTextureUrl={tileAO as string}
      roughnessTextureUrl={tileRoughness as string}
      metallic={1}
      roughness={0}
      specularIntensity={0.05}
      albedoColor={Color3.FromHexString('#c0c0c0')}
    >
      {colPositions.map((pos, index) => (
        <BoardLetters
          key={`col-${index.toString()}`}
          size={size}
          pos={pos}
          isCol
        />
      ))}
      {rowPositions.map((pos, index) => (
        <BoardLetters
          key={`row-${index.toString()}`}
          size={size}
          pos={pos}
          isCol={false}
        />
      ))}
    </PBRBox>
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
  const supportsHover = useMemo(
    () => window.matchMedia('(hover: hover)').matches,
    [],
  );
  useHover(
    () => {
      if (!supportsHover) return;
      setIsHover(true);
    },
    () => {
      setIsHover(false);
    },
    boxRef,
  );
  const isBeingHovered =
    supportsHover && interactive && isHover && tile.hoverable;
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
          -0.05 + actualAnimationState.height,
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
  id: PieceId;
  currentVariant: PieceVariant;
  mode: BoardMode;
  onClick: (isCapstone: boolean) => void;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
}> = ({ game, id, mode, currentVariant, cubeTextureRef, onClick }) => {
  const pieceData = game.pieces[id];

  const boxRef = useRef<Mesh | null>(null);

  const data = useMemo(() => {
    if (pieceData && !pieceData.deleted) return pieceData;
    const [idPlayer, idVariant, idNum] = id.split('/');
    const player = idPlayer === 'W' ? 'white' : 'black';
    const variant = idVariant === 'C' ? 'capstone' : 'flat';
    const num = parseInt(idNum);
    const prevPieceId: PieceId | null =
      num >= 1
        ? `${idPlayer as 'W' | 'B'}/${idVariant as 'P' | 'C'}/${(num - 1).toString()}`
        : null;
    const prevPiece = prevPieceId !== null ? game.pieces[prevPieceId] : null;
    const isFirstPieceInReserve = num === 0 || prevPiece?.deleted === false;

    const effectivePlayer =
      game.actualGame.history.length < 2 ? playerOpposite(player) : player;
    const isFloating =
      isFirstPieceInReserve &&
      (variant === 'capstone') === (currentVariant === 'capstone') &&
      game.actualGame.gameState.type === 'ongoing' &&
      ((mode.type === 'remote' && mode.localPlayer === effectivePlayer) ||
        (mode.type === 'local' &&
          !mode.review &&
          game.actualGame.currentPlayer === effectivePlayer));
    const actualVariant =
      isFloating && currentVariant === 'standing' ? 'standing' : variant;

    const boardSize = game.actualGame.settings.boardSize;
    const reserve = game.actualGame.settings.reserve;
    const revNum =
      (variant === 'capstone'
        ? reserve.capstones - num
        : reserve.pieces - num) - 1;
    const pieceStackSlots =
      variant === 'capstone'
        ? reserve.capstones
        : Math.max(1, boardSize - reserve.capstones);
    const piecesPerStack = Math.ceil(
      (variant === 'capstone' ? reserve.capstones : reserve.pieces) /
        pieceStackSlots,
    );
    const stack = pieceStackSlots - 1 - Math.floor(revNum / piecesPerStack);
    const height = revNum % piecesPerStack;
    const defaultPiece: UIPiece = {
      buriedPieceCount: 0,
      canBePicked: false,
      deleted: true,
      height,
      isFloating,
      player,
      pos: {
        x: player === 'white' ? -1.5 : boardSize + 0.5,
        y: stack + (variant === 'capstone' ? 0 : reserve.capstones),
      },
      variant: actualVariant,
      zPriority: null,
    };
    return defaultPiece;
  }, [
    pieceData,
    id,
    game.actualGame.settings.boardSize,
    game.actualGame.settings.reserve,
    game.pieces,
    game.actualGame.gameState,
    game.actualGame.currentPlayer,
    game.actualGame.history.length,
    currentVariant,
    mode,
  ]);

  const curData = useRef(data);
  useEffect(() => {
    curData.current = data;
  }, [data]);

  const pieceSize = 0.6;
  const pieceHeight = pieceSize * 0.2;

  const computeTargetPos = (data: UIPiece) => {
    let height = (data.height + (data.isFloating ? 2 : 0)) * pieceHeight;
    if (curData.current.deleted) height -= 0.3;
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
    const targetScale = new Vector3(1, 1, 1);
    setActualTransform((prev) => ({
      pos: Vector3.Lerp(prev.pos, targetPos, 0.15).add(
        targetPos
          .subtract(prev.pos)
          .normalize()
          .scale(Math.min(Vector3.Distance(targetPos, prev.pos), 0.03)),
      ),
      rot: Quaternion.Slerp(prev.rot, targetRot, 0.25),
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

  const curOnClick = useRef<() => void>(() => {
    void 0;
  });
  useEffect(() => {
    curOnClick.current = () => {
      const effectivePlayer =
        game.actualGame.history.length < 2
          ? playerOpposite(data.player)
          : data.player;
      if (mode.type === 'spectator' || (mode.type === 'local' && mode.review))
        return;
      if (mode.type === 'remote' && effectivePlayer !== mode.localPlayer)
        return;
      if (
        mode.type === 'local' &&
        game.actualGame.currentPlayer !== effectivePlayer
      )
        return;
      onClick(data.variant === 'capstone');
    };
  }, [
    onClick,
    data.variant,
    game.actualGame.currentPlayer,
    game.actualGame.history.length,
    mode,
    data.player,
  ]);

  useClick(() => {
    curOnClick.current();
  }, boxRef);

  return data.variant === 'capstone' ? (
    <PBRCylinder
      ref={boxRef}
      name="piece"
      height={pieceSize}
      diameter={pieceSize * 0.8}
      position={actualTransform.pos.add(new Vector3(0, pieceSize / 2, 0))}
      rotationQuaternion={actualTransform.rot}
      scaling={actualTransform.scale}
      isPickable={data.deleted}
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
      ref={boxRef}
      width={pieceSize}
      height={pieceHeight}
      depth={pieceSize}
      position={actualTransform.pos.add(
        new Vector3(
          0,
          data.variant === 'flat' ? pieceHeight / 2 : pieceSize / 2,
          0,
        ),
      )}
      rotationQuaternion={actualTransform.rot}
      scaling={actualTransform.scale}
      isPickable={data.deleted}
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

export const BoardLetters: FC<{ size: number; pos: Coord; isCol: boolean }> = ({
  size,
  pos,
  isCol,
}) => {
  return (
    <plane
      name="text-plane"
      size={1}
      position={new Vector3(pos.x - size / 2, 0.101, pos.y - size / 2).add(
        isCol ? new Vector3(-0.125, 0, 0.5) : new Vector3(0.5, 0, -0.125),
      )}
      rotation={new Vector3(Math.PI / 2, 0, 0)}
    >
      <advancedDynamicTexture
        name="text-texture"
        height={512}
        width={512}
        createForParentMesh
        generateMipMaps
        samplingMode={Texture.TRILINEAR_SAMPLINGMODE}
      >
        <textBlock
          text={
            isCol
              ? (pos.y + 1).toString()
              : String.fromCharCode('A'.charCodeAt(0) + pos.x)
          }
          color="white"
          fontStyle="bold"
          fontSize={96}
          textHorizontalAlignment={Control.HORIZONTAL_ALIGNMENT_CENTER}
          textVerticalAlignment={Control.VERTICAL_ALIGNMENT_CENTER}
        />
      </advancedDynamicTexture>
    </plane>
  );
};
