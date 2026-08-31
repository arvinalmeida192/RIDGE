import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader2, MapPin } from 'lucide-react'
import { STUDY_REGION } from '../../utils/terrain'
import TerrainScene from './TerrainScene'
import LayerControlPanel from './LayerControlPanel'

interface TerrainMapProps {
  height?: string
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-risk-low" />
        <span className="text-sm">Loading East Khasi Hills terrain…</span>
      </div>
    </div>
  )
}

export default function TerrainMap({ height = '420px' }: TerrainMapProps) {
  const [ready, setReady] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-xl border border-ridge-border" style={{ height }}>
      {!ready && <LoadingOverlay />}

      {/* Region label */}
      <div className="absolute left-3 top-3 z-20 max-w-[200px] glass-panel rounded-lg px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-risk-low">
          <MapPin className="h-3 w-3" />
          Study Region
        </div>
        <div className="text-sm font-semibold text-white">{STUDY_REGION.name}</div>
        <div className="text-[10px] leading-tight text-slate-400">{STUDY_REGION.subtitle}</div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute right-3 top-3">
          <LayerControlPanel />
        </div>
      </div>
      <Canvas
        camera={{ position: [18, 16, 22], fov: 42, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={() => setReady(true)}
        style={{ background: '#0b0f14' }}
        shadows
      >
        <color attach="background" args={['#0b0f14']} />
        <Suspense fallback={null}>
          <TerrainScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
