"""Trigger factor analysis — pre/post ML inference escalation."""

from __future__ import annotations


def analyze_triggers(readings: dict, static_attrs: dict) -> tuple[list[str], float]:
    triggers: list[str] = []
    score_boost = 0.0

    rainfall_72h = float(readings.get("rainfall_72h") or 0)
    rainfall_p90 = float(static_attrs.get("rainfall_p90") or 180)
    soil_saturation = float(readings.get("soil_saturation") or 0)
    slope_angle = float(static_attrs.get("slope_angle") or 0)
    rainfall_1h = float(readings.get("rainfall_1h") or 0)
    rainfall_24h = float(readings.get("rainfall_24h") or 0)
    seismic_index = float(static_attrs.get("seismic_index") or readings.get("seismic_index") or 0)
    sensor_status = readings.get("sensor_status") or "Online"

    if rainfall_72h > rainfall_p90:
        triggers.append("72h rainfall exceeds 90th percentile")
        score_boost += 0.3

    if soil_saturation > 85:
        triggers.append("Soil saturation critical (>85%)")
        score_boost += 0.4

    if slope_angle > 30 and soil_saturation > 70:
        triggers.append("Steep slope + saturated soil")
        score_boost += 0.35

    if rainfall_1h > 15 and rainfall_24h > 100:
        triggers.append("Intense rainfall on wet antecedent conditions")
        score_boost += 0.25

    if seismic_index > 0.5:
        triggers.append("Elevated seismic activity near fault")
        score_boost += 0.2

    if sensor_status == "Offline":
        triggers.append("Sensor offline — reduced confidence")

    return triggers, min(score_boost, 1.0)


def apply_trigger_boost(ml_score: float, trigger_boost: float) -> float:
    return round(min(5.0, max(1.0, ml_score + trigger_boost)), 2)
