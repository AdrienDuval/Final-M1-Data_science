"""
Model definitions and training entry point for the Streamlit pipeline.

Models are saved as  models/{name}_{task}.pkl
Preprocessors as     models/pipeline_{task}.pkl
Label encoder as     models/label_encoder.pkl  (classification only)

Usage:
    python src/models.py          # trains regression + classification
"""
import joblib
from pathlib import Path

from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import (RandomForestRegressor, RandomForestClassifier,
                               GradientBoostingRegressor, GradientBoostingClassifier)
from sklearn.neural_network import MLPRegressor, MLPClassifier

try:
    from xgboost import XGBRegressor, XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

MODELS_DIR = Path(__file__).parent.parent / "models"

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

def get_regression_models() -> dict:
    return {
        "linear_regression":  LinearRegression(),
        "random_forest":      RandomForestRegressor(n_estimators=200,
                                                     random_state=42, n_jobs=-1),
        "gradient_boosting": (XGBRegressor(**_GB_KWARGS, n_jobs=-1)
                              if XGB_AVAILABLE else
                              GradientBoostingRegressor(**_GB_KWARGS)),
        "mlp":                MLPRegressor(**_MLP_KWARGS),
    }


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


# ── Training entry point ──────────────────────────────────────────────────────

def train_all(task: str = "regression"):
    """
    Train all models for the given task, fit and save the preprocessor,
    then save each trained model.  Returns (trained_dict, preprocessor,
    X_train_transformed, y_train, y_test).
    """
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from preprocessing import load_data, split_data, get_fitted_preprocessor, save_pipeline

    df      = load_data()
    X_train, X_test, y_train, y_test = split_data(df, task=task)
    prep    = get_fitted_preprocessor(X_train)
    save_pipeline(prep, f"pipeline_{task}.pkl")

    X_tr = prep.transform(X_train)

    if task == "classification":
        from sklearn.preprocessing import LabelEncoder
        le   = LabelEncoder()
        y_tr = le.fit_transform(y_train)
        save_model(le, "label_encoder.pkl")
    else:
        y_tr = y_train.values

    models = (get_regression_models() if task == "regression"
              else get_classification_models())

    trained = {}
    for name, m in models.items():
        print(f"  Training {name}...")
        m.fit(X_tr, y_tr)
        save_model(m, f"{name}_{task}.pkl")
        trained[name] = m

    print(f"\nAll {task} models trained and saved.")
    return trained, prep, X_tr, y_train, y_test


if __name__ == "__main__":
    print("=== Regression ===")
    train_all("regression")
    print("\n=== Classification ===")
    train_all("classification")
