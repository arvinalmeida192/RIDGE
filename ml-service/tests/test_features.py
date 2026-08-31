"""Unit tests for feature engineering."""

from src.features import (
    compute_antecedent_wetness,
    enrich_features,
    probability_to_risk_score,
    risk_from_score,
)


def test_risk_from_score_boundaries():
    assert risk_from_score(1.0) == "Low"
    assert risk_from_score(2.5) == "High"
    assert risk_from_score(4.5) == "Critical"


def test_probability_to_risk_score():
    assert probability_to_risk_score(0.0) == 1.0
    assert probability_to_risk_score(1.0) == 5.0


def test_antecedent_wetness_increases_with_rainfall():
    low = compute_antecedent_wetness({"rainfall_24h": 10, "rainfall_72h": 20, "soil_saturation": 30})
    high = compute_antecedent_wetness({"rainfall_24h": 150, "rainfall_72h": 300, "soil_saturation": 80})
    assert high > low
    assert 0 <= high <= 1


def test_enrich_features_adds_antecedent_wetness():
    enriched = enrich_features({"rainfall_24h": 50, "soil_saturation": 60})
    assert "antecedent_wetness" in enriched
    assert enriched["slope_angle"] == 15  # default
