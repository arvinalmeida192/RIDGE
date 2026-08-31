"""Training pipeline: XGBoost + isotonic calibration + evaluation."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from xgboost import XGBClassifier

from .features import FEATURE_NAMES, enrich_features

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GSI_PATHS = [
    Path(__file__).resolve().parent.parent.parent / "server" / "src" / "data" / "gsi_landslides.json",
    Path("/app/server_data/gsi_landslides.json"),
    Path(__file__).resolve().parent.parent / "data" / "gsi_landslides.json",
]


def _find_gsi_file() -> Path | None:
    for p in GSI_PATHS:
        if p.exists():
            return p
    return None


def _load_gsi_positives() -> list[dict]:
    import json as json_lib

    gsi_path = _find_gsi_file()
    if gsi_path:
        incidents = json_lib.loads(gsi_path.read_text())
        samples = []
        for inc in incidents:
            samples.append({
                "rainfall_1h": np.random.uniform(8, 35),
                "rainfall_24h": np.random.uniform(80, 250),
                "rainfall_72h": np.random.uniform(150, 400),
                "cumulative_7d": np.random.uniform(300, 800),
                "soil_saturation": np.random.uniform(75, 95),
                "slope_angle": np.random.uniform(25, 45),
                "elevation_m": np.random.uniform(400, 1800),
                "historical_events": np.random.randint(1, 6),
                "seismic_index": np.random.uniform(0.2, 0.7),
                "label": 1,
            })
        return samples

    csv_path = DATA_DIR / "landslide_inventory.csv"
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        return df[df["label"] == 1].to_dict("records")
    return []


def _generate_negatives(n: int = 120) -> list[dict]:
    samples = []
    for _ in range(n):
        samples.append({
            "rainfall_1h": np.random.uniform(0, 8),
            "rainfall_24h": np.random.uniform(0, 60),
            "rainfall_72h": np.random.uniform(0, 120),
            "cumulative_7d": np.random.uniform(0, 200),
            "soil_saturation": np.random.uniform(20, 65),
            "slope_angle": np.random.uniform(5, 25),
            "elevation_m": np.random.uniform(50, 1200),
            "historical_events": np.random.randint(0, 2),
            "seismic_index": np.random.uniform(0.05, 0.3),
            "label": 0,
        })
    return samples


def build_training_dataframe() -> pd.DataFrame:
    positives = _load_gsi_positives()
    negatives = _generate_negatives(max(120, len(positives) * 6))

    rows = []
    for raw in positives + negatives:
        label = raw.pop("label", 0)
        enriched = enrich_features(raw)
        enriched["label"] = label
        rows.append(enriched)

    return pd.DataFrame(rows)


def train(save: bool = True) -> dict:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    df = build_training_dataframe()
    df.to_csv(DATA_DIR / "training_features.csv", index=False)

    X = df[FEATURE_NAMES].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )

    xgb = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="logloss",
    )

    cv_scores = cross_val_score(xgb, X_train, y_train, cv=5, scoring="roc_auc")
    xgb.fit(X_train, y_train)

    raw_probs_train = xgb.predict_proba(X_train)[:, 1]
    raw_probs_test = xgb.predict_proba(X_test)[:, 1]

    from sklearn.isotonic import IsotonicRegression
    iso = IsotonicRegression(out_of_bounds="clip")
    iso.fit(raw_probs_train, y_train)

    calibrated_probs = iso.predict(raw_probs_test)
    y_pred = (calibrated_probs >= 0.5).astype(int)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "auc": round(float(roc_auc_score(y_test, calibrated_probs)), 4),
        "cv_auc_mean": round(float(cv_scores.mean()), 4),
        "cv_auc_std": round(float(cv_scores.std()), 4),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "positive_samples": int(y.sum()),
        "negative_samples": int(len(y) - y.sum()),
    }

    if save:
        joblib.dump(xgb, MODELS_DIR / "xgb_landslide_v1.joblib")
        joblib.dump(iso, MODELS_DIR / "calibrator_v1.joblib")

        metadata = {
            "version": "v1",
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "features": FEATURE_NAMES,
            "metrics": metrics,
        }
        (MODELS_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))
        (MODELS_DIR / "evaluation_report.json").write_text(json.dumps(metrics, indent=2))

    logger.info("Training complete — AUC=%.3f F1=%.3f", metrics["auc"], metrics["f1"])
    return metrics


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train()
    print(json.dumps(result, indent=2))
