import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { sampleTerrainHeight, sampleTerrainSlope, TERRAIN_SEGMENTS, TERRAIN_SIZE } from '../../utils/terrain'

interface RiskGlowPoint {
  x: number
  z: number
  intensity: number
  color: string
  isCritical: boolean
}

interface TerrainMeshProps {
  riskGlow: RiskGlowPoint[]
  riskOpacity: number
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function elevationColor(h: number, slope: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, (h - 1) / 10))

  // Valley floor — dark humid green-brown
  let r = 0.1 + t * 0.06
  let g = 0.2 + t * 0.12
  let b = 0.12 + t * 0.04

  // Mid slopes — dense forest green
  if (t > 0.25 && t < 0.65) {
    r = 0.08 + t * 0.1
    g = 0.28 + t * 0.08
    b = 0.1 + t * 0.05
  }

  // Plateau top — lighter grassland / cloud forest
  if (t > 0.6) {
    r = 0.14 + t * 0.1
    g = 0.32 + t * 0.06
    b = 0.14 + t * 0.04
  }

  // Steep escarpment — exposed rock
  if (slope > 0.45) {
    const rock = (slope - 0.45) / 0.55
    r = r * (1 - rock) + 0.28 * rock
    g = g * (1 - rock) + 0.26 * rock
    b = b * (1 - rock) + 0.24 * rock
  }

  return [r, g, b]
}

export default function TerrainMesh({ riskGlow, riskOpacity }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = sampleTerrainHeight(x, z)
      const slope = sampleTerrainSlope(x, z)
      pos.setY(i, h)

      let [r, g, b] = elevationColor(h, slope)

      for (const glow of riskGlow) {
        const dx = x - glow.x
        const dz = z - glow.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        const radius = 4.5 + glow.intensity * 3
        if (dist < radius) {
          const falloff = 1 - dist / radius
          const blend = falloff * falloff * glow.intensity * riskOpacity * 0.8
          const [cr, cg, cb] = hexToRgb(glow.color)
          r += (cr / 255 - r) * blend
          g += (cg / 255 - g) * blend
          b += (cb / 255 - b) * blend
        }
      }

      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [riskGlow, riskOpacity])

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.88}
        metalness={0.02}
        emissive="#142218"
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}
