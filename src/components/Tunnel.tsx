'use client'

import { useRef, useMemo, useEffect } from 'react'
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
  uniform vec2 uTilt;

  void main() {
    float d = 0.0, s;
    float t = uTime;
    vec2 u = (gl_FragCoord.xy - uResolution / 2.0) / uResolution.y;
    u += uTilt;
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
    vec4 v = o / 8e3 / length(u - uTilt);
    vec4 e = exp(2.0 * v);
    o = (e - 1.0) / (e + 1.0);

    // Depth fog — brighter as distance increases (tunnel coming toward camera)
    float fog = exp(-d * 0.02);
    gl_FragColor = o * 0.3 * fog;
  }
`

// Damping factor — lower = smoother/slower (0 = frozen, 1 = instant)
const DAMPING = 0.015
// How much tilt maps to UV offset
const TILT_SCALE = 0.001
// Ignore gyro readings below this threshold (degrees) to kill jitter
const DEAD_ZONE = 1.5

export default function Tunnel() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const targetTilt = useRef(new THREE.Vector2())
  const currentTilt = useRef(new THREE.Vector2())

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uTilt: { value: new THREE.Vector2() },
  }), [])

  useEffect(() => {
    let prevGamma = 0
    let prevBeta = 0

    const onOrientation = (e: DeviceOrientationEvent) => {
      let gamma = e.gamma ?? 0
      let beta = e.beta ?? 0

      // Dead zone — ignore tiny movements
      if (Math.abs(gamma - prevGamma) < DEAD_ZONE) gamma = prevGamma
      else prevGamma = gamma

      if (Math.abs(beta - prevBeta) < DEAD_ZONE) beta = prevBeta
      else prevBeta = beta

      targetTilt.current.set(gamma * TILT_SCALE, -beta * TILT_SCALE)
    }
    window.addEventListener('deviceorientation', onOrientation)
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [])

  useFrame((state) => {
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    const dpr = state.gl.getPixelRatio()
    materialRef.current.uniforms.uResolution.value.set(
      state.size.width * dpr,
      state.size.height * dpr
    )

    // Damped lerp toward target tilt
    currentTilt.current.lerp(targetTilt.current, DAMPING)
    materialRef.current.uniforms.uTilt.value.copy(currentTilt.current)
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
