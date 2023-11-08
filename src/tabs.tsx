
import {useEffect, useState, useRef} from 'react'
import styled from 'styled-components';
import {Canvas, useFrame, extend, useLoader, useThree} from '@react-three/fiber'
import {
  useGLTF, Stage, Grid, Image, OrbitControls, Text, Effects, Environment, AccumulativeShadows, RandomizedLight, Stats,
  Html, CameraControls, PerspectiveCamera, Instances, Instance, BakeShadows, useCursor, Bounds, Edges, GizmoHelper,
  GizmoViewport, MeshReflectorMaterial, OrthographicCamera, Reflector, PivotControls, MeshTransmissionMaterial,
} from '@react-three/drei'
import { WaterPass, GlitchPass } from 'three-stdlib'
import {EffectComposer, Bloom, DepthOfField, SSR, LUT, Vignette} from '@react-three/postprocessing'
import { easing } from 'maath'
import { useControls } from 'leva'
import { LUTCubeLoader } from 'postprocessing'
import { LayerMaterial, Depth, Fresnel } from 'lamina'
import { Perf } from 'r3f-perf'
import * as THREE from 'three'
import { useRoute, useLocation } from 'wouter'
import {DebugOverlay} from "./misc.tsx";
import {Camera} from "three";
