"""
Shared utility functions used by dashboard/app.py and evaluate.py.
"""
from pathlib import Path

ROOT       = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"


def roi_estimate(predicted_sales: float, tv: float, radio: float,
                 social_media: float) -> float:
    """
    Return estimated ROI as a percentage.
    ROI = (Predicted Sales - Total Budget) / Total Budget * 100
    Returns 0.0 if total budget is zero.
    """
    total_budget = tv + radio + social_media
    if total_budget == 0:
        return 0.0
    return round((predicted_sales - total_budget) / total_budget * 100, 2)


def influencer_options() -> list[str]:
    """Ordered list of influencer tiers (Mega → Nano)."""
    return ["Mega", "Macro", "Micro", "Nano"]


def get_feature_names(preprocessor) -> list[str]:
    """
    Return the full list of feature names after preprocessing.
    Works with a fitted ColumnTransformer that has 'num' and 'cat' transformers.
    """
    cat_enc   = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    cat_names = list(cat_enc.get_feature_names_out(["Influencer"]))
    return ["TV", "Radio", "Social Media"] + cat_names
