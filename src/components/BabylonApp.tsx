import { Color3, Mesh, Vector3, type Nullable } from '@babylonjs/core';
import { useEffect, useRef, useState, type FC } from 'react';
import {
  Engine,
  Scene,
  useBeforeRender,
  useClick,
  useHover,
  useScene,
} from 'react-babylonjs';

type MovingBoxProps = {
  rotationAxis: 'x' | 'y' | 'z';
  position: Vector3;
  color: Color3;
  hoveredColor: Color3;
};

const defaultScale = new Vector3(1, 1, 1);
const biggerScale = new Vector3(1.25, 1.25, 1.25);

const MovingBox: FC<MovingBoxProps> = (props) => {
  // access Babylon Scene
  const scene = useScene();
  // access refs to Babylon objects in scene like DOM nodes
  const boxRef = useRef<Nullable<Mesh>>(null);

  useBeforeRender(() => {
    if (scene && boxRef.current) {
      const deltaTimeInMillis = scene.getEngine().getDeltaTime();
      boxRef.current.rotation[props.rotationAxis] +=
        (30 / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    }
  });

  const [clicked, setClicked] = useState(false);
  useClick(() => setClicked((clicked) => !clicked), boxRef);

  const [hovered, setHovered] = useState(false);
  useHover(
    () => setHovered(true),
    () => setHovered(false),
    boxRef,
  );

  return (
    <box
      name="box"
      ref={boxRef}
      size={2}
      position={props.position}
      scaling={clicked ? biggerScale : defaultScale}
    >
      <standardMaterial
        name="material"
        diffuseColor={hovered ? props.hoveredColor : props.color}
        specularColor={Color3.Black()}
      />
    </box>
  );
};

export const BabylonApp: FC = () => {
  const canvasContainer = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 2 });

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

  return (
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
        <Scene>
          <arcRotateCamera
            name="camera1"
            alpha={0}
            beta={Math.PI / 4}
            radius={10}
            target={new Vector3(0, 1, 0)}
            lockedTarget={new Vector3(0, 1, 0)}
            allowUpsideDown={false}
            upperBetaLimit={Math.PI / 2 - 0.01}
            lowerRadiusLimit={5}
            upperRadiusLimit={100}
          />
          <hemisphericLight
            name="light1"
            intensity={0.5}
            direction={new Vector3(0, 1, 0)}
          />
          <directionalLight
            name="dl"
            intensity={0.7}
            direction={
              new Vector3((-5 * Math.PI) / 4, (-5 * Math.PI) / 4, -Math.PI)
            }
            position={new Vector3(0, 4, 16)}
          >
            <shadowGenerator
              mapSize={1024}
              useBlurExponentialShadowMap
              blurKernel={64}
              shadowCastChildren
            >
              <MovingBox
                rotationAxis="y"
                position={new Vector3(0, 1.25, 0)}
                color={Color3.Blue()}
                hoveredColor={Color3.Red()}
              />
              <MovingBox
                rotationAxis="y"
                position={new Vector3(3, 1.25, 0)}
                color={Color3.Blue()}
                hoveredColor={Color3.Red()}
              />
            </shadowGenerator>
          </directionalLight>
          <ground
            name="ground"
            width={12}
            height={12}
            subdivisions={2}
            receiveShadows
          >
            <standardMaterial
              name="material"
              diffuseColor={Color3.Gray()}
              specularColor={Color3.Black()}
            />
          </ground>
        </Scene>
      </Engine>
    </div>
  );
};
