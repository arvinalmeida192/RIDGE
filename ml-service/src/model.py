"""Model loading, prediction, and SHAP explanations."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import shap

from .features import (
    FEATURE_NAMES,
    HUMAN_NAMES,
    enrich_features,
    features_to_vector,
    probability_to_risk_score,
    risk_from_score,
)
from .triggers import analyze_triggers, apply_trigger_boost

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
XGB_PATH = MODELS_DIR / "xgb_landslide_v1.joblib"
CALIBRATOR_PATH = MODELS_DIR / "calibrator_v1.joblib"
METADATA_PATH = MODELS_DIR / "metadata.json"


class RiskModel:
    def __init__(self) -> None:
        self.xgb_model = None
        self.calibrator = None
        self.explainer = None
        self.metadata: dict = {}
        self._load()

    def _load(self) -> None:
        if not XGB_PATH.exists() or not CALIBRATOR_PATH.exists():
            raise FileNotFoundError(
                f"Model files not found in {MODELS_DIR}. Run: python -m src.train"
            )
        self.xgb_model = joblib.load(XGB_PATH)
        self.calibrator = joblib.load(CALIBRATOR_PATH)
        self.explainer = shap.TreeExplainer(self.xgb_model)
        if METADATA_PATH.exists():
            self.metadata = json.loads(METADATA_PATH.read_text())
        logger.info("Loaded model version %s", self.metadata.get("version", "unknown"))

    @property
    def version(self) -> str:
        return self.metadata.get("version", "v1")

    @property
    def last_trained(self) -> str | None:
        return self.metadata.get("trained_at")

    def predict_probability(self, features: dict) -> float:
        X = features_to_vector(features)
        raw_prob = float(self.xgb_model.predict_proba(X)[0][1])
        calibrated = float(self.calibrator.predict([raw_prob])[0])
        return round(min(1.0, max(0.0, calibrated)), 4)

    def predict(self, zone_id: str, features: dict, static_attrs: dict | None = None) -> dict:
        static_attrs = static_attrs or {}
        enriched = enrich_features(features)

        triggers, trigger_boost = analyze_triggers(
            {**enriched, "sensor_status": features.get("sensor_status")},
            static_attrs,
        )

        probability = self.predict_probability(enriched)
        ml_score = probability_to_risk_score(probability)
        final_score = apply_trigger_boost(ml_score, trigger_boost)
        risk_level = risk_from_score(final_score)

        return {
            "zone_id": zone_id,
            "probability": probability,
            "ml_score": ml_score,
            "risk_score": final_score,
            "risk_level": risk_level,
            "confidence": round(probability * 100, 1),
            "trigger_boost": trigger_boost,
            "active_triggers": triggers,
        }

    def explain(self, features: dict, top_n: int = 5) -> list[dict]:
        enriched = enrich_features(features)
        X = features_to_vector(enriched)

        try:
            explanation = self.explainer(X)
            values = np.array(explanation.values[0]).flatten()
        except Exception:
            shap_values = self.explainer.shap_values(X, check_additivity=False)
            if isinstance(shap_values, list):
                values = np.array(shap_values[1][0]).flatten()
            elif hasattr(shap_values, "shape") and len(shap_values.shape) == 2:
                values = shap_values[0]
            else:
                values = np.array(shap_values).flatten()

        pairs = sorted(zip(FEATURE_NAMES, values), key=lambda x: abs(float(x[1])), reverse=True)[:top_n]
        total = sum(abs(float(v)) for _, v in pairs) or 1.0

        return [
            {
                "factor": HUMAN_NAMES.get(name, name),
                "contributionPercent": float(round(abs(float(val)) / total * 100, 1)),
            }
            for name, val in pairs
        ]


_model: RiskModel | None = None


def get_model() -> RiskModel:
    global _model
    if _model is None:
        _model = RiskModel()
    return _model
