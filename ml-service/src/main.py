"""FastAPI ML inference service for RIDGE landslide risk prediction."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .forecast import forecast_24h
from .model import get_model
from .train import train

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PredictRequest(BaseModel):
    zone_id: str
    features: dict[str, Any]
    static_attrs: dict[str, Any] = Field(default_factory=dict)


class BatchPredictRequest(BaseModel):
    zones: list[PredictRequest]


class ForecastRequest(BaseModel):
    zone_id: str
    features: dict[str, Any]
    hourly_forecast: list[dict[str, Any]]


class ExplainRequest(BaseModel):
    zone_id: str
    features: dict[str, Any]


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        get_model()
        logger.info("ML model loaded successfully")
    except FileNotFoundError:
        logger.warning("No trained model found — training now...")
        train()
        get_model()
    yield


app = FastAPI(title="RIDGE ML Service", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health():
    try:
        model = get_model()
        return {
            "status": "healthy",
            "model_version": model.version,
            "last_trained": model.last_trained,
            "metrics": model.metadata.get("metrics"),
        }
    except Exception as e:
        return {"status": "degraded", "error": str(e)}


@app.post("/predict")
def predict(req: PredictRequest):
    try:
        model = get_model()
        result = model.predict(req.zone_id, req.features, req.static_attrs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/predict/batch")
def predict_batch(req: BatchPredictRequest):
    try:
        model = get_model()
        results = [
            model.predict(z.zone_id, z.features, z.static_attrs)
            for z in req.zones
        ]
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/forecast")
def forecast(req: ForecastRequest):
    try:
        trajectory = forecast_24h(req.zone_id, req.features, req.hourly_forecast)
        return {"zone_id": req.zone_id, "trajectory": trajectory}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/explain")
def explain(req: ExplainRequest):
    try:
        model = get_model()
        factors = model.explain(req.features)
        return {"zone_id": req.zone_id, "factors": factors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/train")
def trigger_train():
    try:
        metrics = train()
        import src.model as model_module
        model_module._model = None
        get_model()
        return {"ok": True, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
