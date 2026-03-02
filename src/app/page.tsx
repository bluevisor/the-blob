'use client'

import { useState, useCallback, useEffect } from 'react'
import Scene from '@/components/Scene'

function requestFS(el: HTMLElement) {
  const r = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
  return r.requestFullscreen?.() ?? r.webkitRequestFullscreen?.()
}

function exitFS() {
  const d = document as Document & { webkitExitFullscreen?: () => Promise<void> }
  return d.exitFullscreen?.() ?? d.webkitExitFullscreen?.()
}

function isFS() {
  const d = document as Document & { webkitFullscreenElement?: Element }
  return !!(d.fullscreenElement ?? d.webkitFullscreenElement)
}

function FullscreenButton() {
  const toggle = useCallback(() => {
    if (isFS()) {
      exitFS()
    } else {
      requestFS(document.documentElement)
    }
  }, [])

  return (
    <button
      onClick={toggle}
      className="pointer-events-auto opacity-50 hover:opacity-100 transition-opacity"
      aria-label="Toggle fullscreen"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
      </svg>
    </button>
  )
}

export default function Home() {
  const [debug, setDebug] = useState(false)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    setDebug(new URLSearchParams(window.location.search).get('debug') === 'true')
  }, [])

  const handleEnter = useCallback(() => {
    // Try native Fullscreen API (works on desktop + Android Chrome)
    try { requestFS(document.documentElement) } catch {}
    // iOS fallback: scroll to hide address bar
    setTimeout(() => window.scrollTo(0, 1), 50)
    // Request gyro permission on iOS
    try {
      const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      doe.requestPermission?.()
    } catch {}
    // Delay state change so browser processes fullscreen from the gesture
    setTimeout(() => setEntered(true), 100)
  }, [])

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      {/* Click/tap-to-enter fullscreen prompt */}
      {ready && !entered && (
        <div
          onClick={handleEnter}
          className="absolute inset-0 z-[200] flex items-center justify-center cursor-pointer"
        >
          <div className="text-[10px] sm:text-xs tracking-[0.4em] uppercase opacity-50 animate-pulse">
            {isTouch ? 'Tap to enter' : 'Click to enter'}
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Scene onReady={onReady} debug={debug} />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-2 sm:inset-3 md:inset-4 z-10 flex flex-col justify-between p-4 sm:p-6 md:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] pointer-events-none">
        <header className="flex justify-between items-start shrink-0">
          <div className="text-[10px] sm:text-xs tracking-[0.4em] uppercase opacity-50">
            THE BLOB // 2026
          </div>
          <FullscreenButton />
        </header>

        <footer className="flex flex-col gap-2 sm:gap-4 shrink-0">
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-thin tracking-tighter lowercase leading-[0.85]">
            the blob
          </h1>
          <div className="flex justify-between items-end gap-4">
            <p className="max-w-xs text-[10px] uppercase tracking-widest leading-loose opacity-40">
              An organic visualization exploring the intersection of geometry and life.
            </p>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-widest opacity-30">
                coded by Gemini 3.1 // John Zheng
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Grain / Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

      {/* Fade-in overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[100] bg-black transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: entered ? 0 : 1 }}
      />
    </main>
  )
}
