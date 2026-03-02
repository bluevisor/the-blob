# The Blob — Product & Architecture Documentation

> Date written: March 2026 · Author: Antigravity

---

## 1. Project Identity

**The Blob** is an interactive, browser-native **3D experience**
built by _bluevisor_ (credited as "tars"). The project explores organic,
breathing aesthetics through modern WebGL tooling — a single living form
rendered in the browser with a cinematic, atmospheric presentation.

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

---

## 3. Technology Stack

### 3.1 Core Framework

| Layer                 | Technology                                           | Version |
| --------------------- | ---------------------------------------------------- | ------- |
| Application framework | **Next.js** (App Router)                             | 16.1.6  |
| UI library            | **React**                                            | 19.2.3  |
| Language              | **TypeScript**                                       | ^5      |
| Styling               | **Tailwind CSS v4**                                  | ^4      |
| Font                  | **Geist Sans + Geist Mono** (via `next/font/google`) | —       |

### 3.2 3D Rendering Stack

| Library                         | Role                                                                                                                   | Version  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| **Three.js**                    | Core WebGL engine — scene graph, math, render loop                                                                     | ^0.183.2 |
| **@react-three/fiber (R3F)**    | Declarative React renderer for Three.js                                                                                | ^9.5.0   |
| **@react-three/drei**           | Pre-built abstractions: `Sphere`, `Float`, `MeshDistortMaterial`, `Environment`, `ContactShadows`, `PerspectiveCamera` | ^10.7.7  |
| **@react-three/postprocessing** | Effect composer integration for R3F                                                                                    | ^3.0.4   |
| **postprocessing**              | Core shader pass library (Bloom, Noise, Vignette)                                                                      | ^6.38.3  |

### 3.3 Notable Design Choices

- **`antialias: false`** on the WebGL canvas — intentional; post-processing
  passes handle edge smoothing and artistic noise, avoiding the GPU cost of
  MSAA.
- **DPR clamped to `[1, 2]`** — renders natively on Retina displays without
  exceeding 2× pixel density, keeping GPU budget predictable.
- **`touch-action: none`** on canvas — prevents browser scroll/zoom interference
  on touch devices.
- **`overflow: hidden`** on body — enforces a true fullscreen viewport; no
  scroll bars ever appear.

---

## 4. Application Architecture

```
the-blob/
├── src/
│   ├── app/
│   │   ├── layout.tsx       ← Root layout: fonts, metadata, global CSS
│   │   ├── page.tsx         ← Single page: Scene layer + UI overlay layer
│   │   └── globals.css      ← CSS variables, resets, body/canvas rules
│   └── components/
│       ├── Scene.tsx        ← R3F Canvas, camera, lights, post-processing
│       └── TheBlob.tsx      ← The central 3D organism
├── public/                  ← Static SVG assets (Next.js defaults)
├── package.json
├── next.config.ts
└── tsconfig.json
```

The entire application is currently a **single-page experience** — one route,
one view, no navigation. The architecture is deliberately lean, with only two
custom components: `Scene` and `TheBlob`.

---

## 5. Page Structure (`page.tsx`)

The page uses three stacked absolute-positioned full-screen layers, controlled
via z-index:

```
z-50  ┌──────────────────────────────────────────────────────┐
      │  Grain / Noise Overlay (SVG texture, mix-blend)      │
      └──────────────────────────────────────────────────────┘
z-10  ┌──────────────────────────────────────────────────────┐
      │  2D UI HUD Overlay (pointer-events-none)             │
      │  ┌─────────────────────────────────────────────────┐ │
      │  │  HEADER: "THE BLOB // 2026"   "WEB EDITION"      │ │
      │  └─────────────────────────────────────────────────┘ │
      │                                                       │
      │  ┌─────────────────────────────────────────────────┐ │
      │  │  FOOTER: "the blob" h1 title                     │ │
      │  │  Description text + "coded by tars // bluevisor"│ │
      │  └─────────────────────────────────────────────────┘ │
      └──────────────────────────────────────────────────────┘
z-0   ┌──────────────────────────────────────────────────────┐
      │  3D WebGL Scene (fills viewport)                     │
      └──────────────────────────────────────────────────────┘
```

### 5.1 UI Typography System

All UI text is rendered in a deliberate **minimal HUD aesthetic**:

| Element                | Style                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| Header labels          | `text-xs`, `tracking-[0.4em]`, `uppercase`, 50% opacity                   |
| `<h1>` title           | `text-5xl` (→ `8xl` on md+), `font-thin`, `tracking-tighter`, `lowercase` |
| `"the blob"` subtitle  | 30% opacity — a ghost of the parent label                                 |
| Description body       | `text-[10px]`, `uppercase`, `tracking-widest`, 40% opacity                |
| Author credit          | `text-right`, `text-[10px]`, 30% opacity                                  |

The entire UI has `pointer-events-none` — it never blocks interaction with the
3D canvas below.

### 5.2 Grain Overlay

A full-screen SVG noise texture (`grainy-gradients.vercel.app/noise.svg`) is
applied at `opacity-20` with `mix-blend-overlay`. This adds analogue film grain
to the final composited image without touching the WebGL renderer, reinforcing
the vintage aesthetic.

---

## 6. 3D Scene (`Scene.tsx`)

The `Scene` component wraps everything in an R3F `<Canvas>` and establishes the
full 3D environment.

### 6.1 Camera

```tsx
<PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />;
```

- Position: 5 units back on the Z-axis, centered on origin
- FOV: 45° — tighter than a typical game camera, giving a slightly "compressed"
  telephoto look that makes the organism feel more monumental

### 6.2 Lighting

Three light sources illuminate the scene:

| Light          | Position          | Properties                                                           |
| -------------- | ----------------- | -------------------------------------------------------------------- |
| `ambientLight` | Global            | `intensity={0.2}` — very dim base fill                               |
| `spotLight`    | `[10, 10, 10]`    | `angle={0.15}`, `penumbra={1}`, `intensity={1}`, casts shadows       |
| `pointLight`   | `[-10, -10, -10]` | `intensity={0.5}`, white — backfill to prevent pure black silhouette |

This three-point lighting setup (dominant spot, ambient fill, backlight) is a
standard cinematic rig adapted for the scene's dark, high-contrast palette.

### 6.3 Environment

```tsx
<Environment preset="studio" />;
```

A studio IBL (Image-Based Lighting) environment map is applied to give the
distorted sphere physically realistic reflections, capturing soft light and
shadow detail on its surface even without explicit surface lights hitting it
directly.

### 6.4 Contact Shadows

```tsx
<ContactShadows
    position={[0, -2.5, 0]}
    opacity={0.4}
    scale={20}
    blur={2}
    far={4.5}
/>;
```

A screen-space shadow plane sits 2.5 units below the scene origin, catching a
soft, blurred shadow from the floating organism. This grounds the otherwise
floating object and adds significant depth.

### 6.5 Post-Processing Pipeline

The `EffectComposer` applies three shader passes to the raw render:

```
Raw Render → Bloom → Noise → Vignette → Screen
```

| Effect       | Config                                                                      | Purpose                                                                                     |
| ------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Bloom**    | `luminanceThreshold={0.9}`, `mipmapBlur`, `intensity={1.5}`, `radius={0.4}` | Causes very bright surfaces to "bleed" light outward — the cream-white surface gently halos |
| **Noise**    | `opacity={0.05}`                                                            | Adds subtle pixel grain to the post-processed output (layered on top of the CSS grain)      |
| **Vignette** | `offset={0.1}`, `darkness={1.1}`                                            | Darkens screen edges, pulling focus toward center                                           |

> **Note:** `disableNormalPass` is set on `EffectComposer` — this skips the
> generation of a G-buffer normal texture, saving GPU memory and bandwidth since
> none of the active effects require it (DoF is not in use here).

---

## 7. The Organism: `TheBlob`

The `TheBlob` component is the hero of the experience — the single primary
3D element visible in the scene.

### 7.1 Geometry & Material

```tsx
<Sphere args={[1, 128, 128]}>
    <MeshDistortMaterial
        color="#f5f2eb" // warm cream/off-white
        speed={3} // distortion animation speed
        distort={0.4} // distortion amplitude (0=none, 1=max)
        radius={1}
        metalness={0.1} // subtle metallic sheen
        roughness={0.2} // fairly smooth/reflective surface
        emissive="#ffffff"
        emissiveIntensity={0.05} // very faint self-glow
    />
</Sphere>;
```

- **Geometry:** A UV sphere with 128×128 vertex subdivisions — extremely high
  tessellation for perfectly smooth silhouettes and distortion
- **Material:** `MeshDistortMaterial` (a drei shader material) continuously
  displaces the sphere's vertices on the GPU using simplex noise, making the
  surface "breathe" and writhe organically
- **Color:** `#f5f2eb` — a warm, slightly yellowish cream matching the
  `--c-cream` CSS variable defined in `globals.css`. Deliberately not pure
  white, evoking organic tissue or bone
- **Emissive:** A very faint white self-glow (`0.05`) makes the surface read as
  internally luminous, especially in dark areas

### 7.2 Animation — `useFrame`

The `useFrame` hook drives per-frame CPU-side animation:

```tsx
useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Slow sinusoidal rotation on all three axes
    meshRef.current.rotation.x = Math.cos(t / 4) / 8;
    meshRef.current.rotation.y = Math.sin(t / 4) / 8;
    meshRef.current.rotation.z = Math.sin(t / 4) / 8;

    // Breathing pulse — scale oscillates ±5%
    const s = 1 + Math.sin(t * 1.5) * 0.05;
    meshRef.current.scale.set(s, s, s);
});
```

- **Rotation:** Slowly tumbles on all 3 axes with a period of ~25 seconds. Uses
  `cos` on X and `sin` on Y/Z to ensure the axes are out of phase, preventing
  repetitive motion
- **Scale (pulse):** A 1.5 Hz sine wave causes the sphere to inhale and exhale
  ±5% of its size, creating the impression of a living organism breathing

### 7.3 Float Wrapper

The organism is wrapped in drei's `<Float>` component:

```tsx
<Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
```

This adds a secondary layer of gentle positional bobbing and rotational drift,
compounding with the manual `useFrame` animation for layered, natural-feeling
motion.

---

## 8. Design System

### 8.1 Color Palette

| Variable    | Hex       | Usage                                |
| ----------- | --------- | ------------------------------------ |
| `--c-black` | `#000000` | Background, body, canvas clear color |
| `--c-white` | `#ffffff` | Text, UI elements, emissive color    |
| `--c-cream` | `#f5f2eb` | The 3D organism's surface color      |

The palette is intentionally minimal — just three colors — evoking the stark,
high-contrast aesthetic.

### 8.2 Typography

| Weight/Style       | Usage                                               |
| ------------------ | --------------------------------------------------- |
| Geist Sans         | All body/UI text (loaded via `next/font`)           |
| Geist Mono         | Available via CSS variable for technical readouts   |
| `font-thin`        | Large hero title to keep it from being overpowering |
| `tracking-[0.4em]` | Long-tracked uppercase labels for HUD readouts      |

---

## 9. SEO & Metadata

Defined in `layout.tsx`:

```tsx
export const metadata: Metadata = {
    title: "THE BLOB",
    description:
        "An organic WebGL visualization exploring the intersection of geometry and life.",
};
```

- The `<h1>` on the page is `"the blob"`

---

## 10. File Reference

| File                                                                                                  | Purpose                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [layout.tsx](file:///Users/bluevisor/Developer/lifeforce-web/src/app/layout.tsx)                      | Root HTML shell, fonts, SEO metadata        |
| [page.tsx](file:///Users/bluevisor/Developer/lifeforce-web/src/app/page.tsx)                          | Main page — z-layer composition             |
| [globals.css](file:///Users/bluevisor/Developer/lifeforce-web/src/app/globals.css)                    | CSS variables and global resets             |
| [Scene.tsx](file:///Users/bluevisor/Developer/lifeforce-web/src/components/Scene.tsx)                 | R3F Canvas, camera, lights, post-processing |
| [TheBlob.tsx](file:///Users/bluevisor/Developer/lifeforce-web/src/components/TheBlob.tsx)             | The animated 3D organism                    |
| [package.json](file:///Users/bluevisor/Developer/lifeforce-web/package.json)                          | Dependencies and scripts                    |
| [next.config.ts](file:///Users/bluevisor/Developer/lifeforce-web/next.config.ts)                      | Next.js configuration                       |

---

## 11. Development Setup

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build

# Run production server
npm start
```

> **Note:** No Vercel CLI or API routes are configured in this project (unlike
> related projects in the workspace). Deployment is straightforward — push to
> Git and deploy via Vercel's Git integration.

---

## 12. Relationship to Other Projects

This project exists in the context of a broader body of work by bluevisor:

| Project                            | Focus                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **The Blob** _(this project)_      | Minimal organic sphere experience — pure atmosphere                                                                                |
| **Soundproof Motion / demo**       | More complex 3D work — instanced pillar terrain, extruded SeenHealth logo, DS4 gamepad controls, full post-processing suite        |
