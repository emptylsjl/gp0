
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
    <Perf
      minimal={width < 712}
      matrixUpdate
      deepAnalyze
      overClock
    />
  )
}


const ToggleButton = styled('button')`
  width: 80px;
  height: 20px;
  background-color: antiquewhite;
`

const Overlay = styled('div')`
  position: fixed;
  top: 5%;
  left: 0;
  width: 100px;
  height: 200px;
  //background-color: antiquewhite;
  border: #848484;
`

export function OptionOverlay({ isCamera, setIsCamera, isPdf, setIsPdf, isPivot, setIsPivot }) {
  return(
    <Overlay>
      <ToggleButton onClick={() => setIsPdf(!isPdf)}>toggle pdf</ToggleButton>
      <ToggleButton onClick={() => setIsCamera(!isCamera)}>cam ctrl</ToggleButton>
      <ToggleButton onClick={() => setIsPivot(!isPivot)}>pivot ctrl</ToggleButton>
    </Overlay>
  )
}