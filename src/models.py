"""
Classification training entry point.

Regression models for the API are trained by src/train.py (models/{name}.pkl).
This script trains only the classification stack consumed by the API's /classify
endpoint and by src/evaluate.py:

    models/{name}_classification.pkl   — fitted estimators (expect preprocessed arrays)
    models/pipeline_classification.pkl — fitted preprocessor
    models/label_encoder.pkl           — class label encoder

Usage:
    python src/models.py          # trains the classification models
"""
import joblib
from pathlib import Path

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import RandomizedSearchCV

try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

MODELS_DIR   = Path(__file__).parent.parent / "models"
RANDOM_STATE = 42
CV_FOLDS     = 5
TUNE_ITER    = 15   # RandomizedSearchCV iterations (keep fast; increase for final runs)

# ── Tuning parameter grids ────────────────────────────────────────────────────
_RF_PARAM_GRID = {
    "n_estimators":      [100, 200, 300, 500],
    "max_depth":         [None, 5, 10, 20],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf":  [1, 2, 4],
}

_GB_PARAM_GRID = {
    "n_estimators":  [100, 200, 300, 500],
    "max_depth":     [3, 5, 7],
    "learning_rate": [0.01, 0.05, 0.1, 0.2],
    "subsample":     [0.6, 0.8, 1.0],
}

# ── Shared MLP hyper-parameters ───────────────────────────────────────────────
_MLP_KWARGS = dict(
    hidden_layer_sizes=(128, 64, 32),
    activation="relu",
    solver="adam",
    alpha=1e-4,
    batch_size=64,
    learning_rate="adaptive",
    max_iter=500,
    early_stopping=True,
    validation_fraction=0.1,
    n_iter_no_change=15,
    random_state=42,
)

# ── Shared gradient boosting hyper-parameters ─────────────────────────────────
_GB_KWARGS = dict(n_estimators=300, learning_rate=0.05, max_depth=6, random_state=42)


# ── Model catalogues ──────────────────────────────────────────────────────────

def get_classification_models() -> dict:
    return {
        "logistic_regression": LogisticRegression(max_iter=1000,
                                                   class_weight="balanced",
                                                   random_state=42),
        "random_forest":       RandomForestClassifier(n_estimators=200,
                                                       class_weight="balanced",
                                                       random_state=42, n_jobs=-1),
        "gradient_boosting":  (XGBClassifier(**_GB_KWARGS, n_jobs=-1,
                                              eval_metric="mlogloss")
                               if XGB_AVAILABLE else
                               GradientBoostingClassifier(**_GB_KWARGS)),
        "mlp":                 MLPClassifier(**_MLP_KWARGS),
    }


# ── Persistence helpers ───────────────────────────────────────────────────────

def save_model(model, name: str):
    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODELS_DIR / name)
    print(f"Saved → models/{name}")


def load_model(name: str):
    return joblib.load(MODELS_DIR / name)


# ── Tuning helper ─────────────────────────────────────────────────────────────

def _tune(model, param_grid: dict, X_tr, y_tr, scoring: str) -> object:
    """
    Run RandomizedSearchCV and return the best estimator.
    `scoring` is a sklearn scorer string, e.g. 'neg_root_mean_squared_error' or 'f1_macro'.
    """
    search = RandomizedSearchCV(
        model, param_grid,
        n_iter=TUNE_ITER, cv=CV_FOLDS,
        scoring=scoring, random_state=RANDOM_STATE,
        n_jobs=-1, verbose=0,
    )
    search.fit(X_tr, y_tr)
    print(f"    Best params: {search.best_params_}")
    return search.best_estimator_


# ── Training entry point ──────────────────────────────────────────────────────

def train_all(task: str = "classification"):
    """
    Train all models for the given task with RandomizedSearchCV for RF & GB.
    Fits and saves the preprocessor, then saves each trained model.
    Returns (trained_dict, preprocessor, X_train_transformed, y_train, y_test).
    """
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from preprocessing import load_data, split_data, get_fitted_preprocessor, save_pipeline

    df      = load_data()
    X_train, X_test, y_train, y_test = split_data(df, task=task)
    prep    = get_fitted_preprocessor(X_train)
    save_pipeline(prep, f"pipeline_{task}.pkl")

    X_tr = prep.transform(X_train)

    from sklearn.preprocessing import LabelEncoder
    le   = LabelEncoder()
    y_tr = le.fit_transform(y_train)
    save_model(le, "label_encoder.pkl")
    scoring_rf = "f1_macro"
    scoring_gb = "f1_macro"

    models = get_classification_models()

    trained = {}
    for name, m in models.items():
        print(f"  Training {name}...")
        if name == "random_forest":
            m = _tune(m, _RF_PARAM_GRID, X_tr, y_tr, scoring_rf)
        elif name == "gradient_boosting":
            m = _tune(m, _GB_PARAM_GRID, X_tr, y_tr, scoring_gb)
        else:
            m.fit(X_tr, y_tr)
        save_model(m, f"{name}_{task}.pkl")
        trained[name] = m

    print(f"\nAll {task} models trained and saved.")
    return trained, prep, X_tr, y_train, y_test


if __name__ == "__main__":
    print("=== Classification ===")
    train_all("classification")
