'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;

  void main() {
    float d = 0.0, s;
    float t = uTime;
    vec2 u = (gl_FragCoord.xy - uResolution / 2.0) / uResolution.y;
    vec4 o = vec4(0.0);

    for (float i = 0.0; i < 40.0; i++) {
      vec3 p = vec3(u * d, d + t + t);
      p.xy *= mat2(cos(p.z * 0.2 + vec4(0.0, 33.0, 11.0, 0.0)));
      s = sin(p.y + p.x);
      for (float n = 1.0; n < 8.0; n += n)
        s -= abs(dot(cos(0.3 * t + p * n), vec3(0.3))) / n;
      s = 0.01 + abs(s) * 0.8;
      d += s;
      o += 1.0 / s;
    }

    // tanh tone mapping (manual for GLSL ES 1.0 compat)
    vec4 v = o / 8e3 / length(u);
    vec4 e = exp(2.0 * v);
    o = (e - 1.0) / (e + 1.0);

    gl_FragColor = o * 0.5;
  }
`

export default function Tunnel() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
  }), [])

  useFrame((state) => {
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    const dpr = state.gl.getPixelRatio()
    materialRef.current.uniforms.uResolution.value.set(
      state.size.width * dpr,
      state.size.height * dpr
    )
  })

  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[40, 40]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}
