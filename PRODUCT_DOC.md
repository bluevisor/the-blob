# The Blob — Product & Architecture Documentation

> Date written: March 2026 · Author: Antigravity

---

## 1. Project Identity

**The Blob** is an interactive, browser-native **3D experience** built by
John Zheng with AI assistance (Gemini 3.1 + Claude). The project explores organic, breathing
aesthetics through modern WebGL tooling — a single living form rendered in the
browser with a cinematic, atmospheric presentation.

The tagline printed on screen:

> _"An organic visualization exploring the intersection of geometry and life."_

---

## 2. Vision & Goals

| Goal                     | Details                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| **Browser-native WebGL** | No native app, no Unity WebGL build — pure Three.js / R3F        |
| **Organic realism**      | A living, breathing 3D form — not static geometry                |
| **Minimal UI**           | The scene _is_ the product; the 2D UI is a thin, atmospheric HUD |
| **Performance**          | Smooth 60 FPS on modern hardware via optimized rendering         |
| **Mobile-first**         | Responsive camera, touch support, gyroscope parallax, PWA-ready  |

---

## 3. Technology Stack

### 3.1 Core Framework

| Layer                 | Technology                                           | Version |
| --------------------- | ---------------------------------------------------- | ------- |
| Application framework | **Next.js** (App Router)                             | 16.1.6  |
| UI library            | **React**                                            | 19.2.3  |
| Language              | **TypeScript**                                       | ^5      |
| Styling               | **Tailwind CSS v4** (PostCSS plugin)                 | ^4      |
| Font                  | **Geist Sans + Geist Mono** (via `next/font/google`) | —       |

### 3.2 3D Rendering Stack

| Library                         | Role                                                                                                                                  | Version  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Three.js**                    | Core WebGL engine — scene graph, math, render loop                                                                                    | ^0.183.2 |
| **@react-three/fiber (R3F)**    | Declarative React renderer for Three.js                                                                                               | ^9.5.0   |
| **@react-three/drei**           | Pre-built abstractions: `Sphere`, `Float`, `MeshDistortMaterial`, `Environment`, `Lightformer`, `ContactShadows`, `PerspectiveCamera` | ^10.7.7  |
| **@react-three/postprocessing** | Effect composer integration for R3F                                                                                                   | ^3.0.4   |
| **postprocessing**              | Core shader pass library (Bloom, DepthOfField, Noise, Vignette, ToneMapping)                                                         | ^6.38.3  |

### 3.3 Custom GLSL

The raymarched tunnel background (`Tunnel.tsx`) uses hand-written **GLSL ES 1.0** vertex and fragment shaders, rendered onto a full-screen plane via Three.js `ShaderMaterial`. Uniforms (`uTime`, `uResolution`, `uTilt`) are updated per-frame from the R3F `useFrame` hook.

### 3.4 Device APIs

| API                          | Usage                                                   |
| ---------------------------- | ------------------------------------------------------- |
| **DeviceOrientationEvent**   | Gyroscope input for iOS springboard-style parallax       |
| **Fullscreen API**           | Enter fullscreen on click/tap (with webkit prefix)       |
| **Web App Manifest**         | PWA `display: fullscreen` for mobile home screen install |
| **Apple Web App meta tags**  | iOS standalone mode with `black-translucent` status bar  |

### 3.5 Notable Design Choices

- **Antialias enabled** on the WebGL canvas — post-processing handles additional
  smoothing.
- **DPR clamped to `[1, 2]`** — renders natively on Retina displays without
  exceeding 2× pixel density, keeping GPU budget predictable.
- **`touch-action: none`** on canvas — prevents browser scroll/zoom interference
  on touch devices.
- **`overflow: hidden`** on body — enforces a true fullscreen viewport; no
  scroll bars ever appear.
- **`h-dvh`** (dynamic viewport height) — handles iOS Safari's collapsing
  address bar correctly.
- **AGX tone mapping** via the postprocessing pipeline — filmic color response
  applied as a post-processing effect (not renderer-level).

---

## 4. Application Architecture

```
the-blob/
├── src/
│   ├── app/
│   │   ├── layout.tsx       ← Root layout: fonts, metadata, PWA meta tags
│   │   ├── page.tsx         ← Single page: entry screen, Scene, UI overlay, grain
│   │   ├── manifest.ts      ← Web App Manifest (PWA fullscreen mode)
│   │   └── globals.css      ← CSS variables, resets, body/canvas rules
│   └── components/
│       ├── Scene.tsx        ← R3F Canvas, camera, lighting, environment, post-processing, debug
│       ├── TheBlob.tsx      ← The central 3D organism
│       └── Tunnel.tsx       ← Raymarched GLSL tunnel background with gyro parallax
├── public/                  ← Favicons and app icons (all sizes)
├── favicon.png              ← Source favicon image
├── package.json
├── next.config.ts
└── tsconfig.json
```

The entire application is a **single-page experience** — one route,
one view, no navigation.

---

## 5. Page Structure (`page.tsx`)

The page uses stacked absolute-positioned full-screen layers, controlled
via z-index:

```
z-200 ┌──────────────────────────────────────────────────────┐
      │  Click/Tap to Enter overlay (removed after entry)    │
      └──────────────────────────────────────────────────────┘
z-100 ┌──────────────────────────────────────────────────────┐
      │  Fade-in overlay (black → transparent, 2s ease)      │
      └──────────────────────────────────────────────────────┘
z-50  ┌──────────────────────────────────────────────────────┐
      │  Grain / Noise Overlay (SVG texture, mix-blend)      │
      └──────────────────────────────────────────────────────┘
z-10  ┌──────────────────────────────────────────────────────┐
      │  2D UI HUD Overlay (pointer-events-none)             │
      │  ┌─────────────────────────────────────────────────┐ │
      │  │  HEADER: "THE BLOB // 2026"   [⛶ fullscreen]   │ │
      │  └─────────────────────────────────────────────────┘ │
      │                                                       │
      │  ┌─────────────────────────────────────────────────┐ │
      │  │  FOOTER: "the blob" h1 title                     │ │
      │  │  Description + "coded by Gemini 3.1 // John Zheng"│ │
      │  └─────────────────────────────────────────────────┘ │
      └──────────────────────────────────────────────────────┘
z-0   ┌──────────────────────────────────────────────────────┐
      │  3D WebGL Scene (fills viewport)                     │
      └──────────────────────────────────────────────────────┘
```

### 5.1 Entry Flow

1. Page loads → solid black fade overlay covers everything
2. Canvas initializes → "Click to enter" (desktop) or "Tap to enter" (touch) prompt appears
3. User interacts → fullscreen requested, gyro permission requested (iOS), fade overlay transitions to transparent over 2 seconds

### 5.2 UI Typography System

All UI text is rendered in a deliberate **minimal HUD aesthetic**:

| Element               | Style                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Header labels         | `text-[10px]`/`text-xs`, `tracking-[0.4em]`, `uppercase`, 50% opacity      |
| `<h1>` title          | `text-4xl`/`5xl`/`8xl` responsive, `font-thin`, `tracking-tighter`, `lowercase` |
| Description body      | `text-[10px]`, `uppercase`, `tracking-widest`, 40% opacity                  |
| Author credit         | `text-right`, `text-[10px]`, 30% opacity                                    |

The entire UI has `pointer-events-none` — it never blocks interaction with the
3D canvas below. The fullscreen button has `pointer-events-auto` to remain clickable.

### 5.3 Responsive Layout

- Padding scales with breakpoints: `p-4` → `p-6` → `p-8`
- UI inset from edges: `inset-2` → `inset-3` → `inset-4`
- Safe area insets for notch/home indicator via `env(safe-area-inset-*)`
- Text sizes scale responsively

### 5.4 Grain Overlay

A full-screen SVG noise texture (`grainy-gradients.vercel.app/noise.svg`) is
applied at `opacity-20` with `mix-blend-overlay`. This adds analogue film grain
to the final composited image without touching the WebGL renderer.

---

## 6. 3D Scene (`Scene.tsx`)

The `Scene` component wraps everything in an R3F `<Canvas>` and establishes the
full 3D environment.

### 6.1 Responsive Camera

```tsx
<PerspectiveCamera makeDefault position={[0, 0, 16]} fov={45} />
```

- Position: 16 units back on the Z-axis, centered on origin
- FOV: 45° on landscape, widens to 65° on portrait (mobile) for zoom-out effect
- FOV adapts reactively on resize via `useThree` + `useEffect`

### 6.2 Product Photography Lighting

The scene uses a product photography lighting setup with three lights plus custom environment lightformers:

| Light               | Position        | Properties                                              |
| ------------------- | --------------- | ------------------------------------------------------- |
| Key (overhead)      | `[0, 12, 4]`   | Spotlight, `angle=0.6`, `penumbra=1`, `intensity=0.8`   |
| Fill (left bounce)  | `[-8, 2, 6]`   | Point light, `intensity=0.15`, warm `#f0ede6`           |
| Accent/rim (right)  | `[8, 4, -2]`   | Spotlight, `angle=0.4`, `penumbra=0.8`, `intensity=0.4` |
| Ambient             | Global          | `intensity=0.05` — minimal fill for deep shadows        |

### 6.3 Custom Environment (IBL)

Instead of a preset, the scene uses a custom `<Environment>` with three `Lightformer` elements:

| Lightformer        | Form   | Position      | Scale       | Intensity | Purpose                   |
| ------------------ | ------ | ------------- | ----------- | --------- | ------------------------- |
| Overhead softbox   | rect   | `[0, 5, 0]`  | `[10,6,1]`  | 2.0       | Large, soft key reflection |
| Left fill reflector| rect   | `[-6, 1, 2]` | `[4,6,1]`   | 0.5       | Warm bounce card           |
| Right accent       | circle | `[6, 3, -1]` | 3           | 1.5       | Rim/specular highlight     |

Environment intensity: `0.4` — subdued so custom lightformers dominate.

### 6.4 Contact Shadows

```tsx
<ContactShadows position={[0, -2.5, 0]} opacity={0.8} scale={20} blur={2} far={4.5} />
```

A screen-space shadow plane sits 2.5 units below the scene origin, grounding the floating organism.

### 6.5 Post-Processing Pipeline

```
Raw Render → DepthOfField → Bloom → Noise → Vignette → ToneMapping → Screen
```

| Effect            | Config                                                                | Purpose                                                      |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| **DepthOfField**  | `target=[0,0,0]`, `focusDistance=0.016`, `focalLength=0.05`, `bokehScale=8` | Cinematic shallow DoF — blob sharp, background blurred |
| **Bloom**         | `luminanceThreshold=0`, `mipmapBlur`, `intensity=2.0`, `radius=0.6`, `levels=7` | Strong glow halo around the bright blob             |
| **Noise**         | `opacity=0.05`                                                        | Subtle pixel grain layered with CSS grain                    |
| **Vignette**      | `offset=0.25`, `darkness=0.7`                                         | Gentle corner darkening, pulls focus to center               |
| **ToneMapping**   | `mode=AGX`                                                            | Filmic tone curve for natural highlight rolloff              |

### 6.6 Debug Mode

Accessible via `/?debug=true`. Renders a fixed overlay displaying:
- Renderer settings (toneMapping, exposure, colorSpace)
- Light types and intensities
- Post-processing parameters
- Material properties

---

## 7. The Organism: `TheBlob.tsx`

The `TheBlob` component is the hero of the experience — the single primary 3D
element visible in the scene.

### 7.1 Geometry & Material

```tsx
<Sphere args={[1.5, 128, 128]}>
  <MeshDistortMaterial
    color="#e0ddd6"
    speed={1.8}
    distort={0.42}
    radius={1.9}
    metalness={0.1}
    roughness={0.3}
    emissive="#e0ddd6"
    emissiveIntensity={0.6}
  />
</Sphere>
```

- **Geometry:** A UV sphere with radius 1.5 and 128×128 vertex subdivisions
- **Material:** `MeshDistortMaterial` (drei) continuously displaces vertices on the GPU using simplex noise
- **Color:** `#e0ddd6` — a muted warm grey, darker than the original cream
- **Emissive:** Self-glow at 0.6 intensity matching the surface color for even bloom coverage

### 7.2 Animation — `useFrame`

```tsx
// Slow continuous self-rotation
meshRef.current.rotation.y += delta * 0.1
meshRef.current.rotation.x += delta * 0.15

// Gentle breathing pulse (~0.3 Hz)
const s = 1 + Math.sin(t * 0.3) * 0.03
meshRef.current.scale.set(s, s, s)
```

- **Rotation:** Delta-based continuous rotation on X and Y axes
- **Scale (pulse):** A 0.3 Hz sine wave causes ±3% breathing

### 7.3 Float Wrapper

```tsx
<Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
```

Secondary layer of gentle positional bobbing and rotational drift.

---

## 8. Tunnel Background: `Tunnel.tsx`

A full-screen raymarched tunnel rendered via custom GLSL shaders on a plane at `z=-10`.

### 8.1 Shader Architecture

- **Vertex shader:** Pass-through (standard MVP transform)
- **Fragment shader:** Raymarching with 40 iterations, fractal noise (3 octaves of cosine FBM), depth-dependent rotation for tunnel twist effect
- **Uniforms:** `uTime` (elapsed time), `uResolution` (viewport size × DPR), `uTilt` (gyroscope offset)
- **Depth fade:** `smoothstep(0.15, 1.1, r)` dims the center (looking deep into tunnel) and brightens edges (nearby walls)
- **Output:** `o * 0.2 * depthFade` — intentionally subdued to not compete with the blob

### 8.2 Gyroscope Parallax (iOS Springboard Style)

The tunnel responds to device orientation for a parallax effect matching iOS's springboard behavior:

| Parameter     | Value   | Purpose                                          |
| ------------- | ------- | ------------------------------------------------ |
| `DAMPING`     | 0.04    | Lerp rate per frame — smooth, responsive feel    |
| `TILT_SCALE`  | 0.0012  | UV offset per degree of device tilt              |
| `MAX_TILT`    | 25°     | Clamp to prevent extreme offsets                 |
| `DEAD_ZONE`   | 0.8°    | Ignore sub-degree sensor noise                   |

- **Neutral position:** `beta - 90` (phone held upright)
- **Direction:** Inverted — tilt left → background shifts right (parallax)
- **iOS permission:** `DeviceOrientationEvent.requestPermission()` called on user tap

---

## 9. PWA & Mobile Support

### 9.1 Web App Manifest (`manifest.ts`)

```ts
display: 'fullscreen'
background_color: '#000000'
theme_color: '#000000'
```

When installed to home screen on Android/iOS, the app runs in true fullscreen.

### 9.2 Apple Web App Meta

```tsx
appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "THE BLOB",
}
```

### 9.3 Fullscreen Strategy

| Platform        | Method                                              |
| --------------- | --------------------------------------------------- |
| Desktop Chrome  | `document.documentElement.requestFullscreen()`       |
| Desktop Safari  | `webkitRequestFullscreen()` fallback                 |
| Android Chrome  | Fullscreen API + PWA manifest                        |
| iOS Safari      | PWA "Add to Home Screen" (no JS fullscreen API)      |

---

## 10. Favicons & Icons

Generated from `favicon.png` using ImageMagick:

| File                        | Size    |
| --------------------------- | ------- |
| `favicon.ico`               | 16+32+48 (multi-size ICO) |
| `favicon-16x16.png`         | 16×16   |
| `favicon-32x32.png`         | 32×32   |
| `apple-icon.png`            | 180×180 |
| `android-chrome-192x192.png`| 192×192 |
| `android-chrome-512x512.png`| 512×512 |

---

## 11. Design System

### 11.1 Color Palette

| Variable    | Hex       | Usage                                |
| ----------- | --------- | ------------------------------------ |
| `--c-black` | `#000000` | Background, body, canvas clear color |
| `--c-white` | `#ffffff` | Text, UI elements                    |
| `--c-cream` | `#f5f2eb` | CSS variable (blob uses `#e0ddd6`)   |

### 11.2 Typography

| Weight/Style       | Usage                                               |
| ------------------ | --------------------------------------------------- |
| Geist Sans         | All body/UI text (loaded via `next/font`)           |
| Geist Mono         | Available via CSS variable for technical readouts   |
| `font-thin`        | Large hero title to keep it from being overpowering |
| `tracking-[0.4em]` | Long-tracked uppercase labels for HUD readouts      |

---

## 12. Development Setup

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
# → http://localhost:3000

# Debug mode
# → http://localhost:3000/?debug=true

# Build for production
npm run build

# Run production server
npm start

# Lint
npm run lint
```

> Deployment is straightforward — push to Git and deploy via Vercel's Git integration.
