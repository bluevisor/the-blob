'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei'
import * as THREE from 'three'

export default function TheBlob() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    // Slow continuous self-rotation
    meshRef.current.rotation.y += delta * 0.03
    meshRef.current.rotation.x += delta * 0.05

    // Gentle breathing pulse (~0.3 Hz)
    const s = 1 + Math.sin(t * 0.3) * 0.03
    meshRef.current.scale.set(s, s, s)
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
      <Sphere ref={meshRef} args={[1.5, 128, 128]}>
        <MeshDistortMaterial 
          color="#e0ddd6"
          speed={1.8}
          distort={0.42}
          radius={2}
          metalness={0.1}
          roughness={0.3}
          emissive="#ffffff"
          emissiveIntensity={0.02}
        />
      </Sphere>
    </Float>
  )
}
