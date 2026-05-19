"""
Data loading, feature definitions, and preprocessing pipeline.

Shared by both the Streamlit pipeline (src/models.py) and the FastAPI
pipeline (src/train.py).  All paths are resolved relative to this file
so the module works regardless of the working directory.
"""
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent
DATA_PATH = ROOT / "data" / "marketing_labelled.csv"   # pre-labelled (has perf_class)
MODELS_DIR = ROOT / "models"

# ── Feature config ────────────────────────────────────────────────────────────
NUMERIC_FEATURES     = ["TV", "Radio", "Social Media"]
CATEGORICAL_FEATURES = ["Influencer"]
TARGET_REG           = "Sales"
TARGET_CLF           = "perf_class"
RANDOM_STATE         = 42


# ── Data loading ──────────────────────────────────────────────────────────────

def load_data(path: Path = DATA_PATH) -> pd.DataFrame:
    """
    Load the marketing dataset.  Returns a DataFrame that always contains
    both TARGET_REG ('Sales') and TARGET_CLF ('perf_class').

    If 'perf_class' is missing (e.g. loading the raw CSV), it is created
    on the fly via quantile-based binning so the function is backward-compatible.
    """
    df = pd.read_csv(path)
    if TARGET_CLF not in df.columns:
        q33 = df[TARGET_REG].quantile(0.33)
        q66 = df[TARGET_REG].quantile(0.66)
        df[TARGET_CLF] = pd.cut(
            df[TARGET_REG],
            bins=[-np.inf, q33, q66, np.inf],
            labels=["Low", "Medium", "High"],
        )
    return df


# ── Preprocessing pipeline ────────────────────────────────────────────────────

def build_preprocessor() -> ColumnTransformer:
    """Return an *unfitted* sklearn ColumnTransformer (impute + scale / encode)."""
    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(drop="first", sparse_output=False,
                                  handle_unknown="ignore")),
    ])
    return ColumnTransformer([
        ("num", numeric_pipe,     NUMERIC_FEATURES),
        ("cat", categorical_pipe, CATEGORICAL_FEATURES),
    ])


def build_pipeline(model) -> Pipeline:
    """
    Wrap a sklearn estimator inside a preprocessing + model Pipeline.
    Used by src/train.py (FastAPI stack) for end-to-end sklearn Pipelines.
    """
    return Pipeline([
        ("preprocessor", build_preprocessor()),
        ("model",        model),
    ])


def get_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    """Return feature names after transformation (numeric + one-hot encoded)."""
    cat_enc   = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    cat_names = list(cat_enc.get_feature_names_out(CATEGORICAL_FEATURES))
    return NUMERIC_FEATURES + cat_names


# ── Train / test split ────────────────────────────────────────────────────────

def split_data(df: pd.DataFrame, task: str = "regression"):
    """
    Stratified 80/20 split.  Always stratifies on the class label so both
    regression and classification splits are class-balanced.

    Returns X_train, X_test, y_train, y_test.
    """
    X    = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_reg = df[TARGET_REG]
    y_clf = df[TARGET_CLF].astype(str)

    mask  = y_reg.notna() & y_clf.notna()
    X, y_reg, y_clf = X[mask], y_reg[mask], y_clf[mask]

    y = y_reg if task == "regression" else y_clf
    return train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y_clf
    )


# ── Preprocessor helpers (Streamlit pipeline) ─────────────────────────────────

def get_fitted_preprocessor(X_train) -> ColumnTransformer:
    """Fit and return a preprocessor on X_train only (no leakage)."""
    prep = build_preprocessor()
    prep.fit(X_train)
    return prep


def save_pipeline(pipeline, name: str = "pipeline.pkl"):
    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(pipeline, MODELS_DIR / name)
    print(f"Saved → models/{name}")


def load_pipeline(name: str = "pipeline.pkl"):
    return joblib.load(MODELS_DIR / name)


# ── Quick sanity check ────────────────────────────────────────────────────────

if __name__ == "__main__":
    df = load_data()
    print(f"Dataset shape : {df.shape}")
    print(f"Class dist    :\n{df[TARGET_CLF].value_counts()}")

    X_train, X_test, y_train, y_test = split_data(df, task="regression")
    prep = get_fitted_preprocessor(X_train)
    save_pipeline(prep)
    print(f"Transformed   : {prep.transform(X_train).shape}")
    print("No data leakage: preprocessor fitted on train only ✓")
