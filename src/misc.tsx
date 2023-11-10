
import {useEffect, useState, useRef} from 'react'
import styled from 'styled-components';
import {Canvas, useFrame, extend, useLoader, useThree} from '@react-three/fiber'
import {
  useGLTF, Stage, Grid, Image, OrbitControls, Text, Effects, Environment, AccumulativeShadows, RandomizedLight, Stats,
  Html, CameraControls, PerspectiveCamera, Instances, Instance, BakeShadows, useCursor, Bounds, Edges, GizmoHelper,
  GizmoViewport, MeshReflectorMaterial, OrthographicCamera, Reflector,
} from '@react-three/drei'
import { WaterPass, GlitchPass } from 'three-stdlib'
import {EffectComposer, Bloom, DepthOfField, SSR, LUT} from '@react-three/postprocessing'
import { easing } from 'maath'
import { useControls } from 'leva'
import { LUTCubeLoader } from 'postprocessing'
import { LayerMaterial, Depth, Fresnel } from 'lamina'
import { Perf } from 'r3f-perf'
import * as THREE from 'three'
import { useRoute, useLocation } from 'wouter'



const FCDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  //opacity: 0;
`
const BackgroundBox1 = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`
const BgBlurBox = styled(FCDiv)`
  backdrop-filter: blur(45px);
`

export const DebugOverlay = () => {
  const { width } = useThree((s) => s.size)
  return (
    /* This is it -> */
    <Perf
      minimal={width < 712}
      matrixUpdate
      deepAnalyze
      overClock
      // customData={{
      //   value: 60,
      //   name: 'physic',
      //   info: 'fps'
      // }}
    />
  )
}

function StageUh() {
  return (
    <>
      <ambientLight intensity={5} />
      <directionalLight
        position={[1, 10, -2]}
        intensity={1}
        shadow-camera-far={70}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-mapSize={[512, 512]}
        castShadow
      />
      <directionalLight position={[-10, -10, 2]} intensity={3} />
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -1.85, 0]}>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
      {/*<BakeShadows />*/}
    </>
  )
}

function Gd() {
  return(
    <mesh position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* <planeGeometry args={[5, 5]} /> */}
      <MeshReflectorMaterial
        transparent={true}
        opacity={0.5}
        mirror={0.5}
        blur={[400, 100]}
        resolution={2048}
        mixBlur={10}
        mixStrength={15}
        depthScale={0.1}
        minDepthThreshold={0.1}
        color="#222222"
        metalness={0.5}
        roughness={0.1}
      />
    </mesh>
  )
}


const ToggleButton = styled('button')`
  width: 20px;
  height: 20px;
  background-color: antiquewhite;
`

const Overlay = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 100px;
  height: 200px;
  //background-color: antiquewhite;
  border: #848484;
`

export function OptionOverlay({ isCamera, setIsCamera }) {
  return(
    <Overlay>
      <ToggleButton onClick={() => setIsCamera(!isCamera)}/>
    </Overlay>
  )
}