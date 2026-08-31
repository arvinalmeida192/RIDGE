#!/bin/bash
set -e

if [ ! -f models/xgb_landslide_v1.joblib ]; then
  echo "No model found — training initial model..."
  python -m src.train
fi

exec uvicorn src.main:app --host 0.0.0.0 --port 8000
