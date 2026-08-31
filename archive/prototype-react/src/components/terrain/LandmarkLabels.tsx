import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { latLngToXZ, sampleTerrainHeight, LANDMARKS } from '../../utils/terrain'

const labels = [
  { key: 'sohra', label: 'Sohra', ...LANDMARKS.sohra },
  { key: 'cherrapunji', label: 'Cherrapunji', ...LANDMARKS.cherrapunji },
  { key: 'mawsynram', label: 'Mawsynram', ...LANDMARKS.mawsynram },
  { key: 'shillong', label: 'Shillong', ...LANDMARKS.shillong },
]

export default function LandmarkLabels() {
  const points = useMemo(
    () =>
      labels.map((l) => {
        const [x, z] = latLngToXZ(l.lat, l.lng)
        const y = sampleTerrainHeight(x, z) + 1.2
        return { ...l, x, y, z }
      }),
    [],
  )

  return (
    <group>
      {points.map((p) => (
        <Html
          key={p.key}
          position={[p.x, p.y, p.z]}
          center
          distanceFactor={22}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded border border-slate-600/50 bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 backdrop-blur-sm">
            {p.label}
          </div>
        </Html>
      ))}
    </group>
  )
}
