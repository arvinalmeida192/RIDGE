import { useMemo } from 'react'
import { latLngToXZ, sampleTerrainHeight, LANDMARKS } from '../../utils/terrain'

/** Umiam Lake water surface */
export default function WaterBody() {
  const { position, size } = useMemo(() => {
    const [x, z] = latLngToXZ(LANDMARKS.umiam.lat, LANDMARKS.umiam.lng)
    const y = sampleTerrainHeight(x, z) + 0.08
    return { position: [x, y, z] as [number, number, number], size: [5, 3.5] as [number, number] }
  }, [])

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0.15]}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        color="#1e4d6b"
        emissive="#0c2d40"
        emissiveIntensity={0.3}
        roughness={0.15}
        metalness={0.4}
        transparent
        opacity={0.75}
      />
    </mesh>
  )
}
