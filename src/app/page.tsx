import Scene from '@/components/Scene'

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
        <header className="flex justify-between items-start">
          <div className="text-xs tracking-[0.4em] uppercase opacity-50">
            THE BLOB // 2026
          </div>
          <div className="text-xs tracking-[0.4em] uppercase opacity-50">
            WEB EDITION
          </div>
        </header>

        <footer className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-8xl font-thin tracking-tighter lowercase leading-[0.85]">
            the blob
          </h1>
          <div className="flex justify-between items-end">
            <p className="max-w-xs text-[10px] uppercase tracking-widest leading-loose opacity-40">
              An organic visualization exploring the intersection of geometry and life.
            </p>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest opacity-30">
                coded by tars // bluevisor
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Grain / Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </main>
  )
}
