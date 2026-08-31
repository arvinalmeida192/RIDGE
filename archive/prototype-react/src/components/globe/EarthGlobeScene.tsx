import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'
import { latLngToSphere } from '../../utils/geo'
import { RISK_COLORS } from '../../utils/riskColors'
import type { Zone } from '../../data/mockData'
import type { RiskLevel } from '../../utils/riskColors'

const EARTH_RADIUS = 2
const EARTH_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
const BUMP_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-topology.png'

interface ZoneMarkerProps {
  zone: Zone
  riskLevel: RiskLevel
  onHover: (id: string | null) => void
  onClick?: (zone: Zone) => void
  interactive?: boolean
}

function ZoneMarker({ zone, riskLevel, onHover, onClick, interactive = true }: ZoneMarkerProps) {
  const ref = useRef<THREE.Group>(null)
  const color = RISK_COLORS[riskLevel]
  const isCritical = riskLevel === 'Critical'

  const { position, quaternion } = useMemo(() => {
    const pos = latLngToSphere(zone.lat, zone.lng, EARTH_RADIUS + 0.02)
    const normal = pos.clone().normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    return { position: pos, quaternion: q }
  }, [zone.lat, zone.lng])

  useFrame(({ clock }) => {
    if (ref.current && isCritical) {
      const pulse = 0.7 + Math.sin(clock.elapsedTime * 3) * 0.3
      ref.current.scale.setScalar(pulse)
    }
  })

  return (
    <group
      ref={ref}
      position={position}
      quaternion={quaternion}
      onPointerOver={(e) => { if (interactive) { e.stopPropagation(); onHover(zone.id) } }}
      onPointerOut={() => { if (interactive) onHover(null) }}
      onClick={(e) => { if (interactive) { e.stopPropagation(); onClick?.(zone) } }}
    >
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[0.025, 0.1, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCritical ? 1.8 : 1.0}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.03, 0.05, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

interface EarthGlobeSceneProps {
  zones: { zone: Zone; riskLevel: RiskLevel }[]
  onZoneClick?: (zone: Zone) => void
  autoRotate?: boolean
  showLabels?: boolean
}

export default function EarthGlobeScene({
  zones,
  onZoneClick,
  autoRotate = true,
  showLabels = true,
}: EarthGlobeSceneProps) {
  const earthRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const [colorMap, bumpMap] = useTexture([EARTH_TEXTURE, BUMP_TEXTURE])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.08
    }
  })

  const hovered = zones.find((z) => z.zone.id === hoveredId)

  return (
    <group ref={groupRef} rotation={[0.2, -1.8, 0]}>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.015}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.015, 64, 64]} />
        <meshBasicMaterial
          color="#4ade80"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Zone markers */}
      {zones.map(({ zone, riskLevel }) => (
        <ZoneMarker
          key={zone.id}
          zone={zone}
          riskLevel={riskLevel}
          onHover={setHoveredId}
          onClick={onZoneClick}
          interactive={!!onZoneClick}
        />
      ))}

      {/* NER highlight arc */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.005, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>

      {showLabels && hovered && (() => {
        const pos = latLngToSphere(hovered.zone.lat, hovered.zone.lng, EARTH_RADIUS + 0.25)
        return (
          <Html position={pos} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-lg border border-ridge-border bg-slate-900/95 px-2.5 py-1.5 text-xs shadow-xl">
              <div className="font-semibold text-white">{hovered.zone.name}</div>
              <div className="text-slate-400">{hovered.zone.state} · {hovered.riskLevel}</div>
            </div>
          </Html>
        )
      })()}
    </group>
  )
}

export { EARTH_RADIUS }
