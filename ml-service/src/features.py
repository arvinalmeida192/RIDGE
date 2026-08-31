"""Feature engineering for landslide risk prediction."""

from __future__ import annotations

import numpy as np

FEATURE_NAMES = [
    "rainfall_1h",
    "rainfall_24h",
    "rainfall_72h",
    "cumulative_7d",
    "soil_saturation",
    "slope_angle",
    "elevation_m",
    "historical_events",
    "seismic_index",
    "antecedent_wetness",
]

HUMAN_NAMES = {
    "rainfall_1h": "Hourly rainfall intensity",
    "rainfall_24h": "24-hour cumulative rainfall",
    "rainfall_72h": "72-hour antecedent rainfall",
    "cumulative_7d": "7-day cumulative rainfall",
    "soil_saturation": "Soil saturation level",
    "slope_angle": "Terrain slope angle",
    "elevation_m": "Elevation above sea level",
    "historical_events": "Historical landslide frequency",
    "seismic_index": "Seismic activity index",
    "antecedent_wetness": "Antecedent soil wetness",
}


def compute_antecedent_wetness(features: dict) -> float:
    """Combine rainfall windows into a 0–1 wetness index."""
    r24 = float(features.get("rainfall_24h") or 0)
    r72 = float(features.get("rainfall_72h") or 0)
    soil = float(features.get("soil_saturation") or 0) / 100.0
    return round(min(1.0, (r24 / 200.0) * 0.4 + (r72 / 400.0) * 0.35 + soil * 0.25), 4)


def enrich_features(raw: dict) -> dict:
    """Fill defaults and compute derived features."""
    enriched = {
        "rainfall_1h": float(raw.get("rainfall_1h") or 0),
        "rainfall_24h": float(raw.get("rainfall_24h") or 0),
        "rainfall_72h": float(raw.get("rainfall_72h") or 0),
        "cumulative_7d": float(raw.get("cumulative_7d") or 0),
        "soil_saturation": float(raw.get("soil_saturation") or 0),
        "slope_angle": float(raw.get("slope_angle") or 15),
        "elevation_m": float(raw.get("elevation_m") or 500),
        "historical_events": float(raw.get("historical_events") or 0),
        "seismic_index": float(raw.get("seismic_index") or 0.1),
    }
    enriched["antecedent_wetness"] = compute_antecedent_wetness(enriched)
    return enriched


def features_to_vector(features: dict) -> np.ndarray:
    enriched = enrich_features(features)
    return np.array([[enriched[name] for name in FEATURE_NAMES]], dtype=np.float64)


def risk_from_score(score: float) -> str:
    if score >= 4.5:
        return "Critical"
    if score >= 3.5:
        return "Very High"
    if score >= 2.5:
        return "High"
    if score >= 1.5:
        return "Moderate"
    return "Low"


def probability_to_risk_score(probability: float) -> float:
    return round(1.0 + 4.0 * float(probability), 2)
