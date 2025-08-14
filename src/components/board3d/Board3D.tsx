import { CubeTexture, Texture, Vector3 } from '@babylonjs/core';
import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Engine, Scene } from 'react-babylonjs';
import { ui, type PieceVariant } from '../../packages/tak-core';
import { Table, Board, Tile, Piece } from './Objects';
import type { BoardProps } from '../board';

export const Board3D: FC<BoardProps> = ({ game, interactive, onMove }) => {
  const [_updateTrigger, setUpdateTrigger] = useState<number>(0);
  const [variant, setVariant] = useState<PieceVariant>('flat');
  const canvasContainer = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 2 });

  useEffect(() => {
    game.onUpdate = () => {
      setUpdateTrigger((prev) => prev + 1);
    };
    game.onMove = onMove;
  }, [game]);

  const size = ui.boardSize(game);
  const target = new Vector3(size / 2, 1, size / 2);

  function handleResize() {
    const boundingRect = canvasContainer.current?.getBoundingClientRect();
    const { width, height } = boundingRect || { width: 0, height: 0 };
    console.log('resize', width, height);
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

  let environmentUrl =
    'https://raw.githubusercontent.com/brianzinn/react-babylonjs/refs/heads/master/website/docs/public/assets/textures/environment.dds';

  const [_, setTexturesLoaded] = useState(false);
  const cubeTextureRef = useRef<CubeTexture | undefined>(undefined);
  const cubeTextureCloneRef = useRef<CubeTexture | undefined>(undefined);
  const cubeTextureCallback = useCallback((node: CubeTexture | null) => {
    if (node) {
      cubeTextureRef.current = node;
      console.log('hdrTexture', node);
      // hdrTexture = node;

      cubeTextureCloneRef.current = node.clone();
      cubeTextureCloneRef.current.name = 'cloned texture';
      cubeTextureCloneRef.current.coordinatesMode = Texture.SKYBOX_MODE;

      setTexturesLoaded(true); // trigger render and props assignment
    }
  }, []);

  return (
    <div className="flex flex-col grow w-full">
      <div className="w-dvw grow" ref={canvasContainer}>
        <Engine
          antialias
          canvasId="babylon-js"
          width={dimensions.width}
          height={dimensions.height}
          style={{
            width: dimensions.width,
            height: dimensions.height,
          }}
          adaptToDeviceRatio={false}
          renderOptions={{
            whenVisibleOnly: true,
          }}
        >
          <Scene environmentTexture={cubeTextureRef.current}>
            <cubeTexture
              ref={cubeTextureCallback}
              name="cubeTexture"
              rootUrl={environmentUrl}
              createPolynomials={true}
              format={undefined}
              prefiltered={true}
            />

            <box name="hdrSkyBox" size={1000} infiniteDistance>
              <pbrMaterial
                name="skyBox"
                backFaceCulling={false}
                reflectionTexture={cubeTextureCloneRef.current}
                microSurface={1}
                disableLighting
              />
            </box>

            <arcRotateCamera
              name="camera1"
              alpha={Math.PI / 2}
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
              intensity={0.1}
              direction={new Vector3(0, 1, 0)}
            />
            <directionalLight
              name="dl"
              intensity={5}
              direction={new Vector3(1, -1, 1).normalize()}
              shadowMinZ={0.1}
              shadowMaxZ={20}
            >
              <shadowGenerator
                mapSize={1024}
                usePercentageCloserFiltering
                blurKernel={64}
                bias={0.001}
                normalBias={0.01}
                shadowCastChildren
              >
                {tileCoords.map((pos) => (
                  <Tile
                    key={`${pos.x}-${pos.y}`}
                    game={game}
                    pos={pos}
                    cubeTextureRef={cubeTextureRef}
                    onClick={() => {
                      if (!interactive) return;
                      ui.tryPlaceOrAddToPartialMove(game, pos, variant);
                    }}
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
              </shadowGenerator>
            </directionalLight>
            <Table size={size} cubeTextureRef={cubeTextureRef} />
          </Scene>
        </Engine>
      </div>
      <div className="w-full flex p-2 gap-2">
        <button
          className={`grow w-0 bg-surface-500 hover:bg-surface-550 active:bg-surface-600 p-2 rounded-md outline-primary-500 ${variant === 'flat' ? 'outline-2' : ''}`}
          onClick={() => setVariant('flat')}
        >
          Flat
        </button>
        <button
          className={`grow w-0 bg-surface-500 hover:bg-surface-550 active:bg-surface-600 p-2 rounded-md outline-primary-500 ${variant === 'standing' ? 'outline-2' : ''}`}
          onClick={() => setVariant('standing')}
        >
          Wall
        </button>
        <button
          className={`grow w-0 bg-surface-500 hover:bg-surface-550 active:bg-surface-600 p-2 rounded-md outline-primary-500 ${variant === 'capstone' ? 'outline-2' : ''}`}
          onClick={() => setVariant('capstone')}
        >
          Capstone
        </button>
      </div>
    </div>
  );
};
