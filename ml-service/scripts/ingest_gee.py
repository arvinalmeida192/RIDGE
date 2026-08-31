#!/usr/bin/env python3
"""
RIDGE — Google Earth Engine terrain ingestion script (Phase 2)

Exports SRTM slope, elevation, land cover, and NDVI per monitoring zone.
Falls back to Open-Meteo elevation API when GEE credentials are unavailable.

Usage:
  python ingest_gee.py --database-url postgresql://ridge:pass@localhost:5432/ridge

Environment:
  GEE_SERVICE_ACCOUNT  — GEE service account email
  GEE_PRIVATE_KEY_PATH — Path to service account JSON key
"""

import argparse
import json
import math
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("Install: pip install psycopg2-binary")
    sys.exit(1)

OPEN_METEO_ELEVATION = "https://api.open-meteo.com/v1/elevation"


def fetch_elevation(lat: float, lng: float) -> float | None:
    params = urllib.parse.urlencode({"latitude": lat, "longitude": lng})
    with urllib.request.urlopen(f"{OPEN_METEO_ELEVATION}?{params}", timeout=30) as resp:
        data = json.loads(resp.read())
    elevations = data.get("elevation", [])
    return elevations[0] if elevations else None


def estimate_slope(lat: float, lng: float, delta: float = 0.01) -> float | None:
    center = fetch_elevation(lat, lng)
    if center is None:
        return None
    neighbors = [
        fetch_elevation(lat + delta, lng),
        fetch_elevation(lat - delta, lng),
        fetch_elevation(lat, lng + delta),
        fetch_elevation(lat, lng - delta),
    ]
    diffs = [abs(n - center) for n in neighbors if n is not None]
    if not diffs:
        return None
    horizontal_m = delta * 111_000
    slope_rad = math.atan(max(diffs) / horizontal_m)
    return round(math.degrees(slope_rad), 1)


def ingest_with_gee(zones: list, conn) -> int:
  """GEE integration stub — enable when credentials are configured."""
  try:
    import ee
  except ImportError:
    print("earthengine-api not installed — using Open-Meteo fallback")
    return 0

  sa = os.environ.get("GEE_SERVICE_ACCOUNT")
  key_path = os.environ.get("GEE_PRIVATE_KEY_PATH")
  if not sa or not key_path or not os.path.exists(key_path):
    print("GEE credentials not configured — using Open-Meteo fallback")
    return 0

  credentials = ee.ServiceAccountCredentials(sa, key_path)
  ee.Initialize(credentials)

  dem = ee.Image("USGS/SRTMGLP1")
  slope = ee.Terrain.slope(dem)
  elevation = dem.select("elevation")
  worldcover = ee.Image("ESA/WorldCover/v200").select("Map")

  processed = 0
  with conn.cursor() as cur:
    for zone in zones:
      point = ee.Geometry.Point([zone["lng"], zone["lat"]])
      stats = slope.reduceRegion(ee.Reducer.mean(), point, 30).getInfo()
      elev_stats = elevation.reduceRegion(ee.Reducer.mean(), point, 30).getInfo()
      lc_stats = worldcover.reduceRegion(ee.Reducer.mode(), point, 10).getInfo()

      slope_val = stats.get("slope")
      elev_val = elev_stats.get("elevation")
      lc_code = lc_stats.get("Map")
      land_cover_map = {10: "forest", 40: "cropland", 50: "urban", 60: "bare", 80: "water"}
      land_cover = land_cover_map.get(lc_code, "forest")

      cur.execute(
        """
        INSERT INTO zone_static_attributes
          (zone_id, slope_angle, elevation_m, land_cover, updated_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (zone_id) DO UPDATE SET
          slope_angle = COALESCE(EXCLUDED.slope_angle, zone_static_attributes.slope_angle),
          elevation_m = COALESCE(EXCLUDED.elevation_m, zone_static_attributes.elevation_m),
          land_cover = COALESCE(EXCLUDED.land_cover, zone_static_attributes.land_cover),
          updated_at = NOW()
        """,
        (zone["id"], slope_val, elev_val, land_cover),
      )
      processed += 1

  conn.commit()
  return processed


def ingest_with_fallback(zones: list, conn) -> int:
  processed = 0
  with conn.cursor() as cur:
    for zone in zones:
      elev = fetch_elevation(zone["lat"], zone["lng"])
      slope = estimate_slope(zone["lat"], zone["lng"])
      cur.execute(
        """
        INSERT INTO zone_static_attributes
          (zone_id, slope_angle, elevation_m, land_cover, updated_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (zone_id) DO UPDATE SET
          slope_angle = COALESCE(EXCLUDED.slope_angle, zone_static_attributes.slope_angle),
          elevation_m = COALESCE(EXCLUDED.elevation_m, zone_static_attributes.elevation_m),
          updated_at = NOW()
        """,
        (zone["id"], slope, elev, "forest"),
      )
      processed += 1
  conn.commit()
  return processed


def main():
  parser = argparse.ArgumentParser(description="RIDGE GEE terrain ingestion")
  parser.add_argument("--database-url", default=os.environ.get("DATABASE_URL"))
  args = parser.parse_args()

  if not args.database_url:
    print("DATABASE_URL required")
    sys.exit(1)

  conn = psycopg2.connect(args.database_url)
  with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
    cur.execute("SELECT id, lat, lng FROM zones WHERE is_active = true ORDER BY id")
    zones = cur.fetchall()

  print(f"Processing {len(zones)} zones at {datetime.utcnow().isoformat()}Z")

  gee_count = ingest_with_gee(zones, conn)
  if gee_count == 0:
    print("Running Open-Meteo elevation fallback...")
    count = ingest_with_fallback(zones, conn)
    print(f"Updated {count} zones via Open-Meteo fallback")
  else:
    print(f"Updated {gee_count} zones via Google Earth Engine")

  conn.close()


if __name__ == "__main__":
  main()
