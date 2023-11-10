// @ts-nocheck

import {useEffect, useState, useRef, Children, Suspense} from 'react'
import styled from 'styled-components';
import {Canvas, useFrame, extend, useLoader, useThree} from '@react-three/fiber'
import {
  useGLTF, Stage, Grid, OrbitControls, Text, Effects, Environment, AccumulativeShadows, RandomizedLight, Stats,
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
import { motion } from 'framer-motion'

const FONTS = {
  'Noto Sans (none)': null,
  'Roboto': 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff',
  'Alex Brush': 'https://fonts.gstatic.com/s/alexbrush/v8/SZc83FzrJKuqFbwMKk6EhUXz6w.woff',
  'Comfortaa': 'https://fonts.gstatic.com/s/comfortaa/v12/1Ptsg8LJRfWJmhDAuUs4TYFs.woff',
  'Cookie': 'https://fonts.gstatic.com/s/cookie/v8/syky-y18lb0tSbf9kgqU.woff',
  'Cutive Mono': 'https://fonts.gstatic.com/s/cutivemono/v6/m8JWjfRfY7WVjVi2E-K9H6RCTmg.woff',
  'Gabriela': 'https://fonts.gstatic.com/s/gabriela/v6/qkBWXvsO6sreR8E-b8m5xL0.woff',
  'Monoton': 'https://fonts.gstatic.com/s/monoton/v9/5h1aiZUrOngCibe4fkU.woff',
  'Philosopher': 'https://fonts.gstatic.com/s/philosopher/v9/vEFV2_5QCwIS4_Dhez5jcWBuT0s.woff',
  'Quicksand': 'https://fonts.gstatic.com/s/quicksand/v7/6xKtdSZaM9iE8KbpRA_hK1QL.woff',
  'Trirong': 'https://fonts.gstatic.com/s/trirong/v3/7r3GqXNgp8wxdOdOn4so3g.woff',
  'Trocchi': 'https://fonts.gstatic.com/s/trocchi/v6/qWcqB6WkuIDxDZLcPrxeuw.woff',
  'Advent Pro': 'https://fonts.gstatic.com/s/adventpro/v7/V8mAoQfxVT4Dvddr_yOwhTqtLg.woff',
  'Henny Penny': 'https://fonts.gstatic.com/s/hennypenny/v5/wXKvE3UZookzsxz_kjGSfPQtvXQ.woff',
  'Orbitron': 'https://fonts.gstatic.com/s/orbitron/v9/yMJRMIlzdpvBhQQL_Qq7dys.woff',
  'Sacramento': 'https://fonts.gstatic.com/s/sacramento/v5/buEzpo6gcdjy0EiZMBUG4C0f-w.woff',
  'Snowburst One': 'https://fonts.gstatic.com/s/snowburstone/v5/MQpS-WezKdujBsXY3B7I-UT7SZieOA.woff',
  'Syncopate': 'https://fonts.gstatic.com/s/syncopate/v9/pe0sMIuPIYBCpEV5eFdCBfe5.woff',
  'Wallpoet': 'https://fonts.gstatic.com/s/wallpoet/v9/f0X10em2_8RnXVVdUObp58I.woff',
  'Sirin Stencil': 'https://fonts.gstatic.com/s/sirinstencil/v6/mem4YaWwznmLx-lzGfN7MdRyRc9MAQ.woff'
}

const container = {
  hidden: { opacity: 0, y: '5%', transition: { staggerChildren: 0.05 } },
  show: {
    opacity: 1,
    y: 0,
    // height: 'auto',
    transition: { when: 'beforeChildren', duration: 0.9, staggerChildren: 0.1, stiffness: 200}
  }
}

const item = {
  hidden: { opacity: 0, y: '100%' },
  show: { opacity: 1, y: 0, transition: { type: "tween", stiffness: 200 } }
}
function List({ children, open }) {
  return (

    <motion.ul variants={container} initial="hidden" animate={open ? 'show' : 'hidden'}>
      {Children.map(children, (child) => (
        <li style={{translate: child.props.trans}}>
          <motion.div variants={item} >{child}</motion.div>
        </li>
      ))}
    </motion.ul>
  )
}

const Panel = styled.div`
  position: absolute;
  top: -850px;
  left: -1375px;
  width: 2775px;
  height: 1700px;
  pointer-events: none;
  color: antiquewhite;
  border: aqua;
  opacity: 0.85;
  caret-color: transparent;
  outline: 0;
`

const IntroH2 = styled.h2`
  position: relative;
  top: 20px;
`

const gr = 1.61803398875

export function Intro({ focused }) {
  const ref = useRef()

  console.log(focused)

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [-0.8, 0.4, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.5, 0.5, 0.5], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0.11], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  // @ts-ignore
  // @ts-ignore
  return(
    <>
      <Text
        ref={ref}
        fontSize={0.21}
        font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}
        letterSpacing={-0.025}
        position={[0, 0, 0.11]}
        fillOpacity={0}
        strokeWidth={'1%'}
        strokeColor="#fFfAf0"
      >
        {
          "Jpeg-xl Avif Heic BCN Astc\n    Jpeg2000  Jpeg  Webp \n     Png  Qoi  Exr  Hdr  Tiff\n" +
          "\n        Multi Image Codec\n  Introduction/Comparison"
        }
      </Text>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            <h2 trans="550px 950px">Larry Lin  </h2>
            <h2 trans="550px 1010px">Zhouyang He </h2>
            <h2 trans="550px 1070px">Martin Yang</h2>
            <div trans="1450px -150px">
              <h4>Compression rate</h4>
              <p>
                As digital storage continues to expand exponentially while being more cost-effective,<br/>
                the typical consumer might be less concerned about image file size. But increasing the<br/>
                compression rate still remains impactful for AI researchers, professionals in graphic,<br/>
                large-scale storage clusters, and the load of overall network traffic.
              </p>
            </div>
            <div trans="1450px -150px">
              <h4>Decoding speed</h4>
              <p>
                The speed of decoding may appear sufficient for the average user, but loading a single<br/>
                PNG might slow down the MCU in an embedded system. Even for modern PCs, the<br/>
                decoding rate can be unacceptable, as newer image codecs increase complexity by a<br/>
                factor of 10-100 or more. Also, most importantly, texture decoding has been a huge<br/>
                problem that requires GPU hardware and dedicated decoder.
              </p>
            </div>
            <div trans="1450px -150px">
              <h4>Compression Algorithm </h4>
              <p>
                Many traditional algorithms did not consider the use of progressive or block encoding<br/>
                and were not designed with parallelism in mind. Concepts like resolution and different<br/>
                scales are not considered. Additionally, insufficient metadata design during standardization<br/>
                has caused significant problems for color management and future decoding.
              </p>
            </div>
            <div trans="1450px -150px">
              <h4>Field specific support</h4>
              <p>
                Typical image codecs do not contain the information for field specific requirements<br/>
                （dynamic range, norm etc）, so that for 3d/vfx/photo/hdr,  displaying, post processing,<br/>
                layer editing, and render passing is not possible.
              </p>
            </div>
          </List>
        </Panel>
      </Html>
    </>
  )
}

export function Something({ focused }) {
  const ref = useRef()

  console.log(focused)

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [-1.1, 0.7, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.5, 0.5, 0.5], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0.11], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  return(
    <>
      <Text
        ref={ref}
        fontSize={0.21}
        font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}
        letterSpacing={-0.025}
        position={[0, 0, 0.11]}
        fillOpacity={0}
        strokeWidth={'1%'}
        strokeColor="#fFfAf0"
      >
        {
          "Others"
        }
      </Text>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            <div trans="950px 350px">
              <h3>Uncovered graphical format</h3>
              <h5>Common or used in specific field</h5>
              <p>
                gif, ico, xmb, dds, bmp, pnm, flif, rast, tga, s3tc, bc45, etc, pvrtc,<br/>
                eac, dxtc, svg, raws/container(psd/clip/ai/pdf/epsxcf/etc)
              </p>
              <h5>uncommon</h5>
              <p>
                Bgp, fits, pcx, jpeg-xr, sgi, pik, ecw, jpeg-xt, …. +100 more<br/>
                <br/>
              </p>
              <img src="/jpeg_family.png" width="952" height="532"  alt="xlc"/>
            </div>
          </List>
        </Panel>
      </Html>
    </>
  )
}

function Image({ position, scale: [s0, s1, ...sn], url}) {
  const texture = useLoader(THREE.TextureLoader, url)
  return (
    <mesh
      position={position}
      scale={[s0*0.3, s1*0.3, 1]}
    >
      <planeGeometry attach="geometry" args={[3, 3]} />
      <meshBasicMaterial attach="material" map={texture} transparent={true} />
    </mesh>
  )
}

export function JpegXl({ focused }) {
  const ref = useRef()

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [-1, 0.6, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.5, 0.5, 0.5], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  return(
    <>
      <group ref={ref}>
        <Image position={[-0.4, 0, 0.11]} scale={[0.72, 0.9, 1]} url={"/jxl.png"} />
        <Text
          fontSize={0.21}
          font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}
          letterSpacing={-0.025}
          position={[0.4, 0, 0.11]}
          fillOpacity={0}
          strokeWidth={'1%'}
          strokeColor="#fFfAf0"
        >
          {"Jpeg-xl"}
        </Text>
      </group>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            {/*<h2 trans="550px 950px">Larry Lin  </h2>*/}
            <img trans="100px 600px" src="/jxl_codec.png" width="800" height="960"  alt="xlc"/>
            <h3 trans="1350px -450px">Universal, fast enc/dec, support for lossy/lossless/frames/hdr</h3>
            <div trans="1350px -450px">
              <h3>Encode steps</h3>
              <p>
                Image to adaptive chunks for var-dct(8x8-64x64 into 4x4-8x4) (lossy)<br/>
                encode in layers of quality for progressive rendering<br/>
                Luma S LM difference color space transform(XYB)<br/>
                Locally adjusted adaptive quantization<br/>
                Block, lines, noise in compressed representation for reference<br/>
                Entropy encoding with Asymmetric Numeral System + lz77(optional)<br/>
                Weighted self correcting predictor adjusted per context with modeling (lossless)<br/>
              </p>
            </div>
          </List>
        </Panel>
      </Html>
    </>
  )
}
export function Lossless({ focused }) {
  const ref = useRef()

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [0, 0.6, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.4, 0.4, 0.4], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  return(
    <>
      <group ref={ref}>
        <Image position={[-1.5, 0, 0.11]} scale={[1, 0.8]} url={"/png.png"} />
        <Image position={[-0.5, 0, 0.11]} scale={[1.05, 0.6]} url={"/qoi.png"} />
        <Image position={[0.55, 0, 0.11]} scale={[0.94, 0.7]} url={"/avif.png"} />
        <Image position={[1.5, 0, 0.11]} scale={[1, 1]} url={"/heic.png"} />
        {/*<Text*/}
        {/*  fontSize={0.21}*/}
        {/*  font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}*/}
        {/*  letterSpacing={-0.025}*/}
        {/*  position={[0.4, 0, 0.11]}*/}
        {/*  fillOpacity={0}*/}
        {/*  strokeWidth={'1%'}*/}
        {/*  strokeColor="#fFfAf0"*/}
        {/*>*/}
        {/*  {"Jpeg-xl"}*/}
        {/*</Text>*/}
      </group>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            {/*<h2 trans="550px 950px">Larry Lin  </h2>*/}
            {/*<h3 trans="1350px -450px">Universal, fast enc/dec, support for lossy/lossless/frames/hdr</h3>*/}
            <div trans="850px 550px">
              <h3>Qoi</h3>
              <p>
                The QOI algorithm compresses RGB or RGBA<br/>
                images with 8 bits per color without any loss.
              </p>
              <img src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>
            </div>
            {/*<img trans="750px 1000px" src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>*/}
            <div trans="200px -75px">
              <h3>Png</h3>
              <p>
                PNG uses DEFLATE, a non-patented<br/>
                lossless data compression algorithm<br/>
                involving a combination of LZ77 <br/>and Huffman coding
              </p>
            </div>
            <div trans="1650px -400px">
              <h3>Avif & Heic</h3>
              <p>
                Avif and Heic are part of the Av1/Hevc encoder where the<br/>
                frame based compression are used for storing individual image<br/>
                but achieving almost double the compression ratio of Png
              </p>
              <img src="/av1_codec.png" width="960" height="701.5"  alt="xlc"/>
            </div>
          </List>
        </Panel>
      </Html>
    </>
  )
}

export function VfxAsset({ focused }) {

  const ref = useRef()

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [0, 0.7, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.4, 0.4, 0.4], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  return(
    <>
      <group ref={ref}>
        <Image position={[-0.5, 0.2, 0.11]} scale={[1.2, 0.6]} url={"/exr.png"} />
        <Image position={[0.8, 0.1, 0.11]} scale={[1, 1]} url={"/tiff.png"} />
        <Text
          fontSize={0.21}
          font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}
          letterSpacing={-0.025}
          position={[-0.5, -0.4, 0.11]}
          fillOpacity={0}
          strokeWidth={'1%'}
          strokeColor="#fFfAf0"
        >
          {"Exr   Hdr"}
        </Text>
      </group>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            {/*<h2 trans="550px 950px">Larry Lin  </h2>*/}
            {/*<h3 trans="1350px -450px">Universal, fast enc/dec, support for lossy/lossless/frames/hdr</h3>*/}
            <div trans="400px 675px">
              <h3>Exr & Hdr</h3>
              <p>
                The OpenEXR(exr) is a high dynamic range image compression that <br/>
                is often used in film and vfx. It is designed to store and accurately <br/>
                represent images with a wide range of arbitrary image channels. These <br/>
                image channels can include RGBA, luminance and sub-sampled <br/>
                chroma channels; depth, surface normal directions, motion vectors ..etc<br/>
                <br/>
                High Dynamic Range(hdr) image is a format used in film, photography<br/>
                and other industries, and hdr image files contain a wide range of <br/>
                luminance values allowing for a scene with varying levels of brightness<br/>
                and contrast. It uses floating point representation to store a wide range<br/>
                of values including very large and very small ones. Due to it is file size, <br/>
                compress algorithms are necessary to efficiently store and transmit <br/>
                images such as tone mapping algorithms.
              </p>
            </div>
            <div trans="1550px -90px">
              <h3>Exr & Hdr</h3>
              <p>
                Tagged Image File Format (TIFF) is widely utilized within the realms<br/>
                of design, photography, and desktop publishing industries. TIFF files<br/>
                are characterized by their capacity to retain detailed data, primarily<br/>
                employing lossless compression methods such as Lempel-Ziv-Welch<br/>
                compression. However, it is worth noting that due to their substantial<br/>
                file size, TIFF images are not considered optimal for implementation<br/>
                in web design or applications prefer short loading times. Alternatives<br/>
                like JPEG or PNG formats are typically favored in these contexts.
              </p>
            </div>
            {/*<img trans="750px 1000px" src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>*/}
          </List>
        </Panel>
      </Html>
    </>
  )
}

export function Textures({ focused }) {

  const ref = useRef()

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [0, 0.6, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.4, 0.4, 0.4], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  return(
    <>
      <group ref={ref}>
        <Image position={[-0.5, 0.2, 0.11]} scale={[0.82, 1.04]} url={"/texture1.png"} />
        <Image position={[0.5, 0.2, 0.11]} scale={[0.9, 0.9]} url={"/texture3.png"} />
        <Text
          fontSize={0.21}
          font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}
          letterSpacing={-0.025}
          position={[0, -0.5, 0.11]}
          fillOpacity={0}
          strokeWidth={'1%'}
          strokeColor="#fFfAf0"
        >
          {"BCn             Astc"}
        </Text>
      </group>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            {/*<h2 trans="550px 950px">Larry Lin  </h2>*/}
            {/*<h3 trans="1350px -450px">Universal, fast enc/dec, support for lossy/lossless/frames/hdr</h3>*/}
            <div trans="450px 750px">
              <h3>BCn & Astc</h3>
              <p>
                Texture compression format features fast decompression for on the fly frame and block specific decompression in multi resolution for the purpose<br/>
                of rendering, the algorithm also considers implementation in hardware but architecture might be limited (astc on arm only)
              </p>
              {/*<img src="/jpg2000_codec.png" width="754" height="496"  alt="xlc"/>*/}
            </div>
            {/*<div trans="950px -415px">*/}
            {/*  <h3>JPEG</h3>*/}
            {/*  <p>*/}
            {/*    divides an image into blocks, transforms them into the<br/>*/}
            {/*    frequency domain, quantizes high-frequency components, <br/>*/}
            {/*    and applies entropy coding. This process compromises <br/>*/}
            {/*    image quality but achieves significant compression.<br/>*/}
            {/*    <br/>*/}

            {/*  </p>*/}
            {/*  <img src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>*/}
            {/*</div>*/}
            {/*/!*<img trans="750px 1000px" src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>*!/*/}
            {/*<div trans="1800px -1200px">*/}
            {/*  <h3>WebP </h3>*/}
            {/*  <p>*/}
            {/*    is an image format specifically for web-based applications, <br/>*/}
            {/*    employing techniques of both lossless and lossy compression. <br/>*/}
            {/*    The WebP lossy compression employs the same VP8 methodology <br/>*/}
            {/*    for frame prediction.The lossless WebP encoding involves a series<br/>*/}
            {/*    of transformative operations applied to the image data.*/}
            {/*  </p>*/}
            {/*  /!*<img src="/av1_codec.png" width="960" height="701.5"  alt="xlc"/>*!/*/}
            {/*</div>*/}
          </List>
        </Panel>
      </Html>
    </>
  )

}
export function Lossy({ focused }) {

  const ref = useRef()

  useFrame((state, dt) => {
    if (focused) {
      easing.damp3((ref.current as any).position, [0, 0.6, 0.11], 0.25*gr, dt, undefined, )
      easing.damp3((ref.current as any).scale, [0.4, 0.4, 0.4], 0.25*gr, dt, undefined, )
    } else {
      easing.damp3((ref.current as any).position, [0, 0, 0], 0.2, dt, undefined, )
      easing.damp3((ref.current as any).scale, [1, 1, 1], 0.2, dt, undefined, )
    }
  })

  return(
    <>
      <group ref={ref}>
        <Image position={[-1, 0, 0.11]} scale={[0.82, 1.04]} url={"/jpg2000.png"} />
        <Image position={[-0.1, 0, 0.11]} scale={[1, 1]} url={"/jpg.png"} />
        <Image position={[0.85, 0, 0.11]} scale={[1.2, 0.475]} url={"/webp.png"} />
        {/*<Text*/}
        {/*  fontSize={0.21}*/}
        {/*  font={"https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"}*/}
        {/*  letterSpacing={-0.025}*/}
        {/*  position={[0.4, 0, 0.11]}*/}
        {/*  fillOpacity={0}*/}
        {/*  strokeWidth={'1%'}*/}
        {/*  strokeColor="#fFfAf0"*/}
        {/*>*/}
        {/*  {"Jpeg-xl"}*/}
        {/*</Text>*/}
      </group>
      <Html style={{ color: "#ddd", fontSize: "2em" }} transform scale={0.05} >
        <Panel>
          <List open={focused} >
            {/*<h2 trans="550px 950px">Larry Lin  </h2>*/}
            {/*<h3 trans="1350px -450px">Universal, fast enc/dec, support for lossy/lossless/frames/hdr</h3>*/}
            <div trans="150px 550px">
              <h3>JPEG 2000</h3>
              <p>
                uses wavelet transforms to efficiently encode<br/>
                and compress images. It offers superior image<br/>
                quality at lower bit rates compared to the original<br/>
                JPEG format and supports both lossless and lossy<br/>
                compression. JPEG 2000 is often used for medical<br/>
                imaging and archival purposes.
              </p>
              <img src="/jpg2000_codec.png" width="754" height="496"  alt="xlc"/>
            </div>
            <div trans="950px -415px">
              <h3>JPEG</h3>
              <p>
                divides an image into blocks, transforms them into the<br/>
                frequency domain, quantizes high-frequency components, <br/>
                and applies entropy coding. This process compromises <br/>
                image quality but achieves significant compression.<br/>
                <br/>

              </p>
              <img src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>
            </div>
            {/*<img trans="750px 1000px" src="/qoi_codec.png" width="544" height="366"  alt="xlc"/>*/}
            <div trans="1800px -1200px">
              <h3>WebP </h3>
              <p>
                is an image format specifically for web-based applications, <br/>
                employing techniques of both lossless and lossy compression. <br/>
                The WebP lossy compression employs the same VP8 methodology <br/>
                for frame prediction.The lossless WebP encoding involves a series<br/>
                of transformative operations applied to the image data.
              </p>
              {/*<img src="/av1_codec.png" width="960" height="701.5"  alt="xlc"/>*/}
            </div>
          </List>
        </Panel>
      </Html>
    </>
  )
}