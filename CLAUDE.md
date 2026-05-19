# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marketing ROI Optimization — M1 Data Engineering project (EFREI, RNCP40875). Predicts sales from multi-channel advertising budgets (TV, Radio, Social Media, Influencer tier) using 4 ML models, exposed via a FastAPI backend and a Next.js dashboard.

## Commands

### Python ML Pipeline

```bash
# Activate virtual environment (Windows)
source .venv/Scripts/activate

# Install all dependencies
pip install -r requirements.txt

# Train all models (writes .pkl files to models/)
python src/train.py

# Evaluate models and generate figures (--shap is optional, slow)
python src/evaluate.py
python src/evaluate.py --shap
```

### Backend (FastAPI)

```bash
# Development server with hot reload
uvicorn api.main:app --reload --port 8000

# Install API-only deps (minimal Docker footprint)
pip install -r requirements.api.txt
```

### Frontend (Next.js)

```bash
cd dashboard-next
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

### Full Stack (Docker)

```bash
docker-compose up          # API on :8000, dashboard on :3000
docker-compose up --build  # Rebuild images
```

### Notebooks

```bash
jupyter notebook notebooks/01_eda.ipynb
```

### Test API Endpoints

```bash
curl http://localhost:8000/health
curl http://localhost:8000/metrics
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"TV": 50, "Radio": 20, "Social_Media": 5, "Influencer": "Mega"}'
curl -X POST http://localhost:8000/predict/all \
  -H "Content-Type: application/json" \
  -d '{"TV": 50, "Radio": 20, "Social_Media": 5, "Influencer": "Mega"}'
```

## Architecture

### Data Flow

```
data/Dummy Data HSS.csv (4,572 rows)
  ↓
src/preprocessing.py  — sklearn Pipeline: median impute + StandardScaler (numeric),
                        OneHotEncoder drop-first (Influencer categorical)
  ↓
src/train.py          — RandomizedSearchCV (15 iter, 5-fold) → 4 trained sklearn Pipelines
  ↓
models/               — *.pkl (joblib), cv_results.json, splits.pkl, model_list.json
  ↓
api/main.py           — FastAPI loads all models at startup (lifespan), serves inference
  ↓
dashboard-next/       — Next.js App Router fetches /predict/all, /metrics, /stats, etc.
```

### ML Models

| Key | Algorithm | Library |
|-----|-----------|---------|
| `linear_regression` | Linear Regression | scikit-learn |
| `random_forest` | Random Forest | scikit-learn |
| `gradient_boosting` | XGBoost (fallback: GradientBoosting) | xgboost / sklearn |
| `mlp` | MLP Neural Network | scikit-learn |

Best model by CV R²: `random_forest` (≈0.9958). The API's `/predict` endpoint always uses the best model; `/predict/all` returns predictions from all four.

### Key Source Files

- `src/preprocessing.py` — defines `NUMERIC_FEATURES`, `CATEGORICAL_FEATURES`, `load_data()`, `build_preprocessor()`, `split_data()`, `get_feature_names()`
- `src/train.py` — `define_models()`, `tune()`, `train_all()`, `cross_validate_all()`, `save_artifacts()`
- `src/evaluate.py` — `compute_metrics()`, `plot_*()` functions, writes to `figures/`
- `api/main.py` — FastAPI app with lifespan model loading; endpoints: `/health`, `/stats`, `/metrics`, `/feature-importance`, `/predict`, `/predict/all`
- `dashboard-next/lib/api.ts` — all client-side fetch calls to the API
- `dashboard-next/app/simulator/` — budget slider UI that calls `/predict/all`

### Model Persistence Contract

`models/splits.pkl` stores the exact train/test split used at training time. `src/evaluate.py` reloads it to ensure evaluation metrics are computed on the same test set. Do not delete `splits.pkl` without retraining.

### XGBoost Fallback

`src/train.py` wraps the XGBoost import in a try/except; if `xgboost` is unavailable it silently falls back to `sklearn.ensemble.GradientBoostingRegressor`. The saved model key stays `gradient_boosting` either way.

### Docker Build Notes

`Dockerfile.api` runs `python src/train.py` during the image build so `.pkl` models are baked in. Re-building the image re-trains from scratch. The `dashboard-next/Dockerfile` is a standard multi-stage Node build.

### Frontend Stack

Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts (charts), Radix UI (primitives), Framer Motion (animations). `next.config.js` proxies `/api/*` requests to `http://api:8000` (Docker service name) or `http://localhost:8000` (local dev).
