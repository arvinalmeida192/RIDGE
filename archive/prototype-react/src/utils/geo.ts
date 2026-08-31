import * as THREE from 'three'

/** Convert WGS84 lat/lng to a point on a sphere surface */
export function latLngToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/** Camera position to frame a lat/lng region on the globe */
export function cameraLookAtLatLng(lat: number, lng: number, radius: number, distance: number): {
  position: THREE.Vector3
  target: THREE.Vector3
} {
  const target = latLngToSphere(lat, lng, radius)
  const position = target.clone().normalize().multiplyScalar(radius + distance)
  return { position, target }
}
