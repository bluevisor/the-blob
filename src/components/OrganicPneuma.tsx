'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei'
import * as THREE from 'three'

export default function OrganicPneuma() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    meshRef.current.rotation.x = Math.cos(t / 4) / 8
    meshRef.current.rotation.y = Math.sin(t / 4) / 8
    meshRef.current.rotation.z = Math.sin(t / 4) / 8
    
    // Pulse scale
    const s = 1 + Math.sin(t * 1.5) * 0.05
    meshRef.current.scale.set(s, s, s)
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 128, 128]}>
        <MeshDistortMaterial 
          color="#f5f2eb" 
          speed={3} 
          distort={0.4} 
          radius={1}
          metalness={0.1}
          roughness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.05}
        />
      </Sphere>
    </Float>
  )
}
