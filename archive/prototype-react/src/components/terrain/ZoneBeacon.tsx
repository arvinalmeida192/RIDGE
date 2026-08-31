import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToXZ, sampleTerrainHeight } from '../../utils/terrain'
import { RISK_COLORS } from '../../utils/riskColors'
import type { SimulatedZone } from '../../utils/simulator'

interface ZoneBeaconProps {
  simulated: SimulatedZone
  opacity: number
  onHover: (hovered: boolean) => void
  onClick: () => void
}

export default function ZoneBeacon({ simulated, opacity, onHover, onClick }: ZoneBeaconProps) {
  const beaconRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const { zone, riskLevel, riskScore } = simulated
  const color = RISK_COLORS[riskLevel]
  const isCritical = riskLevel === 'Critical'

  const [x, z] = latLngToXZ(zone.lat, zone.lng)
  const baseY = sampleTerrainHeight(x, z)
  const height = 1.2 + (riskScore - 1) * 0.5

  useFrame(({ clock }) => {
    if (glowRef.current && isCritical) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.35
      ;(glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 2
    }
  })

  return (
    <group
      ref={beaconRef}
      position={[x, baseY, z]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true) }}
      onPointerOut={() => onHover(false)}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      {/* Ground glow disc */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.8 + riskScore * 0.3, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCritical ? 1.2 : 0.6 + riskScore * 0.15}
          transparent
          opacity={opacity * 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical beacon pole */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.1, height, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCritical ? 1.5 : 0.8}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, height + 0.15, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCritical ? 2 : 1.2}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}
