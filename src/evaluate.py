"""
Evaluation script: loads trained models, computes metrics, and saves figures.

Usage:
    python src/evaluate.py
    python src/evaluate.py --shap   # also generate SHAP summary (slow)
"""
import sys
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from pathlib import Path

warnings.filterwarnings("ignore")
sys.path.insert(0, str(Path(__file__).parent))

from preprocessing import (load_data, split_data, get_fitted_preprocessor,
                            NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET_CLF)

MODELS_DIR  = Path(__file__).parent.parent / "models"
FIGURES_DIR = Path(__file__).parent.parent / "figures"
FIGURES_DIR.mkdir(exist_ok=True)

REG_NAMES = ["linear_regression", "random_forest", "gradient_boosting", "mlp"]
CLF_NAMES = ["logistic_regression", "random_forest", "gradient_boosting", "mlp"]


# ── Metric helpers ────────────────────────────────────────────────────────────

def regression_metrics(y_true, y_pred) -> dict:
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    return {
        "MAE":  round(mean_absolute_error(y_true, y_pred), 4),
        "RMSE": round(np.sqrt(mean_squared_error(y_true, y_pred)), 4),
        "R2":   round(r2_score(y_true, y_pred), 4),
    }


def classification_metrics(y_true, y_pred, y_prob=None) -> dict:
    from sklearn.metrics import (accuracy_score, f1_score, roc_auc_score,
                                  precision_score, recall_score)
    res = {
        "Accuracy":  round(accuracy_score(y_true, y_pred), 4),
        "Precision": round(precision_score(y_true, y_pred, average="macro",
                                           zero_division=0), 4),
        "Recall":    round(recall_score(y_true, y_pred, average="macro",
                                        zero_division=0), 4),
        "F1-macro":  round(f1_score(y_true, y_pred, average="macro"), 4),
    }
    if y_prob is not None:
        try:
            res["ROC-AUC"] = round(
                roc_auc_score(y_true, y_prob, multi_class="ovr", average="macro"), 4
            )
        except Exception:
            pass
    return res


def cross_validate_model(model, X, y, task: str = "regression", cv: int = 5) -> dict:
    from sklearn.model_selection import cross_validate
    from sklearn.metrics import make_scorer, r2_score, f1_score

    scoring = (
        {"R2":   make_scorer(r2_score),
         "RMSE": make_scorer(lambda yt, yp: -np.sqrt(((yt - yp) ** 2).mean()))}
        if task == "regression"
        else {"F1-macro": make_scorer(f1_score, average="macro")}
    )
    results = cross_validate(model, X, y, cv=cv, scoring=scoring, n_jobs=-1)
    # Flatten to {metric_mean: value} pairs
    return {
        k.replace("test_", "") + "_mean": round(abs(v.mean()), 4)
        for k, v in results.items() if k.startswith("test_")
    }


# ── Plot helpers ──────────────────────────────────────────────────────────────

def _save(fig, fname: str):
    fig.savefig(FIGURES_DIR / fname, dpi=100)
    plt.close(fig)
    print(f"Saved -> figures/{fname}")


def plot_residuals(y_true, y_pred, title: str = "Best Model",
                   fname: str = "residuals_best.png"):
    residuals = np.array(y_true) - np.array(y_pred)
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].scatter(y_pred, residuals, alpha=0.3, s=10, color="steelblue")
    axes[0].axhline(0, color="red", linewidth=1)
    axes[0].set(xlabel="Predicted", ylabel="Residual",
                title=f"{title}: Residuals vs Fitted")
    sns.histplot(residuals, kde=True, ax=axes[1], color="steelblue")
    axes[1].set(xlabel="Residual", title=f"{title}: Residual Distribution")
    plt.tight_layout()
    _save(fig, fname)


def plot_confusion_matrix(y_true, y_pred, class_labels: list,
                           fname: str = "confusion_matrix.png"):
    from sklearn.metrics import confusion_matrix
    cm  = confusion_matrix(y_true, y_pred, labels=list(range(len(class_labels))))
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_labels, yticklabels=class_labels, ax=ax)
    ax.set(xlabel="Predicted", ylabel="True",
           title="Confusion Matrix (Best Classifier)")
    plt.tight_layout()
    _save(fig, fname)


def plot_metrics_bar(results_df: pd.DataFrame, metric_col: str,
                     title: str, fname: str):
    fig, ax = plt.subplots(figsize=(8, 4))
    results_df.plot(x="Model", y=metric_col, kind="bar", ax=ax,
                    color="steelblue", edgecolor="k", legend=False)
    ax.set(title=title, ylabel=metric_col)
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    _save(fig, fname)


def plot_val_test_comparison(val_test_df: pd.DataFrame,
                              fname: str = "val_test_comparison.png"):
    """Grouped bar chart: validation (CV) vs test R² and RMSE for all 4 models."""
    models = val_test_df["Model"].tolist()
    x = np.arange(len(models))
    width = 0.35

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Validation (CV) vs Test Metrics — All 4 Models", fontsize=13, fontweight="bold")

    # R² (accuracy proxy)
    ax = axes[0]
    ax.bar(x - width / 2, val_test_df["Val_R2"],  width, label="Validation (CV)",
           color="#4C8BE2", edgecolor="k")
    ax.bar(x + width / 2, val_test_df["Test_R2"], width, label="Test",
           color="#F28B30", edgecolor="k")
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("_", "\n") for m in models], fontsize=9)
    ax.set_ylim(max(0, val_test_df[["Val_R2", "Test_R2"]].min().min() - 0.05), 1.0)
    ax.set(title="R² Score (Accuracy)", ylabel="R²")
    ax.legend()
    for rect, v in zip(ax.patches, list(val_test_df["Val_R2"]) + list(val_test_df["Test_R2"])):
        ax.text(rect.get_x() + rect.get_width() / 2, rect.get_height() + 0.002,
                f"{v:.4f}", ha="center", va="bottom", fontsize=7)

    # RMSE (loss)
    ax = axes[1]
    ax.bar(x - width / 2, val_test_df["Val_RMSE"],  width, label="Validation (CV)",
           color="#4C8BE2", edgecolor="k")
    ax.bar(x + width / 2, val_test_df["Test_RMSE"], width, label="Test",
           color="#F28B30", edgecolor="k")
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("_", "\n") for m in models], fontsize=9)
    ax.set(title="RMSE (Loss)", ylabel="RMSE")
    ax.legend()
    for rect, v in zip(ax.patches, list(val_test_df["Val_RMSE"]) + list(val_test_df["Test_RMSE"])):
        ax.text(rect.get_x() + rect.get_width() / 2, rect.get_height() + 0.01,
                f"{v:.3f}", ha="center", va="bottom", fontsize=7)

    plt.tight_layout()
    _save(fig, fname)


def plot_mlp_learning_curves(pipeline, fname: str = "mlp_learning_curves.png"):
    """Plot MLP per-epoch training loss and validation score."""
    mlp = (pipeline.named_steps["model"]
           if hasattr(pipeline, "named_steps") else pipeline)
    if not hasattr(mlp, "loss_curve_"):
        print("  MLP loss_curve_ not available — skipping.")
        return

    epochs = range(1, len(mlp.loss_curve_) + 1)
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    fig.suptitle("MLP Learning Curves", fontsize=13, fontweight="bold")

    # Training loss
    axes[0].plot(epochs, mlp.loss_curve_, color="steelblue", linewidth=1.5)
    axes[0].set(xlabel="Epoch", ylabel="MSE Loss", title="Training Loss per Epoch")
    axes[0].grid(alpha=0.3)

    # Validation score (R²) — only present when early_stopping=True
    if hasattr(mlp, "validation_scores_") and mlp.validation_scores_:
        val_epochs = range(1, len(mlp.validation_scores_) + 1)
        axes[1].plot(val_epochs, mlp.validation_scores_, color="#F28B30", linewidth=1.5)
        best_ep = int(np.argmax(mlp.validation_scores_)) + 1
        axes[1].axvline(best_ep, color="red", linestyle="--", linewidth=1,
                        label=f"Best epoch {best_ep}")
        axes[1].set(xlabel="Epoch", ylabel="R² Score",
                    title="Validation R² per Epoch (early-stopping set)")
        axes[1].legend()
        axes[1].grid(alpha=0.3)
    else:
        axes[1].text(0.5, 0.5, "Validation scores\nnot available",
                     ha="center", va="center", transform=axes[1].transAxes, fontsize=11)
        axes[1].set_axis_off()

    plt.tight_layout()
    _save(fig, fname)


def compute_val_test_metrics_all(models_dir: Path,
                                  X_tr, X_te,
                                  y_train, y_test) -> pd.DataFrame:
    """
    Run 5-fold CV (validation) and test-set evaluation for all 4 regression models.
    X_tr / X_te must already be preprocessed (numpy arrays from the fitted preprocessor).
    """
    from sklearn.model_selection import cross_validate
    from sklearn.metrics import make_scorer, r2_score, mean_squared_error

    rmse_scorer = make_scorer(
        lambda yt, yp: -np.sqrt(mean_squared_error(yt, yp))
    )
    y_tr_arr = np.array(y_train)
    y_te_arr = np.array(y_test)

    rows = []
    for name in REG_NAMES:
        path = models_dir / f"{name}_regression.pkl"
        if not path.exists():
            print(f"  Skipping {name} (not found)")
            continue
        m = joblib.load(path)

        # Test metrics (model expects preprocessed arrays)
        preds     = m.predict(X_te)
        test_r2   = round(float(r2_score(y_te_arr, preds)), 4)
        test_rmse = round(float(np.sqrt(mean_squared_error(y_te_arr, preds))), 4)

        # Validation via 5-fold CV on the (preprocessed) training set
        cv = cross_validate(
            m, X_tr, y_tr_arr,
            cv=5,
            scoring={"R2": make_scorer(r2_score), "RMSE": rmse_scorer},
            n_jobs=-1,
        )
        val_r2   = round(float(np.abs(cv["test_R2"].mean())),   4)
        val_rmse = round(float(np.abs(cv["test_RMSE"].mean())), 4)

        rows.append({
            "Model":     name,
            "Val_R2":    val_r2,
            "Test_R2":   test_r2,
            "Val_RMSE":  val_rmse,
            "Test_RMSE": test_rmse,
        })
        print(f"  {name:<22}  Val R2={val_r2:.4f}  Test R2={test_r2:.4f}"
              f"  Val RMSE={val_rmse:.4f}  Test RMSE={test_rmse:.4f}")

    return pd.DataFrame(rows)


def plot_feature_importance(model, feature_names: list,
                             fname: str = "feature_importance.png"):
    if hasattr(model, "feature_importances_"):
        imp = model.feature_importances_
    elif hasattr(model, "coef_"):
        imp = np.abs(model.coef_).flatten()[:len(feature_names)]
    else:
        print(f"  Skipping feature importance (not supported for {type(model).__name__})")
        return
    df_imp = (pd.DataFrame({"Feature": feature_names, "Importance": imp})
              .sort_values("Importance", ascending=True))
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.barh(df_imp["Feature"], df_imp["Importance"], color="steelblue", edgecolor="k")
    ax.set(xlabel="Importance", title="Feature Importance (Best Model)")
    plt.tight_layout()
    _save(fig, fname)


def plot_permutation_importance(model, X_te, y_te, feature_names: list,
                                fname: str = "permutation_importance.png"):
    """Compute and plot permutation importance (model-agnostic, recommended by EF3)."""
    from sklearn.inspection import permutation_importance
    result = permutation_importance(model, X_te, y_te, n_repeats=10,
                                    random_state=42, n_jobs=-1)
    df_imp = (pd.DataFrame({
                  "Feature":    feature_names,
                  "Importance": result.importances_mean,
                  "Std":        result.importances_std,
              }).sort_values("Importance", ascending=True))
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.barh(df_imp["Feature"], df_imp["Importance"],
            xerr=df_imp["Std"], color="steelblue", edgecolor="k", capsize=4)
    ax.set(xlabel="Mean decrease in R²", title="Permutation Importance (Best Model)")
    plt.tight_layout()
    _save(fig, fname)


def plot_shap(model, X_transformed, feature_names: list,
              fname: str = "shap_summary.png"):
    try:
        import shap
        explainer   = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_transformed[:500])
        plt.figure(figsize=(8, 5))
        shap.summary_plot(shap_values, X_transformed[:500],
                          feature_names=feature_names, show=False)
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / fname, dpi=100)
        plt.close()
        print(f"Saved -> figures/{fname}")
    except Exception as e:
        print(f"  SHAP skipped: {e}")


# ── Evaluation routines ───────────────────────────────────────────────────────

def plot_learning_curves_all(models_dir: Path, X_tr, y_train):
    """
    Generate one learning-curve PNG per model showing train R² and CV R²
    as a function of training-set size.  Saves figures/learning_curve_{name}.png.
    """
    from sklearn.model_selection import learning_curve
    from sklearn.metrics import make_scorer, r2_score

    scorer = make_scorer(r2_score)
    train_sizes_frac = np.linspace(0.1, 1.0, 8)
    y_arr = np.array(y_train)

    label_map = {
        "linear_regression": "Linear Regression",
        "random_forest":     "Random Forest",
        "gradient_boosting": "Gradient Boosting",
        "mlp":               "Neural Net (MLP)",
    }

    for name in REG_NAMES:
        path = models_dir / f"{name}_regression.pkl"
        if not path.exists():
            print(f"  Skipping {name} (not found)")
            continue
        print(f"  Computing learning curve: {name} ...")
        m = joblib.load(path)

        sizes, train_sc, val_sc = learning_curve(
            m, X_tr, y_arr,
            train_sizes=train_sizes_frac,
            cv=3,
            scoring=scorer,
            n_jobs=1,
            shuffle=True,
            random_state=42,
        )

        t_mean, t_std = train_sc.mean(axis=1), train_sc.std(axis=1)
        v_mean, v_std = val_sc.mean(axis=1),   val_sc.std(axis=1)

        fig, ax = plt.subplots(figsize=(7, 4))
        ax.plot(sizes, t_mean, "o-", color="#4C8BE2", lw=2, label="Training R²")
        ax.fill_between(sizes, t_mean - t_std, t_mean + t_std,
                        alpha=0.15, color="#4C8BE2")
        ax.plot(sizes, v_mean, "s-", color="#F28B30", lw=2, label="Validation R² (CV)")
        ax.fill_between(sizes, v_mean - v_std, v_mean + v_std,
                        alpha=0.15, color="#F28B30")

        floor = max(0.0, min(v_mean.min(), t_mean.min()) - 0.02)
        ax.set_ylim(floor, 1.005)
        ax.set(xlabel="Training samples", ylabel="R²",
               title=f"Learning Curves — {label_map.get(name, name)}")
        ax.legend(loc="lower right")
        ax.grid(alpha=0.3)
        plt.tight_layout()

        fname = f"learning_curve_{name}.png"
        fig.savefig(FIGURES_DIR / fname, dpi=100)
        plt.close(fig)
        print(f"  Saved -> figures/{fname}")


def evaluate_regression(run_shap: bool = False) -> pd.DataFrame:
    df = load_data()
    X_train, X_test, y_train, y_test = split_data(df, task="regression")
    prep = joblib.load(MODELS_DIR / "pipeline_regression.pkl")
    X_tr = prep.transform(X_train)
    X_te = prep.transform(X_test)

    feature_names = (NUMERIC_FEATURES +
                     list(prep.named_transformers_["cat"]
                          .named_steps["encoder"]
                          .get_feature_names_out(CATEGORICAL_FEATURES)))

    rows, best_r2, best_model, best_name = [], -np.inf, None, None

    for name in REG_NAMES:
        path = MODELS_DIR / f"{name}_regression.pkl"
        if not path.exists():
            print(f"  Skipping {name} (not found)")
            continue
        m      = joblib.load(path)
        preds  = m.predict(X_te)
        mets   = regression_metrics(y_test, preds)
        mets["Model"] = name
        rows.append(mets)
        if mets["R2"] > best_r2:
            best_r2, best_model, best_name = mets["R2"], m, name

    results = pd.DataFrame(rows)[["Model", "MAE", "RMSE", "R2"]]
    print("\n=== REGRESSION METRICS ===")
    print(results.to_string(index=False))
    results.to_csv(MODELS_DIR / "metrics_regression.csv", index=False)

    plot_metrics_bar(results, "R2", "Regression R² by Model", "regression_r2.png")
    plot_residuals(y_test, best_model.predict(X_te), title=best_name)
    plot_feature_importance(best_model, feature_names)
    plot_permutation_importance(best_model, X_te, y_test.values, feature_names)

    if run_shap:
        plot_shap(best_model, X_te, feature_names)

    # ── Val vs Test comparison for all 4 models ───────────────────────────────
    print("\n=== VALIDATION (CV) vs TEST - ALL 4 MODELS ===")
    val_test = compute_val_test_metrics_all(MODELS_DIR, X_tr, X_te,
                                            y_train, y_test)
    val_test.to_csv(MODELS_DIR / "metrics_val_test.csv", index=False)
    plot_val_test_comparison(val_test)

    # ── MLP epoch-level learning curves ──────────────────────────────────────
    mlp_path = MODELS_DIR / "mlp_regression.pkl"
    if mlp_path.exists():
        plot_mlp_learning_curves(joblib.load(mlp_path))

    # ── Training vs CV learning curves for all 4 models ──────────────────────
    print("\n=== LEARNING CURVES (train vs CV) — ALL 4 MODELS ===")
    plot_learning_curves_all(MODELS_DIR, X_tr, y_train)

    top2 = results.nlargest(2, "R2")["Model"].tolist()
    print("\n=== 5-FOLD CV (top-2 models) ===")
    for name in top2:
        m = joblib.load(MODELS_DIR / f"{name}_regression.pkl")
        print(f"  {name}: {cross_validate_model(m, X_tr, y_train.values, 'regression')}")

    return results


def evaluate_classification(run_shap: bool = False) -> pd.DataFrame:
    from sklearn.preprocessing import LabelEncoder

    df = load_data()
    X_train, X_test, y_train, y_test = split_data(df, task="classification")
    prep = joblib.load(MODELS_DIR / "pipeline_classification.pkl")
    le: LabelEncoder = joblib.load(MODELS_DIR / "label_encoder.pkl")

    X_tr     = prep.transform(X_train)
    X_te     = prep.transform(X_test)
    y_tr_enc = le.transform(y_train)
    y_te_enc = le.transform(y_test)

    rows, best_f1, best_model, best_name = [], -np.inf, None, None

    for name in CLF_NAMES:
        path = MODELS_DIR / f"{name}_classification.pkl"
        if not path.exists():
            print(f"  Skipping {name} (not found)")
            continue
        m     = joblib.load(path)
        preds = m.predict(X_te)
        probs = m.predict_proba(X_te) if hasattr(m, "predict_proba") else None
        mets  = classification_metrics(y_te_enc, preds, probs)
        mets["Model"] = name
        rows.append(mets)
        if mets.get("F1-macro", 0) > best_f1:
            best_f1, best_model, best_name = mets["F1-macro"], m, name

    results = pd.DataFrame(rows)
    print("\n=== CLASSIFICATION METRICS ===")
    print(results.to_string(index=False))
    results.to_csv(MODELS_DIR / "metrics_classification.csv", index=False)

    plot_confusion_matrix(y_te_enc, best_model.predict(X_te), list(le.classes_))

    top2 = results.nlargest(2, "F1-macro")["Model"].tolist()
    print("\n=== 5-FOLD CV (top-2 models) ===")
    for name in top2:
        m = joblib.load(MODELS_DIR / f"{name}_classification.pkl")
        print(f"  {name}: {cross_validate_model(m, X_tr, y_tr_enc, 'classification')}")

    return results


if __name__ == "__main__":
    run_shap = "--shap" in sys.argv
    evaluate_regression(run_shap=run_shap)
    evaluate_classification()
