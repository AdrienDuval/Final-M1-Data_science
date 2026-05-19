import sys
import subprocess
from pathlib import Path

ROOT      = Path(__file__).parent
MODELS    = ROOT / "models"
FIGURES   = ROOT / "figures"
SRC       = ROOT / "src"

REG_MODELS = [
    "pipeline_regression.pkl",
    "linear_regression_regression.pkl",
    "random_forest_regression.pkl",
    "gradient_boosting_regression.pkl",
    "mlp_regression.pkl",
]
CLF_MODELS = [
    "pipeline_classification.pkl",
    "label_encoder.pkl",
    "logistic_regression_classification.pkl",
    "random_forest_classification.pkl",
    "gradient_boosting_classification.pkl",
    "mlp_classification.pkl",
]
METRIC_FILES = [
    "metrics_regression.csv",
    "metrics_classification.csv",
]
FIGURE_FILES = [
    "regression_r2.png",
    "residuals_best.png",
    "feature_importance.png",
    "confusion_matrix.png",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _all_exist(files, directory):
    return all((directory / f).exists() for f in files)


def _ask(question, default="y"):
    hint = "[Y/n]" if default == "y" else "[y/N]"
    answer = input(f"  {question} {hint}: ").strip().lower()
    if answer == "":
        return default == "y"
    return answer in ("y", "yes")


def _header(text):
    width = 60
    print("\n" + "=" * width)
    print(f"  {text}")
    print("=" * width)


def _run(script_name):
    result = subprocess.run(
        [sys.executable, str(SRC / script_name)],
        cwd=str(ROOT),
    )
    if result.returncode != 0:
        print(f"\n[ERROR] {script_name} failed (exit {result.returncode}). Aborting.")
        sys.exit(result.returncode)


# ── Steps ─────────────────────────────────────────────────────────────────────

def step_train():
    _header("STEP 1 — Training")
    models_exist = _all_exist(REG_MODELS + CLF_MODELS, MODELS)

    if models_exist:
        print("  Trained models found in models/")
        if not _ask("Re-train all models?", default="n"):
            print("  Skipping training.")
            return
    else:
        missing = [f for f in REG_MODELS + CLF_MODELS if not (MODELS / f).exists()]
        print(f"  Missing {len(missing)} model file(s):")
        for f in missing:
            print(f"    • {f}")

    print("\n  Training regression models...")
    _run("models.py")


def step_evaluate():
    _header("STEP 2 — Evaluation")
    metrics_exist  = _all_exist(METRIC_FILES, MODELS)
    figures_exist  = _all_exist(FIGURE_FILES, FIGURES)

    if metrics_exist and figures_exist:
        print("  Evaluation results and figures already exist.")
        if not _ask("Re-run evaluation?", default="n"):
            print("  Skipping evaluation.")
            return
    else:
        missing = (
            [f for f in METRIC_FILES  if not (MODELS / f).exists()] +
            [f for f in FIGURE_FILES  if not (FIGURES / f).exists()]
        )
        print(f"  Missing {len(missing)} evaluation file(s):")
        for f in missing:
            print(f"    • {f}")

    print("\n  Running evaluation...")
    _run("evaluate.py")


def step_dashboard():
    _header("STEP 3 — Dashboard")
    print("  Launching Streamlit dashboard at http://localhost:8501")
    print("  Press Ctrl+C to stop.\n")
    subprocess.run(
        ["streamlit", "run", str(ROOT / "dashboard" / "app.py"),
         "--server.headless", "false"],
        cwd=str(ROOT),
    )


# ── Menu ──────────────────────────────────────────────────────────────────────

def main():
    print("\n╔══════════════════════════════════════════════╗")
    print("║    Marketing ROI — ML Pipeline               ║")
    print("║    EFREI M1 Data Engineering                 ║")
    print("╚══════════════════════════════════════════════╝")

    # Quick status report
    _header("STATUS CHECK")
    checks = {
        "Regression models":    _all_exist(REG_MODELS, MODELS),
        "Classification models": _all_exist(CLF_MODELS, MODELS),
        "Evaluation metrics":   _all_exist(METRIC_FILES, MODELS),
        "Figures":              _all_exist(FIGURE_FILES, FIGURES),
    }
    for label, ok in checks.items():
        status = "✓" if ok else "✗ missing"
        print(f"  [{status:9}]  {label}")

    # Mode selection
    _header("SELECT MODE")
    print("  1) Full pipeline  (train → evaluate → dashboard)")
    print("  2) Train only")
    print("  3) Evaluate only")
    print("  4) Dashboard only")
    print("  5) Exit")

    while True:
        choice = input("\n  Enter choice [1-5]: ").strip()[:1]
        if choice in ("1", "2", "3", "4", "5"):
            break
        print("  ✗ Invalid — please enter a number between 1 and 5.")

    if choice == "1":
        step_train()
        step_evaluate()
        if _ask("\nLaunch dashboard now?", default="y"):
            step_dashboard()
    elif choice == "2":
        step_train()
    elif choice == "3":
        step_evaluate()
    elif choice == "4":
        step_dashboard()
    elif choice == "5":
        print("  Bye.")
        sys.exit(0)

    print("\n  Done.\n")


if __name__ == "__main__":
    main()
