# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Blob** is a browser-native 3D experience that renders a single organic, breathing 3D form with minimal UI and a cinematic atmospheric aesthetic. Single-page, no routing, no API routes.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint (next core-web-vitals + typescript presets)
```

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Three.js** via **@react-three/fiber** (declarative R3F), **@react-three/drei** (abstractions), **@react-three/postprocessing**
- **Tailwind CSS v4** (PostCSS plugin, not config-based)
- **Geist Sans/Mono** fonts via `next/font`

## Architecture

The app is a single route (`src/app/page.tsx`) that composes three full-screen z-layers:

```
z-50  → Grain overlay (SVG noise + mix-blend-overlay)
z-10  → UI HUD (pointer-events-none headers/titles/credits)
z-0   → 3D WebGL Canvas (Scene component)
```

### Key Files

| File | Role |
|------|------|
| `src/app/layout.tsx` | Root shell, fonts, SEO metadata ("THE BLOB") |
| `src/app/page.tsx` | Page composition: Scene + UI overlay + grain |
| `src/app/globals.css` | CSS variables (`--c-black`, `--c-white`, `--c-cream`), resets, canvas rules |
| `src/components/Scene.tsx` | R3F Canvas: camera (perspective, FOV 45, pos [0,0,4]), 3-point lighting, environment (studio IBL), contact shadows, post-processing (Bloom → Noise → Vignette) |
| `src/components/TheBlob.tsx` | The hero 3D organism: high-poly sphere (128×128) with `MeshDistortMaterial` (GPU simplex noise), `useFrame` animation (sinusoidal rotation + breathing scale pulse), wrapped in `Float` for drift |

### 3D Rendering Patterns

- Components use `'use client'` directive (client-side rendering required for WebGL)
- Animation via `useFrame` hook (imperative per-frame updates on mesh refs)
- Layered motion: `useFrame` rotation/scale + `Float` component drift
- Post-processing chain: `EffectComposer` with `disableNormalPass` optimization
- DPR clamped `[1, 2]`, antialias disabled (post-processing handles smoothing)

### Design System

Three-color palette: black (`#000000`), white (`#ffffff`), cream (`#f5f2eb`). Typography is uppercase, thin-weight, wide-tracked. All UI overlays are `pointer-events-none` so they never block 3D canvas interaction.

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).
