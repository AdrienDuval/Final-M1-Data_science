# Marketing ROI Optimization

**EFREI Paris — Master 1 Data Engineering — RNCP40875**
**Authors: LE Quang Dat · Adrien CHUEMBOU MBAH**

Predicts sales from multi-channel advertising budgets (TV, Radio, Social Media, Influencer tier) using four regression and four classification models, exposed via a FastAPI backend and a Next.js dashboard with interactive budget simulation, inverse planning, and probability analysis.

---

## Table of Contents

- [Architecture](#architecture)
- [Dataset](#dataset)
- [Models and Results](#models-and-results)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Python ML Pipeline](#python-ml-pipeline)
  - [FastAPI Backend](#fastapi-backend)
  - [Next.js Dashboard](#nextjs-dashboard)
  - [Full Stack with Docker](#full-stack-with-docker)
- [API Reference](#api-reference)
- [Configuration](#configuration)

---

## Architecture

```
data/marketing_labelled.csv  (4 572 campaigns)
           |
           v
  src/preprocessing.py       ColumnTransformer:
                               - numeric  -> median impute + StandardScaler
                               - Influencer -> mode impute + OneHotEncoder (drop-first)
           |
     +-----+------+
     |            |
     v            v
 src/train.py    src/models.py
 (regression)    (classification)
     |            |
     v            v
  models/         {name}.pkl + {name}_classification.pkl (joblib),
                  splits.pkl, cv_results.json, model_list.json, label_encoder.pkl
           |
           v
  src/evaluate.py            metrics_*.csv + figures/  (evaluates the exact
           |                  same artefacts the API serves)
           v
   api/main.py               FastAPI — loads all models at startup
           |
           v
 dashboard-next/             Next.js 14 App Router (the dashboard)
                             fetches /predict, /predict/all, /metrics, ...
```

The preprocessing module (`src/preprocessing.py`) is shared by all three scripts, ensuring identical transformations at training and inference time. `train.py` produces the regression models the API serves; `models.py` produces the classification models; `evaluate.py` evaluates those same artefacts and writes the metrics and figures the dashboard displays.

---

## Dataset

**Source:** [Kaggle — Dummy Advertising and Sales Data](https://www.kaggle.com/datasets/harrimansaragih/dummy-advertising-and-sales-data)

| Variable | Type | Range | Description |
|----------|------|-------|-------------|
| TV | float | 0 – 297 M | TV advertising budget |
| Radio | float | 0 – 49.6 M | Radio advertising budget |
| Social Media | float | 0 – 26.9 M | Social media advertising budget |
| Influencer | string | — | Influencer tier: Mega / Macro / Micro / Nano |
| Sales | float | target | Revenue generated (regression target) |
| perf_class | string | derived | Low / Medium / High — created via Q33/Q66 quantile binning |

`perf_class` is generated on the fly at load time when absent from the CSV. The quantile split produces an approximately balanced three-class distribution.

---

## Models and Results

### Regression (predicting Sales)

| Model | R² (test) | CV R² mean ± std | MAE | RMSE |
|-------|-----------|-----------------|-----|------|
| Random Forest | **0.9971** | **0.9965 ± 0.0028** | 2.82 | 5.05 |
| Gradient Boosting | 0.9969 | 0.9964 ± 0.0028 | 3.05 | 5.22 |
| Linear Regression | 0.9940 | 0.9956 ± 0.0032 | 2.67 | 7.25 |
| MLP | 0.9925 | 0.9941 ± 0.0034 | 3.89 | 8.08 |

Random Forest and Gradient Boosting are tuned via `RandomizedSearchCV` (15 iterations, 5-fold CV). **Random Forest is the selected model** — it has the best cross-validation R² (0.9965) *and* the best test R² (0.9971), with Gradient Boosting a close second. The API `/predict` endpoint always uses the selected model; `/predict/all` returns all four simultaneously.

**Out-of-range inputs:** tree-based models (Random Forest, Gradient Boosting) cannot extrapolate beyond the budget ranges seen in training (see [Dataset](#dataset)) — predictions plateau above those bounds, whereas Linear Regression can extrapolate.

### Classification (Low / Medium / High performance)

| Model | Accuracy | Precision (macro) | Recall (macro) | F1-macro | ROC-AUC |
|-------|----------|-------------------|----------------|----------|---------|
| Random Forest | 0.9705 | 0.9706 | 0.9705 | 0.9705 | 0.9979 |
| Gradient Boosting | 0.9737 | 0.9736 | 0.9737 | 0.9736 | 0.9990 |
| Logistic Regression | 0.9737 | 0.9737 | 0.9736 | 0.9736 | 0.9975 |
| MLP | 0.9661 | 0.9662 | 0.9662 | 0.9660 | 0.9975 |

---

## Project Structure

```
.
├── data/
│   ├── Dummy Data HSS.csv          # Raw source dataset (4 572 rows)
│   ├── marketing_and_sales.csv     # Intermediate
│   └── marketing_labelled.csv      # Pre-labelled (includes perf_class column)
│
├── notebooks/
│   └── 01_eda.ipynb                # Exploratory Data Analysis
│
├── src/
│   ├── preprocessing.py            # Shared: load_data, build_preprocessor,
│   │                               #   build_pipeline, split_data, get_feature_names
│   ├── train.py                    # Regression models for the API: RandomizedSearchCV → {name}.pkl
│   ├── models.py                   # Classification models → {name}_classification.pkl
│   └── evaluate.py                 # Metrics, plots, permutation importance, SHAP
│
├── models/                         # Trained artefacts (git-ignored except JSON/CSV)
│   ├── {name}.pkl                  # Regression pipelines served by the API (joblib)
│   ├── {name}_classification.pkl   # Classification models (+ pipeline_classification.pkl,
│   │                               #   label_encoder.pkl)
│   ├── model_list.json             # Ordered model names for the API
│   ├── splits.pkl                  # Exact train/test split (do not delete without retraining)
│   ├── cv_results.json             # Cross-validation R² per model
│   ├── metrics_regression.csv
│   └── metrics_classification.csv
│
├── api/
│   └── main.py                     # FastAPI app: lifespan loader, inference + stats endpoints
│
├── dashboard-next/                 # Next.js 14 App Router frontend (the dashboard)
│   ├── app/
│   │   ├── page.tsx                # Overview / stats
│   │   ├── models/                 # Model comparison page
│   │   ├── simulator/              # Budget slider + live predictions
│   │   └── insights/               # Feature importance + SHAP
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── api.ts                  # All HTTP calls to FastAPI
│   │   └── utils.ts
│   ├── next.config.js              # Proxies /api/* → FastAPI
│   └── Dockerfile
│
├── figures/                        # Generated plots (evaluate.py output)
│
├── main.py                         # CLI orchestrator (train / evaluate / serve)
├── Dockerfile.api                  # Trains models (train.py + models.py) during image build
├── docker-compose.yml              # API on :8000, dashboard on :3000
├── requirements.txt                # Full Python dependencies
└── requirements.api.txt            # Minimal deps for the Docker API image
```

---

## Prerequisites

**Python pipeline**
- Python 3.10+
- pip dependencies: `pip install -r requirements.txt`

**Next.js dashboard**
- Node.js 18+
- `cd dashboard-next && npm install`

**Docker (optional — full stack)**
- Docker 24+ and Docker Compose v2

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train all models
python src/train.py      # regression models served by the API
python src/models.py     # classification models

# 3. Start the API
uvicorn api.main:app --reload --port 8000

# 4. Open the Next.js dashboard
cd dashboard-next && npm install && npm run dev
# → http://localhost:3000
```

Or with Docker in one command:

```bash
docker-compose up --build
# API  → http://localhost:8000
# Web  → http://localhost:3000
```

---

## Usage

### Python ML Pipeline

```bash
# Train regression models served by the API
python src/train.py

# Train classification models
python src/models.py

# Evaluate and generate figures (uses the same models the API serves)
python src/evaluate.py

# Evaluate with SHAP summary plots (slow, requires shap)
python src/evaluate.py --shap

# CLI orchestrator (runs train.py + models.py, then evaluate / serve)
python main.py
# → 1: full pipeline  2: train  3: evaluate  4: Next.js + FastAPI  5: exit

# EDA notebook
jupyter notebook notebooks/01_eda.ipynb
```

### FastAPI Backend

```bash
# Development server with hot reload
uvicorn api.main:app --reload --port 8000

# Minimal install (API only, no training deps)
pip install -r requirements.api.txt
uvicorn api.main:app --port 8000
```

Models are loaded once at startup via the lifespan handler. The split artefact (`models/splits.pkl`) must match the currently loaded `.pkl` files — always retrain if you delete it.

### Next.js Dashboard

```bash
cd dashboard-next
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

The dashboard proxies all `/api/*` requests to the FastAPI service. In local dev this resolves to `http://localhost:8000`; in Docker it resolves to `http://api:8000` via the compose service name.

Key pages: overview/EDA (`/dashboard`, `/analytics`), model comparison + learning curves (`/models`), feature importance + SHAP (`/feature-importance`, `/insights`), live prediction (`/predict`), budget sensitivity (`/simulator`), and the Target Planner (`/target-planner`):

- *Optimal budget* (`POST /optimize`): given a sales target, `scipy.optimize.minimize` (SLSQP) finds the minimum-cost budget allocation.
- *Probability analysis* (`POST /probability`): uses the spread of individual Random Forest tree predictions to estimate P(Sales ≥ goal).

### Full Stack with Docker

```bash
# Build and start both services
docker-compose up --build

# Rebuild API image only (re-trains models)
docker-compose build api && docker-compose up

# Stop
docker-compose down
```

The API Dockerfile runs `python src/train.py && python src/models.py` during the build step, so both the regression and classification artefacts are baked into the image. Rebuilding the image always retrains from scratch.

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service status and list of loaded models |
| GET | `/stats` | Dataset statistics: sales distribution, budget breakdown, ROI by influencer, correlations |
| GET | `/analytics` | EDA: per-feature stats, histograms, scatter sample, box stats, pairwise correlations |
| GET | `/metrics` | Regression test-set + CV metrics for all models (sorted by R²) |
| GET | `/metrics/classification` | Classification metrics for all models |
| GET | `/metrics/val-test` | Validation (CV) vs test R²/RMSE per model |
| GET | `/feature-importance` | Feature importances from the best tree model |
| GET | `/simulate/tv-sweep` | Predicted sales across a TV-budget sweep (other channels fixed) |
| POST | `/predict` | Single prediction from the selected model (Random Forest) |
| POST | `/predict/all` | Predictions from all loaded models simultaneously |
| POST | `/classify` | Campaign performance class (High / Medium / Low) + confidence |
| POST | `/optimize` | Inverse prediction: target sales → minimum-cost budget (SLSQP) |
| POST | `/probability` | P(Sales ≥ goal) from the Random Forest tree-prediction spread |

Figures from `src/evaluate.py` are served as static files under `/figures/*`.

### POST /predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"TV": 100, "Radio": 25, "Social_Media": 10, "Influencer": "Mega"}'
```

Response:

```json
{
  "predicted_sales": 214.73,
  "roi": 1.6072,
  "total_budget": 135.0,
  "vs_average": 21.53,
  "model_used": "random_forest"
}
```

### POST /predict/all

```bash
curl -X POST http://localhost:8000/predict/all \
  -H "Content-Type: application/json" \
  -d '{"TV": 100, "Radio": 25, "Social_Media": 10, "Influencer": "Mega"}'
```

Valid `Influencer` values: `Mega`, `Macro`, `Micro`, `Nano`.

---

## Configuration

### Training bounds (extrapolation limit)

The training data spans roughly TV 0–297 M, Radio 0–49.6 M, Social Media 0–26.9 M. Tree-based models cannot extrapolate beyond these ranges (their predictions plateau); Linear Regression can. Keep inputs within these bounds for reliable tree-model predictions.

### RandomizedSearchCV settings

Tuning is configured in `src/train.py` (regression, `n_iter=15`, `CV_FOLDS=5`) and `src/models.py` (classification, `TUNE_ITER=15`, `CV_FOLDS=5`). Increase the iteration count for a more exhaustive search at the cost of training time.

### Model artefact contract

`models/splits.pkl` stores the exact train/test split used at training time. `src/evaluate.py` reloads it to ensure metrics are computed on the same test rows. Do not delete `splits.pkl` without rerunning `src/train.py`.

---

## License

Academic project — EFREI Paris 2025-2026. Not licensed for commercial use.
