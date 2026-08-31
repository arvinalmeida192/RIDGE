"""24-hour risk forecast engine."""

from __future__ import annotations

from .features import enrich_features, probability_to_risk_score
from .model import get_model


def forecast_24h(zone_id: str, current_features: dict, hourly_forecast: list[dict]) -> list[dict]:
    """
    Project risk scores over the next 24 hours using forecast precipitation.
    hourly_forecast: [{time, precipitation_mm, soil_moisture?}, ...]
    """
    model = get_model()
    trajectory = []
    rolling = enrich_features(current_features)
    precip_series = [float(h.get("precipitation_mm") or 0) for h in hourly_forecast[:24]]

    for hour_idx, hour_data in enumerate(hourly_forecast[:24]):
        precip = float(hour_data.get("precipitation_mm") or 0)
        rolling["rainfall_1h"] = precip

        start = max(0, hour_idx - 23)
        rolling["rainfall_24h"] = sum(precip_series[start : hour_idx + 1])
        start72 = max(0, hour_idx - 71)
        rolling["rainfall_72h"] = sum(precip_series[start72 : hour_idx + 1]) if hour_idx >= 71 else rolling["rainfall_72h"]
        rolling["cumulative_7d"] = rolling.get("cumulative_7d", 0) + precip

        if hour_data.get("soil_moisture") is not None:
            rolling["soil_saturation"] = float(hour_data["soil_moisture"])

        rolling["antecedent_wetness"] = min(
            1.0,
            (rolling["rainfall_24h"] / 200.0) * 0.4
            + (rolling["rainfall_72h"] / 400.0) * 0.35
            + (rolling["soil_saturation"] / 100.0) * 0.25,
        )

        prob = model.predict_probability(rolling)
        score = probability_to_risk_score(prob)

        trajectory.append({
            "time": hour_data.get("time") or hour_data.get("forecast_time"),
            "value": score,
            "confidenceLow": round(max(1.0, score - 0.4), 2),
            "confidenceHigh": round(min(5.0, score + 0.3), 2),
        })

    return trajectory
