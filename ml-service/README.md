# RIDGE ML Service — Phase 3

Python FastAPI service for landslide risk prediction, 24-hour forecasting, and SHAP-based causative factor explanations.

## Quick Start

```bash
# Via Docker Compose (recommended)
cd ..
docker compose up -d ml-service

curl http://localhost:8000/health
```

## Local Development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Train model (uses data/gsi_landslides.json)
python -m src.train

# Run API
uvicorn src.main:app --reload --port 8000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Model version, metrics, status |
| POST | `/predict` | Single-zone risk prediction + triggers |
| POST | `/predict/batch` | Batch prediction for all zones |
| POST | `/forecast` | 24-hour risk trajectory |
| POST | `/explain` | SHAP top-5 causative factors |
| POST | `/train` | Retrain model from GSI inventory |

### Example: Predict

```bash
curl -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "zone_id": "z01",
    "features": {
      "rainfall_1h": 25, "rainfall_24h": 200, "rainfall_72h": 350,
      "cumulative_7d": 600, "soil_saturation": 90, "slope_angle": 35,
      "elevation_m": 1400, "historical_events": 5, "seismic_index": 0.6
    },
    "static_attrs": { "slope_angle": 35, "rainfall_p90": 180 }
  }'
```

## Model

- **Algorithm:** XGBoost binary classifier + isotonic calibration
- **Features:** 10 (rainfall windows, soil saturation, terrain, seismic, antecedent wetness)
- **Training data:** 20 GSI landslide positives + 120 synthetic negatives
- **Artifacts:** `models/xgb_landslide_v1.joblib`, `calibrator_v1.joblib`, `metadata.json`

## Scripts

```bash
python scripts/build_dataset.py   # Export training_features.csv
python scripts/ingest_gee.py      # GEE terrain (optional, Phase 2)
```

## Integration

The Express server calls this service via `ML_SERVICE_URL` (default `http://ml-service:8000` in Docker). Scoring runs automatically after rainfall ingestion (every 15 min) and forecast scoring runs hourly.
