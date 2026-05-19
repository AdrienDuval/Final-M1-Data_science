"""
Evaluate all trained models and generate report figures.

Usage:
    python src/evaluate.py          # full evaluation + all plots
    python src/evaluate.py --shap   # also run SHAP analysis

Outputs (saved to figures/):
    metrics_comparison.png
    predicted_vs_actual.png
    residuals.png
    feature_importance.png
    permutation_importance.png
    shap_beeswarm.png  (if --shap)
    shap_bar.png       (if --shap)
"""
import sys
import json
import pickle
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"
FIGURES_DIR = ROOT / "figures"
FIGURES_DIR.mkdir(exist_ok=True)

sys.path.insert(0, str(Path(__file__).parent))
from preprocessing import get_feature_names

plt.rcParams["figure.dpi"] = 110


# ---------------------------------------------------------------------------
# Load artifacts
# ---------------------------------------------------------------------------

def load_models():
    with open(MODELS_DIR / "model_list.json") as f:
        names = json.load(f)
    return {n: joblib.load(MODELS_DIR / f"{n}.pkl") for n in names}


def load_splits():
    with open(MODELS_DIR / "splits.pkl", "rb") as f:
        return pickle.load(f)


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def compute_metrics(pipeline, X, y):
    y_pred = pipeline.predict(X)
    return {
        "MAE":  round(mean_absolute_error(y, y_pred), 4),
        "RMSE": round(float(np.sqrt(mean_squared_error(y, y_pred))), 4),
        "R2":   round(r2_score(y, y_pred), 4),
    }, y_pred


def metrics_table(models, X_test, y_test):
    rows, preds = [], {}
    for name, pipeline in models.items():
        m, y_pred = compute_metrics(pipeline, X_test, y_test)
        rows.append({"Model": name, **m})
        preds[name] = y_pred
    df = pd.DataFrame(rows).set_index("Model")
    return df, preds


def print_metrics_table(df_metrics, cv_path=None):
    print("\n" + "=" * 55)
    print("TEST SET METRICS")
    print("=" * 55)
    print(df_metrics.sort_values("R2", ascending=False).to_string())

    if cv_path and cv_path.exists():
        with open(cv_path) as f:
            cv = json.load(f)
        print("\nCROSS-VALIDATION R² (5-fold, train set)")
        print("-" * 40)
        for name, v in cv.items():
            print(f"  {name:<22} {v['mean']:.4f} ± {v['std']:.4f}")
    print("=" * 55)


# ---------------------------------------------------------------------------
# Plots
# ---------------------------------------------------------------------------

PALETTE = ["#4e79a7", "#f28e2b", "#59a14f", "#e15759"]


def plot_metrics_comparison(df_metrics):
    fig, axes = plt.subplots(1, 3, figsize=(14, 5))

    for i, (metric, ascending) in enumerate([("R2", False), ("RMSE", True), ("MAE", True)]):
        vals = df_metrics[metric].sort_values(ascending=ascending)
        colors = [PALETTE[j % len(PALETTE)] for j in range(len(vals))]
        bars = axes[i].barh(vals.index, vals.values, color=colors, edgecolor="white")
        axes[i].set_title(metric, fontsize=13, fontweight="bold")
        for bar, val in zip(bars, vals.values):
            axes[i].text(
                bar.get_width() * 1.01, bar.get_y() + bar.get_height() / 2,
                f"{val:.4f}", va="center", fontsize=9,
            )

    plt.suptitle("Model Comparison — Test Set", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "metrics_comparison.png", bbox_inches="tight")
    plt.show()
    print("  Saved: metrics_comparison.png")


def plot_predicted_vs_actual(models, X_test, y_test):
    n = len(models)
    fig, axes = plt.subplots(1, n, figsize=(5 * n, 5))
    if n == 1:
        axes = [axes]

    for ax, (name, pipeline) in zip(axes, models.items()):
        y_pred = pipeline.predict(X_test)
        lims = [min(y_test.min(), y_pred.min()) * 0.97,
                max(y_test.max(), y_pred.max()) * 1.03]
        ax.scatter(y_test, y_pred, alpha=0.35, s=14, color="steelblue", edgecolors="none")
        ax.plot(lims, lims, "r--", linewidth=1.4, label="Perfect fit")
        ax.set_xlim(lims); ax.set_ylim(lims)
        ax.set_xlabel("Actual Sales (M)"); ax.set_ylabel("Predicted Sales (M)")
        ax.set_title(f"{name}\nR² = {r2_score(y_test, y_pred):.4f}")
        ax.legend(fontsize=8)

    plt.suptitle("Predicted vs Actual Sales", fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "predicted_vs_actual.png", bbox_inches="tight")
    plt.show()
    print("  Saved: predicted_vs_actual.png")


def plot_residuals(models, X_test, y_test):
    n = len(models)
    fig, axes = plt.subplots(1, n, figsize=(5 * n, 5))
    if n == 1:
        axes = [axes]

    for ax, (name, pipeline) in zip(axes, models.items()):
        y_pred = pipeline.predict(X_test)
        residuals = y_test.values - y_pred
        ax.scatter(y_pred, residuals, alpha=0.35, s=14, color="coral", edgecolors="none")
        ax.axhline(0, color="black", linewidth=1.2, linestyle="--")
        ax.set_xlabel("Predicted Sales (M)"); ax.set_ylabel("Residual")
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        ax.set_title(f"{name}\nRMSE = {rmse:.4f}")

    plt.suptitle("Residual Analysis", fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "residuals.png", bbox_inches="tight")
    plt.show()
    print("  Saved: residuals.png")


def plot_feature_importance(models):
    tree_models = {
        k: v for k, v in models.items()
        if k in ("random_forest", "xgboost", "gradient_boosting")
    }
    if not tree_models:
        return

    n = len(tree_models)
    fig, axes = plt.subplots(1, n, figsize=(7 * n, 5))
    if n == 1:
        axes = [axes]

    for ax, (name, pipeline) in zip(axes, tree_models.items()):
        feat_names = get_feature_names(pipeline)
        importances = pipeline.named_steps["model"].feature_importances_
        idx = np.argsort(importances)
        ax.barh([feat_names[i] for i in idx], importances[idx],
                color="steelblue", edgecolor="white")
        ax.set_title(f"{name}", fontsize=12)
        ax.set_xlabel("Importance")

    plt.suptitle("Feature Importance (Tree Models)", fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "feature_importance.png", bbox_inches="tight")
    plt.show()
    print("  Saved: feature_importance.png")


def plot_permutation_importance(models, X_test, y_test):
    n = len(models)
    fig, axes = plt.subplots(1, n, figsize=(5 * n, 5))
    if n == 1:
        axes = [axes]

    for ax, (name, pipeline) in zip(axes, models.items()):
        feat_names = get_feature_names(pipeline)
        result = permutation_importance(
            pipeline, X_test, y_test,
            n_repeats=10, random_state=42, n_jobs=-1,
        )
        idx = np.argsort(result.importances_mean)
        ax.barh(
            [feat_names[i] for i in idx],
            result.importances_mean[idx],
            xerr=result.importances_std[idx],
            color="seagreen", edgecolor="white",
        )
        ax.set_title(f"{name}", fontsize=11)
        ax.set_xlabel("Mean R² decrease")

    plt.suptitle("Permutation Importance — All Models", fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "permutation_importance.png", bbox_inches="tight")
    plt.show()
    print("  Saved: permutation_importance.png")


# ---------------------------------------------------------------------------
# SHAP (optional — requires: pip install shap)
# ---------------------------------------------------------------------------

def run_shap(models, X_test):
    try:
        import shap
    except ImportError:
        print("\nSHAP not installed. Run: pip install shap")
        return

    # Apply SHAP to the best available tree-based model
    preferred = ["xgboost", "gradient_boosting", "random_forest"]
    target_name = next((n for n in preferred if n in models), None)
    if target_name is None:
        print("No tree-based model found for SHAP.")
        return

    pipeline = models[target_name]
    feat_names = get_feature_names(pipeline)
    preprocessor = pipeline.named_steps["preprocessor"]
    model = pipeline.named_steps["model"]
    X_transformed = preprocessor.transform(X_test)

    print(f"\nComputing SHAP values for: {target_name}...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_transformed)

    # Beeswarm plot (global + local)
    shap.summary_plot(shap_values, X_transformed, feature_names=feat_names, show=False)
    plt.title(f"SHAP Summary — {target_name}", fontsize=12)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "shap_beeswarm.png", bbox_inches="tight")
    plt.show()
    print("  Saved: shap_beeswarm.png")

    # Bar plot (global importance)
    shap.summary_plot(shap_values, X_transformed, feature_names=feat_names,
                      plot_type="bar", show=False)
    plt.title(f"SHAP Feature Importance — {target_name}", fontsize=12)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "shap_bar.png", bbox_inches="tight")
    plt.show()
    print("  Saved: shap_bar.png")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_shap_flag = "--shap" in sys.argv

    print("Loading models and data splits...")
    models = load_models()
    splits = load_splits()
    X_test,  y_test  = splits["X_test"],  splits["y_test"]

    df_metrics, _ = metrics_table(models, X_test, y_test)
    print_metrics_table(df_metrics, cv_path=MODELS_DIR / "cv_results.json")

    print("\nGenerating plots...")
    plot_metrics_comparison(df_metrics)
    plot_predicted_vs_actual(models, X_test, y_test)
    plot_residuals(models, X_test, y_test)
    plot_feature_importance(models)
    plot_permutation_importance(models, X_test, y_test)

    if run_shap_flag:
        run_shap(models, X_test)

    print(f"\nAll figures saved to: {FIGURES_DIR}")

    best = df_metrics.sort_values("R2", ascending=False).iloc[0]
    print(f"\nBest model by R²: {best.name}  (R²={best['R2']}, RMSE={best['RMSE']})")
