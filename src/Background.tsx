
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
import {DebugOverlay, OptionOverlay} from "./misc.tsx";
import {Camera} from "three";
import {Intro, JpegXl, Lossless, Lossy, Something, Textures, VfxAsset} from "./Panels.tsx";

extend({ WaterPass, GlitchPass })

const config = {
  backside: false,
  samples: 12,
  resolution: 256,
  transmission: 1.00,
  roughness: 0.75,
  clearcoat: 0.25,
  clearcoatRoughness: 0.36,
  thickness: 25,
  backsideThickness: 95,
  ior: 1.9,
  chromaticAberration: 0.45,
  anisotropy: 15,
  distortion: 0,
  distortionScale: 0.2,
  temporalDistortion: 0,
  attenuationDistance: 7,
  attenuationColor: '#897a62',
  color: '#8d7f69',
}

function Frame({ uid, scale, color, focus, setFocus, panel, ...props }) {
  const image = useRef()
  const gpRef = useRef()
  const meshRef = useRef()
  const [hovered, setHover] = useState(false)

  let isFocus = focus === uid
  useFrame((state, dt) => {
    let tp = props.position
    if (isFocus || hovered) {
      const val = isFocus? 0.5 : 0.3
      easing.damp3((gpRef.current as any).position, [tp[0], tp[1]+val, tp[2]], 0.2*gr, dt, undefined, )
    } else {
      easing.damp3((gpRef.current as any).position, tp, 0.15, dt, undefined, )
    }
    if (isFocus) {
      easing.damp3((meshRef.current as any).scale, [2.1*gr, 2.1, 0.2], 0.3, dt, undefined, )
    } else {
      easing.damp3((meshRef.current as any).scale, scale, 0.2, dt, undefined, )
    }
  })

  useCursor(hovered && !isFocus)

  return (
    <group {...props} ref={gpRef}>
      {/*<PivotControls scale={1} activeAxes={[true, true, true]} offset={[0, 0, 0.3]}>*/}
      <mesh
        name={uid}
        scale={scale}
        ref={meshRef}
        onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry />
        {/*<MeshTransmissionMaterial {...config} color={color} toneMapped={false} />*/}
        <meshStandardMaterial color="#111" metalness={0.1} roughness={0.7} envMapIntensity={0.1} />
        {/*<meshBasicMaterial color="#333" toneMapped={false} fog={false} />*/}
        <Edges color="silver" />
      </mesh>
      {panel}
      {/*</PivotControls>*/}
    </group>
  )
}

const gr = 1.61803398875
const clone = new THREE.PerspectiveCamera()

function ImageBlocks({ images, focus, setFocus, isCamera }) {
  const ref = useRef()
  const clicked = useRef()

  let q = new THREE.Quaternion()
  let p = new THREE.Vector3()
  useEffect(() => {
    // @ts-ignore
    clicked.current = ref.current.getObjectByName(focus)
    if (clicked.current) {
      // @ts-ignore
      clicked.current.parent.updateWorldMatrix(true, true)
      // @ts-ignore
      clicked.current.parent.localToWorld(p.set(0, 0, 5.25))
      // @ts-ignore
      clicked.current.parent.getWorldQuaternion(q)
    }
  })

  useFrame((state, dt) => {
    if (!isCamera) {
      if (focus) {
        easing.damp3(state.camera.position, p, 0.5, dt)
        easing.dampQ(state.camera.quaternion, q, 0.5, dt)
      } else {
        const time = state.clock.elapsedTime
        easing.damp3(clone.position, [14 * Math.sin(time * 0.03), 10, 14 * Math.cos(time * 0.03)], 1, dt)
        clone.lookAt(0, 0, 0)
        easing.damp3(state.camera.position, clone.position, 1, dt)
        easing.dampQ(state.camera.quaternion, clone.quaternion, 1, dt)
      }
    }
  })

  return (
    <group
      ref={ref}
      position={[0, -0.5, 0]}
      onClick={(e) => (setFocus(e.object.name))}
      onPointerMissed={() => setFocus(undefined)}>
      {images.map((props) => <Frame key={props.uid} focus={focus} {...props} /> /* prettier-ignore */)}
    </group>
  )
}

const Grid2 = ({ number = 11, lineWidth = 0.02, height = 0.3 }) => (
  // Renders a grid and crosses as instances
  <>
    <Grid
      renderOrder={-1} position={[0, -1.85, 0]} infiniteGrid cellSize={0.6}
      cellThickness={0.6} sectionSize={4} sectionThickness={1.5}
      sectionColor={"#777"} fadeDistance={24} fadeStrength={0.6}
    />
    <Instances position={[0, -1.02, 0]} >
      <planeGeometry args={[lineWidth, height]}/>
      <meshBasicMaterial color="#bbb" />
      {Array.from({ length: number }, (_, y) =>
        Array.from({ length: number }, (_, x) => (
          <group key={x + ':' + y} position={[(x - Math.floor(number / 2)) * 2, -0.01, (y - Math.floor(number / 2)) * 2]}>
            <Instance rotation={[-pi / 2.4, 0, 0]} />
            <Instance rotation={[-pi / 2, 0, pi / 2]} />
          </group>
        ))
      )}
      {/*<gridHelper args={[8, 8, '#BFB29E', '#D6C7AE']} position={[0, 0.05, 0]} scale={2}/>*/}
      <Grid args={[8, 8]} position={[0, 0.02, 0]} scale={2} sectionColor={"#BFB29E"} cellColor={"#D6C7AE"} fadeDistance={18.25} fadeStrength={0.9}/>
    </Instances>
  </>
)

const pi = Math.PI

export function Background() {

  const [focus, setFocus] = useState(undefined)
  const [isCamera, setIsCamera] = useState(false)

  console.log(focus)

  const images = [
    {
      uid: "textures",
      rotation: [pi/-2, 0, 0],
      position: [2, -1, 1],
      scale: [2, gr, 0.2],
      panel: <Textures focused={focus==="textures"}/>,
    },
    { uid: "Lossy",
      rotation: [pi/-2, 0, pi/2],
      position: [-2, -1, 2],
      scale: [3, gr, 0.2],
      panel: <Lossy focused={focus==="Lossy"}/>,
    },
    { uid: "lossless",
      rotation: [pi/-2, 0, pi],
      position: [-1, -1, -1],
      scale: [4, gr, 0.2],
      panel: <Lossless focused={focus==="lossless"}/>,
    },
    { uid: "jxl",
      rotation: [pi/-2, 0, 0],
      position: [0, -1, 1],
      scale: [gr, 1, 0.2],
      panel: <JpegXl focused={focus==="jxl"}/>,
    },
    { uid: "vfxAsset",
      rotation: [pi/-2, 0, pi/-2],
      position: [2, -1, -2],
      scale: [3, gr, 0.2],
      panel: <VfxAsset focused={focus==="vfxAsset"}/>,
    },
    { uid: "intro",
      rotation: [pi/-2, 0, 0],
      position: [-1, -1, -3],
      scale: [3, 2, 0.2],
      panel: <Intro focused={focus==="intro"}/>,
    },
    { uid: "something",
      rotation: [pi/-2, 0, pi],
      position: [1, -1, 3],
      scale: [3, 2, 0.2],
      panel: <Something focused={focus==="something"}/>,
    },
  ]

  return (
    <>
      <object data="/461gp.pdf" type="application/pdf" width="100%" height="85%">
        <p>Alternative text - include a link <a href="http://africau.edu/images/default/sample.pdf">to the PDF!</a></p>
      </object>
      <Canvas dpr={[1, 1.5]} shadows camera={{ position: [-15, 8, -15], fov: 26 }}>
        <fog attach="fog" args={['#D2B48C', 20, 23]} />
        <ambientLight intensity={15} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Grid2/>
        <ImageBlocks {...{images, focus, setFocus, isCamera}}/>

        {isCamera && <CameraControls makeDefault minZoom={50} dollyToCursor/>}
        {/*<Input scale={2} position={[0.4, 0.25, -1]} />*/}
        {/*<Gd/>*/}
        <Environment background preset="night" blur={0.7}/>
        <EffectComposer>
          <Bloom mipmapBlur intensity={1} opacity={0.3} luminanceThreshold={0.5}/>
          <DepthOfField target={[0, 0, -2.5]} bokehScale={0.9}/>
          <Vignette eskil={false} offset={0.22} darkness={0.7} />
        </EffectComposer>
        <DebugOverlay />
      </Canvas>
      <OptionOverlay {...{isCamera, setIsCamera}}/>
    </>
  )
}