import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToXZ, sampleTerrainHeight } from '../../utils/terrain'
import type { SimulatedZone } from '../../utils/simulator'

interface RainfallLayerProps {
  simulatedZones: SimulatedZone[]
  rainfall: number
  opacity: number
}

export default function RainfallLayer({ simulatedZones, rainfall, opacity }: RainfallLayerProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const rainfallNorm = (rainfall - 50) / 250

  const { positions, zoneCenters } = useMemo(() => {
    const count = 400
    const pos = new Float32Array(count * 3)
    const centers = simulatedZones
      .filter((s) => s.simulatedRainfall > 60)
      .map((s) => {
        const [x, z] = latLngToXZ(s.zone.lat, s.zone.lng)
        return { x, z, weight: s.simulatedRainfall / 200 }
      })

    for (let i = 0; i < count; i++) {
      const center = centers[i % centers.length] ?? { x: 0, z: 0, weight: 1 }
      const spread = 5 * center.weight
      const x = center.x + (Math.random() - 0.5) * spread
      const z = center.z + (Math.random() - 0.5) * spread
      const y = sampleTerrainHeight(x, z) + 3 + Math.random() * 8
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
    }

    return { positions: pos, zoneCenters: centers }
  }, [simulatedZones])

  useFrame(() => {
    if (!particlesRef.current) return
    const pos = particlesRef.current.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - 0.08 * (0.5 + rainfallNorm)
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const ground = sampleTerrainHeight(x, z) + 2
      if (y < ground) {
        y = ground + 3 + Math.random() * 6
      }
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  })

  if (zoneCenters.length === 0) return null

  return (
    <group>
      {/* Blue tint overlays at high-rainfall zones */}
      {simulatedZones.map((s) => {
        const [x, z] = latLngToXZ(s.zone.lat, s.zone.lng)
        const y = sampleTerrainHeight(x, z) + 0.2
        const intensity = Math.min(1, s.simulatedRainfall / 180) * rainfallNorm
        if (intensity < 0.15) return null
        return (
          <mesh key={s.zone.id} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3 + intensity * 2, 24]} />
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={opacity * intensity * 0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#60a5fa"
          size={0.12}
          transparent
          opacity={opacity * (0.3 + rainfallNorm * 0.5)}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
