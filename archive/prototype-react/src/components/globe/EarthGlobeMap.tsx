import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { Loader2, Globe } from 'lucide-react'
import { zones } from '../../data/mockData'
import EarthGlobeScene from './EarthGlobeScene'
import type { RiskLevel } from '../../utils/riskColors'

interface EarthGlobeMapProps {
  height?: string
  zoneRisks?: { zoneId: string; riskLevel: RiskLevel }[]
  interactive?: boolean
  showRegionLabel?: boolean
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-risk-low" />
        <span className="text-sm">Loading 3D Earth model…</span>
      </div>
    </div>
  )
}

function GlobeCanvas({
  zoneRisks,
  interactive,
}: {
  zoneRisks?: { zoneId: string; riskLevel: RiskLevel }[]
  interactive?: boolean
}) {
  const navigate = useNavigate()

  const zoneData = zones.map((zone) => ({
    zone,
    riskLevel: zoneRisks?.find((r) => r.zoneId === zone.id)?.riskLevel ?? zone.riskLevel,
  }))

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-3, -1, -2]} intensity={0.3} color="#6ee7b7" />
      <Stars radius={80} depth={40} count={2000} factor={3} saturation={0} fade speed={0.5} />
      <EarthGlobeScene
        zones={zoneData}
        onZoneClick={interactive ? (z) => navigate(`/zone/${z.id}`) : undefined}
        autoRotate={false}
        showLabels
      />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={3.2}
        maxDistance={8}
        rotateSpeed={0.4}
        zoomSpeed={0.6}
      />
    </>
  )
}

export default function EarthGlobeMap({
  height = '420px',
  zoneRisks,
  interactive = true,
  showRegionLabel = true,
}: EarthGlobeMapProps) {
  const [ready, setReady] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-xl border border-ridge-border" style={{ height }}>
      {!ready && <LoadingOverlay />}

      {showRegionLabel && (
        <div className="absolute left-3 top-3 z-20 glass-panel rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-risk-low">
            <Globe className="h-3 w-3" />
            3D Earth View
          </div>
          <div className="text-sm font-semibold text-white">NER Risk Overlay</div>
          <div className="text-[10px] text-slate-400">Rotate · Zoom · Click zones</div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true }}
        onCreated={() => setReady(true)}
        style={{ background: '#020617' }}
      >
        <color attach="background" args={['#020617']} />
        <Suspense fallback={null}>
          <GlobeCanvas zoneRisks={zoneRisks} interactive={interactive} />
        </Suspense>
      </Canvas>
    </div>
  )
}
