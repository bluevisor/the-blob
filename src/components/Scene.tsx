'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { Environment, ContactShadows, PerspectiveCamera, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping, DepthOfField } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import TheBlob from './TheBlob'
import Tunnel from './Tunnel'

function ResponsiveCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    // Widen FOV on narrow (portrait) screens to zoom out
    ;(camera as THREE.PerspectiveCamera).fov = aspect < 1 ? 65 : 45
    camera.updateProjectionMatrix()
  }, [camera, size])

  return <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={45} />
}

function DebugReporter({ onReport }: { onReport: (info: Record<string, string>) => void }) {
  const { gl, scene } = useThree()

  useEffect(() => {
    const lights = scene.children.filter((c) => c instanceof THREE.Light)
    const lightInfo = lights.map(
      (l) => `${l.type}(${(l as THREE.Light).intensity.toFixed(2)})`
    ).join(', ')

    onReport({
      toneMapping: String(gl.toneMapping),
      toneMappingExposure: String(gl.toneMappingExposure),
      outputColorSpace: gl.outputColorSpace,
      lights: lightInfo,
    })
  }, [gl, scene, onReport])

  return null
}

export default function Scene({ onReady, debug }: { onReady?: () => void; debug?: boolean }) {
  const [debugInfo, setDebugInfo] = useState<Record<string, string>>({})

  return (
    <>
      <Canvas dpr={[1, 2]} gl={{ antialias: true }} onCreated={() => onReady?.()}>
        <color attach="background" args={['#000000']} />

        <ResponsiveCamera />
        {debug && <DebugReporter onReport={setDebugInfo} />}

        {/* Key light — large overhead softbox */}
        <spotLight
          position={[0, 12, 4]}
          angle={0.6}
          penumbra={1}
          intensity={0.8}
          castShadow
          shadow-mapSize={1024}
        />
        {/* Fill — soft bounce from left */}
        <pointLight position={[-8, 2, 6]} intensity={0.15} color="#f0ede6" />
        {/* Accent/rim — from right, slightly behind */}
        <spotLight
          position={[8, 4, -2]}
          angle={0.4}
          penumbra={0.8}
          intensity={0.5}
          color="#ffffff"
        />
        {/* Minimal ambient for shadow depth */}
        <ambientLight intensity={0.05} />

        <Tunnel />
        <TheBlob />

        <Environment environmentIntensity={0.4}>
          {/* Large overhead softbox panel */}
          <Lightformer
            form="rect"
            intensity={2}
            position={[0, 5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[10, 6, 1]}
            color="#ffffff"
          />
          {/* Left fill reflector */}
          <Lightformer
            form="rect"
            intensity={0.5}
            position={[-6, 1, 2]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[4, 6, 1]}
            color="#f0ede6"
          />
          {/* Right accent */}
          <Lightformer
            form="circle"
            intensity={1.5}
            position={[6, 3, -1]}
            rotation={[0, -Math.PI / 3, 0]}
            scale={3}
            color="#ffffff"
          />
        </Environment>

        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.8}
          scale={20}
          blur={2}
          far={4.5}
        />

        <EffectComposer enableNormalPass={false}>
          <DepthOfField
            target={[0, 0, 0]}
            focusDistance={0.016}
            focalLength={0.05}
            bokehScale={8}
          />
          <Bloom
            luminanceThreshold={0}
            mipmapBlur
            intensity={0.8}
            radius={0.8}
          />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
          <ToneMapping mode={ToneMappingMode.AGX} />
        </EffectComposer>
      </Canvas>

      {debug && Object.keys(debugInfo).length > 0 && (
        <div className="fixed top-12 left-4 z-[300] bg-black/80 text-green-400 text-[10px] font-mono p-3 rounded space-y-1 pointer-events-none">
          <div className="text-white font-bold mb-1">DEBUG</div>
          {Object.entries(debugInfo).map(([k, v]) => (
            <div key={k}>{k}: {v}</div>
          ))}
          <div className="border-t border-green-800 mt-2 pt-2 text-white font-bold">Post-Processing</div>
          <div>bloom.threshold: 0</div>
          <div>bloom.intensity: 0.8</div>
          <div>bloom.radius: 0.8</div>
          <div>toneMapping: AGX</div>
          <div className="border-t border-green-800 mt-2 pt-2 text-white font-bold">Material</div>
          <div>color: #e0ddd6</div>
          <div>emissive: #e0ddd6</div>
          <div>emissiveIntensity: 0.1</div>
          <div>metalness: 0.1</div>
          <div>roughness: 0.3</div>
        </div>
      )}
    </>
  )
}
