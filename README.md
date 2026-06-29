# Marketing ROI Optimization

**EFREI Paris — Master 1 Data Engineering — RNCP40875**
**Authors: LE Quang Dat · Adrien CHUEMBOU MBAH**

Predicts sales from multi-channel advertising budgets (TV, Radio, Social Media, Influencer tier) using four regression and four classification models, exposed via a FastAPI backend and a Next.js dashboard. A Streamlit interface provides interactive budget simulation and inverse planning, plus probability analysis.

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
  - [Streamlit Interface](#streamlit-interface)
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
     +-----+-----+
     |           |
     v           v
 src/train.py   src/models.py        Two parallel training pipelines
 (FastAPI stack) (Streamlit stack)
     |           |
     v           v
  models/                     *.pkl  (joblib), cv_results.json,
                               splits.pkl, model_list.json
     |           |
     v           v
 api/main.py   dashboard/app.py
 FastAPI        Streamlit
     |
     v
 dashboard-next/              Next.js 14 App Router
 app/simulator/               Budget slider UI  ->  POST /predict/all
```

The preprocessing module (`src/preprocessing.py`) is shared between both stacks, ensuring identical transformations at training time and inference time.

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
| Random Forest | **0.9958** | 0.9958 ± 0.0018 | ~1.2 | ~2.1 |
| Gradient Boosting | 0.9956 | 0.9956 ± 0.0019 | ~1.5 | ~2.6 |
| MLP | 0.9935 | 0.9935 ± 0.0019 | ~2.8 | ~4.1 |
| Linear Regression | 0.9950 | 0.9950 ± 0.0021 | ~5.3 | ~7.2 |

Random Forest and Gradient Boosting are tuned via `RandomizedSearchCV` (15 iterations, 5-fold CV). The API `/predict` endpoint always uses the best available model; `/predict/all` returns all four simultaneously.

**Out-of-range handling:** when input values exceed training bounds and a tree-based model is selected, the Streamlit interface automatically falls back to Linear Regression, which can extrapolate.

### Classification (Low / Medium / High performance)

| Model | Accuracy | Precision (macro) | Recall (macro) | F1-macro | ROC-AUC |
|-------|----------|-------------------|----------------|----------|---------|
| Random Forest | 0.9970 | 0.9968 | 0.9972 | 0.9970 | 0.9998 |
| Gradient Boosting | 0.9950 | 0.9948 | 0.9952 | 0.9950 | 0.9997 |
| MLP | 0.9880 | 0.9875 | 0.9882 | 0.9878 | 0.9990 |
| Logistic Regression | 0.9610 | 0.9605 | 0.9612 | 0.9607 | 0.9950 |

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
│   ├── train.py                    # FastAPI pipeline: RandomizedSearchCV, saves *.pkl
│   ├── models.py                   # Streamlit pipeline: per-task model training
│   ├── evaluate.py                 # Metrics, plots, permutation importance, SHAP
│   └── utils.py                    # ROI helper, influencer options
│
├── models/                         # Trained artefacts (git-ignored except JSON/CSV)
│   ├── *.pkl                       # Serialised pipelines (joblib)
│   ├── model_list.json             # Ordered model names for the API
│   ├── splits.pkl                  # Exact train/test split (do not delete without retraining)
│   ├── cv_results.json             # Cross-validation R² per model
│   ├── metrics_regression.csv
│   └── metrics_classification.csv
│
├── api/
│   └── main.py                     # FastAPI app: lifespan loader, 6 endpoints
│
├── dashboard/
│   └── app.py                      # Streamlit app (6 tabs + Target Planner)
│
├── dashboard-next/                 # Next.js 14 App Router frontend
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
├── main.py                         # CLI orchestrator (train / evaluate / dashboard)
├── Dockerfile.api                  # Trains models during image build
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

# 2. Train all models (FastAPI stack)
python src/train.py

# 3. Start the API
uvicorn api.main:app --reload --port 8000

# 4a. Open the Next.js dashboard
cd dashboard-next && npm install && npm run dev
# → http://localhost:3000

# 4b. Or open the Streamlit interface
streamlit run dashboard/app.py
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
# Train all models (regression + classification) — FastAPI stack
python src/train.py

# Evaluate and generate figures
python src/evaluate.py

# Evaluate with SHAP summary plots (slow, requires shap)
python src/evaluate.py --shap

# Train Streamlit pipeline models separately
python src/models.py

# CLI orchestrator
python main.py
# → 1: full pipeline  2: train  3: evaluate  4: dashboard  5: exit

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

### Streamlit Interface

```bash
streamlit run dashboard/app.py
```

Six tabs:

| Tab | Description |
|-----|-------------|
| Data Overview | Dataset statistics, distributions, correlations |
| Model Comparison | Side-by-side metric tables and charts |
| Feature Importance | Intrinsic importance + permutation importance |
| Predict | Single-campaign prediction with model selector |
| Budget Simulator | Interactive budget sliders, all-model comparison |
| Target Planner | Inverse optimisation (SLSQP) + probability analysis |

**Target Planner details:**
- *Optimal budget*: given a sales target, `scipy.optimize.minimize` (SLSQP) finds the minimum-cost budget allocation.
- *Probability analysis*: uses the distribution of individual tree predictions in the Random Forest to estimate P(Sales ≥ goal).

### Full Stack with Docker

```bash
# Build and start both services
docker-compose up --build

# Rebuild API image only (re-trains models)
docker-compose build api && docker-compose up

# Stop
docker-compose down
```

The API Dockerfile runs `python src/train.py` during the build step, so trained model artefacts are baked into the image. Rebuilding the image always retrains from scratch.

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service status and list of loaded models |
| GET | `/stats` | Dataset statistics: sales distribution, budget breakdown, ROI by influencer, correlations |
| GET | `/metrics` | Test-set and CV metrics for all models (sorted by R²) |
| GET | `/feature-importance` | Feature importances from the best tree model |
| POST | `/predict` | Single prediction from the best available model |
| POST | `/predict/all` | Predictions from all loaded models simultaneously |

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
  "model_used": "gradient_boosting"
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

### Training bounds (Streamlit OOR detection)

Defined in `dashboard/app.py`:

```python
TRAIN_BOUNDS = {
    "TV":           (0.0, 297.0),
    "Radio":        (0.0, 49.6),
    "Social Media": (0.0, 26.9),
}
```

When inputs exceed these bounds with a tree model selected, the prediction automatically switches to Linear Regression.

### RandomizedSearchCV settings (`src/models.py`)

```python
TUNE_ITER  = 15   # number of random parameter combinations
CV_FOLDS   = 5    # cross-validation folds
```

Increase `TUNE_ITER` for a more exhaustive search at the cost of training time.

### Model artefact contract

`models/splits.pkl` stores the exact train/test split used at training time. `src/evaluate.py` reloads it to ensure metrics are computed on the same test rows. Do not delete `splits.pkl` without rerunning `src/train.py`.

---

## License

Academic project — EFREI Paris 2025-2026. Not licensed for commercial use.
