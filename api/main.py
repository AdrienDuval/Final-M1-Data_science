"""
FastAPI backend — serves predictions and dataset stats to the Next.js dashboard.

Usage:
    uvicorn api.main:app --reload --port 8000   (run from project root)

Endpoints:
    GET  /health
    GET  /stats
    GET  /metrics
    GET  /feature-importance
    POST /predict         — best model only
    POST /predict/all     — all models (for simulator comparison)
"""
import sys
import json
import pickle
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))

from preprocessing import (load_data, get_feature_names,
                            NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET_REG)

# ── App state (loaded once at startup) ───────────────────────────────────────
state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Models
    with open(ROOT / "models" / "model_list.json") as f:
        model_names = json.load(f)
    state["models"] = {
        n: joblib.load(ROOT / "models" / f"{n}.pkl") for n in model_names
    }

    # Train/test split (saved by src/train.py)
    with open(ROOT / "models" / "splits.pkl", "rb") as f:
        state["splits"] = pickle.load(f)

    # Cross-validation results
    with open(ROOT / "models" / "cv_results.json") as f:
        state["cv"] = json.load(f)

    # Full dataset for /stats
    df = load_data()
    df["Total_Budget"] = df[NUMERIC_FEATURES].sum(axis=1)
    df["ROI"]          = df[TARGET_REG] / df["Total_Budget"]
    state["df"] = df

    # Pre-compute expensive caches
    _build_metrics_cache()
    _build_feature_importance_cache()

    yield
    state.clear()


def _build_metrics_cache():
    X_test = state["splits"]["X_test"]
    y_test = state["splits"]["y_test"]
    cv     = state["cv"]
    rows   = []
    for name, pipeline in state["models"].items():
        y_pred = pipeline.predict(X_test)
        rows.append({
            "name":        name,
            "label":       name.replace("_", " ").title(),
            "r2":          round(float(r2_score(y_test, y_pred)), 4),
            "rmse":        round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
            "mae":         round(float(mean_absolute_error(y_test, y_pred)), 4),
            "cv_r2_mean":  cv.get(name, {}).get("mean", 0),
            "cv_r2_std":   cv.get(name, {}).get("std",  0),
        })
    state["metrics"] = sorted(rows, key=lambda x: x["r2"], reverse=True)


def _build_feature_importance_cache():
    preferred = ["gradient_boosting", "random_forest"]
    target    = next((n for n in preferred if n in state["models"]), None)
    if target is None:
        state["feature_importance"] = []
        return
    pipeline   = state["models"][target]
    feat_names = get_feature_names(pipeline.named_steps["preprocessor"])
    importances = pipeline.named_steps["model"].feature_importances_
    state["feature_importance"] = {
        "model": target,
        "features": sorted(
            [{"feature": fn, "importance": round(float(imp), 4)}
             for fn, imp in zip(feat_names, importances)],
            key=lambda x: x["importance"], reverse=True,
        ),
    }


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Marketing ROI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(state.get("models", {}).keys())}


@app.get("/stats")
def stats():
    df: pd.DataFrame = state["df"]

    counts, edges = np.histogram(df[TARGET_REG].dropna(), bins=20)
    sales_dist = [
        {"range": f"{int(edges[i])}-{int(edges[i+1])}", "count": int(c)}
        for i, c in enumerate(counts)
    ]
    budget_breakdown     = {col: round(float(df[col].mean()), 2) for col in NUMERIC_FEATURES}
    by_inf               = df.groupby("Influencer")[[TARGET_REG, "ROI"]].mean().round(2)
    correlations         = {col: round(float(df[col].corr(df[TARGET_REG])), 4)
                            for col in NUMERIC_FEATURES}

    return {
        "total_campaigns":      int(len(df)),
        "avg_sales":            round(float(df[TARGET_REG].mean()), 2),
        "avg_roi":              round(float(df["ROI"].mean()), 4),
        "avg_total_budget":     round(float(df["Total_Budget"].mean()), 2),
        "best_channel":         max(correlations, key=correlations.get),
        "sales_distribution":   sales_dist,
        "budget_breakdown":     budget_breakdown,
        "sales_by_influencer":  by_inf[TARGET_REG].to_dict(),
        "roi_by_influencer":    by_inf["ROI"].to_dict(),
        "correlations":         correlations,
    }


@app.get("/metrics")
def metrics():
    return {"models": state["metrics"]}


@app.get("/feature-importance")
def feature_importance():
    return state.get("feature_importance", {})


# ── Prediction ────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    TV:           float = Field(..., ge=0, le=500, description="TV budget in $M")
    Radio:        float = Field(..., ge=0, le=200, description="Radio budget in $M")
    Social_Media: float = Field(..., ge=0, le=50,  description="Social Media budget in $M")
    Influencer:   str   = Field(..., description="Mega | Macro | Micro | Nano")

    model_config = {
        "json_schema_extra": {
            "example": {"TV": 50, "Radio": 20, "Social_Media": 5, "Influencer": "Mega"}
        }
    }


def _build_input(req: PredictRequest) -> pd.DataFrame:
    return pd.DataFrame([{
        "TV":           req.TV,
        "Radio":        req.Radio,
        "Social Media": req.Social_Media,
        "Influencer":   req.Influencer,
    }])


@app.post("/predict")
def predict(req: PredictRequest):
    if req.Influencer not in ("Mega", "Macro", "Micro", "Nano"):
        raise HTTPException(status_code=422, detail="Invalid Influencer value")

    preferred  = ["gradient_boosting", "random_forest", "linear_regression", "mlp"]
    model_name = next((n for n in preferred if n in state["models"]), None)
    if model_name is None:
        raise HTTPException(status_code=503, detail="No models loaded")

    pred         = float(state["models"][model_name].predict(_build_input(req))[0])
    total_budget = req.TV + req.Radio + req.Social_Media
    avg_sales    = float(state["df"][TARGET_REG].mean())

    return {
        "predicted_sales": round(pred, 2),
        "roi":             round(pred / total_budget, 4) if total_budget > 0 else 0.0,
        "total_budget":    round(total_budget, 2),
        "vs_average":      round(pred - avg_sales, 2),
        "model_used":      model_name,
    }


@app.post("/predict/all")
def predict_all(req: PredictRequest):
    """Return predictions from every loaded model (used by Next.js simulator)."""
    if req.Influencer not in ("Mega", "Macro", "Micro", "Nano"):
        raise HTTPException(status_code=422, detail="Invalid Influencer value")

    X_in  = _build_input(req)
    total = req.TV + req.Radio + req.Social_Media
    return {
        "predictions": [
            {
                "model":           name,
                "label":           name.replace("_", " ").title(),
                "predicted_sales": round(float(pipeline.predict(X_in)[0]), 2),
                "roi":             round(float(pipeline.predict(X_in)[0]) / total, 4)
                                   if total > 0 else 0.0,
            }
            for name, pipeline in state["models"].items()
        ]
    }
