"""API integration tests for the ML service."""

import pytest
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_model():
    from src.model import get_model
    get_model()


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("healthy", "degraded")
    if data["status"] == "healthy":
        assert "model_version" in data
        assert data["metrics"]["auc"] >= 0


def test_predict_low_rainfall():
    res = client.post("/predict", json={
        "zone_id": "z01",
        "features": {
            "rainfall_1h": 0, "rainfall_24h": 5, "rainfall_72h": 10,
            "cumulative_7d": 20, "soil_saturation": 30, "slope_angle": 25,
            "elevation_m": 1400, "historical_events": 2, "seismic_index": 0.1,
        },
        "static_attrs": {"slope_angle": 25, "rainfall_p90": 180},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == "z01"
    assert data["risk_level"] == "Low"
    assert data["risk_score"] <= 2.0


def test_predict_high_rainfall_escalates():
    res = client.post("/predict", json={
        "zone_id": "z01",
        "features": {
            "rainfall_1h": 30, "rainfall_24h": 250, "rainfall_72h": 400,
            "cumulative_7d": 700, "soil_saturation": 95, "slope_angle": 35,
            "elevation_m": 1400, "historical_events": 5, "seismic_index": 0.5,
        },
        "static_attrs": {"slope_angle": 35, "rainfall_p90": 180},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_score"] >= 3.0
    assert data["risk_level"] in ("High", "Very High", "Critical")


def test_explain_returns_factors():
    res = client.post("/explain", json={
        "zone_id": "z01",
        "features": {
            "rainfall_1h": 25, "rainfall_24h": 200, "rainfall_72h": 350,
            "cumulative_7d": 600, "soil_saturation": 90, "slope_angle": 35,
            "elevation_m": 1400, "historical_events": 5, "seismic_index": 0.6,
        },
    })
    assert res.status_code == 200
    factors = res.json()["factors"]
    assert len(factors) >= 3
    assert all(isinstance(f["contributionPercent"], float) for f in factors)
    assert sum(f["contributionPercent"] for f in factors) == pytest.approx(100, abs=1)


def test_evaluation_report_exists():
    from pathlib import Path
    report = Path(__file__).resolve().parent.parent / "models" / "evaluation_report.json"
    assert report.exists()
    import json
    data = json.loads(report.read_text())
    assert data["auc"] >= 0.8
    assert data["test_samples"] > 0
