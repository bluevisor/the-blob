'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import TheBlob from './TheBlob'

export default function Scene() {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: false }}>
      <color attach="background" args={['#000000']} />
      
      <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={45} />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
      
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
          luminanceThreshold={0.9} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4} 
        />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  )
}
