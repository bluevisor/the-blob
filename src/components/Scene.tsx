'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { useEffect } from 'react'
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

export default function Scene({ onReady }: { onReady?: () => void }) {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: false }} onCreated={() => onReady?.()}>
      <color attach="background" args={['#000000']} />

      <ResponsiveCamera />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
      
      <Tunnel />
      <TheBlob />
      
      <Environment preset="studio" />
      
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.4} 
        scale={20} 
        blur={2} 
        far={4.5} 
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          mipmapBlur
          intensity={1.2}
          radius={0.6}
        />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}
