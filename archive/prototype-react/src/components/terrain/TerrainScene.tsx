import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrbitControls, Html, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { useSimulator } from '../../context/SimulatorContext'
import { latLngToXZ, sampleTerrainHeight, getTerrainFocus, isInStudyRegion } from '../../utils/terrain'
import { RISK_COLORS } from '../../utils/riskColors'
import { getExposureSummary, getZoneExposure, getSeverityTier, mockRoads, mapSettlements, landslideHotspotZoneIds } from '../../data/mockData'
import type { SimulatedZone } from '../../utils/simulator'
import TerrainMesh from './TerrainMesh'
import ZoneBeacon from './ZoneBeacon'
import RainfallLayer from './RainfallLayer'
import WaterBody from './WaterBody'
import LandmarkLabels from './LandmarkLabels'

function RoadLayer({ opacity }: { opacity: number }) {
  const regionalRoads = mockRoads.filter((road) =>
    road.points.some((p) => isInStudyRegion(p.lat, p.lng)),
  )

  const alpha = opacity / 100

  return (
    <group>
      {regionalRoads.map((road) => {
        const points = road.points.map(({ lat, lng }) => {
          const [x, z] = latLngToXZ(lat, lng)
          const y = sampleTerrainHeight(x, z) + 0.12
          return new THREE.Vector3(x, y, z)
        })
        const curve = new THREE.CatmullRomCurve3(points)
        return (
          <mesh key={road.id}>
            <tubeGeometry args={[curve, 64, 0.06, 5, false]} />
            <meshStandardMaterial
              color="#fcd34d"
              emissive="#d97706"
              emissiveIntensity={0.5}
              transparent
              opacity={alpha}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function SettlementLayer({ opacity }: { opacity: number }) {
  const alpha = opacity / 100
  const regional = mapSettlements.filter((s) => isInStudyRegion(s.lat, s.lng))

  return (
    <group>
      {regional.map((s) => {
        const [x, z] = latLngToXZ(s.lat, s.lng)
        const y = sampleTerrainHeight(x, z)
        const scale = 0.12 + (s.population / 3000) * 0.28
        return (
          <group key={s.id} position={[x, y, z]}>
            <mesh position={[0, scale / 2, 0]}>
              <boxGeometry args={[scale, scale, scale]} />
              <meshStandardMaterial color="#94a3b8" transparent opacity={alpha} />
            </mesh>
            <mesh position={[0, scale + 0.04, 0]}>
              <boxGeometry args={[scale * 0.7, scale * 0.45, scale * 0.7]} />
              <meshStandardMaterial color="#cbd5e1" transparent opacity={alpha * 0.9} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function HotspotLayer({ opacity, simulatedZones }: { opacity: number; simulatedZones: SimulatedZone[] }) {
  const alpha = opacity / 100
  const hotspots = simulatedZones.filter((s) => landslideHotspotZoneIds.includes(s.zone.id))

  return (
    <group>
      {hotspots.map(({ zone }) => {
        const [x, z] = latLngToXZ(zone.lat, zone.lng)
        const y = sampleTerrainHeight(x, z) + 0.25
        return (
          <group key={zone.id} position={[x, y, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.6, 3]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={alpha * 0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <coneGeometry args={[0.2, 0.5, 3]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={1.2}
                transparent
                opacity={alpha}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function TerrainScene() {
  const navigate = useNavigate()
  const { layers, simulatedZones, rainfall } = useSimulator()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const regionalZones = simulatedZones

  const riskGlow = layers.riskZones.enabled
    ? regionalZones.map((s) => {
        const [x, z] = latLngToXZ(s.zone.lat, s.zone.lng)
        return {
          x,
          z,
          intensity: (s.riskScore - 1) / 4,
          color: RISK_COLORS[s.riskLevel],
          isCritical: s.riskLevel === 'Critical',
        }
      })
    : []

  const hoveredSim = hoveredId ? regionalZones.find((s) => s.zone.id === hoveredId) : null
  const [focusX, focusY, focusZ] = getTerrainFocus()

  return (
    <>
      <fog attach="fog" args={['#0b0f14', 28, 65]} />
      <Sky
        distance={450000}
        sunPosition={[80, 25, 40]}
        inclination={0.52}
        azimuth={0.28}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.4}
        turbidity={8}
      />

      <ambientLight intensity={0.28} color="#b8c9e0" />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.1}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-20, 15, -15]} intensity={0.2} color="#6ee7b7" />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={12}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2.15}
        target={[focusX, focusY, focusZ]}
      />

      <TerrainMesh riskGlow={riskGlow} riskOpacity={layers.riskZones.opacity / 100} />
      <WaterBody />
      <LandmarkLabels />

      {layers.rainfall.enabled && (
        <RainfallLayer
          simulatedZones={regionalZones}
          rainfall={rainfall}
          opacity={layers.rainfall.opacity / 100}
        />
      )}
      {layers.roads.enabled && <RoadLayer opacity={layers.roads.opacity} />}
      {layers.settlements.enabled && <SettlementLayer opacity={layers.settlements.opacity} />}
      {layers.hotspots.enabled && (
        <HotspotLayer opacity={layers.hotspots.opacity} simulatedZones={regionalZones} />
      )}

      {layers.riskZones.enabled &&
        regionalZones.map((sim) => (
          <ZoneBeacon
            key={sim.zone.id}
            simulated={sim}
            opacity={layers.riskZones.opacity / 100}
            onHover={(hovered) => setHoveredId(hovered ? sim.zone.id : null)}
            onClick={() => navigate(`/zone/${sim.zone.id}`)}
          />
        ))}

      {hoveredSim && layers.riskZones.enabled && (() => {
        const [x, z] = latLngToXZ(hoveredSim.zone.lat, hoveredSim.zone.lng)
        const y = sampleTerrainHeight(x, z) + 2.5
        const exposure = getZoneExposure(hoveredSim.zone.id)
        const tier = exposure ? getSeverityTier(hoveredSim.riskLevel, exposure) : hoveredSim.riskLevel
        const summary = getExposureSummary(hoveredSim.zone.id)
        return (
          <Html position={[x, y, z]} center distanceFactor={16} style={{ pointerEvents: 'none' }}>
            <div className="w-48 rounded-lg border border-ridge-border bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
              <div className="font-semibold text-white">{hoveredSim.zone.name}</div>
              <div className="text-slate-400">{hoveredSim.riskLevel} risk</div>
              <div className="mt-1 text-slate-300">
                {tier} — {summary}
              </div>
            </div>
          </Html>
        )
      })()}
    </>
  )
}
