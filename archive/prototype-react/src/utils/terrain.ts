import { createNoise2D } from 'simplex-noise'

const noise2D = createNoise2D()

/** East Khasi Hills — real sample region for the 3D digital twin */
export const STUDY_REGION = {
  id: 'east-khasi-hills',
  name: 'East Khasi Hills',
  subtitle: 'Sohra · Cherrapunji · Shillong Plateau escarpment, Meghalaya',
  latMin: 25.18,
  latMax: 26.22,
  lngMin: 91.46,
  lngMax: 91.98,
  centerLat: 25.62,
  centerLng: 91.72,
}

/** Zones that fall within the study region */
export const STUDY_REGION_ZONE_IDS = ['z01', 'z02', 'z03', 'z11'] as const

/** Named landmarks for labelling & height anchoring (real approximate coords) */
export const LANDMARKS = {
  sohra: { lat: 25.3007, lng: 91.6968, elev: 1483 },
  cherrapunji: { lat: 25.2781, lng: 91.7302, elev: 1430 },
  mawsynram: { lat: 25.2983, lng: 91.5827, elev: 1402 },
  shillong: { lat: 25.5788, lng: 91.8933, elev: 1496 },
  umiam: { lat: 25.655, lng: 91.875, elev: 980 },
  guwahatiHills: { lat: 26.1445, lng: 91.7362, elev: 620 },
} as const

export const TERRAIN_SIZE = 44
export const TERRAIN_SEGMENTS = 120

const KM_PER_DEG_LAT = 111.32
const kmPerDegLng = () => KM_PER_DEG_LAT * Math.cos((STUDY_REGION.centerLat * Math.PI) / 180)

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function gaussian2(du: number, dv: number, su: number, sv: number): number {
  return Math.exp(-(du * du) / (2 * su * su) - (dv * dv) / (2 * sv * sv))
}

/** Convert lat/lng to local scene XZ (km-scale, centered on study region) */
export function latLngToXZ(lat: number, lng: number): [number, number] {
  const x = ((lng - STUDY_REGION.centerLng) * kmPerDegLng()) / KM_PER_DEG_LAT * (TERRAIN_SIZE * 0.48)
  const z = -((lat - STUDY_REGION.centerLat) * KM_PER_DEG_LAT) / KM_PER_DEG_LAT * (TERRAIN_SIZE * 0.48)
  return [x, z]
}

/** Inverse projection for height sampling */
export function xzToLatLng(x: number, z: number): [number, number] {
  const lat = STUDY_REGION.centerLat - (z / (TERRAIN_SIZE * 0.48))
  const lng = STUDY_REGION.centerLng + (x / (TERRAIN_SIZE * 0.48)) * (KM_PER_DEG_LAT / kmPerDegLng())
  return [lat, lng]
}

export function isInStudyRegion(lat: number, lng: number): boolean {
  return (
    lat >= STUDY_REGION.latMin &&
    lat <= STUDY_REGION.latMax &&
    lng >= STUDY_REGION.lngMin &&
    lng <= STUDY_REGION.lngMax
  )
}

function uvFromLatLng(lat: number, lng: number): [number, number] {
  const u = (lng - STUDY_REGION.lngMin) / (STUDY_REGION.lngMax - STUDY_REGION.lngMin)
  const v = (lat - STUDY_REGION.latMin) / (STUDY_REGION.latMax - STUDY_REGION.latMin)
  return [u, v]
}

/**
 * Height field modelled on East Khasi Hills geography:
 * - Shillong Plateau (north, high flat tableland)
 * - Southern escarpment cliff (Sohra/Cherrapunji edge)
 * - Bangladesh foreland (south, low)
 * - Umiam valley depression
 * - Mawsynram western plateau knoll
 */
export function sampleTerrainHeight(x: number, z: number): number {
  const [lat, lng] = xzToLatLng(x, z)
  const [u, v] = uvFromLatLng(lat, lng)

  // Shillong Plateau — broad highland in the north
  const plateau = smoothstep(0.42, 0.78, v) * 5.5

  // Southern escarpment — E-W cliff band (the famous Meghalaya cliff line)
  const escarpmentLat = 0.24 + Math.sin(u * Math.PI * 2.2 + 0.3) * 0.035
  const distSouthOfRidge = escarpmentLat - v
  const cliffFace =
    smoothstep(-0.02, 0.14, distSouthOfRidge) * 4.5 -
    smoothstep(0.14, 0.28, distSouthOfRidge) * 3.2

  // Bangladesh foreland — flat lowlands south of escarpment
  const foreland = smoothstep(0.28, 0.08, v) * -3.5

  // Umiam Lake valley (NE depression on plateau)
  const umiamValley = gaussian2(u - 0.82, v - 0.72, 0.11, 0.09) * -3.2

  // Mawsynram — wet plateau west of escarpment
  const mawsynram = gaussian2(u - 0.08, v - 0.22, 0.09, 0.07) * 2.2

  // Sohra plateau spur
  const sohra = gaussian2(u - 0.48, v - 0.20, 0.055, 0.045) * 2.0

  // Cherrapunji East ridge
  const cherrapunji = gaussian2(u - 0.68, v - 0.17, 0.05, 0.04) * 1.8

  // Guwahati foothills (northern edge toward Assam)
  const guwahatiFoothills = gaussian2(u - 0.52, v - 0.92, 0.16, 0.07) * 2.5

  // Brahmaputra valley low (far NE)
  const brahmaputraLow = gaussian2(u - 0.55, v - 0.98, 0.2, 0.04) * -2

  // Fine-scale terrain detail
  const detail =
    noise2D(x * 0.18 + 7, z * 0.18 + 3) * 0.45 +
    noise2D(x * 0.45, z * 0.45) * 0.15

  const h =
    3.2 +
    plateau +
    cliffFace +
    foreland -
    umiamValley +
    mawsynram +
    sohra +
    cherrapunji +
    guwahatiFoothills +
    brahmaputraLow +
    detail

  return Math.max(0.15, h)
}

/** Approximate surface slope magnitude 0–1 for rock/vegetation blending */
export function sampleTerrainSlope(x: number, z: number, epsilon = 0.2): number {
  const hC = sampleTerrainHeight(x, z)
  const hX = sampleTerrainHeight(x + epsilon, z)
  const hZ = sampleTerrainHeight(x, z + epsilon)
  const gradient = Math.sqrt((hX - hC) ** 2 + (hZ - hC) ** 2) / epsilon
  return Math.min(1, gradient / 4.5)
}

export function terrainNormal(x: number, z: number, epsilon = 0.15): [number, number, number] {
  const hL = sampleTerrainHeight(x - epsilon, z)
  const hR = sampleTerrainHeight(x + epsilon, z)
  const hD = sampleTerrainHeight(x, z - epsilon)
  const hU = sampleTerrainHeight(x, z + epsilon)
  const nx = hL - hR
  const nz = hD - hU
  const ny = 2 * epsilon
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
  return [nx / len, ny / len, nz / len]
}

/** Scene focus point — escarpment overlook near Sohra */
export function getTerrainFocus(): [number, number, number] {
  const [x, z] = latLngToXZ(LANDMARKS.sohra.lat, LANDMARKS.sohra.lng)
  const y = sampleTerrainHeight(x, z)
  return [x, y + 1, z]
}
