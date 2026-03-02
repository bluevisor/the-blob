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

    // Center = looking deep into tunnel (far), edges = tunnel walls (near)
    // Dim the center to sell depth, brighten edges where walls are close
    float r = length(u - uTilt);
    float depthFade = smoothstep(0.15, 1.1, r);
    gl_FragColor = o * 0.2 * depthFade;
  }
`

// Damping — lower = smoother/slower (iOS springboard feel)
const DAMPING = 0.04
// UV offset per degree of tilt
const TILT_SCALE = 0.0012
// Max tilt range in degrees (clamp to avoid extreme offsets)
const MAX_TILT = 25
// Dead zone in degrees to kill sensor jitter
const DEAD_ZONE = 0.8

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

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
    let smoothGamma = 0
    let smoothBeta = 0

    const onOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0  // left-right: -90 to 90
      const beta = e.beta ?? 0    // front-back: -180 to 180

      // iPhone held upright → beta ~90. Subtract to get deviation from neutral.
      const tiltX = clamp(gamma, -MAX_TILT, MAX_TILT)
      const tiltY = clamp(beta - 90, -MAX_TILT, MAX_TILT)

      // Dead zone — ignore tiny sensor noise
      if (Math.abs(tiltX - smoothGamma) > DEAD_ZONE) smoothGamma = tiltX
      if (Math.abs(tiltY - smoothBeta) > DEAD_ZONE) smoothBeta = tiltY

      // Opposite direction: tilt left → bg shifts right (iOS springboard parallax)
      targetTilt.current.set(
        -smoothGamma * TILT_SCALE,
        smoothBeta * TILT_SCALE
      )
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
