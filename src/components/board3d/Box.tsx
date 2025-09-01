import {
  BaseTexture,
  Color3,
  Mesh,
  Quaternion,
  Vector3,
  Vector4,
} from '@babylonjs/core';
import type { FC } from 'react';

export const PBRBox: FC<{
  name: string;
  width: number;
  height: number;
  depth: number;
  position: Vector3;
  rotationQuaternion?: Quaternion;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
  albedoColor?: Color3 | undefined;
  normalTextureUrl: string;
  colorTextureUrl: string;
  aoTextureUrl: string;
  roughnessTextureUrl: string;
  metallic: number;
  roughness: number;
  specularIntensity?: number;
  textureScale?: number;
  scaling?: Vector3;
  isPickable?: boolean;
  emissiveColor?: Color3 | undefined;
  emissiveIntensity?: number;
  ref?: React.RefObject<Mesh | null>;
  children?: React.ReactNode;
}> = ({
  name,
  width,
  height,
  depth,
  position,
  rotationQuaternion,
  cubeTextureRef,
  normalTextureUrl,
  colorTextureUrl,
  aoTextureUrl,
  roughnessTextureUrl,
  metallic,
  roughness,
  albedoColor,
  specularIntensity,
  textureScale,
  scaling,
  isPickable,
  emissiveColor,
  emissiveIntensity,
  children,
  ref,
}) => {
  const tileSize = Math.max(width, depth, height) / (textureScale ?? 1);
  return (
    <tiledBox
      name={name}
      width={width}
      depth={depth}
      height={height}
      position={position}
      rotationQuaternion={rotationQuaternion}
      tileWidth={tileSize}
      tileHeight={tileSize}
      receiveShadows
      isPickable={isPickable}
      scaling={scaling}
      ref={ref}
    >
      <pbrMaterial
        name="material"
        reflectionTexture={cubeTextureRef.current}
        environmentIntensity={1}
        specularIntensity={specularIntensity ?? 0.05}
        albedoColor={albedoColor ?? Color3.White()}
        metallic={metallic}
        roughness={roughness}
        emissiveColor={emissiveColor}
        emissiveIntensity={emissiveIntensity}
      >
        <texture url={normalTextureUrl} assignTo="bumpTexture" />
        <texture url={colorTextureUrl} assignTo="albedoTexture" />
        <texture url={aoTextureUrl} assignTo="ambientTexture" />
        <texture
          url={roughnessTextureUrl}
          assignTo="baseDiffuseRoughnessTexture"
        />
      </pbrMaterial>
      {children}
    </tiledBox>
  );
};

export const PBRCylinder: FC<{
  name: string;
  height: number;
  diameter: number;
  position: Vector3;
  rotationQuaternion?: Quaternion;
  cubeTextureRef: React.RefObject<BaseTexture | undefined>;
  albedoColor?: Color3 | undefined;
  normalTextureUrl: string;
  colorTextureUrl: string;
  aoTextureUrl: string;
  roughnessTextureUrl: string;
  metallic: number;
  roughness: number;
  specularIntensity?: number;
  textureScale?: number;
  scaling?: Vector3;
  isPickable?: boolean;
  ref?: React.RefObject<Mesh | null>;
}> = ({
  name,
  height,
  diameter,
  position,
  rotationQuaternion,
  cubeTextureRef,
  normalTextureUrl,
  colorTextureUrl,
  aoTextureUrl,
  roughnessTextureUrl,
  metallic,
  roughness,
  albedoColor,
  specularIntensity,
  textureScale,
  scaling,
  isPickable,
  ref,
}) => {
  return (
    <cylinder
      ref={ref}
      name={name}
      height={height}
      diameter={diameter}
      position={position}
      rotationQuaternion={rotationQuaternion}
      receiveShadows
      isPickable={isPickable}
      scaling={scaling}
      faceUV={[
        new Vector4(0, 0, textureScale ?? 1, textureScale ?? 1),
        new Vector4(0, 0, 1, textureScale ?? 1),
        new Vector4(0, 0, textureScale ?? 1, textureScale ?? 1),
      ]}
    >
      <pbrMaterial
        name="material"
        reflectionTexture={cubeTextureRef.current}
        environmentIntensity={1}
        specularIntensity={specularIntensity ?? 0.05}
        albedoColor={albedoColor ?? Color3.White()}
        metallic={metallic}
        roughness={roughness}
      >
        <texture url={normalTextureUrl} assignTo="bumpTexture" />
        <texture url={colorTextureUrl} assignTo="albedoTexture" />
        <texture url={aoTextureUrl} assignTo="ambientTexture" />
        <texture
          url={roughnessTextureUrl}
          assignTo="baseDiffuseRoughnessTexture"
        />
      </pbrMaterial>
    </cylinder>
  );
};
