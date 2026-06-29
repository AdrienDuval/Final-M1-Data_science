"""
Training script for the FastAPI pipeline.

Trains 4 regression models using RandomizedSearchCV, then saves:
  models/{name}.pkl       : fitted sklearn Pipeline (preprocessor + model)
  models/splits.pkl       : exact train/test split used (for evaluate.py)
  models/model_list.json  : ordered model names (loaded by api/main.py)
  models/cv_results.json  : cross-validation R² per model

Usage:
    python src/train.py
"""
import sys
import json
import pickle
import joblib
import numpy as np
from pathlib import Path

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import RandomizedSearchCV, cross_val_score

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

sys.path.insert(0, str(Path(__file__).parent))
from preprocessing import (load_data, build_pipeline, split_data,
                            NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET_REG)

ROOT       = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42
CV_FOLDS     = 5


# ── Model definitions ─────────────────────────────────────────────────────────

def define_models() -> dict:
    models = {
        "linear_regression": LinearRegression(),
        "random_forest":     RandomForestRegressor(n_estimators=200,
                                                    random_state=RANDOM_STATE,
                                                    n_jobs=-1),
        "mlp": MLPRegressor(
            hidden_layer_sizes=(64, 32), activation="relu", solver="adam",
            max_iter=500, early_stopping=True, validation_fraction=0.1,
            random_state=RANDOM_STATE,
        ),
    }
    if HAS_XGB:
        models["gradient_boosting"] = XGBRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=5,
            subsample=0.8, colsample_bytree=0.8,
            random_state=RANDOM_STATE, verbosity=0,
        )
    else:
        print("XGBoost not found. Falling back to sklearn GradientBoostingRegressor.")
        models["gradient_boosting"] = GradientBoostingRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=5,
            random_state=RANDOM_STATE,
        )
    return models


# ── Tuning helper ─────────────────────────────────────────────────────────────

def tune(pipeline, param_grid: dict, X_train, y_train,
         n_iter: int = 15):
    """RandomizedSearchCV wrapper; returns best estimator and params."""
    search = RandomizedSearchCV(
        pipeline, param_grid,
        n_iter=n_iter, cv=CV_FOLDS,
        scoring="neg_root_mean_squared_error",
        random_state=RANDOM_STATE, n_jobs=-1, verbose=0,
    )
    search.fit(X_train, y_train)
    return search.best_estimator_, search.best_params_


# ── Training ──────────────────────────────────────────────────────────────────

def train_all(X_train, y_train) -> dict:
    models  = define_models()
    trained = {}

    print("\n[1/4] Linear Regression...")
    pipe = build_pipeline(models["linear_regression"])
    pipe.fit(X_train, y_train)
    trained["linear_regression"] = pipe

    print("[2/4] Random Forest (RandomizedSearchCV)...")
    rf_grid = {
        "model__n_estimators":      [100, 200, 300, 500],
        "model__max_depth":         [None, 5, 10, 20],
        "model__min_samples_split": [2, 5, 10],
        "model__min_samples_leaf":  [1, 2, 4],
    }
    best_rf, rf_params = tune(build_pipeline(models["random_forest"]),
                               rf_grid, X_train, y_train)
    trained["random_forest"] = best_rf
    print(f"   Best: {rf_params}")

    print("[3/4] Gradient Boosting (RandomizedSearchCV)...")
    gb_grid = {
        "model__n_estimators":  [100, 200, 300, 500],
        "model__max_depth":     [3, 5, 7],
        "model__learning_rate": [0.01, 0.05, 0.1, 0.2],
        "model__subsample":     [0.6, 0.8, 1.0],
    }
    if HAS_XGB:
        gb_grid["model__colsample_bytree"] = [0.6, 0.8, 1.0]
    best_gb, gb_params = tune(build_pipeline(models["gradient_boosting"]),
                               gb_grid, X_train, y_train)
    trained["gradient_boosting"] = best_gb
    print(f"   Best: {gb_params}")

    print("[4/4] MLP Neural Network...")
    pipe_mlp = build_pipeline(models["mlp"])
    pipe_mlp.fit(X_train, y_train)
    trained["mlp"] = pipe_mlp

    return trained


def cross_validate_all(trained: dict, X_train, y_train) -> dict:
    print("\nCross-validation R² (5-fold, train set):")
    cv_results = {}
    for name, pipeline in trained.items():
        scores = cross_val_score(pipeline, X_train, y_train,
                                  cv=CV_FOLDS, scoring="r2", n_jobs=-1)
        cv_results[name] = {
            "mean": round(float(scores.mean()), 4),
            "std":  round(float(scores.std()),  4),
        }
        print(f"   {name:<22}  R² = {scores.mean():.4f} ± {scores.std():.4f}")
    return cv_results


# ── Persistence ───────────────────────────────────────────────────────────────

def save_artifacts(trained: dict, X_train, X_test, y_train, y_test,
                   cv_results: dict):
    for name, pipeline in trained.items():
        joblib.dump(pipeline, MODELS_DIR / f"{name}.pkl")

    with open(MODELS_DIR / "model_list.json", "w") as f:
        json.dump(list(trained.keys()), f)

    with open(MODELS_DIR / "cv_results.json", "w") as f:
        json.dump(cv_results, f, indent=2)

    with open(MODELS_DIR / "splits.pkl", "wb") as f:
        pickle.dump({"X_train": X_train, "X_test": X_test,
                     "y_train": y_train, "y_test": y_test}, f)

    print(f"\nSaved {len(trained)} models + artifacts → {MODELS_DIR}")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Loading data...")
    df = load_data()                               # returns DataFrame
    X  = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y  = df[TARGET_REG]

    X_train, X_test, y_train, y_test = split_data(df, task="regression")
    print(f"Train: {len(X_train)} rows | Test: {len(X_test)} rows")

    print("\nTraining models...")
    trained    = train_all(X_train, y_train)
    cv_results = cross_validate_all(trained, X_train, y_train)
    save_artifacts(trained, X_train, X_test, y_train, y_test, cv_results)

    print("\nDone. Next: uvicorn api.main:app --reload --port 8000")
