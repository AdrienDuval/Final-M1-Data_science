"""
FastAPI backend — serves model predictions and dataset stats to the Next.js dashboard.

Usage:
    uvicorn api.main:app --reload --port 8000
    (run from project root)
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
from preprocessing import load_data, get_feature_names, NUMERIC_FEATURES

# ---------------------------------------------------------------------------
# App state (loaded once at startup)
# ---------------------------------------------------------------------------

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models
    with open(ROOT / "models" / "model_list.json") as f:
        model_names = json.load(f)
    state["models"] = {n: joblib.load(ROOT / "models" / f"{n}.pkl") for n in model_names}

    # Load splits
    with open(ROOT / "models" / "splits.pkl", "rb") as f:
        splits = pickle.load(f)
    state["splits"] = splits

    # Load CV results
    with open(ROOT / "models" / "cv_results.json") as f:
        state["cv"] = json.load(f)

    # Load full dataset for stats
    X, y = load_data()
    df = pd.concat([X.reset_index(drop=True), y.rename("Sales").reset_index(drop=True)], axis=1)
    df["Total_Budget"] = df[NUMERIC_FEATURES].sum(axis=1)
    df["ROI"] = df["Sales"] / df["Total_Budget"]
    state["df"] = df

    # Pre-compute and cache expensive results
    _build_metrics_cache()
    _build_feature_importance_cache()

    yield  # app runs here

    state.clear()


def _build_metrics_cache():
    X_test = state["splits"]["X_test"]
    y_test = state["splits"]["y_test"]
    cv = state["cv"]
    rows = []
    for name, pipeline in state["models"].items():
        y_pred = pipeline.predict(X_test)
        rows.append({
            "name": name,
            "label": name.replace("_", " ").title(),
            "r2":   round(float(r2_score(y_test, y_pred)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
            "mae":  round(float(mean_absolute_error(y_test, y_pred)), 4),
            "cv_r2_mean": cv.get(name, {}).get("mean", 0),
            "cv_r2_std":  cv.get(name, {}).get("std", 0),
        })
    state["metrics"] = sorted(rows, key=lambda x: x["r2"], reverse=True)


def _build_feature_importance_cache():
    preferred = ["gradient_boosting", "xgboost", "random_forest"]
    target = next((n for n in preferred if n in state["models"]), None)
    if target is None:
        state["feature_importance"] = []
        return
    pipeline = state["models"][target]
    feat_names = get_feature_names(pipeline)
    importances = pipeline.named_steps["model"].feature_importances_
    state["feature_importance"] = {
        "model": target,
        "features": sorted(
            [{"feature": fn, "importance": round(float(imp), 4)}
             for fn, imp in zip(feat_names, importances)],
            key=lambda x: x["importance"], reverse=True,
        ),
    }


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Marketing ROI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(state.get("models", {}).keys())}


@app.get("/stats")
def stats():
    df: pd.DataFrame = state["df"]

    # Sales distribution buckets (20 bins)
    counts, edges = np.histogram(df["Sales"].dropna(), bins=20)
    sales_dist = [
        {"range": f"{int(edges[i])}-{int(edges[i+1])}", "count": int(c)}
        for i, c in enumerate(counts)
    ]

    # Budget means per channel
    budget_breakdown = {col: round(float(df[col].mean()), 2) for col in NUMERIC_FEATURES}

    # Sales & ROI by influencer
    by_inf = df.groupby("Influencer")[["Sales", "ROI"]].mean().round(2)
    sales_by_influencer = by_inf["Sales"].to_dict()
    roi_by_influencer   = by_inf["ROI"].to_dict()

    # Correlations with Sales
    correlations = {
        col: round(float(df[col].corr(df["Sales"])), 4)
        for col in NUMERIC_FEATURES
    }

    return {
        "total_campaigns":   int(len(df)),
        "avg_sales":         round(float(df["Sales"].mean()), 2),
        "avg_roi":           round(float(df["ROI"].mean()), 4),
        "avg_total_budget":  round(float(df["Total_Budget"].mean()), 2),
        "best_channel":      max(correlations, key=correlations.get),
        "sales_distribution": sales_dist,
        "budget_breakdown":   budget_breakdown,
        "sales_by_influencer": sales_by_influencer,
        "roi_by_influencer":   roi_by_influencer,
        "correlations":        correlations,
    }


@app.get("/metrics")
def metrics():
    return {"models": state["metrics"]}


@app.get("/feature-importance")
def feature_importance():
    return state.get("feature_importance", {})


# ---------------------------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    TV:           float = Field(..., ge=0, le=500, description="TV budget in millions")
    Radio:        float = Field(..., ge=0, le=200, description="Radio budget in millions")
    Social_Media: float = Field(..., ge=0, le=50,  description="Social Media budget in millions")
    Influencer:   str   = Field(..., description="Mega | Macro | Micro | Nano")

    class Config:
        json_schema_extra = {
            "example": {"TV": 50, "Radio": 20, "Social_Media": 5, "Influencer": "Mega"}
        }


@app.post("/predict")
def predict(req: PredictRequest):
    if req.Influencer not in ("Mega", "Macro", "Micro", "Nano"):
        raise HTTPException(status_code=422, detail="Influencer must be Mega, Macro, Micro, or Nano")

    # Use best model (gradient_boosting or first available)
    preferred = ["gradient_boosting", "xgboost", "random_forest", "linear_regression"]
    model_name = next((n for n in preferred if n in state["models"]), None)
    if model_name is None:
        raise HTTPException(status_code=503, detail="No models loaded")

    pipeline = state["models"][model_name]
    X_input = pd.DataFrame([{
        "TV":           req.TV,
        "Radio":        req.Radio,
        "Social Media": req.Social_Media,
        "Influencer":   req.Influencer,
    }])
    predicted_sales = float(pipeline.predict(X_input)[0])
    total_budget = req.TV + req.Radio + req.Social_Media
    roi = predicted_sales / total_budget if total_budget > 0 else 0.0

    # Dataset averages for comparison
    df: pd.DataFrame = state["df"]
    avg_sales = float(df["Sales"].mean())

    return {
        "predicted_sales": round(predicted_sales, 2),
        "roi":             round(roi, 4),
        "total_budget":    round(total_budget, 2),
        "vs_average":      round(predicted_sales - avg_sales, 2),
        "model_used":      model_name,
    }


@app.post("/predict/all")
def predict_all(req: PredictRequest):
    """Predict with all models — used for model comparison in the simulator."""
    if req.Influencer not in ("Mega", "Macro", "Micro", "Nano"):
        raise HTTPException(status_code=422, detail="Invalid influencer type")

    X_input = pd.DataFrame([{
        "TV":           req.TV,
        "Radio":        req.Radio,
        "Social Media": req.Social_Media,
        "Influencer":   req.Influencer,
    }])
    results = []
    for name, pipeline in state["models"].items():
        pred = float(pipeline.predict(X_input)[0])
        total = req.TV + req.Radio + req.Social_Media
        results.append({
            "model":           name,
            "label":           name.replace("_", " ").title(),
            "predicted_sales": round(pred, 2),
            "roi":             round(pred / total, 4) if total > 0 else 0,
        })
    return {"predictions": results}
