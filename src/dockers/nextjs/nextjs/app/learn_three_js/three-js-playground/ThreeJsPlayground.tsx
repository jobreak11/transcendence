'use client';
import { CubeCamera, Environment, Html, KeyboardControls, MeshReflectorMaterial, MeshWobbleMaterial, OrbitControls, useHelper, useKeyboardControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useControls } from 'leva';
import { Suspense, useRef, useState } from 'react';
import { DirectionalLight, DirectionalLightHelper } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HTMLMesh } from 'three/examples/jsm/Addons.js';
import { BallCollider, CuboidCollider, Physics, RapierRigidBody, RigidBody, RigidBodyOptions, RigidBodyProps } from '@react-three/rapier'
import { Box, Sphere, Torus } from '@react-three/drei'

export function Loading() {
  return (
    <Html>
      <h1>Loading...</h1>
    </Html>
  )
}

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
];

function PlayerBox() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [, getKeys] = useKeyboardControls();

  useFrame(() =>{
    if (!rigidBodyRef.current)
      return;

    const { forward, backward, left, right, jump } = getKeys();
    const speed = 7;
    const currentVel = rigidBodyRef.current.linvel();

    let x = 0;
    let z = 0;

    if (forward) z -= speed;
    if (backward) z += speed;
    if (left) x -= speed;
    if (right) x += speed;

    rigidBodyRef.current.setLinvel({
      x, y: currentVel.y, z
    }, true);

    if (jump && Math.abs(currentVel.y) < 0.05) {
      rigidBodyRef.current.applyImpulse({x: 0, y: 6, z: 0}, true);
    }

  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0,2,0]}
    >
      <Box castShadow>
        <meshStandardMaterial 
        flatShading
        color='royalblue'/>
      </Box>

    </RigidBody>

  )
}

function Scene1() {
  const directionalLightRef = useRef<DirectionalLight>(null);

  const {dLx, dLy, dLz, dLIntensivity} = useControls({
    dLx: {
      // 25.4
      value: 25.4,
      min: 1,
      max: 100,
      step: 0.1
    },
    dLy: {
      // 35.9
      value: 35.9,
      min: 1,
      max: 100,
      step: 0.1
    },
    dLz: {
      // 13.7
      value: 13.7,
      min: 1,
      max: 100,
      step: 0.1
    },
    dLIntensivity: {
      value: 2,
      min: 0,
      max: 5,
      step: 0.01,
    },
  })

  return (
    <>
      <Suspense fallback={<Loading/>}>
        <Physics>

          <RigidBody
          type='fixed'
          >
            <Box
            receiveShadow
            position={[0,-2,0]}
            args={[20,0.5,20]}
            >
              <meshStandardMaterial 

              />
            </Box>

          </RigidBody>

          <PlayerBox />

        </Physics>


      <directionalLight
      position={[dLx,dLy,dLz]}
      intensity={dLIntensivity}
      castShadow
      shadow-mapSize={[4096,4096]}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
      shadow-camera-near={0.5}
      shadow-camera-far={60}
      ref={directionalLightRef}
      />
      <ambientLight intensity={0.5}/>
      <OrbitControls />

      </Suspense>

    </>
  )
}

export function ThreeJsPlayground()
{
  return (
    <KeyboardControls map={keyboardMap} >
    <Canvas 
    camera={{position: [10,10,20], fov: 45}}
    className='bg-black'
    shadows
    >
      <Scene1 />

    </Canvas>

    </KeyboardControls>
  )
}