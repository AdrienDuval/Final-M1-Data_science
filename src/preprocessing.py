import pandas as pd
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).parent.parent
DATA_PATH = ROOT / "data" / "Dummy Data HSS.csv"

NUMERIC_FEATURES = ["TV", "Radio", "Social Media"]
CATEGORICAL_FEATURES = ["Influencer"]
TARGET = "Sales"
RANDOM_STATE = 42


def load_data(path=DATA_PATH):
    df = pd.read_csv(path)
    # Drop rows where the target is missing (6 rows) — cannot train without a label
    df = df.dropna(subset=[TARGET])
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET].reset_index(drop=True)
    X = X.reset_index(drop=True)
    return X, y


def build_preprocessor():
    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_transformer = Pipeline([
        ("encoder", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([
        ("num", numeric_transformer, NUMERIC_FEATURES),
        ("cat", categorical_transformer, CATEGORICAL_FEATURES),
    ])


def build_pipeline(model):
    return Pipeline([
        ("preprocessor", build_preprocessor()),
        ("model", model),
    ])


def split_data(X, y, test_size=0.2, random_state=RANDOM_STATE):
    return train_test_split(X, y, test_size=test_size, random_state=random_state)


def get_feature_names(pipeline):
    preprocessor = pipeline.named_steps["preprocessor"]
    raw = preprocessor.get_feature_names_out()
    # Strip transformer prefixes: 'num__TV' → 'TV', 'cat__Influencer_Mega' → 'Influencer_Mega'
    return [n.replace("num__", "").replace("cat__", "") for n in raw]
