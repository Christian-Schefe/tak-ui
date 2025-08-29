import {
  BaseTexture,
  Color3,
  CubeTexture,
  Texture,
  Vector3,
} from '@babylonjs/core';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Engine, Scene, Skybox } from 'react-babylonjs';
import { ui, type Coord, type PieceVariant } from '../../packages/tak-core';
import { Table, Board, Tile, Piece, VariantButton } from './Objects';
import type { BoardProps } from '../board';
import { coordToString } from '../../packages/tak-core/coord';
import envTexture from '../../assets/766-hdri-skies-com.env';
import { GameInfoDrawer } from '../classic/GameInfoDrawer';
import { ChatDrawer } from '../classic/ChatDrawer';

export interface EnvConfig {
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
  envColor: Color3;
}

export const Board3D: FC<BoardProps> = ({
  game,
  playerInfo,
  callbacks,
  mode,
  hasDrawOffer,
  hasUndoOffer,
}) => {
  const [variant, setVariant] = useState<PieceVariant>('flat');
  const canvasContainer = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 2 });

  const size = ui.boardSize(game);
  const target = new Vector3(size / 2, 1, size / 2);

  function handleResize() {
    const boundingRect = canvasContainer.current?.getBoundingClientRect();
    const { width, height } = boundingRect ?? { width: 0, height: 0 };
    setDimensions({ width: Math.round(width), height: Math.round(height) });
  }

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    handleResize();
  }, [canvasContainer]);

  const tileCoords = [];
  const pieceIds = Array.from(game.pieces.keys());
  pieceIds.sort((a, b) => a - b);

  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      tileCoords.push({ x, y });
    }
  }

  const [, setTexturesLoaded] = useState(false);
  const cubeTextureRef = useRef<BaseTexture | undefined>(undefined);
  const cubeTextureCloneRef = useRef<BaseTexture | undefined>(undefined);
  const cubeTextureCallback = useCallback((node: CubeTexture | null) => {
    if (node) {
      cubeTextureRef.current = node;
      console.log('hdrTexture', node);

      cubeTextureCloneRef.current = node.clone();
      cubeTextureCloneRef.current.name = 'cloned texture';
      cubeTextureCloneRef.current.coordinatesMode = Texture.SKYBOX_MODE;

      setTexturesLoaded(true); // trigger render and props assignment
    }
  }, []);

  const onClickTile = useCallback(
    (pos: Coord) => {
      callbacks.current.onClickTile(pos, variant);
    },
    [callbacks, variant],
  );

  const areTilesInteractive =
    (mode.type === 'remote' &&
      game.actualGame.currentPlayer === mode.localPlayer) ||
    mode.type === 'local';

  return (
    <>
      <div className="fixed inset-0" ref={canvasContainer}>
        <Engine
          antialias
          canvasId="babylon-js"
          width={dimensions.width}
          height={dimensions.height}
          style={{
            width: dimensions.width,
            height: dimensions.height,
          }}
          adaptToDeviceRatio
          renderOptions={{
            whenVisibleOnly: true,
          }}
        >
          <Scene environmentIntensity={1}>
            <cubeTexture
              ref={cubeTextureCallback}
              name="cubeTexture"
              rootUrl={envTexture as string}
              createPolynomials={true}
              format={undefined}
              prefiltered={true}
            />

            <Skybox rootUrl={'/Standard-Cube-Map/skies'} size={1000} />

            <arcRotateCamera
              name="camera1"
              alpha={-Math.PI / 2}
              beta={Math.PI / 4}
              radius={10}
              target={target}
              lockedTarget={target}
              allowUpsideDown={false}
              upperBetaLimit={Math.PI / 2 - 0.01}
              lowerRadiusLimit={5}
              upperRadiusLimit={100}
            />
            <hemisphericLight
              name="light1"
              intensity={1}
              direction={new Vector3(0, 1, 0)}
            />

            {tileCoords.map((pos) => (
              <Tile
                key={coordToString(pos)}
                tile={game.tiles[pos.y][pos.x]}
                pos={pos}
                cubeTextureRef={cubeTextureRef}
                interactive={areTilesInteractive}
                onClick={onClickTile}
              />
            ))}
            {pieceIds.map((id) => (
              <Piece
                key={id}
                game={game}
                id={id}
                cubeTextureRef={cubeTextureRef}
              />
            ))}

            <Board size={size} cubeTextureRef={cubeTextureRef} />
            <Table size={size} cubeTextureRef={cubeTextureRef} />

            {mode.type !== 'spectator' && (
              <>
                <VariantButton
                  variant="flat"
                  currentVariant={variant}
                  position={new Vector3(-1 + size / 2, -0.2, -1)}
                  cubeTextureRef={cubeTextureRef}
                  onClick={() => {
                    setVariant('flat');
                  }}
                />
                <VariantButton
                  variant="standing"
                  currentVariant={variant}
                  position={new Vector3(0 + size / 2, -0.2, -1)}
                  cubeTextureRef={cubeTextureRef}
                  onClick={() => {
                    setVariant('standing');
                  }}
                />
                <VariantButton
                  variant="capstone"
                  currentVariant={variant}
                  cubeTextureRef={cubeTextureRef}
                  position={new Vector3(1 + size / 2, -0.2, -1)}
                  onClick={() => {
                    setVariant('capstone');
                  }}
                />
              </>
            )}
          </Scene>
        </Engine>
      </div>
      <div className="w-full grow flex">
        <GameInfoDrawer
          gameId={mode.type === 'local' ? undefined : mode.gameId}
          game={game}
          playerInfo={playerInfo}
          hasDrawOffer={hasDrawOffer}
          hasUndoOffer={hasUndoOffer}
          showResign={mode.type === 'remote'}
          callbacks={callbacks}
        />
        <div className="w-0 grow pointer-events-none"></div>
        <ChatDrawer gameId={mode.type === 'local' ? undefined : mode.gameId} />
      </div>
    </>
  );
};
